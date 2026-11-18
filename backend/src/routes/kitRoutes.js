const express = require('express');
const router = express.Router();
const kitController = require('../controllers/kitController');
const { authenticateToken } = require('../middleware/auth');

// All kit routes require authentication
router.use(authenticateToken);

router.post('/', kitController.createKit);
router.get('/', kitController.listKits);
router.post('/batch', kitController.batchUpload);
router.get('/:id', kitController.getKit);
router.delete('/:id', kitController.deleteKit);

// Kit Builder & Editing
router.put('/:id/questions/:qId', kitController.updateQuestion);
router.post('/:id/questions', kitController.addQuestion);
router.delete('/:id/questions/:qId', kitController.deleteQuestion);
router.put('/:id/questions-reorder', kitController.reorderQuestions);

// Flashcard Editing & Practice
router.put('/:id/flashcards/:fId', kitController.updateFlashcard);
router.post('/:id/flashcards', kitController.addFlashcard);
router.delete('/:id/flashcards/:fId', kitController.deleteFlashcard);
router.post('/:id/practice', kitController.recordPractice);

// Section Regeneration (with edit preservation)
router.post('/:id/regenerate', kitController.regenerateSection);

module.exports = router;

