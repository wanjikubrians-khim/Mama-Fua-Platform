'use client';
// Mama Fua — Chat Panel
// KhimTech | 2026

import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { X, Send, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { bookingApi } from '@/lib/api';
import { io, Socket } from 'socket.io-client';

interface Props {
  bookingId: string;
  onClose: () => void;
}

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  body: string | null;
  mediaUrl?: string | null;
  createdAt: string;
}

export default function ChatPanel({ bookingId, onClose }: Props) {
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const { isLoading } = useQuery({
    queryKey: ['chat', bookingId],
    queryFn: async () => {
      const res = await bookingApi.chat(bookingId);
      const history: Message[] = (res.data.data ?? []).reverse();
      setMessages(history);
      return history;
    },
  });

  useEffect(() => {
    if (!accessToken) {
      setConnected(false);
      return;
    }

    const socket = io(
      process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') ?? 'http://localhost:3001',
      {
        auth: { token: accessToken },
        transports: ['websocket'],
      }
    );

    socket.on('connect', () => {
      setConnected(true);
      socket.emit('booking:join', bookingId);
    });

    socket.on('disconnect', () => setConnected(false));

    socket.on('chat:error', (payload: { message?: string }) => {
      setError(payload.message ?? 'Unable to send chat message.');
    });

    socket.on('booking:error', (payload: { message?: string }) => {
      setError(payload.message ?? 'Unable to join this chat.');
    });

    socket.on('chat:message', (message: Message) => {
      setError(null);
      setMessages((prev) => {
        if (prev.some((entry) => entry.id === message.id)) {
          return prev;
        }

        return [...prev, message];
      });
    });

    socketRef.current = socket;
    return () => {
      socket.disconnect();
    };
  }, [accessToken, bookingId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = () => {
    if (!input.trim() || !socketRef.current) return;
    setError(null);
    socketRef.current.emit('chat:send', { bookingId, body: input.trim() });
    setInput('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink-900/55 p-0 backdrop-blur-sm sm:items-center sm:p-4">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="section-shell shine-panel relative flex h-[82vh] w-full flex-col overflow-hidden sm:h-[620px] sm:max-w-md">
        <div className="dark-panel shine-panel rounded-none border-0 px-5 py-4 shadow-none">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-lg font-semibold text-white">Job chat</p>
              <div className="mt-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-white/55">
                <span
                  className={`h-2 w-2 rounded-full ${connected ? 'bg-mint-300' : 'bg-white/30'}`}
                />
                {connected ? 'Connected' : 'Connecting'}
              </div>
            </div>
            <button
              onClick={onClose}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white/70 transition-colors hover:bg-white/15"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto bg-gradient-to-b from-white/0 via-brand-50/30 to-white/0 px-4 py-4">
          {isLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-ink-300" />
            </div>
          ) : messages.length === 0 ? (
            <div className="py-14 text-center">
              <p className="text-5xl">💬</p>
              <p className="mt-3 text-sm text-ink-400">No messages yet. Start the conversation.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => {
                const isMe = message.senderId === user?.id;

                return (
                  <div
                    key={message.id}
                    className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`flex max-w-[78%] flex-col gap-1 ${isMe ? 'items-end' : 'items-start'}`}
                    >
                      {!isMe && (
                        <span className="px-1 text-xs font-semibold uppercase tracking-[0.14em] text-ink-400">
                          {message.senderName}
                        </span>
                      )}
                      <div
                        className={`rounded-[1.4rem] px-4 py-3 text-sm shadow-soft ${
                          isMe
                            ? 'rounded-br-sm bg-gradient-to-r from-brand-500 to-mint-400 text-white'
                            : 'rounded-bl-sm border border-white/90 bg-white/88 text-ink-800'
                        }`}
                      >
                        {message.body && <p>{message.body}</p>}
                        {message.mediaUrl && (
                          <a
                            href={message.mediaUrl}
                            target="_blank"
                            rel="noreferrer"
                            className={`mt-2 inline-flex text-xs font-semibold underline ${
                              isMe ? 'text-white/90' : 'text-brand-700'
                            }`}
                          >
                            Open attachment
                          </a>
                        )}
                      </div>
                      <span className="px-1 text-xs text-ink-300">
                        {format(new Date(message.createdAt), 'h:mm a')}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <div className="border-t border-white/80 bg-white/82 px-4 py-3 backdrop-blur">
          {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
          <div className="flex items-end gap-3">
            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault();
                  sendMessage();
                }
              }}
              placeholder="Type a message..."
              rows={1}
              className="input min-h-[3rem] flex-1 resize-none py-3 text-sm"
              maxLength={1000}
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || !connected}
              className="flex h-12 w-12 items-center justify-center rounded-2xl bg-ink-900 text-white shadow-deep transition-colors hover:bg-ink-800 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
