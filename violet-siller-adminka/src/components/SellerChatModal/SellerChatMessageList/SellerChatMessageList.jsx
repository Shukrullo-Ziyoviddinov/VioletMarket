import React, { useEffect, useRef } from 'react';
import SellerChatMessageBubble from '../SellerChatMessageBubble/SellerChatMessageBubble';
import './SellerChatMessageList.css';

export default function SellerChatMessageList({ messages = [] }) {
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="seller-chat-message-list" role="log" aria-live="polite">
      {messages.length === 0 ? (
        <p className="seller-chat-message-list__empty">Hozircha xabar yo&apos;q. Birinchi xabarni yozing.</p>
      ) : (
        messages.map((message) => (
          <SellerChatMessageBubble key={message.id} message={message} />
        ))
      )}
      <div ref={endRef} className="seller-chat-message-list__anchor" />
    </div>
  );
}
