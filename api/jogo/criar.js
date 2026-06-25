const Pusher = require('pusher');
const { MongoClient } = require('mongodb');

const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID,
  key: process.env.PUSHER_KEY,
  secret: process.env.PUSHER_SECRET,
  cluster: process.env.PUSHER_CLUSTER,
  useTLS: true,
});

let client;
async function getDb() {
  if (!client) {
    client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
  }
  return client.db(process.env.DB_NAME);
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { criadorId, criadorNome } = req.body;
    if (!criadorId) return res.status(400).json({ error: 'criadorId obrigatório' });

    const db = await getDb();
    const salas = db.collection('salas');

    // Gera código de sala de 4 letras
    const codigo = Math.random().toString(36).substring(2, 6).toUpperCase();

    const sala = {
      codigo,
      criadorId,
      jogadores: [{ id: criadorId, nome: criadorNome, pronto: false }],
      estado: null,
      fase: 'lobby', // lobby | jogando | fim
      criadoEm: Date.now(),
    };

    await salas.insertOne(sala);

    return res.status(200).json({ codigo, sala });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: e.message });
  }
};