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
      <h3 className="add-product-form__card-title">O&apos;lcham jadvali</h3>
      <p className="add-product-size-chart__intro">
        Mijoz mahsulot sahifasida o&apos;lcham tanlashda foydalanadigan jadval va sxema. Har bir
        maydon ostidagi izoh nima yozish kerakligini tushuntiradi.
      </p>

      <div className="add-product-size-chart__type-title-row">
        <TypeSizeDropdownField
          fieldKey="sizeChartTypeSize"
          openKey={openKey}
          onOpenKeyChange={setOpenKey}
          label="Mahsulot o'lcham turi"
          hint="Mahsulot qaysi turda o'lchanadi: oyoq kiyimi, tana (yuqori) kiyim yoki shim. Saytda shu turga mos o'lchov sxemasi chiqadi."
          required
          value={values.sizeChartTypeSize}
          onSelect={handleTypeSizeChange}
        />

        <div className="add-product-size-chart__title-pair">
          <FieldBlock
            label="Jadval sarlavhasi (O'zbekcha)"
            hint="Mijoz ko'radigan asosiy nom. Masalan: «Oyoq kiyim o'lcham jadvali»."
            required
            className="add-product-form__field--in-row"
            alignInput
          >
            <Input
              size="large"
              placeholder="Oyoq kiyim o'lcham jadvali"
              value={values.sizeChartTitleUz}
              onChange={setField('sizeChartTitleUz')}
            />
          </FieldBlock>
          <FieldBlock
            label="Jadval sarlavhasi (Ruscha)"
            hint="Rus tilidagi xaridorlar uchun xuddi shu sarlavha."
            required
            className="add-product-form__field--in-row"
            alignInput
          >
            <Input
              size="large"
              placeholder="Таблица размеров обуви"
              value={values.sizeChartTitleRu}
              onChange={setField('sizeChartTitleRu')}
            />
          </FieldBlock>
        </div>
      </div>

      <FieldRow hint="Mijozga o'lchamni qanday tanlash kerakligini oddiy tilda yozing — masalan oyoq uzunligini o'lchash va jadvaldan mos raqamni topish.">
        <FieldBlock
          label="Ko'rsatma matni (O'zbekcha)"
          hint="Jadval ustida yoki yonida chiqadigan qisqa yo'riqnoma."
          className="add-product-form__field--in-row"
          alignInput
        >
          <Input.TextArea
            rows={3}
            placeholder="Oyoq uzunligini o'lchab, jadvaldagi mos EU o'lchamni tanlang."
            value={values.sizeChartInstructionUz}
            onChange={setField('sizeChartInstructionUz')}
          />
        </FieldBlock>
        <FieldBlock
          label="Ko'rsatma matni (Ruscha)"
          hint="Rus tilidagi xaridorlar uchun xuddi shu ko'rsatma."
          className="add-product-form__field--in-row"
          alignInput
        >
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
          <div>
            <h4 className="add-product-size-chart__section-title">O&apos;lcham jadvali (ustunlar)</h4>
            <p className="add-product-size-chart__section-desc">
              Bu yerda jadvaldagi raqamlar yoziladi. Birinchi ustun doim «O&apos;lcham» (S, M, L
              yoki 36, 37, 38). Qolgan ustunlarga masalan bo&apos;yi, ko&apos;krak eni kabi
              nomlar qo&apos;shasiz.
            </p>
          </div>
          <Button type="dashed" icon={<PlusOutlined />} onClick={addMeasureColumn}>
            Ustun qo&apos;shish
          </Button>
        </div>

        {measureColumns.map((column, columnIndex) => (
          <div key={column.localId} className="add-product-size-chart__column-card">
            <div className="add-product-size-chart__column-head">
              <span className="add-product-size-chart__column-index">
                {column.isFixedLabel ? 'Asosiy o\'lcham ustuni' : `Qo'shimcha ustun #${columnIndex}`}
              </span>
              {!column.isFixedLabel ? (
                <Button type="link" danger onClick={() => removeMeasureColumn(column.localId)}>
                  O&apos;chirish
                </Button>
              ) : null}
            </div>

            {column.isFixedLabel ? (
              <>
                <p className="add-product-size-chart__column-note">
                  Bu ustun nomi doimiy — mijoz jadvalda «O&apos;lcham» deb ko&apos;radi. O&apos;zgartirish shart emas.
                </p>
                <FieldRow>
                  <FieldBlock label="Ustun nomi (O'zbekcha)" className="add-product-form__field--in-row" alignInput>
                    <Input
                      size="large"
                      readOnly
                      value={SIZE_COLUMN_FIXED_LABEL.uz}
                      className="add-product-size-chart__readonly"
                    />
                  </FieldBlock>
                  <FieldBlock label="Ustun nomi (Ruscha)" className="add-product-form__field--in-row" alignInput>
                    <Input
                      size="large"
                      readOnly
                      value={SIZE_COLUMN_FIXED_LABEL.ru}
                      className="add-product-size-chart__readonly"
                    />
                  </FieldBlock>
                </FieldRow>
              </>
            ) : (
              <FieldRow>
                <FieldBlock
                  label="Ustun nomi (O'zbekcha)"
                  hint="Jadvalda bu ustun qanday nom bilan chiqadi. Masalan: Bo'yi, Ko'krak eni."
                  className="add-product-form__field--in-row"
                  alignInput
                >
                  <Input
                    size="large"
                    placeholder="Bo'yi"
                    value={column.labelUz}
                    onChange={handleMeasureColumnLabelChange(column.localId, 'labelUz')}
                  />
                </FieldBlock>
                <FieldBlock
                  label="Ustun nomi (Ruscha)"
                  hint="Rus tilidagi ustun nomi."
                  className="add-product-form__field--in-row"
                  alignInput
                >
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
                <div>
                  <span className="add-product-form__field-label">O&apos;lcham qiymatlari</span>
                  <p className="add-product-size-chart__values-hint">
                    {column.isFixedLabel
                      ? 'Har bir qator uchun bitta o\'lcham yozing: 36, 37, S, M, L va hokazo. «Yana» bilan yangi o\'lcham qo\'shing.'
                      : 'Bu ustundagi raqamlar. Birinchi ustundagi har bir o\'lcham uchun mos qiymat yozing (masalan bo\'yi: 22.5, 23, 24).'}
                  </p>
                </div>
                <Button type="dashed" size="small" icon={<PlusOutlined />} onClick={() => addMeasureValue(column.localId)}>
                  Yana
                </Button>
              </div>

              <div className="add-product-size-chart__values-grid">
                {(column.values || []).map((value, valueIndex) => (
                  <div key={`${column.localId}-value-${valueIndex}`} className="add-product-size-chart__value-row">
                    <span className="add-product-size-chart__value-label">
                      {columnIndex === 0 ? `${valueIndex + 1}-o'lcham` : `${valueIndex + 1}-qiymat`}
                    </span>
                    <Input
                      size="large"
                      inputMode="decimal"
                      placeholder={column.isFixedLabel ? '36' : '22.5'}
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
        <h4 className="add-product-size-chart__section-title">O&apos;lchov sxemasi</h4>
        <p className="add-product-size-chart__section-desc add-product-size-chart__section-desc--block">
          Mijozga qayerdan o&apos;lchash kerakligini ko&apos;rsatadigan sxema. Yuqorida tanlangan
          mahsulot turiga mos rasm sayt o&apos;zi qo&apos;yadi — bu yerda faqat sxema nomini
          (ixtiyoriy) yozasiz.
        </p>

        <div className="add-product-size-chart__column-card add-product-size-chart__guide-card">
          <FieldRow>
            <FieldBlock
              label="Sxema nomi (O'zbekcha)"
              hint="Masalan «Oyoq o'lchovi». Ko'p hollarda saytda alohida sarlavha sifatida chiqmasligi mumkin."
              className="add-product-form__field--in-row"
              alignInput
            >
              <Input
                size="large"
                placeholder="Oyoq o'lchovi"
                value={guideImage.titleUz}
                onChange={(event) => handleGuideImageChange({ titleUz: event.target.value })}
              />
            </FieldBlock>
            <FieldBlock
              label="Sxema nomi (Ruscha)"
              hint="Rus tilidagi sxema nomi."
              className="add-product-form__field--in-row"
              alignInput
            >
              <Input
                size="large"
                placeholder="Измерение стопы"
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
