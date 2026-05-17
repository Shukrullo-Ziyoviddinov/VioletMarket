import React, { useRef, useEffect } from 'react';
import './OtpInput.css';

const OTP_LENGTH = 6;

function digitsFromValue(value) {
  const raw = String(value || '').replace(/\D/g, '').slice(0, OTP_LENGTH);
  const arr = raw.split('');
  while (arr.length < OTP_LENGTH) arr.push('');
  return arr;
}

const OtpInput = ({ value, onChange, error, disabled, idPrefix = 'otp', autoFocus }) => {
  const inputRefs = useRef([]);

  const digits = digitsFromValue(value);

  useEffect(() => {
    if (autoFocus && inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, [autoFocus]);

  const emitChange = (nextDigits) => {
    onChange(nextDigits.join('').replace(/\D/g, '').slice(0, OTP_LENGTH));
  };

  const focusIndex = (index) => {
    const el = inputRefs.current[index];
    if (el) el.focus();
  };

  const handleChange = (index, e) => {
    const v = e.target.value.replace(/\D/g, '');
    if (!v) {
      const next = [...digits];
      next[index] = '';
      emitChange(next);
      return;
    }
    const next = [...digits];
    const chars = v.split('');
    let i = index;
    for (const ch of chars) {
      if (i >= OTP_LENGTH) break;
      next[i] = ch;
      i += 1;
    }
    emitChange(next);
    if (i < OTP_LENGTH) focusIndex(i);
    else focusIndex(OTP_LENGTH - 1);
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      if (digits[index]) {
        const next = [...digits];
        next[index] = '';
        emitChange(next);
      } else if (index > 0) {
        const next = [...digits];
        next[index - 1] = '';
        emitChange(next);
        focusIndex(index - 1);
      }
      e.preventDefault();
    } else if (e.key === 'ArrowLeft' && index > 0) {
      focusIndex(index - 1);
      e.preventDefault();
    } else if (e.key === 'ArrowRight' && index < OTP_LENGTH - 1) {
      focusIndex(index + 1);
      e.preventDefault();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
    if (!pasted) return;
    const next = pasted.split('');
    while (next.length < OTP_LENGTH) next.push('');
    emitChange(next);
    focusIndex(Math.min(pasted.length, OTP_LENGTH - 1));
  };

  return (
    <div
      className={`login-page__otp-cells${error ? ' login-page__otp-cells--error' : ''}`}
      role="group"
      aria-label="Tasdiqlash kodi"
      onPaste={handlePaste}
    >
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(el) => {
            inputRefs.current[index] = el;
          }}
          id={`${idPrefix}-otp-${index}`}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete={index === 0 ? 'one-time-code' : 'off'}
          maxLength={6}
          className="login-page__otp-cell"
          value={digit}
          disabled={disabled}
          aria-label={`${index + 1}-raqam`}
          onChange={(e) => handleChange(index, e)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onFocus={(e) => e.target.select()}
        />
      ))}
    </div>
  );
};

export default OtpInput;
