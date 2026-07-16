function buildAdminPaymentRequestSubmittedMessage(sellerName) {
  const name = String(sellerName || "Sotuvchi").trim() || "Sotuvchi";
  return `${name} sizga pul yechishga so'rov yubordi`;
}

module.exports = {
  buildAdminPaymentRequestSubmittedMessage,
};
