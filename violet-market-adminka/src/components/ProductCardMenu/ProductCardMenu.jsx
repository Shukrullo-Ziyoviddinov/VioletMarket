import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  DeleteOutlined,
  EditOutlined,
  MoreOutlined,
  PauseCircleOutlined,
  PlayCircleOutlined,
} from '@ant-design/icons';
import { Button } from 'antd';
import './ProductCardMenu.css';

function ProductCardMenuDropdown({
  style,
  isPaused,
  deleting,
  togglingPause,
  pauseDisabled = false,
  pauseDisabledReason,
  onDelete,
  onEdit,
  onTogglePause,
}) {
  const pauseToggleDisabled = pauseDisabled || deleting || togglingPause;

  return (
    <div className="product-card-menu__dropdown" role="menu" style={style}>
      <button
        type="button"
        role="menuitem"
        className="product-card-menu__item product-card-menu__item--danger"
        onClick={onDelete}
        disabled={deleting || togglingPause}
      >
        <DeleteOutlined aria-hidden="true" />
        <span>{deleting ? "O'chirilmoqda..." : "O'chirish"}</span>
      </button>
      <button
        type="button"
        role="menuitem"
        className="product-card-menu__item"
        onClick={onEdit}
        disabled={deleting || togglingPause}
      >
        <EditOutlined aria-hidden="true" />
        <span>Tahrirlash</span>
      </button>
      <button
        type="button"
        role="menuitem"
        className={`product-card-menu__item${
          isPaused ? ' product-card-menu__item--activate' : ''
        }${pauseDisabled ? ' product-card-menu__item--pause-blocked' : ''}`}
        onClick={onTogglePause}
        disabled={pauseToggleDisabled}
        title={
          pauseDisabled
            ? pauseDisabledReason ||
              "Sotuvchi vaqtincha to'xtatilgan — mahsulotni alohida boshqarib bo'lmaydi"
            : undefined
        }
      >
        {isPaused ? (
          <PlayCircleOutlined aria-hidden="true" />
        ) : (
          <PauseCircleOutlined aria-hidden="true" />
        )}
        <span>
          {togglingPause
            ? 'Saqlanmoqda...'
            : isPaused
              ? 'Faollashtirish'
              : "Vaqtincha to'xtatish"}
        </span>
      </button>
    </div>
  );
}

export default function ProductCardMenu({
  isOpen = false,
  clientActive = true,
  deleting = false,
  togglingPause = false,
  pauseDisabled = false,
  pauseDisabledReason,
  onToggle,
  onClose,
  onEdit,
  onDelete,
  onTogglePause,
}) {
  const rootRef = useRef(null);
  const triggerRef = useRef(null);
  const [dropdownStyle, setDropdownStyle] = useState(null);
  const isPaused = clientActive === false;

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

  const handleEdit = () => {
    onClose?.();
    onEdit?.();
  };

  const handleDelete = () => {
    onClose?.();
    onDelete?.();
  };

  const handleTogglePause = () => {
    onClose?.();
    onTogglePause?.();
  };

  return (
    <div className="product-card-menu" ref={rootRef}>
      <Button
        ref={triggerRef}
        type="text"
        size="small"
        icon={<MoreOutlined />}
        className="product-card-menu__trigger"
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
            <ProductCardMenuDropdown
              style={dropdownStyle}
              isPaused={isPaused}
              deleting={deleting}
              togglingPause={togglingPause}
              pauseDisabled={pauseDisabled}
              pauseDisabledReason={pauseDisabledReason}
              onDelete={handleDelete}
              onEdit={handleEdit}
              onTogglePause={handleTogglePause}
            />,
            document.body,
          )
        : null}
    </div>
  );
}
