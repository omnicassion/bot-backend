// filepath: medical-chatbot/server/routes/auth.js
const express = require('express');
const bcrypt = require('bcrypt');
const User = require('../models/User');
const RoleChangeRequest = require('../models/RoleChangeRequest');

const router = express.Router();

// User registration endpoint
router.post('/register', async (req, res) => {
  try {
    const { username, password, role,email } = req.body;

   

    // Check if user already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
console.log(req.body)
    const user = new User({ ...req.body, password: hashedPassword });
    await user.save();

    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error registering user' });
  }
});
// User login endpoint
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const user = await User.findOne({ username });

    if (!user) {
      return res.status(400).json({ error: 'User not found' });
    }

    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return res.status(400).json({ error: 'Invalid password' });
    }

    res.json({
      message: 'Login successful',
      id: user._id,
      username: user.username,
      role: user.role,
      timestamp: new Date()
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error logging in user' });
  }
});

// Change user role endpoint (admin only)
router.put('/change-role', async (req, res) => {
  try {
    const { adminId, targetUserId, newRole, adminPassword } = req.body;

    // Validate required fields
    if (!adminId || !targetUserId || !newRole || !adminPassword) {
      return res.status(400).json({ 
        error: 'Admin ID, target user ID, new role, and admin password are required' 
      });
    }

    // Validate new role
    const validRoles = ['admin', 'doctor', 'user', 'therapist'];
    if (!validRoles.includes(newRole)) {
      return res.status(400).json({ 
        error: 'Invalid role. Valid roles are: admin, doctor, user, therapist' 
      });
    }

    // Verify admin user exists and is admin
    const adminUser = await User.findById(adminId);
    if (!adminUser) {
      return res.status(404).json({ error: 'Admin user not found' });
    }

    if (adminUser.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can change user roles' });
    }

    // Verify admin password
    const validAdminPassword = await bcrypt.compare(adminPassword, adminUser.password);
    if (!validAdminPassword) {
      return res.status(401).json({ error: 'Invalid admin password' });
    }

    // Find target user
    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      return res.status(404).json({ error: 'Target user not found' });
    }

    // Prevent admin from changing their own role (safety measure)
    if (adminId === targetUserId) {
      return res.status(400).json({ error: 'Admins cannot change their own role' });
    }

    // Store old role for logging
    const oldRole = targetUser.role;

    // Update user role
    targetUser.role = newRole;
    await targetUser.save();

    res.json({
      message: 'User role changed successfully',
      user: {
        id: targetUser._id,
        username: targetUser.username,
        oldRole: oldRole,
        newRole: newRole
      },
      changedBy: adminUser.username,
      timestamp: new Date()
    });

  } catch (error) {
    console.error('Error changing user role:', error);
    res.status(500).json({ error: 'Error changing user role' });
  }
});

// Get user role endpoint
router.get('/role/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId).select('username role email');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role
    });

  } catch (error) {
    console.error('Error fetching user role:', error);
    res.status(500).json({ error: 'Error fetching user role' });
  }
});

// Self role change request endpoint (users can request role changes)
router.post('/request-role-change', async (req, res) => {
  try {
    const { userId, requestedRole, reason, password } = req.body;

    // Validate required fields
    if (!userId || !requestedRole || !reason || !password) {
      return res.status(400).json({ 
        error: 'User ID, requested role, reason, and password are required' 
      });
    }

    // Validate requested role
    const validRoles = ['doctor', 'therapist']; // Users can only request to become doctor or therapist
    if (!validRoles.includes(requestedRole)) {
      return res.status(400).json({ 
        error: 'Invalid role request. Users can only request doctor or therapist roles' 
      });
    }

    // Find and verify user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify user password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid password' });
    }

    // Check if user already has the requested role
    if (user.role === requestedRole) {
      return res.status(400).json({ error: 'User already has the requested role' });
    }

    // Check if user already has a pending request
    const existingRequest = await RoleChangeRequest.findOne({ 
      userId: userId, 
      status: 'pending' 
    });

    if (existingRequest) {
      return res.status(400).json({ 
        error: 'You already have a pending role change request' 
      });
    }

    // Create new role change request
    const roleChangeRequest = new RoleChangeRequest({
      userId: user._id,
      username: user.username,
      currentRole: user.role,
      requestedRole,
      reason
    });

    await roleChangeRequest.save();

    res.json({
      message: 'Role change request submitted successfully. An admin will review your request.',
      request: {
        id: roleChangeRequest._id,
        username: user.username,
        currentRole: user.role,
        requestedRole,
        reason,
        status: 'pending',
        createdAt: roleChangeRequest.createdAt
      }
    });

  } catch (error) {
    console.error('Error submitting role change request:', error);
    res.status(500).json({ error: 'Error submitting role change request' });
  }
});

// Get all users with their roles (admin only)
router.get('/users', async (req, res) => {
  try {
    const { adminId } = req.query;

    if (!adminId) {
      return res.status(400).json({ error: 'Admin ID is required' });
    }

    // Verify admin user
    const adminUser = await User.findById(adminId);
    if (!adminUser || adminUser.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can view all users' });
    }

    // Get all users (excluding passwords)
    const users = await User.find({}).select('-password').sort({ username: 1 });

    res.json({
      users: users.map(user => ({
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role
      })),
      total: users.length,
      timestamp: new Date()
    });

  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Error fetching users' });
  }
});

// Get all role change requests (admin only)
router.get('/role-requests', async (req, res) => {
  try {
    const { adminId, status } = req.query;

    if (!adminId) {
      return res.status(400).json({ error: 'Admin ID is required' });
    }

    // Verify admin user
    const adminUser = await User.findById(adminId);
    if (!adminUser || adminUser.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can view role change requests' });
    }

    // Build query filter
    const filter = {};
    if (status && ['pending', 'approved', 'rejected'].includes(status)) {
      filter.status = status;
    }

    // Get role change requests
    const requests = await RoleChangeRequest.find(filter)
      .populate('reviewedBy', 'username')
      .sort({ createdAt: -1 });

    res.json({
      requests: requests.map(request => ({
        id: request._id,
        userId: request.userId,
        username: request.username,
        currentRole: request.currentRole,
        requestedRole: request.requestedRole,
        reason: request.reason,
        status: request.status,
        reviewedBy: request.reviewedBy ? request.reviewedBy.username : null,
        reviewedAt: request.reviewedAt,
        reviewNotes: request.reviewNotes,
        createdAt: request.createdAt
      })),
      total: requests.length,
      timestamp: new Date()
    });

  } catch (error) {
    console.error('Error fetching role change requests:', error);
    res.status(500).json({ error: 'Error fetching role change requests' });
  }
});

// Approve or reject role change request (admin only)
router.put('/role-request/:requestId', async (req, res) => {
  try {
    const { requestId } = req.params;
    const { adminId, action, reviewNotes, adminPassword } = req.body;

    // Validate required fields
    if (!adminId || !action || !adminPassword) {
      return res.status(400).json({ 
        error: 'Admin ID, action, and admin password are required' 
      });
    }

    // Validate action
    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ 
        error: 'Action must be either "approve" or "reject"' 
      });
    }

    // Verify admin user
    const adminUser = await User.findById(adminId);
    if (!adminUser || adminUser.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can review role change requests' });
    }

    // Verify admin password
    const validAdminPassword = await bcrypt.compare(adminPassword, adminUser.password);
    if (!validAdminPassword) {
      return res.status(401).json({ error: 'Invalid admin password' });
    }

    // Find the role change request
    const request = await RoleChangeRequest.findById(requestId);
    if (!request) {
      return res.status(404).json({ error: 'Role change request not found' });
    }

    // Check if request is still pending
    if (request.status !== 'pending') {
      return res.status(400).json({ 
        error: `Request has already been ${request.status}` 
      });
    }

    // Update request status
    request.status = action === 'approve' ? 'approved' : 'rejected';
    request.reviewedBy = adminUser._id;
    request.reviewedAt = new Date();
    if (reviewNotes) {
      request.reviewNotes = reviewNotes;
    }

    await request.save();

    // If approved, update user role
    if (action === 'approve') {
      const targetUser = await User.findById(request.userId);
      if (targetUser) {
        targetUser.role = request.requestedRole;
        await targetUser.save();
      }
    }

    res.json({
      message: `Role change request ${action === 'approve' ? 'approved' : 'rejected'} successfully`,
      request: {
        id: request._id,
        username: request.username,
        currentRole: request.currentRole,
        requestedRole: request.requestedRole,
        status: request.status,
        reviewedBy: adminUser.username,
        reviewedAt: request.reviewedAt,
        reviewNotes: request.reviewNotes
      },
      userRoleUpdated: action === 'approve',
      timestamp: new Date()
    });

  } catch (error) {
    console.error('Error reviewing role change request:', error);
    res.status(500).json({ error: 'Error reviewing role change request' });
  }
});

// Get user's own role change requests
router.get('/my-role-requests/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    // Verify user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get user's role change requests
    const requests = await RoleChangeRequest.find({ userId })
      .populate('reviewedBy', 'username')
      .sort({ createdAt: -1 });

    res.json({
      requests: requests.map(request => ({
        id: request._id,
        currentRole: request.currentRole,
        requestedRole: request.requestedRole,
        reason: request.reason,
        status: request.status,
        reviewedBy: request.reviewedBy ? request.reviewedBy.username : null,
        reviewedAt: request.reviewedAt,
        reviewNotes: request.reviewNotes,
        createdAt: request.createdAt
      })),
      total: requests.length,
      timestamp: new Date()
    });

  } catch (error) {
    console.error('Error fetching user role requests:', error);
    res.status(500).json({ error: 'Error fetching user role requests' });
  }
});

// Update user profile endpoint
router.put('/profile', async (req, res) => {
  try {
    const { userId, username, email, currentPassword, newPassword } = req.body;

    // Validate required fields
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    if (!username) {
      return res.status(400).json({ error: 'Username is required' });
    }

    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if username is already taken by another user
    if (username !== user.username) {
      const existingUser = await User.findOne({ username, _id: { $ne: userId } });
      if (existingUser) {
        return res.status(400).json({ error: 'Username already exists' });
      }
    }

    // Prepare update data
    const updateData = {
      username,
      email: email || user.email
    };

    // Handle password change
    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ error: 'Current password is required to change password' });
      }

      // Verify current password
      const validCurrentPassword = await bcrypt.compare(currentPassword, user.password);
      if (!validCurrentPassword) {
        return res.status(400).json({ error: 'Current password is incorrect' });
      }

      // Validate new password strength
      if (newPassword.length < 6) {
        return res.status(400).json({ error: 'New password must be at least 6 characters long' });
      }

      // Hash new password
      updateData.password = await bcrypt.hash(newPassword, 10);
    }

    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    // Update localStorage data structure
    const responseData = {
      message: 'Profile updated successfully',
      user: {
        id: updatedUser._id,
        username: updatedUser.username,
        email: updatedUser.email,
        role: updatedUser.role
      }
    };

    res.json(responseData);

  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ error: 'Error updating profile' });
  }
});

// Change password endpoint
router.put('/change-password', async (req, res) => {
  try {
    const { userId, currentPassword, newPassword } = req.body;

    // Validate required fields
    if (!userId || !currentPassword || !newPassword) {
      return res.status(400).json({ 
        error: 'User ID, current password, and new password are required' 
      });
    }

    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify current password
    const validCurrentPassword = await bcrypt.compare(currentPassword, user.password);
    if (!validCurrentPassword) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    // Validate new password strength
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters long' });
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await User.findByIdAndUpdate(userId, { password: hashedNewPassword });

    res.json({ message: 'Password changed successfully' });

  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({ error: 'Error changing password' });
  }
});

module.exports = router;