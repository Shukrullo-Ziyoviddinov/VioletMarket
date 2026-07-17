import {
  ImageManipulator,
  SaveFormat,
} from 'expo-image-manipulator';

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

export async function completeRegistration(payload: RegistrationPayload) {
  const imageRef = await ImageManipulator.manipulate(payload.photoUri)
    .resize({ width: 720 })
    .renderAsync();
  const photo = await imageRef.saveAsync({
    base64: true,
    compress: 0.6,
    format: SaveFormat.JPEG,
  });
  if (!photo.base64) {
    throw new Error('Profil rasmini tayyorlab bo‘lmadi. Qayta surat oling.');
  }

  return apiRequest<AuthResult>('/api/delivery-auth/register/verify', {
    method: 'POST',
    body: JSON.stringify({
      email: payload.email,
      code: payload.code,
      firstName: payload.firstName,
      lastName: payload.lastName,
      phone: payload.phone,
      photoBase64: photo.base64,
      photoMimeType: 'image/jpeg',
    }),
  });
}

export function getDeliveryProfile(token: string) {
  return apiRequest<DeliveryProfile>(
    '/api/delivery-auth/me',
    { method: 'GET' },
    token,
  );
}
