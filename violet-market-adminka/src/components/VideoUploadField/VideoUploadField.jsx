import React, { useRef, useState } from 'react';
import { LoadingOutlined, UploadOutlined, VideoCameraOutlined } from '@ant-design/icons';
import { toAbsoluteVideoUrl, uploadVideoBanner } from '../../api/videoBannerAdminApi';
import './VideoUploadField.css';

export default function VideoUploadField({
  label = 'video',
  value = '',
  onChange,
  onUploadStateChange,
}) {
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [uploadPhase, setUploadPhase] = useState('idle');

  const previewUrl = toAbsoluteVideoUrl(value);

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
      const uploadedPath = await uploadVideoBanner(
        file,
        (nextProgress) => setProgress(nextProgress),
        (phase) => setUploadPhase(phase),
      );
      if (!uploadedPath) {
        throw new Error("Server video manzilini qaytarmadi");
      }
      if (typeof onChange === 'function') {
        onChange(uploadedPath);
      }
    } catch (err) {
      setError(err.message || 'Video upload xatolik');
    } finally {
      setUploading(false);
      setUploadPhase('idle');
      if (typeof onUploadStateChange === 'function') {
        onUploadStateChange(false);
      }
    }
  };

  const progressLabel =
    uploadPhase === 'verifying' ? "Serverga saqlanmoqda..." : 'Video yuklanmoqda...';

  return (
    <div className="video-upload-field">
      <span className="video-upload-field__label">{label}</span>

      <input
        ref={fileInputRef}
        type="file"
        accept="video/*"
        className="video-upload-field__hidden-input"
        onChange={handleFileSelected}
      />

      <button type="button" className="video-upload-field__dropzone" onClick={openFilePicker}>
        <div className="video-upload-field__icon-wrap">
          {uploading ? <LoadingOutlined /> : <UploadOutlined />}
        </div>
        <div className="video-upload-field__text-wrap">
          <strong>Video tanlash</strong>
          <span>Qurilmadan yuklash uchun bosing</span>
        </div>
      </button>

      {uploading ? (
        <div className="video-upload-field__progress">
          <div className="video-upload-field__progress-head">
            <span>{progressLabel}</span>
            <span>{progress}%</span>
          </div>
          <div className="video-upload-field__progress-track">
            <div className="video-upload-field__progress-bar" style={{ width: `${progress}%` }} />
          </div>
        </div>
      ) : null}

      {previewUrl ? (
        <div className="video-upload-field__preview">
          <div className="video-upload-field__preview-video-wrap">
            <video
              src={previewUrl}
              className="video-upload-field__preview-video"
              controls
              preload="metadata"
            />
          </div>
          <div className="video-upload-field__preview-meta">
            <VideoCameraOutlined />
            <span>{value}</span>
          </div>
        </div>
      ) : null}

      {error ? <p className="video-upload-field__error">{error}</p> : null}
    </div>
  );
}
