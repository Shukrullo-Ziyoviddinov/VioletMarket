import React, { useEffect, useState } from 'react';
import { Alert, Spin, Typography } from 'antd';
import {
  fetchSellerProductFormOptions,
  fetchSellerRelatedProductPickerOptions,
} from '../../api/sellerProductApi';
import { useSellerAuth } from '../../context/SellerAuthContext';
import AddProductDescriptionFields from '../AddProductDescriptionFields/AddProductDescriptionFields';
import AddProductClassificationFields from '../AddProductClassificationFields/AddProductClassificationFields';
import AddProductDetailsFields from '../AddProductDetailsFields/AddProductDetailsFields';
import AddProductMainInfoFields from '../AddProductMainInfoFields/AddProductMainInfoFields';
import AddProductSectionField from '../AddProductSectionField/AddProductSectionField';
import AddProductMediaFields from '../AddProductMediaFields/AddProductMediaFields';
import AddProductSizeChartFields from '../AddProductSizeChartFields/AddProductSizeChartFields';
import AddProductRelatedGroupsFields from '../AddProductRelatedGroupsFields/AddProductRelatedGroupsFields';
import AddProductColorsFields from '../AddProductColorsFields/AddProductColorsFields';
import { getInitialSizeChartFormFields } from '../../utils/sizeChartDraft';
import { getInitialDescriptionFormFields } from '../../utils/productDescriptionDraft';
import { getInitialRelatedGroupsFormFields } from '../../utils/relatedGroupsDraft';
import { getInitialColorsFormFields } from '../../utils/productColorsDraft';
import './AddProductForm.css';

const { Text } = Typography;

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

export default function AddProductForm() {
  const { token } = useSellerAuth();
  const [values, setValues] = useState(INITIAL_VALUES);
  const [sectionOptions, setSectionOptions] = useState([]);
  const [shippingCountries, setShippingCountries] = useState([]);
  const [productTypes, setProductTypes] = useState([]);
  const [filterValues, setFilterValues] = useState([]);
  const [masterCategories, setMasterCategories] = useState([]);
  const [productPickerOptions, setProductPickerOptions] = useState([]);
  const [productPickerLoading, setProductPickerLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function loadOptions() {
      if (!token) {
        setLoading(false);
        setProductPickerLoading(false);
        return;
      }

      setLoading(true);
      setProductPickerLoading(true);
      setError('');

      try {
        const [data, pickerOptions] = await Promise.all([
          fetchSellerProductFormOptions(token),
          fetchSellerRelatedProductPickerOptions(token),
        ]);
        if (cancelled) return;

        setSectionOptions(Array.isArray(data?.sectionOptions) ? data.sectionOptions : []);
        setShippingCountries(Array.isArray(data?.shippingCountries) ? data.shippingCountries : []);
        setProductTypes(Array.isArray(data?.productTypes) ? data.productTypes : []);
        setFilterValues(Array.isArray(data?.filterValues) ? data.filterValues : []);
        setMasterCategories(Array.isArray(data?.masterCategories) ? data.masterCategories : []);
        setProductPickerOptions(pickerOptions);
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

    loadOptions();

    return () => {
      cancelled = true;
    };
  }, [token]);

  if (loading) {
    return (
      <div className="add-product-form add-product-form--loading">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="add-product-form">
      {error ? <Alert type="error" message={error} showIcon className="add-product-form__alert" /> : null}

      <AddProductSectionField
        value={values.categoryName}
        options={sectionOptions}
        onChange={(categoryName) => setValues((current) => ({ ...current, categoryName }))}
      />

      <AddProductMainInfoFields values={values} onChange={setValues} />

      <AddProductMediaFields values={values} onChange={setValues} />

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

      <div className="add-product-form__footer-note">
        <Text type="secondary">
          7-bosqich: ranglar (colors), asosiy rasm va galereya qo&apos;shildi. Saqlash keyingi
          bosqichda qo&apos;shiladi.
        </Text>
      </div>
    </div>
  );
}
