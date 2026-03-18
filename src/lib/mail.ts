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
    await resend.emails.send({
      from: 'Hoollow <notifications@hoollow.com>',
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
  } catch (error) {
    console.error('Error sending deletion email:', error);
  }
}
