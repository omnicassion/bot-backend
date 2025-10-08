# PIQ Form System - Complete Documentation

## Overview
The Patient Information Questionnaire (PIQ) Form system is a comprehensive solution for therapists, doctors, and admin staff to collect, manage, and track detailed patient information including diagnosis, treatment plans, medications, and clinical notes.

## Features

### 1. **Comprehensive Patient Data Collection**
- **Patient Information**: Name, ID, age, gender, contact, income status
- **Medical Information**: Diagnosis, grading, staging, performance status
- **Treatment Details**: Type, dosage, sessions, start date
- **Clinical Notes**: Description and detailed clinical observations
- **Medications**: Track multiple medications with dosage and frequency
- **Lab Results**: Store laboratory test results with normal ranges

### 2. **Form Lifecycle Management**
- **Draft**: Initial creation and editing
- **Submitted**: Ready for review
- **Reviewed**: Examined by doctor/admin
- **Archived**: Historical records

### 3. **Role-Based Access Control**
- **Therapists**: Create, edit, and submit forms
- **Doctors**: All therapist permissions + review forms
- **Admins**: Full access + delete permissions
- **Users**: No access (patient-facing only)

## Database Schema

### PIQForm Model

```javascript
{
  // Patient Reference
  patientId: String (required),
  patient: ObjectId (ref: 'User'),
  
  // Therapist Reference
  therapistId: String (required),
  therapist: ObjectId (ref: 'User'),
  
  // Basic Information
  patientName: String (required),
  age: Number,
  gender: Enum ['Male', 'Female', 'Other'],
  contactNumber: String,
  
  // Medical Information
  diagnosis: String (required),
  grading: Enum ['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Not Applicable'],
  staging: Enum ['Stage 0', 'Stage I', 'Stage II', 'Stage III', 'Stage IV', 'Not Applicable'],
  
  // Socio-Economic
  incomeStatus: Enum ['Below Poverty Line', 'Lower Income', 'Middle Income', 'Upper Income', 'Prefer not to say'],
  
  // Performance Status
  performanceStatus: String (ECOG 0-5 or Not Assessed),
  
  // Clinical Notes
  description: String,
  clinicalNotes: String,
  
  // Treatment
  medication: Array [{
    name: String,
    dosage: String,
    frequency: String,
    startDate: Date,
    endDate: Date,
    notes: String
  }],
  treatment: String,
  dosage: String,
  treatmentType: Enum ['Chemotherapy', 'Radiotherapy', 'Surgery', etc.],
  treatmentStartDate: Date,
  numberOfSessions: Number,
  sessionsCompleted: Number,
  
  // Vital Signs
  vitals: {
    bloodPressure: String,
    heartRate: Number,
    temperature: Number,
    weight: Number,
    height: Number,
    bmi: Number (auto-calculated)
  },
  
  // Lab Results
  labResults: Array [{
    testName: String,
    value: String,
    unit: String,
    date: Date,
    normalRange: String
  }],
  
  // Status
  status: Enum ['draft', 'submitted', 'reviewed', 'archived'],
  priority: Enum ['low', 'medium', 'high', 'urgent'],
  
  // Metadata
  createdAt: Date,
  updatedAt: Date,
  submittedAt: Date,
  reviewedAt: Date,
  reviewedBy: ObjectId (ref: 'User')
}
```

## API Endpoints

### Base URL: `/api/piq-forms`

### 1. Create PIQ Form
```http
POST /api/piq-forms
Authorization: Bearer {token}
Role: therapist, doctor, admin

Body:
{
  "patientId": "john_doe",
  "patientName": "John Doe",
  "therapistId": "dr_smith",
  "diagnosis": "Stage II Breast Cancer",
  "grading": "Grade 2",
  "staging": "Stage II",
  "treatmentType": "Chemotherapy",
  "incomeStatus": "Middle Income",
  "performanceStatus": "ECOG 1 - Restricted in physically strenuous activity",
  "description": "Patient presents with...",
  "clinicalNotes": "Clinical observations...",
  "treatment": "6 cycles of AC-T regimen",
  "dosage": "60 mg/m² Doxorubicin",
  "numberOfSessions": 6,
  "priority": "high"
}

Response:
{
  "success": true,
  "message": "PIQ form created successfully",
  "data": { ...formData }
}
```

### 2. Get All Forms
```http
GET /api/piq-forms?status=submitted&patientId=john_doe
Authorization: Bearer {token}
Role: therapist, doctor, admin

Query Parameters:
- patientId: Filter by patient
- therapistId: Filter by therapist
- status: Filter by status (draft, submitted, reviewed, archived)
- priority: Filter by priority
- startDate: Filter from date
- endDate: Filter to date

Response:
{
  "success": true,
  "count": 15,
  "data": [ ...forms ]
}
```

### 3. Get Form by ID
```http
GET /api/piq-forms/:id
Authorization: Bearer {token}
Role: therapist, doctor, admin

Response:
{
  "success": true,
  "data": { ...formData }
}
```

### 4. Get Patient's Forms
```http
GET /api/piq-forms/patient/:patientId
Authorization: Bearer {token}
Role: therapist, doctor, admin

Response:
{
  "success": true,
  "count": 3,
  "data": [ ...forms ]
}
```

### 5. Get Therapist's Forms
```http
GET /api/piq-forms/therapist/:therapistId
Authorization: Bearer {token}
Role: therapist, doctor, admin

Response:
{
  "success": true,
  "count": 25,
  "data": [ ...forms ]
}
```

### 6. Update Form
```http
PUT /api/piq-forms/:id
Authorization: Bearer {token}
Role: therapist, doctor, admin

Body: (any fields to update)
{
  "diagnosis": "Updated diagnosis",
  "clinicalNotes": "Additional notes..."
}

Response:
{
  "success": true,
  "message": "PIQ form updated successfully",
  "data": { ...updatedForm }
}
```

### 7. Delete Form
```http
DELETE /api/piq-forms/:id
Authorization: Bearer {token}
Role: doctor, admin

Response:
{
  "success": true,
  "message": "PIQ form deleted successfully",
  "data": { ...deletedForm }
}
```

### 8. Submit Form
```http
PATCH /api/piq-forms/:id/submit
Authorization: Bearer {token}
Role: therapist, doctor, admin

Response:
{
  "success": true,
  "message": "PIQ form submitted successfully",
  "data": { ...formWithSubmittedStatus }
}
```

### 9. Review Form
```http
PATCH /api/piq-forms/:id/review
Authorization: Bearer {token}
Role: doctor, admin

Body:
{
  "reviewerId": "dr_johnson",
  "notes": "Reviewed and approved for treatment"
}

Response:
{
  "success": true,
  "message": "PIQ form reviewed successfully",
  "data": { ...reviewedForm }
}
```

### 10. Add Medication
```http
POST /api/piq-forms/:id/medication
Authorization: Bearer {token}
Role: therapist, doctor, admin

Body:
{
  "name": "Doxorubicin",
  "dosage": "60 mg/m²",
  "frequency": "Every 3 weeks",
  "startDate": "2025-10-08",
  "notes": "Administer with antiemetics"
}

Response:
{
  "success": true,
  "message": "Medication added successfully",
  "data": { ...formWithNewMedication }
}
```

### 11. Add Lab Results
```http
POST /api/piq-forms/:id/lab-results
Authorization: Bearer {token}
Role: therapist, doctor, admin

Body:
{
  "testName": "Complete Blood Count",
  "value": "4.5",
  "unit": "10^9/L",
  "date": "2025-10-08",
  "normalRange": "4.0-11.0"
}

Response:
{
  "success": true,
  "message": "Lab results added successfully",
  "data": { ...formWithNewLabResults }
}
```

### 12. Get Statistics
```http
GET /api/piq-forms/stats/overview
Authorization: Bearer {token}
Role: doctor, admin

Response:
{
  "success": true,
  "data": {
    "totalForms": 150,
    "statusDistribution": {
      "draft": 20,
      "submitted": 50,
      "reviewed": 80
    },
    "treatmentTypes": [
      { "_id": "Chemotherapy", "count": 45 },
      { "_id": "Radiotherapy", "count": 38 }
    ],
    "priorityDistribution": [
      { "_id": "high", "count": 30 },
      { "_id": "medium", "count": 80 }
    ]
  }
}
```

## Frontend Components

### PIQFormPage
Main component that displays the list of PIQ forms with filtering and search capabilities.

**Features:**
- Search by patient name, ID, or diagnosis
- Filter by status (all, draft, submitted, reviewed, archived)
- Create new forms
- View, edit, and delete existing forms
- Role-based action buttons

**Props:** None (gets user role from context)

### PIQFormModal
Modal component for creating and editing PIQ forms.

**Features:**
- Multi-section form layout
- Field validation
- Save as draft or submit directly
- Auto-saves to database
- Responsive design

**Props:**
- `form`: Existing form data (for editing)
- `isEdit`: Boolean indicating edit mode
- `onClose`: Callback when modal closes
- `onSuccess`: Callback on successful save
- `therapistId`: Current therapist's username

### PIQFormViewModal
Modal component for viewing form details in read-only mode.

**Features:**
- Organized display of all form data
- Easy-to-read layout
- Edit button (if permissions allow)
- Print-friendly design

**Props:**
- `form`: Form data to display
- `onClose`: Callback when modal closes
- `onEdit`: Callback to switch to edit mode

## Usage Examples

### 1. Creating a New PIQ Form

```javascript
// In PIQFormPage component
const handleCreateForm = () => {
  setSelectedForm(null);
  setEditMode(true);
  setShowCreateModal(true);
};

// User fills out form and clicks "Submit Form"
// Form is validated and sent to API
await apiService.piqForms.createForm(formData);
```

### 2. Viewing Patient History

```javascript
// Get all forms for a specific patient
const response = await apiService.piqForms.getPatientForms('john_doe');
const patientForms = response.data.data;

// Display timeline of treatments
patientForms.forEach(form => {
  console.log(`${form.createdAt}: ${form.diagnosis} - ${form.treatmentType}`);
});
```

### 3. Therapist Workflow

```javascript
// 1. Create draft form during patient consultation
const draft = await apiService.piqForms.createForm({
  patientId: 'patient123',
  patientName: 'Jane Doe',
  therapistId: 'therapist456',
  diagnosis: 'Initial assessment',
  status: 'draft'
});

// 2. Add medications as prescribed
await apiService.piqForms.addMedication(draft.data.data._id, {
  name: 'Paclitaxel',
  dosage: '175 mg/m²',
  frequency: 'Weekly'
});

// 3. Submit for doctor review
await apiService.piqForms.submitForm(draft.data.data._id);
```

### 4. Doctor Review Workflow

```javascript
// 1. Get all submitted forms
const response = await apiService.piqForms.getAllForms({ status: 'submitted' });

// 2. Review and approve
await apiService.piqForms.reviewForm(formId, {
  reviewerId: 'dr_smith',
  notes: 'Treatment plan approved. Proceed with chemotherapy.'
});
```

## Testing

### Backend Tests

```javascript
// Test creating a form
const newForm = {
  patientId: 'test_patient',
  patientName: 'Test Patient',
  therapistId: 'test_therapist',
  diagnosis: 'Test Diagnosis'
};

const response = await apiService.piqForms.createForm(newForm);
console.assert(response.data.success === true);
console.assert(response.data.data.patientId === 'test_patient');
```

### Frontend Tests

```bash
# Test component rendering
npm test PIQFormPage

# Test form submission
npm test PIQFormModal

# Test API integration
npm test apiService.piqForms
```

## Security Considerations

1. **Authentication Required**: All endpoints require valid JWT token
2. **Role-Based Access**: Different roles have different permissions
3. **Data Validation**: Server-side validation of all inputs
4. **Sanitization**: Input sanitization to prevent XSS attacks
5. **Audit Trail**: All actions are logged with timestamps

## Performance Optimization

1. **Database Indexing**: Indexes on patientId, therapistId, and status
2. **Pagination**: Support for paginated results (can be added)
3. **Lazy Loading**: Load form details only when needed
4. **Caching**: Consider Redis caching for frequently accessed forms

## Future Enhancements

1. **File Attachments**: Upload medical reports, scans, lab results
2. **Digital Signatures**: E-signatures for form approval
3. **Notifications**: Email/SMS alerts for form submissions and reviews
4. **Templates**: Pre-filled templates for common diagnoses
5. **Export to PDF**: Generate printable reports
6. **Version History**: Track changes to forms over time
7. **Bulk Operations**: Import/export multiple forms
8. **Analytics Dashboard**: Visual charts for treatment statistics
9. **Patient Portal**: Allow patients to view their own forms
10. **Integration**: Connect with HIS/EMR systems

## Troubleshooting

### Issue: Form not saving
**Solution**: Check network tab for API errors, verify authentication token

### Issue: Permission denied
**Solution**: Verify user role matches required permissions for the action

### Issue: Missing fields
**Solution**: Check that all required fields (patientId, patientName, diagnosis, therapistId) are filled

### Issue: Form not appearing in list
**Solution**: Check status filter, verify form was actually saved to database

## Support

For questions or issues:
- Check server logs: `console.log` statements in routes
- Verify MongoDB connection
- Test endpoints with Postman before frontend integration
- Review role permissions in middleware

---

**Version**: 1.0  
**Last Updated**: October 8, 2025  
**Status**: Production Ready ✅
