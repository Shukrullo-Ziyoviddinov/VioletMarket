import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useUser } from '../contexts/UserContext';
import { sendLoginCode, sendRegisterCode, verifyLogin, registerUser } from '../api/authApi';
import OtpInput from '../components/OtpInput/OtpInput';
import './Profile.css';
import './Login.css';

const LOGIN_LOGO_SRC = `${process.env.PUBLIC_URL || ''}/img/vio_preview_rev_1%20(1).png`;
const DEFAULT_OTP_SECONDS = 60;

function formatOtpCountdown(seconds) {
  const s = Math.max(0, seconds);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, '0')}`;
}

function daysInMonth(month, year) {
  return new Date(year, month, 0).getDate();
}

function formatBirthDateDisplay(iso) {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return '';
  const [y, m, d] = iso.split('-');
  return `${d}.${m}.${y}`;
}

const Login = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { setSession, userData } = useUser();

  const [authMode, setAuthMode] = useState('register');
  const [loginStep, setLoginStep] = useState('email');
  const [registerStep, setRegisterStep] = useState('form');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginEmailError, setLoginEmailError] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpError, setOtpError] = useState('');
  const [apiMessage, setApiMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [otpCountdown, setOtpCountdown] = useState(0);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    birthDate: '',
    gender: '',
  });
  const [errors, setErrors] = useState({});
  const [birthDatePickerOpen, setBirthDatePickerOpen] = useState(false);
  const [openBirthList, setOpenBirthList] = useState(null);
  const [pickYear, setPickYear] = useState(2000);
  const [pickMonth, setPickMonth] = useState(1);
  const [pickDay, setPickDay] = useState(1);

  const lang = i18n.language || 'uz';
  const langKey = String(lang).toLowerCase().startsWith('ru') ? 'ru' : 'uz';

  useEffect(() => {
    if (userData.isAuthenticated) {
      navigate('/profile', { replace: true });
    }
  }, [userData.isAuthenticated, navigate]);

  useEffect(() => {
    if (userData.isAuthenticated) return;
    setFormData({
      firstName: userData.firstName || '',
      lastName: userData.lastName || '',
      phone: userData.phone || '',
      email: userData.email || '',
      birthDate: userData.birthDate || '',
      gender: userData.gender || '',
    });
    setLoginEmail(userData.email || '');
  }, [userData]);

  useEffect(() => {
    if (!birthDatePickerOpen) setOpenBirthList(null);
  }, [birthDatePickerOpen]);

  const yearOptions = useMemo(() => {
    const current = new Date().getFullYear();
    const list = [];
    for (let y = current; y >= 1920; y -= 1) list.push(y);
    return list;
  }, []);

  const monthOptions = useMemo(() => {
    const locale = langKey === 'ru' ? 'ru-RU' : 'uz-UZ';
    return Array.from({ length: 12 }, (_, i) => {
      const label = new Intl.DateTimeFormat(locale, { month: 'long' }).format(new Date(2000, i, 1));
      return { value: i + 1, label };
    });
  }, [langKey]);

  const dayOptions = useMemo(() => {
    const dim = daysInMonth(pickMonth, pickYear);
    return Array.from({ length: dim }, (_, i) => i + 1);
  }, [pickMonth, pickYear]);

  const birthDateDisplay = useMemo(
    () => formatBirthDateDisplay(formData.birthDate),
    [formData.birthDate],
  );

  const openBirthDatePicker = () => {
    const iso = formData.birthDate;
    if (iso && /^\d{4}-\d{2}-\d{2}$/.test(iso)) {
      const [y, m, d] = iso.split('-').map(Number);
      const dim = daysInMonth(m, y);
      setPickYear(y);
      setPickMonth(m);
      setPickDay(Math.min(d, dim));
    } else {
      const currentY = new Date().getFullYear();
      setPickYear(Math.max(1920, currentY - 25));
      setPickMonth(1);
      setPickDay(1);
    }
    setBirthDatePickerOpen(true);
  };

  const cancelBirthDatePicker = () => setBirthDatePickerOpen(false);

  const saveBirthDatePicker = () => {
    const dim = daysInMonth(pickMonth, pickYear);
    const day = Math.min(pickDay, dim);
    const pad = (n) => String(n).padStart(2, '0');
    setFormData((prev) => ({
      ...prev,
      birthDate: `${pickYear}-${pad(pickMonth)}-${pad(day)}`,
    }));
    setBirthDatePickerOpen(false);
  };

  const applyPickMonth = (m) => {
    setPickMonth(m);
    const dim = daysInMonth(m, pickYear);
    setPickDay((d) => Math.min(d, dim));
    setOpenBirthList(null);
  };

  const applyPickYear = (y) => {
    setPickYear(y);
    const dim = daysInMonth(pickMonth, y);
    setPickDay((d) => Math.min(d, dim));
    setOpenBirthList(null);
  };

  const applyPickDay = (d) => {
    setPickDay(d);
    setOpenBirthList(null);
  };

  useEffect(() => {
    if (!birthDatePickerOpen) return;
    const dim = daysInMonth(pickMonth, pickYear);
    setPickDay((d) => (d > dim ? dim : d));
  }, [birthDatePickerOpen, pickMonth, pickYear]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handlePhoneChange = (e) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.startsWith('998')) {
      value = value.substring(3);
    }
    if (value.length > 0) {
      let formatted = '+998 ';
      if (value.length > 0) formatted += value.substring(0, 2);
      if (value.length > 2) formatted += ` ${value.substring(2, 5)}`;
      if (value.length > 5) formatted += ` ${value.substring(5, 7)}`;
      if (value.length > 7) formatted += ` ${value.substring(7, 9)}`;
      setFormData((prev) => ({ ...prev, phone: formatted.trim() }));
    } else {
      setFormData((prev) => ({ ...prev, phone: '' }));
    }
  };

  const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

  const mapApiError = (err) => {
    if (err?.status === 404) return t('profile.errorApiNotFound');
    if (err?.code === 'BREVO_NOT_CONFIGURED' || err?.code === 'BREVO_SEND_FAILED') {
      return err.message || t('profile.errorBrevoEmail');
    }
    if (err?.code === 'USER_NOT_FOUND') return t('profile.errorUserNotFound');
    if (err?.code === 'EMAIL_EXISTS') return t('profile.errorEmailTaken');
    if (err?.code === 'OTP_INVALID') return t('profile.errorOtp');
    if (err?.code === 'OTP_EXPIRED') return t('profile.errorOtpExpired');
    return err?.message || t('profile.errorSendCode');
  };

  const resetOtpFlow = () => {
    setOtpCode('');
    setOtpError('');
    setApiMessage('');
    setLoading(false);
    setOtpCountdown(0);
  };

  const startOtpCountdown = (seconds = DEFAULT_OTP_SECONDS) => {
    setOtpCountdown(Math.max(1, Number(seconds) || DEFAULT_OTP_SECONDS));
  };

  useEffect(() => {
    if (otpCountdown <= 0) return undefined;
    const timer = window.setTimeout(() => {
      setOtpCountdown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [otpCountdown]);

  const otpTimerActive = otpCountdown > 0;

  const handleLoginEmailChange = (e) => {
    setLoginEmail(e.target.value);
    if (loginEmailError) setLoginEmailError('');
  };

  const handleOtpChange = (v) => {
    setOtpCode(v);
    if (otpError) setOtpError('');
  };

  const handleGetCode = async () => {
    const emailTrimmed = loginEmail.trim();
    if (!emailTrimmed) {
      setLoginEmailError(t('profile.errorEmail'));
      return;
    }
    if (!isValidEmail(emailTrimmed)) {
      setLoginEmailError(t('profile.errorEmailInvalid'));
      return;
    }
    setLoading(true);
    setLoginEmailError('');
    setApiMessage('');
    try {
      const res = await sendLoginCode(emailTrimmed);
      setLoginStep('otp');
      startOtpCountdown(res.expiresInSeconds);
      setApiMessage(t('profile.otpSent', { email: emailTrimmed }));
    } catch (err) {
      setLoginEmailError(mapApiError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyLogin = async () => {
    const emailTrimmed = loginEmail.trim();
    if (otpCode.length !== 6) {
      setOtpError(t('profile.errorOtp'));
      return;
    }
    setLoading(true);
    setOtpError('');
    try {
      const res = await verifyLogin(emailTrimmed, otpCode);
      setSession(res.token, res.user);
      navigate('/profile', { replace: true });
    } catch (err) {
      setOtpError(mapApiError(err));
    } finally {
      setLoading(false);
    }
  };

  const switchAuthMode = (mode) => {
    setAuthMode(mode);
    setLoginEmailError('');
    setErrors({});
    setLoginStep('email');
    setRegisterStep('form');
    resetOtpFlow();
    if (mode === 'login') {
      setLoginEmail((prev) => prev || userData.email || formData.email || '');
    }
  };

  const handleRegisterSendCode = async (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!formData.firstName.trim()) newErrors.firstName = t('profile.errorFirstName');
    if (!formData.lastName.trim()) newErrors.lastName = t('profile.errorLastName');
    if (!formData.phone.trim()) newErrors.phone = t('profile.errorPhone');
    const emailTrimmed = formData.email.trim();
    if (!emailTrimmed) {
      newErrors.email = t('profile.errorEmail');
    } else if (!isValidEmail(emailTrimmed)) {
      newErrors.email = t('profile.errorEmailInvalid');
    }
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setLoading(true);
    setApiMessage('');
    try {
      const res = await sendRegisterCode(emailTrimmed);
      setRegisterStep('otp');
      setOtpCode('');
      startOtpCountdown(res.expiresInSeconds);
      setApiMessage(t('profile.otpSent', { email: emailTrimmed }));
    } catch (err) {
      setErrors({ email: mapApiError(err) });
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteRegister = async () => {
    const emailTrimmed = formData.email.trim();
    if (otpCode.length !== 6) {
      setOtpError(t('profile.errorOtp'));
      return;
    }
    setLoading(true);
    setOtpError('');
    try {
      const res = await registerUser({
        email: emailTrimmed,
        code: otpCode,
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        phone: formData.phone.trim(),
        birthDate: formData.birthDate,
        gender: formData.gender,
        language: langKey,
      });
      setSession(res.token, res.user);
      navigate('/profile', { replace: true });
    } catch (err) {
      setOtpError(mapApiError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleResendLoginCode = async () => {
    if (otpTimerActive || loading) return;
    await handleGetCode();
  };

  const handleResendRegisterCode = async () => {
    if (otpTimerActive || loading) return;
    const emailTrimmed = formData.email.trim();
    if (!emailTrimmed || !isValidEmail(emailTrimmed)) return;
    setLoading(true);
    setOtpError('');
    try {
      const res = await sendRegisterCode(emailTrimmed);
      setOtpCode('');
      startOtpCountdown(res.expiresInSeconds);
      setApiMessage(t('profile.otpSent', { email: emailTrimmed }));
    } catch (err) {
      setOtpError(mapApiError(err));
    } finally {
      setLoading(false);
    }
  };

  const renderOtpStep = ({
    idPrefix,
    onVerify,
    onResend,
    onBack,
    backLabel,
    submitClassName = 'login-page__submit',
  }) => (
    <div className="login-page__otp-block">
      <p className="login-page__otp-hint">{apiMessage}</p>
      <div className="login-page__otp-stack">
        <div className="form-group login-page__otp-form-group">
          <OtpInput
            idPrefix={idPrefix}
            value={otpCode}
            onChange={handleOtpChange}
            error={!!otpError}
            disabled={loading}
            autoFocus
          />
          {otpError && <span className="error-message">{otpError}</span>}
        </div>
        <div className="login-page__otp-actions">
          <button
            type="button"
            className={submitClassName}
            disabled={loading}
            onClick={onVerify}
          >
            {loading ? t('profile.loading') : t('profile.verifyCode')}
          </button>
          {otpTimerActive ? (
            <span className="login-page__otp-timer" aria-live="polite">
              {formatOtpCountdown(otpCountdown)}
            </span>
          ) : (
            <button
              type="button"
              className="login-page__otp-resend"
              disabled={loading}
              onClick={onResend}
              aria-label={t('profile.resendCode')}
              title={t('profile.resendCode')}
            >
              <i className="bx bx-refresh" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>
      <button
        type="button"
        className="login-page__link-btn"
        disabled={loading}
        onClick={onBack}
      >
        {backLabel}
      </button>
    </div>
  );

  const birthPickerPortal = birthDatePickerOpen
    ? createPortal(
        <>
          <div
            className="profile-birth-picker-backdrop"
            onClick={cancelBirthDatePicker}
            role="presentation"
            aria-hidden="true"
          />
          <div
            className="profile-birth-picker"
            role="dialog"
            aria-modal="true"
            aria-labelledby="login-birth-picker-title"
            onClick={(ev) => ev.stopPropagation()}
          >
            <h4 id="login-birth-picker-title" className="profile-birth-picker__title">
              {t('profile.datePickerTitle')}
            </h4>
            <div className="profile-birth-picker__fields">
              <div className="profile-birth-picker__select-wrap">
                <span className="profile-birth-picker__select-label" id="login-birth-month-lbl">
                  {t('profile.month')}
                </span>
                <div className="profile-birth-picker__dropdown">
                  <button
                    type="button"
                    className={`profile-birth-picker__trigger${openBirthList === 'month' ? ' profile-birth-picker__trigger--open' : ''}`}
                    onClick={() => setOpenBirthList((p) => (p === 'month' ? null : 'month'))}
                    aria-haspopup="listbox"
                    aria-expanded={openBirthList === 'month'}
                    aria-labelledby="login-birth-month-lbl"
                  >
                    <span className="profile-birth-picker__trigger-text">
                      {monthOptions.find((mo) => mo.value === pickMonth)?.label ?? '—'}
                    </span>
                    <i className="bx bx-chevron-down profile-birth-picker__trigger-chevron" aria-hidden="true" />
                  </button>
                  {openBirthList === 'month' && (
                    <ul className="profile-birth-picker__list" role="listbox" aria-labelledby="login-birth-month-lbl">
                      {monthOptions.map((mo) => (
                        <li key={mo.value} role="none">
                          <button
                            type="button"
                            role="option"
                            aria-selected={pickMonth === mo.value}
                            className={`profile-birth-picker__list-option${pickMonth === mo.value ? ' profile-birth-picker__list-option--selected' : ''}`}
                            onClick={() => applyPickMonth(mo.value)}
                          >
                            {mo.label}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
              <div className="profile-birth-picker__select-wrap">
                <span className="profile-birth-picker__select-label" id="login-birth-day-lbl">
                  {t('profile.day')}
                </span>
                <div className="profile-birth-picker__dropdown">
                  <button
                    type="button"
                    className={`profile-birth-picker__trigger${openBirthList === 'day' ? ' profile-birth-picker__trigger--open' : ''}`}
                    onClick={() => setOpenBirthList((p) => (p === 'day' ? null : 'day'))}
                    aria-haspopup="listbox"
                    aria-expanded={openBirthList === 'day'}
                    aria-labelledby="login-birth-day-lbl"
                  >
                    <span className="profile-birth-picker__trigger-text">{pickDay}</span>
                    <i className="bx bx-chevron-down profile-birth-picker__trigger-chevron" aria-hidden="true" />
                  </button>
                  {openBirthList === 'day' && (
                    <ul className="profile-birth-picker__list" role="listbox" aria-labelledby="login-birth-day-lbl">
                      {dayOptions.map((d) => (
                        <li key={d} role="none">
                          <button
                            type="button"
                            role="option"
                            aria-selected={pickDay === d}
                            className={`profile-birth-picker__list-option${pickDay === d ? ' profile-birth-picker__list-option--selected' : ''}`}
                            onClick={() => applyPickDay(d)}
                          >
                            {d}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
              <div className="profile-birth-picker__select-wrap">
                <span className="profile-birth-picker__select-label" id="login-birth-year-lbl">
                  {t('profile.year')}
                </span>
                <div className="profile-birth-picker__dropdown">
                  <button
                    type="button"
                    className={`profile-birth-picker__trigger${openBirthList === 'year' ? ' profile-birth-picker__trigger--open' : ''}`}
                    onClick={() => setOpenBirthList((p) => (p === 'year' ? null : 'year'))}
                    aria-haspopup="listbox"
                    aria-expanded={openBirthList === 'year'}
                    aria-labelledby="login-birth-year-lbl"
                  >
                    <span className="profile-birth-picker__trigger-text">{pickYear}</span>
                    <i className="bx bx-chevron-down profile-birth-picker__trigger-chevron" aria-hidden="true" />
                  </button>
                  {openBirthList === 'year' && (
                    <ul
                      className="profile-birth-picker__list profile-birth-picker__list--year"
                      role="listbox"
                      aria-labelledby="login-birth-year-lbl"
                    >
                      {yearOptions.map((y) => (
                        <li key={y} role="none">
                          <button
                            type="button"
                            role="option"
                            aria-selected={pickYear === y}
                            className={`profile-birth-picker__list-option${pickYear === y ? ' profile-birth-picker__list-option--selected' : ''}`}
                            onClick={() => applyPickYear(y)}
                          >
                            {y}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
            <div className="profile-birth-picker__actions">
              <button type="button" className="profile-birth-picker__btn profile-birth-picker__btn--ghost" onClick={cancelBirthDatePicker}>
                {t('profile.cancel')}
              </button>
              <button type="button" className="profile-birth-picker__btn profile-birth-picker__btn--primary" onClick={saveBirthDatePicker}>
                {t('profile.save')}
              </button>
            </div>
          </div>
        </>,
        document.body,
      )
    : null;

  return (
    <div className="login-page">
      {birthPickerPortal}
      <div className="login-page__inner">
        <div className="login-page__logo">
          <img src={LOGIN_LOGO_SRC} alt="Violet Market" />
        </div>
        <h1 className="login-page__title">{t('profile.loginPageTitle')}</h1>

        <div className="login-page__tabs" role="tablist" aria-label={t('profile.loginPageTitle')}>
          <span
            className={`login-page__tabs-slide${authMode === 'login' ? ' login-page__tabs-slide--login' : ''}`}
            aria-hidden="true"
          />
          <div className="login-page__tabs-row">
            <button
              type="button"
              role="tab"
              aria-selected={authMode === 'register'}
              className="login-page__tab"
              onClick={() => switchAuthMode('register')}
            >
              {t('profile.registerTab')}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={authMode === 'login'}
              className="login-page__tab"
              onClick={() => switchAuthMode('login')}
            >
              {t('profile.login')}
            </button>
          </div>
        </div>

        {authMode === 'register' ? (
          registerStep === 'otp' ? (
            renderOtpStep({
              idPrefix: 'register',
              onVerify: handleCompleteRegister,
              onResend: handleResendRegisterCode,
              onBack: () => {
                setRegisterStep('form');
                resetOtpFlow();
              },
              backLabel: t('profile.backToForm'),
            })
          ) : (
          <form className="profile-form login-page__form" onSubmit={handleRegisterSendCode} noValidate>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="login-firstName">{t('profile.firstName')}</label>
                <input
                  id="login-firstName"
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  className={errors.firstName ? 'error' : ''}
                  autoComplete="given-name"
                />
                {errors.firstName && <span className="error-message">{errors.firstName}</span>}
              </div>
              <div className="form-group">
                <label htmlFor="login-lastName">{t('profile.lastName')}</label>
                <input
                  id="login-lastName"
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  className={errors.lastName ? 'error' : ''}
                  autoComplete="family-name"
                />
                {errors.lastName && <span className="error-message">{errors.lastName}</span>}
              </div>
            </div>

            <div className="form-group">
              <label>{t('profile.birthDate')}</label>
              <div className="profile-birth-field">
                <input
                  type="text"
                  readOnly
                  value={birthDateDisplay}
                  placeholder={t('profile.birthDatePlaceholder')}
                  className="profile-birth-field__input"
                  onClick={openBirthDatePicker}
                  onKeyDown={(ev) => {
                    if (ev.key === 'Enter' || ev.key === ' ') {
                      ev.preventDefault();
                      openBirthDatePicker();
                    }
                  }}
                  aria-label={t('profile.pickBirthDateAria')}
                />
                <button
                  type="button"
                  className="profile-birth-field__icon-btn"
                  onClick={openBirthDatePicker}
                  aria-label={t('profile.pickBirthDateAria')}
                >
                  <i className="bx bx-calendar" aria-hidden="true" />
                </button>
              </div>
            </div>

            <div className="form-group profile-form-group--gender">
              <label>{t('profile.gender')}</label>
              <div className="profile-gender-toggle" role="group" aria-label={t('profile.gender')}>
                <button
                  type="button"
                  className={`profile-gender-btn${formData.gender === 'male' ? ' profile-gender-btn--active' : ''}`}
                  onClick={() => setFormData((p) => ({ ...p, gender: 'male' }))}
                >
                  {t('profile.genderMale')}
                </button>
                <button
                  type="button"
                  className={`profile-gender-btn${formData.gender === 'female' ? ' profile-gender-btn--active' : ''}`}
                  onClick={() => setFormData((p) => ({ ...p, gender: 'female' }))}
                >
                  {t('profile.genderFemale')}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="login-phone">{t('profile.phone')}</label>
              <input
                id="login-phone"
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handlePhoneChange}
                placeholder={t('profile.phonePlaceholder')}
                className={errors.phone ? 'error' : ''}
                autoComplete="tel"
              />
              {errors.phone && <span className="error-message">{errors.phone}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="login-email">{t('profile.email')}</label>
              <input
                id="login-email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder={t('profile.emailPlaceholder')}
                className={errors.email ? 'error' : ''}
                autoComplete="email"
              />
              {errors.email && <span className="error-message">{errors.email}</span>}
            </div>

            <button type="submit" className="login-page__submit" disabled={loading}>
              {loading ? t('profile.loading') : t('profile.getCode')}
            </button>
          </form>
          )
        ) : loginStep === 'otp' ? (
          renderOtpStep({
            idPrefix: 'login',
            onVerify: handleVerifyLogin,
            onResend: handleResendLoginCode,
            onBack: () => {
              setLoginStep('email');
              resetOtpFlow();
            },
            backLabel: t('profile.backToEmail'),
            submitClassName: 'login-page__submit login-page__submit--code',
          })
        ) : (
          <div className="login-page__login-block">
            <div className="form-group">
              <label htmlFor="login-auth-email">{t('profile.email')}</label>
              <input
                id="login-auth-email"
                type="email"
                value={loginEmail}
                onChange={handleLoginEmailChange}
                placeholder={t('profile.emailPlaceholder')}
                className={loginEmailError ? 'error' : ''}
                autoComplete="email"
                disabled={loading}
              />
              {loginEmailError && <span className="error-message">{loginEmailError}</span>}
            </div>
            <button
              type="button"
              className="login-page__submit login-page__submit--code"
              disabled={loading}
              onClick={handleGetCode}
            >
              {loading ? t('profile.loading') : t('profile.getCode')}
            </button>
          </div>
        )}

        <Link to="/profile" className="login-page__back">
          {t('profile.back')}
        </Link>
      </div>
    </div>
  );
};

export default Login;
