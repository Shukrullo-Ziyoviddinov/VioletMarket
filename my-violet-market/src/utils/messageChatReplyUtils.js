export function getMessagePreviewText(message) {
  if (!message) return '';

  if (message.type === 'text') {
    return String(message.content || '').trim();
  }

  if (message.type === 'image') {
    return 'Rasm';
  }

  if (message.type === 'product') {
    const title = message.content?.title;
    return title ? String(title).trim() : 'Mahsulot';
  }

  return '';
}

export function buildReplyToPayload(message) {
  if (!message?.id) return null;

  return {
    messageId: String(message.id),
    sender: message.sender === 'customer' ? 'user' : message.sender,
    type: message.type,
    preview: getMessagePreviewText(message).slice(0, 160),
  };
}
