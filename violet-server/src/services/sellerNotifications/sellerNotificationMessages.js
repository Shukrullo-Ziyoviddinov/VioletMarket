function buildProductLabel(titles, itemCount) {
  const normalizedTitles = (Array.isArray(titles) ? titles : [])
    .map((value) => String(value || "").trim())
    .filter(Boolean);
  const count = Math.max(0, Number(itemCount) || normalizedTitles.length);

  if (normalizedTitles.length === 1) return normalizedTitles[0];
  if (normalizedTitles.length > 1) {
    return `${normalizedTitles[0]} va yana ${count - 1} ta mahsulot`;
  }
  if (count === 1) return "mahsulot";
  if (count > 1) return `${count} ta mahsulot`;
  return "mahsulot";
}

function buildSellerPaymentRequestApprovedMessage(productLabel) {
  const label = String(productLabel || "mahsulot").trim() || "mahsulot";
  return `Sizning ${label} uchun yuborgan so'rovingiz tasdiqlandi`;
}

function buildSellerPaymentRequestRejectedMessage(productLabel) {
  const label = String(productLabel || "mahsulot").trim() || "mahsulot";
  return `Sizning ${label} uchun yuborgan so'rovingiz rad etildi`;
}

function buildChatPreviewText(type, content) {
  const messageType = String(type || "text").trim();
  if (messageType === "image") return "Rasm yuborildi";
  if (messageType === "product") {
    const title = content?.title;
    if (title && typeof title === "object") {
      return String(title.uz || title.ru || "Mahsulot").trim() || "Mahsulot";
    }
    return String(title || "Mahsulot").trim() || "Mahsulot";
  }
  return String(content || "").trim();
}

function buildSellerChatMessageReceivedMessage(userName) {
  const name = String(userName || "Mijoz").trim() || "Mijoz";
  return `${name} sizga xabar yubordi`;
}

function buildSellerSupportChatMessageReceivedMessage() {
  return "Sizga yordam xizmati javob yozdi";
}

module.exports = {
  buildProductLabel,
  buildSellerPaymentRequestApprovedMessage,
  buildSellerPaymentRequestRejectedMessage,
  buildChatPreviewText,
  buildSellerChatMessageReceivedMessage,
  buildSellerSupportChatMessageReceivedMessage,
};
