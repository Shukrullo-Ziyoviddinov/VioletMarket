import React from 'react';
import './ScrollArea.css';

export default function ScrollArea({ children, className = '' }) {
  const rootClassName = className ? `scroll-area ${className}` : 'scroll-area';

  return (
    <div className={rootClassName}>
      <div className="scroll-area__viewport">{children}</div>
    </div>
  );
}
