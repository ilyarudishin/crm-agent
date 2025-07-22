import express from 'express';
import { processNewLead } from '../services/leadProcessor.js';

const router = express.Router();

router.post('/lead', async (req, res) => {
  try {
    const leadData = req.body;
    
    if (!leadData.email) {
      return res.status(400).json({
        success: false,
        error: 'Email is required',
      });
    }

    const result = await processNewLead(leadData);
    
    if (result.success) {
      res.status(200).json({
        success: true,
        message: 'Lead processed successfully',
        data: result,
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error,
      });
    }
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'CRM Agent is running',
    timestamp: new Date().toISOString(),
  });
});

export default router;