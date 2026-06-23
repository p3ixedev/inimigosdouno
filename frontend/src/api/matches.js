// API client for Inimigos do Uno
// Works against:
//  - FastAPI backend at REACT_APP_BACKEND_URL/api (Emergent preview / local dev)
//  - Vercel serverless functions at /api (production on Vercel)
//
// If REACT_APP_BACKEND_URL is empty (typical Vercel deploy), we hit "/api"
// relative to the current origin.

import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';
const API_BASE = `${BACKEND_URL}/api`;

const client = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

export async function fetchMatches() {
  const { data } = await client.get('/matches');
  return Array.isArray(data) ? data : [];
}

export async function createMatch(payload) {
  const { data } = await client.post('/matches', payload);
  return data;
}

export async function deleteMatch(id) {
  await client.delete(`/matches/${id}`);
}
