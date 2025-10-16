import emailjs from '@emailjs/browser';

// EmailJS configuration
// You'll need to set these up in your EmailJS dashboard
const EMAILJS_SERVICE_ID = 'your_service_id'; // Replace with your EmailJS service ID
const EMAILJS_TEMPLATE_ID = 'your_template_id'; // Replace with your EmailJS template ID
const EMAILJS_PUBLIC_KEY = 'your_public_key'; // Replace with your EmailJS public key

export interface CustomerData {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  specialInstructions?: string;
  photos: File[];
}

export interface EmailTemplateData {
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  special_instructions?: string;
  photo_count: number;
  submission_date: string;
}

class EmailService {
  private initialized = false;

  constructor() {
    this.initialize();
  }

  private initialize() {
    if (typeof window !== 'undefined') {
      emailjs.init(EMAILJS_PUBLIC_KEY);
      this.initialized = true;
    }
  }

  async sendCustomerSubmission(data: CustomerData): Promise<boolean> {
    if (!this.initialized) {
      console.error('EmailJS not initialized');
      return false;
    }

    try {
      // Prepare template data
      const templateData: EmailTemplateData = {
        customer_name: `${data.firstName} ${data.lastName}`,
        customer_email: data.email,
        customer_phone: data.phone || 'Not provided',
        special_instructions: data.specialInstructions || 'None',
        photo_count: data.photos.length,
        submission_date: new Date().toLocaleString(),
      };

      // Send email
      const response = await emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID,
        templateData
      );

      console.log('Email sent successfully:', response);
      return true;
    } catch (error) {
      console.error('Failed to send email:', error);
      return false;
    }
  }

  // Alternative method using a simple fetch to a backend service
  async sendViaBackend(data: CustomerData): Promise<boolean> {
    try {
      const formData = new FormData();

      // Add customer data
      formData.append('firstName', data.firstName);
      formData.append('lastName', data.lastName);
      formData.append('email', data.email);
      formData.append('phone', data.phone || '');
      formData.append('specialInstructions', data.specialInstructions || '');
      formData.append('submissionDate', new Date().toISOString());

      // Add photos
      data.photos.forEach((photo, index) => {
        formData.append(`photo_${index}`, photo);
      });

      // Replace with your backend endpoint
      const response = await fetch('/api/submit-photos', {
        method: 'POST',
        body: formData,
      });

      return response.ok;
    } catch (error) {
      console.error('Failed to send via backend:', error);
      return false;
    }
  }
}

export const emailService = new EmailService();
