import React, { useRef, useState, useLayoutEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import GlobalModal from '../GlobalModal';
import './GlobalMore.css';

/** Ko'p qator rejimida DOM bo'yicha */
const MIN_CHARS_FOR_MORE = 72;

const getDefaultMaxPreviewChars = () => {
  if (typeof window === 'undefined') return 52;
  const w = window.innerWidth;
  if (w <= 360) return 34;
  if (w <= 420) return 40;
  if (w <= 520) return 46;
  if (w <= 768) return 52;
  return 64;
};

/**
 * Uzun matn: 1 qator — boshidagi matn + "..." + "yana" (to'liq matn modalda).
 * lineClamp > 1 — -webkit-line-clamp.
 */
const GlobalMore = ({ text, className = '', modalTitle, lineClamp = 1, maxPreviewChars }) => {
  const { t, i18n } = useTranslation();
  const previewRef = useRef(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [isMultiTruncated, setIsMultiTruncated] = useState(false);
  const [singleLimit, setSingleLimit] = useState(getDefaultMaxPreviewChars);

  const plain = text == null ? '' : String(text).trim();

  const { previewPlain, canOpenModal, showSingleTail } = useMemo(() => {
    if (!plain) {
      return { previewPlain: '', canOpenModal: false, showSingleTail: false };
    }
    if (lineClamp === 1) {
      const limit = maxPreviewChars ?? singleLimit;
      const moreLabel = t('seller.previewMore');
      const reserve = moreLabel.length + 5;
      if (plain.length > limit) {
        const headLen = Math.max(12, limit - reserve);
        return {
          previewPlain: plain.slice(0, headLen),
          canOpenModal: true,
          showSingleTail: true,
        };
      }
      return { previewPlain: plain, canOpenModal: false, showSingleTail: false };
    }
    return {
      previewPlain: plain,
      canOpenModal: isMultiTruncated || plain.length >= MIN_CHARS_FOR_MORE,
      showSingleTail: false,
    };
  }, [plain, lineClamp, maxPreviewChars, singleLimit, isMultiTruncated, t, i18n.language]);

  useLayoutEffect(() => {
    if (typeof window === 'undefined') return;
    if (lineClamp === 1 && maxPreviewChars == null) {
      const onResize = () => setSingleLimit(getDefaultMaxPreviewChars());
      onResize();
      window.addEventListener('resize', onResize);
      return () => window.removeEventListener('resize', onResize);
    }
  }, [lineClamp, maxPreviewChars]);

  useLayoutEffect(() => {
    if (lineClamp === 1 || !plain) {
      setIsMultiTruncated(false);
      return;
    }

    const el = previewRef.current;
    if (!el) return;

    const measure = () => {
      const h = el.clientHeight;
      setIsMultiTruncated(h > 0 && el.scrollHeight > h + 2);
    };

    measure();
    const rafId = requestAnimationFrame(() => {
      requestAnimationFrame(measure);
    });

    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(measure) : null;
    if (ro) ro.observe(el);
    window.addEventListener('resize', measure);
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', measure);
      if (ro) ro.disconnect();
    };
  }, [plain, lineClamp]);

  if (!plain) return null;

  const openModal = () => {
    if (canOpenModal) setModalOpen(true);
  };

  const modeClass = lineClamp === 1 ? 'global-more__preview--single' : 'global-more__preview--multi';

  return (
    <>
      <p
        ref={previewRef}
        className={`global-more__preview ${modeClass}${canOpenModal ? ' global-more__preview--truncated' : ''} ${className}`.trim()}
        style={
          lineClamp !== 1
            ? {
                WebkitLineClamp: lineClamp,
                lineClamp: lineClamp,
              }
            : undefined
        }
        onClick={openModal}
        role={canOpenModal ? 'button' : undefined}
        tabIndex={canOpenModal ? 0 : undefined}
        onKeyDown={(e) => {
          if (!canOpenModal) return;
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setModalOpen(true);
          }
        }}
        aria-expanded={canOpenModal ? modalOpen : undefined}
        title={canOpenModal ? plain : undefined}
      >
        {showSingleTail ? (
          <span className="global-more__single-row">
            <span className="global-more__head">{previewPlain}</span>
            <span className="global-more__tail">
              <span className="global-more__dots">...</span>
              <span className="global-more__suffix">{t('seller.previewMore')}</span>
            </span>
          </span>
        ) : (
          previewPlain
        )}
      </p>

      <GlobalModal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={modalTitle}>
        <div className="global-more__modal-text">{plain}</div>
      </GlobalModal>
    </>
  );
};

export default GlobalMore;
