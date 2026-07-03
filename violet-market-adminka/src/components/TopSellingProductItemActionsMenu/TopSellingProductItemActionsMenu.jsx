import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { CopyOutlined, MoreOutlined, ShopOutlined } from '@ant-design/icons';
import { Button } from 'antd';
import './TopSellingProductItemActionsMenu.css';

function TopSellingProductItemActionsDropdown({ style, onSellerClick, onCopyClick }) {
  return (
    <div className="top-selling-product-item-actions-menu__dropdown" role="menu" style={style}>
      <button
        type="button"
        role="menuitem"
        className="top-selling-product-item-actions-menu__item"
        onClick={onSellerClick}
      >
        <ShopOutlined aria-hidden="true" />
        <span>Sotuvchi</span>
      </button>
      <button
        type="button"
        role="menuitem"
        className="top-selling-product-item-actions-menu__item"
        onClick={onCopyClick}
      >
        <CopyOutlined aria-hidden="true" />
        <span>Nusxalash</span>
      </button>
    </div>
  );
}

export default function TopSellingProductItemActionsMenu({
  isOpen = false,
  onToggle,
  onClose,
  onSellerClick,
  onCopyClick,
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
      if (target instanceof Element && target.closest('.top-selling-product-item-actions-menu__dropdown')) {
        return;
      }
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

  const handleSellerClick = () => {
    onClose?.();
    onSellerClick?.();
  };

  const handleCopyClick = () => {
    onClose?.();
    onCopyClick?.();
  };

  return (
    <div className="top-selling-product-item-actions-menu" ref={rootRef}>
      <Button
        ref={triggerRef}
        type="text"
        size="small"
        icon={<MoreOutlined />}
        className="top-selling-product-item-actions-menu__trigger"
        aria-label="Mahsulot amallari"
        aria-expanded={isOpen}
        onMouseDown={(event) => event.stopPropagation()}
        onClick={(event) => {
          event.stopPropagation();
          onToggle?.();
        }}
      />

      {isOpen && dropdownStyle
        ? createPortal(
            <TopSellingProductItemActionsDropdown
              style={dropdownStyle}
              onSellerClick={handleSellerClick}
              onCopyClick={handleCopyClick}
            />,
            document.body,
          )
        : null}
    </div>
  );
}
