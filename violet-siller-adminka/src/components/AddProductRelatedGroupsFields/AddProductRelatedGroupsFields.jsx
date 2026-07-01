import React, { useMemo } from 'react';
import { Button, Input } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import SellerProductIdPicker from '../SellerProductIdPicker/SellerProductIdPicker';
import {
  MAX_RELATED_PRODUCTS_PER_GROUP,
  createRelatedGroupDraft,
} from '../../utils/relatedGroupsDraft';
import './AddProductRelatedGroupsFields.css';

function FieldBlock({ label, hint, required = false, children, className = '', alignInput = false }) {
  const fieldClassName = [
    'add-product-form__field',
    alignInput ? 'add-product-related-groups__field--align-input' : '',
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
        <div className="add-product-related-groups__field-meta">{meta}</div>
        <div className="add-product-related-groups__field-control">{children}</div>
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

function updateGroup(list, localId, patch) {
  return list.map((group) => (group.localId === localId ? { ...group, ...patch } : group));
}

export default function AddProductRelatedGroupsFields({
  values,
  onChange,
  productPickerOptions = [],
  productPickerLoading = false,
}) {
  const { t } = useTranslation();

  const relatedGroups = useMemo(
    () => (Array.isArray(values.relatedGroups) ? values.relatedGroups : []),
    [values.relatedGroups],
  );

  const usedProductIds = useMemo(() => {
    const ids = new Set();
    relatedGroups.forEach((group) => {
      (group.productIds || []).forEach((id) => {
        const numericId = Number(id);
        if (Number.isFinite(numericId)) ids.add(numericId);
      });
    });
    return ids;
  }, [relatedGroups]);

  const changeGroupField = (localId, field, fieldValue) => {
    onChange({
      ...values,
      relatedGroups: updateGroup(relatedGroups, localId, { [field]: fieldValue }),
    });
  };

  const changeGroupProductId = (localId, slotIndex, nextProductId) => {
    onChange({
      ...values,
      relatedGroups: relatedGroups.map((group) => {
        if (group.localId !== localId) return group;
        const nextIds = [...(group.productIds || [])];
        nextIds[slotIndex] = Number(nextProductId);
        return {
          ...group,
          productIds: nextIds.filter((id) => Number.isFinite(Number(id))),
        };
      }),
    });
  };

  const removeGroupProductId = (localId, slotIndex) => {
    onChange({
      ...values,
      relatedGroups: relatedGroups.map((group) => {
        if (group.localId !== localId) return group;
        const nextIds = [...(group.productIds || [])];
        nextIds.splice(slotIndex, 1);
        return { ...group, productIds: nextIds };
      }),
    });
  };

  const addRelatedGroup = () => {
    onChange({
      ...values,
      relatedGroups: [...relatedGroups, createRelatedGroupDraft()],
    });
  };

  const removeRelatedGroup = (localId) => {
    onChange({
      ...values,
      relatedGroups: relatedGroups.filter((group) => group.localId !== localId),
    });
  };

  const pickerDisabled = productPickerLoading || productPickerOptions.length === 0;

  return (
    <section className="add-product-form__card add-product-related-groups">
      <h3 className="add-product-form__card-title">{t('addProduct.relatedGroups.title')}</h3>
      <p className="add-product-related-groups__intro">{t('addProduct.relatedGroups.intro')}</p>

      <div className="add-product-related-groups__toolbar">
        <Button type="dashed" icon={<PlusOutlined />} onClick={addRelatedGroup}>
          {t('addProduct.relatedGroups.addGroup')}
        </Button>
      </div>

      {productPickerLoading ? (
        <p className="add-product-related-groups__meta">{t('addProduct.relatedGroups.loadingProducts')}</p>
      ) : null}

      {!productPickerLoading && productPickerOptions.length === 0 ? (
        <p className="add-product-related-groups__meta">{t('addProduct.relatedGroups.noProducts')}</p>
      ) : null}

      {relatedGroups.length === 0 ? (
        <p className="add-product-related-groups__empty">{t('addProduct.relatedGroups.empty')}</p>
      ) : null}

      {relatedGroups.map((group, groupIndex) => (
        <div key={group.localId} className="add-product-related-groups__card">
          <div className="add-product-related-groups__card-head">
            <span className="add-product-related-groups__card-index">
              {t('addProduct.relatedGroups.groupIndex', { index: groupIndex + 1 })}
            </span>
            <Button type="link" danger onClick={() => removeRelatedGroup(group.localId)}>
              {t('addProduct.common.remove')}
            </Button>
          </div>

          <FieldRow hint={t('addProduct.relatedGroups.titleRowHint')}>
            <FieldBlock
              label={t('addProduct.relatedGroups.titleUzLabel')}
              hint={t('addProduct.relatedGroups.titleUzHint')}
              className="add-product-form__field--in-row"
              alignInput
            >
              <Input
                size="large"
                placeholder={t('addProduct.relatedGroups.titleUzPlaceholder')}
                value={group.titleUz}
                onChange={(event) =>
                  changeGroupField(group.localId, 'titleUz', event.target.value)
                }
              />
            </FieldBlock>
            <FieldBlock
              label={t('addProduct.relatedGroups.titleRuLabel')}
              hint={t('addProduct.relatedGroups.titleRuHint')}
              className="add-product-form__field--in-row"
              alignInput
            >
              <Input
                size="large"
                placeholder={t('addProduct.relatedGroups.titleRuPlaceholder')}
                value={group.titleRu}
                onChange={(event) =>
                  changeGroupField(group.localId, 'titleRu', event.target.value)
                }
              />
            </FieldBlock>
          </FieldRow>

          <div className="add-product-related-groups__products">
            <div className="add-product-related-groups__products-head">
              <div>
                <span className="add-product-form__field-label">
                  {t('addProduct.relatedGroups.linkedProductsLabel')}
                </span>
                <p className="add-product-form__field-hint">
                  {t('addProduct.relatedGroups.linkedProductsHint', {
                    max: MAX_RELATED_PRODUCTS_PER_GROUP,
                  })}
                </p>
              </div>
            </div>

            <div className="add-product-related-groups__product-slots">
              {Array.from({ length: MAX_RELATED_PRODUCTS_PER_GROUP }, (_, slotIndex) => {
                const currentId = group.productIds?.[slotIndex];
                const previousFilled =
                  slotIndex === 0 || Number.isFinite(Number(group.productIds?.[slotIndex - 1]));
                if (!previousFilled) return null;

                return (
                  <div
                    key={`${group.localId}-slot-${slotIndex}`}
                    className="add-product-related-groups__product-slot"
                  >
                    <FieldBlock
                      label={t('addProduct.relatedGroups.productLabel', { index: slotIndex + 1 })}
                      hint={t('addProduct.relatedGroups.productHint')}
                    >
                      <SellerProductIdPicker
                        value={currentId}
                        options={productPickerOptions}
                        usedIds={usedProductIds}
                        disabled={pickerDisabled}
                        placeholder={t('addProduct.relatedGroups.productPlaceholder')}
                        onSelect={(id) => changeGroupProductId(group.localId, slotIndex, id)}
                      />
                      {currentId ? (
                        <Button
                          type="link"
                          danger
                          className="add-product-related-groups__remove-product"
                          onClick={() => removeGroupProductId(group.localId, slotIndex)}
                        >
                          {t('addProduct.common.detach')}
                        </Button>
                      ) : null}
                    </FieldBlock>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ))}
    </section>
  );
}
