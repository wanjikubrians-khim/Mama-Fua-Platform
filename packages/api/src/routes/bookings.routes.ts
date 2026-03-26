// Mama Fua — Booking Routes
// KhimTech | 2026

import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authenticate, requireRole } from '../middleware/auth';
import * as BookingService from '../services/booking.service';

const router = Router();
router.use(authenticate);

const createSchema = z.object({
  serviceId: z.string().uuid(),
  mode: z.enum(['AUTO_ASSIGN', 'BROWSE_PICK', 'POST_BID']),
  cleanerId: z.string().uuid().optional(),
  addressId: z.string().uuid().optional(),
  address: z
    .object({
      label: z.string(),
      addressLine1: z.string(),
      addressLine2: z.string().optional(),
      area: z.string(),
      city: z.string().optional(),
      county: z.string().optional(),
      lat: z.number(),
      lng: z.number(),
      instructions: z.string().optional(),
      saveAddress: z.boolean().optional(),
    })
    .optional(),
  scheduledAt: z.string().datetime(),
  bookingType: z.enum(['ONE_OFF', 'RECURRING']).default('ONE_OFF'),
  recurringFrequency: z.enum(['WEEKLY', 'BIWEEKLY', 'MONTHLY']).optional(),
  specialInstructions: z.string().max(1000).optional(),
  paymentMethod: z.enum(['MPESA', 'STRIPE_CARD', 'WALLET', 'CASH']),
  mpesaPhone: z.string().optional(),
});

// POST /bookings
router.post('/', requireRole('CLIENT'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = createSchema.parse(req.body);
    const booking = await BookingService.createBooking(req.user!.sub, body);
    res.status(201).json({ success: true, data: booking });
  } catch (err) {
    next(err);
  }
});

// GET /bookings
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const query = z
      .object({
        status: z.string().optional(),
        page: z.coerce.number().default(1),
        pageSize: z.coerce.number().max(50).default(20),
      })
      .parse(req.query);
    const result = await BookingService.listBookings(req.user!.sub, req.user!.role, query);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
});

// GET /bookings/:id
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const booking = await BookingService.getBooking(
      req.params['id']!,
      req.user!.sub,
      req.user!.role
    );
    res.json({ success: true, data: booking });
  } catch (err) {
    next(err);
  }
});

// GET /bookings/:id/tracking
router.get('/:id/tracking', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tracking = await BookingService.getBookingTracking(
      req.params['id']!,
      req.user!.sub,
      req.user!.role
    );
    res.json({ success: true, data: tracking });
  } catch (err) {
    next(err);
  }
});

// POST /bookings/:id/accept  (CLEANER)
router.post(
  '/:id/accept',
  requireRole('CLEANER'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const booking = await BookingService.acceptBooking(req.params['id']!, req.user!.sub);
      res.json({ success: true, data: booking });
    } catch (err) {
      next(err);
    }
  }
);

// POST /bookings/:id/decline  (CLEANER)
router.post(
  '/:id/decline',
  requireRole('CLEANER'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { reason } = z.object({ reason: z.string().optional() }).parse(req.body);
      await BookingService.declineBooking(req.params['id']!, req.user!.sub, reason);
      res.json({ success: true, data: { message: 'Booking declined' } });
    } catch (err) {
      next(err);
    }
  }
);

// POST /bookings/:id/start  (CLEANER)
router.post(
  '/:id/start',
  requireRole('CLEANER'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const booking = await BookingService.startBooking(req.params['id']!, req.user!.sub);
      res.json({ success: true, data: booking });
    } catch (err) {
      next(err);
    }
  }
);

// POST /bookings/:id/complete  (CLEANER)
router.post(
  '/:id/complete',
  requireRole('CLEANER'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const booking = await BookingService.completeBooking(req.params['id']!, req.user!.sub);
      res.json({ success: true, data: booking });
    } catch (err) {
      next(err);
    }
  }
);

// POST /bookings/:id/confirm  (CLIENT)
router.post(
  '/:id/confirm',
  requireRole('CLIENT'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const booking = await BookingService.confirmBooking(req.params['id']!, req.user!.sub);
      res.json({ success: true, data: booking });
    } catch (err) {
      next(err);
    }
  }
);

// PATCH /bookings/:id/cancel
router.patch('/:id/cancel', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { reason } = z.object({ reason: z.string().optional() }).parse(req.body);
    const booking = await BookingService.cancelBooking(
      req.params['id']!,
      req.user!.sub,
      req.user!.role,
      reason
    );
    res.json({ success: true, data: booking });
  } catch (err) {
    next(err);
  }
});

// POST /bookings/:id/dispute  (CLIENT)
router.post(
  '/:id/dispute',
  requireRole('CLIENT'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const body = z
        .object({
          reason: z.string().min(1),
          description: z.string().min(10),
          evidenceUrls: z.array(z.string().url()).optional(),
        })
        .parse(req.body);
      const dispute = await BookingService.raiseDispute(req.params['id']!, req.user!.sub, body);
      res.status(201).json({ success: true, data: dispute });
    } catch (err) {
      next(err);
    }
  }
);

// GET /bookings/:id/chat
router.get('/:id/chat', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const query = z
      .object({
        cursor: z.string().optional(),
        limit: z.coerce.number().max(50).default(30),
      })
      .parse(req.query);
    const messages = await BookingService.getChatMessages(req.params['id']!, req.user!.sub, query);
    res.json({ success: true, data: messages });
  } catch (err) {
    next(err);
  }
});

// POST /bookings/:id/bids  (CLEANER)
router.post(
  '/:id/bids',
  requireRole('CLEANER'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const body = z
        .object({
          proposedAmount: z.number().int().positive(),
          estimatedDuration: z.number().int().positive(),
          message: z.string().max(500).optional(),
        })
        .parse(req.body);
      const bid = await BookingService.submitBid(req.params['id']!, req.user!.sub, body);
      res.status(201).json({ success: true, data: bid });
    } catch (err) {
      next(err);
    }
  }
);

// GET /bookings/:id/bids  (CLIENT)
router.get(
  '/:id/bids',
  requireRole('CLIENT'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const bids = await BookingService.listBids(req.params['id']!, req.user!.sub);
      res.json({ success: true, data: bids });
    } catch (err) {
      next(err);
    }
  }
);

// POST /bookings/:id/bids/:bidId/accept  (CLIENT)
router.post(
  '/:id/bids/:bidId/accept',
  requireRole('CLIENT'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const booking = await BookingService.acceptBid(
        req.params['id']!,
        req.params['bidId']!,
        req.user!.sub
      );
      res.json({ success: true, data: booking });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
