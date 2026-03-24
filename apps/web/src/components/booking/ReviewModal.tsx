'use client';
// Mama Fua — Review Modal
// KhimTech | 2026

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Star, X, Loader2 } from 'lucide-react';

interface Props {
  bookingId: string;
  cleanerName: string;
  onClose: () => void;
  onSuccess: () => void;
}

const RATING_LABELS = ['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent'];

export default function ReviewModal({ bookingId, cleanerName, onClose, onSuccess }: Props) {
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [body, setBody] = useState('');

  const mutation = useMutation({
    mutationFn: () => api.post('/reviews', { bookingId, rating, review: body }),
    onSuccess,
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/55 p-4 backdrop-blur-sm">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="section-shell shine-panel relative w-full max-w-md overflow-hidden">
        <div className="dark-panel shine-panel rounded-none border-0 px-6 py-5 shadow-none">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-100">
                Review
              </p>
              <h2 className="mt-2 text-3xl text-white">Rate {cleanerName}</h2>
            </div>
            <button
              onClick={onClose}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white/70 transition-colors hover:bg-white/15"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="space-y-6 px-6 py-6">
          <div className="text-center">
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onMouseEnter={() => setHovered(star)}
                  onMouseLeave={() => setHovered(0)}
                  onClick={() => setRating(star)}
                  className="rounded-full p-1 transition-transform hover:scale-110"
                >
                  <Star
                    className={`h-11 w-11 transition-colors ${
                      star <= (hovered || rating)
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-brand-100'
                    }`}
                  />
                </button>
              ))}
            </div>
            {(hovered || rating) > 0 && (
              <p className="mt-3 text-sm font-semibold uppercase tracking-[0.16em] text-amber-600">
                {RATING_LABELS[hovered || rating]}
              </p>
            )}
          </div>

          {rating > 0 && (
            <div className="card-muted shine-panel p-5">
              <label className="mb-2 block text-sm font-medium text-ink-700">
                Share your experience <span className="font-normal text-ink-400">(optional)</span>
              </label>
              <textarea
                value={body}
                onChange={(event) => setBody(event.target.value)}
                rows={3}
                className="input resize-none bg-white/90"
                placeholder={rating >= 4 ? 'What did they do well?' : 'What could be improved?'}
                maxLength={500}
              />
            </div>
          )}

          <div className="flex flex-col gap-3 sm:flex-row">
            <button onClick={onClose} className="btn-secondary flex-1">
              Skip
            </button>
            <button
              onClick={() => mutation.mutate()}
              disabled={rating === 0 || mutation.isPending}
              className="btn-primary flex-1"
            >
              {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Submit review'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
