/**
 * PlaceFlow / Meridian — Formatting Primitives & Design System Helpers.
 *
 * Rules:
 * - Nothing formats inline in UI components.
 * - Numbers use tabular-nums with 'en-IN' locale.
 * - Money formats as `₹<amount> LPA`.
 * - Dates format as `DD MMM YYYY` (e.g., 12 Nov 2026).
 * - Relative time outputs human-friendly countdowns / past deltas.
 */

/** Formats CTC / package amounts into canonical `₹X LPA` notation. */
export function formatLpa(amount: number | string | null | undefined): string {
  if (amount === null || amount === undefined || amount === '') {
    return '—';
  }
  const numeric = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(numeric)) {
    return '—';
  }
  // Format with en-IN separators if needed, but strip trailing .0
  const formatted = numeric % 1 === 0 ? numeric.toString() : numeric.toFixed(1);
  return `₹${formatted} LPA`;
}

/** Formats absolute dates as `12 Nov 2026`. */
export function formatDate(input: string | number | Date | null | undefined): string {
  if (!input) return '—';
  const d = new Date(input);
  if (isNaN(d.getTime())) return '—';

  const day = d.getDate();
  const month = d.toLocaleString('en-IN', { month: 'short' });
  const year = d.getFullYear();
  return `${day} ${month} ${year}`;
}

/** Formats time and date as `12 Nov 2026, 14:00`. */
export function formatDateTime(input: string | number | Date | null | undefined): string {
  if (!input) return '—';
  const d = new Date(input);
  if (isNaN(d.getTime())) return '—';

  const dateStr = formatDate(d);
  const timeStr = d.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  return `${dateStr}, ${timeStr}`;
}

/** Formats relative difference from now (e.g., 'in 3 days', '2 hours ago', 'today'). */
export function formatRelative(input: string | number | Date | null | undefined): string {
  if (!input) return '—';
  const d = new Date(input);
  if (isNaN(d.getTime())) return '—';

  const now = new Date();
  const diffMs = d.getTime() - now.getTime();
  const diffSec = Math.round(diffMs / 1000);
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
  const absDays = Math.abs(diffDays);

  if (diffSec === 0) return 'now';

  if (absDays === 0) {
    const diffHours = Math.round(diffMs / (1000 * 60 * 60));
    if (Math.abs(diffHours) === 0) {
      const diffMin = Math.round(diffMs / (1000 * 60));
      return diffMin > 0 ? `in ${diffMin} min` : `${Math.abs(diffMin)} min ago`;
    }
    return diffHours > 0 ? `in ${diffHours} hr` : `${Math.abs(diffHours)} hr ago`;
  }

  if (diffDays === 1) return 'tomorrow';
  if (diffDays === -1) return 'yesterday';

  if (diffDays > 0) {
    if (diffDays < 30) return `in ${diffDays} days`;
    const months = Math.round(diffDays / 30);
    return `in ${months} month${months > 1 ? 's' : ''}`;
  } else {
    if (absDays < 30) return `${absDays} days ago`;
    const months = Math.round(absDays / 30);
    return `${months} month${months > 1 ? 's' : ''} ago`;
  }
}

/** Formats drive deadline as countdown string (e.g., 'Closes in 3 days', 'Closed 2 days ago'). */
export function formatDeadline(input: string | number | Date | null | undefined): string {
  if (!input) return 'No deadline';
  const d = new Date(input);
  if (isNaN(d.getTime())) return 'No deadline';

  const now = new Date();
  const diffMs = d.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays > 1) {
    return `Closes in ${diffDays} days`;
  } else if (diffDays === 1) {
    return 'Closes tomorrow';
  } else if (diffDays === 0) {
    return 'Closes today';
  } else if (diffDays === -1) {
    return 'Closed yesterday';
  } else {
    return `Closed ${Math.abs(diffDays)} days ago`;
  }
}

/** Extracts up to 2 uppercase initials from a person or company name. */
export function initials(name: string | null | undefined): string {
  if (!name || !name.trim()) return '—';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/** Returns the standard display text for a masked/restricted data field. */
export function maskedChip(label?: string): string {
  return label ? `Hidden: ${label}` : 'Hidden for your role';
}

/** Formats integer numbers using standard Indian locale grouping. */
export function formatNumber(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === '') return '0';
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '0';
  return new Intl.NumberFormat('en-IN').format(num);
}

