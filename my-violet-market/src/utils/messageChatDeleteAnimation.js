export const MESSAGE_CHAT_DELETE_ANIMATION_MS = 1200;

export function waitMessageChatDeleteAnimation() {
  return new Promise((resolve) => {
    setTimeout(resolve, MESSAGE_CHAT_DELETE_ANIMATION_MS);
  });
}
