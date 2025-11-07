const express = require('express');
const { v4: uuidv4 } = require('uuid');
const Policy = require('../models/Policy');
const User = require('../models/User');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// Simulate fraud check - random boolean generator
const simulateFraudCheck = () => {
  // 80% chance of passing fraud check
  return Math.random() > 0.2;
};

// Generate unique policy ID
const generatePolicyId = () => {
  return `POL-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
};

// Get all policies (with role-based filtering)
router.get('/', authenticateToken, async (req, res) => {
  try {
    let query = {};
    
    // Creators can only see their own policies
    if (req.user.role === 'creator') {
      query.createdBy = req.user._id;
    }
    
    const policies = await Policy.find(query)
      .populate('createdBy', 'name username')
      .sort({ createdAt: -1 });

    res.json(policies);
  } catch (error) {
    console.error('Error fetching policies:', error);
    res.status(500).json({ message: 'Error fetching policies' });
  }
});

// Get single policy
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const policy = await Policy.findById(req.params.id)
      .populate('createdBy', 'name username');

    if (!policy) {
      return res.status(404).json({ message: 'Policy not found' });
    }

    // Check if user has permission to view this policy
    if (req.user.role === 'creator' && policy.createdBy._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(policy);
  } catch (error) {
    console.error('Error fetching policy:', error);
    res.status(500).json({ message: 'Error fetching policy' });
  }
});

// Create new policy
router.post('/', authenticateToken, requireRole(['creator']), async (req, res) => {
  try {
    const { customerName, premiumAmount, productType } = req.body;

    // Validate required fields
    if (!customerName || !premiumAmount || !productType) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Simulate fraud check
    const fraudCheckPassed = simulateFraudCheck();
    
    const policy = new Policy({
      policyId: generatePolicyId(),
      customerName,
      premiumAmount,
      productType,
      createdBy: req.user._id,
      creatorName: req.user.name,
      fraudCheck: {
        passed: fraudCheckPassed,
        checkedAt: new Date()
      },
      status: fraudCheckPassed ? 'pending_underwriter' : 'rejected'
    });

    await policy.save();

    // Console notification
    console.log(`📋 New Policy Created: ${policy.policyId}`);
    console.log(`👤 Customer: ${customerName}`);
    console.log(`💰 Premium: $${premiumAmount}`);
    console.log(`🏷️ Product: ${productType}`);
    console.log(`🔍 Fraud Check: ${fraudCheckPassed ? 'PASSED ✅' : 'FAILED ❌'}`);
    console.log(`📊 Status: ${policy.status}`);
    
    if (fraudCheckPassed) {
      console.log(`📬 Notification: Policy sent to Underwriter for review`);
    } else {
      console.log(`❌ Policy rejected due to fraud check failure`);
    }

    res.status(201).json(policy);
  } catch (error) {
    console.error('Error creating policy:', error);
    res.status(500).json({ message: 'Error creating policy' });
  }
});

// Update policy (creator can update before manager approval, manager can update when pending_manager)
router.put('/:id', authenticateToken, requireRole(['creator', 'manager']), async (req, res) => {
  try {
    const policy = await Policy.findById(req.params.id);

    if (!policy) {
      return res.status(404).json({ message: 'Policy not found' });
    }

    // Creator can update if policy belongs to them and status is draft or pending_underwriter
    if (req.user.role === 'creator') {
      if (policy.createdBy.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Access denied' });
      }
      
      // Creator can update before manager approval (draft or pending_underwriter)
      if (policy.status !== 'draft' && policy.status !== 'pending_underwriter') {
        return res.status(400).json({ message: 'Policy cannot be updated after manager approval' });
      }
    }

    // Manager can update if status is pending_manager (before final approval)
    if (req.user.role === 'manager') {
      if (policy.status !== 'pending_manager') {
        return res.status(400).json({ message: 'Policy can only be updated when pending manager review' });
      }
    }

    const { customerName, premiumAmount, productType } = req.body;

    // Update fields
    if (customerName) policy.customerName = customerName;
    if (premiumAmount) policy.premiumAmount = premiumAmount;
    if (productType) policy.productType = productType;

    await policy.save();

    console.log(`✏️ Policy Updated: ${policy.policyId} by ${req.user.name} (${req.user.role})`);

    res.json(policy);
  } catch (error) {
    console.error('Error updating policy:', error);
    res.status(500).json({ message: 'Error updating policy' });
  }
});

// Submit policy for approval
router.post('/:id/submit', authenticateToken, requireRole(['creator']), async (req, res) => {
  try {
    const policy = await Policy.findById(req.params.id);

    if (!policy) {
      return res.status(404).json({ message: 'Policy not found' });
    }

    // Check if policy belongs to the creator
    if (policy.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Check if policy can be submitted
    if (policy.status !== 'draft') {
      return res.status(400).json({ message: 'Policy has already been submitted' });
    }

    // Check fraud check status
    if (!policy.fraudCheck.passed) {
      return res.status(400).json({ message: 'Policy failed fraud check and cannot be submitted' });
    }

    // Update status to pending underwriter
    policy.status = 'pending_underwriter';
    await policy.save();

    console.log(`📤 Policy Submitted: ${policy.policyId}`);
    console.log(`📬 Notification: Policy sent to Underwriter for review`);

    res.json(policy);
  } catch (error) {
    console.error('Error submitting policy:', error);
    res.status(500).json({ message: 'Error submitting policy' });
  }
});

// Approve/Reject policy (Underwriter and Manager)
router.post('/:id/approve', authenticateToken, requireRole(['underwriter', 'manager']), async (req, res) => {
  try {
    const { action, comment = '' } = req.body; // action: 'approve' or 'reject'

    if (!action || !['approve', 'reject'].includes(action)) {
      return res.status(400).json({ message: 'Invalid action. Must be "approve" or "reject"' });
    }

    const policy = await Policy.findById(req.params.id);

    if (!policy) {
      return res.status(404).json({ message: 'Policy not found' });
    }

    // Check if policy is in correct status for current user role
    const expectedStatus = req.user.role === 'underwriter' ? 'pending_underwriter' : 'pending_manager';
    if (policy.status !== expectedStatus) {
      return res.status(400).json({ 
        message: `Policy is not in ${expectedStatus} status` 
      });
    }

    // Add approval log
    const approvalLog = {
      approverId: req.user._id,
      approverName: req.user.name,
      action: action === 'approve' ? 'approved' : 'rejected',
      comment,
      timestamp: new Date()
    };

    policy.approvalLogs.push(approvalLog);

    // Update policy status based on action and current approver
    if (action === 'approve') {
      if (req.user.role === 'underwriter') {
        policy.status = 'pending_manager';
        console.log(`✅ Underwriter Approval: ${policy.policyId} by ${req.user.name}`);
        console.log(`📬 Notification: Policy sent to Manager for final review`);
      } else if (req.user.role === 'manager') {
        policy.status = 'approved';
        console.log(`🎉 Final Approval: ${policy.policyId} by ${req.user.name}`);
        console.log(`📬 Notification: Policy fully approved and ready for processing`);
      }
    } else {
      policy.status = 'rejected';
      console.log(`❌ Policy Rejected: ${policy.policyId} by ${req.user.name}`);
      console.log(`📬 Notification: Policy rejected - ${comment || 'No comment provided'}`);
    }

    await policy.save();

    res.json(policy);
  } catch (error) {
    console.error('Error processing approval:', error);
    res.status(500).json({ message: 'Error processing approval' });
  }
});

// Delete policy (creator can delete before manager approval, manager can delete when they've approved)
router.delete('/:id', authenticateToken, requireRole(['creator', 'manager']), async (req, res) => {
  try {
    const policy = await Policy.findById(req.params.id);

    if (!policy) {
      return res.status(404).json({ message: 'Policy not found' });
    }

    // Creator can delete if policy belongs to them and manager hasn't approved yet
    if (req.user.role === 'creator') {
      if (policy.createdBy.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Access denied' });
      }
      
      // Creator can delete only if status is draft or pending_underwriter (before manager approval)
      if (policy.status !== 'draft' && policy.status !== 'pending_underwriter') {
        return res.status(400).json({ message: 'Policy cannot be deleted after manager approval. Only manager can delete at this stage.' });
      }
    }

    // Manager can delete if status is pending_manager or approved (when they have approved)
    if (req.user.role === 'manager') {
      if (policy.status !== 'pending_manager' && policy.status !== 'approved') {
        return res.status(400).json({ message: 'Policy can only be deleted when pending manager review or after manager approval' });
      }
    }

    await Policy.findByIdAndDelete(req.params.id);

    console.log(`🗑️ Policy Deleted: ${policy.policyId} by ${req.user.name} (${req.user.role})`);

    res.json({ message: 'Policy deleted successfully' });
  } catch (error) {
    console.error('Error deleting policy:', error);
    res.status(500).json({ message: 'Error deleting policy' });
  }
});

module.exports = router;
