import React, { useMemo, useState } from 'react';
import { Button, Input } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import DropdownPicker from '../DropdownPicker/DropdownPicker';
import {
  TYPE_SIZE_OPTIONS,
  createGuideImageRow,
  createMeasureColumnRow,
} from '../../utils/sizeChartDraft';
import './AddProductSizeChartFields.css';

function FieldBlock({ label, hint, required = false, children, className = '', alignInput = false }) {
  const fieldClassName = [
    'add-product-form__field',
    alignInput ? 'add-product-size-chart__field--align-input' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const meta = (
    <>
      <label className="add-product-form__field-label">
        {label}
        {required ? <span className="add-product-form__required">*</span> : null}
      </label>
      {hint ? <p className="add-product-form__field-hint">{hint}</p> : null}
    </>
  );

  if (alignInput) {
    return (
      <div className={fieldClassName}>
        <div className="add-product-size-chart__field-meta">{meta}</div>
        <div className="add-product-size-chart__field-control">{children}</div>
      </div>
    );
  }

  return (
    <div className={fieldClassName}>
      {meta}
      {children}
    </div>
  );
}

function FieldRow({ children, hint, className = '' }) {
  return (
    <div className={`add-product-form__row ${className}`.trim()}>
      {hint ? <p className="add-product-form__row-hint">{hint}</p> : null}
      <div className="add-product-form__row-grid">{children}</div>
    </div>
  );
}

function TypeSizeDropdownField({
  fieldKey,
  openKey,
  onOpenKeyChange,
  label,
  hint,
  required = false,
  value,
  options,
  placeholder,
  emptyText,
  onSelect,
}) {
  return (
    <div className="add-product-form__field add-product-size-chart__field add-product-size-chart__field--align-input">
      <DropdownPicker
        label={label}
        hint={hint}
        required={required}
        mode="single"
        value={value}
        options={options}
        placeholder={placeholder}
        emptyText={emptyText}
        isOpen={openKey === fieldKey}
        onToggle={(open) => onOpenKeyChange(open ? fieldKey : '')}
        onSelect={onSelect}
      />
    </div>
  );
}

function updateListItem(list, localId, patch) {
  return list.map((item) => (item.localId === localId ? { ...item, ...patch } : item));
}

export default function AddProductSizeChartFields({ values, onChange }) {
  const { t } = useTranslation();
  const [openKey, setOpenKey] = useState('');

  const typeSizeOptions = useMemo(
    () =>
      TYPE_SIZE_OPTIONS.map((option) => ({
        ...option,
        label: t(`addProduct.sizeChart.typeSizeOptions.${option.value}`),
      })),
    [t],
  );

  const measureColumns = useMemo(
    () => (Array.isArray(values.sizeChartMeasureColumns) ? values.sizeChartMeasureColumns : []),
    [values.sizeChartMeasureColumns],
  );

  const guideImages = useMemo(
    () => (Array.isArray(values.sizeChartGuideImages) ? values.sizeChartGuideImages : []),
    [values.sizeChartGuideImages],
  );

  const setField = (key) => (event) => {
    onChange({ ...values, [key]: event.target.value });
  };

  const handleTypeSizeChange = (nextTypeSize) => {
    onChange({
      ...values,
      sizeChartTypeSize: nextTypeSize,
      sizeChartGuideImages: guideImages.map((item) => ({
        ...item,
        typeSize: nextTypeSize,
      })),
    });
  };

  const handleMeasureColumnLabelChange = (localId, key) => (event) => {
    onChange({
      ...values,
      sizeChartMeasureColumns: updateListItem(measureColumns, localId, {
        [key]: event.target.value,
      }),
    });
  };

  const handleMeasureValueChange = (localId, valueIndex) => (event) => {
    onChange({
      ...values,
      sizeChartMeasureColumns: measureColumns.map((column) => {
        if (column.localId !== localId) return column;
        const nextValues = [...(column.values || [])];
        nextValues[valueIndex] = event.target.value;
        return { ...column, values: nextValues };
      }),
    });
  };

  const addMeasureValue = (localId) => {
    onChange({
      ...values,
      sizeChartMeasureColumns: measureColumns.map((column) => {
        if (column.localId !== localId) return column;
        return { ...column, values: [...(column.values || []), ''] };
      }),
    });
  };

  const removeMeasureValue = (localId, valueIndex) => {
    onChange({
      ...values,
      sizeChartMeasureColumns: measureColumns.map((column) => {
        if (column.localId !== localId) return column;
        const nextValues = [...(column.values || [])];
        if (nextValues.length <= 1) return column;
        nextValues.splice(valueIndex, 1);
        return { ...column, values: nextValues };
      }),
    });
  };

  const addMeasureColumn = () => {
    onChange({
      ...values,
      sizeChartMeasureColumns: [...measureColumns, createMeasureColumnRow()],
    });
  };

  const removeMeasureColumn = (localId) => {
    const column = measureColumns.find((item) => item.localId === localId);
    if (!column || column.isFixedLabel) return;

    onChange({
      ...values,
      sizeChartMeasureColumns: measureColumns.filter((item) => item.localId !== localId),
    });
  };

  const handleGuideImageChange = (patch) => {
    const first = guideImages[0];
    if (!first) {
      onChange({
        ...values,
        sizeChartGuideImages: [{ ...createGuideImageRow(values.sizeChartTypeSize), ...patch }],
      });
      return;
    }

    onChange({
      ...values,
      sizeChartGuideImages: updateListItem(guideImages, first.localId, patch),
    });
  };

  const guideImage = guideImages[0] ?? createGuideImageRow(values.sizeChartTypeSize);

  return (
    <section className="add-product-form__card add-product-size-chart">
      <h3 className="add-product-form__card-title">{t('addProduct.sizeChart.title')}</h3>
      <p className="add-product-size-chart__intro">{t('addProduct.sizeChart.intro')}</p>

      <div className="add-product-size-chart__type-title-row">
        <TypeSizeDropdownField
          fieldKey="sizeChartTypeSize"
          openKey={openKey}
          onOpenKeyChange={setOpenKey}
          label={t('addProduct.sizeChart.typeSizeLabel')}
          hint={t('addProduct.sizeChart.typeSizeHint')}
          required
          value={values.sizeChartTypeSize}
          options={typeSizeOptions}
          placeholder={t('addProduct.sizeChart.typeSizePlaceholder')}
          emptyText={t('addProduct.sizeChart.typeSizeEmpty')}
          onSelect={handleTypeSizeChange}
        />

        <div className="add-product-size-chart__title-pair">
          <FieldBlock
            label={t('addProduct.sizeChart.titleUzLabel')}
            hint={t('addProduct.sizeChart.titleUzHint')}
            required
            className="add-product-form__field--in-row"
            alignInput
          >
            <Input
              size="large"
              placeholder={t('addProduct.sizeChart.titleUzPlaceholder')}
              value={values.sizeChartTitleUz}
              onChange={setField('sizeChartTitleUz')}
            />
          </FieldBlock>
          <FieldBlock
            label={t('addProduct.sizeChart.titleRuLabel')}
            hint={t('addProduct.sizeChart.titleRuHint')}
            required
            className="add-product-form__field--in-row"
            alignInput
          >
            <Input
              size="large"
              placeholder={t('addProduct.sizeChart.titleRuPlaceholder')}
              value={values.sizeChartTitleRu}
              onChange={setField('sizeChartTitleRu')}
            />
          </FieldBlock>
        </div>
      </div>

      <FieldRow hint={t('addProduct.sizeChart.instructionRowHint')}>
        <FieldBlock
          label={t('addProduct.sizeChart.instructionUzLabel')}
          hint={t('addProduct.sizeChart.instructionUzHint')}
          className="add-product-form__field--in-row"
          alignInput
        >
          <Input.TextArea
            rows={3}
            placeholder={t('addProduct.sizeChart.instructionUzPlaceholder')}
            value={values.sizeChartInstructionUz}
            onChange={setField('sizeChartInstructionUz')}
          />
        </FieldBlock>
        <FieldBlock
          label={t('addProduct.sizeChart.instructionRuLabel')}
          hint={t('addProduct.sizeChart.instructionRuHint')}
          className="add-product-form__field--in-row"
          alignInput
        >
          <Input.TextArea
            rows={3}
            placeholder={t('addProduct.sizeChart.instructionRuPlaceholder')}
            value={values.sizeChartInstructionRu}
            onChange={setField('sizeChartInstructionRu')}
          />
        </FieldBlock>
      </FieldRow>

      <div className="add-product-size-chart__section">
        <div className="add-product-size-chart__section-head">
          <div>
            <h4 className="add-product-size-chart__section-title">{t('addProduct.sizeChart.columnsTitle')}</h4>
            <p className="add-product-size-chart__section-desc">{t('addProduct.sizeChart.columnsDesc')}</p>
          </div>
          <Button type="dashed" icon={<PlusOutlined />} onClick={addMeasureColumn}>
            {t('addProduct.sizeChart.addColumn')}
          </Button>
        </div>

        {measureColumns.map((column, columnIndex) => (
          <div key={column.localId} className="add-product-size-chart__column-card">
            <div className="add-product-size-chart__column-head">
              <span className="add-product-size-chart__column-index">
                {column.isFixedLabel
                  ? t('addProduct.sizeChart.fixedColumnLabel')
                  : t('addProduct.sizeChart.extraColumnLabel', { index: columnIndex })}
              </span>
              {!column.isFixedLabel ? (
                <Button type="link" danger onClick={() => removeMeasureColumn(column.localId)}>
                  {t('addProduct.common.remove')}
                </Button>
              ) : null}
            </div>

            {column.isFixedLabel ? (
              <>
                <p className="add-product-size-chart__column-note">
                  {t('addProduct.sizeChart.fixedColumnNote')}
                </p>
                <FieldRow>
                  <FieldBlock
                    label={t('addProduct.sizeChart.columnNameUzLabel')}
                    className="add-product-form__field--in-row"
                    alignInput
                  >
                    <Input
                      size="large"
                      readOnly
                      value={t('addProduct.sizeChart.fixedColumnNameUz')}
                      className="add-product-size-chart__readonly"
                    />
                  </FieldBlock>
                  <FieldBlock
                    label={t('addProduct.sizeChart.columnNameRuLabel')}
                    className="add-product-form__field--in-row"
                    alignInput
                  >
                    <Input
                      size="large"
                      readOnly
                      value={t('addProduct.sizeChart.fixedColumnNameRu')}
                      className="add-product-size-chart__readonly"
                    />
                  </FieldBlock>
                </FieldRow>
              </>
            ) : (
              <FieldRow>
                <FieldBlock
                  label={t('addProduct.sizeChart.columnNameUzLabel')}
                  hint={t('addProduct.sizeChart.columnNameUzHint')}
                  className="add-product-form__field--in-row"
                  alignInput
                >
                  <Input
                    size="large"
                    placeholder={t('addProduct.sizeChart.columnNameUzPlaceholder')}
                    value={column.labelUz}
                    onChange={handleMeasureColumnLabelChange(column.localId, 'labelUz')}
                  />
                </FieldBlock>
                <FieldBlock
                  label={t('addProduct.sizeChart.columnNameRuLabel')}
                  hint={t('addProduct.sizeChart.columnNameRuHint')}
                  className="add-product-form__field--in-row"
                  alignInput
                >
                  <Input
                    size="large"
                    placeholder={t('addProduct.sizeChart.columnNameRuPlaceholder')}
                    value={column.labelRu}
                    onChange={handleMeasureColumnLabelChange(column.localId, 'labelRu')}
                  />
                </FieldBlock>
              </FieldRow>
            )}

            <div className="add-product-size-chart__values-block">
              <div className="add-product-size-chart__values-head">
                <div>
                  <span className="add-product-form__field-label">{t('addProduct.sizeChart.valuesLabel')}</span>
                  <p className="add-product-size-chart__values-hint">
                    {column.isFixedLabel
                      ? t('addProduct.sizeChart.valuesHintFixed')
                      : t('addProduct.sizeChart.valuesHintExtra')}
                  </p>
                </div>
                <Button
                  type="dashed"
                  size="small"
                  icon={<PlusOutlined />}
                  onClick={() => addMeasureValue(column.localId)}
                >
                  {t('addProduct.common.addMore')}
                </Button>
              </div>

              <div className="add-product-size-chart__values-grid">
                {(column.values || []).map((value, valueIndex) => (
                  <div key={`${column.localId}-value-${valueIndex}`} className="add-product-size-chart__value-row">
                    <span className="add-product-size-chart__value-label">
                      {columnIndex === 0
                        ? t('addProduct.sizeChart.sizeValueLabel', { index: valueIndex + 1 })
                        : t('addProduct.sizeChart.measureValueLabel', { index: valueIndex + 1 })}
                    </span>
                    <Input
                      size="large"
                      inputMode="decimal"
                      placeholder={
                        column.isFixedLabel
                          ? t('addProduct.sizeChart.sizeValuePlaceholder')
                          : t('addProduct.sizeChart.measureValuePlaceholder')
                      }
                      value={value}
                      onChange={handleMeasureValueChange(column.localId, valueIndex)}
                    />
                    {(column.values || []).length > 1 ? (
                      <Button type="link" danger onClick={() => removeMeasureValue(column.localId, valueIndex)}>
                        {t('addProduct.common.remove')}
                      </Button>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="add-product-size-chart__section">
        <h4 className="add-product-size-chart__section-title">{t('addProduct.sizeChart.guideTitle')}</h4>
        <p className="add-product-size-chart__section-desc add-product-size-chart__section-desc--block">
          {t('addProduct.sizeChart.guideDesc')}
        </p>

        <div className="add-product-size-chart__column-card add-product-size-chart__guide-card">
          <FieldRow>
            <FieldBlock
              label={t('addProduct.sizeChart.guideNameUzLabel')}
              hint={t('addProduct.sizeChart.guideNameUzHint')}
              className="add-product-form__field--in-row"
              alignInput
            >
              <Input
                size="large"
                placeholder={t('addProduct.sizeChart.guideNameUzPlaceholder')}
                value={guideImage.titleUz}
                onChange={(event) => handleGuideImageChange({ titleUz: event.target.value })}
              />
            </FieldBlock>
            <FieldBlock
              label={t('addProduct.sizeChart.guideNameRuLabel')}
              hint={t('addProduct.sizeChart.guideNameRuHint')}
              className="add-product-form__field--in-row"
              alignInput
            >
              <Input
                size="large"
                placeholder={t('addProduct.sizeChart.guideNameRuPlaceholder')}
                value={guideImage.titleRu}
                onChange={(event) => handleGuideImageChange({ titleRu: event.target.value })}
              />
            </FieldBlock>
          </FieldRow>
        </div>
      </div>
    </section>
  );
}
