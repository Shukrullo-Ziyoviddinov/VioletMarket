import { useMessageChatSocketConnection } from '../../socket/useMessageChatSocket';
import { useSellerMessageChatSocketHub } from '../../socket/useSellerMessageChatSocketHub';
import { useSellerAuth } from '../../context/SellerAuthContext';

export default function MessageChatSocketBridge() {
  const { token, isAuthenticated } = useSellerAuth();
  const socketActive = isAuthenticated && Boolean(token);

  useMessageChatSocketConnection(socketActive ? token : null);
  useSellerMessageChatSocketHub(socketActive);

  return null;
}
