import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import './LanguageSwitcher.css';

const PUBLIC_URL = process.env.PUBLIC_URL || '';

const LANGUAGES = [
  { code: 'uz', flag: `${PUBLIC_URL}/img/uzbbayroq.png` },
  { code: 'en', flag: `${PUBLIC_URL}/img/englishbay.webp` },
  { code: 'zh', flag: `${PUBLIC_URL}/img/xitoybayroq.png` },
];

export default function LanguageSwitcher() {
  const { i18n, t } = useTranslation();
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);

  const langCode = (i18n.language || 'uz').split('-')[0];
  const currentLang = LANGUAGES.find((lang) => lang.code === langCode) || LANGUAGES[0];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const handleLanguageChange = (code) => {
    i18n.changeLanguage(code);
    setOpen(false);
  };

  return (
    <div className="language-switcher" ref={wrapperRef}>
      <button
        type="button"
        className="language-switcher__trigger"
        onClick={() => setOpen((value) => !value)}
        aria-label={t('language.switch')}
        aria-expanded={open}
      >
        <img src={currentLang.flag} alt={currentLang.code} className="language-switcher__flag" />
      </button>
      {open ? (
        <div className="language-switcher__dropdown">
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              type="button"
              className={`language-switcher__option${
                langCode === lang.code ? ' language-switcher__option--active' : ''
              }`}
              onClick={() => handleLanguageChange(lang.code)}
            >
              <img src={lang.flag} alt={lang.code} className="language-switcher__flag" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
