import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { DeleteOutlined, EditOutlined, MoreOutlined } from '@ant-design/icons';
import { Button } from 'antd';
import './SellerProductCardMenu.css';

function SellerProductCardMenuDropdown({ style, onDelete, onEdit }) {
  return (
    <div className="seller-product-card-menu__dropdown" role="menu" style={style}>
      <button
        type="button"
        role="menuitem"
        className="seller-product-card-menu__item seller-product-card-menu__item--danger"
        onClick={onDelete}
      >
        <DeleteOutlined aria-hidden="true" />
        <span>O&apos;chirish</span>
      </button>
      <button
        type="button"
        role="menuitem"
        className="seller-product-card-menu__item"
        onClick={onEdit}
      >
        <EditOutlined aria-hidden="true" />
        <span>Tahrirlash</span>
      </button>
    </div>
  );
}

export default function SellerProductCardMenu({
  isOpen = false,
  onToggle,
  onClose,
  onEdit,
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
      if (target instanceof Element && target.closest('.seller-product-card-menu__dropdown')) return;
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

  const handleEdit = () => {
    onClose?.();
    onEdit?.();
  };

  const handleDelete = () => {
    onClose?.();
    onDelete?.();
  };

  return (
    <div className="seller-product-card-menu" ref={rootRef}>
      <Button
        ref={triggerRef}
        type="text"
        size="small"
        icon={<MoreOutlined />}
        className="seller-product-card-menu__trigger"
        aria-label="Ko'proq"
        aria-expanded={isOpen}
        onMouseDown={(event) => event.stopPropagation()}
        onClick={(event) => {
          event.stopPropagation();
          onToggle?.();
        }}
      />

      {isOpen && dropdownStyle
        ? createPortal(
            <SellerProductCardMenuDropdown
              style={dropdownStyle}
              onDelete={handleDelete}
              onEdit={handleEdit}
            />,
            document.body,
          )
        : null}
    </div>
  );
}
