import React, { useEffect, useRef } from 'react';
import { DeleteOutlined, EditOutlined, MoreOutlined } from '@ant-design/icons';
import { Button } from 'antd';
import './ProductCardMenu.css';

export default function ProductCardMenu({
  isOpen = false,
  deleting = false,
  onToggle,
  onClose,
  onEdit,
  onDelete,
}) {
  const rootRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return undefined;

    const handlePointerDown = (event) => {
      if (!rootRef.current?.contains(event.target)) {
        onClose?.();
      }
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
    <div className="product-card-menu" ref={rootRef}>
      {isOpen ? (
        <div className="product-card-menu__dropdown" role="menu">
          <button
            type="button"
            role="menuitem"
            className="product-card-menu__item product-card-menu__item--danger"
            onClick={handleDelete}
            disabled={deleting}
          >
            <DeleteOutlined aria-hidden="true" />
            <span>{deleting ? "O'chirilmoqda..." : "O'chirish"}</span>
          </button>
          <button
            type="button"
            role="menuitem"
            className="product-card-menu__item"
            onClick={handleEdit}
            disabled={deleting}
          >
            <EditOutlined aria-hidden="true" />
            <span>Tahrirlash</span>
          </button>
        </div>
      ) : null}

      <Button
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
    </div>
  );
}
