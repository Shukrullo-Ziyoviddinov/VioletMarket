import React from 'react';
import { Input } from 'antd';

const { TextArea } = Input;

function FieldBlock({ label, hint, required = false, children }) {
  return (
    <div className="add-product-form__field">
      <label className="add-product-form__field-label">
        {label}
        {required ? <span className="add-product-form__required">*</span> : null}
      </label>
      {hint ? <p className="add-product-form__field-hint">{hint}</p> : null}
      {children}
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

      <FieldBlock
        label="Mahsulot nomi (O'zbekcha)"
        hint="Mijoz saytida ko'rinadigan mahsulot nomi. Qisqa va tushunarli yozing."
        required
      >
        <Input
          size="large"
          placeholder="Masalan: Ayollar uchun yozgi yubka"
          value={values.titleUz}
          onChange={setField('titleUz')}
        />
      </FieldBlock>

      <FieldBlock
        label="Mahsulot nomi (Ruscha)"
        hint="Rus tilidagi nom. Ikkala til ham to'ldirilsa, sayt tiliga qarab avtomatik ko'rsatiladi."
        required
      >
        <Input
          size="large"
          placeholder="Masalan: Летняя юбка для женщин"
          value={values.titleRu}
          onChange={setField('titleRu')}
        />
      </FieldBlock>

      <FieldBlock
        label="Narxi (hozirgi sotuv narxi)"
        hint="Mijoz ko'radigan asosiy narx. Masalan: 127 000UZS"
        required
      >
        <Input
          size="large"
          placeholder="127 000UZS"
          value={values.price}
          onChange={setField('price')}
        />
      </FieldBlock>

      <FieldBlock
        label="Eski narxi (chegirmadan oldingi narx)"
        hint="Agar chegirma bo'lsa, ustiga chizilgan eski narx. Masalan: 150 000"
      >
        <Input
          size="large"
          placeholder="150 000"
          value={values.originalPrice}
          onChange={setField('originalPrice')}
        />
      </FieldBlock>

      <FieldBlock
        label="Chegirma matni (O'zbekcha)"
        hint="Kartochkada ko'rinadigan chegirma yozuvi. Masalan: 30% chegirma"
      >
        <Input
          size="large"
          placeholder="30% chegirma"
          value={values.discountUz}
          onChange={setField('discountUz')}
        />
      </FieldBlock>

      <FieldBlock
        label="Chegirma matni (Ruscha)"
        hint="Rus tilidagi chegirma yozuvi. Masalan: 30% скидка"
      >
        <Input
          size="large"
          placeholder="30% скидка"
          value={values.discountRu}
          onChange={setField('discountRu')}
        />
      </FieldBlock>

      <FieldBlock
        label="Mahsulot videosi"
        hint="Video fayl yo'li. Masalan: video/video-2.mp4 (keyingi bosqichda yuklash qo'shiladi)"
      >
        <Input
          size="large"
          placeholder="video/video-2.mp4"
          value={values.video}
          onChange={setField('video')}
        />
      </FieldBlock>

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
