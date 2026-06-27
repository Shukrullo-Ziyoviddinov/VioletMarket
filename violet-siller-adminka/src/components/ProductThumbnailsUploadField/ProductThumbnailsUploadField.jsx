import React, { useRef, useState } from 'react';
import { DeleteOutlined, LoadingOutlined, PictureOutlined, UploadOutlined } from '@ant-design/icons';
import { Button } from 'antd';
import { uploadSellerProductImage } from '../../api/sellerProductApi';
import { useSellerAuth } from '../../context/SellerAuthContext';
import { resolveAssetUrl } from '../../utils/mediaUrl';
import UploadProgressBar from '../UploadProgressBar/UploadProgressBar';
import './ProductThumbnailsUploadField.css';

export default function ProductThumbnailsUploadField({
  images,
  onChange,
  title = 'Qo‘shimcha rasmlar',
  hint = 'Mahsulot galereyasidagi qo‘shimcha rasmlar. Bir nechta yuklashingiz mumkin.',
  slotHints = [],
}) {
  const { token } = useSellerAuth();
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');

  const imageList = Array.isArray(images) ? images : [];

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
      onChange?.([...imageList, uploadedPath]);
    } catch (err) {
      setError(err.message || 'Rasm yuklashda xatolik');
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const handleRemove = (index) => {
    onChange?.(imageList.filter((_, itemIndex) => itemIndex !== index));
  };

  return (
    <div className="product-thumbnails-upload">
      <div className="product-thumbnails-upload__head">
        <h4 className="product-thumbnails-upload__title">{title}</h4>
        <p className="product-thumbnails-upload__hint">{hint}</p>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="product-thumbnails-upload__hidden-input"
        onChange={handleFileSelected}
      />

      <button
        type="button"
        className="product-thumbnails-upload__dropzone"
        onClick={openFilePicker}
        disabled={uploading}
      >
        <div className="product-thumbnails-upload__icon-wrap">
          {uploading ? <LoadingOutlined /> : <UploadOutlined />}
        </div>
        <div className="product-thumbnails-upload__text-wrap">
          <strong>Rasm qo&apos;shish</strong>
          <span>Galereyaga yana bitta rasm yuklash</span>
        </div>
        <PictureOutlined className="product-thumbnails-upload__picture-icon" aria-hidden="true" />
      </button>

      {uploading ? <UploadProgressBar progress={progress} label="Rasm yuklanmoqda..." /> : null}
      {error ? <p className="product-thumbnails-upload__error">{error}</p> : null}

      {imageList.length > 0 ? (
        <div className="product-thumbnails-upload__grid">
          {imageList.map((imagePath, index) => (
            <div key={`${imagePath}-${index}`} className="product-thumbnails-upload__item">
              <span className="product-thumbnails-upload__slot-label">
                {slotHints[index] || `${index + 1}-rasm`}
              </span>
              <img
                src={resolveAssetUrl(imagePath)}
                alt=""
                className="product-thumbnails-upload__preview"
              />
              <Button
                type="text"
                danger
                size="small"
                icon={<DeleteOutlined />}
                className="product-thumbnails-upload__remove"
                onClick={() => handleRemove(index)}
              >
                O&apos;chirish
              </Button>
              <p className="product-thumbnails-upload__path">{imagePath}</p>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
