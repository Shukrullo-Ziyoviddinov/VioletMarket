import React from 'react';
import { Input } from 'antd';

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

export default function AddProductMainInfoFields({ values, onChange }) {
  const setField = (key) => (event) => {
    onChange({ ...values, [key]: event.target.value });
  };

  return (
    <section className="add-product-form__card">
      <h3 className="add-product-form__card-title">Asosiy ma&apos;lumotlar</h3>

      <FieldRow hint="Mahsulot nomini ikkala tilda yozing — mijoz sayt tiliga qarab avtomatik ko'rsatiladi.">
        <FieldBlock label="Mahsulot nomi (O'zbekcha)" required className="add-product-form__field--in-row">
          <Input
            size="large"
            placeholder="Masalan: Ayollar uchun yozgi yubka"
            value={values.titleUz}
            onChange={setField('titleUz')}
          />
        </FieldBlock>

        <FieldBlock label="Mahsulot nomi (Ruscha)" required className="add-product-form__field--in-row">
          <Input
            size="large"
            placeholder="Masalan: Летняя юбка для женщин"
            value={values.titleRu}
            onChange={setField('titleRu')}
          />
        </FieldBlock>
      </FieldRow>

      <FieldRow hint="Hozirgi sotuv narxi majburiy. Eski narx faqat chegirma bo'lsa kerak bo'ladi.">
        <FieldBlock label="Narxi (hozirgi sotuv narxi)" required className="add-product-form__field--in-row">
          <Input
            size="large"
            placeholder="127 000UZS"
            value={values.price}
            onChange={setField('price')}
          />
        </FieldBlock>

        <FieldBlock
          label="Eski narxi (chegirmadan oldingi narx)"
          className="add-product-form__field--in-row"
        >
          <Input
            size="large"
            placeholder="150 000"
            value={values.originalPrice}
            onChange={setField('originalPrice')}
          />
        </FieldBlock>
      </FieldRow>

      <FieldRow hint="Chegirma bo'lsa, kartochkada ko'rinadigan yozuvni kiriting.">
        <FieldBlock label="Chegirma matni (O'zbekcha)" className="add-product-form__field--in-row">
          <Input
            size="large"
            placeholder="30% chegirma"
            value={values.discountUz}
            onChange={setField('discountUz')}
          />
        </FieldBlock>

        <FieldBlock label="Chegirma matni (Ruscha)" className="add-product-form__field--in-row">
          <Input
            size="large"
            placeholder="30% скидка"
            value={values.discountRu}
            onChange={setField('discountRu')}
          />
        </FieldBlock>
      </FieldRow>

      <FieldBlock
        label="Mahsulot kategoriyasi"
        hint="Mahsulot turkumi yoki kategoriya nomi. Masalan: Ayollar kiyimi, Elektronika"
        required
      >
        <TextArea
          rows={2}
          placeholder="Ayollar kiyimi"
          value={values.category}
          onChange={setField('category')}
        />
      </FieldBlock>
    </section>
  );
}
