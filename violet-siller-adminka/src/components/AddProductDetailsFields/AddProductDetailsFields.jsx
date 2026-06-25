import React, { useMemo } from 'react';
import { Input } from 'antd';
import {
  LABEL_OPTION_DEFS,
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

function ProductLabelPreview({ labels }) {
  if (!labels.length) {
    return <p className="add-product-details__preview-empty">Tanlangan yorliq yo&apos;q</p>;
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
  const selectedTypes = Array.isArray(values.labelTypes) ? values.labelTypes : [];
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
    onChange({ ...values, weight: raw });
  };

  const handleChegirmaPercentChange = (event) => {
    const raw = event.target.value.replace(/[^\d]/g, '');
    onChange({ ...values, chegirmaPercent: raw });
  };

  const handleLabelToggle = (type) => {
    const nextTypes = toggleLabelType(selectedTypes, type);
    const nextValues = { ...values, labelTypes: nextTypes };

    if (!nextTypes.includes('chegirma')) {
      nextValues.chegirmaPercent = '';
    }

    onChange(nextValues);
  };

  return (
    <section className="add-product-form__card add-product-details">
      <h3 className="add-product-form__card-title">Og&apos;irlik va yorliqlar</h3>

      <div className="add-product-form__field">
        <label className="add-product-form__field-label" htmlFor="add-product-weight">
          Mahsulot og&apos;irligi (gramm)
          <span className="add-product-form__required">*</span>
        </label>
        <p className="add-product-form__field-hint">
          Mahsulot og&apos;irligini gramm bilan kiriting. Masalan: 200, 700.
        </p>
        <Input
          id="add-product-weight"
          size="large"
          inputMode="numeric"
          placeholder="200"
          value={values.weight}
          onChange={handleWeightChange}
        />
      </div>

      <div className="add-product-details__labels">
        <p className="add-product-form__field-label">
          Mahsulot yorliqlari
        </p>
        <p className="add-product-form__field-hint">
          Kerakli yorliqlarni tanlang. Matn, icon va ranglar avtomatik beriladi. Chegirma uchun
          faqat foiz yoziladi.
        </p>

        <div className="add-product-details__label-options" role="group" aria-label="Mahsulot yorliqlari">
          {LABEL_OPTION_DEFS.map((option) => {
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
              Chegirma foizi
              <span className="add-product-form__required">*</span>
            </label>
            <p className="add-product-form__field-hint">
              Masalan: 70 yozilsa yorliq matni avtomatik &quot;Chegirma 70%&quot; bo&apos;ladi.
            </p>
            <Input
              id="add-product-chegirma-percent"
              size="large"
              inputMode="numeric"
              placeholder="70"
              value={values.chegirmaPercent}
              onChange={handleChegirmaPercentChange}
              suffix="%"
            />
          </div>
        ) : null}

        <div className="add-product-details__preview">
          <p className="add-product-details__preview-title">Ko&apos;rinishi</p>
          <ProductLabelPreview labels={previewLabels} />
        </div>
      </div>
    </section>
  );
}
