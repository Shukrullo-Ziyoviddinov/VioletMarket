import React from 'react';
import { Typography } from 'antd';
import './HomePage.css';

const { Title, Text } = Typography;

export default function HomePage() {
  return (
    <section className="home-page">
      <Title level={3} className="home-page__title">
        Bosh sahifa
      </Title>
      <Text type="secondary">
        Do&apos;kon haqidagi ma&apos;lumotlarni ko&apos;rish uchun chap menudan &quot;Market haqida&quot; ni bosing.
      </Text>
    </section>
  );
}
