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

export async function sendMeetingEmail({
  to,
  teamName,
  meetingTitle,
  startTime,
  meetLink,
}: {
  to: string
  teamName: string
  meetingTitle: string
  startTime: Date
  meetLink?: string
}) {
  try {
    await transporter.sendMail({
      from: `"Task Management" <${process.env.SMTP_FROM}>`,
      to,
      subject: `Meeting Scheduled: ${meetingTitle}`,
      html: `
        <p>Hello,</p>
        <p>A new meeting has been scheduled for ${teamName}:</p>
        <div style="padding: 16px; background-color: #f3f4f6; border-radius: 8px; margin: 16px 0;">
          <h3 style="margin: 0 0 8px 0; color: #1e293b;">${meetingTitle}</h3>
          <p style="margin: 0; color: #64748b;">
            ${startTime.toLocaleString()}
          </p>
        </div>
        ${meetLink ? `
          <p style="margin: 16px 0;">
            <a href="${meetLink}" style="padding: 10px 16px; background-color: #4f46e5; color: white; text-decoration: none; border-radius: 4px; display: inline-block;">
              Join Meeting
            </a>
          </p>
        ` : ''}
        <p style="margin-top: 16px; font-size: 14px; color: #64748b;">
          This is an automated notification about your team meeting.
        </p>
      `,
    })

    return { success: true }
  } catch (error) {
    console.error('Error sending meeting email:', error)
    return { success: false, error }
  }
}

export async function sendMeetingReminderEmail({
  to,
  teamName,
  meetingTitle,
  startTime,
  meetLink,
}: {
  to: string
  teamName: string
  meetingTitle: string
  startTime: Date
  meetLink?: string
}) {
  try {
    await transporter.sendMail({
      from: `"Task Management" <${process.env.SMTP_FROM}>`,
      to,
      subject: `Meeting Reminder: ${meetingTitle}`,
      html: `
        <p>Hello,</p>
        <p>This is a friendly reminder about your upcoming meeting:</p>
        <div style="padding: 16px; background-color: #f3f4f6; border-radius: 8px; margin: 16px 0;">
          <h3 style="margin: 0 0 8px 0; color: #1e293b;">${meetingTitle}</h3>
          <p style="margin: 0; color: #64748b;">
            ${startTime.toLocaleString()}
          </p>
        </div>
        <p style="margin: 16px 0; font-size: 14px; color: #64748b;">
          This meeting is starting in 1 hour. Please be prepared to join.
        </p>
        ${meetLink ? `
          <p style="margin: 16px 0;">
            <a href="${meetLink}" style="padding: 10px 16px; background-color: #4f46e5; color: white; text-decoration: none; border-radius: 4px; display: inline-block;">
              Join Meeting
            </a>
          </p>
        ` : ''}
      `,
    })

    return { success: true }
  } catch (error) {
    console.error('Error sending meeting reminder email:', error)
    return { success: false, error }
  }
}