import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { InfoCircleOutlined, MoreOutlined } from '@ant-design/icons';
import { Button } from 'antd';
import './TopSellerItemActionsMenu.css';

function TopSellerItemActionsDropdown({ style, onInfoClick }) {
  return (
    <div className="top-seller-item-actions-menu__dropdown" role="menu" style={style}>
      <button
        type="button"
        role="menuitem"
        className="top-seller-item-actions-menu__item"
        onClick={onInfoClick}
      >
        <InfoCircleOutlined aria-hidden="true" />
        <span>Ma&apos;lumot</span>
      </button>
    </div>
  );
}

export default function TopSellerItemActionsMenu({
  isOpen = false,
  onToggle,
  onClose,
  onInfoClick,
}) {
  const rootRef = useRef(null);
  const triggerRef = useRef(null);
  const [dropdownStyle, setDropdownStyle] = useState(null);

  const updateDropdownPosition = () => {
    const trigger = triggerRef.current;
    if (!trigger) return;

    const rect = trigger.getBoundingClientRect();
    setDropdownStyle({
      position: 'fixed',
      top: rect.top - 8,
      left: rect.right,
      transform: 'translate(-100%, -100%)',
      zIndex: 1300,
    });
  };

  useLayoutEffect(() => {
    if (!isOpen) {
      setDropdownStyle(null);
      return undefined;
    }

    updateDropdownPosition();

    const handleReposition = () => updateDropdownPosition();
    window.addEventListener('resize', handleReposition);
    window.addEventListener('scroll', handleReposition, true);

    return () => {
      window.removeEventListener('resize', handleReposition);
      window.removeEventListener('scroll', handleReposition, true);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return undefined;

    const handlePointerDown = (event) => {
      const target = event.target;
      if (rootRef.current?.contains(target)) return;
      if (target instanceof Element && target.closest('.top-seller-item-actions-menu__dropdown')) return;
      onClose?.();
    };

    const frameId = window.requestAnimationFrame(() => {
      document.addEventListener('mousedown', handlePointerDown);
    });

    return () => {
      window.cancelAnimationFrame(frameId);
      document.removeEventListener('mousedown', handlePointerDown);
    };
  }, [isOpen, onClose]);

  const handleInfoClick = () => {
    onClose?.();
    onInfoClick?.();
  };

  return (
    <div className="top-seller-item-actions-menu" ref={rootRef}>
      <Button
        ref={triggerRef}
        type="text"
        size="small"
        icon={<MoreOutlined />}
        className="top-seller-item-actions-menu__trigger"
        aria-label="Sotuvchi amallari"
        aria-expanded={isOpen}
        onMouseDown={(event) => event.stopPropagation()}
        onClick={(event) => {
          event.stopPropagation();
          onToggle?.();
        }}
      />

      {isOpen && dropdownStyle
        ? createPortal(
            <TopSellerItemActionsDropdown style={dropdownStyle} onInfoClick={handleInfoClick} />,
            document.body,
          )
        : null}
    </div>
  );
}
