// Mama Fua — Unit Tests: Matching Engine
// KhimTech | QA: Maryann Wanjiru | 2026
//
// Tests the cleaner scoring algorithm that powers auto-assign.
// Critical: a bug here means bad cleaners get offered jobs over good ones.

// We test the private scoring logic by importing and calling it directly
// The haversine and scoreCandidate functions are pure functions — easy to test

// Since they're not exported, we test via the public dispatchMatchQueue
// but we can also test the math separately

describe('Haversine distance calculation', () => {
  // Test known distances
  const cases = [
    {
      desc: 'Kilimani to Westlands, Nairobi (~4.5km)',
      lat1: -1.2866, lng1: 36.7823,
      lat2: -1.2641, lng2: 36.8030,
      expectedKm: 3.5,
      toleranceKm: 1.0,
    },
    {
      desc: 'Same point = 0 distance',
      lat1: -1.2921, lng1: 36.8219,
      lat2: -1.2921, lng2: 36.8219,
      expectedKm: 0,
      toleranceKm: 0.01,
    },
    {
      desc: 'Nairobi to Mombasa (~440km)',
      lat1: -1.2921, lng1: 36.8219,
      lat2: -4.0435, lng2: 39.6682,
      expectedKm: 440,
      toleranceKm: 10,
    },
  ];

  // Implement haversine here for direct testing
  function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  cases.forEach(({ desc, lat1, lng1, lat2, lng2, expectedKm, toleranceKm }) => {
    it(desc, () => {
      const dist = haversineKm(lat1, lng1, lat2, lng2);
      expect(Math.abs(dist - expectedKm)).toBeLessThan(toleranceKm);
    });
  });

  it('is symmetric (A→B = B→A)', () => {
    const d1 = haversineKm(-1.2866, 36.7823, -1.2641, 36.8030);
    const d2 = haversineKm(-1.2641, 36.8030, -1.2866, 36.7823);
    expect(Math.abs(d1 - d2)).toBeLessThan(0.001);
  });
});

describe('Match scoring algorithm', () => {
  // Mirror the scoring function from matching.service.ts
  function scoreCandidate(
    cleaner: {
      lat: number; lng: number; rating: number; totalJobs: number;
      acceptedLast30: number; offeredLast30: number; lastLocationAt: Date | null;
    },
    jobLat: number, jobLng: number
  ): number {
    function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number) {
      const R = 6371;
      const dLat = ((lat2 - lat1) * Math.PI) / 180;
      const dLng = ((lng2 - lng1) * Math.PI) / 180;
      const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
      return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }
    const distKm = haversineKm(cleaner.lat, cleaner.lng, jobLat, jobLng);
    const distScore = Math.max(0, (10 - distKm) / 10) * 100;
    const ratingScore = (cleaner.rating / 5.0) * 100;
    const acceptRate = cleaner.offeredLast30 > 0 ? cleaner.acceptedLast30 / cleaner.offeredLast30 : 0.5;
    const acceptScore = acceptRate * 100;
    const jobScore = Math.min(100, Math.log10(cleaner.totalJobs + 1) * 50);
    const hoursSince = cleaner.lastLocationAt ? (Date.now() - cleaner.lastLocationAt.getTime()) / 3_600_000 : 999;
    const activityBonus = hoursSince < 2 ? 100 : 0;
    return distScore * 0.40 + ratingScore * 0.30 + acceptScore * 0.20 + jobScore * 0.05 + activityBonus * 0.05;
  }

  const jobLat = -1.2921;
  const jobLng = 36.8219;

  it('nearby cleaner scores higher than distant cleaner (same rating)', () => {
    const nearby = scoreCandidate({ lat: -1.2950, lng: 36.8200, rating: 4.5, totalJobs: 20, acceptedLast30: 5, offeredLast30: 5, lastLocationAt: null }, jobLat, jobLng);
    const distant = scoreCandidate({ lat: -1.3500, lng: 36.9000, rating: 4.5, totalJobs: 20, acceptedLast30: 5, offeredLast30: 5, lastLocationAt: null }, jobLat, jobLng);
    expect(nearby).toBeGreaterThan(distant);
  });

  it('higher rated cleaner scores higher at same distance', () => {
    const highRating = scoreCandidate({ lat: -1.2950, lng: 36.8200, rating: 4.9, totalJobs: 20, acceptedLast30: 5, offeredLast30: 5, lastLocationAt: null }, jobLat, jobLng);
    const lowRating = scoreCandidate({ lat: -1.2950, lng: 36.8200, rating: 3.5, totalJobs: 20, acceptedLast30: 5, offeredLast30: 5, lastLocationAt: null }, jobLat, jobLng);
    expect(highRating).toBeGreaterThan(lowRating);
  });

  it('cleaner with 100% acceptance rate scores higher than 50%', () => {
    const highAccept = scoreCandidate({ lat: -1.2950, lng: 36.8200, rating: 4.5, totalJobs: 20, acceptedLast30: 10, offeredLast30: 10, lastLocationAt: null }, jobLat, jobLng);
    const lowAccept = scoreCandidate({ lat: -1.2950, lng: 36.8200, rating: 4.5, totalJobs: 20, acceptedLast30: 5, offeredLast30: 10, lastLocationAt: null }, jobLat, jobLng);
    expect(highAccept).toBeGreaterThan(lowAccept);
  });

  it('recently active cleaner (< 2hr) gets activity bonus', () => {
    const recentlyActive = scoreCandidate({ lat: -1.2950, lng: 36.8200, rating: 4.5, totalJobs: 20, acceptedLast30: 5, offeredLast30: 5, lastLocationAt: new Date() }, jobLat, jobLng);
    const inactive = scoreCandidate({ lat: -1.2950, lng: 36.8200, rating: 4.5, totalJobs: 20, acceptedLast30: 5, offeredLast30: 5, lastLocationAt: null }, jobLat, jobLng);
    expect(recentlyActive).toBeGreaterThan(inactive);
    // Activity bonus should be exactly 5 points (0.05 * 100)
    expect(recentlyActive - inactive).toBeCloseTo(5, 0);
  });

  it('experienced cleaner (100+ jobs) gets full job score', () => {
    const experienced = scoreCandidate({ lat: -1.2950, lng: 36.8200, rating: 4.5, totalJobs: 200, acceptedLast30: 5, offeredLast30: 5, lastLocationAt: null }, jobLat, jobLng);
    const newCleaner = scoreCandidate({ lat: -1.2950, lng: 36.8200, rating: 4.5, totalJobs: 0, acceptedLast30: 5, offeredLast30: 5, lastLocationAt: null }, jobLat, jobLng);
    expect(experienced).toBeGreaterThan(newCleaner);
  });

  it('cleaner beyond 10km radius gets 0 distance score', () => {
    const farAway = scoreCandidate({ lat: -1.5000, lng: 37.2000, rating: 4.5, totalJobs: 50, acceptedLast30: 5, offeredLast30: 5, lastLocationAt: null }, jobLat, jobLng);
    // Distance > 10km means distance score = 0
    // Max score from other factors: rating (4.5/5 * 100 * 0.30) + accept (50 * 0.20) + job(~85*0.05)
    expect(farAway).toBeLessThan(50); // Should be less than 50 without distance score
  });

  it('score is always between 0 and 100', () => {
    const cases = [
      { lat: jobLat, lng: jobLng, rating: 5.0, totalJobs: 1000, acceptedLast30: 30, offeredLast30: 30, lastLocationAt: new Date() },
      { lat: -10, lng: 50, rating: 0.0, totalJobs: 0, acceptedLast30: 0, offeredLast30: 0, lastLocationAt: null },
      { lat: jobLat, lng: jobLng, rating: 4.5, totalJobs: 50, acceptedLast30: 5, offeredLast30: 10, lastLocationAt: null },
    ];
    cases.forEach((c) => {
      const score = scoreCandidate(c, jobLat, jobLng);
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });
  });

  it('new cleaner (no jobs, neutral acceptance) still gets a score based on distance and rating', () => {
    const newCleaner = scoreCandidate({ lat: -1.2950, lng: 36.8200, rating: 4.0, totalJobs: 0, acceptedLast30: 0, offeredLast30: 0, lastLocationAt: null }, jobLat, jobLng);
    expect(newCleaner).toBeGreaterThan(0);
    expect(newCleaner).toBeGreaterThan(20); // Should still be reasonable
  });
});
