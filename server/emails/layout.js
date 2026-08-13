/**
 * Base email layout — simple, responsive, inline-styled HTML that renders well
 * across email clients. All transactional emails use this shell.
 */
export function emailLayout({ title, bodyHtml }) {
  return `<!doctype html>
<html lang="en">
  <body style="margin:0;padding:0;background-color:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f1f5f9;padding:24px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">
            <tr>
              <td style="padding:0 16px 16px;" align="center">
                <span style="font-size:20px;font-weight:700;color:#1e3a8a;">🎓 Campus Connect</span>
              </td>
            </tr>
            <tr>
              <td style="background-color:#ffffff;border-radius:12px;padding:32px;box-shadow:0 1px 3px rgba(15,23,42,0.08);">
                <h1 style="margin:0 0 8px;font-size:20px;color:#0f172a;">${title}</h1>
                <div style="font-size:14px;line-height:1.7;color:#334155;">${bodyHtml}</div>
              </td>
            </tr>
            <tr>
              <td align="center" style="padding-top:16px;font-size:12px;color:#94a3b8;">
                Connect. Learn. Give Back. Grow Together.<br/>
                © ${new Date().getFullYear()} Campus Connect
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

/** Shared CTA button snippet. */
export const buttonHtml = (label, href) => `
  <table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0;">
    <tr>
      <td style="border-radius:8px;background-color:#2563eb;">
        <a href="${href}" style="display:inline-block;padding:12px 28px;border-radius:8px;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;">${label}</a>
      </td>
    </tr>
  </table>`;
