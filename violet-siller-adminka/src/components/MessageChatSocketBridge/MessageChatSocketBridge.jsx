import { useMessageChatSocketConnection } from '../../socket/useMessageChatSocket';
import { useSellerAuth } from '../../context/SellerAuthContext';

export default function MessageChatSocketBridge() {
  const { token, isAuthenticated } = useSellerAuth();

  useMessageChatSocketConnection(isAuthenticated && token ? token : null);

  return null;
}
