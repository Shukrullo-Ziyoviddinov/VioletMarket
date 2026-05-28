import React, { useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { getPortalContainer } from '../../utils/utils';
import { useTranslation } from 'react-i18next';
import './ProfileExit.css';

const ProfileExit = ({ isOpen, onClose, onConfirm }) => {
  const { t } = useTranslation();
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsClosing(false);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleClose = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
    }, 300);
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyPress = (e) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [isOpen, handleClose]);

  const handleConfirm = () => {
    setIsClosing(true);
    setTimeout(() => {
      onConfirm();
      onClose();
      setIsClosing(false);
    }, 300);
  };

  if (!isOpen && !isClosing) return null;

  const modalContent = (
    <div
      className={`profile-exit-overlay ${isClosing ? 'close' : 'open'}`}
      onClick={handleClose}
      role="presentation"
    >
      <div
        className={`profile-exit-content ${isClosing ? 'close' : 'open'}`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="profile-exit-title"
      >
        <div className="profile-exit-body">
          <div className="profile-exit-icon" aria-hidden="true">
            <i className="bx bx-log-out" />
          </div>
          <h3 id="profile-exit-title">{t('profile.logoutConfirmTitle')}</h3>
        </div>
        <div className="profile-exit-actions">
          <button type="button" className="profile-exit-btn-no" onClick={handleClose}>
            {t('profile.logoutConfirmNo')}
          </button>
          <button type="button" className="profile-exit-btn-yes" onClick={handleConfirm}>
            {t('profile.logoutConfirmYes')}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, getPortalContainer());
};

export default ProfileExit;
