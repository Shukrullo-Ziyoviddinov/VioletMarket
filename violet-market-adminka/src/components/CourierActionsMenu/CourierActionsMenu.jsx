import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { DeleteOutlined, MessageOutlined, MoreOutlined, ShoppingCartOutlined } from '@ant-design/icons';
import { Button } from 'antd';
import '../ProductCardMenu/ProductCardMenu.css';

function CourierActionsDropdown({ style, deleting, onChat, onOrders, onDelete }) {
  return (
    <div className="product-card-menu__dropdown" role="menu" style={style}>
      <button
        type="button"
        role="menuitem"
        className="product-card-menu__item"
        onClick={onChat}
        disabled={deleting}
      >
        <MessageOutlined aria-hidden="true" />
        <span>Chat</span>
      </button>
      <button
        type="button"
        role="menuitem"
        className="product-card-menu__item"
        onClick={onOrders}
        disabled={deleting}
      >
        <ShoppingCartOutlined aria-hidden="true" />
        <span>Buyurtmalar</span>
      </button>
      <button
        type="button"
        role="menuitem"
        className="product-card-menu__item product-card-menu__item--danger"
        onClick={onDelete}
        disabled={deleting}
      >
        <DeleteOutlined aria-hidden="true" />
        <span>{deleting ? "O'chirilmoqda..." : "O'chirish"}</span>
      </button>
    </div>
  );
}

export default function CourierActionsMenu({
  isOpen = false,
  deleting = false,
  onToggle,
  onClose,
  onChat,
  onOrders,
  onDelete,
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
      if (target instanceof Element && target.closest('.product-card-menu__dropdown')) return;
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

  return (
    <div className="product-card-menu" ref={rootRef}>
      <Button
        ref={triggerRef}
        type="text"
        size="small"
        icon={<MoreOutlined />}
        className="product-card-menu__trigger"
        aria-label="Kuryer amallari"
        aria-expanded={isOpen}
        onMouseDown={(event) => event.stopPropagation()}
        onClick={(event) => {
          event.stopPropagation();
          onToggle?.();
        }}
      />

      {isOpen && dropdownStyle
        ? createPortal(
            <CourierActionsDropdown
              style={dropdownStyle}
              deleting={deleting}
              onChat={() => {
                onClose?.();
                onChat?.();
              }}
              onOrders={() => {
                onClose?.();
                onOrders?.();
              }}
              onDelete={() => {
                onClose?.();
                onDelete?.();
              }}
            />,
            document.body,
          )
        : null}
    </div>
  );
}
