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

  return {
    id: String(message.id),
    sender: message.sender === 'user' ? 'customer' : 'seller',
    type: message.type,
    content: message.content,
    createdAt: message.createdAt,
    readByUser: Boolean(message.readByUser),
    readBySeller: Boolean(message.readBySeller),
    replyTo,
    editedAt: message.editedAt || null,
  };
}
