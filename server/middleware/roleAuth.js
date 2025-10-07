const User = require('../models/User');

/**
 * Role-based authentication middleware
 * This middleware can be used to protect routes based on user roles
 */

// Middleware to verify user authentication and role
const requireRole = (allowedRoles) => {
  return async (req, res, next) => {
    try {
      const userId = req.body?.userId || req.query?.userId || req.params?.userId;
      
      if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
      }

      // Find user and check role
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Check if user has required role
      if (!allowedRoles.includes(user.role)) {
        return res.status(403).json({ 
          error: `Access denied. Required roles: ${allowedRoles.join(', ')}. Your role: ${user.role}` 
        });
      }

      // Add user to request object for use in route handlers
      req.user = user;
      next();

    } catch (error) {
      console.error('Role verification error:', error);
      res.status(500).json({ error: 'Error verifying user role' });
    }
  };
};

// Specific role middleware functions
const requireAdmin = requireRole(['admin']);
const requireDoctor = requireRole(['admin', 'doctor']);
const requireTherapist = requireRole(['admin', 'doctor', 'therapist']);
const requireMedicalStaff = requireRole(['admin', 'doctor', 'therapist']);

// Middleware to check if user is admin and verify password
const requireAdminWithPassword = async (req, res, next) => {
  try {
    const { adminId, adminPassword } = req.body;
    
    if (!adminId || !adminPassword) {
      return res.status(400).json({ error: 'Admin ID and password are required' });
    }

    const bcrypt = require('bcrypt');
    const adminUser = await User.findById(adminId);
    
    if (!adminUser) {
      return res.status(404).json({ error: 'Admin user not found' });
    }

    if (adminUser.role !== 'admin') {
      return res.status(403).json({ error: 'Admin privileges required' });
    }

    const validPassword = await bcrypt.compare(adminPassword, adminUser.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid admin password' });
    }

    req.admin = adminUser;
    next();

  } catch (error) {
    console.error('Admin verification error:', error);
    res.status(500).json({ error: 'Error verifying admin credentials' });
  }
};

// Middleware to get user info without role restriction
const getUserInfo = async (req, res, next) => {
  try {
    const userId = req.body.userId || req.query.userId || req.params.userId;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    req.user = user;
    next();

  } catch (error) {
    console.error('Get user info error:', error);
    res.status(500).json({ error: 'Error getting user information' });
  }
};

// Check if user has specific permissions
const hasPermission = (user, permission) => {
  const rolePermissions = {
    admin: [
      'manage_users',
      'change_roles', 
      'view_all_data',
      'manage_system',
      'access_analytics',
      'moderate_content'
    ],
    doctor: [
      'view_medical_data',
      'access_patient_info', 
      'medical_consultation',
      'create_reports'
    ],
    therapist: [
      'view_treatment_data',
      'access_patient_info',
      'treatment_planning',
      'session_management'
    ],
    user: [
      'basic_chat',
      'view_own_data',
      'request_help'
    ]
  };

  const userPermissions = rolePermissions[user.role] || [];
  return userPermissions.includes(permission);
};

// Middleware to check specific permission
const requirePermission = (permission) => {
  return async (req, res, next) => {
    try {
      const userId = req.body.userId || req.query.userId || req.params.userId;
      
      if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
      }

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      if (!hasPermission(user, permission)) {
        return res.status(403).json({ 
          error: `Access denied. Permission '${permission}' required` 
        });
      }

      req.user = user;
      next();

    } catch (error) {
      console.error('Permission check error:', error);
      res.status(500).json({ error: 'Error checking permissions' });
    }
  };
};

// Utility function to check if user can access another user's data
const canAccessUserData = (requestingUser, targetUserId) => {
  // Admins can access anyone's data
  if (requestingUser.role === 'admin') {
    return true;
  }
  
  // Doctors and therapists can access patient data (implement your logic)
  if (['doctor', 'therapist'].includes(requestingUser.role)) {
    // You might want to check if the medical staff is assigned to this patient
    return true; // For now, allow all medical staff
  }
  
  // Users can only access their own data
  return requestingUser._id.toString() === targetUserId.toString();
};

// Middleware to check data access permissions
const requireDataAccess = async (req, res, next) => {
  try {
    const requestingUserId = req.body.userId || req.query.userId;
    const targetUserId = req.params.targetUserId || req.body.targetUserId;
    
    if (!requestingUserId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const requestingUser = await User.findById(requestingUserId);
    if (!requestingUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!canAccessUserData(requestingUser, targetUserId)) {
      return res.status(403).json({ error: 'Access denied to user data' });
    }

    req.user = requestingUser;
    next();

  } catch (error) {
    console.error('Data access check error:', error);
    res.status(500).json({ error: 'Error checking data access permissions' });
  }
};

module.exports = {
  requireRole,
  requireAdmin,
  requireDoctor,
  requireTherapist,
  requireMedicalStaff,
  requireAdminWithPassword,
  getUserInfo,
  hasPermission,
  requirePermission,
  canAccessUserData,
  requireDataAccess
};