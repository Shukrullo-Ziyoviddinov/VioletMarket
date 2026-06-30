import React from 'react';
import { SkeletonPulse } from '../SkeletonLoader';
import '../ChatsThreadItem/ChatsThreadItem.css';
import './ChatsThreadList.css';

export default function ChatsThreadListSkeleton({ count = 5 }) {
  return (
    <div
      className="chats-thread-list chats-thread-list--skeleton"
      aria-busy="true"
      aria-label="Chatlar yuklanmoqda"
    >
      {Array.from({ length: count }).map((_, index) => (
        <div key={`chats-thread-sk-${index}`} className="chats-thread-item-wrap">
          <div className="chats-thread-item chats-thread-item--skeleton" aria-hidden="true">
            <SkeletonPulse className="chats-thread-item__avatar chats-thread-item__avatar--skeleton" />
            <div className="chats-thread-item__body">
              <div className="chats-thread-item__top">
                <div className="chats-thread-item__title-row">
                  <SkeletonPulse className="chats-thread-item__sk chats-thread-item__sk--name" />
                  <SkeletonPulse className="chats-thread-item__sk chats-thread-item__sk--status" />
                </div>
                <SkeletonPulse className="chats-thread-item__sk chats-thread-item__sk--time" />
              </div>
              <div className="chats-thread-item__bottom">
                <SkeletonPulse className="chats-thread-item__sk chats-thread-item__sk--preview" />
                <SkeletonPulse className="chats-thread-item__sk chats-thread-item__sk--meta" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
