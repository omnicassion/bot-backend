# Role Management System

## Overview

The role management system allows users to request role changes and admins to manage user roles within the medical chatbot system.

## Available Roles

- `user` - Default role for new users
- `doctor` - Medical doctors with enhanced privileges
- `therapist` - Radiotherapy therapists
- `admin` - System administrators

## API Endpoints

### 1. User Registration
```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "secure_password",
  "role": "user"
}
```

### 2. User Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "john_doe",
  "password": "secure_password"
}

Response:
{
  "message": "Login successful",
  "id": "user_id",
  "username": "john_doe",
  "role": "user",
  "timestamp": "2025-10-07T..."
}
```

### 3. Get User Role
```http
GET /api/auth/role/{userId}

Response:
{
  "id": "user_id",
  "username": "john_doe",
  "email": "john@example.com",
  "role": "user"
}
```

### 4. Request Role Change (User)
```http
POST /api/auth/request-role-change
Content-Type: application/json

{
  "userId": "user_id",
  "requestedRole": "doctor",
  "reason": "I am a licensed medical doctor and would like access to enhanced features",
  "password": "user_password"
}

Response:
{
  "message": "Role change request submitted successfully...",
  "request": {
    "id": "request_id",
    "username": "john_doe",
    "currentRole": "user",
    "requestedRole": "doctor",
    "reason": "...",
    "status": "pending",
    "createdAt": "2025-10-07T..."
  }
}
```

### 5. Change User Role (Admin Only)
```http
PUT /api/auth/change-role
Content-Type: application/json

{
  "adminId": "admin_user_id",
  "targetUserId": "target_user_id",
  "newRole": "doctor",
  "adminPassword": "admin_password"
}

Response:
{
  "message": "User role changed successfully",
  "user": {
    "id": "target_user_id",
    "username": "john_doe",
    "oldRole": "user",
    "newRole": "doctor"
  },
  "changedBy": "admin_username",
  "timestamp": "2025-10-07T..."
}
```

### 6. Get All Users (Admin Only)
```http
GET /api/auth/users?adminId={admin_user_id}

Response:
{
  "users": [
    {
      "id": "user_id",
      "username": "john_doe",
      "email": "john@example.com",
      "role": "user"
    }
  ],
  "total": 1,
  "timestamp": "2025-10-07T..."
}
```

### 7. Get Role Change Requests (Admin Only)
```http
GET /api/auth/role-requests?adminId={admin_id}&status=pending

Response:
{
  "requests": [
    {
      "id": "request_id",
      "userId": "user_id",
      "username": "john_doe",
      "currentRole": "user",
      "requestedRole": "doctor",
      "reason": "I am a licensed medical doctor...",
      "status": "pending",
      "reviewedBy": null,
      "reviewedAt": null,
      "reviewNotes": null,
      "createdAt": "2025-10-07T..."
    }
  ],
  "total": 1,
  "timestamp": "2025-10-07T..."
}
```

### 8. Approve/Reject Role Change Request (Admin Only)
```http
PUT /api/auth/role-request/{requestId}
Content-Type: application/json

{
  "adminId": "admin_user_id",
  "action": "approve",
  "reviewNotes": "Verified medical license",
  "adminPassword": "admin_password"
}

Response:
{
  "message": "Role change request approved successfully",
  "request": {
    "id": "request_id",
    "username": "john_doe",
    "currentRole": "user",
    "requestedRole": "doctor",
    "status": "approved",
    "reviewedBy": "admin_username",
    "reviewedAt": "2025-10-07T...",
    "reviewNotes": "Verified medical license"
  },
  "userRoleUpdated": true,
  "timestamp": "2025-10-07T..."
}
```

### 9. Get User's Own Role Change Requests
```http
GET /api/auth/my-role-requests/{userId}

Response:
{
  "requests": [
    {
      "id": "request_id",
      "currentRole": "user",
      "requestedRole": "doctor",
      "reason": "I am a licensed medical doctor...",
      "status": "approved",
      "reviewedBy": "admin_username",
      "reviewedAt": "2025-10-07T...",
      "reviewNotes": "Verified medical license",
      "createdAt": "2025-10-07T..."
    }
  ],
  "total": 1,
  "timestamp": "2025-10-07T..."
}
```

## Database Models

### User Model
```javascript
{
  username: String (required, unique),
  email: String (default: ""),
  password: String (required, hashed),
  role: String (enum: ['admin', 'doctor', 'user', 'therapist'], default: 'user')
}
```

### Role Change Request Model
```javascript
{
  userId: ObjectId (ref: 'User', required),
  username: String (required),
  currentRole: String (enum: ['admin', 'doctor', 'user', 'therapist'], required),
  requestedRole: String (enum: ['admin', 'doctor', 'user', 'therapist'], required),
  reason: String (required, maxlength: 500),
  status: String (enum: ['pending', 'approved', 'rejected'], default: 'pending'),
  reviewedBy: ObjectId (ref: 'User'),
  reviewedAt: Date,
  reviewNotes: String (maxlength: 500),
  createdAt: Date (default: Date.now)
}
```

## Security Features

1. **Password Verification**: Admin actions require password confirmation
2. **Role Validation**: Only valid roles are accepted
3. **Self-Protection**: Admins cannot change their own roles
4. **Request Tracking**: All role change requests are logged
5. **Duplicate Prevention**: Users cannot have multiple pending requests

## Usage Examples

### Frontend Implementation Example

```javascript
// Request role change
const requestRoleChange = async (userId, requestedRole, reason, password) => {
  try {
    const response = await fetch('/api/auth/request-role-change', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        requestedRole,
        reason,
        password
      })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      alert('Role change request submitted successfully!');
      return data;
    } else {
      alert(`Error: ${data.error}`);
    }
  } catch (error) {
    console.error('Error:', error);
    alert('An error occurred while submitting the request');
  }
};

// Admin: Approve role change request
const approveRoleRequest = async (requestId, adminId, adminPassword, reviewNotes = '') => {
  try {
    const response = await fetch(`/api/auth/role-request/${requestId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        adminId,
        action: 'approve',
        reviewNotes,
        adminPassword
      })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      alert('Role change request approved successfully!');
      return data;
    } else {
      alert(`Error: ${data.error}`);
    }
  } catch (error) {
    console.error('Error:', error);
    alert('An error occurred while approving the request');
  }
};
```

## Error Handling

The API returns appropriate HTTP status codes:

- `200` - Success
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (invalid password)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found (user/request not found)
- `500` - Internal Server Error

## Best Practices

1. **Always validate admin credentials** before role changes
2. **Log all role change activities** for audit purposes
3. **Implement proper error handling** on the frontend
4. **Use secure password practices** for all authentication
5. **Regularly review pending requests** to maintain system efficiency