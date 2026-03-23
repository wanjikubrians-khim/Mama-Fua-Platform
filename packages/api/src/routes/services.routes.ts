// Mama Fua — Services Routes
// KhimTech | 2026

import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '@mama-fua/database';
const router = Router();

// GET /services — list all active services
router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const services = await prisma.service.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
    res.json({ success: true, data: services });
  } catch (err) { next(err); }
});

// GET /services/:id
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const service = await prisma.service.findUnique({ where: { id: req.params['id'] } });
    if (!service) { res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Service not found' } }); return; }
    res.json({ success: true, data: service });
  } catch (err) { next(err); }
});

export default router;
