import React from 'react';
import { Button, Input } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import {
  createSizeStockRow,
  createModelStockRow,
  createStorageStockRow,
} from '../../utils/productStockDraft';
import './AddProductStockFields.css';

function FieldBlock({ label, hint, children, className = '' }) {
  return (
    <div className={`add-product-form__field ${className}`.trim()}>
      <label className="add-product-form__field-label">{label}</label>
      {hint ? <p className="add-product-form__field-hint">{hint}</p> : null}
      {children}
    </div>
  );
}

export default function AddProductStockFields({ values, onChange }) {
  const colors = Array.isArray(values?.colors) ? values.colors : [];
  const hasColors = colors.length > 0;

  const sizeStockRows = Array.isArray(values?.sizeStockRows) ? values.sizeStockRows : [];
  const modelStockRows = Array.isArray(values?.modelStockRows) ? values.modelStockRows : [];
  const storageStockRows = Array.isArray(values?.storageStockRows) ? values.storageStockRows : [];

  const patchValues = (patch) => onChange({ ...values, ...patch });

  const changeSizeStockRow = (rowLocalId, patch) => {
    patchValues({
      sizeStockRows: sizeStockRows.map((row) =>
        row.localId === rowLocalId ? { ...row, ...patch } : row,
      ),
    });
  };

  const addSizeStockRow = () => {
    patchValues({ sizeStockRows: [...sizeStockRows, createSizeStockRow()] });
  };

  const removeSizeStockRow = (rowLocalId) => {
    const nextRows = sizeStockRows.filter((row) => row.localId !== rowLocalId);
    patchValues({
      sizeStockRows: nextRows.length > 0 ? nextRows : [createSizeStockRow()],
    });
  };

  const changeModelStockRow = (rowLocalId, patch) => {
    patchValues({
      modelStockRows: modelStockRows.map((row) =>
        row.localId === rowLocalId ? { ...row, ...patch } : row,
      ),
    });
  };

  const addModelStockRow = () => {
    patchValues({ modelStockRows: [...modelStockRows, createModelStockRow()] });
  };

  const removeModelStockRow = (rowLocalId) => {
    patchValues({
      modelStockRows: modelStockRows.filter((row) => row.localId !== rowLocalId),
    });
  };

  const changeStorageStockRow = (rowLocalId, patch) => {
    patchValues({
      storageStockRows: storageStockRows.map((row) =>
        row.localId === rowLocalId ? { ...row, ...patch } : row,
      ),
    });
  };

  const addStorageStockRow = () => {
    patchValues({ storageStockRows: [...storageStockRows, createStorageStockRow()] });
  };

  const removeStorageStockRow = (rowLocalId) => {
    patchValues({
      storageStockRows: storageStockRows.filter((row) => row.localId !== rowLocalId),
    });
  };

  return (
    <section className="add-product-form__card add-product-stock">
      <h3 className="add-product-form__card-title">Mahsulot ombori (colors dan tashqari)</h3>

      {hasColors ? (
        <p className="add-product-stock__hidden-note">
          Ranglar qo&apos;shilgan — ombor har bir rang kartasida to&apos;ldiriladi. Tashqi ombor
          maydonlari yashirilgan; ranglar olib tashlansa, oldingi ma&apos;lumotlar qayta tiklanadi.
        </p>
      ) : (
        <>
          <p className="add-product-stock__intro">
            Agar mahsulot bir rangda bo&apos;lsa yoki rang tanlovi bo&apos;lmasa, omborni shu yerda
            kiriting. Bir vaqtning o&apos;zida <strong>sizeStock</strong>, <strong>modelStock</strong>{' '}
            va <strong>storageStock</strong> maydonlarini ham to&apos;ldirish mumkin — masalan telefon
            uchun model va xotira variantlari birga.
          </p>

          <div className="add-product-stock__section">
            <div className="add-product-stock__section-head">
              <div>
                <h4 className="add-product-stock__section-title">O&apos;lcham va miqdor (sizeStock)</h4>
                <p className="add-product-stock__section-desc">
                  Kiyim va o&apos;lchamli mahsulotlar uchun. Narx asosiy ma&apos;lumotdagi umumiy
                  narx maydonidan olinadi.
                </p>
              </div>
              <Button type="dashed" size="small" icon={<PlusOutlined />} onClick={addSizeStockRow}>
                Yana
              </Button>
            </div>

            <div className="add-product-stock__size-list">
              {sizeStockRows.map((row, rowIndex) => (
                <div key={row.localId} className="add-product-stock__size-row">
                  <FieldBlock
                    label={`O'lcham ${rowIndex + 1}`}
                    hint="Masalan: S, M, XL yoki 38."
                    className="add-product-stock__field"
                  >
                    <Input
                      size="large"
                      placeholder="S"
                      value={row.label}
                      onChange={(event) =>
                        changeSizeStockRow(row.localId, { label: event.target.value })
                      }
                    />
                  </FieldBlock>
                  <FieldBlock
                    label="Miqdor (quantity)"
                    hint="Shu o'lchamdan nechta dona bor."
                    className="add-product-stock__field"
                  >
                    <Input
                      size="large"
                      inputMode="numeric"
                      placeholder="1"
                      value={row.quantity}
                      onChange={(event) =>
                        changeSizeStockRow(row.localId, { quantity: event.target.value })
                      }
                    />
                  </FieldBlock>
                  {sizeStockRows.length > 1 ? (
                    <Button
                      type="link"
                      danger
                      className="add-product-stock__remove"
                      onClick={() => removeSizeStockRow(row.localId)}
                    >
                      O&apos;chirish
                    </Button>
                  ) : null}
                </div>
              ))}
            </div>
          </div>

          <div className="add-product-stock__section add-product-stock__section--model">
            <div className="add-product-stock__section-head">
              <div>
                <h4 className="add-product-stock__section-title">Model va narx (modelStock)</h4>
                <p className="add-product-stock__section-desc">
                  Telefon va model nomi bilan sotiladigan mahsulotlar uchun. Har bir qatorda model,
                  miqdor va narxlar.
                </p>
              </div>
              <Button type="dashed" size="small" icon={<PlusOutlined />} onClick={addModelStockRow}>
                Yana
              </Button>
            </div>

            {modelStockRows.length === 0 ? (
              <p className="add-product-stock__section-empty">
                Model qatori yo&apos;q. «Yana» tugmasini bosing — masalan S20, S24 ULTRA.
              </p>
            ) : null}

            <div className="add-product-stock__variant-list">
              {modelStockRows.map((row, rowIndex) => (
                <div key={row.localId} className="add-product-stock__variant-row">
                  <FieldBlock
                    label={`Model ${rowIndex + 1}`}
                    hint="Model nomi. Masalan: S20, A30."
                    className="add-product-stock__field"
                  >
                    <Input
                      size="large"
                      placeholder="S20"
                      value={row.label}
                      onChange={(event) =>
                        changeModelStockRow(row.localId, { label: event.target.value })
                      }
                    />
                  </FieldBlock>
                  <FieldBlock
                    label="Miqdor"
                    hint="Shu modeldan nechta dona bor."
                    className="add-product-stock__field"
                  >
                    <Input
                      size="large"
                      inputMode="numeric"
                      placeholder="1"
                      value={row.quantity}
                      onChange={(event) =>
                        changeModelStockRow(row.localId, { quantity: event.target.value })
                      }
                    />
                  </FieldBlock>
                  <FieldBlock
                    label="Narxi"
                    hint="Shu model uchun sotuv narxi."
                    className="add-product-stock__field"
                  >
                    <Input
                      size="large"
                      placeholder="$10"
                      value={row.price}
                      onChange={(event) =>
                        changeModelStockRow(row.localId, { price: event.target.value })
                      }
                    />
                  </FieldBlock>
                  <FieldBlock
                    label="Eski narxi"
                    hint="Chegirma bo'lsa, chizilgan eski narx."
                    className="add-product-stock__field"
                  >
                    <Input
                      size="large"
                      placeholder="$10"
                      value={row.originalPrice}
                      onChange={(event) =>
                        changeModelStockRow(row.localId, { originalPrice: event.target.value })
                      }
                    />
                  </FieldBlock>
                  <Button
                    type="link"
                    danger
                    className="add-product-stock__remove"
                    onClick={() => removeModelStockRow(row.localId)}
                  >
                    O&apos;chirish
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <div className="add-product-stock__section add-product-stock__section--storage">
            <div className="add-product-stock__section-head">
              <div>
                <h4 className="add-product-stock__section-title">Xotira va narx (storageStock)</h4>
                <p className="add-product-stock__section-desc">
                  Xotira hajmi bo&apos;yicha sotiladigan mahsulotlar uchun. Masalan 12/256 yoki
                  8/128. modelStock bilan birga ham ishlatish mumkin.
                </p>
              </div>
              <Button
                type="dashed"
                size="small"
                icon={<PlusOutlined />}
                onClick={addStorageStockRow}
              >
                Yana
              </Button>
            </div>

            {storageStockRows.length === 0 ? (
              <p className="add-product-stock__section-empty">
                Xotira qatori yo&apos;q. «Yana» tugmasini bosing — masalan 12/256, 8/128.
              </p>
            ) : null}

            <div className="add-product-stock__variant-list">
              {storageStockRows.map((row, rowIndex) => (
                <div key={row.localId} className="add-product-stock__variant-row">
                  <FieldBlock
                    label={`Xotira ${rowIndex + 1}`}
                    hint="Xotira nomi. Masalan: 12/256 (RAM/GB)."
                    className="add-product-stock__field"
                  >
                    <Input
                      size="large"
                      placeholder="12/256"
                      value={row.label}
                      onChange={(event) =>
                        changeStorageStockRow(row.localId, { label: event.target.value })
                      }
                    />
                  </FieldBlock>
                  <FieldBlock
                    label="Miqdor"
                    hint="Shu xotira variantidan nechta dona bor."
                    className="add-product-stock__field"
                  >
                    <Input
                      size="large"
                      inputMode="numeric"
                      placeholder="1"
                      value={row.quantity}
                      onChange={(event) =>
                        changeStorageStockRow(row.localId, { quantity: event.target.value })
                      }
                    />
                  </FieldBlock>
                  <FieldBlock
                    label="Narxi"
                    hint="Shu xotira varianti uchun sotuv narxi."
                    className="add-product-stock__field"
                  >
                    <Input
                      size="large"
                      placeholder="$10"
                      value={row.price}
                      onChange={(event) =>
                        changeStorageStockRow(row.localId, { price: event.target.value })
                      }
                    />
                  </FieldBlock>
                  <FieldBlock
                    label="Eski narxi"
                    hint="Chegirma bo'lsa, chizilgan eski narx."
                    className="add-product-stock__field"
                  >
                    <Input
                      size="large"
                      placeholder="$10"
                      value={row.originalPrice}
                      onChange={(event) =>
                        changeStorageStockRow(row.localId, { originalPrice: event.target.value })
                      }
                    />
                  </FieldBlock>
                  <Button
                    type="link"
                    danger
                    className="add-product-stock__remove"
                    onClick={() => removeStorageStockRow(row.localId)}
                  >
                    O&apos;chirish
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </section>
  );
}
