import React from 'react';
import { Typography } from 'antd';
import './MessagesPage.css';

const { Title } = Typography;

export default function MessagesPage() {
  return (
    <section className="messages-page">
      <Title level={3} className="messages-page__title">
        Xabarlar
      </Title>
    </section>
  );
}
