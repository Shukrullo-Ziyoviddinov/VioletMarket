import React from 'react';
import { CalendarOutlined } from '@ant-design/icons';
import { DatePicker } from 'antd';
import dayjs from 'dayjs';
import './SellerEarningsSoldProductsDateFilter.css';

const { RangePicker } = DatePicker;

export default function SellerEarningsSoldProductsDateFilter({
  value,
  onChange,
}) {
  return (
    <div className="seller-earnings-sold-products-date-filter">
      <RangePicker
        className="seller-earnings-sold-products-date-filter__picker"
        value={value}
        onChange={onChange}
        format="DD.MM.YYYY"
        suffixIcon={<CalendarOutlined />}
        allowClear={false}
      />
    </div>
  );
}

export function getDefaultSoldProductsDateRange() {
  const now = dayjs();
  return [now.startOf('month'), now.endOf('month')];
}

export function formatSoldProductsDateParam(value) {
  if (!value) return '';
  return dayjs(value).format('YYYY-MM-DD');
}
