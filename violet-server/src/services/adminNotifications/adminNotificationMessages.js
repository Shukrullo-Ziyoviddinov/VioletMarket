function buildAdminPaymentRequestSubmittedMessage(sellerName) {
  const name = String(sellerName || "Sotuvchi").trim() || "Sotuvchi";
  return `${name} sizga pul yechishga so'rov yubordi`;
}

function buildAdminReturnRequestSubmittedMessage({ courierName, productCode }) {
  const courier = String(courierName || "Kuryer").trim() || "Kuryer";
  const code = String(productCode || "").trim();
  if (code) {
    return `${courier} Ajdaniya so‘rovi yubordi (kod: ${code})`;
  }
  return `${courier} Ajdaniya so‘rovi yubordi`;
}

function buildAdminSellerSupportChatMessage(sellerName) {
  const name = String(sellerName || "Sotuvchi").trim() || "Sotuvchi";
  return `${name} sizga yordam chatida xabar yozdi`;
}

function buildAdminLogisticaChatMessage(logisticaName) {
  const name = String(logisticaName || "Logistica").trim() || "Logistica";
  return `${name} sizga chatda xabar yozdi`;
}

function buildAdminCourierChatMessage(courierName) {
  const name = String(courierName || "Kuryer").trim() || "Kuryer";
  return `${name} sizga chatda xabar yozdi`;
}

module.exports = {
  buildAdminPaymentRequestSubmittedMessage,
  buildAdminReturnRequestSubmittedMessage,
  buildAdminSellerSupportChatMessage,
  buildAdminLogisticaChatMessage,
  buildAdminCourierChatMessage,
};
