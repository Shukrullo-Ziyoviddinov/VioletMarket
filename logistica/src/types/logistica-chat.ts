export type LogisticaChatSender = 'logistica' | 'admin';
export type LogisticaChatMessageType = 'text' | 'image';

export type LogisticaChatMessage = {
  id: string;
  logisticaId: string;
  sender: LogisticaChatSender;
  type: LogisticaChatMessageType;
  content: string;
  readByLogistica: boolean;
  readByAdmin: boolean;
  createdAt: string;
  updatedAt?: string;
};
