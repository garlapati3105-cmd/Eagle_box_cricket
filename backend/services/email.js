const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * Send booking lead notification email to owner
 */
async function sendLeadNotification(lead) {
  const ownerEmail = process.env.OWNER_EMAIL;
  if (!ownerEmail || !process.env.EMAIL_USER) {
    console.warn('⚠️ Email not configured, skipping notification');
    return { success: false, reason: 'email_not_configured' };
  }

  const sportEmoji = { Cricket: '🏏', Football: '⚽', Badminton: '🏸' };
  const emoji = sportEmoji[lead.sport_type] || '🏟️';

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 30px auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #1a472a 0%, #2d6a4f 100%); padding: 32px; text-align: center; }
    .header h1 { color: #f5a623; margin: 0; font-size: 24px; }
    .header p { color: rgba(255,255,255,0.8); margin: 8px 0 0; }
    .badge { display: inline-block; background: #f5a623; color: #1a472a; padding: 4px 14px; border-radius: 20px; font-weight: 700; font-size: 13px; margin-top: 12px; }
    .body { padding: 32px; }
    .alert { background: #fff8e1; border-left: 4px solid #f5a623; padding: 16px; border-radius: 6px; margin-bottom: 24px; }
    .alert strong { color: #1a472a; }
    .detail-row { display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid #f0f0f0; }
    .detail-row:last-child { border-bottom: none; }
    .detail-label { color: #666; font-size: 14px; }
    .detail-value { color: #1a472a; font-weight: 600; font-size: 15px; }
    .cta { background: #1a472a; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; display: inline-block; margin-top: 24px; font-weight: 600; }
    .footer { background: #f5f5f5; padding: 20px; text-align: center; color: #999; font-size: 12px; }
    .quality-badge { padding: 4px 12px; border-radius: 20px; font-size: 13px; font-weight: 600; }
    .quality-high { background: #d4edda; color: #155724; }
    .quality-normal { background: #d1ecf1; color: #0c5460; }
    .quality-low { background: #f8d7da; color: #721c24; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🦅 Eagle Box Cricket</h1>
      <p>New Booking Lead Received!</p>
      <div class="badge">${emoji} ${lead.sport_type || 'Cricket'} Booking</div>
    </div>
    <div class="body">
      <div class="alert">
        <strong>⚡ Action Required:</strong> A customer has shown interest in booking. Please contact them within 30 minutes for best conversion!
      </div>

      <h3 style="color: #1a472a; margin: 0 0 16px;">Customer Details</h3>
      
      <div class="detail-row">
        <span class="detail-label">👤 Name</span>
        <span class="detail-value">${lead.name}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">📱 Phone</span>
        <span class="detail-value"><a href="tel:${lead.phone}" style="color: #1a472a;">${lead.phone}</a></span>
      </div>
      ${lead.email ? `
      <div class="detail-row">
        <span class="detail-label">📧 Email</span>
        <span class="detail-value">${lead.email}</span>
      </div>
      ` : ''}
      <div class="detail-row">
        <span class="detail-label">${emoji} Sport</span>
        <span class="detail-value">${lead.sport_type || 'Cricket'}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">📅 Preferred Date</span>
        <span class="detail-value">${lead.preferred_date || 'Not specified'}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">🕐 Preferred Slot</span>
        <span class="detail-value">${lead.preferred_slot || 'Not specified'}</span>
      </div>
      ${lead.team_size ? `
      <div class="detail-row">
        <span class="detail-label">👥 Team Size</span>
        <span class="detail-value">${lead.team_size} players</span>
      </div>
      ` : ''}
      <div class="detail-row">
        <span class="detail-label">⭐ Lead Quality</span>
        <span class="detail-value">
          <span class="quality-badge quality-${lead.lead_quality || 'normal'}">${(lead.lead_quality || 'Normal').toUpperCase()}</span>
        </span>
      </div>
      <div class="detail-row">
        <span class="detail-label">🏷️ Customer Type</span>
        <span class="detail-value">${lead.customer_type || 'Casual'}</span>
      </div>
      ${lead.message ? `
      <div style="margin-top: 16px; padding: 12px; background: #f9f9f9; border-radius: 8px;">
        <p style="margin: 0 0 4px; color: #666; font-size: 13px;">Customer Message:</p>
        <p style="margin: 0; color: #333;">"${lead.message}"</p>
      </div>
      ` : ''}

      <a href="tel:${lead.phone}" class="cta">📞 Call Customer Now</a>
    </div>
    <div class="footer">
      This notification was sent by Eagle Box Cricket AI Assistant<br>
      Lead ID: ${lead.id || 'N/A'} | ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST
    </div>
  </div>
</body>
</html>
  `;

  try {
    await transporter.sendMail({
      from: `"Eagle Box Cricket AI" <${process.env.EMAIL_USER}>`,
      to: ownerEmail,
      subject: `🏏 New Booking Lead: ${lead.name} (${lead.sport_type || 'Cricket'}) — ${lead.preferred_slot || 'Slot TBD'}`,
      html: htmlContent,
      text: `New Booking Lead\n\nName: ${lead.name}\nPhone: ${lead.phone}\nSport: ${lead.sport_type}\nSlot: ${lead.preferred_slot}\nDate: ${lead.preferred_date}\n\nPlease contact the customer soon.`,
    });

    console.log(`✅ Lead notification email sent to ${ownerEmail}`);
    return { success: true };
  } catch (error) {
    console.error('❌ Failed to send email:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Send confirmation message to customer (if email provided)
 */
async function sendCustomerConfirmation(lead) {
  if (!lead.email || !process.env.EMAIL_USER) return;

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 30px auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #1a472a 0%, #2d6a4f 100%); padding: 32px; text-align: center; }
    .header h1 { color: #f5a623; margin: 0; font-size: 24px; }
    .body { padding: 32px; }
    .success-box { background: #d4edda; border-left: 4px solid #28a745; padding: 16px; border-radius: 6px; margin-bottom: 24px; color: #155724; }
    .footer { background: #f5f5f5; padding: 20px; text-align: center; color: #999; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🦅 Eagle Box Cricket</h1>
      <p style="color: rgba(255,255,255,0.8); margin: 8px 0 0;">Booking Request Received!</p>
    </div>
    <div class="body">
      <div class="success-box">
        ✅ Hi ${lead.name}! We've received your booking request for <strong>${lead.sport_type}</strong> on <strong>${lead.preferred_slot}</strong>.
      </div>
      <p>Our team will call you at <strong>${lead.phone}</strong> within <strong>30 minutes</strong> to confirm your booking and share payment details.</p>
      <p style="color: #666;">📍 Eagle Box Cricket, Vijayawada | ⏰ Open 6 AM – 11 PM</p>
    </div>
    <div class="footer">Eagle Box Cricket | Vijayawada, Andhra Pradesh</div>
  </div>
</body>
</html>
  `;

  try {
    await transporter.sendMail({
      from: `"Eagle Box Cricket" <${process.env.EMAIL_USER}>`,
      to: lead.email,
      subject: `✅ Booking Request Received — Eagle Box Cricket`,
      html: htmlContent,
    });
  } catch (error) {
    console.error('⚠️ Customer confirmation email failed:', error.message);
  }
}

/**
 * Send official confirmation email to customer once approved by admin
 */
async function sendOfficialConfirmation(lead) {
  if (!lead.email || !process.env.EMAIL_USER) return;

  const sportEmoji = { Cricket: '🏏', Football: '⚽', Badminton: '🏸' };
  const emoji = sportEmoji[lead.sport_type] || '🏟️';

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 30px auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #1a472a 0%, #2d6a4f 100%); padding: 36px; text-align: center; }
    .header h1 { color: #f5a623; margin: 0; font-size: 26px; }
    .header p { color: rgba(255,255,255,0.9); margin: 8px 0 0; font-size: 15px; }
    .badge { display: inline-block; background: #28a745; color: white; padding: 6px 16px; border-radius: 20px; font-weight: 700; font-size: 13px; margin-top: 12px; }
    .body { padding: 32px; }
    .success-box { background: #d4edda; border-left: 4px solid #28a745; padding: 18px; border-radius: 8px; margin-bottom: 24px; color: #155724; font-size: 15px; line-height: 1.5; }
    .detail-row { display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid #f0f0f0; }
    .detail-row:last-child { border-bottom: none; }
    .detail-label { color: #666; font-size: 14px; }
    .detail-value { color: #1a472a; font-weight: 700; font-size: 15px; }
    .rules-card { background: #f8f9fa; border: 1px solid #e9ecef; border-radius: 8px; padding: 20px; margin-top: 24px; }
    .rules-card h3 { color: #1a472a; margin: 0 0 12px; font-size: 15px; }
    .rules-list { margin: 0; padding-left: 20px; color: #555; font-size: 13px; line-height: 1.6; }
    .footer { background: #f5f5f5; padding: 20px; text-align: center; color: #999; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🦅 Eagle Box Cricket</h1>
      <p>Booking Confirmed Successfully!</p>
      <div class="badge">🎉 Booking Confirmed</div>
    </div>
    <div class="body">
      <div class="success-box">
        <strong>Great news, ${lead.name}!</strong> Your booking for <strong>${lead.sport_type}</strong> has been officially confirmed by our admin team! Your slot is now locked and ready.
      </div>

      <h3 style="color: #1a472a; margin: 0 0 16px; font-size: 16px; border-bottom: 2px solid #1a472a; padding-bottom: 6px;">Booking Details</h3>
      
      <div class="detail-row">
        <span class="detail-label">👤 Name</span>
        <span class="detail-value">${lead.name}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">📱 Phone</span>
        <span class="detail-value">${lead.phone}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">${emoji} Sport</span>
        <span class="detail-value">${lead.sport_type || 'Cricket'}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">📅 Date</span>
        <span class="detail-value">${lead.preferred_date || 'Not specified'}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">🕐 Time Slot</span>
        <span class="detail-value">${lead.preferred_slot || 'Not specified'}</span>
      </div>
      ${lead.team_size ? `
      <div class="detail-row">
        <span class="detail-label">👥 Team Size</span>
        <span class="detail-value">${lead.team_size} players</span>
      </div>
      ` : ''}

      <div class="rules-card">
        <h3>📋 Venue Guidelines & Rules</h3>
        <ul class="rules-list">
          <li><strong>Sports shoes are mandatory</strong> inside the playing area.</li>
          <li>Kindly arrive <strong>10 minutes prior</strong> to your time slot.</li>
          <li>No smoking or alcohol is strictly permitted inside the venue.</li>
          <li>Outside food is not allowed in the playing arena.</li>
        </ul>
      </div>

      <p style="margin-top: 24px; font-size: 13px; color: #666; text-align: center;">
        📍 <strong>Location:</strong> Plot No. 45, Near Bus Stand, Vijayawada, AP (Free Parking Available 🚗)
      </p>
    </div>
    <div class="footer">
      Thank you for booking with Eagle Box Cricket!<br>
      For urgent queries, call us at +91 98765 43210
    </div>
  </div>
</body>
</html>
  `;

  try {
    await transporter.sendMail({
      from: `"Eagle Box Cricket" <${process.env.EMAIL_USER}>`,
      to: lead.email,
      subject: `🎉 Booking Confirmed — Eagle Box Cricket (${lead.sport_type || 'Cricket'})`,
      html: htmlContent,
    });
    console.log(`✅ Official confirmation email sent successfully to ${lead.email}`);
  } catch (error) {
    console.error('⚠️ Customer official confirmation email failed:', error.message);
  }
}

module.exports = { sendLeadNotification, sendCustomerConfirmation, sendOfficialConfirmation };

