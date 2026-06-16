import { apiUrl } from '../config/api';

export async function pingSiteActivity() {
  try {
    await fetch(apiUrl('/api/activity/ping'), {
      method: 'GET',
      cache: 'no-store',
    });
  } catch {
    // Activity ping xatosi UI ni to'xtatmasligi kerak.
  }
}
