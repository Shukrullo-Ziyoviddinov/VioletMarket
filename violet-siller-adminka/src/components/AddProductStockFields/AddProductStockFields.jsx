import React from 'react';
import { Button, Input } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
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
      <h3 className="add-product-form__card-title">{t('addProduct.stock.title')}</h3>

      {hasColors ? (
        <p className="add-product-stock__hidden-note">{t('addProduct.stock.hiddenNote')}</p>
      ) : (
        <>
          <p className="add-product-stock__intro">{t('addProduct.stock.intro')}</p>

          <div className="add-product-stock__section">
            <div className="add-product-stock__section-head">
              <div>
                <h4 className="add-product-stock__section-title">{t('addProduct.stock.sizeStockTitle')}</h4>
                <p className="add-product-stock__section-desc">{t('addProduct.stock.sizeStockDesc')}</p>
              </div>
              <Button type="dashed" size="small" icon={<PlusOutlined />} onClick={addSizeStockRow}>
                {t('addProduct.common.addMore')}
              </Button>
            </div>

            <div className="add-product-stock__size-list">
              {sizeStockRows.map((row, rowIndex) => (
                <div key={row.localId} className="add-product-stock__size-row">
                  <FieldBlock
                    label={t('addProduct.stock.sizeLabel', { index: rowIndex + 1 })}
                    hint={t('addProduct.stock.sizeHint')}
                    className="add-product-stock__field"
                  >
                    <Input
                      size="large"
                      placeholder={t('addProduct.stock.sizePlaceholder')}
                      value={row.label}
                      onChange={(event) =>
                        changeSizeStockRow(row.localId, { label: event.target.value })
                      }
                    />
                  </FieldBlock>
                  <FieldBlock
                    label={t('addProduct.stock.quantityLabel')}
                    hint={t('addProduct.stock.quantityHint')}
                    className="add-product-stock__field"
                  >
                    <Input
                      size="large"
                      inputMode="numeric"
                      placeholder={t('addProduct.stock.quantityPlaceholder')}
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
                      {t('addProduct.common.remove')}
                    </Button>
                  ) : null}
                </div>
              ))}
            </div>
          </div>

          <div className="add-product-stock__section add-product-stock__section--model">
            <div className="add-product-stock__section-head">
              <div>
                <h4 className="add-product-stock__section-title">{t('addProduct.stock.modelStockTitle')}</h4>
                <p className="add-product-stock__section-desc">{t('addProduct.stock.modelStockDesc')}</p>
              </div>
              <Button type="dashed" size="small" icon={<PlusOutlined />} onClick={addModelStockRow}>
                {t('addProduct.common.addMore')}
              </Button>
            </div>

            {modelStockRows.length === 0 ? (
              <p className="add-product-stock__section-empty">{t('addProduct.stock.modelStockEmpty')}</p>
            ) : null}

            <div className="add-product-stock__variant-list">
              {modelStockRows.map((row, rowIndex) => (
                <div key={row.localId} className="add-product-stock__variant-row">
                  <FieldBlock
                    label={t('addProduct.stock.modelLabel', { index: rowIndex + 1 })}
                    hint={t('addProduct.stock.modelHint')}
                    className="add-product-stock__field"
                  >
                    <Input
                      size="large"
                      placeholder={t('addProduct.stock.modelPlaceholder')}
                      value={row.label}
                      onChange={(event) =>
                        changeModelStockRow(row.localId, { label: event.target.value })
                      }
                    />
                  </FieldBlock>
                  <FieldBlock
                    label={t('addProduct.stock.quantityLabel')}
                    hint={t('addProduct.stock.modelQuantityHint')}
                    className="add-product-stock__field"
                  >
                    <Input
                      size="large"
                      inputMode="numeric"
                      placeholder={t('addProduct.stock.quantityPlaceholder')}
                      value={row.quantity}
                      onChange={(event) =>
                        changeModelStockRow(row.localId, { quantity: event.target.value })
                      }
                    />
                  </FieldBlock>
                  <FieldBlock
                    label={t('addProduct.stock.priceLabel')}
                    hint={t('addProduct.stock.priceHint')}
                    className="add-product-stock__field"
                  >
                    <Input
                      size="large"
                      placeholder={t('addProduct.stock.pricePlaceholder')}
                      value={row.price}
                      onChange={(event) =>
                        changeModelStockRow(row.localId, { price: event.target.value })
                      }
                    />
                  </FieldBlock>
                  <FieldBlock
                    label={t('addProduct.stock.originalPriceLabel')}
                    hint={t('addProduct.stock.originalPriceHint')}
                    className="add-product-stock__field"
                  >
                    <Input
                      size="large"
                      placeholder={t('addProduct.stock.pricePlaceholder')}
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
                    {t('addProduct.common.remove')}
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <div className="add-product-stock__section add-product-stock__section--storage">
            <div className="add-product-stock__section-head">
              <div>
                <h4 className="add-product-stock__section-title">{t('addProduct.stock.storageStockTitle')}</h4>
                <p className="add-product-stock__section-desc">{t('addProduct.stock.storageStockDesc')}</p>
              </div>
              <Button
                type="dashed"
                size="small"
                icon={<PlusOutlined />}
                onClick={addStorageStockRow}
              >
                {t('addProduct.common.addMore')}
              </Button>
            </div>

            {storageStockRows.length === 0 ? (
              <p className="add-product-stock__section-empty">{t('addProduct.stock.storageStockEmpty')}</p>
            ) : null}

            <div className="add-product-stock__variant-list">
              {storageStockRows.map((row, rowIndex) => (
                <div key={row.localId} className="add-product-stock__variant-row">
                  <FieldBlock
                    label={t('addProduct.stock.storageLabel', { index: rowIndex + 1 })}
                    hint={t('addProduct.stock.storageHint')}
                    className="add-product-stock__field"
                  >
                    <Input
                      size="large"
                      placeholder={t('addProduct.stock.storagePlaceholder')}
                      value={row.label}
                      onChange={(event) =>
                        changeStorageStockRow(row.localId, { label: event.target.value })
                      }
                    />
                  </FieldBlock>
                  <FieldBlock
                    label={t('addProduct.stock.quantityLabel')}
                    hint={t('addProduct.stock.storageQuantityHint')}
                    className="add-product-stock__field"
                  >
                    <Input
                      size="large"
                      inputMode="numeric"
                      placeholder={t('addProduct.stock.quantityPlaceholder')}
                      value={row.quantity}
                      onChange={(event) =>
                        changeStorageStockRow(row.localId, { quantity: event.target.value })
                      }
                    />
                  </FieldBlock>
                  <FieldBlock
                    label={t('addProduct.stock.priceLabel')}
                    hint={t('addProduct.stock.storagePriceHint')}
                    className="add-product-stock__field"
                  >
                    <Input
                      size="large"
                      placeholder={t('addProduct.stock.pricePlaceholder')}
                      value={row.price}
                      onChange={(event) =>
                        changeStorageStockRow(row.localId, { price: event.target.value })
                      }
                    />
                  </FieldBlock>
                  <FieldBlock
                    label={t('addProduct.stock.originalPriceLabel')}
                    hint={t('addProduct.stock.originalPriceHint')}
                    className="add-product-stock__field"
                  >
                    <Input
                      size="large"
                      placeholder={t('addProduct.stock.pricePlaceholder')}
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
                    {t('addProduct.common.remove')}
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
