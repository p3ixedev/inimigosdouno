import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LogOut, Plus, ArrowRight, Home, Sparkles, Users, KeyRound,
  Copy, Check, Shield, Zap, Trophy, Radio,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { PLAYERS, COLOR_STYLES } from '../data/players';
import UnoChip from '../components/UnoChip';
import './Jogo.css';

/* ============================================================
 * API CALLS - mantidas 100% iguais ao original
 * ============================================================ */
async function apiCriar(criadorId, criadorNome) {
  const res = await fetch('/api/jogo/criar', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ criadorId, criadorNome }),
  });
  if (!res.ok) throw new Error((await res.json()).error);
  return res.json();
}

async function apiEntrar(codigo, jogadorId, jogadorNome) {
  const res = await fetch('/api/jogo/entrar', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ codigo, jogadorId, jogadorNome }),
  });
  if (!res.ok) throw new Error((await res.json()).error);
  return res.json();
}

/* ============================================================
 * COMPONENTE PRINCIPAL - Lobby Premium
 * ============================================================ */
export default function Jogo() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [codigo, setCodigo] = useState('');
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);
  const [aba, setAba] = useState('criar');
  const [copied, setCopied] = useState(false);

  const playerData = useMemo(
    () => PLAYERS.find((p) => p.id === user?.id),
    [user?.id]
  );

  // Refs para efeito de tilt suave nos cards principais
  const criarCardRef = useRef(null);
  const entrarCardRef = useRef(null);

  useEffect(() => {
    const cards = [criarCardRef.current, entrarCardRef.current].filter(Boolean);
    const handlers = cards.map((card) => {
      const onMove = (e) => {
        const rect = card.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width;
        const y = (e.clientY - rect.top) / rect.height;
        card.style.setProperty('--mx', `${x * 100}%`);
        card.style.setProperty('--my', `${y * 100}%`);
      };
      const onLeave = () => {
        card.style.setProperty('--mx', `50%`);
        card.style.setProperty('--my', `50%`);
      };
      card.addEventListener('mousemove', onMove);
      card.addEventListener('mouseleave', onLeave);
      return { card, onMove, onLeave };
    });
    return () => {
      handlers.forEach(({ card, onMove, onLeave }) => {
        card.removeEventListener('mousemove', onMove);
        card.removeEventListener('mouseleave', onLeave);
      });
    };
  }, []);

  async function criarSala() {
    setErro('');
    setLoading(true);
    try {
      const { codigo: cod } = await apiCriar(user.id, user.name);
      navigate(`/jogo/${cod}`);
    } catch (e) {
      setErro(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function entrarSala() {
    if (codigo.trim().length < 4) return setErro('Código inválido');
    setErro('');
    setLoading(true);
    try {
      await apiEntrar(codigo.trim().toUpperCase(), user.id, user.name);
      navigate(`/jogo/${codigo.trim().toUpperCase()}`);
    } catch (e) {
      setErro(e.message);
    } finally {
      setLoading(false);
    }
  }

  // Sanitiza input do código (apenas letras/números, uppercase)
  const onCodigoChange = (e) => {
    const v = e.target.value.replace(/[^A-Z0-9]/gi, '').toUpperCase().slice(0, 4);
    setCodigo(v);
    if (erro) setErro('');
  };

  const digits = codigo.padEnd(4, ' ').split('');
  const initials = (user?.name || '?').slice(0, 1).toUpperCase();

  return (
    <div className="lobby-root">
      {/* ========== ATMOSFERA DE FUNDO ========== */}
      <div className="lobby-ambient">
        <div className="lobby-ambient__grid" />
        <div className="lobby-ambient__glow lobby-ambient__glow--red" />
        <div className="lobby-ambient__glow lobby-ambient__glow--blue" />
        <div className="lobby-ambient__glow lobby-ambient__glow--gold" />
        <div className="lobby-ambient__vignette" />
      </div>

      {/* ========== TOPBAR ========== */}
      <header className="lobby-topbar">
        <button
          onClick={() => navigate('/')}
          className="lobby-chip lobby-chip--ghost"
          aria-label="Voltar ao início"
        >
          <Home className="h-3.5 w-3.5" />
          <span>Início</span>
        </button>

        <div className="lobby-brand">
          <span className="lobby-brand__dot" />
          <span className="lobby-brand__label">Lobby · Multiplayer</span>
        </div>

        <button
          onClick={() => { logout(); navigate('/entrar'); }}
          className="lobby-chip lobby-chip--ghost lobby-chip--danger"
          aria-label="Sair"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span>Sair</span>
        </button>
      </header>

      {/* ========== CONTEÚDO ========== */}
      <main className="lobby-main">
        {/* ---------- PERFIL HERO ---------- */}
        <motion.section
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="lobby-profile"
        >
          <div className="lobby-profile__aura" />

          <div className="lobby-profile__avatar-wrap">
            <div className="lobby-profile__ring" />
            {playerData ? (
              <UnoChip color={playerData.color} label={initials} />
            ) : (
              <div className="lobby-profile__avatar-fallback">{initials}</div>
            )}
            <span className="lobby-profile__status" title="Online">
              <span className="lobby-profile__status-dot" />
            </span>
          </div>

          <div className="lobby-profile__info">
            <p className="lobby-profile__eyebrow">
              <Sparkles className="h-3 w-3" />
              Bem-vindo de volta
            </p>
            <h1 className="lobby-profile__name" translate="no">
              {user?.name || 'Jogador'}
            </h1>
            <div className="lobby-profile__meta">
              <span className="lobby-profile__badge">
                <Shield className="h-3 w-3" />
                Membro do Grupo
              </span>
              <span className="lobby-profile__separator" />
              <span className="lobby-profile__live">
                <Radio className="h-3 w-3" />
                Conectado
              </span>
            </div>
          </div>

          <button
            onClick={() => navigate('/perfil')}
            className="lobby-profile__cta"
          >
            Ver perfil
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </motion.section>

        {/* ---------- SEÇÃO: AÇÃO PRINCIPAL ---------- */}
        <div className="lobby-section-head">
          <span className="lobby-section-head__line" />
          <h2 className="lobby-section-head__title">Como você quer jogar?</h2>
          <span className="lobby-section-head__line" />
        </div>

        <div className="lobby-actions">
          {/* ===== CARD: CRIAR SALA ===== */}
          <motion.article
            ref={criarCardRef}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className={`lobby-card lobby-card--create ${aba === 'criar' ? 'is-active' : ''}`}
            onClick={() => setAba('criar')}
            role="button"
            tabIndex={0}
          >
            <div className="lobby-card__spotlight" />
            <div className="lobby-card__grain" />

            <header className="lobby-card__head">
              <div className="lobby-card__icon lobby-card__icon--red">
                <Plus className="h-5 w-5" strokeWidth={2.5} />
              </div>
              <div className="lobby-card__badges">
                <span className="lobby-card__tag lobby-card__tag--live">
                  <span className="lobby-card__tag-dot" />
                  Instantâneo
                </span>
              </div>
            </header>

            <div className="lobby-card__body">
              <p className="lobby-card__kicker">Anfitrião</p>
              <h3 className="lobby-card__title">Criar nova sala</h3>
              <p className="lobby-card__desc">
                Abra uma partida e receba um código de 4 dígitos para enviar aos
                seus amigos. Você é o anfitrião.
              </p>

              <ul className="lobby-card__features">
                <li><Zap className="h-3.5 w-3.5" /> Código exclusivo em segundos</li>
                <li><Users className="h-3.5 w-3.5" /> Até 6 jogadores por mesa</li>
                <li><Trophy className="h-3.5 w-3.5" /> Registra vitória no placar</li>
              </ul>
            </div>

            <footer className="lobby-card__foot">
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={(e) => { e.stopPropagation(); criarSala(); }}
                disabled={loading}
                className="lobby-btn lobby-btn--primary"
              >
                <span className="lobby-btn__glow" />
                <span className="lobby-btn__content">
                  {loading && aba === 'criar' ? (
                    <>
                      <span className="lobby-btn__spinner" />
                      Criando sala...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4" strokeWidth={2.5} />
                      Criar sala agora
                    </>
                  )}
                </span>
              </motion.button>
            </footer>
          </motion.article>

          {/* ===== CARD: ENTRAR EM SALA ===== */}
          <motion.article
            ref={entrarCardRef}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className={`lobby-card lobby-card--join ${aba === 'entrar' ? 'is-active' : ''}`}
            onClick={() => setAba('entrar')}
            role="button"
            tabIndex={0}
          >
            <div className="lobby-card__spotlight" />
            <div className="lobby-card__grain" />

            <header className="lobby-card__head">
              <div className="lobby-card__icon lobby-card__icon--blue">
                <KeyRound className="h-5 w-5" strokeWidth={2.5} />
              </div>
              <div className="lobby-card__badges">
                <span className="lobby-card__tag">
                  <Users className="h-3 w-3" />
                  Convidado
                </span>
              </div>
            </header>

            <div className="lobby-card__body">
              <p className="lobby-card__kicker">Convite</p>
              <h3 className="lobby-card__title">Entrar em sala</h3>
              <p className="lobby-card__desc">
                Recebeu um código? Digite as 4 letras abaixo e entre direto na
                mesa dos seus amigos.
              </p>

              {/* Input pin-style de 4 dígitos */}
              <div
                className="lobby-pin"
                onClick={(e) => {
                  e.stopPropagation();
                  const input = e.currentTarget.querySelector('input');
                  input?.focus();
                }}
              >
                {digits.map((d, i) => (
                  <div
                    key={i}
                    className={`lobby-pin__slot ${d.trim() ? 'is-filled' : ''} ${
                      i === codigo.length && aba === 'entrar' ? 'is-cursor' : ''
                    }`}
                  >
                    {d.trim() || ''}
                  </div>
                ))}
                <input
                  type="text"
                  value={codigo}
                  onChange={onCodigoChange}
                  onFocus={() => setAba('entrar')}
                  maxLength={4}
                  className="lobby-pin__input"
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck="false"
                  aria-label="Código da sala"
                />
              </div>
            </div>

            <footer className="lobby-card__foot">
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={(e) => { e.stopPropagation(); entrarSala(); }}
                disabled={loading || codigo.length < 4}
                className="lobby-btn lobby-btn--secondary"
              >
                <span className="lobby-btn__glow" />
                <span className="lobby-btn__content">
                  {loading && aba === 'entrar' ? (
                    <>
                      <span className="lobby-btn__spinner" />
                      Entrando...
                    </>
                  ) : (
                    <>
                      Entrar na sala
                      <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
                    </>
                  )}
                </span>
              </motion.button>
            </footer>
          </motion.article>
        </div>

        {/* ---------- ERRO ---------- */}
        <AnimatePresence>
          {erro && (
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              className="lobby-error"
              role="alert"
            >
              <span className="lobby-error__icon">!</span>
              <span>{erro}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ---------- GRUPO / JOGADORES ---------- */}
        <section className="lobby-group">
          <div className="lobby-section-head lobby-section-head--left">
            <h2 className="lobby-section-head__title">Grupo · Inimigos do Uno</h2>
            <span className="lobby-section-head__count">
              {PLAYERS.length} jogadores
            </span>
          </div>

          <div className="lobby-group__grid">
            {PLAYERS.map((p, i) => {
              const isYou = p.id === user?.id;
              return (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 + i * 0.04 }}
                  className={`lobby-player ${isYou ? 'is-you' : ''}`}
                >
                  <div className="lobby-player__avatar">
                    <UnoChip color={p.color} label={p.name[0]} sm />
                  </div>
                  <div className="lobby-player__info">
                    <p className="lobby-player__name" translate="no">
                      {p.name}
                    </p>
                    <p className="lobby-player__meta">
                      {isYou ? 'Você' : 'Membro'}
                    </p>
                  </div>
                  <span className={`lobby-player__dot lobby-player__dot--${p.color}`} />
                </motion.div>
              );
            })}
          </div>
        </section>

        <footer className="lobby-footer">
          <span>Inimigos do Uno</span>
          <span className="lobby-footer__sep">·</span>
          <span>Desenvolvido por <strong>Peixe</strong></span>
        </footer>
      </main>
    </div>
  );
}
