import React from 'react';
import { useMessageChatDeleteShards } from '../../utils/messageChatDeleteShards';
import './MessageChatDeleteShatter.css';

export default function MessageChatDeleteShatter({ active = false, color = '#9b4fe7', seed = 1 }) {
  const shards = useMessageChatDeleteShards(active, seed);

  if (!active || shards.length === 0) return null;

  return (
    <div className="message-chat-delete-shatter" aria-hidden="true">
      {shards.map((shard) => (
        <span
          key={shard.id}
          className="message-chat-delete-shatter__piece"
          style={{
            left: `${shard.left}%`,
            top: `${shard.top}%`,
            width: `${shard.width}%`,
            height: `${shard.height}%`,
            backgroundColor: color,
            '--shard-tx': shard.tx,
            '--shard-ty': shard.ty,
            '--shard-rot': shard.rot,
            '--shard-delay': shard.delay,
            '--shard-drift': shard.drift,
          }}
        />
      ))}
    </div>
  );
}
