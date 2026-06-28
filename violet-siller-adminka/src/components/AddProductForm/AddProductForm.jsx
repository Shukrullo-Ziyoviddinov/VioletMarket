import React, { useEffect, useState } from 'react';
import { Alert, message, Spin } from 'antd';
import { useNavigate } from 'react-router-dom';
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
  const { token } = useSellerAuth();
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

        setSectionOptions(Array.isArray(data?.sectionOptions) ? data.sectionOptions : []);
        setShippingCountries(Array.isArray(data?.shippingCountries) ? data.shippingCountries : []);
        setProductTypes(Array.isArray(data?.productTypes) ? data.productTypes : []);
        setFilterValues(Array.isArray(data?.filterValues) ? data.filterValues : []);
        setMasterCategories(Array.isArray(data?.masterCategories) ? data.masterCategories : []);
        setProductPickerOptions(pickerOptions);

        if (isEditMode) {
          if (!product) {
            throw new Error('Mahsulot topilmadi');
          }
          const mapped = mapSellerProductToFormValues(product);
          if (!mapped) {
            throw new Error('Mahsulot ma\'lumotlarini yuklab bo\'lmadi');
          }
          setValues({ ...INITIAL_VALUES, ...mapped });
          setSavedProductId(product.id);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || 'Forma ma\'lumotlarini yuklab bo\'lmadi');
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
  }, [token, editProductId, isEditMode]);

  const handleSave = async () => {
    if (!token || saving) return;

    const validationErrors = validateSellerProductForm(values);
    if (validationErrors.length > 0) {
      setSaveError(validationErrors[0]);
      message.error(validationErrors[0]);
      return;
    }

    setSaving(true);
    setSaveError('');

    try {
      const payload = buildSellerProductPayload(values);
      const product = isEditMode
        ? await updateSellerProduct(token, editProductId, payload)
        : await createSellerProduct(token, payload);

      const productId = product?.id;
      if (!productId) {
        throw new Error('Server mahsulot ID qaytarmadi');
      }

      setSavedProductId(productId);
      message.success(
        isEditMode
          ? `Mahsulot #${productId} yangilandi`
          : `Mahsulot #${productId} muvaffaqiyatli qo'shildi`,
      );

      if (!isEditMode) {
        navigate(`/products/${productId}/edit`, { replace: true });
      }
    } catch (err) {
      const errorMessage = err.message || 'Mahsulotni saqlab bo\'lmadi';
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
            message={`Mahsulot #${savedProductId} mijozlar saytida ko'rinadi (clientActive: true).`}
          />
        ) : null}

        <AddProductSectionField
          value={values.categoryName}
          options={sectionOptions}
          onChange={(categoryName) => setValues((current) => ({ ...current, categoryName }))}
        />

        <AddProductMainInfoFields values={values} onChange={setValues} />

        <AddProductMediaFields values={values} onChange={setValues} />

        <AddProductStockFields values={values} onChange={setValues} />

        <AddProductClassificationFields
          values={values}
          masterCategories={masterCategories}
          productTypes={productTypes}
          filterValues={filterValues}
          shippingCountries={shippingCountries}
          onChange={setValues}
        />

        <AddProductDetailsFields values={values} onChange={setValues} />

        <AddProductDescriptionFields values={values} onChange={setValues} />

        <AddProductColorsFields values={values} onChange={setValues} />

        <AddProductSizeChartFields values={values} onChange={setValues} />

        <AddProductRelatedGroupsFields
          values={values}
          onChange={setValues}
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
