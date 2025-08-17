// src/app/api/book-inspection/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
  try {
    const bookingData = await request.json()

    // Validate required fields
    const requiredFields = ['fullName', 'email', 'phone', 'carMake', 'carModel', 'inspectionCounty']
    const missingFields = requiredFields.filter(field => !bookingData[field]?.trim())
    
    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: 'Missing required fields', missingFields },
        { status: 400 }
      )
    }

    // Format the booking data for email
    const formatDate = (dateString: string) => {
      if (!dateString) return 'Not specified'
      return new Date(dateString).toLocaleDateString('en-IE', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    }

    const formatPhone = (phone: string) => {
      if (!phone) return 'Not provided'
      return phone.trim()
    }

    const formatUrgency = (urgency: string) => {
      const urgencyMap: { [key: string]: string } = {
        'asap': '🔴 URGENT - ASAP (viewing today/tomorrow)',
        'within-3-days': '🟡 Within 3 days',
        'within-week': '🟢 Within a week',
        'flexible': '⚪ Flexible timing'
      }
      return urgencyMap[urgency] || urgency
    }

    const formatTime = (time: string) => {
      const timeMap: { [key: string]: string } = {
        'morning': 'Morning (9AM - 12PM)',
        'afternoon': 'Afternoon (12PM - 5PM)',
        'evening': 'Evening (5PM - 7PM)',
        'flexible': 'Flexible - Any time'
      }
      return timeMap[time] || time
    }

    const formatContact = (method: string) => {
      const contactMap: { [key: string]: string } = {
        'phone': '📞 Phone Call',
        'whatsapp': '💬 WhatsApp',
        'email': '📧 Email'
      }
      return contactMap[method] || method
    }

    // Email to admin/business
    const adminEmailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9fafb; padding: 20px;">
        <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #dc2626; margin: 0; font-size: 24px;">🚗 NEW CAR INSPECTION BOOKING</h1>
            <p style="color: #6b7280; margin: 10px 0 0 0;">New inspection request received via irishautomarket.ie</p>
          </div>

          <!-- Urgency Badge -->
          <div style="text-align: center; margin-bottom: 20px;">
            <span style="background-color: ${bookingData.urgency === 'asap' ? '#dc2626' : bookingData.urgency === 'within-3-days' ? '#f59e0b' : '#10b981'}; color: white; padding: 8px 16px; border-radius: 20px; font-weight: bold; font-size: 14px;">
              ${formatUrgency(bookingData.urgency)}
            </span>
          </div>

          <!-- Customer Information -->
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h2 style="color: #374151; margin: 0 0 15px 0; font-size: 18px;">👤 Customer Information</h2>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 5px 0; font-weight: bold; color: #6b7280; width: 120px;">Name:</td>
                <td style="padding: 5px 0; color: #374151;">${bookingData.fullName}</td>
              </tr>
              <tr>
                <td style="padding: 5px 0; font-weight: bold; color: #6b7280;">Email:</td>
                <td style="padding: 5px 0; color: #374151;">
                  <a href="mailto:${bookingData.email}" style="color: #10b981; text-decoration: none;">${bookingData.email}</a>
                </td>
              </tr>
              <tr>
                <td style="padding: 5px 0; font-weight: bold; color: #6b7280;">Phone:</td>
                <td style="padding: 5px 0; color: #374151;">
                  <a href="tel:${bookingData.phone}" style="color: #10b981; text-decoration: none;">${formatPhone(bookingData.phone)}</a>
                </td>
              </tr>
              <tr>
                <td style="padding: 5px 0; font-weight: bold; color: #6b7280;">Contact Pref:</td>
                <td style="padding: 5px 0; color: #374151;">${formatContact(bookingData.preferredContact)}</td>
              </tr>
            </table>
          </div>

          <!-- Car Information -->
          <div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h2 style="color: #92400e; margin: 0 0 15px 0; font-size: 18px;">🚗 Car Information</h2>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 5px 0; font-weight: bold; color: #92400e; width: 120px;">Make/Model:</td>
                <td style="padding: 5px 0; color: #92400e; font-weight: bold; font-size: 16px;">${bookingData.carMake} ${bookingData.carModel}</td>
              </tr>
              ${bookingData.carYear ? `
              <tr>
                <td style="padding: 5px 0; font-weight: bold; color: #92400e;">Year:</td>
                <td style="padding: 5px 0; color: #92400e;">${bookingData.carYear}</td>
              </tr>
              ` : ''}
              ${bookingData.carPrice ? `
              <tr>
                <td style="padding: 5px 0; font-weight: bold; color: #92400e;">Price:</td>
                <td style="padding: 5px 0; color: #92400e;">${bookingData.carPrice}</td>
              </tr>
              ` : ''}
              ${bookingData.sellerName ? `
              <tr>
                <td style="padding: 5px 0; font-weight: bold; color: #92400e;">Seller:</td>
                <td style="padding: 5px 0; color: #92400e;">${bookingData.sellerName}</td>
              </tr>
              ` : ''}
              ${bookingData.sellerPhone ? `
              <tr>
                <td style="padding: 5px 0; font-weight: bold; color: #92400e;">Seller Phone:</td>
                <td style="padding: 5px 0; color: #92400e;">
                  <a href="tel:${bookingData.sellerPhone}" style="color: #92400e; text-decoration: none;">${bookingData.sellerPhone}</a>
                </td>
              </tr>
              ` : ''}
            </table>
          </div>

          <!-- Location & Scheduling -->
          <div style="background-color: #ecfdf5; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h2 style="color: #065f46; margin: 0 0 15px 0; font-size: 18px;">📍 Location & Scheduling</h2>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 5px 0; font-weight: bold; color: #065f46; width: 120px;">County:</td>
                <td style="padding: 5px 0; color: #065f46; font-weight: bold;">${bookingData.inspectionCounty}</td>
              </tr>
              ${bookingData.inspectionAddress ? `
              <tr>
                <td style="padding: 5px 0; font-weight: bold; color: #065f46;">Address:</td>
                <td style="padding: 5px 0; color: #065f46;">${bookingData.inspectionAddress}</td>
              </tr>
              ` : `
              <tr>
                <td style="padding: 5px 0; font-weight: bold; color: #065f46;">Address:</td>
                <td style="padding: 5px 0; color: #065f46; font-style: italic;">Customer will provide address during call</td>
              </tr>
              `}
              <tr>
                <td style="padding: 5px 0; font-weight: bold; color: #065f46;">Preferred Date:</td>
                <td style="padding: 5px 0; color: #065f46;">${formatDate(bookingData.preferredDate)}</td>
              </tr>
              <tr>
                <td style="padding: 5px 0; font-weight: bold; color: #065f46;">Preferred Time:</td>
                <td style="padding: 5px 0; color: #065f46;">${formatTime(bookingData.preferredTime)}</td>
              </tr>
            </table>
          </div>

          <!-- Additional Information -->
          ${bookingData.specificConcerns || bookingData.additionalInfo ? `
          <div style="background-color: #fef2f2; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h2 style="color: #991b1b; margin: 0 0 15px 0; font-size: 18px;">💬 Additional Information</h2>
            ${bookingData.specificConcerns ? `
            <div style="margin-bottom: 15px;">
              <p style="font-weight: bold; color: #991b1b; margin: 0 0 5px 0;">Specific Concerns:</p>
              <p style="color: #991b1b; margin: 0; background-color: white; padding: 10px; border-radius: 5px;">${bookingData.specificConcerns}</p>
            </div>
            ` : ''}
            ${bookingData.additionalInfo ? `
            <div>
              <p style="font-weight: bold; color: #991b1b; margin: 0 0 5px 0;">Additional Info:</p>
              <p style="color: #991b1b; margin: 0; background-color: white; padding: 10px; border-radius: 5px;">${bookingData.additionalInfo}</p>
            </div>
            ` : ''}
          </div>
          ` : ''}

          <!-- Action Items -->
          <div style="background-color: #1f2937; color: white; padding: 20px; border-radius: 8px; text-align: center;">
            <h2 style="color: white; margin: 0 0 15px 0; font-size: 18px;">⚡ Next Steps</h2>
            <p style="margin: 0 0 15px 0;">Contact customer within 2 hours via ${formatContact(bookingData.preferredContact).toLowerCase()}</p>
            <div style="display: inline-block; margin: 10px;">
              <a href="tel:+353871708603" style="background-color: #10b981; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">📞 Call Now</a>
            </div>
            <div style="display: inline-block; margin: 10px;">
              <a href="mailto:${bookingData.email}" style="background-color: #3b82f6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">📧 Email</a>
            </div>
            ${bookingData.preferredContact === 'whatsapp' ? `
            <div style="display: inline-block; margin: 10px;">
              <a href="https://wa.me/353871708603?text=Hi ${bookingData.fullName}, this is Irish Auto Market regarding your car inspection booking for the ${bookingData.carMake} ${bookingData.carModel}" 
                 style="background-color: #059669; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">💬 WhatsApp</a>
            </div>
            ` : ''}
          </div>

          <!-- Footer -->
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; font-size: 12px; margin: 0;">
              Booking submitted at ${new Date().toLocaleString('en-IE')} via irishautomarket.ie
            </p>
          </div>

        </div>
      </div>
    `

    // Confirmation email to customer
    const customerEmailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9fafb; padding: 20px;">
        <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #10b981; margin: 0; font-size: 24px;">🚗 Inspection Booking Confirmed</h1>
            <p style="color: #6b7280; margin: 10px 0 0 0;">Irish Auto Market</p>
          </div>

          <p style="color: #374151; font-size: 16px; line-height: 1.6;">
            Hi ${bookingData.fullName},
          </p>

          <p style="color: #374151; font-size: 16px; line-height: 1.6;">
            Thank you for booking a car inspection with Irish Auto Market! We've received your request for the <strong>${bookingData.carMake} ${bookingData.carModel}</strong> inspection.
          </p>

          <div style="background-color: #ecfdf5; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
            <h3 style="color: #065f46; margin: 0 0 10px 0;">📋 Your Booking Summary:</h3>
            <ul style="color: #065f46; margin: 0; padding-left: 20px;">
              <li><strong>Vehicle:</strong> ${bookingData.carMake} ${bookingData.carModel}${bookingData.carYear ? ` (${bookingData.carYear})` : ''}</li>
              <li><strong>Location:</strong> ${bookingData.inspectionAddress || bookingData.inspectionCounty}</li>
              <li><strong>Preferred Date:</strong> ${formatDate(bookingData.preferredDate)}</li>
              <li><strong>Preferred Time:</strong> ${formatTime(bookingData.preferredTime)}</li>
              <li><strong>Inspection Fee:</strong> €99 (payable on completion)</li>
            </ul>
          </div>

          <div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #92400e; margin: 0 0 10px 0;">⏰ What Happens Next?</h3>
            <p style="color: #92400e; margin: 0; font-size: 14px; line-height: 1.5;">
              <strong>We'll contact you within 2 hours</strong> via ${formatContact(bookingData.preferredContact).toLowerCase()} to confirm your appointment details and answer any questions you may have.
            </p>
          </div>

          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #374151; margin: 0 0 15px 0;">📞 Contact Information</h3>
            <p style="color: #374151; margin: 0 0 10px 0;">
              <strong>Phone:</strong> <a href="tel:+353871708603" style="color: #10b981;">087 170 8603</a>
            </p>
            <p style="color: #374151; margin: 0 0 10px 0;">
              <strong>Email:</strong> <a href="mailto:info@irishautomarket.ie" style="color: #10b981;">info@irishautomarket.ie</a>
            </p>
            <p style="color: #374151; margin: 0;">
              <strong>WhatsApp:</strong> <a href="https://wa.me/353871708603" style="color: #10b981;">087 170 8603</a>
            </p>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="https://irishautomarket.ie" style="background-color: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">Visit Irish Auto Market</a>
          </div>

          <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">
            Thank you for choosing Irish Auto Market for your car inspection needs. We look forward to helping you make an informed car purchase decision!
          </p>

          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; font-size: 12px; margin: 0;">
              Irish Auto Market - Professional Car Inspections Across Ireland
            </p>
          </div>

        </div>
      </div>
    `

    // Send emails
    try {
      // Email to admin/business - using your existing email addresses
      await resend.emails.send({
        from: 'Irish Auto Market <noreply@irishautomarket.ie>', // Your verified domain
        to: ['info@irishautomarket.ie'], // Your existing admin email that forwards to Gmail
        subject: `🚗 NEW INSPECTION BOOKING - ${bookingData.carMake} ${bookingData.carModel} (${formatUrgency(bookingData.urgency)})`,
        html: adminEmailHtml,
      })

      // Confirmation email to customer
      await resend.emails.send({
        from: 'Irish Auto Market <noreply@irishautomarket.ie>', // Your verified domain
        to: [bookingData.email],
        subject: '🚗 Car Inspection Booking Confirmed - Irish Auto Market',
        html: customerEmailHtml,
      })

    } catch (emailError) {
      console.error('Email sending error:', emailError)
      // Don't fail the booking if email fails
    }

    // You could also save to database here if needed
    // await saveBookingToDatabase(bookingData)

    return NextResponse.json({
      success: true,
      message: 'Booking request submitted successfully',
      bookingId: `IAM-${Date.now()}`, // Simple booking ID
    })

  } catch (error) {
    console.error('Booking API error:', error)
    return NextResponse.json(
      { error: 'Failed to process booking request' },
      { status: 500 }
    )
  }
}