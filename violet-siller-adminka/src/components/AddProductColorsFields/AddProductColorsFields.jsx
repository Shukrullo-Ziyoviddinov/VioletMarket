import React, { useMemo, useState } from 'react';
import { Button, Input } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import DropdownPicker from '../DropdownPicker/DropdownPicker';
import ProductImageUploadField from '../ProductImageUploadField/ProductImageUploadField';
import ProductThumbnailsUploadField from '../ProductThumbnailsUploadField/ProductThumbnailsUploadField';
import { COLOR_FILTER_OPTIONS } from '../../utils/colorFilterPresets';
import {
  createColorDraft,
  createSizeStockRow,
  createModelStockRow,
  createStorageStockRow,
  applyColorsChange,
} from '../../utils/productColorsDraft';
import './AddProductColorsFields.css';

const COLOR_THUMBNAIL_HINTS = [
  '2-rasm — boshqa burchak',
  '3-rasm — detal ko‘rinish',
  '4-rasm — qo‘shimcha foto',
];

function FieldBlock({ label, hint, required = false, children, className = '', alignInput = false }) {
  const fieldClassName = [
    'add-product-form__field',
    alignInput ? 'add-product-colors__field--align-input' : '',
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
        <div className="add-product-colors__field-meta">{meta}</div>
        <div className="add-product-colors__field-control">{children}</div>
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

function updateColor(list, localId, patch) {
  return list.map((color) => (color.localId === localId ? { ...color, ...patch } : color));
}

export default function AddProductColorsFields({ values, onChange }) {
  const [openKey, setOpenKey] = useState('');

  const colors = useMemo(
    () => (Array.isArray(values.colors) ? values.colors : []),
    [values.colors],
  );

  const addColor = () => {
    onChange(applyColorsChange(values, [...colors, createColorDraft()]));
  };

  const removeColor = (localId) => {
    onChange(applyColorsChange(values, colors.filter((color) => color.localId !== localId)));
  };

  const changeColorField = (localId, field, fieldValue) => {
    onChange({
      ...values,
      colors: updateColor(colors, localId, { [field]: fieldValue }),
    });
  };

  const changeSizeStockRow = (localId, rowLocalId, patch) => {
    onChange({
      ...values,
      colors: colors.map((color) => {
        if (color.localId !== localId) return color;
        return {
          ...color,
          sizeStockRows: (color.sizeStockRows || []).map((row) =>
            row.localId === rowLocalId ? { ...row, ...patch } : row,
          ),
        };
      }),
    });
  };

  const addSizeStockRow = (localId) => {
    onChange({
      ...values,
      colors: colors.map((color) => {
        if (color.localId !== localId) return color;
        return {
          ...color,
          sizeStockRows: [...(color.sizeStockRows || []), createSizeStockRow()],
        };
      }),
    });
  };

  const removeSizeStockRow = (localId, rowLocalId) => {
    onChange({
      ...values,
      colors: colors.map((color) => {
        if (color.localId !== localId) return color;
        const nextRows = (color.sizeStockRows || []).filter((row) => row.localId !== rowLocalId);
        return {
          ...color,
          sizeStockRows: nextRows.length > 0 ? nextRows : [createSizeStockRow()],
        };
      }),
    });
  };

  const changeModelStockRow = (localId, rowLocalId, patch) => {
    onChange({
      ...values,
      colors: colors.map((color) => {
        if (color.localId !== localId) return color;
        return {
          ...color,
          modelStockRows: (color.modelStockRows || []).map((row) =>
            row.localId === rowLocalId ? { ...row, ...patch } : row,
          ),
        };
      }),
    });
  };

  const addModelStockRow = (localId) => {
    onChange({
      ...values,
      colors: colors.map((color) => {
        if (color.localId !== localId) return color;
        return {
          ...color,
          modelStockRows: [...(color.modelStockRows || []), createModelStockRow()],
        };
      }),
    });
  };

  const removeModelStockRow = (localId, rowLocalId) => {
    onChange({
      ...values,
      colors: colors.map((color) => {
        if (color.localId !== localId) return color;
        return {
          ...color,
          modelStockRows: (color.modelStockRows || []).filter((row) => row.localId !== rowLocalId),
        };
      }),
    });
  };

  const changeStorageStockRow = (localId, rowLocalId, patch) => {
    onChange({
      ...values,
      colors: colors.map((color) => {
        if (color.localId !== localId) return color;
        return {
          ...color,
          storageStockRows: (color.storageStockRows || []).map((row) =>
            row.localId === rowLocalId ? { ...row, ...patch } : row,
          ),
        };
      }),
    });
  };

  const addStorageStockRow = (localId) => {
    onChange({
      ...values,
      colors: colors.map((color) => {
        if (color.localId !== localId) return color;
        return {
          ...color,
          storageStockRows: [...(color.storageStockRows || []), createStorageStockRow()],
        };
      }),
    });
  };

  const removeStorageStockRow = (localId, rowLocalId) => {
    onChange({
      ...values,
      colors: colors.map((color) => {
        if (color.localId !== localId) return color;
        return {
          ...color,
          storageStockRows: (color.storageStockRows || []).filter((row) => row.localId !== rowLocalId),
        };
      }),
    });
  };

  return (
    <section className="add-product-form__card add-product-colors">
      <h3 className="add-product-form__card-title">Ranglar va ombor</h3>
      <p className="add-product-colors__intro">
        Agar mahsulot bir nechta rangda bo&apos;lsa, har bir rang uchun alohida ombor va rasmlar
        kiriting. Kiyimlar uchun <strong>o&apos;lcham (sizeStock)</strong>, telefon modeli uchun{' '}
        <strong>model (modelStock)</strong>, xotira hajmi uchun{' '}
        <strong>storage (storageStock)</strong> — faqat kerakli qismni to&apos;ldiring.
      </p>

      <div className="add-product-colors__toolbar">
        <Button type="dashed" icon={<PlusOutlined />} onClick={addColor}>
          Boshqa turkumdagi rang qo&apos;shish
        </Button>
      </div>

      {colors.length === 0 ? (
        <p className="add-product-colors__empty">
          Hozircha rang yo&apos;q. «Boshqa turkumdagi rang qo&apos;shish» tugmasini bosing.
        </p>
      ) : null}

      {colors.map((color, colorIndex) => (
        <div key={color.localId} className="add-product-colors__card">
          <div className="add-product-colors__card-head">
            <span className="add-product-colors__card-index">Rang #{colorIndex + 1}</span>
            <Button type="link" danger onClick={() => removeColor(color.localId)}>
              O&apos;chirish
            </Button>
          </div>

          <FieldRow hint="Mijoz ko'radigan rang nomi — masalan Yashil, Sariq.">
            <FieldBlock
              label="Rang nomi (O'zbekcha)"
              hint="Mahsulot sahifasida chiqadigan rang nomi."
              className="add-product-form__field--in-row"
              alignInput
            >
              <Input
                size="large"
                placeholder="Yashil"
                value={color.nameUz}
                onChange={(event) =>
                  changeColorField(color.localId, 'nameUz', event.target.value)
                }
              />
            </FieldBlock>
            <FieldBlock
              label="Rang nomi (Ruscha)"
              hint="Rus tilidagi rang nomi."
              className="add-product-form__field--in-row"
              alignInput
            >
              <Input
                size="large"
                placeholder="Зелёный"
                value={color.nameRu}
                onChange={(event) =>
                  changeColorField(color.localId, 'nameRu', event.target.value)
                }
              />
            </FieldBlock>
          </FieldRow>

          <div className="add-product-colors__filter-field">
            <DropdownPicker
              label="Rang filtri (colorFilter)"
              hint="Saytda rang bo'yicha qidiruv uchun. Ro'yxatdan tanlang — qo'lda yozilmaydi."
              mode="single"
              value={color.colorFilter}
              options={COLOR_FILTER_OPTIONS}
              placeholder="Rangni tanlang"
              emptyText="Ranglar topilmadi"
              isOpen={openKey === color.localId}
              onToggle={(open) => setOpenKey(open ? color.localId : '')}
              onSelect={(nextValue) => changeColorField(color.localId, 'colorFilter', nextValue)}
            />
          </div>

          <div className="add-product-colors__section add-product-colors__section--size">
            <div className="add-product-colors__section-head">
              <div>
                <h4 className="add-product-colors__section-title">O&apos;lcham va miqdor (sizeStock)</h4>
                <p className="add-product-colors__section-desc">
                  Kiyim va o&apos;lchamli mahsulotlar uchun. Har bir qator: o&apos;lcham (S, M, L,
                  38…) va nechta dona borligi. Telefon yoki model bo&apos;yicha sotilsa, bu qismni
                  bo&apos;sh qoldiring.
                </p>
              </div>
              <Button
                type="dashed"
                size="small"
                icon={<PlusOutlined />}
                onClick={() => addSizeStockRow(color.localId)}
              >
                Yana
              </Button>
            </div>

            <div className="add-product-colors__size-stock-list">
              {(color.sizeStockRows || []).map((row, rowIndex) => (
                <div key={row.localId} className="add-product-colors__size-stock-row">
                  <FieldBlock
                    label={`O'lcham ${rowIndex + 1}`}
                    hint="Masalan: S, M, XL yoki 38."
                    className="add-product-colors__size-field"
                  >
                    <Input
                      size="large"
                      placeholder="S"
                      value={row.label}
                      onChange={(event) =>
                        changeSizeStockRow(color.localId, row.localId, {
                          label: event.target.value,
                        })
                      }
                    />
                  </FieldBlock>
                  <FieldBlock
                    label="Miqdor (quantity)"
                    hint="Shu o'lchamdan nechta dona bor."
                    className="add-product-colors__size-field"
                  >
                    <Input
                      size="large"
                      inputMode="numeric"
                      placeholder="1"
                      value={row.quantity}
                      onChange={(event) =>
                        changeSizeStockRow(color.localId, row.localId, {
                          quantity: event.target.value,
                        })
                      }
                    />
                  </FieldBlock>
                  {(color.sizeStockRows || []).length > 1 ? (
                    <Button
                      type="link"
                      danger
                      className="add-product-colors__size-remove"
                      onClick={() => removeSizeStockRow(color.localId, row.localId)}
                    >
                      O&apos;chirish
                    </Button>
                  ) : null}
                </div>
              ))}
            </div>
          </div>

          <div className="add-product-colors__section add-product-colors__section--model">
            <div className="add-product-colors__section-head">
              <div>
                <h4 className="add-product-colors__section-title">Model va narx (modelStock)</h4>
                <p className="add-product-colors__section-desc">
                  Telefon, planshet va model nomi bilan sotiladigan mahsulotlar uchun. Har bir
                  qatorda model nomi (S20, A30…), miqdor va shu model uchun narxlar. Kiyim
                  mahsulotlarida bu qism kerak emas.
                </p>
              </div>
              <Button
                type="dashed"
                size="small"
                icon={<PlusOutlined />}
                onClick={() => addModelStockRow(color.localId)}
              >
                Yana
              </Button>
            </div>

            {(color.modelStockRows || []).length === 0 ? (
              <p className="add-product-colors__section-empty">
                Model qatori yo&apos;q. «Yana» tugmasini bosing — masalan S20, S24 ULTRA.
              </p>
            ) : null}

            <div className="add-product-colors__model-stock-list">
              {(color.modelStockRows || []).map((row, rowIndex) => (
                <div key={row.localId} className="add-product-colors__model-stock-row">
                  <FieldBlock
                    label={`Model ${rowIndex + 1}`}
                    hint="Model nomi. Masalan: S20, A30, S24 ULTRA."
                    className="add-product-colors__model-field"
                  >
                    <Input
                      size="large"
                      placeholder="S20"
                      value={row.label}
                      onChange={(event) =>
                        changeModelStockRow(color.localId, row.localId, {
                          label: event.target.value,
                        })
                      }
                    />
                  </FieldBlock>
                  <FieldBlock
                    label="Miqdor"
                    hint="Shu modeldan nechta dona bor."
                    className="add-product-colors__model-field"
                  >
                    <Input
                      size="large"
                      inputMode="numeric"
                      placeholder="1"
                      value={row.quantity}
                      onChange={(event) =>
                        changeModelStockRow(color.localId, row.localId, {
                          quantity: event.target.value,
                        })
                      }
                    />
                  </FieldBlock>
                  <FieldBlock
                    label="Narxi"
                    hint="Shu modelning sotuv narxi."
                    className="add-product-colors__model-field"
                  >
                    <Input
                      size="large"
                      placeholder="70000UZS"
                      value={row.price}
                      onChange={(event) =>
                        changeModelStockRow(color.localId, row.localId, {
                          price: event.target.value,
                        })
                      }
                    />
                  </FieldBlock>
                  <FieldBlock
                    label="Eski narxi"
                    hint="Chegirma bo'lsa, chizilgan eski narx."
                    className="add-product-colors__model-field"
                  >
                    <Input
                      size="large"
                      placeholder="70000UZS"
                      value={row.originalPrice}
                      onChange={(event) =>
                        changeModelStockRow(color.localId, row.localId, {
                          originalPrice: event.target.value,
                        })
                      }
                    />
                  </FieldBlock>
                  <Button
                    type="link"
                    danger
                    className="add-product-colors__model-remove"
                    onClick={() => removeModelStockRow(color.localId, row.localId)}
                  >
                    O&apos;chirish
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <div className="add-product-colors__section add-product-colors__section--storage">
            <div className="add-product-colors__section-head">
              <div>
                <h4 className="add-product-colors__section-title">Xotira va narx (storageStock)</h4>
                <p className="add-product-colors__section-desc">
                  Telefon va xotira hajmi bo&apos;yicha sotiladigan mahsulotlar uchun. Har bir
                  qatorda xotira kombinatsiyasi (12/256 — RAM/GB), miqdor va shu variant uchun
                  narxlar. Kiyim yoki model bo&apos;yicha sotilsa, bu qismni bo&apos;sh qoldiring.
                </p>
              </div>
              <Button
                type="dashed"
                size="small"
                icon={<PlusOutlined />}
                onClick={() => addStorageStockRow(color.localId)}
              >
                Yana
              </Button>
            </div>

            {(color.storageStockRows || []).length === 0 ? (
              <p className="add-product-colors__section-empty">
                Xotira qatori yo&apos;q. «Yana» tugmasini bosing — masalan 12/256, 8/128.
              </p>
            ) : null}

            <div className="add-product-colors__storage-stock-list">
              {(color.storageStockRows || []).map((row, rowIndex) => (
                <div key={row.localId} className="add-product-colors__storage-stock-row">
                  <FieldBlock
                    label={`Xotira ${rowIndex + 1}`}
                    hint="Xotira nomi. Masalan: 12/256, 8/128 (RAM/GB)."
                    className="add-product-colors__storage-field"
                  >
                    <Input
                      size="large"
                      placeholder="12/256"
                      value={row.label}
                      onChange={(event) =>
                        changeStorageStockRow(color.localId, row.localId, {
                          label: event.target.value,
                        })
                      }
                    />
                  </FieldBlock>
                  <FieldBlock
                    label="Miqdor"
                    hint="Shu xotira variantidan nechta dona bor."
                    className="add-product-colors__storage-field"
                  >
                    <Input
                      size="large"
                      inputMode="numeric"
                      placeholder="1"
                      value={row.quantity}
                      onChange={(event) =>
                        changeStorageStockRow(color.localId, row.localId, {
                          quantity: event.target.value,
                        })
                      }
                    />
                  </FieldBlock>
                  <FieldBlock
                    label="Narxi"
                    hint="Shu xotira varianti uchun sotuv narxi."
                    className="add-product-colors__storage-field"
                  >
                    <Input
                      size="large"
                      placeholder="$10"
                      value={row.price}
                      onChange={(event) =>
                        changeStorageStockRow(color.localId, row.localId, {
                          price: event.target.value,
                        })
                      }
                    />
                  </FieldBlock>
                  <FieldBlock
                    label="Eski narxi"
                    hint="Chegirma bo'lsa, chizilgan eski narx."
                    className="add-product-colors__storage-field"
                  >
                    <Input
                      size="large"
                      placeholder="$10"
                      value={row.originalPrice}
                      onChange={(event) =>
                        changeStorageStockRow(color.localId, row.localId, {
                          originalPrice: event.target.value,
                        })
                      }
                    />
                  </FieldBlock>
                  <Button
                    type="link"
                    danger
                    className="add-product-colors__storage-remove"
                    onClick={() => removeStorageStockRow(color.localId, row.localId)}
                  >
                    O&apos;chirish
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <FieldRow hint="Kiyim (sizeStock) mahsulotlarida har bir rang uchun umumiy narx shu yerda. modelStock yoki storageStock ishlatilsa, narx har qatorda yoziladi — bu maydon ixtiyoriy.">
            <FieldBlock
              label="Narxi (shu rang uchun)"
              hint="Mijoz shu rangni tanlaganda ko'radigan narx."
              className="add-product-form__field--in-row"
              alignInput
            >
              <Input
                size="large"
                placeholder="110 so'm"
                value={color.price}
                onChange={(event) => changeColorField(color.localId, 'price', event.target.value)}
              />
            </FieldBlock>
            <FieldBlock
              label="Eski narxi"
              hint="Chegirma bo'lsa, chizilgan eski narx."
              className="add-product-form__field--in-row"
              alignInput
            >
              <Input
                size="large"
                placeholder="$200"
                value={color.originalPrice}
                onChange={(event) =>
                  changeColorField(color.localId, 'originalPrice', event.target.value)
                }
              />
            </FieldBlock>
          </FieldRow>

          <FieldRow>
            <FieldBlock
              label="Chegirma matni (O'zbekcha)"
              hint="Masalan: 80% chegirma"
              className="add-product-form__field--in-row"
              alignInput
            >
              <Input
                size="large"
                placeholder="80% chegirma"
                value={color.discountUz}
                onChange={(event) =>
                  changeColorField(color.localId, 'discountUz', event.target.value)
                }
              />
            </FieldBlock>
            <FieldBlock
              label="Chegirma matni (Ruscha)"
              hint="Rus tilidagi chegirma yozuvi."
              className="add-product-form__field--in-row"
              alignInput
            >
              <Input
                size="large"
                placeholder="80% скидка"
                value={color.discountRu}
                onChange={(event) =>
                  changeColorField(color.localId, 'discountRu', event.target.value)
                }
              />
            </FieldBlock>
          </FieldRow>

          <div className="add-product-colors__images">
            <FieldBlock
              label="Rang asosiy rasmi (mainImage)"
              hint="Mijoz shu rangni tanlaganda ko'rinadigan asosiy rasm."
            >
              <ProductImageUploadField
                value={color.mainImage}
                onChange={(path) => changeColorField(color.localId, 'mainImage', path)}
                title="Rang rasmini yuklash"
                hint="Shu rang uchun asosiy foto"
                compact
              />
            </FieldBlock>

            <ProductThumbnailsUploadField
              images={color.thumbnails}
              onChange={(nextImages) => changeColorField(color.localId, 'thumbnails', nextImages)}
              title="Rang galereya rasmlari (thumbnails)"
              hint="Shu rang tanlanganda ko'rinadigan qo'shimcha rasmlar."
              slotHints={['1-qo‘shimcha rasm', ...COLOR_THUMBNAIL_HINTS]}
            />
          </div>
        </div>
      ))}
    </section>
  );
}
