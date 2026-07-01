import React from 'react';
import { Button, Input } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import {
  createMainFeatureRow,
  createTechnicalSpecRow,
} from '../../utils/productDescriptionDraft';
import AddProductDescriptionImagesField from '../AddProductDescriptionImagesField/AddProductDescriptionImagesField';
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
  const { t } = useTranslation();
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
      <h3 className="add-product-form__card-title">{t('addProduct.description.title')}</h3>

      <FieldBlock
        label={t('addProduct.description.sectionHeadingLabel')}
        hint={t('addProduct.description.sectionHeadingHint')}
      >
        <FieldRow>
          <FieldBlock label={t('addProduct.common.uzbek')} className="add-product-form__field--in-row">
            <Input
              size="large"
              readOnly
              value={t('addProduct.description.aboutTitleUz')}
              className="add-product-description__readonly"
            />
          </FieldBlock>
          <FieldBlock label={t('addProduct.common.russian')} className="add-product-form__field--in-row">
            <Input
              size="large"
              readOnly
              value={t('addProduct.description.aboutTitleRu')}
              className="add-product-description__readonly"
            />
          </FieldBlock>
        </FieldRow>
      </FieldBlock>

      <FieldRow hint={t('addProduct.description.infoRowHint')}>
        <FieldBlock
          label={t('addProduct.description.infoUzLabel')}
          required
          className="add-product-form__field--in-row"
        >
          <TextArea
            rows={4}
            placeholder={t('addProduct.description.infoUzPlaceholder')}
            value={values.descriptionInfoUz}
            onChange={setField('descriptionInfoUz')}
          />
        </FieldBlock>
        <FieldBlock
          label={t('addProduct.description.infoRuLabel')}
          required
          className="add-product-form__field--in-row"
        >
          <TextArea
            rows={4}
            placeholder={t('addProduct.description.infoRuPlaceholder')}
            value={values.descriptionInfoRu}
            onChange={setField('descriptionInfoRu')}
          />
        </FieldBlock>
      </FieldRow>

      <FieldRow hint={t('addProduct.description.mainFeaturesHeadingRowHint')}>
        <FieldBlock
          label={t('addProduct.description.mainFeaturesHeadingUzLabel')}
          className="add-product-form__field--in-row"
        >
          <Input
            size="large"
            placeholder={t('addProduct.description.mainFeaturesHeadingUzPlaceholder')}
            value={values.mainFeaturesHeadingUz}
            onChange={setField('mainFeaturesHeadingUz')}
          />
        </FieldBlock>
        <FieldBlock
          label={t('addProduct.description.mainFeaturesHeadingRuLabel')}
          className="add-product-form__field--in-row"
        >
          <Input
            size="large"
            placeholder={t('addProduct.description.mainFeaturesHeadingRuPlaceholder')}
            value={values.mainFeaturesHeadingRu}
            onChange={setField('mainFeaturesHeadingRu')}
          />
        </FieldBlock>
      </FieldRow>

      <div className="add-product-description__section">
        <div className="add-product-description__section-head">
          <h4 className="add-product-description__section-title">
            {t('addProduct.description.mainFeaturesTitle')}
          </h4>
          <Button type="dashed" icon={<PlusOutlined />} onClick={addMainFeature}>
            {t('addProduct.common.addMore')}
          </Button>
        </div>

        {mainFeatures.map((feature, index) => (
          <div key={feature.localId} className="add-product-description__item-card">
            <div className="add-product-description__item-head">
              <span className="add-product-description__item-index">
                {t('addProduct.common.itemIndex', { index: index + 1 })}
              </span>
              {mainFeatures.length > 1 ? (
                <Button type="link" danger onClick={() => removeMainFeature(feature.localId)}>
                  {t('addProduct.common.remove')}
                </Button>
              ) : null}
            </div>

            <FieldRow>
              <FieldBlock
                label={t('addProduct.description.featureTitleUzLabel')}
                className="add-product-form__field--in-row"
              >
                <Input
                  size="large"
                  placeholder={t('addProduct.description.featureTitleUzPlaceholder')}
                  value={feature.titleUz}
                  onChange={handleMainFeatureChange(feature.localId, 'titleUz')}
                />
              </FieldBlock>
              <FieldBlock
                label={t('addProduct.description.featureTitleRuLabel')}
                className="add-product-form__field--in-row"
              >
                <Input
                  size="large"
                  placeholder={t('addProduct.description.featureTitleRuPlaceholder')}
                  value={feature.titleRu}
                  onChange={handleMainFeatureChange(feature.localId, 'titleRu')}
                />
              </FieldBlock>
            </FieldRow>

            <FieldRow>
              <FieldBlock
                label={t('addProduct.description.featureTextUzLabel')}
                className="add-product-form__field--in-row"
              >
                <TextArea
                  rows={3}
                  placeholder={t('addProduct.description.featureTextUzPlaceholder')}
                  value={feature.textUz}
                  onChange={handleMainFeatureChange(feature.localId, 'textUz')}
                />
              </FieldBlock>
              <FieldBlock
                label={t('addProduct.description.featureTextRuLabel')}
                className="add-product-form__field--in-row"
              >
                <TextArea
                  rows={3}
                  placeholder={t('addProduct.description.featureTextRuPlaceholder')}
                  value={feature.textRu}
                  onChange={handleMainFeatureChange(feature.localId, 'textRu')}
                />
              </FieldBlock>
            </FieldRow>
          </div>
        ))}
      </div>

      <FieldRow hint={t('addProduct.description.technicalHeadingRowHint')}>
        <FieldBlock
          label={t('addProduct.description.technicalHeadingUzLabel')}
          className="add-product-form__field--in-row"
        >
          <Input
            size="large"
            placeholder={t('addProduct.description.technicalHeadingUzPlaceholder')}
            value={values.technicalHeadingUz}
            onChange={setField('technicalHeadingUz')}
          />
        </FieldBlock>
        <FieldBlock
          label={t('addProduct.description.technicalHeadingRuLabel')}
          className="add-product-form__field--in-row"
        >
          <Input
            size="large"
            placeholder={t('addProduct.description.technicalHeadingRuPlaceholder')}
            value={values.technicalHeadingRu}
            onChange={setField('technicalHeadingRu')}
          />
        </FieldBlock>
      </FieldRow>

      <div className="add-product-description__section">
        <div className="add-product-description__section-head">
          <h4 className="add-product-description__section-title">
            {t('addProduct.description.technicalTitle')}
          </h4>
          <Button type="dashed" icon={<PlusOutlined />} onClick={addTechnicalSpec}>
            {t('addProduct.common.addMore')}
          </Button>
        </div>

        {technicalSpecs.map((spec, index) => (
          <div key={spec.localId} className="add-product-description__item-card">
            <div className="add-product-description__item-head">
              <span className="add-product-description__item-index">
                {t('addProduct.common.itemIndex', { index: index + 1 })}
              </span>
              {technicalSpecs.length > 1 ? (
                <Button type="link" danger onClick={() => removeTechnicalSpec(spec.localId)}>
                  {t('addProduct.common.remove')}
                </Button>
              ) : null}
            </div>

            <FieldRow>
              <FieldBlock
                label={t('addProduct.description.specLabelUzLabel')}
                className="add-product-form__field--in-row"
              >
                <Input
                  size="large"
                  placeholder={t('addProduct.description.specLabelUzPlaceholder')}
                  value={spec.labelUz}
                  onChange={handleTechnicalSpecChange(spec.localId, 'labelUz')}
                />
              </FieldBlock>
              <FieldBlock
                label={t('addProduct.description.specLabelRuLabel')}
                className="add-product-form__field--in-row"
              >
                <Input
                  size="large"
                  placeholder={t('addProduct.description.specLabelRuPlaceholder')}
                  value={spec.labelRu}
                  onChange={handleTechnicalSpecChange(spec.localId, 'labelRu')}
                />
              </FieldBlock>
            </FieldRow>

            <FieldRow>
              <FieldBlock
                label={t('addProduct.description.specValueUzLabel')}
                className="add-product-form__field--in-row"
              >
                <Input
                  size="large"
                  placeholder={t('addProduct.description.specValueUzPlaceholder')}
                  value={spec.valueUz}
                  onChange={handleTechnicalSpecChange(spec.localId, 'valueUz')}
                />
              </FieldBlock>
              <FieldBlock
                label={t('addProduct.description.specValueRuLabel')}
                className="add-product-form__field--in-row"
              >
                <Input
                  size="large"
                  placeholder={t('addProduct.description.specValueRuPlaceholder')}
                  value={spec.valueRu}
                  onChange={handleTechnicalSpecChange(spec.localId, 'valueRu')}
                />
              </FieldBlock>
            </FieldRow>
          </div>
        ))}
      </div>

      <AddProductDescriptionImagesField
        images={values.descriptionImages}
        onChange={(descriptionImages) => onChange({ ...values, descriptionImages })}
      />
    </section>
  );
}
