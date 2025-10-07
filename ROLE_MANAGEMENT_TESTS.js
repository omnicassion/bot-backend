/**
 * Role Management System Test Examples
 * 
 * This file contains examples of how to test the role management endpoints
 */

// Test data
const testData = {
  admin: {
    id: "admin_user_id",
    username: "admin",
    password: "admin_password"
  },
  user: {
    id: "regular_user_id", 
    username: "john_doe",
    password: "user_password"
  }
};

// 1. Test user registration with different roles
const testRegistration = async () => {
  const users = [
    {
      username: "doctor_smith",
      email: "doctor@hospital.com",
      password: "secure123",
      role: "user" // Will request role change later
    },
    {
      username: "therapist_jane",
      email: "therapist@hospital.com", 
      password: "secure123",
      role: "user"
    }
  ];

  for (const userData of users) {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });
      
      const result = await response.json();
      console.log(`Registration ${userData.username}:`, result);
    } catch (error) {
      console.error('Registration error:', error);
    }
  }
};

// 2. Test role change request
const testRoleChangeRequest = async () => {
  const requestData = {
    userId: testData.user.id,
    requestedRole: "doctor",
    reason: "I am a licensed medical doctor with 10 years of experience in oncology. I would like access to enhanced features to better assist patients.",
    password: testData.user.password
  };

  try {
    const response = await fetch('/api/auth/request-role-change', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestData)
    });
    
    const result = await response.json();
    console.log('Role change request:', result);
    return result.request?.id; // Return request ID for approval test
  } catch (error) {
    console.error('Role change request error:', error);
  }
};

// 3. Test admin viewing role requests
const testViewRoleRequests = async () => {
  try {
    const response = await fetch(`/api/auth/role-requests?adminId=${testData.admin.id}&status=pending`);
    const result = await response.json();
    console.log('Pending role requests:', result);
    return result.requests;
  } catch (error) {
    console.error('View requests error:', error);
  }
};

// 4. Test admin approving role request
const testApproveRoleRequest = async (requestId) => {
  const approvalData = {
    adminId: testData.admin.id,
    action: "approve",
    reviewNotes: "Verified medical license and credentials through medical board database.",
    adminPassword: testData.admin.password
  };

  try {
    const response = await fetch(`/api/auth/role-request/${requestId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(approvalData)
    });
    
    const result = await response.json();
    console.log('Role request approval:', result);
    return result;
  } catch (error) {
    console.error('Approval error:', error);
  }
};

// 5. Test admin rejecting role request
const testRejectRoleRequest = async (requestId) => {
  const rejectionData = {
    adminId: testData.admin.id,
    action: "reject",
    reviewNotes: "Unable to verify medical credentials. Please provide additional documentation.",
    adminPassword: testData.admin.password
  };

  try {
    const response = await fetch(`/api/auth/role-request/${requestId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(rejectionData)
    });
    
    const result = await response.json();
    console.log('Role request rejection:', result);
    return result;
  } catch (error) {
    console.error('Rejection error:', error);
  }
};

// 6. Test direct role change (admin only)
const testDirectRoleChange = async () => {
  const changeData = {
    adminId: testData.admin.id,
    targetUserId: testData.user.id,
    newRole: "therapist",
    adminPassword: testData.admin.password
  };

  try {
    const response = await fetch('/api/auth/change-role', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(changeData)
    });
    
    const result = await response.json();
    console.log('Direct role change:', result);
    return result;
  } catch (error) {
    console.error('Direct role change error:', error);
  }
};

// 7. Test getting user's own role requests
const testGetUserRequests = async (userId) => {
  try {
    const response = await fetch(`/api/auth/my-role-requests/${userId}`);
    const result = await response.json();
    console.log('User role requests:', result);
    return result;
  } catch (error) {
    console.error('Get user requests error:', error);
  }
};

// 8. Test getting all users (admin only)
const testGetAllUsers = async () => {
  try {
    const response = await fetch(`/api/auth/users?adminId=${testData.admin.id}`);
    const result = await response.json();
    console.log('All users:', result);
    return result;
  } catch (error) {
    console.error('Get all users error:', error);
  }
};

// Complete test workflow
const runCompleteTest = async () => {
  console.log('🧪 Starting Role Management System Tests\n');

  // 1. Register test users
  console.log('1️⃣ Testing user registration...');
  await testRegistration();
  
  // 2. Request role change
  console.log('\n2️⃣ Testing role change request...');
  const requestId = await testRoleChangeRequest();
  
  // 3. Admin views pending requests
  console.log('\n3️⃣ Testing admin view of pending requests...');
  await testViewRoleRequests();
  
  // 4. Admin approves request
  if (requestId) {
    console.log('\n4️⃣ Testing role request approval...');
    await testApproveRoleRequest(requestId);
  }
  
  // 5. View user's request history
  console.log('\n5️⃣ Testing user request history...');
  await testGetUserRequests(testData.user.id);
  
  // 6. Test direct role change
  console.log('\n6️⃣ Testing direct role change...');
  await testDirectRoleChange();
  
  // 7. View all users
  console.log('\n7️⃣ Testing get all users...');
  await testGetAllUsers();
  
  console.log('\n✅ Role Management System Tests Completed');
};

// Error scenarios to test
const testErrorScenarios = async () => {
  console.log('🚨 Testing Error Scenarios\n');

  // Test duplicate role request
  console.log('Testing duplicate role request...');
  const duplicateRequest = {
    userId: testData.user.id,
    requestedRole: "doctor",
    reason: "Another request",
    password: testData.user.password
  };

  try {
    const response = await fetch('/api/auth/request-role-change', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(duplicateRequest)
    });
    const result = await response.json();
    console.log('Duplicate request result:', result);
  } catch (error) {
    console.error('Expected error for duplicate request:', error);
  }

  // Test invalid role
  console.log('\nTesting invalid role request...');
  const invalidRoleRequest = {
    userId: testData.user.id,
    requestedRole: "invalid_role",
    reason: "Test invalid role",
    password: testData.user.password
  };

  try {
    const response = await fetch('/api/auth/request-role-change', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(invalidRoleRequest)
    });
    const result = await response.json();
    console.log('Invalid role result:', result);
  } catch (error) {
    console.error('Expected error for invalid role:', error);
  }
};

// Export test functions for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    testRegistration,
    testRoleChangeRequest,
    testViewRoleRequests,
    testApproveRoleRequest,
    testRejectRoleRequest,
    testDirectRoleChange,
    testGetUserRequests,
    testGetAllUsers,
    runCompleteTest,
    testErrorScenarios
  };
}

// Usage in browser console or Node.js
console.log(`
🎯 Role Management Test Suite Ready!

To run tests:
1. runCompleteTest() - Run all tests in sequence
2. testErrorScenarios() - Test error handling
3. Individual test functions are also available

Make sure your server is running and you have admin and user accounts set up.
`);