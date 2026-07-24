import React from 'react';
import { Input } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import './CustomerRefundSearch.css';

export default function CustomerRefundSearch({ value, onChange, onSubmit }) {
  return (
    <Input
      allowClear
      className="customer-refund-search"
      prefix={<SearchOutlined />}
      placeholder="Mijoz ism, familiya, nomer yoki shtrix-kod"
      value={value}
      onChange={(event) => onChange?.(event.target.value)}
      onPressEnter={() => onSubmit?.(String(value || '').trim())}
    />
  );
}
