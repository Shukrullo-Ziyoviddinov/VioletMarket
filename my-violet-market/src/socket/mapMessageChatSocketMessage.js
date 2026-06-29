export function mapMessageChatSocketMessage(message) {
  if (!message) return null;

  const replyTo = message.replyTo?.messageId
    ? {
        messageId: String(message.replyTo.messageId),
        sender: message.replyTo.sender === 'user' ? 'customer' : message.replyTo.sender,
        type: message.replyTo.type,
        preview: String(message.replyTo.preview || ''),
      }
    : null;

  const sender =
    message.sender === 'user' || message.sender === 'customer' ? 'customer' : 'seller';

  return {
    id: String(message.id),
    sender,
    type: message.type,
    content: message.content,
    createdAt: message.createdAt,
    readByUser: Boolean(message.readByUser),
    readBySeller: Boolean(message.readBySeller),
    replyTo,
    editedAt: message.editedAt || null,
  };
}

export function mapMessageChatClientMessage(message) {
  if (!message) return null;
  if (message.sender === 'customer' || message.sender === 'seller') {
    return {
      ...message,
      id: String(message.id),
      replyTo: message.replyTo?.messageId
        ? {
            messageId: String(message.replyTo.messageId),
            sender: message.replyTo.sender,
            type: message.replyTo.type,
            preview: String(message.replyTo.preview || ''),
          }
        : null,
      editedAt: message.editedAt || null,
    };
  }
  return mapMessageChatSocketMessage(message);
}
