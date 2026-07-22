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

module.exports = {
  buildAdminPaymentRequestSubmittedMessage,
  buildAdminReturnRequestSubmittedMessage,
};
