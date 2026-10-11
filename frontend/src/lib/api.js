// Base URL of the backend (../backend). Empty in development: Vite proxies /api to it.
// For production builds set VITE_API_URL, e.g. https://purva-eye-care-api.onrender.com
export const API_URL = (import.meta.env.VITE_API_URL ?? '').replace(/\/+$/, '')
