// src/lib/email.ts - Email Service with Resend
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

// Email types for type safety
export type EmailType = 
  | 'welcome'
  | 'admin_notification'
  | 'support_response'
  | 'support_confirmation'
  | 'admin_alert';

// Email configuration
const EMAIL_CONFIG = {
  from: process.env.EMAIL_FROM || 'Irish Auto Market <noreply@irishautomarket.ie>',
  adminEmail: process.env.ADMIN_EMAIL || 'admin@irishautomarket.ie',
  supportEmail: process.env.SUPPORT_EMAIL || 'support@irishautomarket.ie'
};

// Base email template wrapper
const getEmailTemplate = (content: string, title: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #059669, #ea580c); padding: 20px; text-align: center; }
    .header h1 { color: white; margin: 0; font-size: 24px; }
    .content { background: #f9f9f9; padding: 30px; }
    .footer { background: #333; color: white; padding: 20px; text-align: center; font-size: 12px; }
    .button { display: inline-block; background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 10px 0; }
    .button:hover { background: #047857; }
    .alert { background: #fef2f2; border: 1px solid #fecaca; padding: 15px; border-radius: 5px; margin: 15px 0; }
    .success { background: #f0fdf4; border: 1px solid #bbf7d0; padding: 15px; border-radius: 5px; margin: 15px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🚗 Irish Auto Market</h1>
    </div>
    <div class="content">
      ${content}
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} Irish Auto Market. All rights reserved.</p>
      <p>This email was sent from an automated system. Please do not reply directly to this email.</p>
      <p><a href="https://irishautomarket.ie" style="color: #ccc;">Visit Our Website</a> | <a href="https://irishautomarket.ie/contact" style="color: #ccc;">Contact Support</a></p>
    </div>
  </div>
</body>
</html>
`;

// ============================================================================
// USER EMAILS
// ============================================================================

export async function sendWelcomeEmail(user: {
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}) {
  try {
    const isDealer = user.role === 'DEALER';
    const name = `${user.firstName} ${user.lastName}`.trim();
    
    const content = `
      <h2>Welcome to Irish Auto Market, ${user.firstName}! 🎉</h2>
      
      <p>Thank you for joining Ireland's leading car marketplace. Your account has been successfully created.</p>
      
      ${isDealer ? `
        <div class="success">
          <h3>🏢 Dealer Account Created</h3>
          <p>As a registered dealer, you now have access to:</p>
          <ul>
            <li>✅ Professional dealer profile</li>
            <li>✅ Unlimited car listings</li>
            <li>✅ Advanced analytics and reporting</li>
            <li>✅ Direct customer messaging</li>
            <li>✅ Featured listing opportunities</li>
          </ul>
          <p><strong>Next Step:</strong> Complete your business verification to unlock premium features.</p>
        </div>
      ` : `
        <div class="success">
          <h3>🚗 Start Your Car Search</h3>
          <p>You now have access to:</p>
          <ul>
            <li>✅ Advanced car search with filters</li>
            <li>✅ Save favorite cars and searches</li>
            <li>✅ Direct messaging with sellers</li>
            <li>✅ Price alerts and notifications</li>
          </ul>
        </div>
      `}
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="https://irishautomarket.ie/login" class="button">
          ${isDealer ? 'Access Dealer Dashboard' : 'Start Browsing Cars'}
        </a>
      </div>
      
      <h3>📞 Need Help?</h3>
      <p>Our support team is here to help:</p>
      <ul>
        <li>📧 Email: <a href="mailto:support@irishautomarket.ie">support@irishautomarket.ie</a></li>
        <li>📱 Visit: <a href="https://irishautomarket.ie/contact">Contact Support</a></li>
        <li>❓ FAQ: <a href="https://irishautomarket.ie/help">Help Center</a></li>
      </ul>
      
      <p>Happy car hunting! 🚗</p>
      <p><strong>The Irish Auto Market Team</strong></p>
    `;

    const result = await resend.emails.send({
      from: EMAIL_CONFIG.from,
      to: user.email,
      subject: `Welcome to Irish Auto Market, ${user.firstName}! 🚗`,
      html: getEmailTemplate(content, 'Welcome to Irish Auto Market')
    });

    console.log(`✅ Welcome email sent to ${user.email}:`, result.data?.id);
    return { success: true, emailId: result.data?.id };

  } catch (error: any) {
    console.error('❌ Failed to send welcome email:', error);
    return { success: false, error: error.message };
  }
}

export async function sendSupportConfirmation(contact: {
  email: string;
  name: string;
  subject: string;
  category: string;
  id: string;
}) {
  try {
    const content = `
      <h2>Support Request Received ✅</h2>
      
      <p>Hi ${contact.name},</p>
      
      <p>Thank you for contacting Irish Auto Market support. We've received your message and will respond as soon as possible.</p>
      
      <div class="success">
        <h3>📝 Your Request Details</h3>
        <p><strong>Reference ID:</strong> IAM-${contact.id.slice(-8).toUpperCase()}</p>
        <p><strong>Subject:</strong> ${contact.subject}</p>
        <p><strong>Category:</strong> ${contact.category.replace('_', ' ')}</p>
        <p><strong>Submitted:</strong> ${new Date().toLocaleDateString('en-IE')}</p>
      </div>
      
      <h3>⏱️ Response Times</h3>
      <ul>
        <li><strong>General Inquiries:</strong> Within 24 hours</li>
        <li><strong>Technical Support:</strong> Within 4-8 hours</li>
        <li><strong>Urgent Issues:</strong> Within 2 hours</li>
      </ul>
      
      <p>If your issue is urgent, please call us directly or visit our help center for immediate assistance.</p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="https://irishautomarket.ie/help" class="button">Visit Help Center</a>
      </div>
      
      <p>Best regards,<br><strong>Irish Auto Market Support Team</strong></p>
    `;

    const result = await resend.emails.send({
      from: EMAIL_CONFIG.supportEmail,
      to: contact.email,
      subject: `Support Request Received - ${contact.subject} [#IAM-${contact.id.slice(-8).toUpperCase()}]`,
      html: getEmailTemplate(content, 'Support Request Confirmation')
    });

    console.log(`✅ Support confirmation sent to ${contact.email}:`, result.data?.id);
    return { success: true, emailId: result.data?.id };

  } catch (error: any) {
    console.error('❌ Failed to send support confirmation:', error);
    return { success: false, error: error.message };
  }
}

// ============================================================================
// ADMIN EMAILS
// ============================================================================

export async function sendAdminNotification(notification: {
  type: 'new_user' | 'new_dealer' | 'support_contact' | 'urgent_report' | 'critical_issue';
  data: any;
}) {
  try {
    let subject = '';
    let content = '';

    switch (notification.type) {
      case 'new_user':
        subject = `🆕 New User Registration - ${notification.data.name}`;
        content = `
          <h2>New User Registration 👤</h2>
          
          <div class="success">
            <h3>User Details</h3>
            <p><strong>Name:</strong> ${notification.data.firstName} ${notification.data.lastName}</p>
            <p><strong>Email:</strong> ${notification.data.email}</p>
            <p><strong>Role:</strong> ${notification.data.role}</p>
            <p><strong>Registered:</strong> ${new Date().toLocaleDateString('en-IE')}</p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://irishautomarket.ie/admin/users" class="button">View in Admin Panel</a>
          </div>
        `;
        break;

      case 'new_dealer':
        subject = `🏢 New Dealer Registration - ${notification.data.businessName}`;
        content = `
          <h2>New Dealer Registration 🏢</h2>
          
          <div class="alert">
            <h3>⚠️ Verification Required</h3>
            <p>A new dealer has registered and requires business verification.</p>
          </div>
          
          <div class="success">
            <h3>Dealer Details</h3>
            <p><strong>Business Name:</strong> ${notification.data.businessName}</p>
            <p><strong>Contact:</strong> ${notification.data.firstName} ${notification.data.lastName}</p>
            <p><strong>Email:</strong> ${notification.data.email}</p>
            <p><strong>Phone:</strong> ${notification.data.phone || 'Not provided'}</p>
            <p><strong>Registered:</strong> ${new Date().toLocaleDateString('en-IE')}</p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://irishautomarket.ie/admin/users/dealers" class="button">Review Dealer</a>
          </div>
        `;
        break;

      case 'support_contact':
        subject = `📞 New Support Contact - ${notification.data.category}`;
        content = `
          <h2>New Support Request 📞</h2>
          
          <div class="success">
            <h3>Contact Details</h3>
            <p><strong>From:</strong> ${notification.data.name} (${notification.data.email})</p>
            <p><strong>Subject:</strong> ${notification.data.subject}</p>
            <p><strong>Category:</strong> ${notification.data.category}</p>
            <p><strong>Priority:</strong> ${notification.data.priority}</p>
            <p><strong>Reference:</strong> IAM-${notification.data.id.slice(-8).toUpperCase()}</p>
          </div>
          
          <div style="background: #f3f4f6; padding: 15px; border-radius: 5px; margin: 15px 0;">
            <h4>Message:</h4>
            <p style="margin: 0;">${notification.data.message.substring(0, 200)}${notification.data.message.length > 200 ? '...' : ''}</p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://irishautomarket.ie/admin/support/contact" class="button">Respond to Contact</a>
          </div>
        `;
        break;

      case 'urgent_report':
        subject = `🚨 URGENT: Critical Issue Report - ${notification.data.type}`;
        content = `
          <h2>🚨 Critical Issue Report</h2>
          
          <div class="alert">
            <h3>⚠️ IMMEDIATE ACTION REQUIRED</h3>
            <p>A critical issue has been reported that requires immediate attention.</p>
          </div>
          
          <div class="success">
            <h3>Report Details</h3>
            <p><strong>Type:</strong> ${notification.data.type}</p>
            <p><strong>Severity:</strong> ${notification.data.severity}</p>
            <p><strong>Title:</strong> ${notification.data.title}</p>
            <p><strong>Reporter:</strong> ${notification.data.reporterName || 'Anonymous'}</p>
            <p><strong>Reference:</strong> IAM-${notification.data.id.slice(-8).toUpperCase()}</p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://irishautomarket.ie/admin/support/reports" class="button" style="background: #dc2626;">Handle Immediately</a>
          </div>
        `;
        break;

      default:
        throw new Error(`Unknown notification type: ${notification.type}`);
    }

    const result = await resend.emails.send({
      from: EMAIL_CONFIG.from,
      to: EMAIL_CONFIG.adminEmail,
      subject: subject,
      html: getEmailTemplate(content, subject)
    });

    console.log(`✅ Admin notification sent (${notification.type}):`, result.data?.id);
    return { success: true, emailId: result.data?.id };

  } catch (error: any) {
    console.error('❌ Failed to send admin notification:', error);
    return { success: false, error: error.message };
  }
}

export async function sendSupportResponse(response: {
  to: string;
  name: string;
  originalSubject: string;
  referenceId: string;
  responseMessage: string;
  adminName: string;
  status: string;
}) {
  try {
    const content = `
      <h2>Support Response 📧</h2>
      
      <p>Hi ${response.name},</p>
      
      <p>We've reviewed your support request and have an update for you.</p>
      
      <div class="success">
        <h3>📝 Reference Details</h3>
        <p><strong>Reference ID:</strong> ${response.referenceId}</p>
        <p><strong>Original Subject:</strong> ${response.originalSubject}</p>
        <p><strong>Status:</strong> ${response.status}</p>
        <p><strong>Responded by:</strong> ${response.adminName}</p>
      </div>
      
      <div style="background: #f3f4f6; padding: 20px; border-radius: 5px; margin: 20px 0;">
        <h4>Response:</h4>
        <p style="margin: 0; white-space: pre-wrap;">${response.responseMessage}</p>
      </div>
      
      <h3>Need Further Assistance?</h3>
      <p>If you have additional questions about this issue, simply reply to this email with the reference ID included.</p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="https://irishautomarket.ie/contact" class="button">Contact Support Again</a>
      </div>
      
      <p>Best regards,<br><strong>${response.adminName}<br>Irish Auto Market Support Team</strong></p>
    `;

    const result = await resend.emails.send({
      from: EMAIL_CONFIG.supportEmail,
      to: response.to,
      subject: `Re: ${response.originalSubject} [#${response.referenceId}]`,
      html: getEmailTemplate(content, 'Support Response')
    });

    console.log(`✅ Support response sent to ${response.to}:`, result.data?.id);
    return { success: true, emailId: result.data?.id };

  } catch (error: any) {
    console.error('❌ Failed to send support response:', error);
    return { success: false, error: error.message };
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export async function testEmailConnection() {
  try {
    // Send a test email to verify Resend is working
    const result = await resend.emails.send({
      from: EMAIL_CONFIG.from,
      to: EMAIL_CONFIG.adminEmail,
      subject: '🧪 Email Service Test - Irish Auto Market',
      html: getEmailTemplate(`
        <h2>Email Service Test ✅</h2>
        <p>This is a test email to verify that the Irish Auto Market email service is working correctly.</p>
        <div class="success">
          <p><strong>Configuration:</strong></p>
          <ul>
            <li>From: ${EMAIL_CONFIG.from}</li>
            <li>Admin Email: ${EMAIL_CONFIG.adminEmail}</li>
            <li>Support Email: ${EMAIL_CONFIG.supportEmail}</li>
            <li>Timestamp: ${new Date().toISOString()}</li>
          </ul>
        </div>
        <p>If you received this email, the service is working correctly! 🎉</p>
      `, 'Email Service Test')
    });

    console.log('✅ Test email sent successfully:', result.data?.id);
    return { success: true, emailId: result.data?.id };

  } catch (error: any) {
    console.error('❌ Email service test failed:', error);
    return { success: false, error: error.message };
  }
}

// Environment variable validation
export function validateEmailConfig() {
  const required = ['RESEND_API_KEY'];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required email environment variables: ${missing.join(', ')}`);
  }
  
  console.log('✅ Email configuration validated');
  return true;
}