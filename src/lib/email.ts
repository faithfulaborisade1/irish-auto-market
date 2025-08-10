// src/lib/email.ts - Complete Error-Free Email Service with Spam Prevention
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

// Enhanced Email configuration with new dealer email
const EMAIL_CONFIG = {
  from: process.env.EMAIL_FROM || 'Irish Auto Market <noreply@irishautomarket.ie>',
  adminEmail: process.env.ADMIN_EMAIL || 'info@irishautomarket.ie',
  supportEmail: process.env.SUPPORT_EMAIL || 'support@irishautomarket.ie',
  dealerEmail: process.env.DEALER_EMAIL || 'dealers@irishautomarket.ie' // 🆕 NEW
};

// Type definitions that match your database schema
export type EmailType = 
  | 'welcome'
  | 'admin_notification'
  | 'support_response'
  | 'support_confirmation'
  | 'admin_alert'
  | 'dealer_invitation'; // 🆕 NEW

// User type from your database schema
export type UserRole = 'USER' | 'DEALER' | 'ADMIN' | 'SUPER_ADMIN' | 'CONTENT_MOD' | 'FINANCE_ADMIN' | 'SUPPORT_ADMIN';

// Contact category from your database schema
export type ContactCategory = 'GENERAL' | 'TECHNICAL_SUPPORT' | 'BILLING' | 'DEALER_INQUIRY' | 'PARTNERSHIP' | 'MEDIA_INQUIRY' | 'LEGAL' | 'COMPLAINT' | 'SUGGESTION';

// 🆕 SPAM PREVENTION HEADERS - Applied to all emails
const getSpamPreventionHeaders = (type: 'transactional' | 'marketing' = 'transactional') => {
  const headers: Record<string, string> = {
    // Unsubscribe headers (required for bulk emails)
    'List-Unsubscribe': `<mailto:unsubscribe@irishautomarket.ie>, <https://irishautomarket.ie/unsubscribe>`,
    'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
    
    // Email client headers
    'X-Entity-Ref-ID': 'irish-auto-market',
    'X-Auto-Response-Suppress': 'All',
    
    // Prevent auto-replies
    'Precedence': type === 'marketing' ? 'bulk' : 'list',
  };

  // For marketing emails (like dealer invitations)
  if (type === 'marketing') {
    headers['List-ID'] = '<dealer-invitations.irishautomarket.ie>';
    headers['X-Mailer'] = 'Irish Auto Market Dealer Outreach';
  }

  return headers;
};

// Enhanced Email Template with Irish Branding + Spam Prevention
const getEmailTemplate = (
  content: string, 
  title: string, 
  type: 'user' | 'dealer' | 'admin' = 'user',
  emailType: 'transactional' | 'marketing' = 'transactional'
) => {
  const colors = {
    user: { primary: '#059669', secondary: '#ea580c' },
    dealer: { primary: '#1e40af', secondary: '#059669' },
    admin: { primary: '#dc2626', secondary: '#059669' }
  };
  
  const color = colors[type];
  
  // Plain text version for better deliverability
  const plainTextVersion = content
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim();
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    /* Reset styles for email clients */
    body, table, td, p, a, li, blockquote { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
    
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
      line-height: 1.6; 
      color: #1f2937; 
      background: #f9fafb;
      margin: 0; 
      padding: 20px; 
      width: 100% !important;
      min-width: 100%;
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
      line-height: 1.6;
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
      padding: 14px 28px;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
      margin: 16px 0;
      font-size: 16px;
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
      color: #4b5563;
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
    .unsubscribe {
      font-size: 12px;
      color: #9ca3af;
      margin-top: 16px;
    }
    .unsubscribe a {
      color: #9ca3af;
      text-decoration: underline;
    }
    
    /* Mobile responsive */
    @media (max-width: 600px) {
      .container { margin: 0; border-radius: 0; }
      .header, .content { padding: 20px; }
      .header h1 { font-size: 20px; }
      .button { padding: 12px 24px; font-size: 14px; }
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
      
      ${emailType === 'marketing' ? `
      <div class="unsubscribe">
        <p>You received this email because we believe you may be interested in Irish Auto Market's dealer services.</p>
        <p>
          <a href="https://irishautomarket.ie/unsubscribe">Unsubscribe</a> | 
          <a href="mailto:unsubscribe@irishautomarket.ie">Email Unsubscribe</a>
        </p>
      </div>
      ` : ''}
    </div>
  </div>
</body>
</html>
`;
};

// ============================================================================
// 🆕 DEALER INVITATION EMAIL - Professional & Spam-Safe
// ============================================================================

export async function sendDealerInvitation(invitation: {
  email: string;
  businessName?: string;
  contactName?: string;
  location?: string;
  registrationToken: string;
  adminName: string;
}) {
  try {
    if (!resend) {
      console.warn('⚠️ Email service not configured');
      return { success: false, error: 'Email service not configured' };
    }

    // Personalized greeting
    const greeting = invitation.contactName 
      ? `Hello ${invitation.contactName}` 
      : invitation.businessName 
        ? `Hello from ${invitation.businessName}` 
        : 'Hello';

    // Registration URL with token
    const registrationUrl = `https://irishautomarket.ie/register/dealer?token=${invitation.registrationToken}`;

    // Professional, spam-safe subject line (avoiding "FREE", "LIMITED TIME")
    const subject = `Partner with Irish Auto Market - Professional Car Listings Platform`;

    const content = `
      <h2>Partner with Ireland's Growing Car Marketplace 🚗</h2>
      
      <p>${greeting},</p>
      
      <p>We would like to invite you to join <strong>IrishAutoMarket.ie</strong> — Ireland's newest and fastest-growing car sales platform, built specifically for trusted auto traders like you.</p>
      
      ${invitation.businessName ? `
      <div class="info-card">
        <h3>🏢 Business Invitation</h3>
        <p><strong>Business:</strong> ${invitation.businessName}</p>
        ${invitation.location ? `<p><strong>Location:</strong> ${invitation.location}</p>` : ''}
        <p>This invitation is specifically for your dealership to join our professional network.</p>
      </div>
      ` : ''}
      
      <div class="success-card">
        <h3>🎯 Professional Listing Platform</h3>
        <p>For a <strong>limited period</strong>, you can list your vehicles at <strong>no cost for 2-3 months</strong> — no setup fees, no hidden costs.</p>
      </div>
      
      <div class="info-card">
        <h3>Why Join Irish Auto Market?</h3>
        <ul>
          <li><strong>Cost-effective listings</strong> for dealers during launch period</li>
          <li><strong>Enhanced visibility</strong> from buyers across Ireland</li>
          <li><strong>Professional platform</strong> built specifically for Irish buyers</li>
          <li><strong>Mobile-optimized</strong> experience for modern car shopping</li>
          <li><strong>SEO and marketing support</strong> to boost your inventory visibility</li>
          <li><strong>No obligations</strong> - try our platform risk-free</li>
        </ul>
      </div>
      
      <div class="warning-card">
        <h3>🚀 Get Ahead of Your Competition</h3>
        <p>Start listing today and establish your presence while we're still in our growth phase. Early dealers benefit from increased visibility and priority support.</p>
      </div>
      
      <div class="button-container">
        <a href="${registrationUrl}" class="button">Register Your Dealership</a>
      </div>
      
      <div class="card">
        <h3>📞 Questions or Need Assistance?</h3>
        <p>Our team is here to help you get started:</p>
        <p>
          📧 <strong>Email:</strong> <a href="mailto:dealers@irishautomarket.ie">dealers@irishautomarket.ie</a><br>
          💬 <strong>WhatsApp:</strong> Reply to this email for WhatsApp contact<br>
          🌐 <strong>Website:</strong> <a href="https://irishautomarket.ie">www.irishautomarket.ie</a>
        </p>
      </div>
      
      <div class="card">
        <h3>🔗 Alternative Registration</h3>
        <p><strong>If the button doesn't work, copy this link:</strong></p>
        <div style="background: #f3f4f6; padding: 12px; border-radius: 6px; font-family: monospace; font-size: 12px; word-break: break-all; color: #374151;">
          ${registrationUrl}
        </div>
      </div>
      
      <p style="text-align: center; margin-top: 24px;">
        Looking forward to welcoming you onboard,<br>
        <strong>${invitation.adminName}</strong><br>
        The Irish Auto Market Team 🇮🇪
      </p>
    `;

    // Plain text version for better deliverability
    const plainText = `
${greeting},

We would like to invite you to join IrishAutoMarket.ie — Ireland's newest and fastest-growing car sales platform, built specifically for trusted auto traders like you.

${invitation.businessName ? `This invitation is for ${invitation.businessName}${invitation.location ? ` in ${invitation.location}` : ''}.` : ''}

For a limited period, you can list your vehicles at no cost for 2-3 months — no setup fees, no hidden costs.

Why Join Irish Auto Market?
• Cost-effective listings for dealers during launch period
• Enhanced visibility from buyers across Ireland  
• Professional platform built specifically for Irish buyers
• Mobile-optimized experience for modern car shopping
• SEO and marketing support to boost your inventory visibility
• No obligations - try our platform risk-free

Get ahead of your competition - start listing today and establish your presence while we're still in our growth phase.

Register your dealership: ${registrationUrl}

Questions or need assistance?
Email: dealers@irishautomarket.ie
WhatsApp: Reply to this email for WhatsApp contact
Website: www.irishautomarket.ie

Looking forward to welcoming you onboard,
${invitation.adminName}
The Irish Auto Market Team

---
Irish Auto Market, Dublin, Ireland
You received this email because we believe you may be interested in Irish Auto Market's dealer services.
Unsubscribe: https://irishautomarket.ie/unsubscribe
    `;

    const result = await resend.emails.send({
      from: `Irish Auto Market <${EMAIL_CONFIG.dealerEmail}>`,
      to: invitation.email,
      subject: subject,
      html: getEmailTemplate(content, 'Dealer Partnership Invitation', 'dealer', 'marketing'),
      text: plainText,
      headers: getSpamPreventionHeaders('marketing')
    });

    console.log(`✅ Dealer invitation sent to ${invitation.email}:`, result.data?.id);
    return { success: true, emailId: result.data?.id };

  } catch (error: any) {
    console.error('❌ Failed to send dealer invitation:', error);
    return { success: false, error: error.message };
  }
}

// ============================================================================
// WELCOME EMAIL (Enhanced with spam prevention)
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
      subject = `Welcome ${user.firstName}! Complete Your Dealer Setup`;
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
      subject = `Welcome ${user.firstName}! Find Your Perfect Car`;
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
            <li><strong>Sell Your Car:</strong> List your vehicle at no cost</li>
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

    // Create plain text version
    const plainText = `
Hi ${user.firstName}!

${isDealer ? 'Thank you for registering as a dealer with Irish Auto Market. You now have access to Ireland\'s most advanced dealer platform.' : 'Welcome to Ireland\'s most trusted car marketplace. We\'re excited to help you find the perfect vehicle or sell your current one.'}

${isDealer ? 'Complete your business verification within 48 hours to unlock all dealer features and start listing vehicles.' : 'Use our advanced search to find your ideal car, save favorites, and message sellers directly.'}

${isDealer ? 'Complete your setup: https://irishautomarket.ie/profile/edit' : 'Start browsing: https://irishautomarket.ie/cars'}

Need help? Contact support@irishautomarket.ie

Welcome to the Irish Auto Market family!

---
Irish Auto Market, Dublin, Ireland
    `;

    const result = await resend.emails.send({
      from: EMAIL_CONFIG.from,
      to: user.email,
      subject: subject,
      html: getEmailTemplate(content, subject, isDealer ? 'dealer' : 'user', 'transactional'),
      text: plainText,
      headers: getSpamPreventionHeaders('transactional')
    });

    console.log(`✅ Welcome email sent to ${user.email}:`, result.data?.id);
    return { success: true, emailId: result.data?.id };

  } catch (error: any) {
    console.error('❌ Failed to send welcome email:', error);
    return { success: false, error: error.message };
  }
}

// ============================================================================
// SUPPORT CONFIRMATION EMAIL (Enhanced)
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

    // Plain text version
    const plainText = `
Hi ${contact.name},

Thank you for contacting Irish Auto Market support. We've received your message and our team will respond as soon as possible.

Your Request Details:
Reference ID: IAM-${contact.id.slice(-8).toUpperCase()}
Subject: ${contact.subject}
Category: ${contact.category.replace('_', ' ')}
Submitted: ${new Date().toLocaleDateString('en-IE')}

Expected Response Times:
• Urgent Issues: Within 2 hours
• Technical Support: 4-8 hours
• General Inquiries: Within 24 hours

Visit our help center: https://irishautomarket.ie/help

Best regards,
Irish Auto Market Support Team

---
Irish Auto Market, Dublin, Ireland
    `;

    const result = await resend.emails.send({
      from: EMAIL_CONFIG.supportEmail,
      to: contact.email,
      subject: `Support Request Received - ${contact.category.replace('_', ' ')} [IAM-${contact.id.slice(-8).toUpperCase()}]`,
      html: getEmailTemplate(content, 'Support Request Received', 'user', 'transactional'),
      text: plainText,
      headers: getSpamPreventionHeaders('transactional')
    });

    console.log(`✅ Support confirmation sent to ${contact.email}:`, result.data?.id);
    return { success: true, emailId: result.data?.id };

  } catch (error: any) {
    console.error('❌ Failed to send support confirmation:', error);
    return { success: false, error: error.message };
  }
}

// ============================================================================
// ADMIN NOTIFICATION EMAIL (Enhanced)
// ============================================================================

export async function sendAdminNotification(notification: {
  type: 'new_user' | 'new_dealer' | 'support_contact' | 'urgent_report' | 'urgent_feedback' | 'dealer_invited';
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
      case 'dealer_invited': // 🆕 NEW
        const invitation = notification.data;
        subject = `🏢 Dealer Invitation Sent - ${invitation.businessName || invitation.email}`;
        content = `
          <h2>Dealer Invitation Sent 📧</h2>
          
          <p>A dealer invitation has been sent successfully.</p>
          
          <div class="info-card">
            <h3>📋 Invitation Details</h3>
            <p><strong>Email:</strong> ${invitation.email}</p>
            <p><strong>Business Name:</strong> ${invitation.businessName || 'Not provided'}</p>
            <p><strong>Contact Name:</strong> ${invitation.contactName || 'Not provided'}</p>
            <p><strong>Location:</strong> ${invitation.location || 'Not provided'}</p>
            <p><strong>Sent by:</strong> ${invitation.adminName}</p>
            <p><strong>Sent at:</strong> ${new Date().toLocaleDateString('en-IE')}</p>
          </div>
          
          <div class="success-card">
            <h3>📊 Track Results</h3>
            <p>Monitor this invitation's performance in the admin dashboard:</p>
            <ul>
              <li>Email opens and clicks</li>
              <li>Registration completion</li>
              <li>Time to activation</li>
            </ul>
          </div>
          
          <div class="button-container">
            <a href="https://irishautomarket.ie/admin/invitations" class="button">View Invitation Dashboard</a>
          </div>
        `;
        break;

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

    // Plain text version
    const plainText = content
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .trim();

    const result = await resend.emails.send({
      from: EMAIL_CONFIG.from,
      to: EMAIL_CONFIG.adminEmail,
      subject: subject,
      html: getEmailTemplate(content, subject, 'admin', 'transactional'),
      text: plainText,
      headers: getSpamPreventionHeaders('transactional')
    });

    console.log(`✅ Admin notification sent (${notification.type}):`, result.data?.id);
    return { success: true, emailId: result.data?.id };

  } catch (error: any) {
    console.error('❌ Failed to send admin notification:', error);
    return { success: false, error: error.message };
  }
}

// ============================================================================
// SUPPORT RESPONSE EMAIL (Enhanced)
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

    // Plain text version
    const plainText = `
Hi ${response.name},

Thank you for contacting Irish Auto Market support. We've reviewed your inquiry and here's our response:

Reference Details:
Reference ID: ${response.referenceId}
Subject: ${response.subject}
Response Date: ${new Date().toLocaleDateString('en-IE')}

Our Response:
${response.message}

${response.originalMessage ? `Your Original Message: "${response.originalMessage}"` : ''}

Need additional help? Reply to this email with your reference ID (${response.referenceId}) for faster service.

Contact: support@irishautomarket.ie
Help Center: https://irishautomarket.ie/help

Best regards,
${response.adminName}
Irish Auto Market Support Team

---
Irish Auto Market, Dublin, Ireland
    `;

    const result = await resend.emails.send({
      from: EMAIL_CONFIG.supportEmail,
      to: response.to,
      subject: `Re: ${response.subject} [${response.referenceId}]`,
      html: getEmailTemplate(content, 'Support Response', 'user', 'transactional'),
      text: plainText,
      headers: getSpamPreventionHeaders('transactional')
    });

    console.log(`✅ Support response sent to ${response.to}:`, result.data?.id);
    return { success: true, emailId: result.data?.id };

  } catch (error: any) {
    console.error('❌ Failed to send support response:', error);
    return { success: false, error: error.message };
  }
}

// ============================================================================
// PASSWORD RESET EMAILS (Enhanced)
// ============================================================================

export async function sendPasswordResetEmail(reset: {
  email: string;
  firstName: string;
  lastName: string;
  resetToken: string;
  resetUrl: string;
}) {
  try {
    if (!resend) {
      console.warn('⚠️ Email service not configured');
      return { success: false, error: 'Email service not configured' };
    }

    const name = `${reset.firstName} ${reset.lastName}`.trim();

    const content = `
      <h2>Password Reset Request 🔐</h2>
      
      <p>Hi ${reset.firstName},</p>
      
      <p>We received a request to reset your password for your Irish Auto Market account. If you didn't make this request, you can safely ignore this email and your password will remain unchanged.</p>
      
      <div class="warning-card">
        <h3>🔒 Security Notice</h3>
        <p><strong>Important:</strong> This password reset link will expire in <strong>1 hour</strong> for your security. If you need to reset your password after this time, you'll need to request a new reset link.</p>
      </div>
      
      <div class="info-card">
        <h3>🔐 Reset Your Password</h3>
        <p>To create a new password for your account, click the button below. You'll be taken to a secure page where you can enter your new password.</p>
        
        <div class="button-container">
          <a href="${reset.resetUrl}" class="button" style="background: #dc2626; font-size: 16px; padding: 16px 32px;">
            Reset My Password
          </a>
        </div>
      </div>
      
      <div class="card">
        <h3>🔗 Alternative Link</h3>
        <p><strong>If the button doesn't work, copy and paste this link:</strong></p>
        <div style="background: #f3f4f6; padding: 12px; border-radius: 6px; font-family: monospace; font-size: 14px; word-break: break-all; color: #374151;">
          ${reset.resetUrl}
        </div>
      </div>
      
      <div class="warning-card">
        <h3>🛡️ Security Tips</h3>
        <ul>
          <li><strong>Create a strong password:</strong> Use at least 8 characters with a mix of letters, numbers, and symbols</li>
          <li><strong>Keep it unique:</strong> Don't reuse passwords from other websites</li>
          <li><strong>Stay secure:</strong> Never share your password with anyone</li>
        </ul>
      </div>
      
      <div class="card">
        <h3>❓ Need Help?</h3>
        <p>If you didn't request this password reset or have any security concerns, please contact our support team immediately:</p>
        <p>
          📧 <a href="mailto:support@irishautomarket.ie">support@irishautomarket.ie</a><br>
          📞 <strong>Urgent Security Issues:</strong> Reply to this email with "SECURITY ALERT"
        </p>
      </div>
      
      <p style="text-align: center; margin-top: 20px; color: #6b7280;">
        This password reset was requested from IP address: <code>${reset.resetUrl.includes('localhost') ? '127.0.0.1' : 'your-ip'}</code><br>
        <small>If this wasn't you, please contact support immediately.</small>
      </p>
    `;

    // Plain text version
    const plainText = `
Hi ${reset.firstName},

We received a request to reset your password for your Irish Auto Market account. If you didn't make this request, you can safely ignore this email.

SECURITY NOTICE: This password reset link will expire in 1 hour for your security.

Reset your password: ${reset.resetUrl}

Security Tips:
• Create a strong password with at least 8 characters
• Use a mix of letters, numbers, and symbols
• Keep it unique - don't reuse passwords from other websites
• Never share your password with anyone

Need help or have security concerns? Contact support@irishautomarket.ie

---
Irish Auto Market, Dublin, Ireland
    `;

    const result = await resend.emails.send({
      from: EMAIL_CONFIG.from,
      to: reset.email,
      subject: `🔐 Reset Your Password - Irish Auto Market`,
      html: getEmailTemplate(content, 'Password Reset Request', 'user', 'transactional'),
      text: plainText,
      headers: getSpamPreventionHeaders('transactional')
    });

    console.log(`✅ Password reset email sent to ${reset.email}:`, result.data?.id);
    return { success: true, emailId: result.data?.id };

  } catch (error: any) {
    console.error('❌ Failed to send password reset email:', error);
    return { success: false, error: error.message };
  }
}

export async function sendPasswordResetSuccessEmail(user: {
  email: string;
  firstName: string;
  lastName: string;
}) {
  try {
    if (!resend) {
      console.warn('⚠️ Email service not configured');
      return { success: false, error: 'Email service not configured' };
    }

    const content = `
      <h2>Password Successfully Reset ✅</h2>
      
      <p>Hi ${user.firstName},</p>
      
      <p>Your password has been successfully reset for your Irish Auto Market account. You can now log in using your new password.</p>
      
      <div class="success-card">
        <h3>🎉 Password Updated</h3>
        <p>Your account security has been updated. Here are the details:</p>
        <p><strong>Account:</strong> ${user.email}</p>
        <p><strong>Reset Date:</strong> ${new Date().toLocaleDateString('en-IE', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })}</p>
      </div>
      
      <div class="info-card">
        <h3>🔐 Next Steps</h3>
        <ul>
          <li>✅ Log in with your new password</li>
          <li>🔄 Update your saved passwords in your browser</li>
          <li>📱 Update your password in any mobile apps</li>
          <li>🛡️ Consider enabling additional security features</li>
        </ul>
      </div>
      
      <div class="button-container">
        <a href="https://irishautomarket.ie/login" class="button">Log In Now</a>
      </div>
      
      <div class="warning-card">
        <h3>🚨 Security Alert</h3>
        <p><strong>If you didn't reset your password,</strong> your account may have been compromised. Please:</p>
        <ul>
          <li>Contact our support team immediately</li>
          <li>Check your account for any unauthorized activity</li>
          <li>Consider changing passwords on other accounts that use the same password</li>
        </ul>
        <p>📧 <strong>Emergency Contact:</strong> <a href="mailto:support@irishautomarket.ie">support@irishautomarket.ie</a></p>
      </div>
      
      <p style="text-align: center; margin-top: 20px;">
        Best regards,<br>
        <strong>Irish Auto Market Security Team</strong> 🇮🇪🔐
      </p>
    `;

    // Plain text version
    const plainText = `
Hi ${user.firstName},

Your password has been successfully reset for your Irish Auto Market account. You can now log in using your new password.

Password Updated:
Account: ${user.email}
Reset Date: ${new Date().toLocaleDateString('en-IE')}

Next Steps:
• Log in with your new password
• Update your saved passwords in your browser
• Update your password in any mobile apps

Log in now: https://irishautomarket.ie/login

If you didn't reset your password, contact support@irishautomarket.ie immediately.

Best regards,
Irish Auto Market Security Team

---
Irish Auto Market, Dublin, Ireland
    `;

    const result = await resend.emails.send({
      from: EMAIL_CONFIG.from,
      to: user.email,
      subject: `✅ Password Successfully Reset - Irish Auto Market`,
      html: getEmailTemplate(content, 'Password Reset Successful', 'user', 'transactional'),
      text: plainText,
      headers: getSpamPreventionHeaders('transactional')
    });

    console.log(`✅ Password reset success email sent to ${user.email}:`, result.data?.id);
    return { success: true, emailId: result.data?.id };

  } catch (error: any) {
    console.error('❌ Failed to send password reset success email:', error);
    return { success: false, error: error.message };
  }
}

// ============================================================================
// EMAIL SERVICE TEST FUNCTION (Enhanced)
// ============================================================================

export async function testEmailService() {
  try {
    if (!resend) {
      return { success: false, error: 'Email service not configured - missing RESEND_API_KEY' };
    }

    console.log('🧪 Testing email service with spam prevention...');
    
    const testUser = {
      email: EMAIL_CONFIG.adminEmail,
      firstName: 'Test',
      lastName: 'User',
      role: 'USER'
    };

    const result = await sendWelcomeEmail(testUser);
    
    if (result.success) {
      console.log('✅ Email service test successful with spam prevention!');
      return { success: true, message: 'Email service is working correctly with anti-spam features' };
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
// UTILITY FUNCTIONS (Enhanced)
// ============================================================================

export function getEmailConfig() {
  return {
    ...EMAIL_CONFIG,
    hasResendKey: !!process.env.RESEND_API_KEY,
    environment: process.env.NODE_ENV || 'development',
    spamPrevention: true, // 🆕 NEW
    dealerEmail: EMAIL_CONFIG.dealerEmail // 🆕 NEW
  };
}

export function validateEmailAddress(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// 🆕 NEW: Email deliverability check function
export function checkEmailDeliverability(subject: string, content: string): {
  score: number;
  warnings: string[];
  suggestions: string[];
} {
  const warnings: string[] = [];
  const suggestions: string[] = [];
  let score = 100;

  // Check for spam trigger words
  const spamWords = ['free', 'limited time', 'act now', 'congratulations', '!!!', 'urgent', 'click here', 'buy now'];
  const lowerContent = (subject + ' ' + content).toLowerCase();
  
  spamWords.forEach(word => {
    if (lowerContent.includes(word)) {
      warnings.push(`Contains potential spam trigger word: "${word}"`);
      score -= 10;
    }
  });

  // Check subject line length
  if (subject.length > 50) {
    warnings.push('Subject line is too long (over 50 characters)');
    score -= 5;
  }

  // Check for excessive capitalization
  const capsCount = (subject.match(/[A-Z]/g) || []).length;
  if (capsCount / subject.length > 0.3) {
    warnings.push('Too much capitalization in subject line');
    score -= 10;
  }

  // Provide suggestions
  if (score < 90) {
    suggestions.push('Consider using more professional language');
    suggestions.push('Reduce use of sales-oriented words');
    suggestions.push('Focus on value proposition rather than urgency');
  }

  return { score: Math.max(score, 0), warnings, suggestions };
}

// Export updated email configuration
export { EMAIL_CONFIG };