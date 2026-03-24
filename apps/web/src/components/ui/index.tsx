// Mama Fua — Shared UI Components
// KhimTech | 2026
// Place in: apps/web/src/components/ui/index.tsx

import React from 'react';
import { Loader2 } from 'lucide-react';

// ── cn helper ────────────────────────────────────────────────────────
export function cn(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

// ── Button ───────────────────────────────────────────────────────────
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'teal';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
}

const BUTTON_VARIANTS = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  ghost: 'btn-ghost',
  danger: 'btn-danger',
  teal: 'btn-teal',
};

const BUTTON_SIZES = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-5 py-2.5 text-sm',
  lg: 'px-8 py-3.5 text-base',
};

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  children,
  className,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(BUTTON_VARIANTS[variant], BUTTON_SIZES[size], className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : icon}
      {children}
    </button>
  );
}

// ── Input ────────────────────────────────────────────────────────────
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export function Input({
  label,
  error,
  hint,
  leftIcon,
  rightIcon,
  className,
  id,
  ...props
}: InputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className="field-group">
      {label && (
        <label htmlFor={inputId} className="label">
          {label}
        </label>
      )}
      <div className="relative">
        {leftIcon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">{leftIcon}</span>
        )}
        <input
          id={inputId}
          className={cn(
            'input',
            !!leftIcon && 'pl-10',
            !!rightIcon && 'pr-10',
            !!error && 'input-error',
            className
          )}
          {...props}
        />
        {rightIcon && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
            {rightIcon}
          </span>
        )}
      </div>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
      {hint && !error && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
    </div>
  );
}

// ── Textarea ─────────────────────────────────────────────────────────
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
  charCount?: boolean;
  maxLength?: number;
}

export function Textarea({
  label,
  error,
  hint,
  charCount,
  maxLength,
  className,
  value,
  ...props
}: TextareaProps) {
  return (
    <div className="field-group">
      {label && <label className="label">{label}</label>}
      <textarea
        className={cn('input resize-none', error && 'input-error', className)}
        maxLength={maxLength}
        value={value}
        {...props}
      />
      <div className="flex justify-between mt-1">
        {error ? (
          <p className="text-xs text-red-500">{error}</p>
        ) : hint ? (
          <p className="text-xs text-gray-400">{hint}</p>
        ) : (
          <span />
        )}
        {charCount && maxLength && (
          <p className="text-xs text-gray-400">
            {String(value ?? '').length}/{maxLength}
          </p>
        )}
      </div>
    </div>
  );
}

// ── Card ─────────────────────────────────────────────────────────────
interface CardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'bordered' | 'brand' | 'teal' | 'amber' | 'red';
  hover?: boolean;
  onClick?: () => void;
}

const CARD_VARIANTS = {
  default: 'card',
  bordered: 'card-bordered',
  brand: 'card-brand',
  teal: 'card-teal',
  amber: 'card-amber',
  red: 'card-red',
};

export function Card({ children, className, variant = 'default', hover, onClick }: CardProps) {
  const base = hover ? 'card-hover' : CARD_VARIANTS[variant];
  return (
    <div className={cn(base, onClick && 'cursor-pointer', className)} onClick={onClick}>
      {children}
    </div>
  );
}

// ── Badge ─────────────────────────────────────────────────────────────
type BadgeVariant = 'brand' | 'teal' | 'amber' | 'red' | 'green' | 'gray' | 'purple';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const BADGE_VARIANTS: Record<BadgeVariant, string> = {
  brand: 'badge-brand',
  teal: 'badge-teal',
  amber: 'badge-amber',
  red: 'badge-red',
  green: 'badge-green',
  gray: 'badge-gray',
  purple: 'badge-purple',
};

export function Badge({ children, variant = 'gray', className }: BadgeProps) {
  return <span className={cn(BADGE_VARIANTS[variant], className)}>{children}</span>;
}

// ── Status Badge (booking-specific) ──────────────────────────────────
const STATUS_MAP: Record<string, { label: string; class: string }> = {
  DRAFT: { label: 'Draft', class: 'status-pending' },
  PENDING: { label: 'Finding cleaner', class: 'status-pending' },
  ACCEPTED: { label: 'Assigned', class: 'status-accepted' },
  PAID: { label: 'Confirmed', class: 'status-paid' },
  IN_PROGRESS: { label: 'In progress', class: 'status-in_progress' },
  COMPLETED: { label: 'Completed', class: 'status-completed' },
  CONFIRMED: { label: 'Done ✓', class: 'status-confirmed' },
  DISPUTED: { label: 'Disputed', class: 'status-disputed' },
  CANCELLED: { label: 'Cancelled', class: 'status-cancelled' },
  REFUNDED: { label: 'Refunded', class: 'status-refunded' },
};

export function StatusBadge({ status }: { status: string }) {
  const config = STATUS_MAP[status] ?? { label: status, class: 'badge-gray' };
  return <span className={config.class}>{config.label}</span>;
}

// ── Avatar ───────────────────────────────────────────────────────────
interface AvatarProps {
  name: string;
  src?: string | null;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const AVATAR_SIZES = {
  sm: 'avatar-sm',
  md: 'avatar-md',
  lg: 'avatar-lg',
  xl: 'avatar-xl',
};

export function Avatar({ name, src, size = 'md', className }: AvatarProps) {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={cn(AVATAR_SIZES[size], 'rounded-full object-cover', className)}
      />
    );
  }

  return <div className={cn(AVATAR_SIZES[size], className)}>{initials}</div>;
}

// ── Spinner ───────────────────────────────────────────────────────────
export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cn('animate-spin text-brand-600', className ?? 'h-6 w-6')} />;
}

// ── Divider ───────────────────────────────────────────────────────────
export function Divider({ className }: { className?: string }) {
  return <div className={cn('divider', className)} />;
}

// ── Section title ─────────────────────────────────────────────────────
export function SectionTitle({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <p className={cn('section-title', className)}>{children}</p>;
}

// ── Empty state ───────────────────────────────────────────────────────
interface EmptyStateProps {
  emoji: string;
  title: string;
  body?: string;
  action?: React.ReactNode;
}

export function EmptyState({ emoji, title, body, action }: EmptyStateProps) {
  return (
    <div className="empty-state">
      <span className="empty-state-emoji">{emoji}</span>
      <h3 className="empty-state-title">{title}</h3>
      {body && <p className="empty-state-body">{body}</p>}
      {action}
    </div>
  );
}

// ── Callout ───────────────────────────────────────────────────────────
interface CalloutProps {
  children: React.ReactNode;
  variant?: 'info' | 'success' | 'warning' | 'danger';
  className?: string;
}

const CALLOUT_VARIANTS = {
  info: 'callout-info',
  success: 'callout-success',
  warning: 'callout-warning',
  danger: 'callout-danger',
};

export function Callout({ children, variant = 'info', className }: CalloutProps) {
  return <div className={cn(CALLOUT_VARIANTS[variant], className)}>{children}</div>;
}

// ── Pill tabs ─────────────────────────────────────────────────────────
interface PillTabsProps<T extends string> {
  tabs: { value: T; label: string }[];
  active: T;
  onChange: (v: T) => void;
}

export function PillTabs<T extends string>({ tabs, active, onChange }: PillTabsProps<T>) {
  return (
    <div className="pill-tabs">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          onClick={() => onChange(tab.value)}
          className={cn('pill-tab', active === tab.value && 'pill-tab-active')}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

// ── Loading page ──────────────────────────────────────────────────────
export function LoadingPage({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4">
      <Spinner className="h-8 w-8" />
      <p className="text-sm text-gray-500">{message}</p>
    </div>
  );
}

// ── Page header (with back button) ────────────────────────────────────
interface PageHeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  right?: React.ReactNode;
}

export function PageHeader({ title, subtitle, onBack, right }: PageHeaderProps) {
  return (
    <div className="top-nav">
      <div className="top-nav-inner justify-between">
        <div className="flex items-center gap-3">
          {onBack && (
            <button onClick={onBack} className="btn-icon text-gray-400 hover:text-gray-600">
              ←
            </button>
          )}
          <div>
            <h1 className="text-base font-bold text-gray-900">{title}</h1>
            {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
          </div>
        </div>
        {right}
      </div>
    </div>
  );
}

// ── Stat card ─────────────────────────────────────────────────────────
interface StatCardProps {
  value: string | number;
  label: string;
  icon?: React.ReactNode;
  trend?: string;
  className?: string;
}

export function StatCard({ value, label, icon, trend, className }: StatCardProps) {
  return (
    <div className={cn('stat-card', className)}>
      {icon && (
        <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 mb-3">
          {icon}
        </div>
      )}
      <p className="stat-value">{value}</p>
      <p className="stat-label">{label}</p>
      {trend && <p className="text-xs text-teal-600 font-medium mt-1">{trend}</p>}
    </div>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('skeleton', className)} />;
}

export function SkeletonCard() {
  return (
    <div className="card space-y-3">
      <div className="flex items-center gap-3">
        <Skeleton className="h-12 w-12 rounded-xl" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-2/3" />
    </div>
  );
}
