import React from 'react';

function splitSignalText(text, value) {
  const safeText = String(text || '');
  if (value == null) {
    return { before: safeText, match: '', after: '' };
  }

  const token = String(value);
  const idx = safeText.indexOf(token);
  if (idx < 0) {
    return { before: safeText, match: '', after: '' };
  }

  return {
    before: safeText.slice(0, idx),
    match: token,
    after: safeText.slice(idx + token.length),
  };
}

const FlashSaleFooterSignal = ({ activeSignal }) => {
  if (!activeSignal) return null;

  const toneClass = `flash-sale-card__signal flash-sale-card__signal--${activeSignal.tone || 'info'}`;
  const signalKey = `${activeSignal.type || "signal"}-${activeSignal.highlightValue ?? ""}-${activeSignal.text || ""}`;
  const parts = splitSignalText(activeSignal.text, activeSignal.highlightValue);
  const signalText = (
    <>
      {parts.before}
      {parts.match ? <strong>{parts.match}</strong> : null}
      {parts.after}
    </>
  );

  return (
    <div key={signalKey} className={toneClass}>
      {activeSignal.icon ? <i className={activeSignal.icon} aria-hidden="true" /> : null}
      {activeSignal.tone === 'info' ? (
        <span className="flash-sale-card__signal-marquee">
          <span className="flash-sale-card__signal-marquee-track">
            <span className="flash-sale-card__signal-marquee-item">{signalText}</span>
            <span className="flash-sale-card__signal-marquee-item" aria-hidden="true">
              {signalText}
            </span>
          </span>
        </span>
      ) : (
        <span className="flash-sale-card__signal-text">{signalText}</span>
      )}
    </div>
  );
};

export default FlashSaleFooterSignal;
