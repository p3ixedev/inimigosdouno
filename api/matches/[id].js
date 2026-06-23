// Vercel Serverless Function: DELETE /api/matches/[id]

import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;
const dbName = process.env.DB_NAME || 'inimigos_do_uno';

let cachedClient = null;
async function getDb() {
  if (cachedClient) return cachedClient.db(dbName);
  if (!uri) throw new Error('MONGODB_URI env var is missing');
  const client = new MongoClient(uri, { maxPoolSize: 5 });
  await client.connect();
  cachedClient = client;
  return client.db(dbName);
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();

  if (req.method !== 'DELETE') {
    res.setHeader('Allow', 'DELETE');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { id } = req.query;
    if (!id) return res.status(400).json({ error: 'id required' });
    const db = await getDb();
    const result = await db.collection('matches').deleteOne({ id });
    return res.status(200).json({ deleted: result.deletedCount });
  } catch (err) {
    console.error('delete handler error:', err);
    return res.status(500).json({ error: 'internal_error', message: err.message });
  }
}
