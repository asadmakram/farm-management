const express = require('express');
const router = express.Router();
const Contract = require('../models/Contract');
const auth = require('../middleware/auth');

// Get all contracts for the authenticated user
router.get('/', auth, async (req, res) => {
  try {
    const { status } = req.query;
    const filter = { userId: req.user.id };
    
    if (status) {
      filter.status = status;
    }
    
    const contracts = await Contract.find(filter).sort({ startDate: -1 });
    
    // Calculate summary (using base currency for consistent reporting)
    const summary = {
      active: await Contract.countDocuments({ userId: req.user.id, status: 'active' }),
      totalAdvanceHeld: 0,
      totalAdvanceReturned: 0
    };

    const allContracts = await Contract.find({ userId: req.user.id });
    allContracts.forEach(contract => {
      if (contract.advanceStatus === 'held') {
        summary.totalAdvanceHeld += contract.advanceAmountBase || contract.advanceAmount;
      } else if (contract.advanceStatus === 'returned') {
        summary.totalAdvanceReturned += contract.advanceAmountBase || contract.advanceAmount;
      }
    });
    
    res.json({ contracts, summary });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching contracts', error: error.message });
  }
});

// Create a new contract
router.post('/', auth, async (req, res) => {
  try {
    const contractData = {
      ...req.body,
      userId: req.user.id
    };

    // Set default currency if not provided
    if (!contractData.currency) {
      contractData.currency = 'INR';
      contractData.exchangeRate = 1;
    }

    const contract = new Contract(contractData);
    await contract.save();
    res.status(201).json(contract);
  } catch (error) {
    res.status(400).json({ message: 'Error creating contract', error: error.message });
  }
});

// Update a contract
router.put('/:id', auth, async (req, res) => {
  try {
    const contract = await Contract.findOne({ _id: req.params.id, userId: req.user.id });
    
    if (!contract) {
      return res.status(404).json({ message: 'Contract not found' });
    }
    
    Object.assign(contract, req.body);
    await contract.save();
    res.json(contract);
  } catch (error) {
    res.status(400).json({ message: 'Error updating contract', error: error.message });
  }
});

// Return advance for a contract
router.patch('/:id/return-advance', auth, async (req, res) => {
  try {
    const contract = await Contract.findOne({ _id: req.params.id, userId: req.user.id });
    
    if (!contract) {
      return res.status(404).json({ message: 'Contract not found' });
    }
    
    contract.advanceStatus = 'returned';
    contract.advanceReturnedDate = new Date();
    contract.status = 'completed';
    await contract.save();
    
    res.json(contract);
  } catch (error) {
    res.status(400).json({ message: 'Error returning advance', error: error.message });
  }
});

// Delete a contract
router.delete('/:id', auth, async (req, res) => {
  try {
    const contract = await Contract.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    
    if (!contract) {
      return res.status(404).json({ message: 'Contract not found' });
    }
    
    res.json({ message: 'Contract deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting contract', error: error.message });
  }
});

module.exports = router;
