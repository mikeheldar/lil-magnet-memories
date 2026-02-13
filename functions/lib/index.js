"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.api = void 0;
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const express = require("express");
const cors = require("cors");
const nodemailer = require("nodemailer");
const square_1 = require("square");
const crypto_1 = require("crypto");
// Initialize Firebase Admin
admin.initializeApp();
// Create Express app
const app = express();
app.use(cors({ origin: true }));
app.use(express.json());
const squareConfig = functions.config().square || {};
const squareEnvironment = squareConfig.environment === 'production'
    ? square_1.SquareEnvironment.Production
    : square_1.SquareEnvironment.Sandbox;
let squareClient = null;
const getSquareClient = () => {
    if (!squareConfig.access_token) {
        throw new Error('Square access token is not configured.');
    }
    if (!squareClient) {
        squareClient = new square_1.SquareClient({
            environment: squareEnvironment,
            token: squareConfig.access_token,
        });
    }
    return squareClient;
};
const getSquareLocationId = () => {
    if (squareConfig.location_id) {
        return squareConfig.location_id;
    }
    return null;
};
const normalizeSquareAddress = (address) => {
    if (!address) {
        return undefined;
    }
    const streetValue = address.addressLine1 || address.street || address.address1 || null;
    if (!streetValue) {
        return undefined;
    }
    const normalized = {
        addressLine1: String(streetValue).slice(0, 500),
    };
    if (address.addressLine2) {
        normalized.addressLine2 = String(address.addressLine2).slice(0, 500);
    }
    else if (address.address2) {
        normalized.addressLine2 = String(address.address2).slice(0, 500);
    }
    if (address.city || address.locality) {
        normalized.locality = String(address.city || address.locality).slice(0, 200);
    }
    if (address.state || address.administrativeDistrictLevel1) {
        normalized.administrativeDistrictLevel1 = String(address.state || address.administrativeDistrictLevel1)
            .slice(0, 2)
            .toUpperCase();
    }
    if (address.zip || address.postalCode) {
        normalized.postalCode = String(address.zip || address.postalCode).slice(0, 20);
    }
    normalized.country = String(address.country || 'US')
        .slice(0, 2)
        .toUpperCase();
    return normalized;
};
// Helper function to serialize payment object, converting BigInt to string
const serializePayment = (payment) => {
    if (!payment) {
        return null;
    }
    // Recursively convert BigInt values to strings
    const convertBigInt = (obj) => {
        if (obj === null || obj === undefined) {
            return obj;
        }
        if (typeof obj === 'bigint') {
            return obj.toString();
        }
        if (Array.isArray(obj)) {
            return obj.map(convertBigInt);
        }
        if (typeof obj === 'object') {
            const converted = {};
            for (const key in obj) {
                converted[key] = convertBigInt(obj[key]);
            }
            return converted;
        }
        return obj;
    };
    return convertBigInt(payment);
};
// ===== LIL MAGNET MEMORIES API =====
// Health check endpoint
app.get('/', (req, res) => {
    res.json({
        status: 'Lil Magnet Memories API is running',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        endpoints: {
            health: '/',
            sendOrderEmail: '/send-order-email',
            sendStatusUpdateEmail: '/send-status-update-email',
            sendContactEmail: '/send-contact-email',
            createPayment: '/payments/create',
        },
    });
});
// Health check for payments endpoint
app.get('/payments/health', (req, res) => {
    res.json({
        status: 'Payments endpoint is accessible',
        timestamp: new Date().toISOString(),
    });
});
// Helper endpoint to list Square locations (for debugging)
app.get('/payments/locations', async (req, res) => {
    var _a, _b;
    try {
        console.log('🔵 [PAYMENTS/LOCATIONS] Listing Square locations...');
        const client = getSquareClient();
        const response = await client.locations.list();
        console.log('✅ [PAYMENTS/LOCATIONS] Locations retrieved:', {
            count: ((_a = response.locations) === null || _a === void 0 ? void 0 : _a.length) || 0,
        });
        return res.json({
            success: true,
            locations: ((_b = response.locations) === null || _b === void 0 ? void 0 : _b.map((loc) => ({
                id: loc.id,
                name: loc.name,
                address: loc.address,
                status: loc.status,
                capabilities: loc.capabilities,
            }))) || [],
        });
    }
    catch (error) {
        console.error('❌ [PAYMENTS/LOCATIONS] Error listing locations:', error);
        return res.status(500).json({
            error: 'Failed to list locations',
            details: (error === null || error === void 0 ? void 0 : error.message) || 'Unknown error',
        });
    }
});
// Send order email endpoint
app.post('/send-order-email', async (req, res) => {
    try {
        const { firstName, lastName, email, phone, specialInstructions, photos, quantities, orderNumber, totalMagnets, subtotal, shipping, tax, totalAmount, shippingOption, paymentOption, cartItems, } = req.body;
        // Validate required fields
        if (!firstName || !lastName || !email || !orderNumber) {
            return res.status(400).json({
                error: 'Missing required fields: firstName, lastName, email, orderNumber',
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
            subtotal: subtotal || 0,
            shipping: shipping || 0,
            tax: tax || 0,
            totalAmount: totalAmount || 0,
            shippingOption: shippingOption || null,
            paymentOption: paymentOption || null,
            cartItems: cartItems || [],
        });
        return res.json({ success: true, messageId: result });
    }
    catch (error) {
        console.error('Send Lil Magnet order email error:', error);
        // Provide more specific error messages
        if (error.code === 'EAUTH') {
            return res.status(500).json({
                error: 'Gmail authentication failed. Please check the app password configuration.',
                details: 'Invalid login credentials. The Gmail app password may be expired or incorrect.',
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
        const { firstName, lastName, email, orderNumber, status, photos, quantities, totalMagnets, shippingOption, } = req.body;
        // Validate required fields
        if (!firstName || !lastName || !email || !orderNumber || !status) {
            return res.status(400).json({
                error: 'Missing required fields: firstName, lastName, email, orderNumber, status',
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
            shippingOption: shippingOption || null,
        });
        return res.json({ success: true, messageId: result });
    }
    catch (error) {
        console.error('Send Lil Magnet status update email error:', error);
        // Provide more specific error messages
        if (error.code === 'EAUTH') {
            return res.status(500).json({
                error: 'Gmail authentication failed. Please check the app password configuration.',
                details: 'Invalid login credentials. The Gmail app password may be expired or incorrect.',
            });
        }
        return res.status(500).json({
            error: 'Failed to send status update email',
            details: error.message || 'Unknown error occurred',
        });
    }
});
// Send contact form email endpoint
app.post('/send-contact-email', async (req, res) => {
    try {
        const { name, email, subject, message } = req.body;
        // Validate required fields
        if (!name || !email || !subject || !message) {
            return res.status(400).json({
                error: 'Missing required fields: name, email, subject, message',
            });
        }
        console.log('📧 Lil Magnet Memories contact form email request:', {
            name,
            email,
            subject,
        });
        // Send the contact email
        const result = await sendLilMagnetContactEmail({
            name,
            email,
            subject,
            message,
        });
        return res.json({ success: true, messageId: result });
    }
    catch (error) {
        console.error('Send Lil Magnet contact email error:', error);
        // Provide more specific error messages
        if (error.code === 'EAUTH') {
            return res.status(500).json({
                error: 'Gmail authentication failed. Please check the app password configuration.',
                details: 'Invalid login credentials. The Gmail app password may be expired or incorrect.',
            });
        }
        return res.status(500).json({
            error: 'Failed to send contact email',
            details: error.message || 'Unknown error occurred',
        });
    }
});
// Square payment endpoint
app.post('/payments/create', async (req, res) => {
    var _a, _b, _c, _d;
    console.log('🔵 [PAYMENTS/CREATE] Request received:', {
        method: req.method,
        path: req.path,
        headers: {
            'content-type': req.headers['content-type'],
            'user-agent': req.headers['user-agent'],
        },
        bodyKeys: Object.keys(req.body || {}),
        timestamp: new Date().toISOString(),
    });
    try {
        console.log('🔵 [PAYMENTS/CREATE] Checking Square configuration...');
        const locationId = getSquareLocationId() || req.body.locationId;
        console.log('🔵 [PAYMENTS/CREATE] Location ID:', locationId ? '✅ Found' : '❌ Missing');
        if (!locationId) {
            console.error('❌ [PAYMENTS/CREATE] Square location ID is not configured');
            return res.status(500).json({
                error: 'Square location ID is not configured',
            });
        }
        const { sourceId, amount, currency = 'USD', orderNumber, buyerEmail, customerName, billingAddress, shippingAddress, verificationToken, note, } = req.body;
        console.log('🔵 [PAYMENTS/CREATE] Request data:', {
            sourceId: sourceId ? `${sourceId.substring(0, 10)}...` : 'missing',
            amount,
            currency,
            orderNumber,
            buyerEmail,
            customerName,
            hasBillingAddress: !!billingAddress,
            hasShippingAddress: !!shippingAddress,
        });
        if (!sourceId) {
            console.error('❌ [PAYMENTS/CREATE] Missing payment source (sourceId)');
            return res
                .status(400)
                .json({ error: 'Missing payment source (sourceId).' });
        }
        if (amount === undefined || amount === null) {
            console.error('❌ [PAYMENTS/CREATE] Missing payment amount');
            return res.status(400).json({ error: 'Missing payment amount.' });
        }
        const amountNumber = Number(amount);
        if (Number.isNaN(amountNumber) || amountNumber <= 0) {
            console.error('❌ [PAYMENTS/CREATE] Invalid amount:', amountNumber);
            return res
                .status(400)
                .json({ error: 'Amount must be a positive number.' });
        }
        console.log('🔵 [PAYMENTS/CREATE] Initializing Square client...');
        const client = getSquareClient();
        console.log('✅ [PAYMENTS/CREATE] Square client initialized');
        const idempotencyKey = req.body.idempotencyKey || (0, crypto_1.randomUUID)();
        const amountMoney = {
            amount: BigInt(Math.round(amountNumber * 100)),
            currency: String(currency || 'USD').toUpperCase(),
        };
        console.log('🔵 [PAYMENTS/CREATE] Preparing payment request:', {
            idempotencyKey,
            amountMoney,
            locationId,
        });
        const requestBody = {
            sourceId,
            idempotencyKey,
            amountMoney,
            locationId,
            autocomplete: true,
        };
        if (orderNumber) {
            requestBody.referenceId = orderNumber;
            requestBody.note = note || `Lil Magnet Memories order ${orderNumber}`;
        }
        else if (note) {
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
        console.log('🔵 [PAYMENTS/CREATE] Calling Square API...', {
            requestBodyKeys: Object.keys(requestBody),
            amountCents: requestBody.amountMoney.amount,
        });
        const response = await client.payments.create(requestBody);
        console.log('✅ [PAYMENTS/CREATE] Square payment created:', {
            id: (_a = response.payment) === null || _a === void 0 ? void 0 : _a.id,
            status: (_b = response.payment) === null || _b === void 0 ? void 0 : _b.status,
            orderNumber,
            errors: response.errors,
        });
        if (response.errors && response.errors.length > 0) {
            console.error('⚠️ [PAYMENTS/CREATE] Square returned errors:', response.errors);
            return res.status(400).json({
                error: 'Square payment failed',
                details: response.errors,
                payment: response.payment ? serializePayment(response.payment) : null,
            });
        }
        // Serialize payment to convert BigInt values to strings for JSON
        const serializedPayment = response.payment
            ? serializePayment(response.payment)
            : null;
        return res.json({ success: true, payment: serializedPayment });
    }
    catch (error) {
        console.error('❌ [PAYMENTS/CREATE] Square payment error:', {
            message: error === null || error === void 0 ? void 0 : error.message,
            statusCode: error === null || error === void 0 ? void 0 : error.statusCode,
            errors: error === null || error === void 0 ? void 0 : error.errors,
            stack: error === null || error === void 0 ? void 0 : error.stack,
        });
        const statusCode = (error === null || error === void 0 ? void 0 : error.statusCode) || 500;
        const message = (error === null || error === void 0 ? void 0 : error.message) ||
            ((_d = (_c = error === null || error === void 0 ? void 0 : error.errors) === null || _c === void 0 ? void 0 : _c[0]) === null || _d === void 0 ? void 0 : _d.detail) ||
            'Failed to process Square payment.';
        return res.status(statusCode).json({
            error: message,
            details: (error === null || error === void 0 ? void 0 : error.errors) || error,
        });
    }
});
// ===== HELPER FUNCTIONS =====
// Helper function to send Lil Magnet Memories order emails
async function sendLilMagnetOrderEmail(params) {
    const { firstName, lastName, email, phone, specialInstructions, photos, quantities, orderNumber, totalMagnets, subtotal = 0, shipping = 0, tax = 0, totalAmount = 0, shippingOption = null, paymentOption = null, cartItems = [], } = params;
    // Get email configuration from Firebase Functions config
    const emailConfig = functions.config().email;
    if (!(emailConfig === null || emailConfig === void 0 ? void 0 : emailConfig.user) || !(emailConfig === null || emailConfig === void 0 ? void 0 : emailConfig.password)) {
        throw new Error('Email configuration not found in Firebase Functions config');
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
    // Helper functions for formatting
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }).format(amount);
    };
    const formatAddress = (address) => {
        if (!address)
            return 'N/A';
        const parts = [];
        if (address.street)
            parts.push(address.street);
        if (address.city)
            parts.push(address.city);
        if (address.state)
            parts.push(address.state);
        if (address.zip)
            parts.push(address.zip);
        return parts.length > 0 ? parts.join(', ') : 'N/A';
    };
    const getPaymentMethodLabel = (paymentOption) => {
        if (!paymentOption)
            return 'Not specified';
        const type = paymentOption.type;
        switch (type) {
            case 'square_card':
                return 'Credit/Debit Card';
            case 'apple_pay':
                return 'Apple Pay';
            case 'google_pay':
                return 'Google Pay';
            case 'paypal':
                return 'PayPal';
            case 'pay_at_event':
                return 'Pay at Event';
            default:
                return type ? type.replace(/_/g, ' ') : 'Payment';
        }
    };
    const getDeliveryOptionLabel = (shippingOption) => {
        var _a;
        if (!shippingOption)
            return 'Not specified';
        if (shippingOption.type === 'pickup') {
            return 'Pickup at Market Event';
        }
        return shippingOption.label || ((_a = shippingOption.value) === null || _a === void 0 ? void 0 : _a.replace(/_/g, ' ')) || 'Shipping';
    };
    const isPayAtEvent = (paymentOption === null || paymentOption === void 0 ? void 0 : paymentOption.type) === 'pay_at_event';
    const finalTotalAmount = totalAmount > 0 ? totalAmount : subtotal + shipping + tax;
    // Format photo details
    const photoDetails = photos
        .map((photo, index) => `${photo.name} (${quantities[index]} magnet${quantities[index] > 1 ? 's' : ''})`)
        .join('\n');
    // Format cart items
    const cartItemsDetails = cartItems
        .map((item) => {
        const quantity = item.quantity || 1;
        const productName = item.productName || item.name || 'Product';
        return `${productName} (${quantity} magnet${quantity > 1 ? 's' : ''})`;
    })
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
        <h3 style="color: #1976d2; margin-top: 0;">Order Details</h3>
        <p><strong>Order Number:</strong> ${orderNumber}</p>
        <p><strong>Customer Name:</strong> ${firstName} ${lastName}</p>
        <p><strong>Customer Email:</strong> ${email}</p>
        <p><strong>Customer Phone:</strong> ${phone || 'Not provided'}</p>
        <p><strong>Total Magnets:</strong> ${totalMagnets}</p>
        ${specialInstructions ? `<p><strong>Special Instructions:</strong> ${specialInstructions}</p>` : ''}
        <p><strong>Order Date:</strong> ${new Date().toLocaleString()}</p>
      </div>

      ${cartItems.length > 0
        ? `
        <div style="background-color: #fff; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #1976d2;">
          <h3 style="color: #1976d2; margin-top: 0;">Order Items</h3>
          <ul style="list-style: none; padding: 0;">
            ${cartItems
            .map((item) => `
              <li style="padding: 10px; margin: 5px 0; border-bottom: 1px solid #eee;">
                <strong>${item.productName || item.name || 'Product'}</strong><br>
                <span style="color: #666;">Quantity: ${item.quantity || 1} magnet${(item.quantity || 1) > 1 ? 's' : ''}</span>
              </li>
            `)
            .join('')}
          </ul>
        </div>
      `
        : photos.length > 0
            ? `
        <div style="background-color: #fff; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #1976d2;">
          <h3 style="color: #1976d2; margin-top: 0;">📸 Your Custom Magnets</h3>
          <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 15px;">
            ${photos
                .map((photo, index) => `
              <div style="background-color: #f8f9fa; padding: 15px; border-radius: 8px; text-align: center;">
                ${photo.url ? `
                  <img src="${photo.url}" alt="${photo.name}" style="max-width: 100%; height: auto; border-radius: 4px; margin-bottom: 10px; max-height: 200px; object-fit: cover;" />
                ` : ''}
                <div style="margin-top: 10px;">
                  <strong style="font-size: 14px; color: #333;">${photo.name}</strong><br>
                  <span style="color: #666; font-size: 13px;">Quantity: ${quantities[index]} magnet${quantities[index] > 1 ? 's' : ''}</span>
                </div>
              </div>
            `)
                .join('')}
          </div>
        </div>
      `
            : ''}

      <div style="background-color: #fff; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #1976d2;">
        <h3 style="color: #1976d2; margin-top: 0;">Receipt Summary</h3>
        <div style="display: flex; justify-content: space-between; margin: 10px 0;">
          <span>Subtotal:</span>
          <strong>${formatCurrency(subtotal)}</strong>
        </div>
        ${shipping > 0 ? `
        <div style="display: flex; justify-content: space-between; margin: 10px 0;">
          <span>Shipping:</span>
          <strong>${formatCurrency(shipping)}</strong>
        </div>
        ` : ''}
        ${tax > 0 ? `
        <div style="display: flex; justify-content: space-between; margin: 10px 0;">
          <span>Tax:</span>
          <strong>${formatCurrency(tax)}</strong>
        </div>
        ` : ''}
        <div style="display: flex; justify-content: space-between; margin: 15px 0; padding-top: 15px; border-top: 2px solid #1976d2; font-size: 18px;">
          <span><strong>${isPayAtEvent ? 'Total to pay at tent' : 'Total Paid'}:</strong></span>
          <strong style="color: #1976d2;">${formatCurrency(finalTotalAmount)}</strong>
        </div>
      </div>

      <div style="background-color: #fff; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #1976d2;">
        <h3 style="color: #1976d2; margin-top: 0;">Delivery & Payment</h3>
        <div style="margin: 10px 0;">
          <strong>Delivery Option:</strong> ${getDeliveryOptionLabel(shippingOption)}
        </div>
        ${(shippingOption === null || shippingOption === void 0 ? void 0 : shippingOption.address) ? `
        <div style="margin: 10px 0; padding-left: 20px; color: #666;">
          <strong>Shipping Address:</strong><br>
          ${formatAddress(shippingOption.address)}
        </div>
        ` : ''}
        <div style="margin: 10px 0;">
          <strong>Payment Method:</strong> ${getPaymentMethodLabel(paymentOption)}
        </div>
        ${(paymentOption === null || paymentOption === void 0 ? void 0 : paymentOption.billingAddress) ? `
        <div style="margin: 10px 0; padding-left: 20px; color: #666;">
          <strong>Billing Address:</strong><br>
          ${formatAddress(paymentOption.billingAddress)}
        </div>
        ` : ''}
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
${specialInstructions ? `Special Instructions: ${specialInstructions}\n` : ''}
Order Date: ${new Date().toLocaleString()}

${cartItems.length > 0 ? `Order Items:\n${cartItemsDetails}\n` : ''}
${photos.length > 0 && cartItems.length === 0 ? `Photo Details:\n${photoDetails}\n` : ''}

Receipt Summary:
Subtotal: ${formatCurrency(subtotal)}
${shipping > 0 ? `Shipping: ${formatCurrency(shipping)}\n` : ''}${tax > 0 ? `Tax: ${formatCurrency(tax)}\n` : ''}${isPayAtEvent ? 'Total to pay at tent' : 'Total Paid'}: ${formatCurrency(finalTotalAmount)}

Delivery & Payment:
Delivery Option: ${getDeliveryOptionLabel(shippingOption)}
${(shippingOption === null || shippingOption === void 0 ? void 0 : shippingOption.address) ? `Shipping Address: ${formatAddress(shippingOption.address)}\n` : ''}Payment Method: ${getPaymentMethodLabel(paymentOption)}
${(paymentOption === null || paymentOption === void 0 ? void 0 : paymentOption.billingAddress) ? `Billing Address: ${formatAddress(paymentOption.billingAddress)}\n` : ''}

Best regards,
Lil Magnet Memories System

This email was automatically generated from your website order form.
  `;
    // Send the email
    const info = await transporter.sendMail({
        from: `"Lil Magnet Memories" <${emailConfig.user}>`,
        to: 'info@lilmagnetmemories.com',
        subject: subject,
        text: textContent,
        html: htmlContent,
    });
    console.log('✅ Lil Magnet order email sent successfully:', info.messageId);
    return info.messageId;
}
// Helper function to format status display
function formatStatusDisplay(status) {
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
async function sendLilMagnetStatusUpdateEmail(params) {
    const { firstName, lastName, email, orderNumber, status, photos, quantities, totalMagnets, shippingOption, } = params;
    // Get email configuration from Firebase Functions config
    const emailConfig = functions.config().email;
    if (!(emailConfig === null || emailConfig === void 0 ? void 0 : emailConfig.user) || !(emailConfig === null || emailConfig === void 0 ? void 0 : emailConfig.password)) {
        throw new Error('Email configuration not found in Firebase Functions config');
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
        .map((photo, index) => `${photo.name} (${quantities[index]} magnet${quantities[index] > 1 ? 's' : ''})`)
        .join('\n');
    // Status-specific messaging
    let statusMessage = '';
    let statusEmoji = '';
    let excitementLevel = '';
    switch (status) {
        case 'new':
            statusMessage = 'Your order has been received.';
            statusEmoji = '✨';
            excitementLevel = 'Thank you for your order';
            break;
        case 'in_progress':
            statusMessage = 'Your magnets are being created right now! 🎨';
            statusEmoji = '🛠️';
            excitementLevel = 'Great progress';
            break;
        case 'completed':
            // Customize message based on delivery method
            if ((shippingOption === null || shippingOption === void 0 ? void 0 : shippingOption.type) === 'shipping') {
                const shippingMethod = shippingOption.rawLabel || shippingOption.label || 'shipping';
                statusMessage = `Your custom magnets are created and ready to be shipped/delivered via ${shippingMethod}! 🎊`;
            }
            else if ((shippingOption === null || shippingOption === void 0 ? void 0 : shippingOption.type) === 'pickup' || (shippingOption === null || shippingOption === void 0 ? void 0 : shippingOption.type) === 'arranged_pickup') {
                statusMessage = 'Your custom magnets are completed and ready for pickup! 🎊';
            }
            else {
                // Default fallback
                statusMessage = 'Your custom magnets are completed and ready! 🎊';
            }
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
        <p><strong>Current Status:</strong> <span style="color: #1976d2; font-weight: bold;">${formatStatusDisplay(status)}</span></p>
        <p><strong>Photos Submitted:</strong> ${photos.length}</p>
      </div>

      ${photos.length > 0
        ? `
        <div style="margin-bottom: 20px;">
          <h3 style="color: #1976d2;">📸 Your Custom Magnets</h3>
          <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 15px;">
            ${photos
            .map((photo, index) => `
              <div style="background-color: #fff; padding: 15px; margin: 10px 0; border-radius: 8px; border-left: 4px solid #1976d2; box-shadow: 0 2px 4px rgba(0,0,0,0.1); text-align: center;">
                ${photo.url ? `
                  <img src="${photo.url}" alt="${photo.name}" style="max-width: 100%; height: auto; border-radius: 4px; margin-bottom: 10px; max-height: 200px; object-fit: cover;" />
                ` : ''}
                <div style="margin-top: 10px;">
                  <strong style="font-size: 14px;">${photo.name}</strong><br>
                  <span style="color: #666; font-size: 13px;">Quantity: ${quantities[index]} magnet${quantities[index] > 1 ? 's' : ''}</span>
                </div>
              </div>
            `)
            .join('')}
          </div>
        </div>
      `
        : ''}

      <div style="background-color: #e3f2fd; padding: 15px; border-radius: 8px; border-left: 4px solid #1976d2;">
        <h4 style="margin-top: 0; color: #1976d2;">What's Next?</h4>
        <p style="margin: 0;">${status === 'new'
        ? "We're excited to start working on your custom magnets! You'll receive updates as we progress."
        : status === 'in_progress'
            ? "We're carefully crafting your magnets right now! You'll be notified when they're ready."
            : status === 'completed'
                ? (shippingOption === null || shippingOption === void 0 ? void 0 : shippingOption.type) === 'shipping'
                    ? (() => {
                        const shippingMethod = shippingOption.rawLabel || shippingOption.label || 'shipping';
                        return `Your magnets are ready! We'll ship them to you via ${shippingMethod} soon.`;
                    })()
                    : (shippingOption === null || shippingOption === void 0 ? void 0 : shippingOption.type) === 'pickup' || (shippingOption === null || shippingOption === void 0 ? void 0 : shippingOption.type) === 'arranged_pickup'
                        ? 'Your magnets are ready! Please contact us to arrange pickup.'
                        : 'Your magnets are ready!'
                : 'Thank you for your business!'}</p>
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

What's Next: ${status === 'new'
        ? "We're excited to start working on your custom magnets! You'll receive updates as we progress."
        : status === 'in_progress'
            ? "We're carefully crafting your magnets right now! You'll be notified when they're ready."
            : status === 'completed'
                ? (shippingOption === null || shippingOption === void 0 ? void 0 : shippingOption.type) === 'shipping'
                    ? (() => {
                        const shippingMethod = shippingOption.rawLabel || shippingOption.label || 'shipping';
                        return `Your magnets are ready! We'll ship them to you via ${shippingMethod} soon.`;
                    })()
                    : (shippingOption === null || shippingOption === void 0 ? void 0 : shippingOption.type) === 'pickup' || (shippingOption === null || shippingOption === void 0 ? void 0 : shippingOption.type) === 'arranged_pickup'
                        ? 'Your magnets are ready! Please contact us to arrange pickup.'
                        : 'Your magnets are ready!'
                : 'Thank you for your business!'}

Thank you for choosing Lil Magnet Memories! 🎯

This email was automatically generated from your order status update.
  `;
    // Send the email
    const info = await transporter.sendMail({
        from: `"Lil Magnet Memories" <${emailConfig.user}>`,
        to: email,
        subject: subject,
        text: textContent,
        html: htmlContent,
    });
    console.log('✅ Lil Magnet status update email sent successfully:', info.messageId);
    return info.messageId;
}
// Helper function to send Lil Magnet Memories contact form emails
async function sendLilMagnetContactEmail(params) {
    const { name, email, subject, message } = params;
    // Get email configuration from Firebase Functions config
    const emailConfig = functions.config().email;
    if (!(emailConfig === null || emailConfig === void 0 ? void 0 : emailConfig.user) || !(emailConfig === null || emailConfig === void 0 ? void 0 : emailConfig.password)) {
        throw new Error('Email configuration not found in Firebase Functions config');
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
    const emailSubject = `Contact Form: ${subject}`;
    // Create HTML email content
    const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #1976d2; margin: 0;">🎯 Lil Magnet Memories</h1>
        <h2 style="color: #333; margin: 10px 0;">New Contact Form Submission</h2>
      </div>

      <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <h3 style="color: #1976d2; margin-top: 0;">Contact Information</h3>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
        <p><strong>Subject:</strong> ${subject}</p>
        <p><strong>Submitted:</strong> ${new Date().toLocaleString()}</p>
      </div>

      <div style="background-color: #fff; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #1976d2;">
        <h3 style="color: #1976d2; margin-top: 0;">Message</h3>
        <div style="white-space: pre-wrap; color: #333; line-height: 1.6;">${message.replace(/\n/g, '<br>')}</div>
      </div>

      <div style="text-align: center; margin-top: 30px; color: #666; font-size: 14px;">
        <p>You can reply directly to this email to respond to ${name}.</p>
        <p style="font-size: 12px;">This email was automatically generated from the contact form on your website.</p>
      </div>
    </div>
  `;
    // Create plain text version
    const textContent = `
LIL MAGNET MEMORIES - New Contact Form Submission

Contact Information:
Name: ${name}
Email: ${email}
Subject: ${subject}
Submitted: ${new Date().toLocaleString()}

Message:
${message}

---
You can reply directly to this email to respond to ${name}.
This email was automatically generated from the contact form on your website.
  `;
    // Send the email
    const info = await transporter.sendMail({
        from: `"Lil Magnet Memories Contact Form" <${emailConfig.user}>`,
        to: 'info@lilmagnetmemories.com',
        replyTo: email,
        subject: emailSubject,
        text: textContent,
        html: htmlContent,
    });
    console.log('✅ Lil Magnet contact email sent successfully:', info.messageId);
    return info.messageId;
}
// Export the Express app as a Firebase Function
exports.api = functions.https.onRequest(app);
//# sourceMappingURL=index.js.map