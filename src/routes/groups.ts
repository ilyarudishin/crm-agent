import express, { Request, Response } from 'express';

const router = express.Router();

// We'll need to access the smart group assistant instance
let smartGroupAssistantInstance: any = null;

export const setSmartGroupAssistant = (instance: any) => {
  smartGroupAssistantInstance = instance;
};

router.get('/active', (req: Request, res: Response) => {
  try {
    if (!smartGroupAssistantInstance) {
      return res.status(503).json({
        success: false,
        error: 'Smart Group Assistant not initialized',
      });
    }

    const activeGroups = smartGroupAssistantInstance.getActiveGroups();
    
    res.json({
      success: true,
      data: {
        total: activeGroups.length,
        groups: activeGroups.map((group: any) => ({
          chatId: group.chatId,
          title: group.chatTitle,
          created: group.createdAt,
          lastActivity: group.lastActivity,
          status: group.status
        }))
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error fetching active groups',
    });
  }
});

router.get('/health', (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Group management API is running',
    timestamp: new Date().toISOString(),
  });
});

export default router;