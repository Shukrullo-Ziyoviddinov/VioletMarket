export function isOwnChatMessage(message, viewerRole) {
  if (!message) return false;
  if (viewerRole === 'user') return message.sender === 'customer';
  if (viewerRole === 'seller') return message.sender === 'seller';
  return false;
}

export function isChatMessageReadByRecipient(message, viewerRole) {
  if (!message || !isOwnChatMessage(message, viewerRole)) return false;
  if (viewerRole === 'user') return Boolean(message.readBySeller);
  if (viewerRole === 'seller') return Boolean(message.readByUser);
  return false;
}

export function applyMessageChatReadUpdate(messages, payload) {
  if (!Array.isArray(messages) || !payload) return messages;

  const { readBy } = payload;
  if (readBy === 'seller') {
    return messages.map((message) =>
      message.sender === 'customer' ? { ...message, readBySeller: true } : message,
    );
  }

  if (readBy === 'user') {
    return messages.map((message) =>
      message.sender === 'seller' ? { ...message, readByUser: true } : message,
    );
  }

  return messages;
}
