const Pusher = require('pusher');
const { MongoClient } = require('mongodb');
const {
  criarEstadoInicial,
  processarJogada,
  comprarCarta,
  escolherCor,
  acaoZero,
  declararUno,
} = require('./jogoLogica');

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
    const { codigo, jogadorId, acao, dados } = req.body;
    if (!codigo || !jogadorId || !acao) return res.status(400).json({ error: 'Dados incompletos' });

    const db = await getDb();
    const salas = db.collection('salas');
    const sala = await salas.findOne({ codigo: codigo.toUpperCase() });
    if (!sala) return res.status(404).json({ error: 'Sala não encontrada' });

    let novoEstado = sala.estado;
    let evento = '';
    let payload = {};

    switch (acao) {
      case 'iniciar': {
        if (sala.criadorId !== jogadorId) return res.status(403).json({ error: 'Apenas o criador pode iniciar' });
        if (sala.jogadores.length < 2) return res.status(400).json({ error: 'Mínimo 2 jogadores' });
        const ids = sala.jogadores.map((j) => j.id);
        novoEstado = criarEstadoInicial(ids);
        await salas.updateOne({ codigo: codigo.toUpperCase() }, { $set: { estado: novoEstado, fase: 'jogando' } });
        evento = 'jogo-iniciado';
        payload = { estado: novoEstado };
        break;
      }

      case 'jogar': {
        const resultado = processarJogada(novoEstado, jogadorId, dados.cartas, dados.corEscolhida);
        if (resultado.erro) return res.status(400).json({ error: resultado.erro });
        novoEstado = resultado;
        await salas.updateOne({ codigo: codigo.toUpperCase() }, { $set: { estado: novoEstado } });
        evento = 'estado-atualizado';
        payload = { estado: novoEstado };
        break;
      }

      case 'comprar': {
        const resultado = comprarCarta(novoEstado, jogadorId);
        if (resultado.erro) return res.status(400).json({ error: resultado.erro });
        novoEstado = resultado;
        await salas.updateOne({ codigo: codigo.toUpperCase() }, { $set: { estado: novoEstado } });
        evento = 'estado-atualizado';
        payload = { estado: novoEstado };
        break;
      }

      case 'escolherCor': {
        const resultado = escolherCor(novoEstado, jogadorId, dados.cor);
        if (resultado.erro) return res.status(400).json({ error: resultado.erro });
        novoEstado = resultado;
        await salas.updateOne({ codigo: codigo.toUpperCase() }, { $set: { estado: novoEstado } });
        evento = 'estado-atualizado';
        payload = { estado: novoEstado };
        break;
      }

      case 'acaoZero': {
        const resultado = acaoZero(novoEstado, jogadorId, dados.acao, dados.alvoId);
        if (resultado.erro) return res.status(400).json({ error: resultado.erro });
        novoEstado = resultado;
        await salas.updateOne({ codigo: codigo.toUpperCase() }, { $set: { estado: novoEstado } });
        evento = 'estado-atualizado';
        payload = { estado: novoEstado, acaoZeroInfo: { acao: dados.acao, alvoId: dados.alvoId } };
        break;
      }

      case 'passar': {
        // Passa a vez apos comprar carta que nao pode jogar
        if (novoEstado.turnoAtual !== jogadorId) return res.status(400).json({ error: 'Nao e sua vez!' });
        novoEstado = {
          ...novoEstado,
          turnoAtual: novoEstado.jogadores[
            (novoEstado.jogadores.indexOf(jogadorId) + (novoEstado.ordem === 'normal' ? 1 : -1) + novoEstado.jogadores.length) % novoEstado.jogadores.length
          ],
          cartaCompradaJogavel: null,
        };
        await salas.updateOne({ codigo: codigo.toUpperCase() }, { $set: { estado: novoEstado } });
        evento = 'estado-atualizado';
        payload = { estado: novoEstado };
        break;
      }

      case 'chat': {
        if (!dados.texto) return res.status(400).json({ error: 'Texto vazio' });
        await pusher.trigger(`sala-${codigo.toUpperCase()}`, 'chat-mensagem', {
          jogadorId,
          texto: dados.texto,
        });
        return res.status(200).json({ ok: true });
      }

      case 'uno': {
        novoEstado = declararUno(novoEstado, jogadorId);
        await salas.updateOne({ codigo: codigo.toUpperCase() }, { $set: { estado: novoEstado } });
        evento = 'uno-declarado';
        payload = { jogadorId, estado: novoEstado };
        break;
      }

      default:
        return res.status(400).json({ error: 'Ação desconhecida' });
    }

    await pusher.trigger(`sala-${codigo.toUpperCase()}`, evento, payload);
    return res.status(200).json({ estado: novoEstado });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: e.message });
  }
};