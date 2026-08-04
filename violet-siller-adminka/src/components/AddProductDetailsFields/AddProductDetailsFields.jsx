import React, { useMemo } from 'react';
import { Input } from 'antd';
import { useTranslation } from 'react-i18next';
import {
  getLabelOptionDefs,
  buildProductLabelsFromDraft,
  toggleLabelType,
} from '../../utils/productLabelPresets';
import './AddProductDetailsFields.css';

function renderLabelIcon(iconValue) {
  if (!iconValue) return null;
  if (iconValue.includes('animated-hourglass')) {
    return <span className="animated-hourglass" aria-hidden="true" />;
  }
  return <span dangerouslySetInnerHTML={{ __html: iconValue }} />;
}

function ProductLabelPreview({ labels, emptyText }) {
  if (!labels.length) {
    return <p className="add-product-details__preview-empty">{emptyText}</p>;
  }

  return (
    <div className="add-product-details__preview-list">
      {labels.map((label, index) => (
        <span
          key={`${label.text?.uz || 'label'}-${index}`}
          className="add-product-details__preview-chip"
          style={{ '--label-bg': label.color }}
        >
          {renderLabelIcon(label.icon)}
          <span>{label.text?.uz}</span>
        </span>
      ))}
    </div>
  );
}

export default function AddProductDetailsFields({ values, onChange }) {
  const { t } = useTranslation();
  const labelOptionDefs = useMemo(() => getLabelOptionDefs(t), [t]);

  const selectedTypes = useMemo(
    () => (Array.isArray(values.labelTypes) ? values.labelTypes : []),
    [values.labelTypes],
  );
  const previewLabels = useMemo(
    () =>
      buildProductLabelsFromDraft({
        labelTypes: selectedTypes,
        chegirmaPercent: values.chegirmaPercent,
      }),
    [selectedTypes, values.chegirmaPercent],
  );

  const handleWeightChange = (event) => {
    const raw = event.target.value.replace(/[^\d]/g, '');
    onChange((current) => ({ ...current, weight: raw }));
  };

  const handleChegirmaPercentChange = (event) => {
    const raw = event.target.value.replace(/[^\d]/g, '');
    onChange((current) => ({ ...current, chegirmaPercent: raw }));
  };

  const handleLabelToggle = (type) => {
    onChange((current) => {
      const currentTypes = Array.isArray(current.labelTypes) ? current.labelTypes : [];
      const nextTypes = toggleLabelType(currentTypes, type);
      const nextValues = { ...current, labelTypes: nextTypes };

      if (!nextTypes.includes('chegirma')) {
        nextValues.chegirmaPercent = '';
      }

      return nextValues;
    });
  };

  return (
    <section className="add-product-form__card add-product-details">
      <h3 className="add-product-form__card-title">{t('addProduct.details.title')}</h3>

      <div className="add-product-form__field">
        <label className="add-product-form__field-label" htmlFor="add-product-weight">
          {t('addProduct.details.weightLabel')}
          <span className="add-product-form__required">*</span>
        </label>
        <p className="add-product-form__field-hint">{t('addProduct.details.weightHint')}</p>
        <Input
          id="add-product-weight"
          size="large"
          inputMode="numeric"
          placeholder={t('addProduct.details.weightPlaceholder')}
          value={values.weight}
          onChange={handleWeightChange}
        />
      </div>

      <div className="add-product-details__labels">
        <p className="add-product-form__field-label">{t('addProduct.details.labelsTitle')}</p>
        <p className="add-product-form__field-hint">{t('addProduct.details.labelsHint')}</p>

        <div
          className="add-product-details__label-options"
          role="group"
          aria-label={t('addProduct.details.labelsAriaLabel')}
        >
          {labelOptionDefs.map((option) => {
            const isSelected = selectedTypes.includes(option.value);

            return (
              <label
                key={option.value}
                className={`add-product-details__label-option${
                  isSelected ? ' add-product-details__label-option--selected' : ''
                }`}
              >
                <input
                  type="checkbox"
                  className="add-product-details__label-input"
                  checked={isSelected}
                  onChange={() => handleLabelToggle(option.value)}
                />
                <span className="add-product-details__label-radio" aria-hidden="true" />
                <span className="add-product-details__label-body">
                  <span className="add-product-details__label-title">{option.title}</span>
                  <span className="add-product-details__label-hint">{option.hint}</span>
                </span>
              </label>
            );
          })}
        </div>

        {selectedTypes.includes('chegirma') ? (
          <div className="add-product-form__field add-product-details__chegirma-field">
            <label className="add-product-form__field-label" htmlFor="add-product-chegirma-percent">
              {t('addProduct.details.chegirmaPercentLabel')}
              <span className="add-product-form__required">*</span>
            </label>
            <p className="add-product-form__field-hint">{t('addProduct.details.chegirmaPercentHint')}</p>
            <Input
              id="add-product-chegirma-percent"
              size="large"
              inputMode="numeric"
              placeholder={t('addProduct.details.chegirmaPercentPlaceholder')}
              value={values.chegirmaPercent}
              onChange={handleChegirmaPercentChange}
              suffix="%"
            />
          </div>
        ) : null}

        <div className="add-product-details__preview">
          <p className="add-product-details__preview-title">{t('addProduct.details.previewTitle')}</p>
          <ProductLabelPreview labels={previewLabels} emptyText={t('addProduct.details.previewEmpty')} />
        </div>
      </div>
    </section>
  );
}
