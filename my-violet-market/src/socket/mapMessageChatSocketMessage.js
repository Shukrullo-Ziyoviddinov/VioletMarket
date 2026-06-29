export function mapMessageChatSocketMessage(message) {
  if (!message) return null;

  return {
    id: String(message.id),
    sender: message.sender === 'user' ? 'customer' : 'seller',
    type: message.type,
    content: message.content,
    createdAt: message.createdAt,
    readByUser: Boolean(message.readByUser),
    readBySeller: Boolean(message.readBySeller),
  };
}
