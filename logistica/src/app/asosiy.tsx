import { ScreenShell } from '@/components/ScreenShell';

export default function AsosiyScreen() {
  return (
    <ScreenShell
      title="Asosiy"
      empty={{
        icon: 'send-outline',
        message: "Jo'natmalar mavjud emas",
      }}
    />
  );
}
