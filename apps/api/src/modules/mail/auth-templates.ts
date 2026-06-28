function escape(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function layout(title: string, inner: string): string {
  return `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8" /><meta name="viewport" content="width=device-width,initial-scale=1" />
<title>${escape(title)}</title>
</head>
<body style="margin:0;padding:0;background:#f7f8fa;font-family:Inter,Arial,sans-serif;color:#0f141f;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:24px 0;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:10px;overflow:hidden;box-shadow:0 1px 3px rgba(15,23,42,0.08);">
        <tr><td style="background:#1f3458;padding:20px 28px;color:#ffffff;font-size:18px;font-weight:700;">
          Resources Unlimited
        </td></tr>
        <tr><td style="padding:28px;">${inner}</td></tr>
        <tr><td style="background:#0f141f;color:#bec5d4;padding:16px 28px;font-size:12px;">
          If you didn't expect this email, you can safely ignore it.
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

export function emailVerificationEmail(d: { name: string; url: string }): {
  subject: string;
  html: string;
  text: string;
} {
  const subject = 'Verify your email — Resources Unlimited';
  const html = layout(
    subject,
    `<h1 style="font-size:20px;margin:0 0 8px;">Hi ${escape(d.name)},</h1>
     <p style="font-size:14px;line-height:1.6;color:#404a5e;margin:0 0 16px;">
       Confirm your email address to finish setting up your Resources Unlimited account.
     </p>
     <p style="margin:0 0 24px;">
       <a href="${escape(d.url)}" style="display:inline-block;background:#1f3458;color:#ffffff;padding:12px 22px;border-radius:6px;font-weight:600;font-size:14px;text-decoration:none;">Verify Email</a>
     </p>
     <p style="font-size:12px;color:#5e687c;word-break:break-all;">${escape(d.url)}</p>`,
  );
  const text =
    `Hi ${d.name},\n\n` +
    `Confirm your email to activate your Resources Unlimited account:\n${d.url}\n`;
  return { subject, html, text };
}

export function passwordResetEmail(d: { name: string; url: string; ttlMinutes: number }): {
  subject: string;
  html: string;
  text: string;
} {
  const subject = 'Reset your password — Resources Unlimited';
  const html = layout(
    subject,
    `<h1 style="font-size:20px;margin:0 0 8px;">Hi ${escape(d.name)},</h1>
     <p style="font-size:14px;line-height:1.6;color:#404a5e;margin:0 0 16px;">
       We received a request to reset your password. The link is valid for ${d.ttlMinutes} minutes.
     </p>
     <p style="margin:0 0 24px;">
       <a href="${escape(d.url)}" style="display:inline-block;background:#1f3458;color:#ffffff;padding:12px 22px;border-radius:6px;font-weight:600;font-size:14px;text-decoration:none;">Reset Password</a>
     </p>
     <p style="font-size:12px;color:#5e687c;word-break:break-all;">${escape(d.url)}</p>
     <p style="font-size:13px;color:#5e687c;margin-top:18px;">
       If you didn't request this, you can ignore this email — your password won't change.
     </p>`,
  );
  const text =
    `Hi ${d.name},\n\n` +
    `Reset your password (valid for ${d.ttlMinutes} minutes):\n${d.url}\n\n` +
    `If you didn't request this, ignore this email.\n`;
  return { subject, html, text };
}
