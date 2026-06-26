export function wrap(title: string, bodyHtml: string): string {
  return `<!doctype html><html lang="ru"><head><meta charset="utf-8"><title>${title}</title></head>
<body style="margin:0;padding:0;background:#f5f5f7;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#111;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f7;padding:24px 0;">
<tr><td align="center">
  <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.06);">
    <tr><td style="background:#9B1C1C;padding:20px 28px;color:#fff;font-weight:800;font-size:20px;letter-spacing:0.5px;">YURTA</td></tr>
    <tr><td style="padding:28px;font-size:15px;line-height:1.55;color:#222;">${bodyHtml}</td></tr>
    <tr><td style="padding:18px 28px;background:#fafafa;color:#888;font-size:12px;text-align:center;">© YURTA · Посуточная аренда в Казахстане</td></tr>
  </table>
</td></tr></table></body></html>`;
}

export const button = (href: string, label: string) =>
  `<a href="${href}" style="display:inline-block;background:#9B1C1C;color:#fff;text-decoration:none;padding:12px 22px;border-radius:999px;font-weight:600;font-size:14px;">${label}</a>`;
