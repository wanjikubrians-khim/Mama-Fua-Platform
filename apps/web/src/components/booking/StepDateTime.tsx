'use client';
// Mama Fua — Step 3: Date & Time
// KhimTech | 2026

import { useState } from 'react';
import { format, addDays, isBefore, startOfDay, addHours } from 'date-fns';
import { Clock, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import type { BookingDraft } from '@/app/book/page';

interface Props {
  draft: Partial<BookingDraft>;
  onChange: (updates: Partial<BookingDraft>) => void;
  onNext: () => void;
  nextLabel?: string;
}

const HOURS = [
  '08:00',
  '09:00',
  '10:00',
  '11:00',
  '12:00',
  '13:00',
  '14:00',
  '15:00',
  '16:00',
  '17:00',
];
const TODAY = startOfDay(new Date());
const MIN_DATE = addHours(new Date(), 2);

function getDaysArray(startOffset = 0, count = 14): Date[] {
  return Array.from({ length: count }, (_, index) => addDays(TODAY, index + startOffset));
}

export default function StepDateTime({ draft, onChange, onNext, nextLabel }: Props) {
  const [weekOffset, setWeekOffset] = useState(0);
  const days = getDaysArray(weekOffset * 7, 7);

  const selectedDate = draft.scheduledAt ? startOfDay(new Date(draft.scheduledAt)) : null;
  const selectedTime = draft.scheduledAt ? format(new Date(draft.scheduledAt), 'HH:mm') : null;

  const handleDateSelect = (date: Date) => {
    const time = selectedTime ?? '09:00';
    const [hours, minutes] = time.split(':').map(Number);
    const nextDate = new Date(date);
    nextDate.setHours(hours ?? 9, minutes ?? 0, 0, 0);
    onChange({ scheduledAt: nextDate.toISOString() });
  };

  const handleTimeSelect = (time: string) => {
    if (!selectedDate) return;
    const [hours, minutes] = time.split(':').map(Number);
    const nextDate = new Date(selectedDate);
    nextDate.setHours(hours ?? 9, minutes ?? 0, 0, 0);
    onChange({ scheduledAt: nextDate.toISOString() });
  };

  const isTimeDisabled = (time: string): boolean => {
    if (!selectedDate) return false;
    const [hours, minutes] = time.split(':').map(Number);
    const nextDate = new Date(selectedDate);
    nextDate.setHours(hours ?? 9, minutes ?? 0, 0, 0);
    return isBefore(nextDate, MIN_DATE);
  };

  const canProceed = !!draft.scheduledAt && !isBefore(new Date(draft.scheduledAt), MIN_DATE);

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <span className="pill">Step 3</span>
        <div>
          <h1 className="text-4xl text-ink-900">When should the cleaner arrive?</h1>
          <p className="mt-2 text-sm leading-6 text-ink-500">
            Pick a day and start time. All times are shown in East Africa Time.
          </p>
        </div>
      </div>

      <div className="rounded-[1.75rem] border border-white/90 bg-white/72 p-5 shadow-soft backdrop-blur">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-2xl text-ink-900">
            <Calendar className="h-5 w-5 text-brand-600" />
            Select a date
          </h2>
          <div className="flex gap-2">
            <button
              onClick={() => setWeekOffset((value) => Math.max(0, value - 1))}
              disabled={weekOffset === 0}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/90 bg-white shadow-soft transition-colors hover:bg-brand-50 disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => setWeekOffset((value) => Math.min(3, value + 1))}
              disabled={weekOffset === 3}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/90 bg-white shadow-soft transition-colors hover:bg-brand-50 disabled:opacity-40"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-2">
          {days.map((day) => {
            const isPast = isBefore(addDays(day, 1), new Date());
            const isSelected =
              !!selectedDate && format(day, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd');
            const isToday = format(day, 'yyyy-MM-dd') === format(TODAY, 'yyyy-MM-dd');

            return (
              <button
                key={day.toISOString()}
                onClick={() => !isPast && handleDateSelect(day)}
                disabled={isPast}
                className={`flex flex-col items-center rounded-[1.4rem] border px-1 py-4 transition-all duration-200 ${
                  isSelected
                    ? 'border-brand-300 bg-brand-600 text-white shadow-soft'
                    : isPast
                      ? 'border-transparent bg-white/50 text-ink-300'
                      : isToday
                        ? 'border-brand-200 bg-gradient-to-br from-brand-50 to-white text-ink-900 shadow-soft'
                        : 'border-white/90 bg-white/84 text-ink-900 shadow-soft hover:-translate-y-0.5 hover:border-brand-100'
                }`}
              >
                <span
                  className={`text-xs font-semibold uppercase tracking-[0.16em] ${isSelected ? 'text-white/60' : 'text-ink-400'}`}
                >
                  {format(day, 'EEE')}
                </span>
                <span
                  className={`mt-2 text-2xl font-semibold ${isSelected ? 'text-white' : isToday ? 'text-brand-700' : 'text-ink-900'}`}
                >
                  {format(day, 'd')}
                </span>
                <span
                  className={`mt-1 text-xs font-medium uppercase tracking-[0.16em] ${isSelected ? 'text-white/60' : 'text-ink-400'}`}
                >
                  {format(day, 'MMM')}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {selectedDate && (
        <div className="rounded-[1.75rem] border border-white/90 bg-white/72 p-5 shadow-soft backdrop-blur">
          <h2 className="mb-5 flex items-center gap-2 text-2xl text-ink-900">
            <Clock className="h-5 w-5 text-brand-600" />
            Select a start time
          </h2>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
            {HOURS.map((time) => {
              const disabled = isTimeDisabled(time);
              const selected = selectedTime === time;

              return (
                <button
                  key={time}
                  onClick={() => !disabled && handleTimeSelect(time)}
                  disabled={disabled}
                  className={`rounded-2xl border px-4 py-3 text-sm font-semibold transition-all duration-200 ${
                    selected
                      ? 'border-brand-300 bg-brand-600 text-white shadow-soft'
                      : disabled
                        ? 'border-transparent bg-white/50 text-ink-300'
                        : 'border-white/90 bg-white/84 text-ink-700 shadow-soft hover:border-brand-100 hover:text-brand-700'
                  }`}
                >
                  {time}
                </button>
              );
            })}
          </div>

          <p className="mt-4 text-xs leading-5 text-ink-400">
            Bookings require at least 2 hours notice. All times are shown in EAT (UTC+3).
          </p>
        </div>
      )}

      {canProceed && (
        <div className="card-muted shine-panel p-5">
          <p className="text-sm text-ink-700">
            <span className="font-semibold text-ink-900">Scheduled for:</span>{' '}
            {format(new Date(draft.scheduledAt!), "EEEE, dd MMMM yyyy 'at' h:mm a")}
          </p>
        </div>
      )}

      <button
        onClick={onNext}
        disabled={!canProceed}
        className="btn-primary w-full py-4 text-base disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {nextLabel ?? 'Continue to review'}
      </button>
    </div>
  );
}
