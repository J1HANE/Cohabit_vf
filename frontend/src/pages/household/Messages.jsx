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
  if (response.status === 204) return null;
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

function Thread({ endpoint, userId, conversation, group }) {
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
  const url = `${endpoint}/messages`;

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
          if (group || message.senderId !== userId) unreadThrough.current = message.id;
        }
        setMessages((previous) => [...(previous || []), ...ordered]);
      }
      setLoadError('');
      if (document.visibilityState === 'visible' && unreadThrough.current > markedThrough.current) {
        const through = unreadThrough.current;
        const response = await apiFetch(`${endpoint}/read/${through}`, { method: 'PUT', signal });
        if (response.ok) markedThrough.current = through;
      }
    } catch {
      if (!signal.aborted) setLoadError('Impossible d’actualiser la conversation.');
    }
  }), [endpoint, group, refresh, url, userId]);

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
        <h2>{group ? 'Chat du foyer' : conversation?.otherName || 'Conversation'}</h2>
        {conversation && <p>{conversation.householdName}</p>}
      </header>
      {loadError && <p role="alert" className="form-error">{loadError}</p>}
      <div className="chat-history" ref={pane} onScroll={(event) => {
        const element = event.currentTarget;
        followLatest.current = element.scrollHeight - element.scrollTop - element.clientHeight < 80;
      }}>
        {hasOlder && <AppButton variant="ghost" size="sm" onClick={loadOlder} disabled={loadingOlder}>Messages précédents</AppButton>}
        {!messages && !loadError && <p role="status">Chargement…</p>}
        {messages?.length === 0 && <p>Envoyez le premier message.</p>}
        <ol className="chat-bubbles" aria-label="Historique des messages">
          {messages?.map((message) => (
            <li key={message.id} className={message.senderId === userId ? 'chat-mine' : ''}>
              {group && <strong className="chat-sender">{message.senderId === userId ? 'Vous' : message.senderName}</strong>}
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

function InboxItem({ to, title, conversation, selected, fallback }) {
  return (
    <Link to={to} aria-current={selected ? 'page' : undefined} className="messages-inbox-item">
      <span>
        <strong>{title}</strong>
        {conversation.unread > 0 && (
          <span className="messages-unread" aria-label={`${conversation.unread} non lus`}>{conversation.unread}</span>
        )}
      </span>
      <small>{conversation.householdName}</small>
      <span className="messages-preview">{conversation.lastMessage || fallback}</span>
    </Link>
  );
}

export default function Messages() {
  const { user, loading } = useAuth();
  const { id } = useParams();
  const [inbox, setInbox] = useState(null);
  const [room, setRoom] = useState(undefined);
  const [error, setError] = useState(false);
  const [roomError, setRoomError] = useState(false);
  const userId = Number(user?.id);

  useEffect(() => {
    if (!userId) return;
    return poll(async (signal) => {
      const [inboxResult, roomResult] = await Promise.allSettled([
        readJson(API, signal),
        readJson(`${API}/household`, signal),
      ]);
      if (signal.aborted) return;
      setError(inboxResult.status === 'rejected');
      setRoomError(roomResult.status === 'rejected');
      if (inboxResult.status === 'fulfilled') setInbox(inboxResult.value);
      if (roomResult.status === 'fulfilled') setRoom(roomResult.value);
    });
  }, [userId]);

  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  const group = id === 'foyer';
  const selected = group ? room : inbox?.find((conversation) => String(conversation.id) === id);
  const endpoint = group ? `${API}/household/${room?.householdId}` : `${API}/${id}`;

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
          {roomError && <p role="alert">Impossible d’actualiser le chat du foyer.</p>}
          {!inbox && !error && <p role="status">Chargement…</p>}
          {inbox?.length === 0 && room === null && <p>Vos conversations apparaîtront ici.</p>}
          {room && <InboxItem to="/messages/foyer" title="Chat du foyer" conversation={room}
            selected={group} fallback="Commencer la discussion" />}
          {inbox?.map((conversation) => (
            <InboxItem key={conversation.id} to={`/messages/${conversation.id}`} title={conversation.otherName}
              conversation={conversation} selected={!group && conversation.id === selected?.id}
              fallback="Nouvelle conversation" />
          ))}
        </aside>
        {id ? (
          <div className="messages-active">
            <Link className="messages-back" to="/messages">← Boîte de réception</Link>
            {group && !room ? (
              <p className="messages-room-status" role="status">
                {roomError ? 'Impossible de charger le chat du foyer.' : room === null
                  ? 'Ce salon est réservé aux membres du foyer.' : 'Chargement du chat du foyer…'}
              </p>
            ) : (
              <Thread key={`${userId}/${endpoint}`} endpoint={endpoint} userId={userId}
                conversation={selected} group={group} />
            )}
          </div>
        ) : <p className="messages-empty">Sélectionnez une conversation ou contactez un foyer depuis une annonce.</p>}
      </div>
    </main>
  );
}
