export function mapMessageChatSocketMessage(message) {
  if (!message) return null;

  return {
    id: String(message.id),
    sender: message.sender === 'seller' ? 'seller' : 'customer',
    type: message.type,
    content: message.content,
    createdAt: message.createdAt,
  };
}
