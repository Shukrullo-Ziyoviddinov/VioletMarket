import React from 'react';
import { Button, Input } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import {
  PRODUCT_ABOUT_TITLE,
  createMainFeatureRow,
  createTechnicalSpecRow,
} from '../../utils/productDescriptionDraft';
import './AddProductDescriptionFields.css';

const { TextArea } = Input;

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

function FieldRow({ children, hint }) {
  return (
    <div className="add-product-form__row">
      {hint ? <p className="add-product-form__row-hint">{hint}</p> : null}
      <div className="add-product-form__row-grid">{children}</div>
    </div>
  );
}

function updateListItem(list, localId, patch) {
  return list.map((item) => (item.localId === localId ? { ...item, ...patch } : item));
}

export default function AddProductDescriptionFields({ values, onChange }) {
  const mainFeatures = Array.isArray(values.mainFeatures) ? values.mainFeatures : [];
  const technicalSpecs = Array.isArray(values.technicalSpecs) ? values.technicalSpecs : [];

  const setField = (key) => (event) => {
    onChange({ ...values, [key]: event.target.value });
  };

  const handleMainFeatureChange = (localId, key) => (event) => {
    onChange({
      ...values,
      mainFeatures: updateListItem(mainFeatures, localId, { [key]: event.target.value }),
    });
  };

  const handleTechnicalSpecChange = (localId, key) => (event) => {
    onChange({
      ...values,
      technicalSpecs: updateListItem(technicalSpecs, localId, { [key]: event.target.value }),
    });
  };

  const addMainFeature = () => {
    onChange({
      ...values,
      mainFeatures: [...mainFeatures, createMainFeatureRow()],
    });
  };

  const removeMainFeature = (localId) => {
    if (mainFeatures.length <= 1) return;
    onChange({
      ...values,
      mainFeatures: mainFeatures.filter((item) => item.localId !== localId),
    });
  };

  const addTechnicalSpec = () => {
    onChange({
      ...values,
      technicalSpecs: [...technicalSpecs, createTechnicalSpecRow()],
    });
  };

  const removeTechnicalSpec = (localId) => {
    if (technicalSpecs.length <= 1) return;
    onChange({
      ...values,
      technicalSpecs: technicalSpecs.filter((item) => item.localId !== localId),
    });
  };

  return (
    <section className="add-product-form__card add-product-description">
      <h3 className="add-product-form__card-title">Mahsulot tavsifi</h3>

      <FieldBlock
        label="Bo'lim sarlavhasi"
        hint="Bu sarlavha doimiy — mijoz saytida mahsulot haqida bo'limi shu nom bilan chiqadi."
      >
        <FieldRow>
          <FieldBlock label="O'zbekcha" className="add-product-form__field--in-row">
            <Input size="large" readOnly value={PRODUCT_ABOUT_TITLE.uz} className="add-product-description__readonly" />
          </FieldBlock>
          <FieldBlock label="Ruscha" className="add-product-form__field--in-row">
            <Input size="large" readOnly value={PRODUCT_ABOUT_TITLE.ru} className="add-product-description__readonly" />
          </FieldBlock>
        </FieldRow>
      </FieldBlock>

      <FieldRow hint="Mahsulot haqida qisqa va tushunarli ma'lumot yozing.">
        <FieldBlock label="Ma'lumot (O'zbekcha)" required className="add-product-form__field--in-row">
          <TextArea
            rows={4}
            placeholder="Mahsulot haqida batafsil ma'lumot"
            value={values.descriptionInfoUz}
            onChange={setField('descriptionInfoUz')}
          />
        </FieldBlock>
        <FieldBlock label="Ma'lumot (Ruscha)" required className="add-product-form__field--in-row">
          <TextArea
            rows={4}
            placeholder="Подробная информация о товаре"
            value={values.descriptionInfoRu}
            onChange={setField('descriptionInfoRu')}
          />
        </FieldBlock>
      </FieldRow>

      <FieldRow hint="Asosiy xususiyatlar bo'limi sarlavhasi.">
        <FieldBlock label="Asosiy xususiyatlar sarlavhasi (O'zbekcha)" className="add-product-form__field--in-row">
          <Input
            size="large"
            placeholder="Asosiy xususiyatlar"
            value={values.mainFeaturesHeadingUz}
            onChange={setField('mainFeaturesHeadingUz')}
          />
        </FieldBlock>
        <FieldBlock label="Asosiy xususiyatlar sarlavhasi (Ruscha)" className="add-product-form__field--in-row">
          <Input
            size="large"
            placeholder="Основные характеристики"
            value={values.mainFeaturesHeadingRu}
            onChange={setField('mainFeaturesHeadingRu')}
          />
        </FieldBlock>
      </FieldRow>

      <div className="add-product-description__section">
        <div className="add-product-description__section-head">
          <h4 className="add-product-description__section-title">Asosiy xususiyatlar</h4>
          <Button type="dashed" icon={<PlusOutlined />} onClick={addMainFeature}>
            Yana
          </Button>
        </div>

        {mainFeatures.map((feature, index) => (
          <div key={feature.localId} className="add-product-description__item-card">
            <div className="add-product-description__item-head">
              <span className="add-product-description__item-index">#{index + 1}</span>
              {mainFeatures.length > 1 ? (
                <Button type="link" danger onClick={() => removeMainFeature(feature.localId)}>
                  O&apos;chirish
                </Button>
              ) : null}
            </div>

            <FieldRow>
              <FieldBlock label="Sarlavha (O'zbekcha)" className="add-product-form__field--in-row">
                <Input
                  size="large"
                  placeholder="Sifatli material"
                  value={feature.titleUz}
                  onChange={handleMainFeatureChange(feature.localId, 'titleUz')}
                />
              </FieldBlock>
              <FieldBlock label="Sarlavha (Ruscha)" className="add-product-form__field--in-row">
                <Input
                  size="large"
                  placeholder="Качественные материалы"
                  value={feature.titleRu}
                  onChange={handleMainFeatureChange(feature.localId, 'titleRu')}
                />
              </FieldBlock>
            </FieldRow>

            <FieldRow>
              <FieldBlock label="Tavsif (O'zbekcha)" className="add-product-form__field--in-row">
                <TextArea
                  rows={3}
                  placeholder="Yuqori sifatli va ekologik jihatdan xavfsiz materiallardan tayyorlangan."
                  value={feature.textUz}
                  onChange={handleMainFeatureChange(feature.localId, 'textUz')}
                />
              </FieldBlock>
              <FieldBlock label="Tavsif (Ruscha)" className="add-product-form__field--in-row">
                <TextArea
                  rows={3}
                  placeholder="Изготовлено из высококачественных и экологичных материалов."
                  value={feature.textRu}
                  onChange={handleMainFeatureChange(feature.localId, 'textRu')}
                />
              </FieldBlock>
            </FieldRow>
          </div>
        ))}
      </div>

      <FieldRow hint="Texnik ma'lumotlar bo'limi sarlavhasi.">
        <FieldBlock label="Texnik ma'lumotlar sarlavhasi (O'zbekcha)" className="add-product-form__field--in-row">
          <Input
            size="large"
            placeholder="Texnik ma'lumotlar"
            value={values.technicalHeadingUz}
            onChange={setField('technicalHeadingUz')}
          />
        </FieldBlock>
        <FieldBlock label="Texnik ma'lumotlar sarlavhasi (Ruscha)" className="add-product-form__field--in-row">
          <Input
            size="large"
            placeholder="Технические характеристики"
            value={values.technicalHeadingRu}
            onChange={setField('technicalHeadingRu')}
          />
        </FieldBlock>
      </FieldRow>

      <div className="add-product-description__section">
        <div className="add-product-description__section-head">
          <h4 className="add-product-description__section-title">Texnik ma'lumotlar</h4>
          <Button type="dashed" icon={<PlusOutlined />} onClick={addTechnicalSpec}>
            Yana
          </Button>
        </div>

        {technicalSpecs.map((spec, index) => (
          <div key={spec.localId} className="add-product-description__item-card">
            <div className="add-product-description__item-head">
              <span className="add-product-description__item-index">#{index + 1}</span>
              {technicalSpecs.length > 1 ? (
                <Button type="link" danger onClick={() => removeTechnicalSpec(spec.localId)}>
                  O&apos;chirish
                </Button>
              ) : null}
            </div>

            <FieldRow>
              <FieldBlock label="Label (O'zbekcha)" className="add-product-form__field--in-row">
                <Input
                  size="large"
                  placeholder="Mahsulot turi"
                  value={spec.labelUz}
                  onChange={handleTechnicalSpecChange(spec.localId, 'labelUz')}
                />
              </FieldBlock>
              <FieldBlock label="Label (Ruscha)" className="add-product-form__field--in-row">
                <Input
                  size="large"
                  placeholder="Тип товара"
                  value={spec.labelRu}
                  onChange={handleTechnicalSpecChange(spec.localId, 'labelRu')}
                />
              </FieldBlock>
            </FieldRow>

            <FieldRow>
              <FieldBlock label="Value (O'zbekcha)" className="add-product-form__field--in-row">
                <Input
                  size="large"
                  placeholder="Universal"
                  value={spec.valueUz}
                  onChange={handleTechnicalSpecChange(spec.localId, 'valueUz')}
                />
              </FieldBlock>
              <FieldBlock label="Value (Ruscha)" className="add-product-form__field--in-row">
                <Input
                  size="large"
                  placeholder="Универсальный"
                  value={spec.valueRu}
                  onChange={handleTechnicalSpecChange(spec.localId, 'valueRu')}
                />
              </FieldBlock>
            </FieldRow>
          </div>
        ))}
      </div>
    </section>
  );
}
