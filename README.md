# Inimigos do Uno - Placar Oficial

Site do grupo "Inimigos do Uno" para registrar partidas, ver ranking, pódio, rivalidades, gráfico e histórico.

- **Frontend**: React (Create React App) + Tailwind + Framer Motion + Recharts + shadcn/ui
- **Backend (preview Emergent)**: FastAPI + MongoDB local em `backend/server.py`
- **Backend (produção)**: Vercel Serverless Functions (Node.js) em `api/` + MongoDB Atlas
- **Jogadores**: Emanuel, Renan, Stephane, Jacyane, Mayara
- **Desenvolvido por**: Peixe

O frontend usa a mesma API em ambos os ambientes (`/api/matches`), então nenhuma mudança de código é necessária ao migrar.

---

## Estrutura

```
/app
├── frontend/              # React app (deploy estático na Vercel)
│   └── src/
│       ├── pages/Home.jsx
│       ├── components/    # UnoChip, FloatingCards, Podium, ui/*
│       ├── data/players.js
│       └── api/matches.js # cliente axios -> /api/matches
├── backend/               # FastAPI (Emergent preview)
│   └── server.py          # GET/POST/DELETE /api/matches
├── api/                   # Vercel serverless functions (Node)
│   ├── matches/
│   │   ├── index.js       # GET, POST  /api/matches
│   │   └── [id].js        # DELETE     /api/matches/:id
│   └── package.json
├── vercel.json            # build config + rewrites
└── .env.vercel.example    # variáveis de ambiente para a Vercel
```

---

## Rotas da API (idênticas em FastAPI e Vercel)

| Método  | Path                  | Body                                      | Retorno              |
|---------|-----------------------|-------------------------------------------|----------------------|
| GET     | `/api/matches`        | —                                         | `Match[]`            |
| POST    | `/api/matches`        | `{ played, winners, note?, ts? }`         | `Match` criado       |
| DELETE  | `/api/matches/:id`    | —                                         | `{ deleted: 1 }`     |

**Modelo `Match`:**
```ts
{
  id: string,          // uuid
  played: string[],    // ids dos jogadores que jogaram
  winners: string[],   // ids dos vencedores (subset de played)
  note: string | null,
  ts: number           // epoch ms
}
```

IDs dos jogadores: `emanuel`, `jacyane`, `mayara`, `renan`, `stephane`.

---

## Deploy na Vercel + MongoDB Atlas

### 1) MongoDB Atlas

1. Crie um cluster gratuito em https://www.mongodb.com/cloud/atlas
2. Em **Database Access**, crie um usuário com senha (anote a senha)
3. Em **Network Access**, libere `0.0.0.0/0` (ou os IPs da Vercel)
4. Copie a **connection string** ("Connect → Drivers"), ex:
   ```
   mongodb+srv://USER:<db_password>@cluster0.ribgctn.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
   ```
   ⚠️ Substitua `<db_password>` pela senha real do usuário.

### 2) Deploy na Vercel

1. Faça push do repositório no GitHub/GitLab.
2. Em https://vercel.com, **"Add New Project"** e selecione o repo.
3. Em **Build & Development Settings**, deixe os defaults (o `vercel.json` na raiz já cuida disso).
4. Em **Environment Variables**, adicione:
   - `MONGODB_URI` = sua connection string completa (com a senha real)
   - `DB_NAME` = `inimigos_do_uno`
5. Clique em **Deploy**.

A Vercel vai:
- Buildar o React (`yarn build` em `frontend/`) e servir como SPA estática.
- Detectar `api/**/*.js` e expô-los como funções serverless em `/api/...`.
- O frontend, sem `REACT_APP_BACKEND_URL` definido, chama `/api/matches` no mesmo domínio.

### 3) (Opcional) Build local pra testar

```bash
cd frontend
yarn install
yarn build
```

---

## Desenvolvimento local (Emergent preview)

Aqui no preview Emergent o backend roda em FastAPI:

- `backend/server.py` expõe as mesmas rotas em `/api/matches`
- MongoDB local via `MONGO_URL` em `backend/.env`
- Frontend usa `REACT_APP_BACKEND_URL` em `frontend/.env`

Para reiniciar serviços:
```bash
sudo supervisorctl restart backend
sudo supervisorctl restart frontend
```

---

## Customização

- **Jogadores e cores**: `frontend/src/data/players.js`
- **Animações flutuantes**: `frontend/src/components/FloatingCards.jsx`
- **Cores do tema**: `frontend/src/App.css` (variáveis OKLCH)
