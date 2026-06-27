import React, { useMemo } from 'react';
import { Button, Input } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
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
      <h3 className="add-product-form__card-title">Stil g&apos;oyalari</h3>
      <p className="add-product-related-groups__intro">
        Mijoz mahsulot sahifasida «bilan birga kiyish» yoki stil g&apos;oyalari blokida
        ko&apos;rinadi. Har bir turkum — alohida stil yo&apos;nalishi (masalan pastki kiyimlar,
        oyoq kiyim).
      </p>

      <div className="add-product-related-groups__toolbar">
        <Button type="dashed" icon={<PlusOutlined />} onClick={addRelatedGroup}>
          Boshqa turkum qo&apos;shish
        </Button>
      </div>

      {productPickerLoading ? (
        <p className="add-product-related-groups__meta">Mahsulotlar ro&apos;yxati yuklanmoqda...</p>
      ) : null}

      {!productPickerLoading && productPickerOptions.length === 0 ? (
        <p className="add-product-related-groups__meta">
          Hozircha biriktirish uchun boshqa mahsulotlaringiz yo&apos;q. Avval kamida bitta
          mahsulot qo&apos;shilgan bo&apos;lishi kerak.
        </p>
      ) : null}

      {relatedGroups.length === 0 ? (
        <p className="add-product-related-groups__empty">
          Hozircha turkum yo&apos;q. «Boshqa turkum qo&apos;shish» tugmasini bosing.
        </p>
      ) : null}

      {relatedGroups.map((group, groupIndex) => (
        <div key={group.localId} className="add-product-related-groups__card">
          <div className="add-product-related-groups__card-head">
            <span className="add-product-related-groups__card-index">Turkum #{groupIndex + 1}</span>
            <Button type="link" danger onClick={() => removeRelatedGroup(group.localId)}>
              O&apos;chirish
            </Button>
          </div>

          <FieldRow hint="Bu turkum mijozga qanday stil yo&apos;nalishi ekanini tushuntiradi. Masalan: «Pastki kiyimlar» yoki «Ideal kombinatsiya».">
            <FieldBlock
              label="Turkum nomi (O'zbekcha)"
              hint="Stil g'oyeasi sarlavhasi — mijoz ko'radigan nom."
              className="add-product-form__field--in-row"
              alignInput
            >
              <Input
                size="large"
                placeholder="Pastki kiyimlar"
                value={group.titleUz}
                onChange={(event) =>
                  changeGroupField(group.localId, 'titleUz', event.target.value)
                }
              />
            </FieldBlock>
            <FieldBlock
              label="Turkum nomi (Ruscha)"
              hint="Rus tilidagi xaridorlar uchun xuddi shu nom."
              className="add-product-form__field--in-row"
              alignInput
            >
              <Input
                size="large"
                placeholder="Нижняя одежда"
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
                <span className="add-product-form__field-label">Biriktirilgan mahsulotlar</span>
                <p className="add-product-form__field-hint">
                  Har bir turkumda maksimal {MAX_RELATED_PRODUCTS_PER_GROUP} ta mahsulot.
                  Ro&apos;yxatda faqat sizning do&apos;koningizdagi mahsulotlar chiqadi — boshqa
                  sotuvchilarning mahsulotlari ko&apos;rinmaydi.
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
                      label={`Mahsulot ${slotIndex + 1}`}
                      hint="Inputni bosing — pastda faqat sizning mahsulotlaringiz ro'yxati ochiladi. ID va nomi bilan tanlang."
                    >
                      <SellerProductIdPicker
                        value={currentId}
                        options={productPickerOptions}
                        usedIds={usedProductIds}
                        disabled={pickerDisabled}
                        placeholder="Mahsulot tanlang"
                        onSelect={(id) => changeGroupProductId(group.localId, slotIndex, id)}
                      />
                      {currentId ? (
                        <Button
                          type="link"
                          danger
                          className="add-product-related-groups__remove-product"
                          onClick={() => removeGroupProductId(group.localId, slotIndex)}
                        >
                          Olib tashlash
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
