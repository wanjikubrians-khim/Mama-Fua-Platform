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
}

const HOURS = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'];
const TODAY = startOfDay(new Date());
const MIN_DATE = addHours(new Date(), 2); // at least 2 hours from now

function getDaysArray(startOffset: number = 0, count: number = 14): Date[] {
  return Array.from({ length: count }, (_, i) => addDays(TODAY, i + startOffset));
}

export default function StepDateTime({ draft, onChange, onNext }: Props) {
  const [weekOffset, setWeekOffset] = useState(0);
  const days = getDaysArray(weekOffset * 7, 7);

  const selectedDate = draft.scheduledAt ? startOfDay(new Date(draft.scheduledAt)) : null;
  const selectedTime = draft.scheduledAt
    ? format(new Date(draft.scheduledAt), 'HH:mm')
    : null;

  const handleDateSelect = (date: Date) => {
    // Keep existing time if set
    const time = selectedTime ?? '09:00';
    const [h, m] = time.split(':').map(Number);
    const dt = new Date(date);
    dt.setHours(h ?? 9, m ?? 0, 0, 0);
    onChange({ scheduledAt: dt.toISOString() });
  };

  const handleTimeSelect = (time: string) => {
    if (!selectedDate) return;
    const [h, m] = time.split(':').map(Number);
    const dt = new Date(selectedDate);
    dt.setHours(h ?? 9, m ?? 0, 0, 0);
    onChange({ scheduledAt: dt.toISOString() });
  };

  const isTimeDisabled = (time: string): boolean => {
    if (!selectedDate) return false;
    const [h, m] = time.split(':').map(Number);
    const dt = new Date(selectedDate);
    dt.setHours(h ?? 9, m ?? 0, 0, 0);
    return isBefore(dt, MIN_DATE);
  };

  const canProceed = !!draft.scheduledAt && !isBefore(new Date(draft.scheduledAt), MIN_DATE);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">When do you need us?</h1>
        <p className="text-gray-500 mt-1">Pick a date and time that works for you</p>
      </div>

      {/* Date picker */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-brand-600" />
            Select a date
          </h2>
          <div className="flex gap-1">
            <button
              onClick={() => setWeekOffset((w) => Math.max(0, w - 1))}
              disabled={weekOffset === 0}
              className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => setWeekOffset((w) => Math.min(3, w + 1))}
              disabled={weekOffset === 3}
              className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-2">
          {days.map((day) => {
            const isPast = isBefore(addDays(day, 1), new Date());
            const isSelected = selectedDate && format(day, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd');
            const isToday = format(day, 'yyyy-MM-dd') === format(TODAY, 'yyyy-MM-dd');

            return (
              <button
                key={day.toISOString()}
                onClick={() => !isPast && handleDateSelect(day)}
                disabled={isPast}
                className={`flex flex-col items-center py-3 px-1 rounded-xl transition-all ${
                  isSelected
                    ? 'bg-brand-600 text-white shadow-md'
                    : isPast
                    ? 'opacity-30 cursor-not-allowed bg-gray-50'
                    : isToday
                    ? 'border-2 border-brand-200 bg-brand-50 hover:bg-brand-100'
                    : 'bg-gray-50 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                <span className={`text-xs font-medium mb-1 ${isSelected ? 'text-brand-100' : 'text-gray-400'}`}>
                  {format(day, 'EEE')}
                </span>
                <span className={`text-lg font-bold leading-none ${isSelected ? 'text-white' : isToday ? 'text-brand-600' : 'text-gray-800'}`}>
                  {format(day, 'd')}
                </span>
                <span className={`text-xs mt-1 ${isSelected ? 'text-brand-100' : 'text-gray-400'}`}>
                  {format(day, 'MMM')}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Time picker */}
      {selectedDate && (
        <div>
          <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2 mb-4">
            <Clock className="h-5 w-5 text-brand-600" />
            Select a start time
          </h2>
          <div className="grid grid-cols-5 gap-2">
            {HOURS.map((time) => {
              const disabled = isTimeDisabled(time);
              const selected = selectedTime === time;
              return (
                <button
                  key={time}
                  onClick={() => !disabled && handleTimeSelect(time)}
                  disabled={disabled}
                  className={`py-3 rounded-xl text-sm font-medium transition-all ${
                    selected
                      ? 'bg-brand-600 text-white shadow-md'
                      : disabled
                      ? 'bg-gray-50 text-gray-300 cursor-not-allowed'
                      : 'bg-gray-50 text-gray-700 hover:bg-brand-50 hover:text-brand-600 border border-gray-200'
                  }`}
                >
                  {time}
                </button>
              );
            })}
          </div>
          <p className="text-xs text-gray-400 mt-3">
            All times in East Africa Time (EAT, UTC+3). Bookings require at least 2 hours notice.
          </p>
        </div>
      )}

      {/* Summary */}
      {canProceed && (
        <div className="card bg-brand-50 border border-brand-100 p-4">
          <p className="text-sm text-brand-800">
            <span className="font-semibold">Scheduled for: </span>
            {format(new Date(draft.scheduledAt!), "EEEE, dd MMMM yyyy 'at' h:mm a")}
          </p>
        </div>
      )}

      <button
        onClick={onNext}
        disabled={!canProceed}
        className="btn-primary w-full py-4 text-base disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Continue → Review & pay
      </button>
    </div>
  );
}
