interface QuoteItem {
  productSku: string;
  productName: string;
  quantity: number;
  notes?: string | null;
}

interface QuoteEmailData {
  number: string;
  companyName: string;
  contactName: string;
  contactEmail: string;
  contactPhone?: string | null;
  city?: string | null;
  province?: string | null;
  country?: string | null;
  notes?: string | null;
  trackingUrl: string;
  items: QuoteItem[];
}

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
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>${escape(title)}</title>
</head>
<body style="margin:0;padding:0;background:#f7f8fa;font-family:Inter,Arial,sans-serif;color:#0f141f;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f7f8fa;padding:24px 0;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:10px;overflow:hidden;box-shadow:0 1px 3px rgba(15,23,42,0.08);">
        <tr><td style="background:#1f3458;padding:20px 28px;color:#ffffff;">
          <div style="font-size:18px;font-weight:700;">Resources Unlimited</div>
          <div style="font-size:12px;opacity:0.85;">Authorized Canadian distributor of Grafico Packaging</div>
        </td></tr>
        <tr><td style="padding:28px;">
          ${inner}
        </td></tr>
        <tr><td style="background:#0f141f;color:#bec5d4;padding:16px 28px;font-size:12px;">
          Resources Unlimited &middot; sales@resourcesunlimited.ca &middot; +1 (800) 555-0199
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function itemsTable(items: QuoteItem[]): string {
  const rows = items
    .map(
      (it) => `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid #eef0f4;font-size:13px;color:#5e687c;">${escape(it.productSku)}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #eef0f4;font-size:13px;color:#0f141f;">${escape(it.productName)}${
        it.notes ? `<div style="color:#5e687c;font-size:12px;margin-top:2px;">${escape(it.notes)}</div>` : ''
      }</td>
      <td style="padding:10px 0;border-bottom:1px solid #eef0f4;font-size:13px;color:#0f141f;text-align:right;">${it.quantity}</td>
    </tr>`,
    )
    .join('');
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:16px;">
    <thead>
      <tr>
        <th align="left" style="font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:#5e687c;padding-bottom:6px;border-bottom:2px solid #1f3458;">SKU</th>
        <th align="left" style="font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:#5e687c;padding:0 12px 6px;border-bottom:2px solid #1f3458;">Description</th>
        <th align="right" style="font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:#5e687c;padding-bottom:6px;border-bottom:2px solid #1f3458;">Qty</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>`;
}

export function buyerConfirmationEmail(d: QuoteEmailData): { subject: string; html: string; text: string } {
  const subject = `We received your quote request — ${d.number}`;
  const html = layout(
    subject,
    `
    <h1 style="font-size:20px;margin:0 0 8px;">Thanks, ${escape(d.contactName)}.</h1>
    <p style="font-size:14px;line-height:1.6;color:#404a5e;margin:0 0 16px;">
      We received your quote request. Reference number <strong style="color:#0f141f;">${escape(d.number)}</strong>.
      A member of our sales team will reach out within one business day.
    </p>
    <p style="font-size:14px;line-height:1.6;color:#404a5e;margin:0 0 16px;">
      You can track the status of your request here:
    </p>
    <p style="margin:0 0 24px;">
      <a href="${escape(d.trackingUrl)}" style="display:inline-block;background:#1f3458;color:#ffffff;padding:12px 22px;border-radius:6px;font-weight:600;font-size:14px;text-decoration:none;">View Quote Status</a>
    </p>
    <h2 style="font-size:14px;text-transform:uppercase;letter-spacing:0.08em;color:#5e687c;margin:0 0 4px;">Items requested</h2>
    ${itemsTable(d.items)}
    ${d.notes ? `<p style="font-size:13px;color:#404a5e;margin-top:16px;"><strong>Your notes:</strong> ${escape(d.notes)}</p>` : ''}
    `,
  );
  const text =
    `Hi ${d.contactName},\n\n` +
    `Thanks for requesting a quote from Resources Unlimited. Reference: ${d.number}.\n\n` +
    `Track here: ${d.trackingUrl}\n\n` +
    `Items:\n` +
    d.items.map((it) => `- ${it.productSku} | ${it.productName} | qty ${it.quantity}`).join('\n') +
    `\n\n— Resources Unlimited`;
  return { subject, html, text };
}

export function salesNotificationEmail(d: QuoteEmailData): { subject: string; html: string; text: string } {
  const subject = `New quote request ${d.number} — ${d.companyName}`;
  const html = layout(
    subject,
    `
    <h1 style="font-size:20px;margin:0 0 8px;">New quote request</h1>
    <p style="font-size:14px;line-height:1.6;color:#404a5e;margin:0 0 12px;">
      <strong style="color:#0f141f;">${escape(d.number)}</strong> &middot; ${escape(d.companyName)}
    </p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:13px;color:#404a5e;line-height:1.6;">
      <tr><td>Contact:</td><td><strong style="color:#0f141f;">${escape(d.contactName)}</strong> &lt;${escape(d.contactEmail)}&gt;</td></tr>
      ${d.contactPhone ? `<tr><td>Phone:</td><td>${escape(d.contactPhone)}</td></tr>` : ''}
      ${
        d.city || d.province || d.country
          ? `<tr><td>Location:</td><td>${escape([d.city, d.province, d.country].filter(Boolean).join(', '))}</td></tr>`
          : ''
      }
    </table>
    ${itemsTable(d.items)}
    ${d.notes ? `<p style="font-size:13px;color:#404a5e;margin-top:16px;"><strong>Notes:</strong> ${escape(d.notes)}</p>` : ''}
    <p style="margin-top:18px;"><a href="${escape(d.trackingUrl)}" style="color:#1f3458;font-weight:600;">View on tracking page →</a></p>
    `,
  );
  const text =
    `New quote ${d.number}\n` +
    `Company: ${d.companyName}\n` +
    `Contact: ${d.contactName} <${d.contactEmail}>\n` +
    (d.contactPhone ? `Phone: ${d.contactPhone}\n` : '') +
    `\nItems:\n` +
    d.items.map((it) => `- ${it.productSku} | ${it.productName} | qty ${it.quantity}`).join('\n') +
    (d.notes ? `\n\nNotes: ${d.notes}` : '') +
    `\n\nTracking: ${d.trackingUrl}\n`;
  return { subject, html, text };
}

export function statusChangedEmail(d: {
  number: string;
  contactName: string;
  status: string;
  trackingUrl: string;
}): { subject: string; html: string; text: string } {
  const subject = `Quote ${d.number} — status updated to ${d.status}`;
  const html = layout(
    subject,
    `
    <h1 style="font-size:20px;margin:0 0 8px;">Quote update</h1>
    <p style="font-size:14px;line-height:1.6;color:#404a5e;margin:0 0 16px;">
      Hi ${escape(d.contactName)}, the status of quote
      <strong style="color:#0f141f;">${escape(d.number)}</strong> has changed to
      <strong style="color:#0f141f;">${escape(d.status)}</strong>.
    </p>
    <p style="margin:0 0 24px;">
      <a href="${escape(d.trackingUrl)}" style="display:inline-block;background:#1f3458;color:#ffffff;padding:12px 22px;border-radius:6px;font-weight:600;font-size:14px;text-decoration:none;">View Quote</a>
    </p>
    `,
  );
  const text = `Quote ${d.number} is now ${d.status}.\nView: ${d.trackingUrl}\n`;
  return { subject, html, text };
}
