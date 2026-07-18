export type DeliveryTransport = 'car' | 'scooter' | 'bicycle';

export type DeliveryProfile = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  profileImage: string;
  transport: DeliveryTransport | null;
  isOnline: boolean;
  status: 'active' | 'blocked';
};

export type AuthResult = {
  token: string;
  delivery: DeliveryProfile;
};

export type OtpMeta = {
  email: string;
  expiresInSeconds: number;
  resendAfterSeconds: number;
};
