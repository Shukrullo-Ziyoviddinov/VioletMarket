/** API bazaviy URL (oxirida / bo‘lmasin). CRA: .env da REACT_APP_API_BASE_URL */
export function getApiBaseUrl() {
  const raw = (process.env.REACT_APP_API_BASE_URL || "http://localhost:3001").trim();
  return raw.replace(/\/+$/, "");
}

export function apiUrl(path) {
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${getApiBaseUrl()}${p}`;
}
