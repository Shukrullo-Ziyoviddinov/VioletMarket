import React, { useEffect, useState } from 'react';
import { Alert, Spin, Typography } from 'antd';
import { fetchSellerProductFormOptions } from '../../api/sellerProductApi';
import { useSellerAuth } from '../../context/SellerAuthContext';
import AddProductCountriesField from '../AddProductCountriesField/AddProductCountriesField';
import AddProductMainInfoFields from '../AddProductMainInfoFields/AddProductMainInfoFields';
import AddProductSectionField from '../AddProductSectionField/AddProductSectionField';
import AddProductVideoField from '../AddProductVideoField/AddProductVideoField';
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
  category: '',
  countryCode: '',
};

export default function AddProductForm() {
  const { token } = useSellerAuth();
  const [values, setValues] = useState(INITIAL_VALUES);
  const [sectionOptions, setSectionOptions] = useState([]);
  const [shippingCountries, setShippingCountries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function loadOptions() {
      if (!token) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError('');

      try {
        const data = await fetchSellerProductFormOptions(token);
        if (cancelled) return;

        setSectionOptions(Array.isArray(data?.sectionOptions) ? data.sectionOptions : []);
        setShippingCountries(Array.isArray(data?.shippingCountries) ? data.shippingCountries : []);
      } catch (err) {
        if (!cancelled) {
          setError(err.message || 'Forma ma\'lumotlarini yuklab bo\'lmadi');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
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

      <AddProductVideoField
        value={values.video}
        onChange={(video) => setValues((current) => ({ ...current, video }))}
      />

      <AddProductCountriesField
        value={values.countryCode}
        shippingCountries={shippingCountries}
        onChange={(countryCode) => setValues((current) => ({ ...current, countryCode }))}
      />

      <div className="add-product-form__footer-note">
        <Text type="secondary">
          1-bosqich: faqat asosiy maydonlar. Saqlash va qolgan maydonlar keyingi bosqichda qo&apos;shiladi.
        </Text>
      </div>
    </div>
  );
}
