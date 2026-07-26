import { apiRequest } from '@/services/api';
import type {
  ApprovalStatusResult,
  AuthResult,
  LogisticaCountry,
  LogisticaProfile,
  OtpMeta,
  RegistrationResult,
} from '@/types/logistica';

export type RegistrationPayload = {
  email: string;
  code: string;
  companyName: string;
  logisticaCountry: LogisticaCountry;
};

export function sendRegistrationCode(payload: {
  email: string;
  companyName: string;
  logisticaCountry: LogisticaCountry;
}) {
  return apiRequest<OtpMeta & {
    companyName: string;
    logisticaCountry: LogisticaCountry;
  }>('/api/logistica-auth/register/send-code', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function completeRegistration(payload: RegistrationPayload) {
  return apiRequest<RegistrationResult>('/api/logistica-auth/register/verify', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function sendLoginCode(email: string) {
  return apiRequest<OtpMeta>('/api/logistica-auth/login/send-code', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

export function verifyLogin(email: string, code: string) {
  return apiRequest<AuthResult>('/api/logistica-auth/login/verify', {
    method: 'POST',
    body: JSON.stringify({ email, code }),
  });
}

export function getApprovalStatus(email: string) {
  return apiRequest<ApprovalStatusResult>('/api/logistica-auth/approval-status', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

export function getLogisticaProfile(token: string) {
  return apiRequest<LogisticaProfile>(
    '/api/logistica-auth/me',
    { method: 'GET' },
    token,
  );
}
