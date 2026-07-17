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
  photoUri: string;
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
  const form = new FormData();
  form.append('email', payload.email);
  form.append('code', payload.code);
  form.append('firstName', payload.firstName);
  form.append('lastName', payload.lastName);
  form.append('phone', payload.phone);

  const extension = payload.photoUri.split('.').pop()?.toLowerCase();
  const type =
    extension === 'png'
      ? 'image/png'
      : extension === 'webp'
        ? 'image/webp'
        : 'image/jpeg';

  form.append(
    'photo',
    {
      uri: payload.photoUri,
      name: `delivery-profile.${extension || 'jpg'}`,
      type,
    } as unknown as Blob,
  );

  return apiRequest<AuthResult>('/api/delivery-auth/register/verify', {
    method: 'POST',
    body: form,
  });
}

export function getDeliveryProfile(token: string) {
  return apiRequest<DeliveryProfile>(
    '/api/delivery-auth/me',
    { method: 'GET' },
    token,
  );
}
