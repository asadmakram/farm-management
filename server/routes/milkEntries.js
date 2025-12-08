const express = require('express');
const {
  upsertMilkEntry,
  getMilkEntry,
  getMilkEntryById,
  listMilkEntriesByDate,
  listMilkEntriesByAnimal,
  deleteMilkEntry
} = require('../controllers/MilkEntryController');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

router.use(verifyToken);

router.post('/milk-entries', upsertMilkEntry);
router.get('/milk-entries', listMilkEntriesByDate);
router.get('/milk-entries/animal', listMilkEntriesByAnimal);
router.get('/milk-entries/:id', getMilkEntryById);
router.get('/milk-entry', getMilkEntry);
router.delete('/milk-entries/:id', deleteMilkEntry);

module.exports = router;
