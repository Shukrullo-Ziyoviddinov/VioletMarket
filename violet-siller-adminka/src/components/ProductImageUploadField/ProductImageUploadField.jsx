import React, { useRef, useState } from 'react';
import { LoadingOutlined, PictureOutlined, UploadOutlined } from '@ant-design/icons';
import { uploadSellerProductImage } from '../../api/sellerProductApi';
import { useSellerAuth } from '../../context/SellerAuthContext';
import { resolveAssetUrl } from '../../utils/mediaUrl';
import UploadProgressBar from '../UploadProgressBar/UploadProgressBar';
import './ProductImageUploadField.css';

export default function ProductImageUploadField({
  value,
  onChange,
  title = 'Rasm yuklash',
  hint = 'Telefon yoki kompyuterdan tanlash uchun bosing',
  compact = false,
}) {
  const { token } = useSellerAuth();
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');

  const openFilePicker = () => {
    if (uploading) return;
    fileInputRef.current?.click();
  };

  const handleFileSelected = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || !token) return;

    setError('');
    setUploading(true);
    setProgress(0);

    try {
      const uploadedPath = await uploadSellerProductImage(token, file, (nextProgress) => {
        setProgress(nextProgress);
      });
      onChange?.(uploadedPath);
    } catch (err) {
      setError(err.message || 'Rasm yuklashda xatolik');
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  return (
    <div className={`product-image-upload${compact ? ' product-image-upload--compact' : ''}`}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="product-image-upload__hidden-input"
        onChange={handleFileSelected}
      />

      <button
        type="button"
        className="product-image-upload__dropzone"
        onClick={openFilePicker}
        disabled={uploading}
      >
        <div className="product-image-upload__icon-wrap">
          {uploading ? <LoadingOutlined /> : <UploadOutlined />}
        </div>
        <div className="product-image-upload__text-wrap">
          <strong>{title}</strong>
          <span>{hint}</span>
        </div>
        <PictureOutlined className="product-image-upload__picture-icon" aria-hidden="true" />
      </button>

      {uploading ? <UploadProgressBar progress={progress} label="Rasm yuklanmoqda..." /> : null}
      {error ? <p className="product-image-upload__error">{error}</p> : null}

      {value ? (
        <div className="product-image-upload__preview">
          <img src={resolveAssetUrl(value)} alt="" className="product-image-upload__preview-image" />
          <p className="product-image-upload__path">{value}</p>
        </div>
      ) : null}
    </div>
  );
}
