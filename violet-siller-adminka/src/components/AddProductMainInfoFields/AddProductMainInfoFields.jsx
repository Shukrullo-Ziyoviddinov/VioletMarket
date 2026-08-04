import React from 'react';
import { Input } from 'antd';
import { useTranslation } from 'react-i18next';

function FieldBlock({ label, hint, required = false, children, className = '' }) {
  return (
    <div className={`add-product-form__field ${className}`.trim()}>
      <label className="add-product-form__field-label">
        {label}
        {required ? <span className="add-product-form__required">*</span> : null}
      </label>
      {hint ? <p className="add-product-form__field-hint">{hint}</p> : null}
      {children}
    </div>
  );
}

function FieldRow({ children, hint }) {
  return (
    <div className="add-product-form__row">
      {hint ? <p className="add-product-form__row-hint">{hint}</p> : null}
      <div className="add-product-form__row-grid">{children}</div>
    </div>
  );
}

export default function AddProductMainInfoFields({ values, onChange }) {
  const { t } = useTranslation();

  const setField = (key) => (event) => {
    onChange((current) => ({ ...current, [key]: event.target.value }));
  };

  return (
    <section className="add-product-form__card">
      <h3 className="add-product-form__card-title">{t('addProduct.mainInfo.title')}</h3>

      <FieldRow hint={t('addProduct.mainInfo.titleNamesRowHint')}>
        <FieldBlock
          label={t('addProduct.mainInfo.titleUzLabel')}
          required
          className="add-product-form__field--in-row"
        >
          <Input
            size="large"
            placeholder={t('addProduct.mainInfo.titleUzPlaceholder')}
            value={values.titleUz}
            onChange={setField('titleUz')}
          />
        </FieldBlock>

        <FieldBlock
          label={t('addProduct.mainInfo.titleRuLabel')}
          required
          className="add-product-form__field--in-row"
        >
          <Input
            size="large"
            placeholder={t('addProduct.mainInfo.titleRuPlaceholder')}
            value={values.titleRu}
            onChange={setField('titleRu')}
          />
        </FieldBlock>
      </FieldRow>

      <FieldRow hint={t('addProduct.mainInfo.pricingRowHint')}>
        <FieldBlock
          label={t('addProduct.mainInfo.priceLabel')}
          required
          className="add-product-form__field--in-row"
        >
          <Input
            size="large"
            placeholder={t('addProduct.mainInfo.pricePlaceholder')}
            value={values.price}
            onChange={setField('price')}
          />
        </FieldBlock>

        <FieldBlock
          label={t('addProduct.mainInfo.originalPriceLabel')}
          className="add-product-form__field--in-row"
        >
          <Input
            size="large"
            placeholder={t('addProduct.mainInfo.originalPricePlaceholder')}
            value={values.originalPrice}
            onChange={setField('originalPrice')}
          />
        </FieldBlock>
      </FieldRow>

      <FieldRow hint={t('addProduct.mainInfo.discountRowHint')}>
        <FieldBlock label={t('addProduct.mainInfo.discountUzLabel')} className="add-product-form__field--in-row">
          <Input
            size="large"
            placeholder={t('addProduct.mainInfo.discountUzPlaceholder')}
            value={values.discountUz}
            onChange={setField('discountUz')}
          />
        </FieldBlock>

        <FieldBlock label={t('addProduct.mainInfo.discountRuLabel')} className="add-product-form__field--in-row">
          <Input
            size="large"
            placeholder={t('addProduct.mainInfo.discountRuPlaceholder')}
            value={values.discountRu}
            onChange={setField('discountRu')}
          />
        </FieldBlock>
      </FieldRow>
    </section>
  );
}
