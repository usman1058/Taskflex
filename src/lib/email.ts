import nodemailer from 'nodemailer'

// Create transporter using environment variables
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,                  // e.g., mail.yourdomain.com
  port: parseInt(process.env.SMTP_PORT || '587'), // 587 for TLS, 465 for SSL
  secure: process.env.SMTP_SECURE === 'true',     // true for 465, false for 587
  auth: {
    user: process.env.SMTP_USER,                 // your cPanel email
    pass: process.env.SMTP_PASS,                 // email password
  },
})

export async function sendInvitationEmail({
  to,
  teamName,
  inviterName,
  inviteLink,
}: {
  to: string
  teamName: string
  inviterName: string
  inviteLink: string
}) {
  try {
    await transporter.sendMail({
      from: `"Task Management" <${process.env.SMTP_FROM}>`, // use env variable for "from"
      to,
      subject: `You've been invited to join ${teamName}`,
      html: `
        <p>Hello,</p>
        <p>${inviterName} has invited you to join the team <strong>${teamName}</strong> in our Task Management System.</p>
        <p>Please click the link below to accept the invitation:</p>
        <p><a href="${inviteLink}" style="padding: 10px 15px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 4px;">Accept Invitation</a></p>
        <p>If you didn't expect this invitation, you can ignore this email.</p>
        <p>Thanks,<br>Task Management Team</p>
      `,
    })

    return { success: true }
  } catch (error) {
    console.error('Error sending email via SMTP:', error)
    return { success: false, error }
  }
}
