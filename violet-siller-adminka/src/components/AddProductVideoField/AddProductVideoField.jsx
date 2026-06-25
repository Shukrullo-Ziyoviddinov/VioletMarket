import React, { useRef, useState } from 'react';
import { LoadingOutlined, UploadOutlined, VideoCameraOutlined } from '@ant-design/icons';
import { toAbsoluteVideoUrl, uploadSellerProductVideo } from '../../api/sellerProductApi';
import { useSellerAuth } from '../../context/SellerAuthContext';
import UploadProgressBar from '../UploadProgressBar/UploadProgressBar';
import './AddProductVideoField.css';

export default function AddProductVideoField({ value, onChange }) {
  const { token } = useSellerAuth();
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadPhase, setUploadPhase] = useState('idle');
  const [error, setError] = useState('');

  const previewUrl = toAbsoluteVideoUrl(value);
  const progressLabel =
    uploadPhase === 'verifying' ? "Serverga saqlanmoqda..." : 'Video yuklanmoqda...';

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
    setUploadPhase('uploading');

    try {
      const uploadedPath = await uploadSellerProductVideo(
        token,
        file,
        (nextProgress) => setProgress(nextProgress),
        (phase) => setUploadPhase(phase),
      );
      onChange?.(uploadedPath);
    } catch (err) {
      setError(err.message || 'Video yuklashda xatolik');
    } finally {
      setUploading(false);
      setUploadPhase('idle');
    }
  };

  return (
    <section className="add-product-form__card add-product-video-field">
      <h3 className="add-product-form__card-title">Mahsulot videosi</h3>
      <p className="add-product-video-field__hint">
        Mahsulot sahifasida ko&apos;rsatiladigan video. Qurilmangizdan tanlab yuklang.
      </p>

      <input
        ref={fileInputRef}
        type="file"
        accept="video/*"
        className="add-product-video-field__hidden-input"
        onChange={handleFileSelected}
      />

      <button
        type="button"
        className="add-product-video-field__dropzone"
        onClick={openFilePicker}
        disabled={uploading}
      >
        <div className="add-product-video-field__icon-wrap">
          {uploading ? <LoadingOutlined /> : <UploadOutlined />}
        </div>
        <div className="add-product-video-field__text-wrap">
          <strong>Video yuklash</strong>
          <span>Telefon yoki kompyuterdan tanlash uchun bosing</span>
        </div>
        <VideoCameraOutlined className="add-product-video-field__camera-icon" aria-hidden="true" />
      </button>

      {uploading ? (
        <UploadProgressBar progress={progress} label={progressLabel} />
      ) : null}

      {previewUrl ? (
        <div className="add-product-video-field__preview">
          <video
            src={previewUrl}
            className="add-product-video-field__preview-video"
            controls
            preload="metadata"
          />
          <p className="add-product-video-field__preview-path">{value}</p>
        </div>
      ) : null}

      {error ? <p className="add-product-video-field__error">{error}</p> : null}
    </section>
  );
}
