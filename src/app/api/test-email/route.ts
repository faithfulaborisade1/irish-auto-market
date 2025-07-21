// src/app/api/test-email/route.ts - SIMPLE EMAIL TEST
import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function GET(request: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { success: false, message: 'Test endpoint only available in development' },
      { status: 404 }
    );
  }

  try {
    console.log('🧪 Testing email configuration...');
    
    // Test email configuration
    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json(
        { success: false, message: 'RESEND_API_KEY not found in environment variables' },
        { status: 500 }
      );
    }

    // Send test email
    const result = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'Irish Auto Market <onboarding@resend.dev>',
      to: process.env.ADMIN_EMAIL || 'faithfulaborisade123@gmail.com',
      subject: '🧪 Irish Auto Market - Email Test',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Email Test</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; }
            .container { max-width: 600px; margin: 0 auto; background: #f9f9f9; border-radius: 10px; overflow: hidden; }
            .header { background: linear-gradient(135deg, #059669, #ea580c); padding: 30px; text-align: center; }
            .header h1 { color: white; margin: 0; font-size: 28px; }
            .content { padding: 30px; background: white; }
            .success { background: #f0fdf4; border: 2px solid #bbf7d0; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .footer { background: #333; color: white; padding: 20px; text-align: center; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🚗 Irish Auto Market</h1>
              <p style="color: #f0fdf4; margin: 0;">Email System Test</p>
            </div>
            
            <div class="content">
              <h2>✅ Email System Working!</h2>
              
              <div class="success">
                <h3>🎉 Congratulations!</h3>
                <p><strong>Your Irish Auto Market email system is now configured and working correctly.</strong></p>
              </div>
              
              <h3>📋 Test Details:</h3>
              <ul>
                <li><strong>From:</strong> ${process.env.EMAIL_FROM || 'Irish Auto Market <onboarding@resend.dev>'}</li>
                <li><strong>To:</strong> ${process.env.ADMIN_EMAIL || 'faithfulaborisade123@gmail.com'}</li>
                <li><strong>Time:</strong> ${new Date().toLocaleString()}</li>
                <li><strong>Environment:</strong> ${process.env.NODE_ENV || 'development'}</li>
              </ul>
              
              <h3>🚀 Next Steps:</h3>
              <ol>
                <li><strong>Welcome emails</strong> will now be sent to new users</li>
                <li><strong>Admin notifications</strong> for new registrations</li>
                <li><strong>Support system emails</strong> for contact forms</li>
                <li><strong>Response emails</strong> from admin support dashboard</li>
              </ol>
              
              <p><strong>Ready to integrate with your admin support system!</strong></p>
            </div>
            
            <div class="footer">
              <p>© ${new Date().getFullYear()} Irish Auto Market</p>
              <p>Email test sent via Resend API</p>
            </div>
          </div>
        </body>
        </html>
      `
    });

    console.log('✅ Test email sent successfully:', result);

    return NextResponse.json({
      success: true,
      message: 'Test email sent successfully!',
      emailId: result.data?.id,
      details: {
        from: process.env.EMAIL_FROM || 'Irish Auto Market <onboarding@resend.dev>',
        to: process.env.ADMIN_EMAIL || 'faithfulaborisade123@gmail.com',
        subject: '🧪 Irish Auto Market - Email Test',
        timestamp: new Date().toISOString()
      }
    });

  } catch (error: any) {
    console.error('❌ Email test failed:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        message: 'Email test failed',
        error: error.message,
        details: {
          apiKeyConfigured: !!process.env.RESEND_API_KEY,
          emailFrom: process.env.EMAIL_FROM,
          adminEmail: process.env.ADMIN_EMAIL
        }
      },
      { status: 500 }
    );
  }
}