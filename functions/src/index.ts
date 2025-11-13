import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as express from 'express';
import * as cors from 'cors';
import * as nodemailer from 'nodemailer';
import { SquareClient, SquareEnvironment } from 'square';
import { randomUUID } from 'crypto';

// Initialize Firebase Admin
admin.initializeApp();

// Create Express app
const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

const squareConfig = functions.config().square || {};
const squareEnvironment =
  squareConfig.environment === 'production'
    ? SquareEnvironment.Production
    : SquareEnvironment.Sandbox;

let squareClient: SquareClient | null = null;

const getSquareClient = (): SquareClient => {
  if (!squareConfig.access_token) {
    throw new Error('Square access token is not configured.');
  }

  if (!squareClient) {
    squareClient = new SquareClient({
      environment: squareEnvironment,
      token: squareConfig.access_token,
    });
  }

  return squareClient;
};

const getSquareLocationId = (): string | null => {
  if (squareConfig.location_id) {
    return squareConfig.location_id as string;
  }
  return null;
};

const normalizeSquareAddress = (address?: any) => {
  if (!address) {
    return undefined;
  }

  const streetValue =
    address.addressLine1 || address.street || address.address1 || null;

  if (!streetValue) {
    return undefined;
  }

  const normalized: any = {
    addressLine1: String(streetValue).slice(0, 500),
  };

  if (address.addressLine2) {
    normalized.addressLine2 = String(address.addressLine2).slice(0, 500);
  } else if (address.address2) {
    normalized.addressLine2 = String(address.address2).slice(0, 500);
  }

  if (address.city || address.locality) {
    normalized.locality = String(
      address.city || address.locality
    ).slice(0, 200);
  }

  if (address.state || address.administrativeDistrictLevel1) {
    normalized.administrativeDistrictLevel1 = String(
      address.state || address.administrativeDistrictLevel1
    )
      .slice(0, 2)
      .toUpperCase();
  }

  if (address.zip || address.postalCode) {
    normalized.postalCode = String(address.zip || address.postalCode).slice(
      0,
      20
    );
  }

  normalized.country = String(address.country || 'US')
    .slice(0, 2)
    .toUpperCase();

  return normalized;
};

// ===== LIL MAGNET MEMORIES API =====

// Health check endpoint
app.get('/', (req, res) => {
  res.json({
    status: 'Lil Magnet Memories API is running',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// Send order email endpoint
app.post('/send-order-email', async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      specialInstructions,
      photos,
      quantities,
      orderNumber,
      totalMagnets,
    } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !email || !orderNumber) {
      return res.status(400).json({
        error:
          'Missing required fields: firstName, lastName, email, orderNumber',
      });
    }

    console.log('📧 Lil Magnet Memories order email request:', {
      orderNumber,
      customerName: `${firstName} ${lastName}`,
      email,
      totalMagnets,
    });

    // Send the order email
    const result = await sendLilMagnetOrderEmail({
      firstName,
      lastName,
      email,
      phone: phone || '',
      specialInstructions: specialInstructions || '',
      photos: photos || [],
      quantities: quantities || [],
      orderNumber,
      totalMagnets: totalMagnets || 0,
    });

    return res.json({ success: true, messageId: result });
  } catch (error) {
    console.error('Send Lil Magnet order email error:', error);

    // Provide more specific error messages
    if (error.code === 'EAUTH') {
      return res.status(500).json({
        error:
          'Gmail authentication failed. Please check the app password configuration.',
        details:
          'Invalid login credentials. The Gmail app password may be expired or incorrect.',
      });
    }

    return res.status(500).json({
      error: 'Failed to send order email',
      details: error.message || 'Unknown error occurred',
    });
  }
});

// Send order status update email endpoint
app.post('/send-status-update-email', async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      orderNumber,
      status,
      photos,
      quantities,
      totalMagnets,
    } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !email || !orderNumber || !status) {
      return res.status(400).json({
        error:
          'Missing required fields: firstName, lastName, email, orderNumber, status',
      });
    }

    console.log('📧 Lil Magnet Memories status update email request:', {
      orderNumber,
      customerName: `${firstName} ${lastName}`,
      email,
      status,
    });

    // Send the status update email
    const result = await sendLilMagnetStatusUpdateEmail({
      firstName,
      lastName,
      email,
      orderNumber,
      status,
      photos: photos || [],
      quantities: quantities || [],
      totalMagnets: totalMagnets || 0,
    });

    return res.json({ success: true, messageId: result });
  } catch (error) {
    console.error('Send Lil Magnet status update email error:', error);

    // Provide more specific error messages
    if (error.code === 'EAUTH') {
      return res.status(500).json({
        error:
          'Gmail authentication failed. Please check the app password configuration.',
        details:
          'Invalid login credentials. The Gmail app password may be expired or incorrect.',
      });
    }

    return res.status(500).json({
      error: 'Failed to send status update email',
      details: error.message || 'Unknown error occurred',
    });
  }
});

// Square payment endpoint
app.post('/payments/create', async (req, res) => {
  try {
    const locationId = getSquareLocationId() || req.body.locationId;
    if (!locationId) {
      return res.status(500).json({
        error: 'Square location ID is not configured',
      });
    }

    const {
      sourceId,
      amount,
      currency = 'USD',
      orderNumber,
      buyerEmail,
      customerName,
      billingAddress,
      shippingAddress,
      verificationToken,
      note,
    } = req.body;

    if (!sourceId) {
      return res
        .status(400)
        .json({ error: 'Missing payment source (sourceId).' });
    }

    if (amount === undefined || amount === null) {
      return res.status(400).json({ error: 'Missing payment amount.' });
    }

    const amountNumber = Number(amount);
    if (Number.isNaN(amountNumber) || amountNumber <= 0) {
      return res
        .status(400)
        .json({ error: 'Amount must be a positive number.' });
    }

    const client = getSquareClient();

    const idempotencyKey = req.body.idempotencyKey || randomUUID();
    const amountMoney = {
      amount: Math.round(amountNumber * 100),
      currency: String(currency || 'USD').toUpperCase(),
    };

    const requestBody: any = {
      sourceId,
      idempotencyKey,
      amountMoney,
      locationId,
      autocomplete: true,
    };

    if (orderNumber) {
      requestBody.referenceId = orderNumber;
      requestBody.note = note || `Lil Magnet Memories order ${orderNumber}`;
    } else if (note) {
      requestBody.note = note;
    }

    if (buyerEmail) {
      requestBody.buyerEmailAddress = buyerEmail;
    }

    if (customerName) {
      requestBody.statementDescriptionIdentifier = customerName
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 20);
    }

    if (verificationToken) {
      requestBody.verificationToken = verificationToken;
    }

    const normalizedBilling = normalizeSquareAddress(billingAddress);
    if (normalizedBilling) {
      requestBody.billingAddress = normalizedBilling;
    }

    const normalizedShipping = normalizeSquareAddress(shippingAddress);
    if (normalizedShipping) {
      requestBody.shippingAddress = normalizedShipping;
    }

    const response = await client.payments.create(requestBody);

    console.log('✅ Square payment created:', {
      id: response.payment?.id,
      status: response.payment?.status,
      orderNumber,
    });

    return res.json({ success: true, payment: response.payment });
  } catch (error: any) {
    console.error('❌ Square payment error:', error);
    const statusCode = error?.statusCode || 500;
    const message =
      error?.message ||
      error?.errors?.[0]?.detail ||
      'Failed to process Square payment.';
    return res.status(statusCode).json({
      error: message,
      details: error?.errors || error,
    });
  }
});

// ===== HELPER FUNCTIONS =====

// Helper function to send Lil Magnet Memories order emails
async function sendLilMagnetOrderEmail(params: {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  specialInstructions: string;
  photos: any[];
  quantities: number[];
  orderNumber: string;
  totalMagnets: number;
}): Promise<string> {
  const {
    firstName,
    lastName,
    email,
    phone,
    specialInstructions,
    photos,
    quantities,
    orderNumber,
    totalMagnets,
  } = params;

  // Get email configuration from Firebase Functions config
  const emailConfig = functions.config().email;
  if (!emailConfig?.user || !emailConfig?.password) {
    throw new Error(
      'Email configuration not found in Firebase Functions config'
    );
  }

  console.log('📧 Using email config:', {
    service: emailConfig.service || 'gmail',
    user: emailConfig.user,
  });

  // Create nodemailer transporter
  const transporter = nodemailer.createTransport({
    service: emailConfig.service || 'gmail',
    auth: {
      user: emailConfig.user,
      pass: emailConfig.password,
    },
  });

  // Format photo details
  const photoDetails = photos
    .map(
      (photo, index) =>
        `${photo.name} (${quantities[index]} magnet${
          quantities[index] > 1 ? 's' : ''
        })`
    )
    .join('\n');

  const subject = `lil-order ${orderNumber}`;

  // Create HTML email content
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #1976d2; margin: 0;">🎯 Lil Magnet Memories</h1>
        <h2 style="color: #333; margin: 10px 0;">New Order Received!</h2>
      </div>

      <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <h3 style="color: #1976d2; margin-top: 0;">Order Information</h3>
        <p><strong>Order Number:</strong> ${orderNumber}</p>
        <p><strong>Customer Name:</strong> ${firstName} ${lastName}</p>
        <p><strong>Customer Email:</strong> ${email}</p>
        <p><strong>Customer Phone:</strong> ${phone || 'Not provided'}</p>
        <p><strong>Total Magnets:</strong> ${totalMagnets}</p>
        <p><strong>Photos Submitted:</strong> ${photos.length}</p>
        <p><strong>Special Instructions:</strong> ${
          specialInstructions || 'None'
        }</p>
        <p><strong>Submission Date:</strong> ${new Date().toLocaleString()}</p>
      </div>

      ${
        photos.length > 0
          ? `
        <div style="margin-bottom: 20px;">
          <h3 style="color: #1976d2;">📸 Photo Details</h3>
          <ul style="list-style: none; padding: 0;">
            ${photos
              .map(
                (photo, index) => `
              <li style="background-color: #fff; padding: 10px; margin: 5px 0; border-radius: 4px; border-left: 4px solid #1976d2;">
                <strong>${photo.name}</strong><br>
                <span style="color: #666;">Quantity: ${
                  quantities[index]
                } magnet${quantities[index] > 1 ? 's' : ''}</span>
              </li>
            `
              )
              .join('')}
          </ul>
        </div>
      `
          : ''
      }

      <div style="background-color: #e3f2fd; padding: 15px; border-radius: 8px; border-left: 4px solid #1976d2;">
        <h4 style="margin-top: 0; color: #1976d2;">Next Steps</h4>
        <p style="margin: 0;">Please review the order details and contact the customer to confirm pricing and delivery details.</p>
      </div>

      <div style="text-align: center; margin-top: 30px; color: #666; font-size: 14px;">
        <p>Best regards,<br>Lil Magnet Memories System</p>
        <p style="font-size: 12px;">This email was automatically generated from your website order form.</p>
      </div>
    </div>
  `;

  // Create plain text version
  const textContent = `
LIL MAGNET MEMORIES - New Order Received!

Order Number: ${orderNumber}
Customer Name: ${firstName} ${lastName}
Customer Email: ${email}
Customer Phone: ${phone || 'Not provided'}
Total Magnets: ${totalMagnets}
Photos Submitted: ${photos.length}
Special Instructions: ${specialInstructions || 'None'}
Submission Date: ${new Date().toLocaleString()}

${photos.length > 0 ? `Photo Details:\n${photoDetails}\n` : ''}

Next Steps: Please review the order details and contact the customer to confirm pricing and delivery details.

Best regards,
Lil Magnet Memories System

This email was automatically generated from your website order form.
  `;

  // Send the email
  const info = await transporter.sendMail({
    from: `"Lil Magnet Memories" <${emailConfig.user}>`,
    to: 'lilmagnetmemories@gmail.com',
    subject: subject,
    text: textContent,
    html: htmlContent,
  });

  console.log('✅ Lil Magnet order email sent successfully:', info.messageId);
  return info.messageId;
}

// Helper function to format status display
function formatStatusDisplay(status: string): string {
  switch (status) {
    case 'new':
      return 'NEW ORDER SUBMITTED';
    case 'in_progress':
      return 'IN PROGRESS';
    case 'completed':
      return 'COMPLETED';
    case 'cancelled':
      return 'CANCELLED';
    default:
      return status.toUpperCase();
  }
}

// Helper function to send Lil Magnet Memories status update emails
async function sendLilMagnetStatusUpdateEmail(params: {
  firstName: string;
  lastName: string;
  email: string;
  orderNumber: string;
  status: string;
  photos: any[];
  quantities: number[];
  totalMagnets: number;
}): Promise<string> {
  const {
    firstName,
    lastName,
    email,
    orderNumber,
    status,
    photos,
    quantities,
    totalMagnets,
  } = params;

  // Get email configuration from Firebase Functions config
  const emailConfig = functions.config().email;
  if (!emailConfig?.user || !emailConfig?.password) {
    throw new Error(
      'Email configuration not found in Firebase Functions config'
    );
  }

  console.log('📧 Using email config:', {
    service: emailConfig.service || 'gmail',
    user: emailConfig.user,
  });

  // Create nodemailer transporter
  const transporter = nodemailer.createTransport({
    service: emailConfig.service || 'gmail',
    auth: {
      user: emailConfig.user,
      pass: emailConfig.password,
    },
  });

  // Format photo details
  const photoDetails = photos
    .map(
      (photo, index) =>
        `${photo.name} (${quantities[index]} magnet${
          quantities[index] > 1 ? 's' : ''
        })`
    )
    .join('\n');

  // Status-specific messaging
  let statusMessage = '';
  let statusEmoji = '';
  let excitementLevel = '';

  switch (status) {
    case 'new':
      statusMessage = 'Your order has been received and is ready to start! 🎉';
      statusEmoji = '✨';
      excitementLevel = 'Exciting news';
      break;
    case 'in_progress':
      statusMessage = 'Your magnets are being created right now! 🎨';
      statusEmoji = '🛠️';
      excitementLevel = 'Great progress';
      break;
    case 'completed':
      statusMessage = 'Your custom magnets are ready for pickup! 🎊';
      statusEmoji = '🎯';
      excitementLevel = 'Amazing news';
      break;
    case 'cancelled':
      statusMessage = 'Your order has been cancelled';
      statusEmoji = '❌';
      excitementLevel = 'Order update';
      break;
    default:
      statusMessage = `Your order status has been updated to: ${status}`;
      statusEmoji = '📋';
      excitementLevel = 'Order update';
  }

  const subject = `${statusEmoji} ${excitementLevel} - Order ${orderNumber} Status Update!`;

  // Create HTML email content
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #1976d2; margin: 0;">🎯 Lil Magnet Memories</h1>
        <h2 style="color: #333; margin: 10px 0;">${statusEmoji} ${excitementLevel}!</h2>
        <div style="background-color: #e8f5e8; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #2e7d32; margin: 0;">${statusMessage}</h3>
        </div>
      </div>

      <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <h3 style="color: #1976d2; margin-top: 0;">Order Information</h3>
        <p><strong>Order Number:</strong> ${orderNumber}</p>
        <p><strong>Customer Name:</strong> ${firstName} ${lastName}</p>
        <p><strong>Total Magnets:</strong> ${totalMagnets}</p>
        <p><strong>Current Status:</strong> <span style="color: #1976d2; font-weight: bold;">${formatStatusDisplay(
          status
        )}</span></p>
        <p><strong>Photos Submitted:</strong> ${photos.length}</p>
      </div>

      ${
        photos.length > 0
          ? `
        <div style="margin-bottom: 20px;">
          <h3 style="color: #1976d2;">📸 Your Custom Magnets</h3>
          <ul style="list-style: none; padding: 0;">
            ${photos
              .map(
                (photo, index) => `
              <li style="background-color: #fff; padding: 15px; margin: 10px 0; border-radius: 8px; border-left: 4px solid #1976d2; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <strong>${photo.name}</strong><br>
                <span style="color: #666; font-size: 14px;">Quantity: ${
                  quantities[index]
                } magnet${quantities[index] > 1 ? 's' : ''}</span>
              </li>
            `
              )
              .join('')}
          </ul>
        </div>
      `
          : ''
      }

      <div style="background-color: #e3f2fd; padding: 15px; border-radius: 8px; border-left: 4px solid #1976d2;">
        <h4 style="margin-top: 0; color: #1976d2;">What's Next?</h4>
        <p style="margin: 0;">${
          status === 'new'
            ? "We're excited to start working on your custom magnets! You'll receive updates as we progress."
            : status === 'in_progress'
            ? "We're carefully crafting your magnets right now! You'll be notified when they're ready."
            : status === 'completed'
            ? 'Your magnets are ready! Please contact us to arrange pickup or delivery.'
            : 'Thank you for your business!'
        }</p>
      </div>

      <div style="text-align: center; margin-top: 30px; color: #666; font-size: 14px;">
        <p>Thank you for choosing Lil Magnet Memories! 🎯</p>
        <p style="font-size: 12px;">This email was automatically generated from your order status update.</p>
      </div>
    </div>
  `;

  // Create plain text version
  const textContent = `
🎯 LIL MAGNET MEMORIES - ${excitementLevel.toUpperCase()}!

${statusMessage}

Order Number: ${orderNumber}
Customer Name: ${firstName} ${lastName}
Total Magnets: ${totalMagnets}
Current Status: ${formatStatusDisplay(status)}
Photos Submitted: ${photos.length}

${photos.length > 0 ? `Your Custom Magnets:\n${photoDetails}\n` : ''}

What's Next: ${
    status === 'new'
      ? "We're excited to start working on your custom magnets! You'll receive updates as we progress."
      : status === 'in_progress'
      ? "We're carefully crafting your magnets right now! You'll be notified when they're ready."
      : status === 'completed'
      ? 'Your magnets are ready! Please contact us to arrange pickup or delivery.'
      : 'Thank you for your business!'
  }

Thank you for choosing Lil Magnet Memories! 🎯

This email was automatically generated from your order status update.
  `;

  // Send the email
  const info = await transporter.sendMail({
    from: `"Lil Magnet Memories" <${emailConfig.user}>`,
    to: email, // Send to customer, not admin
    subject: subject,
    text: textContent,
    html: htmlContent,
  });

  console.log(
    '✅ Lil Magnet status update email sent successfully:',
    info.messageId
  );
  return info.messageId;
}

// Export the Express app as a Firebase Function
export const api = functions.https.onRequest(app);
