import express from 'express';
import Call from '../models/Call.js';
import { authenticate } from '../middleware/auth.js';
import { requireTenant } from '../middleware/tenant.js';
import { logAudit } from '../utils/auditLogger.js';
import * as ultravox from '../services/ultravox.js';

const router = express.Router();

// Use mock or real Ultravox API based on environment
const USE_MOCK = !process.env.ULTRAVOX_API_KEY || process.env.USE_MOCK_ULTRAVOX === 'true';

/**
 * POST /api/calls
 * Create a new test call
 */
router.post('/', authenticate, requireTenant, async (req, res, next) => {
  try {
    const { systemPrompt, model, voice } = req.body;

    // Create call via Ultravox API (or mock)
    const ultravoxCall = USE_MOCK
      ? await ultravox.mockCreateCall({ systemPrompt, model, voice })
      : await ultravox.createCall({ systemPrompt, model, voice });

    // Save call to database
    const call = await Call.create({
      tenantId: req.tenantId,
      userId: req.userId,
      ultravoxCallId: ultravoxCall.callId,
      status: ultravoxCall.status || 'queued',
      metadata: {
        joinUrl: ultravoxCall.joinUrl,
        createdAt: ultravoxCall.createdAt
      }
    });

    // Log audit
    await logAudit({
      tenantId: req.tenantId,
      userId: req.userId,
      action: 'call.created',
      details: { callId: call._id, ultravoxCallId: ultravoxCall.callId },
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.status(201).json(call);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/calls
 * Get all calls for tenant
 */
router.get('/', authenticate, requireTenant, async (req, res, next) => {
  try {
    const calls = await Call.find({ tenantId: req.tenantId })
      .populate('userId', 'email role')
      .sort({ createdAt: -1 })
      .limit(100);

    res.json(calls);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/calls/:id
 * Get specific call details
 */
router.get('/:id', authenticate, requireTenant, async (req, res, next) => {
  try {
    const call = await Call.findOne({
      _id: req.params.id,
      tenantId: req.tenantId  // Ensure tenant isolation
    }).populate('userId', 'email role');

    if (!call) {
      return res.status(404).json({ error: 'Call not found' });
    }

    res.json(call);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/calls/:id/status
 * Get real-time call status from Ultravox
 */
router.get('/:id/status', authenticate, requireTenant, async (req, res, next) => {
  try {
    const call = await Call.findOne({
      _id: req.params.id,
      tenantId: req.tenantId
    });

    if (!call) {
      return res.status(404).json({ error: 'Call not found' });
    }

    // Fetch latest status from Ultravox
    const status = USE_MOCK
      ? await ultravox.mockGetCallStatus(call.ultravoxCallId)
      : await ultravox.getCallStatus(call.ultravoxCallId);

    // Update call if status changed
    if (status.status !== call.status) {
      call.status = status.status;
      call.events.push({
        type: `status.${status.status}`,
        data: status
      });

      if (status.duration) call.duration = status.duration;
      if (status.recordingUrl) call.recordingUrl = status.recordingUrl;

      await call.save();

      // Log completed calls
      if (status.status === 'completed') {
        await logAudit({
          tenantId: req.tenantId,
          userId: req.userId,
          action: 'call.completed',
          details: { callId: call._id, duration: status.duration },
          ip: req.ip,
          userAgent: req.headers['user-agent']
        });
      }
    }

    res.json({
      callId: call._id,
      status: call.status,
      duration: call.duration,
      recordingUrl: call.recordingUrl,
      events: call.events
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/calls/:id/transcript
 * Get call transcript
 */
router.get('/:id/transcript', authenticate, requireTenant, async (req, res, next) => {
  try {
    const call = await Call.findOne({
      _id: req.params.id,
      tenantId: req.tenantId
    });

    if (!call) {
      return res.status(404).json({ error: 'Call not found' });
    }

    // If transcript already cached, return it
    if (call.transcript) {
      try {
        const parsedTranscript = JSON.parse(call.transcript);
        return res.json({ transcript: parsedTranscript });
      } catch (error) {
        return res.json({ transcript: call.transcript });
      }
    }

    // Fetch from Ultravox
    const transcriptData = USE_MOCK
      ? await ultravox.mockGetCallTranscript(call.ultravoxCallId)
      : await ultravox.getCallTranscript(call.ultravoxCallId);

    if (transcriptData) {
      call.transcript = JSON.stringify(transcriptData.transcript);
      await call.save();
      res.json(transcriptData);
    } else {
      res.json({ transcript: null, message: 'Transcript not available yet' });
    }
  } catch (error) {
    next(error);
  }
});

export default router;

