import React, { useMemo, useState } from 'react';
import { Button, Input } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import DropdownPicker from '../DropdownPicker/DropdownPicker';
import {
  SIZE_COLUMN_FIXED_LABEL,
  TYPE_SIZE_OPTIONS,
  createGuideImageRow,
  createMeasureColumnRow,
} from '../../utils/sizeChartDraft';
import './AddProductSizeChartFields.css';

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
  required = false,
  value,
  onSelect,
  className = '',
}) {
  return (
    <div className={`add-product-form__field add-product-size-chart__field ${className}`.trim()}>
      <DropdownPicker
        label={label}
        required={required}
        mode="single"
        value={value}
        options={TYPE_SIZE_OPTIONS}
        placeholder="O'lcham turini tanlang"
        emptyText="Variantlar topilmadi"
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
  const [openKey, setOpenKey] = useState('');

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
        typeSize: item.typeSize || nextTypeSize,
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

  const handleGuideImageChange = (localId, patch) => {
    onChange({
      ...values,
      sizeChartGuideImages: updateListItem(guideImages, localId, patch),
    });
  };

  const addGuideImage = () => {
    onChange({
      ...values,
      sizeChartGuideImages: [...guideImages, createGuideImageRow(values.sizeChartTypeSize)],
    });
  };

  const removeGuideImage = (localId) => {
    if (guideImages.length <= 1) return;
    onChange({
      ...values,
      sizeChartGuideImages: guideImages.filter((item) => item.localId !== localId),
    });
  };

  return (
    <section className="add-product-form__card add-product-size-chart">
      <h3 className="add-product-form__card-title">O&apos;lcham jadvali (sizeChart)</h3>

      <div className="add-product-size-chart__type-title-row">
        <TypeSizeDropdownField
          fieldKey="sizeChartTypeSize"
          openKey={openKey}
          onOpenKeyChange={setOpenKey}
          label="O'lcham turi (typeSize)"
          required
          value={values.sizeChartTypeSize}
          onSelect={handleTypeSizeChange}
          className="add-product-size-chart__field--compact"
        />

        <div className="add-product-size-chart__title-pair">
          <FieldBlock label="Sarlavha (O'zbekcha)" required className="add-product-form__field--in-row">
            <Input
              size="large"
              placeholder="Oyoq kiyim o'lcham jadvali"
              value={values.sizeChartTitleUz}
              onChange={setField('sizeChartTitleUz')}
            />
          </FieldBlock>
          <FieldBlock label="Sarlavha (Ruscha)" required className="add-product-form__field--in-row">
            <Input
              size="large"
              placeholder="Таблица размеров обуви"
              value={values.sizeChartTitleRu}
              onChange={setField('sizeChartTitleRu')}
            />
          </FieldBlock>
        </div>
      </div>

      <FieldRow hint="Mijozga o'lchamni qanday tanlashni tushuntiring.">
        <FieldBlock label="Ko'rsatma (O'zbekcha)" className="add-product-form__field--in-row">
          <Input.TextArea
            rows={3}
            placeholder="Oyoq uzunligini o'lchab, jadvaldagi mos EU o'lchamni tanlang."
            value={values.sizeChartInstructionUz}
            onChange={setField('sizeChartInstructionUz')}
          />
        </FieldBlock>
        <FieldBlock label="Ko'rsatma (Ruscha)" className="add-product-form__field--in-row">
          <Input.TextArea
            rows={3}
            placeholder="Измерьте длину стопы и выберите соответствующий размер EU в таблице."
            value={values.sizeChartInstructionRu}
            onChange={setField('sizeChartInstructionRu')}
          />
        </FieldBlock>
      </FieldRow>

      <div className="add-product-size-chart__section">
        <div className="add-product-size-chart__section-head">
          <h4 className="add-product-size-chart__section-title">O&apos;lchov ustunlari (measureColumns)</h4>
          <Button type="dashed" icon={<PlusOutlined />} onClick={addMeasureColumn}>
            Ustun qo&apos;shish
          </Button>
        </div>

        {measureColumns.map((column, columnIndex) => (
          <div key={column.localId} className="add-product-size-chart__column-card">
            <div className="add-product-size-chart__column-head">
              <span className="add-product-size-chart__column-index">Ustun #{columnIndex + 1}</span>
              {!column.isFixedLabel ? (
                <Button type="link" danger onClick={() => removeMeasureColumn(column.localId)}>
                  O&apos;chirish
                </Button>
              ) : null}
            </div>

            {column.isFixedLabel ? (
              <FieldRow>
                <FieldBlock label="Label (O'zbekcha)" className="add-product-form__field--in-row">
                  <Input
                    size="large"
                    readOnly
                    value={SIZE_COLUMN_FIXED_LABEL.uz}
                    className="add-product-size-chart__readonly"
                  />
                </FieldBlock>
                <FieldBlock label="Label (Ruscha)" className="add-product-form__field--in-row">
                  <Input
                    size="large"
                    readOnly
                    value={SIZE_COLUMN_FIXED_LABEL.ru}
                    className="add-product-size-chart__readonly"
                  />
                </FieldBlock>
              </FieldRow>
            ) : (
              <FieldRow>
                <FieldBlock label="Label (O'zbekcha)" className="add-product-form__field--in-row">
                  <Input
                    size="large"
                    placeholder="Bo'yi"
                    value={column.labelUz}
                    onChange={handleMeasureColumnLabelChange(column.localId, 'labelUz')}
                  />
                </FieldBlock>
                <FieldBlock label="Label (Ruscha)" className="add-product-form__field--in-row">
                  <Input
                    size="large"
                    placeholder="Длина"
                    value={column.labelRu}
                    onChange={handleMeasureColumnLabelChange(column.localId, 'labelRu')}
                  />
                </FieldBlock>
              </FieldRow>
            )}

            <div className="add-product-size-chart__values-block">
              <div className="add-product-size-chart__values-head">
                <span className="add-product-form__field-label">Qiymatlar (values)</span>
                <Button type="dashed" size="small" icon={<PlusOutlined />} onClick={() => addMeasureValue(column.localId)}>
                  Yana
                </Button>
              </div>

              <div className="add-product-size-chart__values-grid">
                {(column.values || []).map((value, valueIndex) => (
                  <div key={`${column.localId}-value-${valueIndex}`} className="add-product-size-chart__value-row">
                    <Input
                      size="large"
                      inputMode="decimal"
                      placeholder="36"
                      value={value}
                      onChange={handleMeasureValueChange(column.localId, valueIndex)}
                    />
                    {(column.values || []).length > 1 ? (
                      <Button type="link" danger onClick={() => removeMeasureValue(column.localId, valueIndex)}>
                        O&apos;chirish
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
        <div className="add-product-size-chart__section-head">
          <h4 className="add-product-size-chart__section-title">Sxema rasmlari (guideImages)</h4>
          <Button type="dashed" icon={<PlusOutlined />} onClick={addGuideImage}>
            Yana
          </Button>
        </div>

        {guideImages.map((item, index) => (
          <div key={item.localId} className="add-product-size-chart__column-card">
            <div className="add-product-size-chart__column-head">
              <span className="add-product-size-chart__column-index">#{index + 1}</span>
              {guideImages.length > 1 ? (
                <Button type="link" danger onClick={() => removeGuideImage(item.localId)}>
                  O&apos;chirish
                </Button>
              ) : null}
            </div>

            <div className="add-product-size-chart__guide-row">
              <TypeSizeDropdownField
                fieldKey={`guide-${item.localId}`}
                openKey={openKey}
                onOpenKeyChange={setOpenKey}
                label="typeSize"
                value={item.typeSize || values.sizeChartTypeSize}
                onSelect={(nextTypeSize) =>
                  handleGuideImageChange(item.localId, { typeSize: nextTypeSize })
                }
                className="add-product-size-chart__field--compact"
              />

              <div className="add-product-size-chart__title-pair">
                <FieldBlock label="title (O'zbekcha)" className="add-product-form__field--in-row">
                  <Input
                    size="large"
                    placeholder="Oyoq o'lchovi"
                    value={item.titleUz}
                    onChange={(event) =>
                      handleGuideImageChange(item.localId, { titleUz: event.target.value })
                    }
                  />
                </FieldBlock>
                <FieldBlock label="title (Ruscha)" className="add-product-form__field--in-row">
                  <Input
                    size="large"
                    placeholder="Измерение стопы"
                    value={item.titleRu}
                    onChange={(event) =>
                      handleGuideImageChange(item.localId, { titleRu: event.target.value })
                    }
                  />
                </FieldBlock>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
