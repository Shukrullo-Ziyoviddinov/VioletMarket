import { apiRequest } from '@/services/api';
import type {
  ApprovalStatusResult,
  AuthResult,
  DeliveryProfile,
  DeliveryTransport,
  OtpMeta,
  RegistrationResult,
} from '@/types/delivery';

export type EmailStartResult =
  | { mode: 'register'; email: string }
  | { mode: 'pending'; email: string }
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
  return apiRequest<RegistrationResult>('/api/delivery-auth/register/verify', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function getApprovalStatus(email: string) {
  return apiRequest<ApprovalStatusResult>(
    '/api/delivery-auth/approval-status',
    {
      method: 'POST',
      body: JSON.stringify({ email }),
    },
  );
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

export function updateDeliveryTransport(
  token: string,
  transport: DeliveryTransport,
) {
  return apiRequest<DeliveryProfile>(
    '/api/delivery-auth/me/transport',
    {
      method: 'PATCH',
      body: JSON.stringify({ transport }),
    },
    token,
  );
}

export function updateDeliveryRegion(token: string, region: string) {
  return apiRequest<DeliveryProfile>(
    '/api/delivery-auth/me/region',
    {
      method: 'PATCH',
      body: JSON.stringify({ region }),
    },
    token,
  );
}

export function fetchDeliveryRegions() {
  return apiRequest<{ regions: string[] }>('/api/delivery-auth/regions', {
    method: 'GET',
  });
}
