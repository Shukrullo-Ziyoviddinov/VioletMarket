import React, { useEffect, useId, useRef } from 'react';
import './DropdownPicker.css';

export default function DropdownPicker({
  label,
  hint,
  required = false,
  mode = 'single',
  value,
  options = [],
  placeholder = 'Tanlang',
  emptyText = 'Variantlar topilmadi',
  isOpen = false,
  onToggle,
  onSelect,
  onToggleOption,
}) {
  const rootRef = useRef(null);
  const hintId = useId();

  const selectedValues = mode === 'multiple'
    ? (Array.isArray(value) ? value.map(String) : [])
    : [value != null && value !== '' ? String(value) : ''].filter(Boolean);

  const selectedSet = new Set(selectedValues);
  const selectedOptions = options.filter((option) => selectedSet.has(String(option.value)));

  const triggerText = mode === 'multiple'
    ? selectedOptions.length
      ? selectedOptions.map((option) => option.label).join(', ')
      : placeholder
    : selectedOptions[0]?.label || placeholder;

  useEffect(() => {
    if (!isOpen) return undefined;

    const handlePointerDown = (event) => {
      if (rootRef.current?.contains(event.target)) return;
      onToggle?.(false);
    };

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [isOpen, onToggle]);

  const handleOptionClick = (optionValue) => {
    if (mode === 'multiple') {
      onToggleOption?.(optionValue);
      return;
    }

    onSelect?.(optionValue);
    onToggle?.(false);
  };

  return (
    <div className="dropdown-picker" ref={rootRef}>
      {label ? (
        <label className="dropdown-picker__label">
          {label}
          {required ? <span className="dropdown-picker__required">*</span> : null}
        </label>
      ) : null}

      {hint ? (
        <p className="dropdown-picker__hint" id={hintId}>
          {hint}
        </p>
      ) : null}

      <button
        type="button"
        className={`dropdown-picker__trigger${isOpen ? ' dropdown-picker__trigger--open' : ''}${
          selectedOptions.length ? ' dropdown-picker__trigger--filled' : ''
        }`}
        aria-expanded={isOpen}
        aria-describedby={hint ? hintId : undefined}
        onClick={() => onToggle?.(!isOpen)}
      >
        <span className="dropdown-picker__trigger-text">{triggerText}</span>
        <span className="dropdown-picker__caret" aria-hidden="true">
          {isOpen ? '▲' : '▼'}
        </span>
      </button>

      {isOpen ? (
        <div className="dropdown-picker__panel" role="listbox">
          {options.length === 0 ? (
            <p className="dropdown-picker__empty">{emptyText}</p>
          ) : (
            options.map((option) => {
              const isSelected = selectedSet.has(String(option.value));
              return (
                <button
                  key={option.value}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  className={`dropdown-picker__option${
                    isSelected ? ' dropdown-picker__option--selected' : ''
                  }`}
                  onClick={() => handleOptionClick(option.value)}
                >
                  {mode === 'multiple' ? (
                    <span className="dropdown-picker__check" aria-hidden="true">
                      {isSelected ? '✓' : ''}
                    </span>
                  ) : null}
                  <span className="dropdown-picker__option-body">
                    <span className="dropdown-picker__option-label">{option.label}</span>
                    {option.subLabel ? (
                      <span className="dropdown-picker__option-sub">{option.subLabel}</span>
                    ) : null}
                  </span>
                </button>
              );
            })
          )}
        </div>
      ) : null}
    </div>
  );
}
