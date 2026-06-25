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
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const db = await getDb();
  const salas = db.collection('salas');

  // GET: busca info da sala
  if (req.method === 'GET') {
    const { codigo } = req.query;
    const sala = await salas.findOne({ codigo: codigo?.toUpperCase() });
    if (!sala) return res.status(404).json({ error: 'Sala não encontrada' });
    return res.status(200).json({ sala });
  }

  // POST: entra na sala
  if (req.method === 'POST') {
    try {
      const { codigo, jogadorId, jogadorNome } = req.body;
      if (!codigo || !jogadorId) return res.status(400).json({ error: 'Dados incompletos' });

      const sala = await salas.findOne({ codigo: codigo.toUpperCase() });
      if (!sala) return res.status(404).json({ error: 'Sala não encontrada' });
      if (sala.fase !== 'lobby') return res.status(400).json({ error: 'Jogo já iniciado' });
      if (sala.jogadores.length >= 5) return res.status(400).json({ error: 'Sala cheia' });

      const jaEsta = sala.jogadores.find((j) => j.id === jogadorId);
      if (!jaEsta) {
        await salas.updateOne(
          { codigo: codigo.toUpperCase() },
          { $push: { jogadores: { id: jogadorId, nome: jogadorNome, pronto: false } } }
        );
      }

      const salaAtualizada = await salas.findOne({ codigo: codigo.toUpperCase() });

      // Notifica todos via Pusher
      await pusher.trigger(`sala-${codigo.toUpperCase()}`, 'jogador-entrou', {
        jogadores: salaAtualizada.jogadores,
      });

      return res.status(200).json({ sala: salaAtualizada });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ error: e.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
};