// Mama Fua — Unit Tests: Shared Utilities
// KhimTech | QA: Maryann Wanjiru | 2026
// Tests: normalisePhone, maskPhone, formatKES, calculateCommission, generateBookingRef

import {
  normalisePhone,
  maskPhone,
  formatKES,
  calculateCommission,
  generateBookingRef,
  COMMISSION,
  PAYMENT,
  BOOKING,
} from '@mama-fua/shared';

describe('normalisePhone', () => {
  it('normalises 07xx format to +2547xx', () => {
    expect(normalisePhone('0712345678')).toBe('+254712345678');
  });

  it('normalises 254xx format to +254xx', () => {
    expect(normalisePhone('254712345678')).toBe('+254712345678');
  });

  it('passes through correctly formatted +254 numbers', () => {
    expect(normalisePhone('+254712345678')).toBe('+254712345678');
  });

  it('handles 7xx without leading 0', () => {
    expect(normalisePhone('712345678')).toBe('+254712345678');
  });

  it('strips spaces and dashes', () => {
    expect(normalisePhone('0712 345 678')).toBe('+254712345678');
  });

  it('handles Airtel 010x prefix', () => {
    expect(normalisePhone('0101234567')).toBe('+254101234567');
  });
});

describe('maskPhone', () => {
  it('masks middle digits of a phone number', () => {
    expect(maskPhone('+254712345678')).toBe('+25471****678');
  });

  it('handles short strings gracefully', () => {
    expect(maskPhone('123')).toBe('****');
  });

  it('never exposes more than first 6 and last 3 digits', () => {
    const masked = maskPhone('+254712345678');
    expect(masked).not.toContain('2345');
    expect(masked).toMatch(/\+25471\*{4}678/);
  });
});

describe('formatKES', () => {
  it('formats cents to KES string', () => {
    expect(formatKES(120000)).toBe('KES 1,200.00');
  });

  it('formats zero correctly', () => {
    expect(formatKES(0)).toBe('KES 0.00');
  });

  it('formats large amounts with commas', () => {
    expect(formatKES(5000000)).toBe('KES 50,000.00');
  });

  it('formats amounts with cents', () => {
    expect(formatKES(150050)).toBe('KES 1,500.50');
  });
});

describe('calculateCommission', () => {
  it('calculates standard 15% commission correctly', () => {
    const result = calculateCommission(120000, COMMISSION.STANDARD);
    expect(result.platformFee).toBe(18000);
    expect(result.cleanerEarnings).toBe(102000);
    expect(result.platformFee + result.cleanerEarnings).toBe(120000);
  });

  it('calculates premium cleaner 12% commission', () => {
    const result = calculateCommission(120000, COMMISSION.PREMIUM_CLEANER);
    expect(result.platformFee).toBe(14400);
    expect(result.cleanerEarnings).toBe(105600);
  });

  it('calculates agency 18% commission', () => {
    const result = calculateCommission(120000, COMMISSION.AGENCY);
    expect(result.platformFee).toBe(21600);
    expect(result.cleanerEarnings).toBe(98400);
  });

  it('calculates recurring 10% commission', () => {
    const result = calculateCommission(120000, COMMISSION.RECURRING);
    expect(result.platformFee).toBe(12000);
    expect(result.cleanerEarnings).toBe(108000);
  });

  it('rounds fractional cents correctly', () => {
    // 120001 * 0.15 = 18000.15 → rounds to 18000
    const result = calculateCommission(120001, COMMISSION.STANDARD);
    expect(result.platformFee + result.cleanerEarnings).toBe(120001);
  });

  it('platform fee + cleaner earnings always equals total', () => {
    const amounts = [100000, 150000, 350000, 500000, 1234567];
    amounts.forEach((amount) => {
      const result = calculateCommission(amount, COMMISSION.STANDARD);
      expect(result.platformFee + result.cleanerEarnings).toBe(amount);
    });
  });
});

describe('generateBookingRef', () => {
  it('generates a ref with MF- prefix and current year', () => {
    const ref = generateBookingRef(1);
    expect(ref).toMatch(/^MF-\d{4}-\d{5}$/);
    expect(ref).toContain(String(new Date().getFullYear()));
  });

  it('pads sequence number to 5 digits', () => {
    expect(generateBookingRef(1)).toMatch(/00001$/);
    expect(generateBookingRef(42)).toMatch(/00042$/);
    expect(generateBookingRef(99999)).toMatch(/99999$/);
  });

  it('generates unique refs for different sequences', () => {
    const refs = [1, 2, 3, 100, 1000].map(generateBookingRef);
    const unique = new Set(refs);
    expect(unique.size).toBe(refs.length);
  });
});

describe('Constants', () => {
  describe('COMMISSION rates', () => {
    it('standard rate is 15%', () => expect(COMMISSION.STANDARD).toBe(0.15));
    it('premium rate is 12%', () => expect(COMMISSION.PREMIUM_CLEANER).toBe(0.12));
    it('agency rate is 18%', () => expect(COMMISSION.AGENCY).toBe(0.18));
    it('recurring rate is 10%', () => expect(COMMISSION.RECURRING).toBe(0.10));
    it('cash rate is 5%', () => expect(COMMISSION.CASH).toBe(0.05));
    it('premium is lower than standard', () => expect(COMMISSION.PREMIUM_CLEANER).toBeLessThan(COMMISSION.STANDARD));
    it('agency is higher than standard', () => expect(COMMISSION.AGENCY).toBeGreaterThan(COMMISSION.STANDARD));
  });

  describe('PAYMENT limits', () => {
    it('min withdrawal is KES 200 (20000 cents)', () => expect(PAYMENT.MIN_WITHDRAWAL).toBe(20000));
    it('max withdrawal is KES 70,000 (7000000 cents)', () => expect(PAYMENT.MAX_WITHDRAWAL).toBe(7000000));
    it('auto-approve limit is KES 5,000 (500000 cents)', () => expect(PAYMENT.AUTO_APPROVE_PAYOUT_LIMIT).toBe(500000));
    it('max wallet is KES 50,000 (5000000 cents)', () => expect(PAYMENT.MAX_WALLET_BALANCE).toBe(5000000));
    it('min withdrawal is less than auto-approve limit', () => {
      expect(PAYMENT.MIN_WITHDRAWAL).toBeLessThan(PAYMENT.AUTO_APPROVE_PAYOUT_LIMIT);
    });
  });

  describe('BOOKING config', () => {
    it('auto-assign timeout is 5 minutes', () => {
      expect(BOOKING.AUTO_ASSIGN_TIMEOUT_MS).toBe(5 * 60 * 1000);
    });
    it('dispute window is 24 hours', () => expect(BOOKING.DISPUTE_WINDOW_HOURS).toBe(24));
    it('escrow release is 24 hours', () => expect(BOOKING.ESCROW_RELEASE_HOURS).toBe(24));
    it('min rating for match is 3.5', () => expect(BOOKING.MIN_CLEANER_RATING_FOR_MATCH).toBe(3.5));
    it('max match candidates is 10', () => expect(BOOKING.MAX_MATCH_CANDIDATES).toBe(10));
  });
});
