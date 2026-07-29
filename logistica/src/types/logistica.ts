export type LogisticaCountry =
  | 'china'
  | 'usa'
  | 'turkey'
  | 'korea'
  | 'japan';

export type LogisticaProfile = {
  id: string;
  email: string;
  companyName: string;
  name: string;
  logisticaCountry: LogisticaCountry;
  status: 'pending' | 'active' | 'blocked';
  reviewedAt: string | null;
  chinaAddress: string;
  chinaPhone: string;
  profileDescription: string;
  createdAt: string | null;
};

export type OtpMeta = {
  email: string;
  expiresInSeconds: number;
  resendAfterSeconds: number;
};

export type AuthResult = {
  token: string;
  profile: LogisticaProfile;
};

export type RegistrationResult = {
  requiresApproval: true;
  profile: LogisticaProfile;
};

export type ApprovalStatusResult = {
  email: string;
  status: 'pending' | 'active' | 'blocked' | 'not_found';
};

export const LOGISTICA_COUNTRY_OPTIONS: {
  key: LogisticaCountry;
  label: string;
}[] = [
  { key: 'china', label: 'China' },
  { key: 'usa', label: 'AQSH' },
  { key: 'turkey', label: 'Turkiya' },
  { key: 'korea', label: 'Korea' },
  { key: 'japan', label: 'Yaponiya' },
];
