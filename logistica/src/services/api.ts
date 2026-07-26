import { env } from '@/config/env';

type ApiEnvelope<T> = {
  ok: boolean;
  data: T;
  message?: string;
  code?: string;
  details?: unknown;
};

export class ApiError extends Error {
  code?: string;
  status: number;
  details?: unknown;

  constructor(status: number, message: string, code?: string, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
  token?: string | null,
) {
  const headers = new Headers(options.headers);

  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  let response: Response;
  try {
    response = await fetch(`${env.apiUrl}${path}`, {
      ...options,
      headers,
    });
  } catch {
    throw new ApiError(
      0,
      'Server bilan aloqa bo‘lmadi. Internetni tekshiring.',
      'NETWORK_ERROR',
    );
  }

  const payload = (await response.json().catch(() => null)) as ApiEnvelope<T> | null;
  if (!response.ok || !payload?.ok) {
    throw new ApiError(
      response.status,
      payload?.message || 'Server so‘rovni bajara olmadi',
      payload?.code,
      payload?.details,
    );
  }

  return payload.data;
}
