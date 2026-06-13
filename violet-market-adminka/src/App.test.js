import { render } from '@testing-library/react';
import { ConfigProvider } from 'antd';
import App from './App';

test('renders admin layout', () => {
  render(
    <ConfigProvider>
      <App />
    </ConfigProvider>,
  );
});
