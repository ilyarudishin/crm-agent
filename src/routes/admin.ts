import express from 'express';
import groupCreationQueue from '../services/groupCreationQueue.js';

const router = express.Router();

// Webhook for completing group creation
router.post('/complete-group', async (req, res) => {
  try {
    const { queueId, groupId, groupName } = req.body;
    
    if (!queueId || !groupId) {
      return res.status(400).json({
        success: false,
        error: 'queueId and groupId are required',
      });
    }

    const result = await groupCreationQueue.markCompleted(
      queueId,
      groupId,
      groupName || `Support Group ${groupId}`
    );

    if (result.success) {
      res.json({
        success: true,
        message: 'Group creation completed successfully',
        data: result.item,
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error,
      });
    }
  } catch (error) {
    console.error('Error completing group creation:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

// Get queue status
router.get('/queue-status', (req, res) => {
  try {
    const status = groupCreationQueue.getQueueStatus();
    res.json({
      success: true,
      data: status,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;