import React, { useState, useEffect, useRef, useCallback } from 'react';
import { SkeletonPulse } from '../SkeletonLoader';
import { getApiBaseUrl } from '../../config/api';
import './VideoBanner.css';

const resolveVideoSrc = (src) => {
    const raw = String(src || '').trim();
    if (!raw) return '';
    const normalized = raw.replace(/\\/g, '/');

    if (normalized.startsWith('http://') || normalized.startsWith('https://')) {
        return normalized;
    }
    if (normalized.startsWith('/uploads/') || normalized.startsWith('uploads/')) {
        return `${getApiBaseUrl()}${normalized.startsWith('/') ? normalized : `/${normalized}`}`;
    }
    return normalized.startsWith('/') ? normalized : `/${normalized}`;
};

const VideoBanner = ({ videos = [], isLoading = false }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const videoRef = useRef(null);

    // Videoni yuklash
    const loadVideo = useCallback((index) => {
        if (isLoading || !videoRef.current || !videos[index]) return;
        videoRef.current.src = resolveVideoSrc(videos[index].src);
        videoRef.current.load();
        videoRef.current.play().catch(err => {
            console.log('Autoplay blocked:', err);
        });
    }, [videos, isLoading]);

    // Video tugaganda keyingisiga o'tish
    useEffect(() => {
        if (isLoading || videos.length === 0) return;
        const video = videoRef.current;
        if (!video) return;

        const handleEnded = () => {
            setCurrentIndex(prev => (prev + 1) % videos.length);
        };

        video.addEventListener('ended', handleEnded);
        return () => video.removeEventListener('ended', handleEnded);
    }, [videos.length, isLoading]);

    // Index o'zgarganda videoni yuklash
    useEffect(() => {
        if (isLoading || videos.length === 0) return;
        loadVideo(currentIndex);
    }, [currentIndex, loadVideo, videos.length, isLoading]);

    // Birinchi videoni yuklash (videos o'zgarganda)
    useEffect(() => {
        if (isLoading || videos.length === 0) return;
        setCurrentIndex(0);
        loadVideo(0);
    }, [videos, loadVideo, isLoading]);

    if (isLoading) {
        return (
            <div className="container">
                <div className="video-banner__itms" aria-busy="true" aria-label="Video banner yuklanmoqda">
                    <div className="video-banner video-banner--skeleton">
                        <SkeletonPulse className="video-banner__video-skeleton skeleton-pulse--fill" aria-hidden />
                    </div>
                </div>
            </div>
        );
    }

    if (videos.length === 0) return null;

    return (
        <div className="container">
            <div className="video-banner__itms">
                <div className="video-banner">
                    <video 
                        ref={videoRef}
                        id="bannerVideo"
                        muted
                        autoPlay
                        playsInline
                    >
                        {videos[currentIndex]?.src && resolveVideoSrc(videos[currentIndex].src) && (
                            <source src={resolveVideoSrc(videos[currentIndex].src)} type="video/mp4" />
                        )}
                        Brauzeringiz video formatini qo'llab-quvvatlamaydi.
                    </video>
                    <div className="video-indicators">
                        {videos.map((_, index) => (
                            <div
                                key={index}
                                className={`indicator ${index === currentIndex ? 'active' : ''}`}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VideoBanner;
