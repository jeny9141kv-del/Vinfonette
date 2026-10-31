import { Router, Response } from 'express';
import { getDb } from '../db';
import { authenticateToken, AuthenticatedRequest } from '../auth';

const router = Router();
router.use(authenticateToken);

router.get('/metrics', (req: AuthenticatedRequest, res: Response) => {
  const db = getDb();

  const totalRegistered = (db.prepare('SELECT COUNT(*) as c FROM candidates').get() as any).c;
  const inTraining = (db.prepare("SELECT COUNT(*) as c FROM candidates WHERE current_stage = 'Training in Progress'").get() as any).c;
  const trainingCompleted = (db.prepare("SELECT COUNT(*) as c FROM candidates WHERE current_stage = 'Training Completed'").get() as any).c;
  const placementReady = (db.prepare("SELECT COUNT(*) as c FROM candidates WHERE current_stage = 'Placement Ready'").get() as any).c;
  const activeApplications = (db.prepare("SELECT COUNT(*) as c FROM job_applications WHERE status NOT IN ('Hired', 'Rejected', 'Withdrawn')").get() as any).c;

  const nowIso = new Date().toISOString();
  const upcomingInterviews = (db.prepare("SELECT COUNT(*) as c FROM interviews WHERE status IN ('scheduled', 'confirmed') AND scheduled_at >= ?").get(nowIso) as any).c;
  const offersReceived = (db.prepare("SELECT COUNT(*) as c FROM offers WHERE status IN ('RECEIVED', 'ACCEPTED')").get() as any).c;
  const placedSuccessfully = (db.prepare("SELECT COUNT(*) as c FROM candidates WHERE current_stage = 'Placed Successfully'").get() as any).c;
  const pendingFeedback = (db.prepare("SELECT COUNT(*) as c FROM interviews WHERE status = 'awaiting-feedback'").get() as any).c;
  const overdueTasks = (db.prepare("SELECT COUNT(*) as c FROM tasks WHERE status NOT IN ('Completed', 'Cancelled') AND due_date < ?").get(nowIso) as any).c;

  const ctcStats = db.prepare('SELECT AVG(ctc) as avg_ctc, MAX(ctc) as max_ctc, SUM(ctc) as sum_ctc, COUNT(*) as count FROM placements').get() as any;
  const averageCtc = ctcStats.avg_ctc ? Math.round(ctcStats.avg_ctc) : 0;
  const maxCtc = ctcStats.max_ctc || 0;
  const placementRate = totalRegistered > 0 ? Number(((placedSuccessfully / totalRegistered) * 100).toFixed(1)) : 0;

  // Breakdown by Stage
  const stageRows = db.prepare('SELECT current_stage as stage, COUNT(*) as count FROM candidates GROUP BY current_stage').all() as any[];

  // Breakdown by Batch
  const batchRows = db.prepare(`
    SELECT batch,
           COUNT(*) as total,
           SUM(CASE WHEN current_stage = 'Placed Successfully' THEN 1 ELSE 0 END) as placed,
           SUM(CASE WHEN current_stage = 'Placement Ready' THEN 1 ELSE 0 END) as ready
    FROM candidates
    GROUP BY batch
    ORDER BY batch ASC
  `).all() as any[];

  // Top hiring partner companies
  const topCompanies = db.prepare(`
    SELECT c.name, COUNT(p.id) as placements_count, AVG(p.ctc) as avg_package
    FROM placements p
    JOIN companies c ON p.company_id = c.id
    GROUP BY c.id
    ORDER BY placements_count DESC
    LIMIT 5
  `).all() as any[];

  res.json({
    metrics: {
      totalRegistered,
      inTraining,
      trainingCompleted,
      placementReady,
      activeApplications,
      upcomingInterviews,
      offersReceived,
      placedSuccessfully,
      pendingFeedback,
      overdueTasks,
      averageCtc,
      maxCtc,
      placementRate,
    },
    stageBreakdown: stageRows,
    batchBreakdown: batchRows,
    topCompanies,
  });
});

export default router;
