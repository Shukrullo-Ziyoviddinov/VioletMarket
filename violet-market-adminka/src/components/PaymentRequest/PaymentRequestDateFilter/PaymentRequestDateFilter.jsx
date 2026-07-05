import React from 'react';
import { CalendarOutlined } from '@ant-design/icons';
import { DatePicker } from 'antd';
import dayjs from 'dayjs';
import '../PaymentRequestFilterShared.css';

const { RangePicker } = DatePicker;

export function getDefaultPaymentRequestDateRange() {
  const now = dayjs();
  return [now.startOf('month'), now.endOf('month')];
}

export function formatPaymentRequestDateParam(value) {
  if (!value) return '';
  return dayjs(value).format('YYYY-MM-DD');
}

export default function PaymentRequestDateFilter({ value, onChange }) {
  return (
    <div className="payment-request-date-filter">
      <RangePicker
        className="payment-request-date-filter__picker"
        value={value}
        onChange={onChange}
        format="DD.MM.YYYY"
        suffixIcon={<CalendarOutlined />}
        allowClear={false}
      />
    </div>
  );
}
