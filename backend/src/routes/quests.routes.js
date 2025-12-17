import express from 'express';
import {
  getQuests,
  createQuest,
  toggleStepCompletion,
  chatWithStep
} from '../controllers/quests.controller.js';

const router = express.Router();

router.get('/quests', getQuests);
router.post('/quests', createQuest);
router.patch('/quests/:id/step/:stepIndex', toggleStepCompletion);
router.post('/quests/:id/step/:stepIndex/chat', chatWithStep);

export default router;
