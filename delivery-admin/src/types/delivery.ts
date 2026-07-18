export type DeliveryTransport = 'car' | 'scooter' | 'bicycle';

export type DeliveryAccountStatus = 'pending' | 'active' | 'blocked';

export type DeliveryProfile = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  profileImage: string;
  transport: DeliveryTransport | null;
  isOnline: boolean;
  status: DeliveryAccountStatus;
  reviewedAt?: string | null;
  createdAt?: string | null;
};

export type AuthResult = {
  token: string;
  delivery: DeliveryProfile;
};

export type RegistrationResult = {
  requiresApproval: true;
  delivery: DeliveryProfile;
};

export type ApprovalStatusResult = {
  email: string;
  status: DeliveryAccountStatus | 'not_found';
};

export type OtpMeta = {
  email: string;
  expiresInSeconds: number;
  resendAfterSeconds: number;
};
