import React from 'react';
import { Tag } from 'antd';
import {
  formatSellerCountry,
  getSellerCountryCode,
  getSellerCountryTagColor,
} from '../../utils/sellerCountryDisplay';

export const SELLERS_TABLE_LAYOUT = {
  firstName: 96,
  lastName: 108,
  email: 196,
  shopDisplayName: 148,
  shopId: 96,
  sellerCountry: 132,
  submittedAt: 152,
  reviewedAt: 152,
  status: 104,
  actions: 196,
  menuActions: 52,
};

function withColumnLayout(key, column) {
  const width = SELLERS_TABLE_LAYOUT[key];
  const fitContent = [
    'shopId',
    'sellerCountry',
    'submittedAt',
    'reviewedAt',
    'status',
    'menuActions',
  ].includes(key);

  return {
    ...column,
    width,
    ellipsis: column.ellipsis ?? Boolean(column.dataIndex && column.dataIndex !== 'shopId'),
    onHeaderCell: () => ({
      className: fitContent ? 'sellers-table__col-fit' : 'sellers-table__col',
    }),
    onCell: () => ({
      className: fitContent ? 'sellers-table__col-fit' : 'sellers-table__col',
    }),
  };
}

export function formatSellerTableDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleString('uz-UZ');
}

export function buildFirstNameColumn() {
  return withColumnLayout('firstName', {
    title: 'Ism',
    dataIndex: 'firstName',
    key: 'firstName',
  });
}

export function buildLastNameColumn() {
  return withColumnLayout('lastName', {
    title: 'Familiya',
    dataIndex: 'lastName',
    key: 'lastName',
  });
}

export function buildEmailColumn() {
  return withColumnLayout('email', {
    title: 'Gmail',
    dataIndex: 'email',
    key: 'email',
  });
}

export function buildShopDisplayNameColumn() {
  return withColumnLayout('shopDisplayName', {
    title: "Do'kon nomi",
    dataIndex: 'shopDisplayName',
    key: 'shopDisplayName',
  });
}

export function buildShopIdColumn() {
  return withColumnLayout('shopId', {
    title: "Do'kon ID",
    dataIndex: 'shopId',
    key: 'shopId',
    ellipsis: false,
    render: (value) => <Tag color="purple">{value}</Tag>,
  });
}

export function buildSellerCountryColumn() {
  return withColumnLayout('sellerCountry', {
    title: 'Sotuvchi davlati',
    key: 'sellerCountry',
    ellipsis: false,
    render: (_, record) => {
      const country = getSellerCountryCode(record);
      if (!country) return '—';
      return <Tag color={getSellerCountryTagColor(country)}>{formatSellerCountry(country)}</Tag>;
    },
  });
}

export function buildSubmittedAtColumn() {
  return withColumnLayout('submittedAt', {
    title: 'Yuborilgan',
    dataIndex: 'submittedAt',
    key: 'submittedAt',
    ellipsis: false,
    render: formatSellerTableDate,
  });
}

export function buildReviewedAtColumn() {
  return withColumnLayout('reviewedAt', {
    title: 'Tasdiqlangan',
    dataIndex: 'reviewedAt',
    key: 'reviewedAt',
    ellipsis: false,
    render: formatSellerTableDate,
  });
}

export function buildStatusColumn(renderStatus) {
  return withColumnLayout('status', {
    title: 'Holat',
    key: 'status',
    ellipsis: false,
    render: renderStatus,
  });
}

export function buildActionsColumn(renderActions) {
  return withColumnLayout('actions', {
    title: 'Amallar',
    key: 'actions',
    ellipsis: false,
    render: renderActions,
  });
}

export function buildMenuActionsColumn(renderActions) {
  return withColumnLayout('menuActions', {
    title: '',
    key: 'actions',
    fixed: 'right',
    align: 'center',
    ellipsis: false,
    render: renderActions,
  });
}

export function getSellersTableScrollX(columnKeys) {
  return columnKeys.reduce((sum, key) => sum + (SELLERS_TABLE_LAYOUT[key] || 0), 0);
}
