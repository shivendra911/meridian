import { describe, it, expect } from 'vitest';
import {
  formatLpa,
  formatDate,
  formatDeadline,
  formatRelative,
  initials,
  maskedChip,
  formatRoleLabel,
} from '../format';

describe('formatLpa', () => {
  it('formats integer package amounts in canonical ₹X LPA notation', () => {
    expect(formatLpa(32)).toBe('₹32 LPA');
    expect(formatLpa('18')).toBe('₹18 LPA');
  });

  it('formats decimal package amounts without trailing unnecessary zeros', () => {
    expect(formatLpa(8.5)).toBe('₹8.5 LPA');
    expect(formatLpa('14.2')).toBe('₹14.2 LPA');
    expect(formatLpa(12.0)).toBe('₹12 LPA');
  });

  it('handles null, undefined and invalid values gracefully with an em-dash', () => {
    expect(formatLpa(null)).toBe('—');
    expect(formatLpa(undefined)).toBe('—');
    expect(formatLpa('')).toBe('—');
    expect(formatLpa('invalid')).toBe('—');
  });
});

describe('formatDeadline', () => {
  it('formats future deadlines as countdowns', () => {
    const inThreeDays = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
    expect(formatDeadline(inThreeDays)).toBe('Closes in 3 days');

    const inOneDay = new Date(Date.now() + 1 * 24 * 60 * 60 * 1000);
    expect(formatDeadline(inOneDay)).toMatch(/Closes (tomorrow|in 1 days)/);
  });

  it('formats past deadlines as closed', () => {
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
    expect(formatDeadline(twoDaysAgo)).toBe('Closed 2 days ago');
  });

  it('handles missing deadline safely', () => {
    expect(formatDeadline(null)).toBe('No deadline');
    expect(formatDeadline(undefined)).toBe('No deadline');
  });
});

describe('formatDate', () => {
  it('formats dates in DD MMM YYYY canonical sentence case', () => {
    const fixedDate = new Date('2026-11-12T00:00:00Z');
    expect(formatDate(fixedDate)).toBe('12 Nov 2026');
  });

  it('handles empty input', () => {
    expect(formatDate(null)).toBe('—');
  });
});

describe('formatRelative', () => {
  it('formats past and future relative offsets correctly', () => {
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
    expect(formatRelative(tomorrow)).toMatch(/tomorrow|in 1 days/);

    const inThreeDays = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
    expect(formatRelative(inThreeDays)).toBe('in 3 days');

    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    expect(formatRelative(yesterday)).toMatch(/yesterday|1 days ago/);
  });

  it('handles empty input', () => {
    expect(formatRelative(null)).toBe('—');
  });
});

describe('initials', () => {
  it('extracts two uppercase letters from full names', () => {
    expect(initials('Aarav Sharma')).toBe('AS');
    expect(initials('Priya K. Patel')).toBe('PP');
    expect(initials('Mohammad')).toBe('MO');
    expect(initials('   John    Doe   ')).toBe('JD');
  });

  it('handles empty input', () => {
    expect(initials(null)).toBe('—');
    expect(initials('')).toBe('—');
  });
});

describe('maskedChip', () => {
  it('returns standard masked chip label', () => {
    expect(maskedChip()).toBe('Hidden for your role');
    expect(maskedChip('Email')).toBe('Hidden: Email');
  });
});

describe('formatRoleLabel', () => {
  it('maps standard system role codes to human titles', () => {
    expect(formatRoleLabel('TPO_ADMIN')).toBe('Placement officer');
    expect(formatRoleLabel('TPO_COORDINATOR')).toBe('Placement coordinator');
    expect(formatRoleLabel('FACULTY_MENTOR')).toBe('Faculty mentor');
    expect(formatRoleLabel('DEPARTMENT_HEAD')).toBe('Head of department');
    expect(formatRoleLabel('SCHOOL_HEAD')).toBe('Dean');
    expect(formatRoleLabel('INSTITUTION_HEAD')).toBe('Vice chancellor');
    expect(formatRoleLabel('STUDENT_MEMBER')).toBe('Student');
    expect(formatRoleLabel('INSTITUTION_ADMIN')).toBe('Administrator');
  });

  it('maps affiliation aliases cleanly', () => {
    expect(formatRoleLabel('STUDENT')).toBe('Student');
    expect(formatRoleLabel('FACULTY')).toBe('Faculty mentor');
    expect(formatRoleLabel('HOD')).toBe('Head of department');
    expect(formatRoleLabel('DEAN')).toBe('Dean');
    expect(formatRoleLabel('ALUMNI')).toBe('Alumni');
  });

  it('converts unknown role codes to Title Case', () => {
    expect(formatRoleLabel('PLACEMENT_COORDINATOR_SPECIAL')).toBe('Placement Coordinator Special');
    expect(formatRoleLabel('CAMPUS_DIRECTOR')).toBe('Campus Director');
  });

  it('handles null/undefined gracefully', () => {
    expect(formatRoleLabel(null)).toBe('Member');
    expect(formatRoleLabel(undefined)).toBe('Member');
    expect(formatRoleLabel('')).toBe('Member');
  });
});

