const authConfig = require("../../config/auth");
const { HttpError } = require("../../utils/httpError");

let cachedSender = null;

async function fetchSendersFromBrevo() {
  const res = await fetch("https://api.brevo.com/v3/senders", {
    headers: { "api-key": authConfig.brevoApiKey },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data.message || `Brevo senders API xatosi (${res.status})`;
    throw new HttpError(503, msg, "BREVO_SENDERS_FAILED");
  }
  return Array.isArray(data.senders) ? data.senders : [];
}

/** .env dagi BREVO_SENDER_EMAIL yoki Brevo hisobidagi birinchi active sender */
async function resolveBrevoSender() {
  if (cachedSender) return cachedSender;

  const fromEnv = authConfig.brevoSenderEmail;
  if (fromEnv) {
    cachedSender = { email: fromEnv, name: authConfig.brevoSenderName };
    return cachedSender;
  }

  if (!authConfig.brevoApiKey) {
    throw new HttpError(503, "BREVO_API_KEY .env da yo'q", "BREVO_NOT_CONFIGURED");
  }

  const senders = await fetchSendersFromBrevo();
  const active = senders.find((s) => s.active && s.email);
  if (!active) {
    throw new HttpError(
      503,
      "Brevo da tasdiqlangan yuboruvchi email topilmadi. Brevo → Senders ni tekshiring.",
      "BREVO_NO_SENDER",
    );
  }

  cachedSender = {
    email: String(active.email).trim().toLowerCase(),
    name: active.name || authConfig.brevoSenderName,
  };
  console.log(`[Brevo] Yuboruvchi (avto): ${cachedSender.email}`);
  return cachedSender;
}

function clearBrevoSenderCache() {
  cachedSender = null;
}

module.exports = { resolveBrevoSender, clearBrevoSenderCache, fetchSendersFromBrevo };
