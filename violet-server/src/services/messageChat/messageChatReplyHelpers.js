function buildReplyPreview(message) {
  if (!message) return "";

  if (message.type === "text") {
    return String(message.content || "").trim().slice(0, 160);
  }

  if (message.type === "image") {
    return "Rasm";
  }

  if (message.type === "product") {
    const title = message.content?.title;
    return title ? String(title).trim().slice(0, 160) : "Mahsulot";
  }

  return "";
}

function mapReplyToClient(replyTo) {
  if (!replyTo?.messageId) return null;

  return {
    messageId: String(replyTo.messageId),
    sender: replyTo.sender === "seller" ? "seller" : "customer",
    type: replyTo.type,
    preview: String(replyTo.preview || ""),
  };
}

function mapReplyToSocket(replyTo) {
  if (!replyTo?.messageId) return null;

  return {
    messageId: String(replyTo.messageId),
    sender: replyTo.sender === "seller" ? "seller" : "user",
    type: replyTo.type,
    preview: String(replyTo.preview || ""),
  };
}

module.exports = {
  buildReplyPreview,
  mapReplyToClient,
  mapReplyToSocket,
};
