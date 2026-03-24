// Mama Fua — Mobile Theme
// KhimTech | 2026
// Place in: apps/mobile/src/theme/index.ts

import { Platform, StyleSheet } from 'react-native';

// ── Colors ────────────────────────────────────────────────────────────
export const Colors = {
  // Brand blue
  brand: {
    50:  '#e6f1fb',
    100: '#b5d4f4',
    200: '#85b7eb',
    400: '#378add',
    600: '#185fa5',
    800: '#0c447c',
    900: '#042c53',
  },

  // Teal (cleaner/success)
  teal: {
    50:  '#e1f5ee',
    100: '#9fe1cb',
    400: '#1d9e75',
    600: '#0f6e56',
    800: '#085041',
  },

  // Semantic
  success: '#0f6e56',
  warning: '#b45309',
  danger:  '#dc2626',
  info:    '#185fa5',

  // Booking status
  status: {
    pending:     { bg: '#fef3c7', text: '#92400e' },
    accepted:    { bg: '#dbeafe', text: '#1e40af' },
    paid:        { bg: '#dbeafe', text: '#1e40af' },
    in_progress: { bg: '#d1fae5', text: '#065f46' },
    completed:   { bg: '#ede9fe', text: '#5b21b6' },
    confirmed:   { bg: '#d1fae5', text: '#065f46' },
    cancelled:   { bg: '#f1f5f9', text: '#64748b' },
    disputed:    { bg: '#fee2e2', text: '#991b1b' },
    refunded:    { bg: '#f1f5f9', text: '#64748b' },
  },

  // Neutrals
  white:    '#ffffff',
  black:    '#000000',
  gray: {
    50:  '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
  },

  // Screen backgrounds
  background:      '#f8fafc',
  backgroundCard:  '#ffffff',
  border:          '#e2e8f0',
  borderFocus:     '#185fa5',

  // Text
  textPrimary:     '#0f172a',
  textSecondary:   '#64748b',
  textTertiary:    '#94a3b8',
  textDisabled:    '#cbd5e1',
  textInverse:     '#ffffff',
  textBrand:       '#185fa5',
  textTeal:        '#0f6e56',
  textDanger:      '#dc2626',
} as const;

// ── Typography ────────────────────────────────────────────────────────
export const Typography = {
  // Font sizes
  size: {
    xs:   10,
    sm:   12,
    base: 14,
    md:   15,
    lg:   17,
    xl:   20,
    '2xl':22,
    '3xl':26,
    '4xl':30,
  },

  // Font weights
  weight: {
    regular:   '400' as const,
    medium:    '500' as const,
    semibold:  '600' as const,
    bold:      '700' as const,
    extrabold: '800' as const,
  },

  // Line heights
  lineHeight: {
    tight:  1.2,
    normal: 1.5,
    relaxed:1.7,
  },
} as const;

// ── Spacing ───────────────────────────────────────────────────────────
export const Spacing = {
  1:  4,
  2:  8,
  3:  12,
  4:  16,
  5:  20,
  6:  24,
  7:  28,
  8:  32,
  10: 40,
  12: 48,
  16: 64,

  // Screen padding
  screenH: 20,   // horizontal
  screenV: 24,   // vertical
  sectionGap: 24,
  itemGap: 12,
} as const;

// ── Border radius ─────────────────────────────────────────────────────
export const Radius = {
  sm:  8,
  md:  12,
  lg:  16,
  xl:  20,
  '2xl': 24,
  full: 9999,
} as const;

// ── Shadows ───────────────────────────────────────────────────────────
export const Shadows = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHover: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 12,
    elevation: 4,
  },
  modal: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.20,
    shadowRadius: 24,
    elevation: 10,
  },
  brand: {
    shadowColor: '#185fa5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.30,
    shadowRadius: 8,
    elevation: 4,
  },
} as const;

// ── Header height (for safe area calculations) ────────────────────────
export const Layout = {
  headerHeight:    Platform.OS === 'ios' ? 88 : 64,
  bottomTabHeight: Platform.OS === 'ios' ? 84 : 64,
  statusBarHeight: Platform.OS === 'ios' ? 44 : 24,
} as const;

// ── Common StyleSheet snippets ────────────────────────────────────────
export const CommonStyles = StyleSheet.create({
  // Screen
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  // Cards
  card: {
    backgroundColor: Colors.backgroundCard,
    borderRadius: Radius.lg,
    padding: Spacing[4],
    ...Shadows.card,
  },

  // Input field
  input: {
    backgroundColor: Colors.backgroundCard,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
    fontSize: Typography.size.md,
    color: Colors.textPrimary,
    fontWeight: Typography.weight.regular,
  },

  inputFocused: {
    borderColor: Colors.borderFocus,
  },

  // Label
  label: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.semibold,
    color: Colors.textSecondary,
    marginBottom: Spacing[1],
  },

  // Primary button
  btnPrimary: {
    backgroundColor: Colors.brand[600],
    borderRadius: Radius.lg,
    paddingVertical: Spacing[4],
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    flexDirection: 'row' as const,
    gap: Spacing[2],
    ...Shadows.brand,
  },

  btnPrimaryText: {
    color: Colors.textInverse,
    fontSize: Typography.size.md,
    fontWeight: Typography.weight.bold,
  },

  btnPrimaryDisabled: {
    backgroundColor: Colors.gray[300],
    shadowOpacity: 0,
    elevation: 0,
  },

  // Secondary button
  btnSecondary: {
    backgroundColor: Colors.backgroundCard,
    borderRadius: Radius.lg,
    paddingVertical: Spacing[4],
    alignItems: 'center' as const,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },

  btnSecondaryText: {
    color: Colors.textSecondary,
    fontSize: Typography.size.md,
    fontWeight: Typography.weight.semibold,
  },

  // Ghost button
  btnGhost: {
    paddingVertical: Spacing[3],
    paddingHorizontal: Spacing[4],
    alignItems: 'center' as const,
  },

  btnGhostText: {
    color: Colors.textSecondary,
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.medium,
  },

  // Teal button
  btnTeal: {
    backgroundColor: Colors.teal[600],
    borderRadius: Radius.lg,
    paddingVertical: Spacing[4],
    alignItems: 'center' as const,
    shadowColor: Colors.teal[600],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },

  // Section title
  sectionTitle: {
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing[3],
  },

  // Row with space between
  rowBetween: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
  },

  // Screen header
  header: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingHorizontal: Spacing[5],
    paddingTop: 56,
    paddingBottom: Spacing[4],
    backgroundColor: Colors.backgroundCard,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[100],
  },

  // Divider
  divider: {
    height: 1,
    backgroundColor: Colors.gray[100],
    marginVertical: Spacing[3],
  },

  // Badge base
  badge: {
    borderRadius: Radius.full,
    paddingHorizontal: 10,
    paddingVertical: 3,
    alignSelf: 'flex-start' as const,
  },

  badgeText: {
    fontSize: Typography.size.xs,
    fontWeight: Typography.weight.semibold,
  },

  // Empty state
  emptyState: {
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingVertical: Spacing[16],
    paddingHorizontal: Spacing[8],
  },

  emptyEmoji: {
    fontSize: 52,
    marginBottom: Spacing[4],
  },

  emptyTitle: {
    fontSize: Typography.size.xl,
    fontWeight: Typography.weight.bold,
    color: Colors.textPrimary,
    textAlign: 'center' as const,
    marginBottom: Spacing[2],
  },

  emptyBody: {
    fontSize: Typography.size.base,
    color: Colors.textTertiary,
    textAlign: 'center' as const,
    lineHeight: Typography.size.base * Typography.lineHeight.relaxed,
    marginBottom: Spacing[6],
  },

  // Avatar circle
  avatar: {
    borderRadius: Radius.full,
    backgroundColor: Colors.brand[100],
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },

  avatarText: {
    fontWeight: Typography.weight.bold,
    color: Colors.brand[600],
  },

  // Footer safe area
  footer: {
    backgroundColor: Colors.backgroundCard,
    borderTopWidth: 1,
    borderTopColor: Colors.gray[100],
    paddingHorizontal: Spacing[5],
    paddingTop: Spacing[3],
    paddingBottom: Platform.OS === 'ios' ? 32 : Spacing[5],
  },
});

// ── Status badge helper ───────────────────────────────────────────────
export function getStatusStyle(status: string): { bg: string; text: string } {
  const map = Colors.status as Record<string, { bg: string; text: string }>;
  return map[status.toLowerCase()] ?? { bg: Colors.gray[100], text: Colors.gray[500] };
}

export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    DRAFT:       'Draft',
    PENDING:     'Finding cleaner',
    ACCEPTED:    'Assigned',
    PAID:        'Confirmed',
    IN_PROGRESS: 'In progress',
    COMPLETED:   'Completed',
    CONFIRMED:   'Done ✓',
    DISPUTED:    'Disputed',
    CANCELLED:   'Cancelled',
    REFUNDED:    'Refunded',
  };
  return labels[status] ?? status;
}