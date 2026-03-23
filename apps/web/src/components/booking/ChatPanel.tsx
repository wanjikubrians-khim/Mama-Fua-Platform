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
  createdAt: string;
}

export default function ChatPanel({ bookingId, onClose }: Props) {
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Load history
  const { isLoading } = useQuery({
    queryKey: ['chat', bookingId],
    queryFn: async () => {
      const res = await bookingApi.chat(bookingId);
      const history: Message[] = (res.data.data ?? []).reverse();
      setMessages(history);
      return history;
    },
  });

  // Connect socket
  useEffect(() => {
    const socket = io(process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') ?? 'http://localhost:3001', {
      auth: { token: accessToken },
      transports: ['websocket'],
    });

    socket.on('connect', () => {
      setConnected(true);
      socket.emit('booking:join', bookingId);
    });

    socket.on('disconnect', () => setConnected(false));

    socket.on('chat:message', (msg: Message) => {
      setMessages((prev) => [...prev, msg]);
    });

    socketRef.current = socket;
    return () => { socket.disconnect(); };
  }, [bookingId, accessToken]);

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = () => {
    if (!input.trim() || !socketRef.current) return;
    socketRef.current.emit('chat:send', { bookingId, body: input.trim() });
    setInput('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />
      <div className="relative bg-white w-full sm:max-w-md h-[80vh] sm:h-[600px] rounded-t-2xl sm:rounded-2xl flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <p className="font-semibold text-gray-900">Job chat</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className={`h-2 w-2 rounded-full ${connected ? 'bg-green-400' : 'bg-gray-300'}`} />
              <span className="text-xs text-gray-400">{connected ? 'Connected' : 'Connecting...'}</span>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-gray-300" />
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-4xl mb-2">💬</p>
              <p className="text-sm text-gray-400">No messages yet. Say hello!</p>
            </div>
          ) : (
            messages.map((msg) => {
              const isMe = msg.senderId === user?.id;
              return (
                <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[75%] ${isMe ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                    {!isMe && (
                      <span className="text-xs text-gray-400 px-1">{msg.senderName}</span>
                    )}
                    <div className={`px-4 py-2.5 rounded-2xl text-sm ${
                      isMe
                        ? 'bg-brand-600 text-white rounded-br-sm'
                        : 'bg-gray-100 text-gray-900 rounded-bl-sm'
                    }`}>
                      {msg.body}
                    </div>
                    <span className="text-xs text-gray-300 px-1">
                      {format(new Date(msg.createdAt), 'h:mm a')}
                    </span>
                  </div>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="border-t border-gray-100 px-4 py-3 flex gap-3 items-end">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
            }}
            placeholder="Type a message..."
            rows={1}
            className="flex-1 resize-none input py-2.5 text-sm"
            maxLength={1000}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || !connected}
            className="p-2.5 rounded-xl bg-brand-600 text-white disabled:opacity-40 hover:bg-brand-700 transition-colors flex-shrink-0"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
