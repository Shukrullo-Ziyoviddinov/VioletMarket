import React, { useRef, useState } from 'react';
import { LoadingOutlined, UploadOutlined, VideoCameraOutlined } from '@ant-design/icons';
import { toAbsoluteVideoUrl, uploadSellerProductVideo } from '../../api/sellerProductApi';
import { useSellerAuth } from '../../context/SellerAuthContext';
import UploadProgressBar from '../UploadProgressBar/UploadProgressBar';
import ProductImageUploadField from '../ProductImageUploadField/ProductImageUploadField';
import ProductThumbnailsUploadField from '../ProductThumbnailsUploadField/ProductThumbnailsUploadField';
import './AddProductMediaFields.css';

const PRODUCT_THUMBNAIL_HINTS = [
  '2-rasm — yon tomondan yoki yaqin plan',
  '3-rasm — detal yoki orqa ko‘rinish',
  '4-rasm — qo‘shimcha burchak',
];

export default function AddProductMediaFields({ values, onChange }) {
  const { token } = useSellerAuth();
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadPhase, setUploadPhase] = useState('idle');
  const [videoError, setVideoError] = useState('');

  const hasColors = Array.isArray(values.colors) && values.colors.length > 0;
  const previewUrl = toAbsoluteVideoUrl(values.video);
  const progressLabel =
    uploadPhase === 'verifying' ? "Serverga saqlanmoqda..." : 'Video yuklanmoqda...';

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
      setVideoError(err.message || 'Video yuklashda xatolik');
    } finally {
      setUploading(false);
      setUploadPhase('idle');
    }
  };

  return (
    <section className="add-product-form__card add-product-media-fields">
      <h3 className="add-product-form__card-title">Video va asosiy rasm</h3>
      <p className="add-product-media-fields__intro">
        Mahsulot kartochkasidagi asosiy ko&apos;rinish. Asosiy rasm doim kerak — bu mahsulotning
        umumiy yuzasi. Ranglar bo&apos;lsa ham shu rasm saqlanadi.
      </p>

      <div className="add-product-media-fields__grid">
        <div className="add-product-media-fields__column">
          <h4 className="add-product-media-fields__column-title">Mahsulot videosi</h4>
          <p className="add-product-media-fields__column-hint">
            Ixtiyoriy. Mahsulot sahifasida ko&apos;rsatiladigan qisqa video.
          </p>

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
              <strong>Video yuklash</strong>
              <span>Telefon yoki kompyuterdan tanlash uchun bosing</span>
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

        <div className="add-product-media-fields__column">
          <h4 className="add-product-media-fields__column-title">Mahsulot asosiy rasmi</h4>
          <p className="add-product-media-fields__column-hint">
            Majburiy. Katalog va mahsulot sahifasidagi asosiy rasm — rang tanlovi bo&apos;lmasa ham
            shu ko&apos;rinadi.
          </p>
          <ProductImageUploadField
            value={values.mainImage}
            onChange={(path) => setField('mainImage', path)}
            title="Asosiy rasm yuklash"
            hint="Mahsulotning eng yaxshi bitta fotosurati"
            compact
          />
        </div>
      </div>

      {!hasColors ? (
        <div className="add-product-media-fields__thumbnails">
          <ProductThumbnailsUploadField
            images={values.thumbnails}
            onChange={(nextImages) => setField('thumbnails', nextImages)}
            title="Mahsulot galereya rasmlari (thumbnails)"
            hint="Rang tanlovi yo‘q mahsulotlarda galereya shu yerdan olinadi. Birinchi rasm asosiy rasmdan keyin ko‘rinadi."
            slotHints={['1-qo‘shimcha rasm', ...PRODUCT_THUMBNAIL_HINTS]}
          />
        </div>
      ) : (
        <p className="add-product-media-fields__colors-note">
          Ranglar qo&apos;shilgan — galereya rasmlari har bir rang bloki ichida alohida yuklanadi.
          Yuqoridagi asosiy rasm mahsulotning umumiy kartochka rasmi bo&apos;lib qoladi.
        </p>
      )}
    </section>
  );
}
