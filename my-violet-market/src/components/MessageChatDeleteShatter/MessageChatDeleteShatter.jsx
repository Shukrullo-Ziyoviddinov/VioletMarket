import React, { useLayoutEffect, useState } from 'react';
import { createMessageChatDeleteShards } from '../../utils/messageChatDeleteShards';
import './MessageChatDeleteShatter.css';

const COLS = 7;
const ROWS = 5;

export default function MessageChatDeleteShatter({
  active = false,
  seed = 1,
  containerRef,
  children,
}) {
  const [size, setSize] = useState(null);
  const shards = active ? createMessageChatDeleteShards(seed, COLS, ROWS) : [];

  useLayoutEffect(() => {
    if (!active || !containerRef?.current) {
      setSize(null);
      return;
    }

    const node = containerRef.current;
    const { width, height } = node.getBoundingClientRect();
    setSize({ width, height });
  }, [active, containerRef, children]);

  if (!active || !size || shards.length === 0) return null;

  const pieceWidth = size.width / COLS;
  const pieceHeight = size.height / ROWS;

  return (
    <div
      className="message-chat-delete-shatter"
      style={{ width: size.width, height: size.height }}
      aria-hidden="true"
    >
      {shards.map((shard, index) => {
        const col = index % COLS;
        const row = Math.floor(index / COLS);

        return (
          <div
            key={shard.id}
            className="message-chat-delete-shatter__piece"
            style={{
              width: pieceWidth + 1,
              height: pieceHeight + 1,
              left: col * pieceWidth,
              top: row * pieceHeight,
              '--shard-tx': shard.tx,
              '--shard-ty': shard.ty,
              '--shard-rot': shard.rot,
              '--shard-delay': shard.delay,
            }}
          >
            <div
              className="message-chat-delete-shatter__mirror"
              style={{
                width: size.width,
                height: size.height,
                transform: `translate(${-col * pieceWidth}px, ${-row * pieceHeight}px)`,
              }}
            >
              {children}
            </div>
          </div>
        );
      })}
    </div>
  );
}
