import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { MoreOutlined, PauseCircleOutlined, PlayCircleOutlined } from '@ant-design/icons';
import { Button } from 'antd';
import '../ProductCardMenu/ProductCardMenu.css';
import './ApprovedSellerActionsMenu.css';

function ApprovedSellerActionsDropdown({ style, isPaused, togglingStatus, onToggleStatus }) {
  return (
    <div className="product-card-menu__dropdown" role="menu" style={style}>
      <button
        type="button"
        role="menuitem"
        className={`product-card-menu__item${
          isPaused
            ? ' approved-seller-actions-menu__item--activate'
            : ' approved-seller-actions-menu__item--pause'
        }`}
        onClick={onToggleStatus}
        disabled={togglingStatus}
      >
        {isPaused ? (
          <PlayCircleOutlined aria-hidden="true" />
        ) : (
          <PauseCircleOutlined aria-hidden="true" />
        )}
        <span>
          {togglingStatus
            ? 'Saqlanmoqda...'
            : isPaused
              ? 'Faollashtirish'
              : "Vaqtincha to'xtatish"}
        </span>
      </button>
    </div>
  );
}

export default function ApprovedSellerActionsMenu({
  isOpen = false,
  status = 'active',
  togglingStatus = false,
  onToggle,
  onClose,
  onToggleStatus,
}) {
  const rootRef = useRef(null);
  const triggerRef = useRef(null);
  const [dropdownStyle, setDropdownStyle] = useState(null);
  const isPaused = status === 'paused';

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

  const handleToggleStatus = () => {
    onClose?.();
    onToggleStatus?.();
  };

  return (
    <div className="product-card-menu approved-seller-actions-menu" ref={rootRef}>
      <Button
        ref={triggerRef}
        type="text"
        size="small"
        icon={<MoreOutlined />}
        className="approved-sellers-section__menu-btn product-card-menu__trigger"
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
            <ApprovedSellerActionsDropdown
              style={dropdownStyle}
              isPaused={isPaused}
              togglingStatus={togglingStatus}
              onToggleStatus={handleToggleStatus}
            />,
            document.body,
          )
        : null}
    </div>
  );
}
