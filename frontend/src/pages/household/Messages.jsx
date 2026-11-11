import { useEffect, useRef, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { AppButton } from '../../components/shared/SharedComponents';
import { useAuth } from '../../context/AuthContext';
import { apiFetch } from '../../services/api';
import './Messages.css';

const API = '/api/conversations';
const PAGE_SIZE = 50;
const REFRESH_MS = 4000;
const dateFormat = new Intl.DateTimeFormat('fr', { dateStyle: 'short', timeStyle: 'short' });

async function readJson(url, signal) {
  const response = await apiFetch(url, { signal, cache: 'no-store' });
  if (!response.ok) throw new Error();
  return response.json();
}

function poll(refresh) {
  const controller = new AbortController();
  let timer;
  async function tick() {
    if (controller.signal.aborted) return;
    await refresh(controller.signal);
    if (!controller.signal.aborted) timer = setTimeout(tick, REFRESH_MS);
  }
  tick();
  return () => {
    clearTimeout(timer);
    controller.abort();
  };
}

function Thread({ id, userId, conversation }) {
  const [messages, setMessages] = useState(null);
  const [hasOlder, setHasOlder] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [actionError, setActionError] = useState('');
  const newest = useRef(null);
  const unreadThrough = useRef(0);
  const markedThrough = useRef(0);
  const pane = useRef(null);
  const followLatest = useRef(true);
  const [refresh, setRefresh] = useState(0);
  const url = `${API}/${id}/messages`;

  useEffect(() => poll(async (signal) => {
    try {
      const initial = newest.current === null;
      const page = await readJson(initial ? url : `${url}?after=${newest.current}`, signal);
      if (signal.aborted) return;
      if (initial) setHasOlder(page.length === PAGE_SIZE);
      const ordered = initial ? page.reverse() : page;
      if (initial || ordered.length > 0) {
        newest.current = ordered.at(-1)?.id ?? 0;
        for (const message of ordered) {
          if (message.senderId !== userId) unreadThrough.current = message.id;
        }
        setMessages((previous) => [...(previous || []), ...ordered]);
      }
      setLoadError('');
      if (document.visibilityState === 'visible' && unreadThrough.current > markedThrough.current) {
        const through = unreadThrough.current;
        const response = await apiFetch(`${API}/${id}/read/${through}`, { method: 'PUT', signal });
        if (response.ok) markedThrough.current = through;
      }
    } catch {
      if (!signal.aborted) setLoadError('Impossible d’actualiser la conversation.');
    }
  }), [id, refresh, url, userId]);

  useEffect(() => {
    if (pane.current && followLatest.current) pane.current.scrollTop = pane.current.scrollHeight;
  }, [messages]);

  async function loadOlder() {
    setLoadingOlder(true);
    setActionError('');
    followLatest.current = false;
    try {
      const older = await readJson(`${url}?before=${messages[0].id}`);
      setHasOlder(older.length === PAGE_SIZE);
      setMessages((previous) => [...older.reverse(), ...previous]);
    } catch {
      setActionError('Impossible de charger les messages précédents.');
    } finally {
      setLoadingOlder(false);
    }
  }

  async function send(event) {
    event.preventDefault();
    if (!draft.trim() || sending) return;
    setSending(true);
    setActionError('');
    try {
      const response = await apiFetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: draft.trim() }),
      });
      if (!response.ok) throw new Error();
      setDraft('');
      followLatest.current = true;
      setRefresh((previous) => previous + 1);
    } catch {
      setActionError('Le message n’a pas pu être envoyé. Réessayez.');
    } finally {
      setSending(false);
    }
  }

  return (
    <section className="chat-thread" aria-label="Conversation">
      <header>
        <h2>{conversation?.otherName || 'Conversation'}</h2>
        {conversation && <p>{conversation.householdName}</p>}
      </header>
      {loadError && <p role="alert" className="form-error">{loadError}</p>}
      <div className="chat-history" ref={pane} onScroll={(event) => {
        const element = event.currentTarget;
        followLatest.current = element.scrollHeight - element.scrollTop - element.clientHeight < 80;
      }}>
        {hasOlder && <AppButton variant="ghost" size="sm" onClick={loadOlder} disabled={loadingOlder}>Messages précédents</AppButton>}
        {!messages && !loadError && <p role="status">Chargement…</p>}
        {messages?.length === 0 && <p>Envoyez un premier message pour vous présenter.</p>}
        <ol className="chat-bubbles" aria-label="Historique des messages">
          {messages?.map((message) => (
            <li key={message.id} className={message.senderId === userId ? 'chat-mine' : ''}>
              <p>{message.body}</p>
              <time dateTime={message.sentAt}>{dateFormat.format(new Date(message.sentAt))}</time>
            </li>
          ))}
        </ol>
      </div>
      {actionError && <p role="alert" className="form-error">{actionError}</p>}
      {messages && (
        <form className="chat-compose" onSubmit={send}>
          <textarea className="app-form-textarea" rows={2} aria-label="Votre message" placeholder="Votre message…"
            maxLength={2000} value={draft} disabled={sending} onChange={(event) => setDraft(event.target.value)} />
          <AppButton type="submit" disabled={sending || !draft.trim()}>{sending ? 'Envoi…' : 'Envoyer'}</AppButton>
        </form>
      )}
    </section>
  );
}

export default function Messages() {
  const { user, loading } = useAuth();
  const { id } = useParams();
  const [inbox, setInbox] = useState(null);
  const [error, setError] = useState(false);
  const userId = Number(user?.id);

  useEffect(() => {
    if (!userId) return;
    return poll(async (signal) => {
      try {
        const conversations = await readJson(API, signal);
        if (!signal.aborted) {
          setInbox(conversations);
          setError(false);
        }
      } catch {
        if (!signal.aborted) setError(true);
      }
    });
  }, [userId]);

  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  const selected = inbox?.find((conversation) => String(conversation.id) === id);

  return (
    <main className="messages-page">
      <nav className="messages-nav" aria-label="Navigation">
        <Link to="/household/search">← Colocations</Link>
        <Link to={user.householdId || user.household_id ? '/dashboard' : '/household/join'}>
          {user.householdId || user.household_id ? 'Mon foyer' : 'Rejoindre un foyer'}
        </Link>
      </nav>
      <h1>Messages</h1>
      <div className={`messages-layout${id ? ' messages-layout-open' : ''}`}>
        <aside className="messages-inbox" aria-label="Boîte de réception">
          {error && <p role="alert">Impossible d’actualiser la boîte de réception.</p>}
          {!inbox && !error && <p role="status">Chargement…</p>}
          {inbox?.length === 0 && <p>Vos conversations apparaîtront ici.</p>}
          {inbox?.map((conversation) => (
            <Link key={conversation.id} to={`/messages/${conversation.id}`}
              aria-current={conversation.id === selected?.id ? 'page' : undefined} className="messages-inbox-item">
              <span><strong>{conversation.otherName}</strong>
                {conversation.unread > 0 && <span className="messages-unread" aria-label={`${conversation.unread} non lus`}>{conversation.unread}</span>}
              </span>
              <small>{conversation.householdName}</small>
              <span className="messages-preview">{conversation.lastMessage || 'Nouvelle conversation'}</span>
            </Link>
          ))}
        </aside>
        {id ? (
          <div className="messages-active">
            <Link className="messages-back" to="/messages">← Boîte de réception</Link>
            <Thread key={`${userId}/${id}`} id={id} userId={userId} conversation={selected} />
          </div>
        ) : <p className="messages-empty">Sélectionnez une conversation ou contactez un foyer depuis une annonce.</p>}
      </div>
    </main>
  );
}
