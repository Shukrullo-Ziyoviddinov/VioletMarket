export type SupportChatSender = 'courier' | 'admin';
export type SupportChatMessageType = 'text' | 'image';

export type SupportChatMessage = {
  id: string;
  deliveryId: string;
  sender: SupportChatSender;
  type: SupportChatMessageType;
  content: string;
  readByCourier: boolean;
  readByAdmin: boolean;
  createdAt: string;
  updatedAt?: string;
};
