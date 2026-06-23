// Vercel Serverless Function: GET / POST /api/matches
// Mirrors the FastAPI backend used in the Emergent preview.
//
// Env vars required on Vercel:
//   MONGODB_URI  -> your MongoDB Atlas connection string
//   DB_NAME      -> default: "inimigos_do_uno"

import { MongoClient } from 'mongodb';
import { randomUUID } from 'crypto';

const uri = process.env.MONGODB_URI;
const dbName = process.env.DB_NAME || 'inimigos_do_uno';

// Cache the client across invocations (Vercel cold start optimisation)
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
  // CORS (Vercel will serve the SPA from the same domain, but allow anyway)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    const db = await getDb();
    const col = db.collection('matches');

    if (req.method === 'GET') {
      const docs = await col
        .find({}, { projection: { _id: 0 } })
        .sort({ ts: -1 })
        .limit(2000)
        .toArray();
      return res.status(200).json(docs);
    }

    if (req.method === 'POST') {
      const body = req.body || {};
      const played = body.played || [];
      const winners = body.winners || [];
      const note = body.note || null;

      if (!Array.isArray(played) || played.length < 2) {
        return res.status(400).json({ error: 'At least 2 players required' });
      }
      if (!Array.isArray(winners) || winners.length === 0) {
        return res.status(400).json({ error: 'At least 1 winner required' });
      }
      for (const w of winners) {
        if (!played.includes(w)) {
          return res.status(400).json({ error: 'Winners must be in played list' });
        }
      }

      const match = {
        id: randomUUID(),
        played,
        winners,
        note,
        ts: body.ts || Date.now(),
      };
      await col.insertOne(match);
      return res.status(200).json(match);
    }

    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('matches handler error:', err);
    return res.status(500).json({ error: 'internal_error', message: err.message });
  }
}
