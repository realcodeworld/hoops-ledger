import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendMagicLinkEmail(
  to: string,
  playerName: string,
  magicLink: string,
  organizationName: string
) {
  try {
    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'HoopsLedger <noreply@hoopsledger.com>',
      to: [to],
      subject: `Access Your ${organizationName} Dashboard`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px;">🏀 HoopsLedger</h1>
            </div>

            <div style="background: #fff; padding: 40px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
              <h2 style="color: #1f2937; margin-top: 0;">Hi ${playerName}!</h2>

              <p style="font-size: 16px; color: #4b5563;">
                Click the button below to access your ${organizationName} player dashboard. You'll be able to view your attendance history and payment balance.
              </p>

              <div style="text-align: center; margin: 30px 0;">
                <a href="${magicLink}"
                   style="background: #f97316; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block; font-size: 16px;">
                  Access Dashboard
                </a>
              </div>

              <p style="font-size: 14px; color: #6b7280; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                This link will expire in 24 hours and can only be used once.
              </p>

              <p style="font-size: 12px; color: #9ca3af; margin-top: 20px;">
                If you didn't request this email, you can safely ignore it.
              </p>
            </div>

            <div style="text-align: center; margin-top: 20px; color: #9ca3af; font-size: 12px;">
              <p>Sent by ${organizationName} via HoopsLedger</p>
            </div>
          </body>
        </html>
      `,
    })

    if (error) {
      console.error('Resend error:', error)
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    console.error('Email send error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send email',
    }
  }
}
