import React, { useRef, useState } from 'react';
import { DeleteOutlined, LoadingOutlined, PictureOutlined, UploadOutlined } from '@ant-design/icons';
import { Button } from 'antd';
import { useTranslation } from 'react-i18next';
import { uploadSellerProductImage } from '../../api/sellerProductApi';
import { useSellerAuth } from '../../context/SellerAuthContext';
import { resolveAssetUrl } from '../../utils/mediaUrl';
import UploadProgressBar from '../UploadProgressBar/UploadProgressBar';
import './AddProductDescriptionImagesField.css';

export default function AddProductDescriptionImagesField({ images, onChange }) {
  const { t } = useTranslation();
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
      setError(err.message || t('addProduct.descriptionImages.uploadError'));
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const handleRemove = (pathToRemove) => {
    onChange?.(imageList.filter((path) => path !== pathToRemove));
  };

  return (
    <div className="add-product-description-images">
      <div className="add-product-description-images__head">
        <h4 className="add-product-description-images__title">{t('addProduct.descriptionImages.title')}</h4>
        <p className="add-product-description-images__hint">{t('addProduct.descriptionImages.hint')}</p>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="add-product-description-images__hidden-input"
        onChange={handleFileSelected}
      />

      <button
        type="button"
        className="add-product-description-images__dropzone"
        onClick={openFilePicker}
        disabled={uploading}
      >
        <div className="add-product-description-images__icon-wrap">
          {uploading ? <LoadingOutlined /> : <UploadOutlined />}
        </div>
        <div className="add-product-description-images__text-wrap">
          <strong>{t('addProduct.descriptionImages.uploadTitle')}</strong>
          <span>{t('addProduct.descriptionImages.uploadHint')}</span>
        </div>
        <PictureOutlined className="add-product-description-images__picture-icon" aria-hidden="true" />
      </button>

      {uploading ? (
        <UploadProgressBar progress={progress} label={t('addProduct.descriptionImages.uploading')} />
      ) : null}

      {error ? <p className="add-product-description-images__error">{error}</p> : null}

      {imageList.length > 0 ? (
        <div className="add-product-description-images__grid">
          {imageList.map((imagePath) => (
            <div key={imagePath} className="add-product-description-images__item">
              <img
                src={resolveAssetUrl(imagePath)}
                alt={t('addProduct.descriptionImages.imageAlt')}
                className="add-product-description-images__preview"
              />
              <Button
                type="text"
                danger
                size="small"
                icon={<DeleteOutlined />}
                className="add-product-description-images__remove"
                onClick={() => handleRemove(imagePath)}
              >
                {t('addProduct.common.remove')}
              </Button>
              <p className="add-product-description-images__path">{imagePath}</p>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
