import { Resend } from 'resend';

export async function sendDeletionEmail(email: string, deletionDate: Date) {
  if (!process.env.RESEND_API_KEY) {
    console.log(`[Resend Mock] Deletion email would be sent to ${email}. Deletion Date: ${deletionDate}`);
    return;
  }

  const resend = new Resend(process.env.RESEND_API_KEY);

  const dateString = deletionDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  try {
    const result = await resend.emails.send({
      from: 'Hoollow <no-reply@hoollow.com>',
      to: email,
      subject: 'Account Deletion Scheduled',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #ef4444;">Account Deletion Scheduled</h1>
          <p>We've received a request to delete your Hoollow account.</p>
          <p>Your account is now in a <strong>30-day grace period</strong>. It will be permanently deleted on <strong>${dateString}</strong>.</p>
          <p>If you didn't request this, or if you change your mind, you can cancel the deletion anytime before then by clicking the "KEEP MY ACCOUNT" button in the top bar of the application.</p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="color: #666; font-size: 12px;">This is an automated notification from Hoollow.</p>
        </div>
      `,
    });
    console.log('Deletion email sent successfully:', result);
  } catch (error: any) {
    console.error('Error sending deletion email:', error.message || error);
    if (error.response) console.error('Resend Response:', error.response.data);
  }
}

export async function sendOTPEmail(email: string, otp: string) {
  if (!process.env.RESEND_API_KEY) {
    console.log(`[Resend Mock] OTP email would be sent to ${email}. OTP: ${otp}`);
    return;
  }

  const resend = new Resend(process.env.RESEND_API_KEY);

  try {
    const result = await resend.emails.send({
      from: 'Hoollow <no-reply@hoollow.com>',
      to: email,
      subject: 'Your Account Deletion OTP',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #6366f1;">Verification Code</h1>
          <p>You requested to delete your Hoollow account. Please use the following One-Time Password (OTP) to verify this action:</p>
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #1f2937;">
            ${otp}
          </div>
          <p>This code will expire in 10 minutes.</p>
          <p style="color: #ef4444; font-weight: bold;">If you did not request this, please secure your account immediately.</p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="color: #666; font-size: 12px;">This is an automated notification from Hoollow.</p>
        </div>
      `,
    });
    console.log('OTP email sent successfully:', result);
  } catch (error: any) {
    console.error('Error sending OTP email:', error.message || error);
    if (error.response) console.error('Resend Response:', error.response.data);
  }
}
