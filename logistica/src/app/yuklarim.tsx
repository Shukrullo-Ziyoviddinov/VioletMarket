import { ScreenShell } from '@/components/ScreenShell';

export default function YuklarimScreen() {
  return (
    <ScreenShell
      title="Yuklarim"
      empty={{
        icon: 'cube-outline',
        message: 'Yuklar mavjud emas',
      }}
    />
  );
}
