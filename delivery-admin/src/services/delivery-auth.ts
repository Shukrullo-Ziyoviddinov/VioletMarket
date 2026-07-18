import { apiRequest } from '@/services/api';
import type {
  AuthResult,
  DeliveryProfile,
  OtpMeta,
} from '@/types/delivery';

export type EmailStartResult =
  | { mode: 'register'; email: string }
  | ({ mode: 'login' } & OtpMeta);

export type RegistrationPayload = {
  email: string;
  code: string;
  firstName: string;
  lastName: string;
  phone: string;
};

export type UpdateDeliveryProfilePayload = {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
};

export function startEmailAuth(email: string) {
  return apiRequest<EmailStartResult>('/api/delivery-auth/email/start', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

export function sendRegistrationCode(email: string) {
  return apiRequest<OtpMeta>('/api/delivery-auth/register/send-code', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

export function verifyLogin(email: string, code: string) {
  return apiRequest<AuthResult>('/api/delivery-auth/login/verify', {
    method: 'POST',
    body: JSON.stringify({ email, code }),
  });
}

export function completeRegistration(payload: RegistrationPayload) {
  return apiRequest<AuthResult>('/api/delivery-auth/register/verify', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function getDeliveryProfile(token: string) {
  return apiRequest<DeliveryProfile>(
    '/api/delivery-auth/me',
    { method: 'GET' },
    token,
  );
}

export function updateDeliveryProfile(
  token: string,
  payload: UpdateDeliveryProfilePayload,
) {
  return apiRequest<DeliveryProfile>(
    '/api/delivery-auth/me',
    {
      method: 'PATCH',
      body: JSON.stringify(payload),
    },
    token,
  );
}

export function uploadDeliveryProfileImage(
  token: string,
  imageBase64: string,
) {
  return apiRequest<DeliveryProfile>(
    '/api/delivery-auth/me/photo',
    {
      method: 'POST',
      body: JSON.stringify({ imageBase64 }),
    },
    token,
  );
}
