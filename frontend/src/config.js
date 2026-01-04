// API Configuration
// PaperScope API backend
// For local development: set VITE_API_BASE_URL=http://localhost:4000 in .env
// For production: defaults to deployed GCP backend
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://paperscope-api-ahrq6r24nq-uc.a.run.app'
