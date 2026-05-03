import React, { useState, useEffect, useRef, useCallback } from 'react';
import './VideoBanner.css';

const VideoBanner = ({ videos = [] }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const videoRef = useRef(null);

    // Videoni yuklash
    const loadVideo = useCallback((index) => {
        if (videoRef.current && videos[index]) {
            videoRef.current.src = videos[index].src;
            videoRef.current.load();
            videoRef.current.play().catch(err => {
                console.log('Autoplay blocked:', err);
            });
        }
    }, [videos]);

    // Video tugaganda keyingisiga o'tish
    useEffect(() => {
        const video = videoRef.current;
        if (!video || videos.length === 0) return;

        const handleEnded = () => {
            setCurrentIndex(prev => (prev + 1) % videos.length);
        };

        video.addEventListener('ended', handleEnded);
        return () => video.removeEventListener('ended', handleEnded);
    }, [videos.length]);

    // Index o'zgarganda videoni yuklash
    useEffect(() => {
        if (videos.length > 0) {
            loadVideo(currentIndex);
        }
    }, [currentIndex, loadVideo, videos.length]);

    // Birinchi videoni yuklash (videos o'zgarganda)
    useEffect(() => {
        if (videos.length > 0) {
            setCurrentIndex(0);
            loadVideo(0);
        }
    }, [videos, loadVideo]);

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
                        {videos[currentIndex]?.src && (
                            <source src={videos[currentIndex].src} type="video/mp4" />
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
