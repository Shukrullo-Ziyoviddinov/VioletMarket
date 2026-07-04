import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { CopyOutlined, MoreOutlined } from '@ant-design/icons';
import { Button } from 'antd';
import { useTranslation } from 'react-i18next';
import './SellerTopSellingProductCopyMenu.css';

function SellerTopSellingProductCopyDropdown({ style, onCopyClick, copyLabel }) {
  return (
    <div className="seller-top-selling-product-copy-menu__dropdown" role="menu" style={style}>
      <button
        type="button"
        role="menuitem"
        className="seller-top-selling-product-copy-menu__item"
        onClick={onCopyClick}
      >
        <CopyOutlined aria-hidden="true" />
        <span>{copyLabel}</span>
      </button>
    </div>
  );
}

export default function SellerTopSellingProductCopyMenu({
  isOpen = false,
  onToggle,
  onClose,
  onCopyClick,
}) {
  const { t } = useTranslation();
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
      if (target instanceof Element && target.closest('.seller-top-selling-product-copy-menu__dropdown')) {
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

  const handleCopyClick = () => {
    onClose?.();
    onCopyClick?.();
  };

  return (
    <div className="seller-top-selling-product-copy-menu" ref={rootRef}>
      <Button
        ref={triggerRef}
        type="text"
        size="small"
        icon={<MoreOutlined />}
        className="seller-top-selling-product-copy-menu__trigger"
        aria-label={t('salesStatistics.topProducts.actionsLabel')}
        aria-expanded={isOpen}
        onMouseDown={(event) => event.stopPropagation()}
        onClick={(event) => {
          event.stopPropagation();
          onToggle?.();
        }}
      />

      {isOpen && dropdownStyle
        ? createPortal(
            <SellerTopSellingProductCopyDropdown
              style={dropdownStyle}
              onCopyClick={handleCopyClick}
              copyLabel={t('salesStatistics.topProducts.copyAction')}
            />,
            document.body,
          )
        : null}
    </div>
  );
}
