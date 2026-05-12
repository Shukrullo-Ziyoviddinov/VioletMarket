import React from 'react';
import { normalizeImagePath, getLocalizedText } from '../../utils/utils';
import { getProductPolicyBlocks, getProductPolicyIconClass } from '../../utils/productPolicy';

/**
 * Siyosat bloklari: matn va rasmlar JSON dan; ikonka — faqat kalit (productPolicy.js xaritasi).
 */
export default function ProductPolicy({ product, lang }) {
  const blocks = getProductPolicyBlocks(product);

  return (
    <div className="product-policy">
      {blocks.map((block, index) => {
        const iconClass = getProductPolicyIconClass(block.icon);
        const showDivider =
          block.divider !== false && index < blocks.length - 1;
        const lineMod = showDivider ? ' policy-block__linia' : '';
        const title = getLocalizedText(block.title, lang) || '';
        const text = getLocalizedText(block.text, lang) || '';
        const icons = Array.isArray(block.paymentIcons) ? block.paymentIcons : [];

        return (
          <div key={index} className={`policy-block${lineMod}`}>
            <i className={iconClass} aria-hidden />
            <div className="policy-text">
              {title ? <h3>{title}</h3> : null}
              {text ? <p>{text}</p> : null}
              {icons.length > 0 && (
                <div className="payment-icons">
                  {icons.map((item, i) => {
                    const src = typeof item === 'string' ? item : item?.src;
                    if (!src) return null;
                    const altRaw = typeof item === 'string' ? '' : item?.alt;
                    const alt =
                      getLocalizedText(altRaw, lang) ||
                      (typeof altRaw === 'string' ? altRaw : '') ||
                      'payment';
                    return (
                      <img
                        key={`${src}-${i}`}
                        src={normalizeImagePath(src)}
                        alt={alt}
                        className="img-policy"
                        onError={(e) => {
                          e.target.src = normalizeImagePath('/img/no-image.png');
                        }}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
