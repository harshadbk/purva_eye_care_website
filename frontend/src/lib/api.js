// Base URL of the backend (../backend). Empty in development: Vite proxies /api to it.
// Production builds default to the hosted API; override with VITE_API_URL if needed.
const PRODUCTION_API_URL = 'https://api.purvaeyecare.online'

export const API_URL = (import.meta.env.VITE_API_URL ?? (import.meta.env.PROD ? PRODUCTION_API_URL : '')).replace(/\/+$/, '')
