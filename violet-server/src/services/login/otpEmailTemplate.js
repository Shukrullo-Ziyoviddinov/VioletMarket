const authConfig = require("../../config/auth");

const LOGO_PATH = "/img/vio_preview_rev_1%20(1).png";

function getEmailLogoUrl() {
  const base = authConfig.publicSiteUrl;
  if (!base) return null;
  return `${base}${LOGO_PATH}`;
}

function buildOtpEmailText(otp) {
  return `Assalomu alaykum

Violet Market platformasida ro'yxatdan o'tish yoki kirish uchun tasdiqlash kodingiz:

Kod: ${otp}

Bu kod faqat 1 daqiqa davomida amal qiladi.

Agar siz bu amalni bajarmagan bo'lsangiz, bu xabarni e'tiborsiz qoldiring.

Hurmat bilan,
Violet Market jamoasi`;
}

function buildOtpEmailHtml(otp) {
  const logoUrl = getEmailLogoUrl();
  const logoBlock = logoUrl
    ? `<tr>
        <td align="center" style="padding:0 0 24px;">
          <img src="${logoUrl}" alt="Violet Market" width="140" style="display:block;max-width:140px;height:auto;border:0;" />
        </td>
      </tr>`
    : `<tr>
        <td align="center" style="padding:0 0 20px;font-size:22px;font-weight:700;color:#4c5fd5;">
          Violet Market
        </td>
      </tr>`;

  return `<!DOCTYPE html>
<html lang="uz">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Tasdiqlash kodi</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f8;font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f4f8;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:480px;background:#ffffff;border-radius:16px;padding:32px 28px;">
          ${logoBlock}
          <tr>
            <td style="font-size:16px;line-height:1.5;color:#333;padding-bottom:12px;">
              Assalomu alaykum 👋
            </td>
          </tr>
          <tr>
            <td style="font-size:15px;line-height:1.55;color:#555;padding-bottom:20px;">
              Violet Market platformasida ro'yxatdan o'tish yoki kirish uchun tasdiqlash kodingiz:
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:8px 0 20px;">
              <span style="display:inline-block;font-size:28px;font-weight:700;letter-spacing:6px;color:#022ff9;background:#eef0ff;padding:14px 24px;border-radius:12px;">
                ${otp}
              </span>
            </td>
          </tr>
          <tr>
            <td style="font-size:13px;line-height:1.5;color:#888;padding-bottom:8px;">
              ⏱ Bu kod faqat <strong>1 daqiqa</strong> davomida amal qiladi.
            </td>
          </tr>
          <tr>
            <td style="font-size:13px;line-height:1.5;color:#888;">
              Agar siz bu amalni bajarmagan bo'lsangiz, bu xabarni e'tiborsiz qoldiring.
            </td>
          </tr>
          <tr>
            <td style="font-size:14px;line-height:1.5;color:#333;padding-top:24px;">
              Hurmat bilan,<br />
              <strong>Violet Market</strong> jamoasi
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

module.exports = {
  buildOtpEmailText,
  buildOtpEmailHtml,
  getEmailLogoUrl,
};
