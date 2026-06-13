import React, { useRef, useState } from 'react';
import { LoadingOutlined, PictureOutlined, UploadOutlined } from '@ant-design/icons';
import { toAbsoluteImageUrl, uploadNavbarImage } from '../../api/navbarAdminApi';
import './ImageUploadField.css';

export default function ImageUploadField({
  label = 'image',
  value = '',
  onChange,
  onUploadStateChange,
}) {
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [uploadPhase, setUploadPhase] = useState('idle');

  const previewUrl = toAbsoluteImageUrl(value);

  const openFilePicker = () => {
    if (uploading) return;
    if (fileInputRef.current) fileInputRef.current.click();
  };

  const handleFileSelected = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setError('');
    setUploading(true);
    setProgress(0);
    setUploadPhase('uploading');
    if (typeof onUploadStateChange === 'function') {
      onUploadStateChange(true);
    }

    try {
      const uploadedPath = await uploadNavbarImage(
        file,
        (nextProgress) => setProgress(nextProgress),
        (phase) => setUploadPhase(phase),
      );
      if (!uploadedPath) {
        throw new Error("Server image manzilini qaytarmadi");
      }
      if (typeof onChange === 'function') {
        onChange(uploadedPath);
      }
    } catch (err) {
      setError(err.message || 'Upload xatolik');
    } finally {
      setUploading(false);
      setUploadPhase('idle');
      if (typeof onUploadStateChange === 'function') {
        onUploadStateChange(false);
      }
    }
  };

  const progressLabel =
    uploadPhase === 'verifying' ? "Serverga saqlanmoqda..." : 'Yuklanmoqda...';

  return (
    <div className="image-upload-field">
      <span className="image-upload-field__label">{label}</span>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="image-upload-field__hidden-input"
        onChange={handleFileSelected}
      />

      <button type="button" className="image-upload-field__dropzone" onClick={openFilePicker}>
        <div className="image-upload-field__icon-wrap">
          {uploading ? <LoadingOutlined /> : <UploadOutlined />}
        </div>
        <div className="image-upload-field__text-wrap">
          <strong>Rasm tanlash</strong>
          <span>Qurilmadan yuklash uchun bosing</span>
        </div>
      </button>

      {uploading ? (
        <div className="image-upload-field__progress">
          <div className="image-upload-field__progress-head">
            <span>{progressLabel}</span>
            <span>{progress}%</span>
          </div>
          <div className="image-upload-field__progress-track">
            <div className="image-upload-field__progress-bar" style={{ width: `${progress}%` }} />
          </div>
        </div>
      ) : null}

      {previewUrl ? (
        <div className="image-upload-field__preview">
          <div className="image-upload-field__preview-image-wrap">
            <img src={previewUrl} alt="Uploaded preview" className="image-upload-field__preview-image" />
          </div>
          <div className="image-upload-field__preview-meta">
            <PictureOutlined />
            <span>{value}</span>
          </div>
        </div>
      ) : null}

      {error ? <p className="image-upload-field__error">{error}</p> : null}
    </div>
  );
}
