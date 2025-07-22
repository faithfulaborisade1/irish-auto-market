// src/lib/email.ts - Complete Error-Free Email Service
import { Resend } from 'resend';

// Initialize Resend with API key check
let resend: Resend | null = null;

try {
  if (process.env.RESEND_API_KEY) {
    resend = new Resend(process.env.RESEND_API_KEY);
  }
} catch (error) {
  console.warn('⚠️ Resend initialization failed:', error);
}

// Email configuration
const EMAIL_CONFIG = {
  from: process.env.EMAIL_FROM || 'Irish Auto Market <noreply@irishautomarket.ie>',
  adminEmail: process.env.ADMIN_EMAIL || 'info@irishautomarket.ie',
  supportEmail: process.env.SUPPORT_EMAIL || 'support@irishautomarket.ie'
};

// Type definitions that match your database schema
export type EmailType = 
  | 'welcome'
  | 'admin_notification'
  | 'support_response'
  | 'support_confirmation'
  | 'admin_alert';

// User type from your database schema
export type UserRole = 'USER' | 'DEALER' | 'ADMIN' | 'SUPER_ADMIN' | 'CONTENT_MOD' | 'FINANCE_ADMIN' | 'SUPPORT_ADMIN';

// Contact category from your database schema
export type ContactCategory = 'GENERAL' | 'TECHNICAL_SUPPORT' | 'BILLING' | 'DEALER_INQUIRY' | 'PARTNERSHIP' | 'MEDIA_INQUIRY' | 'LEGAL' | 'COMPLAINT' | 'SUGGESTION';

// Modern Email Template with Irish Branding
const getEmailTemplate = (content: string, title: string, type: 'user' | 'dealer' | 'admin' = 'user') => {
  const colors = {
    user: { primary: '#059669', secondary: '#ea580c' },
    dealer: { primary: '#1e40af', secondary: '#059669' },
    admin: { primary: '#dc2626', secondary: '#059669' }
  };
  
  const color = colors[type];
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6; 
      color: #1f2937; 
      background: #f9fafb;
      margin: 0; 
      padding: 20px; 
    }
    .container { 
      max-width: 600px; 
      margin: 0 auto; 
      background: #ffffff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    }
    .header { 
      background: linear-gradient(135deg, ${color.primary} 0%, ${color.secondary} 100%);
      padding: 30px;
      text-align: center;
    }
    .header h1 { 
      color: white; 
      margin: 0; 
      font-size: 24px; 
      font-weight: 700;
    }
    .logo {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 12px;
      color: white;
      font-size: 18px;
      font-weight: 700;
    }
    .content { 
      padding: 30px;
    }
    .content h2 {
      color: #111827;
      font-size: 20px;
      font-weight: 600;
      margin-bottom: 16px;
    }
    .content p {
      color: #4b5563;
      font-size: 16px;
      margin-bottom: 16px;
    }
    .card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 20px;
      margin: 20px 0;
    }
    .success-card {
      background: #ecfdf5;
      border: 1px solid #bbf7d0;
      border-left: 4px solid #10b981;
    }
    .info-card {
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      border-left: 4px solid #3b82f6;
    }
    .warning-card {
      background: #fffbeb;
      border: 1px solid #fcd34d;
      border-left: 4px solid #f59e0b;
    }
    .button {
      display: inline-block;
      background: ${color.primary};
      color: white !important;
      padding: 12px 24px;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
      margin: 16px 0;
    }
    .button-container {
      text-align: center;
      margin: 24px 0;
    }
    ul {
      padding-left: 20px;
    }
    li {
      margin-bottom: 8px;
    }
    .footer { 
      background: #1f2937;
      color: #d1d5db;
      padding: 24px;
      text-align: center;
      font-size: 14px;
    }
    .footer a {
      color: #60a5fa;
      text-decoration: none;
    }
    @media (max-width: 600px) {
      .container { margin: 0; border-radius: 0; }
      .header, .content { padding: 20px; }
      .header h1 { font-size: 20px; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">
        🚗 Irish Auto Market
      </div>
      <h1>${title}</h1>
      <div style="color: rgba(255,255,255,0.9); font-size: 14px;">Ireland's Premier Car Marketplace</div>
    </div>
    
    <div class="content">
      ${content}
    </div>
    
    <div class="footer">
      <p>© ${new Date().getFullYear()} Irish Auto Market. All rights reserved.</p>
      <p>
        <a href="https://irishautomarket.ie">Visit Website</a> | 
        <a href="https://irishautomarket.ie/contact">Contact Support</a>
      </p>
      <p style="margin-top: 16px; font-size: 12px; color: #9ca3af;">
        Irish Auto Market, Dublin, Ireland<br>
        <a href="mailto:support@irishautomarket.ie">support@irishautomarket.ie</a>
      </p>
    </div>
  </div>
</body>
</html>
`;
};

// ============================================================================
// WELCOME EMAIL (Matches your database User schema)
// ============================================================================

export async function sendWelcomeEmail(user: {
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}) {
  try {
    if (!resend) {
      console.warn('⚠️ Email service not configured - Resend API key missing');
      return { success: false, error: 'Email service not configured' };
    }

    const isDealer = user.role === 'DEALER';
    const name = `${user.firstName} ${user.lastName}`.trim();
    
    let content = '';
    let subject = '';
    
    if (isDealer) {
      subject = `Welcome ${user.firstName}! 🏢 Complete Your Dealer Setup`;
      content = `
        <h2>Welcome to Professional Car Sales! 🏢</h2>
        
        <p>Hi ${user.firstName}!</p>
        
        <p>Thank you for registering as a dealer with Irish Auto Market. You now have access to Ireland's most advanced dealer platform.</p>
        
        <div class="warning-card">
          <h3>⚠️ Business Verification Required</h3>
          <p><strong>Important:</strong> Complete your business verification within 48 hours to unlock all dealer features and start listing vehicles.</p>
        </div>
        
        <div class="success-card">
          <h3>🚀 Professional Dealer Tools</h3>
          <ul>
            <li><strong>Unlimited Listings:</strong> List as many vehicles as you want</li>
            <li><strong>Professional Profile:</strong> Showcase your dealership brand</li>
            <li><strong>Advanced Analytics:</strong> Track performance and ROI</li>
            <li><strong>Featured Listings:</strong> Promote your best inventory</li>
            <li><strong>Lead Management:</strong> CRM tools for customer follow-up</li>
          </ul>
        </div>
        
        <div class="info-card">
          <h3>📈 Next Steps</h3>
          <ul>
            <li>✅ Complete your dealer profile</li>
            <li>📸 Upload your business logo</li>
            <li>📄 Submit verification documents</li>
            <li>🚗 Start listing your inventory</li>
          </ul>
        </div>
        
        <div class="button-container">
          <a href="https://irishautomarket.ie/profile/edit" class="button">Complete Dealer Setup</a>
        </div>
      `;
    } else {
      subject = `Welcome ${user.firstName}! 🚗 Find Your Perfect Car`;
      content = `
        <h2>Ready to Find Your Perfect Car? 🎉</h2>
        
        <p>Hi ${user.firstName}!</p>
        
        <p>Welcome to Ireland's most trusted car marketplace. We're excited to help you find the perfect vehicle or sell your current one.</p>
        
        <div class="success-card">
          <h3>🚗 Your Car Platform</h3>
          <ul>
            <li><strong>Advanced Search:</strong> Find cars by make, model, price, and location</li>
            <li><strong>Save Favorites:</strong> Bookmark cars and get price alerts</li>
            <li><strong>Direct Messaging:</strong> Chat directly with sellers</li>
            <li><strong>Sell Your Car:</strong> List your vehicle for free</li>
            <li><strong>Verified Dealers:</strong> Buy from trusted professionals</li>
          </ul>
        </div>
        
        <div class="info-card">
          <h3>💡 Getting Started</h3>
          <ul>
            <li>🔍 Use our advanced filters to find your ideal car</li>
            <li>📱 Message sellers with specific questions</li>
            <li>📍 Start with cars in your local area</li>
            <li>🏆 Look for our "Verified Dealer" badges</li>
          </ul>
        </div>
        
        <div class="button-container">
          <a href="https://irishautomarket.ie/cars" class="button">Start Browsing Cars</a>
        </div>
      `;
    }
    
    content += `
      <div class="card">
        <h3>📞 Need Help?</h3>
        <p>Our Irish support team is here to help:</p>
        <p>
          📧 <a href="mailto:support@irishautomarket.ie">support@irishautomarket.ie</a><br>
          ❓ <a href="https://irishautomarket.ie/help">Help Center</a>
        </p>
        <p style="text-align: center; margin-top: 16px;">
          <strong>Welcome to the Irish Auto Market family!</strong> 🇮🇪🚗
        </p>
      </div>
    `;

    const result = await resend.emails.send({
      from: EMAIL_CONFIG.from,
      to: user.email,
      subject: subject,
      html: getEmailTemplate(content, subject, isDealer ? 'dealer' : 'user')
    });

    console.log(`✅ Welcome email sent to ${user.email}:`, result.data?.id);
    return { success: true, emailId: result.data?.id };

  } catch (error: any) {
    console.error('❌ Failed to send welcome email:', error);
    return { success: false, error: error.message };
  }
}

// ============================================================================
// SUPPORT CONFIRMATION EMAIL
// ============================================================================

export async function sendSupportConfirmation(contact: {
  email: string;
  name: string;
  subject: string;
  category: string;
  id: string;
}) {
  try {
    if (!resend) {
      console.warn('⚠️ Email service not configured');
      return { success: false, error: 'Email service not configured' };
    }

    const content = `
      <h2>Support Request Received ✅</h2>
      
      <p>Hi ${contact.name},</p>
      
      <p>Thank you for contacting Irish Auto Market support. We've received your message and our team will respond as soon as possible.</p>
      
      <div class="success-card">
        <h3>📝 Your Request Details</h3>
        <p><strong>Reference ID:</strong> <code>IAM-${contact.id.slice(-8).toUpperCase()}</code></p>
        <p><strong>Subject:</strong> ${contact.subject}</p>
        <p><strong>Category:</strong> ${contact.category.replace('_', ' ')}</p>
        <p><strong>Submitted:</strong> ${new Date().toLocaleDateString('en-IE', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        })}</p>
      </div>
      
      <div class="info-card">
        <h3>⏱️ Expected Response Times</h3>
        <ul>
          <li><strong>Urgent Issues:</strong> Within 2 hours</li>
          <li><strong>Technical Support:</strong> 4-8 hours</li>
          <li><strong>General Inquiries:</strong> Within 24 hours</li>
        </ul>
        <p>If your issue is urgent, please mention it in your follow-up message.</p>
      </div>
      
      <div class="button-container">
        <a href="https://irishautomarket.ie/help" class="button">Visit Help Center</a>
      </div>
      
      <p style="text-align: center; margin-top: 20px;">
        Best regards,<br>
        <strong>Irish Auto Market Support Team</strong> 🇮🇪
      </p>
    `;

    const result = await resend.emails.send({
      from: EMAIL_CONFIG.supportEmail,
      to: contact.email,
      subject: `Support Request Received - ${contact.category.replace('_', ' ')} [IAM-${contact.id.slice(-8).toUpperCase()}]`,
      html: getEmailTemplate(content, 'Support Request Received', 'user')
    });

    console.log(`✅ Support confirmation sent to ${contact.email}:`, result.data?.id);
    return { success: true, emailId: result.data?.id };

  } catch (error: any) {
    console.error('❌ Failed to send support confirmation:', error);
    return { success: false, error: error.message };
  }
}

// ============================================================================
// ADMIN NOTIFICATION EMAIL
// ============================================================================

export async function sendAdminNotification(notification: {
  type: 'new_user' | 'new_dealer' | 'support_contact' | 'urgent_report' | 'urgent_feedback';
  data: any;
}) {
  try {
    if (!resend) {
      console.warn('⚠️ Email service not configured');
      return { success: false, error: 'Email service not configured' };
    }

    let content = '';
    let subject = '';

    switch (notification.type) {
      case 'new_user':
        const user = notification.data;
        subject = `🆕 New User Registration - ${user.firstName} ${user.lastName}`;
        content = `
          <h2>New User Registration 👋</h2>
          
          <p>A new user has registered on Irish Auto Market.</p>
          
          <div class="info-card">
            <h3>📋 User Details</h3>
            <p><strong>Name:</strong> ${user.firstName} ${user.lastName}</p>
            <p><strong>Email:</strong> ${user.email}</p>
            <p><strong>Role:</strong> ${user.role}</p>
            <p><strong>Phone:</strong> ${user.phone || 'Not provided'}</p>
            <p><strong>Registered:</strong> ${new Date().toLocaleDateString('en-IE')}</p>
          </div>
          
          <div class="button-container">
            <a href="https://irishautomarket.ie/admin/users" class="button">View in Admin Dashboard</a>
          </div>
        `;
        break;

      case 'new_dealer':
        const dealer = notification.data;
        subject = `🏢 New Dealer Registration - ${dealer.firstName} ${dealer.lastName}`;
        content = `
          <h2>New Dealer Registration 🏢</h2>
          
          <p><strong>⚠️ Action Required:</strong> A new dealer has registered and requires business verification.</p>
          
          <div class="warning-card">
            <h3>🏢 Dealer Details</h3>
            <p><strong>Name:</strong> ${dealer.firstName} ${dealer.lastName}</p>
            <p><strong>Email:</strong> ${dealer.email}</p>
            <p><strong>Phone:</strong> ${dealer.phone || 'Not provided'}</p>
            <p><strong>Registered:</strong> ${new Date().toLocaleDateString('en-IE')}</p>
          </div>
          
          <div class="info-card">
            <h3>📝 Next Steps</h3>
            <ul>
              <li>Review business registration details</li>
              <li>Verify business legitimacy</li>
              <li>Approve or request additional information</li>
              <li>Enable dealer features upon approval</li>
            </ul>
          </div>
          
          <div class="button-container">
            <a href="https://irishautomarket.ie/admin/dealers" class="button">Review Dealer Application</a>
          </div>
        `;
        break;

      case 'support_contact':
        const contact = notification.data;
        subject = `📞 New Support Contact - ${contact.category.replace('_', ' ')} [IAM-${contact.id.slice(-8).toUpperCase()}]`;
        content = `
          <h2>New Support Contact 📞</h2>
          
          <p>A ${contact.category === 'COMPLAINT' || contact.category === 'LEGAL' ? 'high priority' : ''} support request has been submitted.</p>
          
          <div class="${contact.category === 'COMPLAINT' || contact.category === 'LEGAL' ? 'warning-card' : 'info-card'}">
            <h3>📋 Contact Details</h3>
            <p><strong>Reference:</strong> IAM-${contact.id.slice(-8).toUpperCase()}</p>
            <p><strong>From:</strong> ${contact.name} (${contact.email})</p>
            <p><strong>Category:</strong> ${contact.category.replace('_', ' ')}</p>
            <p><strong>Priority:</strong> ${contact.priority}</p>
            <p><strong>Subject:</strong> ${contact.subject}</p>
            <p><strong>Phone:</strong> ${contact.phone || 'Not provided'}</p>
            
            <div style="background: #ffffff; padding: 16px; border-radius: 8px; margin-top: 16px; border-left: 4px solid #059669;">
              <h4>Message:</h4>
              <p>${contact.message}</p>
            </div>
          </div>
          
          <div class="button-container">
            <a href="https://irishautomarket.ie/admin/support/contact" class="button">View & Respond</a>
          </div>
        `;
        break;

      case 'urgent_report':
        const report = notification.data;
        subject = `🚨 URGENT: ${report.type.replace('_', ' ')} Report [IAM-${report.id.slice(-8).toUpperCase()}]`;
        content = `
          <h2>🚨 Urgent Issue Report</h2>
          
          <p><strong style="color: #ef4444;">IMMEDIATE ACTION REQUIRED:</strong> A critical issue has been reported.</p>
          
          <div class="warning-card">
            <h3>⚠️ Report Details</h3>
            <p><strong>Reference:</strong> IAM-${report.id.slice(-8).toUpperCase()}</p>
            <p><strong>Type:</strong> ${report.type.replace('_', ' ')}</p>
            <p><strong>Severity:</strong> ${report.severity}</p>
            <p><strong>Title:</strong> ${report.title}</p>
            <p><strong>Reporter:</strong> ${report.reporterName || 'Anonymous'}</p>
            
            <div style="background: #ffffff; padding: 16px; border-radius: 8px; margin-top: 16px; border-left: 4px solid #ef4444;">
              <h4>Description:</h4>
              <p>${report.description}</p>
            </div>
          </div>
          
          <div class="button-container">
            <a href="https://irishautomarket.ie/admin/reports" class="button">Investigate Now</a>
          </div>
        `;
        break;

      case 'urgent_feedback':
        const feedback = notification.data;
        subject = `📝 Urgent Feedback: ${feedback.type.replace('_', ' ')} ${feedback.rating ? `(${feedback.rating}/5 stars)` : ''}`;
        content = `
          <h2>📝 Urgent Feedback Alert</h2>
          
          <p>${feedback.rating && feedback.rating <= 2 ? 'Low rating alert:' : ''} ${feedback.type === 'BUG_REPORT' ? 'Bug report:' : ''} Important feedback requiring attention.</p>
          
          <div class="${feedback.rating && feedback.rating <= 2 ? 'warning-card' : 'info-card'}">
            <h3>📋 Feedback Details</h3>
            <p><strong>Type:</strong> ${feedback.type.replace('_', ' ')}</p>
            <p><strong>Rating:</strong> ${feedback.rating ? `${feedback.rating}/5 stars` : 'Not rated'}</p>
            <p><strong>From:</strong> ${feedback.name || 'Anonymous'}</p>
            <p><strong>Subject:</strong> ${feedback.subject || 'No subject'}</p>
            
            <div style="background: #ffffff; padding: 16px; border-radius: 8px; margin-top: 16px; border-left: 4px solid #059669;">
              <h4>Message:</h4>
              <p>${feedback.message}</p>
            </div>
          </div>
          
          <div class="button-container">
            <a href="https://irishautomarket.ie/admin/feedback" class="button">Review Feedback</a>
          </div>
        `;
        break;

      default:
        subject = '📬 Irish Auto Market Notification';
        content = `
          <h2>System Notification 📬</h2>
          <p>A new notification has been generated.</p>
        `;
    }

    const result = await resend.emails.send({
      from: EMAIL_CONFIG.from,
      to: EMAIL_CONFIG.adminEmail,
      subject: subject,
      html: getEmailTemplate(content, subject, 'admin')
    });

    console.log(`✅ Admin notification sent (${notification.type}):`, result.data?.id);
    return { success: true, emailId: result.data?.id };

  } catch (error: any) {
    console.error('❌ Failed to send admin notification:', error);
    return { success: false, error: error.message };
  }
}

// ============================================================================
// SUPPORT RESPONSE EMAIL (Admin Reply to User)
// ============================================================================

export async function sendSupportResponse(response: {
  to: string;
  name: string;
  subject: string;
  message: string;
  referenceId: string;
  adminName: string;
  originalMessage?: string;
}) {
  try {
    if (!resend) {
      console.warn('⚠️ Email service not configured');
      return { success: false, error: 'Email service not configured' };
    }

    const content = `
      <h2>Support Response from Irish Auto Market 📧</h2>
      
      <p>Hi ${response.name},</p>
      
      <p>Thank you for contacting Irish Auto Market support. We've reviewed your inquiry and here's our response:</p>
      
      <div class="success-card">
        <h3>📝 Reference Details</h3>
        <p><strong>Reference ID:</strong> <code>${response.referenceId}</code></p>
        <p><strong>Subject:</strong> ${response.subject}</p>
        <p><strong>Response Date:</strong> ${new Date().toLocaleDateString('en-IE')}</p>
      </div>
      
      <div style="background: #ffffff; padding: 20px; border-radius: 8px; border-left: 4px solid #059669; margin: 20px 0;">
        <h3 style="margin: 0 0 12px 0; color: #059669;">💬 Our Response:</h3>
        <div style="white-space: pre-wrap; line-height: 1.6;">${response.message}</div>
      </div>
      
      ${response.originalMessage ? `
      <div class="info-card">
        <h4>📄 Your Original Message:</h4>
        <div style="background: #f8fafc; padding: 12px; border-radius: 6px; color: #6b7280; font-style: italic;">
          "${response.originalMessage}"
        </div>
      </div>
      ` : ''}
      
      <div class="card">
        <h3>❓ Need Additional Help?</h3>
        <p>If you have follow-up questions, simply reply to this email with your reference ID (<strong>${response.referenceId}</strong>) for faster service.</p>
        <p>
          📧 <a href="mailto:support@irishautomarket.ie">support@irishautomarket.ie</a><br>
          ❓ <a href="https://irishautomarket.ie/help">Help Center</a>
        </p>
      </div>
      
      <div class="button-container">
        <a href="https://irishautomarket.ie" class="button">Return to Irish Auto Market</a>
      </div>
      
      <p style="text-align: center; margin-top: 20px;">
        Best regards,<br>
        <strong>${response.adminName}</strong><br>
        Irish Auto Market Support Team 🇮🇪
      </p>
    `;

    const result = await resend.emails.send({
      from: EMAIL_CONFIG.supportEmail,
      to: response.to,
      subject: `Re: ${response.subject} [${response.referenceId}]`,
      html: getEmailTemplate(content, 'Support Response', 'user')
    });

    console.log(`✅ Support response sent to ${response.to}:`, result.data?.id);
    return { success: true, emailId: result.data?.id };

  } catch (error: any) {
    console.error('❌ Failed to send support response:', error);
    return { success: false, error: error.message };
  }
}

// ============================================================================
// EMAIL SERVICE TEST FUNCTION
// ============================================================================

export async function testEmailService() {
  try {
    if (!resend) {
      return { success: false, error: 'Email service not configured - missing RESEND_API_KEY' };
    }

    console.log('🧪 Testing email service...');
    
    const testUser = {
      email: EMAIL_CONFIG.adminEmail,
      firstName: 'Test',
      lastName: 'User',
      role: 'USER'
    };

    const result = await sendWelcomeEmail(testUser);
    
    if (result.success) {
      console.log('✅ Email service test successful!');
      return { success: true, message: 'Email service is working correctly' };
    } else {
      console.error('❌ Email service test failed:', result.error);
      return { success: false, error: result.error };
    }

  } catch (error: any) {
    console.error('❌ Email service test error:', error);
    return { success: false, error: error.message };
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export function getEmailConfig() {
  return {
    ...EMAIL_CONFIG,
    hasResendKey: !!process.env.RESEND_API_KEY,
    environment: process.env.NODE_ENV || 'development'
  };
}

export function validateEmailAddress(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Export email configuration for use in other modules
export { EMAIL_CONFIG };