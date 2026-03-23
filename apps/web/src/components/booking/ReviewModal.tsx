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

const RATING_LABELS = ['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent!'];

export default function ReviewModal({ bookingId, cleanerName, onClose, onSuccess }: Props) {
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [body, setBody] = useState('');

  const mutation = useMutation({
    mutationFn: () => api.post('/reviews', { bookingId, rating, review: body }),
    onSuccess,
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">Rate {cleanerName}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Stars */}
        <div className="text-center">
          <div className="flex justify-center gap-2 mb-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onMouseEnter={() => setHovered(star)}
                onMouseLeave={() => setHovered(0)}
                onClick={() => setRating(star)}
                className="transition-transform hover:scale-110"
              >
                <Star
                  className={`h-10 w-10 transition-colors ${
                    star <= (hovered || rating)
                      ? 'fill-amber-400 text-amber-400'
                      : 'text-gray-200'
                  }`}
                />
              </button>
            ))}
          </div>
          {(hovered || rating) > 0 && (
            <p className="text-sm font-semibold text-amber-600">
              {RATING_LABELS[hovered || rating]}
            </p>
          )}
        </div>

        {/* Review text */}
        {rating > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Share your experience <span className="text-gray-400">(optional)</span>
            </label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={3}
              className="input resize-none"
              placeholder={rating >= 4 ? "What did they do well?" : "What could be improved?"}
              maxLength={500}
            />
          </div>
        )}

        <div className="flex gap-3">
          <button onClick={onClose} className="btn-secondary flex-1">Skip</button>
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
  );
}
