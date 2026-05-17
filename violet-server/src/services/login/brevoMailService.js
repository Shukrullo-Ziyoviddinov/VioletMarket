const brevo = require("@getbrevo/brevo");
const authConfig = require("../../config/auth");
const { HttpError } = require("../../utils/httpError");
const { resolveBrevoSender } = require("./brevoSenderResolver");
const { buildOtpEmailText, buildOtpEmailHtml } = require("./otpEmailTemplate");

function getBrevoErrorMessage(err) {
  const body = err?.response?.body ?? err?.body;
  if (body && typeof body === "object" && body.message) return String(body.message);
  if (typeof body === "string" && body.trim()) return body;
  return err?.message || "Brevo email xatosi";
}

function buildEmailPayload(userEmail, otp, sender) {
  return {
    sender: { name: sender.name, email: sender.email },
    to: [{ email: userEmail }],
    subject: "Tasdiqlash kodi – Violet Market",
    textContent: buildOtpEmailText(otp),
    htmlContent: buildOtpEmailHtml(otp),
  };
}

async function sendOtpEmailViaRest(userEmail, otp, sender) {
  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": authConfig.brevoApiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(buildEmailPayload(userEmail, otp, sender)),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || `Brevo SMTP ${res.status}`);
  }
  return data;
}

async function sendOtpEmail(userEmail, otp) {
  if (!authConfig.brevoApiKey) {
    throw new HttpError(503, "BREVO_API_KEY .env da yo'q", "BREVO_NOT_CONFIGURED");
  }

  const sender = await resolveBrevoSender();
  const payload = buildEmailPayload(userEmail, otp, sender);

  try {
    const apiInstance = new brevo.TransactionalEmailsApi();
    apiInstance.setApiKey(
      brevo.TransactionalEmailsApiApiKeys.apiKey,
      authConfig.brevoApiKey,
    );
    if (brevo.SendSmtpEmail) {
      const email = new brevo.SendSmtpEmail();
      Object.assign(email, payload);
      await apiInstance.sendTransacEmail(email);
    } else {
      await apiInstance.sendTransacEmail(payload);
    }
  } catch (sdkErr) {
    console.warn("[Brevo] SDK:", getBrevoErrorMessage(sdkErr), "— REST orqali yuborilmoqda");
    try {
      await sendOtpEmailViaRest(userEmail, otp, sender);
    } catch (restErr) {
      console.error("[Brevo] REST:", restErr.message || restErr);
      throw new HttpError(503, restErr.message || "Email yuborilmadi", "BREVO_SEND_FAILED");
    }
  }
}

module.exports = { sendOtpEmail, buildOtpEmailText, buildOtpEmailHtml };
