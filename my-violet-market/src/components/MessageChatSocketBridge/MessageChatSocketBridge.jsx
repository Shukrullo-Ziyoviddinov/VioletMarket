import { useMessageChatSocketConnection } from '../socket/useMessageChatSocket';
import { useUser } from '../contexts/UserContext';

export default function MessageChatSocketBridge() {
  const { authToken, userData } = useUser();

  useMessageChatSocketConnection(
    userData?.isAuthenticated && authToken ? authToken : null,
  );

  return null;
}
