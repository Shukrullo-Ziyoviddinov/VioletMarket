import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, message, Spin } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  fetchSellerProductFormOptions,
  fetchSellerRelatedProductPickerOptions,
  fetchSellerProductById,
  createSellerProduct,
  updateSellerProduct,
} from '../../api/sellerProductApi';
import { useSellerAuth } from '../../context/SellerAuthContext';
import AddProductDescriptionFields from '../AddProductDescriptionFields/AddProductDescriptionFields';
import AddProductClassificationFields from '../AddProductClassificationFields/AddProductClassificationFields';
import AddProductDetailsFields from '../AddProductDetailsFields/AddProductDetailsFields';
import AddProductMainInfoFields from '../AddProductMainInfoFields/AddProductMainInfoFields';
import AddProductSectionField from '../AddProductSectionField/AddProductSectionField';
import AddProductMediaFields from '../AddProductMediaFields/AddProductMediaFields';
import AddProductStockFields from '../AddProductStockFields/AddProductStockFields';
import AddProductSizeChartFields from '../AddProductSizeChartFields/AddProductSizeChartFields';
import AddProductRelatedGroupsFields from '../AddProductRelatedGroupsFields/AddProductRelatedGroupsFields';
import AddProductColorsFields from '../AddProductColorsFields/AddProductColorsFields';
import AddProductSaveBar from '../AddProductSaveBar/AddProductSaveBar';
import { getInitialSizeChartFormFields } from '../../utils/sizeChartDraft';
import { getInitialDescriptionFormFields } from '../../utils/productDescriptionDraft';
import { getInitialRelatedGroupsFormFields } from '../../utils/relatedGroupsDraft';
import { getInitialColorsFormFields } from '../../utils/productColorsDraft';
import { buildSellerProductPayload } from '../../utils/buildSellerProductPayload';
import { validateSellerProductForm } from '../../utils/validateSellerProductForm';
import { mapSellerProductToFormValues } from '../../utils/sellerProductFormMapper';
import { resolveSellerWarehouseCountryCode } from '../../utils/sellerWarehouseCountry';
import './AddProductForm.css';

const INITIAL_VALUES = {
  categoryName: '',
  titleUz: '',
  titleRu: '',
  price: '',
  originalPrice: '',
  discountUz: '',
  discountRu: '',
  video: '',
  masterCategoryId: '',
  category: '',
  countryCode: '',
  productType: '',
  productCountry: '',
  brandCategories: '',
  countriesCategories: '',
  weight: '',
  labelTypes: [],
  chegirmaPercent: '',
  ...getInitialDescriptionFormFields(),
  ...getInitialSizeChartFormFields(),
  ...getInitialRelatedGroupsFormFields(),
  ...getInitialColorsFormFields(),
};

export default function AddProductForm({ editProductId = null }) {
  const { t } = useTranslation();
  const { token, seller } = useSellerAuth();
  const navigate = useNavigate();
  const isEditMode = editProductId != null && String(editProductId).trim() !== '';
  const [values, setValues] = useState(INITIAL_VALUES);
  const [sectionOptions, setSectionOptions] = useState([]);
  const [shippingCountries, setShippingCountries] = useState([]);
  const [productTypes, setProductTypes] = useState([]);
  const [filterValues, setFilterValues] = useState([]);
  const [masterCategories, setMasterCategories] = useState([]);
  const [productPickerOptions, setProductPickerOptions] = useState([]);
  const [productPickerLoading, setProductPickerLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saveError, setSaveError] = useState('');
  const [savedProductId, setSavedProductId] = useState(null);
  const valuesRef = useRef(values);
  valuesRef.current = values;

  const updateValues = useCallback((next) => {
    setValues((current) => {
      if (typeof next === 'function') {
        return next(current);
      }
      return { ...current, ...next };
    });
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadFormData() {
      if (!token) {
        setLoading(false);
        setProductPickerLoading(false);
        return;
      }

      setLoading(true);
      setProductPickerLoading(true);
      setError('');

      try {
        const requests = [
          fetchSellerProductFormOptions(token),
          fetchSellerRelatedProductPickerOptions(token),
        ];

        if (isEditMode) {
          requests.push(fetchSellerProductById(token, editProductId));
        }

        const results = await Promise.all(requests);
        if (cancelled) return;

        const data = results[0];
        const pickerOptions = results[1];
        const product = isEditMode ? results[2] : null;
        const nextMasterCategories = Array.isArray(data?.masterCategories)
          ? data.masterCategories
          : [];

        setSectionOptions(Array.isArray(data?.sectionOptions) ? data.sectionOptions : []);
        setShippingCountries(Array.isArray(data?.shippingCountries) ? data.shippingCountries : []);
        setProductTypes(Array.isArray(data?.productTypes) ? data.productTypes : []);
        setFilterValues(Array.isArray(data?.filterValues) ? data.filterValues : []);
        setMasterCategories(nextMasterCategories);
        setProductPickerOptions(pickerOptions);

        if (isEditMode) {
          if (!product) {
            throw new Error(t('addProduct.form.productNotFound'));
          }
          const mapped = mapSellerProductToFormValues(product, nextMasterCategories);
          if (!mapped) {
            throw new Error(t('addProduct.form.productLoadFailed'));
          }
          setValues({ ...INITIAL_VALUES, ...mapped });
          setSavedProductId(product.id);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || t('addProduct.form.loadError'));
          setProductPickerOptions([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
          setProductPickerLoading(false);
        }
      }
    }

    loadFormData();

    return () => {
      cancelled = true;
    };
    // `t` intentionally omitted: language changes must not wipe in-progress edits.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, editProductId, isEditMode]);

  useEffect(() => {
    const warehouseCode = resolveSellerWarehouseCountryCode(
      seller?.sellerCountry,
      shippingCountries,
    );
    if (!warehouseCode) return;
    setValues((current) =>
      current.countryCode === warehouseCode
        ? current
        : { ...current, countryCode: warehouseCode },
    );
  }, [seller?.sellerCountry, shippingCountries]);

  const handleSave = async () => {
    if (!token || saving) return;

    const currentValues = valuesRef.current;
    const validationErrors = validateSellerProductForm(currentValues, t, { isEditMode });
    if (validationErrors.length > 0) {
      setSaveError(validationErrors[0]);
      message.error(validationErrors[0]);
      return;
    }

    setSaving(true);
    setSaveError('');

    try {
      const payload = buildSellerProductPayload(currentValues);
      const product = isEditMode
        ? await updateSellerProduct(token, editProductId, payload)
        : await createSellerProduct(token, payload);

      const productId = product?.id;
      if (!productId) {
        throw new Error(t('addProduct.form.serverNoId'));
      }

      setSavedProductId(productId);
      message.success(
        isEditMode
          ? t('addProduct.form.successUpdated', { id: productId })
          : t('addProduct.form.successCreated', { id: productId }),
      );

      if (!isEditMode) {
        navigate(`/products/${productId}/edit`, { replace: true });
      }
    } catch (err) {
      const errorMessage = err.message || t('addProduct.form.saveFailed');
      setSaveError(errorMessage);
      message.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="add-product-form add-product-form--loading">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <>
      <div className="add-product-form">
        {error ? (
          <Alert type="error" message={error} showIcon className="add-product-form__alert" />
        ) : null}

        {saveError ? (
          <Alert type="error" message={saveError} showIcon className="add-product-form__alert" />
        ) : null}

        {savedProductId ? (
          <Alert
            type="success"
            showIcon
            className="add-product-form__alert"
            message={t('addProduct.form.visibleOnSite', { id: savedProductId })}
          />
        ) : null}

        <AddProductSectionField
          value={values.categoryName}
          options={sectionOptions}
          onChange={(categoryName) => updateValues((current) => ({ ...current, categoryName }))}
        />

        <AddProductMainInfoFields values={values} onChange={updateValues} />

        <AddProductMediaFields values={values} onChange={updateValues} />

        <AddProductStockFields values={values} onChange={updateValues} />

        <AddProductClassificationFields
          values={values}
          masterCategories={masterCategories}
          productTypes={productTypes}
          filterValues={filterValues}
          shippingCountries={shippingCountries}
          warehouseLocked
          onChange={updateValues}
        />

        <AddProductDetailsFields values={values} onChange={updateValues} />

        <AddProductDescriptionFields values={values} onChange={updateValues} />

        <AddProductColorsFields values={values} onChange={updateValues} />

        <AddProductSizeChartFields values={values} onChange={updateValues} />

        <AddProductRelatedGroupsFields
          values={values}
          onChange={updateValues}
          productPickerOptions={productPickerOptions}
          productPickerLoading={productPickerLoading}
        />
      </div>

      <AddProductSaveBar
        saving={saving}
        isEditMode={isEditMode}
        onSave={handleSave}
        disabled={Boolean(error)}
      />
    </>
  );
}
