import { describe, it, expect } from 'bun:test';
import { tehranStudyDate } from '../../../supabase/functions/study-advisor/policy';
describe('Advisor study day in Tehran', () => {
  it('keeps 01:00 Tehran in the previous day', () => expect(tehranStudyDate(new Date('2026-11-11T21:30:00Z'))).toBe('2026-11-11'));
  it('starts the next day at 03:00 Tehran', () => expect(tehranStudyDate(new Date('2026-11-11T23:30:00Z'))).toBe('2026-11-12'));
});