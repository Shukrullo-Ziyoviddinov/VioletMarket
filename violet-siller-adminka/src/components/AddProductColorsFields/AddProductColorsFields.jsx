import React, { useMemo, useState } from 'react';
import { Button, Input } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
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
  colorHasVariantStockData,
} from '../../utils/productColorsDraft';
import './AddProductColorsFields.css';

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
  const { t } = useTranslation();
  const [openKey, setOpenKey] = useState('');

  const thumbnailSlotHints = useMemo(
    () => t('addProduct.colors.thumbnailSlotHints', { returnObjects: true }),
    [t],
  );

  const colors = useMemo(
    () => (Array.isArray(values.colors) ? values.colors : []),
    [values.colors],
  );

  const addColor = () => {
    onChange((current) =>
      applyColorsChange(current, [...(Array.isArray(current.colors) ? current.colors : []), createColorDraft()]),
    );
  };

  const removeColor = (localId) => {
    onChange((current) =>
      applyColorsChange(
        current,
        (Array.isArray(current.colors) ? current.colors : []).filter((color) => color.localId !== localId),
      ),
    );
  };

  const changeColorField = (localId, field, fieldValue) => {
    onChange((current) => {
      const list = Array.isArray(current.colors) ? current.colors : [];
      return {
        ...current,
        colors: updateColor(list, localId, { [field]: fieldValue }),
      };
    });
  };

  const changeSizeStockRow = (localId, rowLocalId, patch) => {
    onChange((current) => {
      const list = Array.isArray(current.colors) ? current.colors : [];
      return {
        ...current,
        colors: list.map((color) => {
          if (color.localId !== localId) return color;
          return {
            ...color,
            sizeStockRows: (color.sizeStockRows || []).map((row) =>
              row.localId === rowLocalId ? { ...row, ...patch } : row,
            ),
          };
        }),
      };
    });
  };

  const addSizeStockRow = (localId) => {
    onChange((current) => {
      const list = Array.isArray(current.colors) ? current.colors : [];
      return {
        ...current,
        colors: list.map((color) => {
          if (color.localId !== localId) return color;
          return {
            ...color,
            sizeStockRows: [...(color.sizeStockRows || []), createSizeStockRow()],
          };
        }),
      };
    });
  };

  const removeSizeStockRow = (localId, rowLocalId) => {
    onChange((current) => {
      const list = Array.isArray(current.colors) ? current.colors : [];
      return {
        ...current,
        colors: list.map((color) => {
          if (color.localId !== localId) return color;
          const nextRows = (color.sizeStockRows || []).filter((row) => row.localId !== rowLocalId);
          return {
            ...color,
            sizeStockRows: nextRows.length > 0 ? nextRows : [createSizeStockRow()],
          };
        }),
      };
    });
  };

  const changeModelStockRow = (localId, rowLocalId, patch) => {
    onChange((current) => {
      const list = Array.isArray(current.colors) ? current.colors : [];
      return {
        ...current,
        colors: list.map((color) => {
          if (color.localId !== localId) return color;
          return {
            ...color,
            modelStockRows: (color.modelStockRows || []).map((row) =>
              row.localId === rowLocalId ? { ...row, ...patch } : row,
            ),
          };
        }),
      };
    });
  };

  const addModelStockRow = (localId) => {
    onChange((current) => {
      const list = Array.isArray(current.colors) ? current.colors : [];
      return {
        ...current,
        colors: list.map((color) => {
          if (color.localId !== localId) return color;
          return {
            ...color,
            modelStockRows: [...(color.modelStockRows || []), createModelStockRow()],
          };
        }),
      };
    });
  };

  const removeModelStockRow = (localId, rowLocalId) => {
    onChange((current) => {
      const list = Array.isArray(current.colors) ? current.colors : [];
      return {
        ...current,
        colors: list.map((color) => {
          if (color.localId !== localId) return color;
          return {
            ...color,
            modelStockRows: (color.modelStockRows || []).filter((row) => row.localId !== rowLocalId),
          };
        }),
      };
    });
  };

  const changeStorageStockRow = (localId, rowLocalId, patch) => {
    onChange((current) => {
      const list = Array.isArray(current.colors) ? current.colors : [];
      return {
        ...current,
        colors: list.map((color) => {
          if (color.localId !== localId) return color;
          return {
            ...color,
            storageStockRows: (color.storageStockRows || []).map((row) =>
              row.localId === rowLocalId ? { ...row, ...patch } : row,
            ),
          };
        }),
      };
    });
  };

  const addStorageStockRow = (localId) => {
    onChange((current) => {
      const list = Array.isArray(current.colors) ? current.colors : [];
      return {
        ...current,
        colors: list.map((color) => {
          if (color.localId !== localId) return color;
          return {
            ...color,
            storageStockRows: [...(color.storageStockRows || []), createStorageStockRow()],
          };
        }),
      };
    });
  };

  const removeStorageStockRow = (localId, rowLocalId) => {
    onChange((current) => {
      const list = Array.isArray(current.colors) ? current.colors : [];
      return {
        ...current,
        colors: list.map((color) => {
          if (color.localId !== localId) return color;
          return {
            ...color,
            storageStockRows: (color.storageStockRows || []).filter(
              (row) => row.localId !== rowLocalId,
            ),
          };
        }),
      };
    });
  };

  return (
    <section className="add-product-form__card add-product-colors">
      <h3 className="add-product-form__card-title">{t('addProduct.colors.title')}</h3>
      <p className="add-product-colors__intro">{t('addProduct.colors.intro')}</p>

      <div className="add-product-colors__toolbar">
        <Button type="dashed" icon={<PlusOutlined />} onClick={addColor}>
          {t('addProduct.colors.addColor')}
        </Button>
      </div>

      {colors.length === 0 ? (
        <p className="add-product-colors__empty">{t('addProduct.colors.empty')}</p>
      ) : null}

      {colors.map((color, colorIndex) => {
        const showColorQuantity = !colorHasVariantStockData(color);

        return (
        <div key={color.localId} className="add-product-colors__card">
          <div className="add-product-colors__card-head">
            <span className="add-product-colors__card-index">
              {t('addProduct.colors.colorIndex', { index: colorIndex + 1 })}
            </span>
            <Button type="link" danger onClick={() => removeColor(color.localId)}>
              {t('addProduct.common.remove')}
            </Button>
          </div>

          <FieldRow hint={t('addProduct.colors.nameRowHint')}>
            <FieldBlock
              label={t('addProduct.colors.nameUzLabel')}
              hint={t('addProduct.colors.nameUzHint')}
              className="add-product-form__field--in-row"
              alignInput
            >
              <Input
                size="large"
                placeholder={t('addProduct.colors.nameUzPlaceholder')}
                value={color.nameUz}
                onChange={(event) =>
                  changeColorField(color.localId, 'nameUz', event.target.value)
                }
              />
            </FieldBlock>
            <FieldBlock
              label={t('addProduct.colors.nameRuLabel')}
              hint={t('addProduct.colors.nameRuHint')}
              className="add-product-form__field--in-row"
              alignInput
            >
              <Input
                size="large"
                placeholder={t('addProduct.colors.nameRuPlaceholder')}
                value={color.nameRu}
                onChange={(event) =>
                  changeColorField(color.localId, 'nameRu', event.target.value)
                }
              />
            </FieldBlock>
          </FieldRow>

          <div className="add-product-colors__filter-field">
            <DropdownPicker
              label={t('addProduct.colors.colorFilterLabel')}
              hint={t('addProduct.colors.colorFilterHint')}
              mode="single"
              value={color.colorFilter}
              options={COLOR_FILTER_OPTIONS}
              placeholder={t('addProduct.colors.colorFilterPlaceholder')}
              emptyText={t('addProduct.colors.colorFilterEmpty')}
              isOpen={openKey === color.localId}
              onToggle={(open) => setOpenKey(open ? color.localId : '')}
              onSelect={(nextValue) => changeColorField(color.localId, 'colorFilter', nextValue)}
            />
          </div>

          {showColorQuantity ? (
            <FieldRow hint={t('addProduct.colors.quantityRowHint')}>
              <FieldBlock
                label={t('addProduct.colors.colorQuantityLabel')}
                hint={t('addProduct.colors.colorQuantityHint')}
                className="add-product-form__field--in-row add-product-colors__quantity-field"
                alignInput
              >
                <Input
                  size="large"
                  inputMode="numeric"
                  placeholder={t('addProduct.colors.colorQuantityPlaceholder')}
                  value={color.quantity ?? ''}
                  onChange={(event) =>
                    changeColorField(color.localId, 'quantity', event.target.value)
                  }
                />
              </FieldBlock>
            </FieldRow>
          ) : null}

          <div className="add-product-colors__section add-product-colors__section--size">
            <div className="add-product-colors__section-head">
              <div>
                <h4 className="add-product-colors__section-title">{t('addProduct.colors.sizeStockTitle')}</h4>
                <p className="add-product-colors__section-desc">{t('addProduct.colors.sizeStockDesc')}</p>
              </div>
              <Button
                type="dashed"
                size="small"
                icon={<PlusOutlined />}
                onClick={() => addSizeStockRow(color.localId)}
              >
                {t('addProduct.common.addMore')}
              </Button>
            </div>

            <div className="add-product-colors__size-stock-list">
              {(color.sizeStockRows || []).map((row, rowIndex) => (
                <div key={row.localId} className="add-product-colors__size-stock-row">
                  <FieldBlock
                    label={t('addProduct.colors.sizeLabel', { index: rowIndex + 1 })}
                    hint={t('addProduct.colors.sizeHint')}
                    className="add-product-colors__size-field"
                  >
                    <Input
                      size="large"
                      placeholder={t('addProduct.colors.sizePlaceholder')}
                      value={row.label}
                      onChange={(event) =>
                        changeSizeStockRow(color.localId, row.localId, {
                          label: event.target.value,
                        })
                      }
                    />
                  </FieldBlock>
                  <FieldBlock
                    label={t('addProduct.colors.quantityLabel')}
                    hint={t('addProduct.colors.quantityHint')}
                    className="add-product-colors__size-field"
                  >
                    <Input
                      size="large"
                      inputMode="numeric"
                      placeholder={t('addProduct.colors.quantityPlaceholder')}
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
                      {t('addProduct.common.remove')}
                    </Button>
                  ) : null}
                </div>
              ))}
            </div>
          </div>

          <div className="add-product-colors__section add-product-colors__section--model">
            <div className="add-product-colors__section-head">
              <div>
                <h4 className="add-product-colors__section-title">{t('addProduct.colors.modelStockTitle')}</h4>
                <p className="add-product-colors__section-desc">{t('addProduct.colors.modelStockDesc')}</p>
              </div>
              <Button
                type="dashed"
                size="small"
                icon={<PlusOutlined />}
                onClick={() => addModelStockRow(color.localId)}
              >
                {t('addProduct.common.addMore')}
              </Button>
            </div>

            {(color.modelStockRows || []).length === 0 ? (
              <p className="add-product-colors__section-empty">{t('addProduct.colors.modelStockEmpty')}</p>
            ) : null}

            <div className="add-product-colors__model-stock-list">
              {(color.modelStockRows || []).map((row, rowIndex) => (
                <div key={row.localId} className="add-product-colors__model-stock-row">
                  <FieldBlock
                    label={t('addProduct.colors.modelLabel', { index: rowIndex + 1 })}
                    hint={t('addProduct.colors.modelHint')}
                    className="add-product-colors__model-field"
                  >
                    <Input
                      size="large"
                      placeholder={t('addProduct.colors.modelPlaceholder')}
                      value={row.label}
                      onChange={(event) =>
                        changeModelStockRow(color.localId, row.localId, {
                          label: event.target.value,
                        })
                      }
                    />
                  </FieldBlock>
                  <FieldBlock
                    label={t('addProduct.colors.modelQuantityLabel')}
                    hint={t('addProduct.colors.modelQuantityHint')}
                    className="add-product-colors__model-field"
                  >
                    <Input
                      size="large"
                      inputMode="numeric"
                      placeholder={t('addProduct.colors.quantityPlaceholder')}
                      value={row.quantity}
                      onChange={(event) =>
                        changeModelStockRow(color.localId, row.localId, {
                          quantity: event.target.value,
                        })
                      }
                    />
                  </FieldBlock>
                  <FieldBlock
                    label={t('addProduct.colors.priceLabel')}
                    hint={t('addProduct.colors.priceHint')}
                    className="add-product-colors__model-field"
                  >
                    <Input
                      size="large"
                      placeholder={t('addProduct.colors.modelPricePlaceholder')}
                      value={row.price}
                      onChange={(event) =>
                        changeModelStockRow(color.localId, row.localId, {
                          price: event.target.value,
                        })
                      }
                    />
                  </FieldBlock>
                  <FieldBlock
                    label={t('addProduct.colors.originalPriceLabel')}
                    hint={t('addProduct.colors.originalPriceHint')}
                    className="add-product-colors__model-field"
                  >
                    <Input
                      size="large"
                      placeholder={t('addProduct.colors.modelPricePlaceholder')}
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
                    {t('addProduct.common.remove')}
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <div className="add-product-colors__section add-product-colors__section--storage">
            <div className="add-product-colors__section-head">
              <div>
                <h4 className="add-product-colors__section-title">{t('addProduct.colors.storageStockTitle')}</h4>
                <p className="add-product-colors__section-desc">{t('addProduct.colors.storageStockDesc')}</p>
              </div>
              <Button
                type="dashed"
                size="small"
                icon={<PlusOutlined />}
                onClick={() => addStorageStockRow(color.localId)}
              >
                {t('addProduct.common.addMore')}
              </Button>
            </div>

            {(color.storageStockRows || []).length === 0 ? (
              <p className="add-product-colors__section-empty">{t('addProduct.colors.storageStockEmpty')}</p>
            ) : null}

            <div className="add-product-colors__storage-stock-list">
              {(color.storageStockRows || []).map((row, rowIndex) => (
                <div key={row.localId} className="add-product-colors__storage-stock-row">
                  <FieldBlock
                    label={t('addProduct.colors.storageLabel', { index: rowIndex + 1 })}
                    hint={t('addProduct.colors.storageHint')}
                    className="add-product-colors__storage-field"
                  >
                    <Input
                      size="large"
                      placeholder={t('addProduct.colors.storagePlaceholder')}
                      value={row.label}
                      onChange={(event) =>
                        changeStorageStockRow(color.localId, row.localId, {
                          label: event.target.value,
                        })
                      }
                    />
                  </FieldBlock>
                  <FieldBlock
                    label={t('addProduct.colors.modelQuantityLabel')}
                    hint={t('addProduct.colors.storageQuantityHint')}
                    className="add-product-colors__storage-field"
                  >
                    <Input
                      size="large"
                      inputMode="numeric"
                      placeholder={t('addProduct.colors.quantityPlaceholder')}
                      value={row.quantity}
                      onChange={(event) =>
                        changeStorageStockRow(color.localId, row.localId, {
                          quantity: event.target.value,
                        })
                      }
                    />
                  </FieldBlock>
                  <FieldBlock
                    label={t('addProduct.colors.priceLabel')}
                    hint={t('addProduct.colors.storagePriceHint')}
                    className="add-product-colors__storage-field"
                  >
                    <Input
                      size="large"
                      placeholder={t('addProduct.colors.modelPricePlaceholder')}
                      value={row.price}
                      onChange={(event) =>
                        changeStorageStockRow(color.localId, row.localId, {
                          price: event.target.value,
                        })
                      }
                    />
                  </FieldBlock>
                  <FieldBlock
                    label={t('addProduct.colors.originalPriceLabel')}
                    hint={t('addProduct.colors.originalPriceHint')}
                    className="add-product-colors__storage-field"
                  >
                    <Input
                      size="large"
                      placeholder={t('addProduct.colors.colorOriginalPricePlaceholder')}
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
                    {t('addProduct.common.remove')}
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <FieldRow hint={t('addProduct.colors.priceRowHint')}>
            <FieldBlock
              label={t('addProduct.colors.colorPriceLabel')}
              hint={t('addProduct.colors.colorPriceHint')}
              className="add-product-form__field--in-row"
              alignInput
            >
              <Input
                size="large"
                placeholder={t('addProduct.colors.colorPricePlaceholder')}
                value={color.price}
                onChange={(event) => changeColorField(color.localId, 'price', event.target.value)}
              />
            </FieldBlock>
            <FieldBlock
              label={t('addProduct.colors.originalPriceLabel')}
              hint={t('addProduct.colors.originalPriceHint')}
              className="add-product-form__field--in-row"
              alignInput
            >
              <Input
                size="large"
                placeholder={t('addProduct.colors.colorOriginalPricePlaceholder')}
                value={color.originalPrice}
                onChange={(event) =>
                  changeColorField(color.localId, 'originalPrice', event.target.value)
                }
              />
            </FieldBlock>
          </FieldRow>

          <FieldRow>
            <FieldBlock
              label={t('addProduct.colors.discountUzLabel')}
              hint={t('addProduct.colors.discountUzHint')}
              className="add-product-form__field--in-row"
              alignInput
            >
              <Input
                size="large"
                placeholder={t('addProduct.colors.discountUzPlaceholder')}
                value={color.discountUz}
                onChange={(event) =>
                  changeColorField(color.localId, 'discountUz', event.target.value)
                }
              />
            </FieldBlock>
            <FieldBlock
              label={t('addProduct.colors.discountRuLabel')}
              hint={t('addProduct.colors.discountRuHint')}
              className="add-product-form__field--in-row"
              alignInput
            >
              <Input
                size="large"
                placeholder={t('addProduct.colors.discountRuPlaceholder')}
                value={color.discountRu}
                onChange={(event) =>
                  changeColorField(color.localId, 'discountRu', event.target.value)
                }
              />
            </FieldBlock>
          </FieldRow>

          <div className="add-product-colors__images">
            <FieldBlock
              label={t('addProduct.colors.mainImageLabel')}
              hint={t('addProduct.colors.mainImageHint')}
            >
              <ProductImageUploadField
                value={color.mainImage}
                onChange={(path) => changeColorField(color.localId, 'mainImage', path)}
                title={t('addProduct.colors.mainImageUploadTitle')}
                hint={t('addProduct.colors.mainImageUploadHint')}
                compact
              />
            </FieldBlock>

            <ProductThumbnailsUploadField
              images={color.thumbnails}
              onChange={(nextImages) => changeColorField(color.localId, 'thumbnails', nextImages)}
              title={t('addProduct.colors.thumbnailsTitle')}
              hint={t('addProduct.colors.thumbnailsHint')}
              slotHints={thumbnailSlotHints}
            />
          </div>
        </div>
        );
      })}
    </section>
  );
}
