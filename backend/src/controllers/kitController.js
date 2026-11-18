const Kit = require('../models/Kit');
const kitPipeline = require('../services/pipeline/kitPipeline');
const kitBuilderService = require('../services/kitBuilder/kitBuilderService');
const { isConnected } = require('../config/db');

// In-memory kits store fallback when MongoDB is not running locally
const memoryKits = new Map();

function getUserId(req) {
  return String(req.user._id || req.user.id);
}

exports.createKit = async (req, res, next) => {
  try {
    const { jobDescription, companyUrl, companyName, location, daysAvailable } = req.body;

    if (!jobDescription || jobDescription.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Job description is required.' });
    }

    const userId = getUserId(req);

    // Run 10-stage AI pipeline
    const generatedData = await kitPipeline.generateKit({
      jobDescription,
      companyUrl,
      companyName,
      location,
      daysAvailable: parseInt(daysAvailable, 10) || 5
    });

    if (isConnected()) {
      const kit = await Kit.create({
        user: userId,
        status: 'completed',
        ...generatedData,
        practiceState: {
          completedCardIds: [],
          confidenceMap: {},
          lastPracticedAt: null
        }
      });
      return res.status(201).json({ success: true, kit });
    } else {
      const id = 'kit_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
      const kit = {
        _id: id,
        id,
        user: userId,
        status: 'completed',
        ...generatedData,
        practiceState: {
          completedCardIds: [],
          confidenceMap: {},
          lastPracticedAt: null
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      memoryKits.set(id, kit);
      return res.status(201).json({ success: true, kit });
    }
  } catch (err) {
    next(err);
  }
};

exports.listKits = async (req, res, next) => {
  try {
    const userId = getUserId(req);

    if (isConnected()) {
      const kits = await Kit.find({ user: userId })
        .select('source role schedule status createdAt updatedAt')
        .sort({ createdAt: -1 });
      return res.json({ success: true, kits });
    } else {
      const kits = Array.from(memoryKits.values())
        .filter(k => String(k.user) === userId)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      return res.json({ success: true, kits });
    }
  } catch (err) {
    next(err);
  }
};

exports.getKit = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = getUserId(req);

    let kit = null;
    if (isConnected()) {
      kit = await Kit.findOne({ _id: id, user: userId });
    } else {
      const found = memoryKits.get(id);
      if (found && String(found.user) === userId) {
        kit = found;
      }
    }

    if (!kit) {
      return res.status(404).json({ success: false, message: 'Interview kit not found or unauthorized.' });
    }

    return res.json({ success: true, kit });
  } catch (err) {
    next(err);
  }
};

exports.updateQuestion = async (req, res, next) => {
  try {
    const { id, qId } = req.params;
    const userId = getUserId(req);

    let kit = null;
    if (isConnected()) {
      kit = await Kit.findOne({ _id: id, user: userId });
    } else {
      kit = memoryKits.get(id);
      if (kit && String(kit.user) !== userId) kit = null;
    }

    if (!kit) return res.status(404).json({ success: false, message: 'Kit not found.' });

    kitBuilderService.updateQuestion(kit, qId, req.body);

    if (isConnected()) {
      kit.markModified('questions');
      kit.markModified('schedule');
      kit.markModified('coverage');
      await kit.save();
    } else {
      kit.updatedAt = new Date().toISOString();
      memoryKits.set(id, kit);
    }

    return res.json({ success: true, kit });
  } catch (err) {
    next(err);
  }
};

exports.addQuestion = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = getUserId(req);

    let kit = null;
    if (isConnected()) {
      kit = await Kit.findOne({ _id: id, user: userId });
    } else {
      kit = memoryKits.get(id);
      if (kit && String(kit.user) !== userId) kit = null;
    }

    if (!kit) return res.status(404).json({ success: false, message: 'Kit not found.' });

    kitBuilderService.addQuestion(kit, req.body);

    if (isConnected()) {
      kit.markModified('questions');
      kit.markModified('schedule');
      kit.markModified('coverage');
      await kit.save();
    } else {
      kit.updatedAt = new Date().toISOString();
      memoryKits.set(id, kit);
    }

    return res.json({ success: true, kit });
  } catch (err) {
    next(err);
  }
};

exports.deleteQuestion = async (req, res, next) => {
  try {
    const { id, qId } = req.params;
    const userId = getUserId(req);

    let kit = null;
    if (isConnected()) {
      kit = await Kit.findOne({ _id: id, user: userId });
    } else {
      kit = memoryKits.get(id);
      if (kit && String(kit.user) !== userId) kit = null;
    }

    if (!kit) return res.status(404).json({ success: false, message: 'Kit not found.' });

    kitBuilderService.deleteQuestion(kit, qId);

    if (isConnected()) {
      kit.markModified('questions');
      kit.markModified('schedule');
      kit.markModified('coverage');
      await kit.save();
    } else {
      kit.updatedAt = new Date().toISOString();
      memoryKits.set(id, kit);
    }

    return res.json({ success: true, kit });
  } catch (err) {
    next(err);
  }
};

exports.reorderQuestions = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { questionIds } = req.body;
    const userId = getUserId(req);

    if (!Array.isArray(questionIds)) {
      return res.status(400).json({ success: false, message: 'questionIds array is required.' });
    }

    let kit = null;
    if (isConnected()) {
      kit = await Kit.findOne({ _id: id, user: userId });
    } else {
      kit = memoryKits.get(id);
      if (kit && String(kit.user) !== userId) kit = null;
    }

    if (!kit) return res.status(404).json({ success: false, message: 'Kit not found.' });

    kitBuilderService.reorderQuestions(kit, questionIds);

    if (isConnected()) {
      kit.markModified('questions');
      kit.markModified('schedule');
      await kit.save();
    } else {
      kit.updatedAt = new Date().toISOString();
      memoryKits.set(id, kit);
    }

    return res.json({ success: true, kit });
  } catch (err) {
    next(err);
  }
};

exports.updateFlashcard = async (req, res, next) => {
  try {
    const { id, fId } = req.params;
    const userId = getUserId(req);

    let kit = null;
    if (isConnected()) {
      kit = await Kit.findOne({ _id: id, user: userId });
    } else {
      kit = memoryKits.get(id);
      if (kit && String(kit.user) !== userId) kit = null;
    }

    if (!kit) return res.status(404).json({ success: false, message: 'Kit not found.' });

    kitBuilderService.updateFlashcard(kit, fId, req.body);

    if (isConnected()) {
      kit.markModified('flashcards');
      await kit.save();
    } else {
      kit.updatedAt = new Date().toISOString();
      memoryKits.set(id, kit);
    }

    return res.json({ success: true, kit });
  } catch (err) {
    next(err);
  }
};

exports.addFlashcard = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = getUserId(req);

    let kit = null;
    if (isConnected()) {
      kit = await Kit.findOne({ _id: id, user: userId });
    } else {
      kit = memoryKits.get(id);
      if (kit && String(kit.user) !== userId) kit = null;
    }

    if (!kit) return res.status(404).json({ success: false, message: 'Kit not found.' });

    kitBuilderService.addFlashcard(kit, req.body);

    if (isConnected()) {
      kit.markModified('flashcards');
      await kit.save();
    } else {
      kit.updatedAt = new Date().toISOString();
      memoryKits.set(id, kit);
    }

    return res.json({ success: true, kit });
  } catch (err) {
    next(err);
  }
};

exports.deleteFlashcard = async (req, res, next) => {
  try {
    const { id, fId } = req.params;
    const userId = getUserId(req);

    let kit = null;
    if (isConnected()) {
      kit = await Kit.findOne({ _id: id, user: userId });
    } else {
      kit = memoryKits.get(id);
      if (kit && String(kit.user) !== userId) kit = null;
    }

    if (!kit) return res.status(404).json({ success: false, message: 'Kit not found.' });

    kitBuilderService.deleteFlashcard(kit, fId);

    if (isConnected()) {
      kit.markModified('flashcards');
      await kit.save();
    } else {
      kit.updatedAt = new Date().toISOString();
      memoryKits.set(id, kit);
    }

    return res.json({ success: true, kit });
  } catch (err) {
    next(err);
  }
};

exports.recordPractice = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { cardId, confidence } = req.body;
    const userId = getUserId(req);

    if (!cardId || !confidence) {
      return res.status(400).json({ success: false, message: 'cardId and confidence are required.' });
    }

    let kit = null;
    if (isConnected()) {
      kit = await Kit.findOne({ _id: id, user: userId });
    } else {
      kit = memoryKits.get(id);
      if (kit && String(kit.user) !== userId) kit = null;
    }

    if (!kit) return res.status(404).json({ success: false, message: 'Kit not found.' });

    if (!kit.practiceState) {
      kit.practiceState = { completedCardIds: [], confidenceMap: {}, lastPracticedAt: null };
    }

    // Update confidence map
    if (kit.practiceState.confidenceMap instanceof Map) {
      kit.practiceState.confidenceMap.set(cardId, confidence);
    } else {
      kit.practiceState.confidenceMap[cardId] = confidence;
    }

    // Add to completed cards if not already present
    if (!kit.practiceState.completedCardIds.includes(cardId)) {
      kit.practiceState.completedCardIds.push(cardId);
    }
    kit.practiceState.lastPracticedAt = new Date();

    if (isConnected()) {
      kit.markModified('practiceState');
      await kit.save();
    } else {
      kit.updatedAt = new Date().toISOString();
      memoryKits.set(id, kit);
    }

    return res.json({ success: true, practiceState: kit.practiceState });
  } catch (err) {
    next(err);
  }
};

exports.regenerateSection = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { section } = req.body; // 'questions' | 'flashcards' | 'company_brief' | 'schedule'
    const userId = getUserId(req);

    if (!section) {
      return res.status(400).json({ success: false, message: 'Section name is required.' });
    }

    let kit = null;
    if (isConnected()) {
      kit = await Kit.findOne({ _id: id, user: userId });
    } else {
      kit = memoryKits.get(id);
      if (kit && String(kit.user) !== userId) kit = null;
    }

    if (!kit) return res.status(404).json({ success: false, message: 'Kit not found.' });

    await kitBuilderService.regenerateSection(kit, section);

    if (isConnected()) {
      kit.markModified('questions');
      kit.markModified('flashcards');
      kit.markModified('company_brief');
      kit.markModified('schedule');
      kit.markModified('coverage');
      await kit.save();
    } else {
      kit.updatedAt = new Date().toISOString();
      memoryKits.set(id, kit);
    }

    return res.json({ success: true, kit });
  } catch (err) {
    next(err);
  }
};

exports.batchUpload = async (req, res, next) => {
  try {
    const { cases } = req.body;
    const userId = getUserId(req);

    if (!Array.isArray(cases) || cases.length === 0) {
      return res.status(400).json({ success: false, message: 'cases array is required.' });
    }

    const results = [];
    for (const c of cases) {
      try {
        const generated = await kitPipeline.generateKit({
          jobDescription: c.job_description || c.jobDescription || '',
          companyUrl: c.company_url || c.companyUrl || '',
          companyName: c.company || c.companyName || '',
          daysAvailable: c.days_available || c.daysAvailable || 5
        });

        if (isConnected()) {
          const kit = await Kit.create({
            user: userId,
            status: 'completed',
            ...generated
          });
          results.push({ success: true, id: kit._id, company: kit.source.company });
        } else {
          const id = 'kit_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
          const kit = { _id: id, id, user: userId, status: 'completed', ...generated, createdAt: new Date() };
          memoryKits.set(id, kit);
          results.push({ success: true, id, company: kit.source.company });
        }
      } catch (err) {
        results.push({ success: false, error: err.message, company: c.company || 'Unknown' });
      }
    }

    return res.json({ success: true, results });
  } catch (err) {
    next(err);
  }
};

exports.deleteKit = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = getUserId(req);

    if (isConnected()) {
      const deleted = await Kit.findOneAndDelete({ _id: id, user: userId });
      if (!deleted) return res.status(404).json({ success: false, message: 'Kit not found.' });
    } else {
      const kit = memoryKits.get(id);
      if (!kit || String(kit.user) !== userId) {
        return res.status(404).json({ success: false, message: 'Kit not found.' });
      }
      memoryKits.delete(id);
    }

    return res.json({ success: true, message: 'Kit deleted successfully.' });
  } catch (err) {
    next(err);
  }
};

