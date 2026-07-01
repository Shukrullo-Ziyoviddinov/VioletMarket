import React, { useMemo, useRef, useState } from 'react';
import { LoadingOutlined, UploadOutlined, VideoCameraOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { toAbsoluteVideoUrl, uploadSellerProductVideo } from '../../api/sellerProductApi';
import { useSellerAuth } from '../../context/SellerAuthContext';
import UploadProgressBar from '../UploadProgressBar/UploadProgressBar';
import ProductImageUploadField from '../ProductImageUploadField/ProductImageUploadField';
import ProductThumbnailsUploadField from '../ProductThumbnailsUploadField/ProductThumbnailsUploadField';
import './AddProductMediaFields.css';

export default function AddProductMediaFields({ values, onChange }) {
  const { t } = useTranslation();
  const { token } = useSellerAuth();
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadPhase, setUploadPhase] = useState('idle');
  const [videoError, setVideoError] = useState('');

  const thumbnailSlotHints = useMemo(
    () => t('addProduct.media.thumbnailSlotHints', { returnObjects: true }),
    [t],
  );

  const hasColors = Array.isArray(values.colors) && values.colors.length > 0;
  const savedThumbnailsCount = (
    hasColors
      ? values.productThumbnailsBackup
      : values.thumbnails
  )?.length || 0;
  const previewUrl = toAbsoluteVideoUrl(values.video);
  const progressLabel =
    uploadPhase === 'verifying'
      ? t('addProduct.media.videoVerifying')
      : t('addProduct.media.videoUploading');

  const setField = (key, fieldValue) => {
    onChange({ ...values, [key]: fieldValue });
  };

  const openFilePicker = () => {
    if (uploading) return;
    fileInputRef.current?.click();
  };

  const handleFileSelected = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || !token) return;

    setVideoError('');
    setUploading(true);
    setProgress(0);
    setUploadPhase('uploading');

    try {
      const uploadedPath = await uploadSellerProductVideo(
        token,
        file,
        (nextProgress) => setProgress(nextProgress),
        (phase) => setUploadPhase(phase),
      );
      setField('video', uploadedPath);
    } catch (err) {
      setVideoError(err.message || t('addProduct.media.videoUploadError'));
    } finally {
      setUploading(false);
      setUploadPhase('idle');
    }
  };

  return (
    <section className="add-product-form__card add-product-media-fields">
      <h3 className="add-product-form__card-title">{t('addProduct.media.title')}</h3>
      <p className="add-product-media-fields__intro">{t('addProduct.media.intro')}</p>

      <div className="add-product-media-fields__grid">
        <div className="add-product-media-fields__column">
          <div className="add-product-media-fields__column-header">
            <h4 className="add-product-media-fields__column-title">{t('addProduct.media.videoTitle')}</h4>
            <p className="add-product-media-fields__column-hint">{t('addProduct.media.videoHint')}</p>
          </div>

          <div className="add-product-media-fields__upload-slot">
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*"
            className="add-product-media-fields__hidden-input"
            onChange={handleFileSelected}
          />

          <button
            type="button"
            className="add-product-media-fields__dropzone"
            onClick={openFilePicker}
            disabled={uploading}
          >
            <div className="add-product-media-fields__icon-wrap">
              {uploading ? <LoadingOutlined /> : <UploadOutlined />}
            </div>
            <div className="add-product-media-fields__text-wrap">
              <strong>{t('addProduct.media.videoUploadTitle')}</strong>
              <span>{t('addProduct.media.videoUploadHint')}</span>
            </div>
            <VideoCameraOutlined className="add-product-media-fields__camera-icon" aria-hidden="true" />
          </button>

          {uploading ? <UploadProgressBar progress={progress} label={progressLabel} /> : null}

          {previewUrl ? (
            <div className="add-product-media-fields__preview">
              <video
                src={previewUrl}
                className="add-product-media-fields__preview-video"
                controls
                preload="metadata"
              />
              <p className="add-product-media-fields__preview-path">{values.video}</p>
            </div>
          ) : null}

          {videoError ? <p className="add-product-media-fields__error">{videoError}</p> : null}
          </div>
        </div>

        <div className="add-product-media-fields__column">
          <div className="add-product-media-fields__column-header">
            <h4 className="add-product-media-fields__column-title">{t('addProduct.media.mainImageTitle')}</h4>
            <p className="add-product-media-fields__column-hint">{t('addProduct.media.mainImageHint')}</p>
          </div>

          <div className="add-product-media-fields__upload-slot">
          <ProductImageUploadField
            value={values.mainImage}
            onChange={(path) => setField('mainImage', path)}
            title={t('addProduct.media.mainImageUploadTitle')}
            hint={t('addProduct.media.mainImageUploadHint')}
            className="add-product-media-fields__image-upload"
          />
          </div>
        </div>
      </div>

      <div
        className={`add-product-media-fields__thumbnails${
          hasColors ? ' add-product-media-fields__thumbnails--hidden' : ''
        }`}
        aria-hidden={hasColors}
      >
        <ProductThumbnailsUploadField
          images={values.thumbnails}
          onChange={(nextImages) => setField('thumbnails', nextImages)}
          title={t('addProduct.media.thumbnailsTitle')}
          hint={t('addProduct.media.thumbnailsHint')}
          slotHints={thumbnailSlotHints}
        />
      </div>

      {hasColors ? (
        <p className="add-product-media-fields__colors-note">
          {t('addProduct.media.colorsNote')}
          {savedThumbnailsCount > 0
            ? t('addProduct.media.colorsNoteSaved', { count: savedThumbnailsCount })
            : null}
        </p>
      ) : null}
    </section>
  );
}
