# Firebase Security Rules Documentation

## Overview

This document outlines the security implementation for the NeuraNovaa rural healthcare platform, including Firestore security rules, Firebase Storage rules, and deployment procedures.

## Security Principles

### 1. Authentication Required
- All database operations require user authentication
- No anonymous access to sensitive healthcare data
- User identity verified through Firebase Auth

### 2. Data Ownership
- Users can only access their own profile data
- Healthcare providers can access patient data within their care scope
- Role-based access control enforced at the database level

### 3. Data Validation
- All writes validated for proper data structure
- Critical fields (uid, email, createdAt) are immutable
- Type checking enforced for all data fields

### 4. Audit Trail
- All operations logged for security monitoring
- User actions tracked in audit log collection
- Read-only access to audit logs for users

## Firestore Security Rules

### User Profiles (`/users/{userId}`)

**Access Control:**
- Users can only read/write their own profile
- Profile creation requires matching Firebase Auth UID
- Email must match Firebase Auth token email

**Validation Rules:**
- Required fields: `uid`, `email`, `name`, `role`, `qrId`, `createdAt`, `updatedAt`, `isActive`
- Role must be one of: `patient`, `doctor`, `pharmacy`, `chw`
- Optional fields validated when present: `age`, `photoURL`, `phoneNumber`, `lastLoginAt`
- Immutable fields: `uid`, `email`, `createdAt`, `qrId`

### Appointments (`/appointments/{appointmentId}`)

**Access Control:**
- Patients can access their own appointments
- Doctors can access appointments where they are the provider
- CHWs can create appointments for patients

**Operations:**
- Create: Patients, doctors, and CHWs can create appointments
- Read: Patient and doctor involved in the appointment
- Update: Patient and doctor can update appointment details
- Delete: Patient and doctor can cancel appointments

### Prescriptions (`/prescriptions/{prescriptionId}`)

**Access Control:**
- Patients can view their prescriptions
- Doctors can create and manage prescriptions they issued
- Pharmacies can view prescriptions for fulfillment

**Operations:**
- Create: Only doctors and CHWs can create prescriptions
- Read: Patient and prescribing doctor
- Update: Only prescribing doctor can modify
- Delete: Only prescribing doctor can delete

### Health Records (`/health_records/{recordId}`)

**Access Control:**
- Patients can view their own health records
- Doctors and CHWs can view all patient records
- Only healthcare providers can create/update records

**Operations:**
- Create/Update: Doctors and CHWs only
- Read: Patient (own records) and healthcare providers (all records)
- Delete: Doctors only

### Pharmacy Data

**Pharmacy Profiles (`/pharmacies/{pharmacyId}`):**
- Public read access for all authenticated users
- Write access only for pharmacy owners

**Inventory (`/pharmacy_inventory/{inventoryId}`):**
- Read/Write access only for pharmacy owners
- Inventory data protected from unauthorized access

### CHW Cases (`/chw_cases/{caseId}`)

**Access Control:**
- CHWs can only access cases assigned to them
- Full CRUD operations for assigned CHW

### System Collections

**System Settings (`/system_settings/{settingId}`):**
- Read-only access to public settings
- Write operations handled server-side only

**Audit Log (`/audit_log/{logId}`):**
- Users can only read their own audit entries
- Write operations handled server-side only

## Firebase Storage Security Rules

### Profile Pictures (`/profiles/{userId}/{fileName}`)

**Access Control:**
- Users can only manage their own profile pictures
- Image files only (JPEG, PNG, etc.)
- Maximum file size: 5MB

### Medical Documents (`/prescriptions/{userId}/{fileName}`)

**Access Control:**
- Users can only access their own prescription files
- Supported formats: PDF, JPEG, PNG
- Maximum file size: 10MB

### Medical Records (`/medical_records/{patientId}/{fileName}`)

**Access Control:**
- Patients can access their own medical record files
- Doctors and CHWs can access all patient files
- Only healthcare providers can upload files
- Doctors can delete files

### Consultation Files (`/consultations/{sessionId}/{fileName}`)

**Access Control:**
- Session participants can access consultation files
- Additional server-side validation for session membership

## Deployment

### Prerequisites

1. **Firebase CLI Installation:**
   ```bash
   npm install -g firebase-tools
   firebase login
   ```

2. **Project Configuration:**
   ```bash
   firebase use --add
   # Select your Firebase project
   ```

### Deployment Commands

**Deploy All Security Rules:**
```bash
npm run security:deploy
```

**Deploy Firestore Rules Only:**
```bash
npm run firebase:deploy:rules
```

**Deploy Firestore Indexes:**
```bash
npm run firebase:deploy:indexes
```

**Validate Rules (Dry Run):**
```bash
npm run security:validate
```

### Testing with Emulator

**Start Firebase Emulator:**
```bash
npm run firebase:emulator
```

**Emulator Ports:**
- Firestore: http://localhost:8080
- Auth: http://localhost:9099
- Storage: http://localhost:9199
- Emulator UI: http://localhost:4000

## Security Monitoring

### Firebase Console Monitoring

1. **Authentication Monitoring:**
   - Monitor failed login attempts
   - Track user registration patterns
   - Review authentication provider usage

2. **Firestore Monitoring:**
   - Monitor security rule violations
   - Track read/write operations
   - Review query performance

3. **Storage Monitoring:**
   - Monitor file upload/download patterns
   - Track storage usage by user
   - Review access violations

### Audit Logging

**Automatic Logging:**
- User authentication events
- Data access and modifications
- Security rule violations
- Failed operations

**Log Analysis:**
- Regular review of audit logs
- Anomaly detection for unusual access patterns
- Compliance reporting for healthcare regulations

## Best Practices

### Development

1. **Test Security Rules:**
   - Use Firebase emulator for local testing
   - Write unit tests for security rules
   - Test with different user roles and scenarios

2. **Rule Validation:**
   - Validate rules before deployment
   - Use dry-run deployment to check syntax
   - Monitor Firebase Console for rule violations

3. **Data Validation:**
   - Implement client-side validation with Zod schemas
   - Enforce server-side validation in security rules
   - Sanitize all user inputs

### Production

1. **Regular Security Reviews:**
   - Monthly review of security rules
   - Quarterly access control audits
   - Annual security assessment

2. **Monitoring and Alerting:**
   - Set up alerts for security rule violations
   - Monitor unusual access patterns
   - Track failed authentication attempts

3. **Backup and Recovery:**
   - Regular Firestore backups
   - Document recovery procedures
   - Test backup restoration process

## Compliance Considerations

### Healthcare Data Protection

1. **HIPAA Compliance:**
   - Ensure proper access controls for patient data
   - Implement audit logging for all data access
   - Maintain data encryption in transit and at rest

2. **Data Retention:**
   - Implement data retention policies
   - Provide data deletion capabilities
   - Maintain compliance documentation

3. **User Consent:**
   - Obtain proper consent for data collection
   - Provide data access and deletion rights
   - Maintain consent records

## Troubleshooting

### Common Issues

1. **Permission Denied Errors:**
   - Check user authentication status
   - Verify user role and permissions
   - Review security rule logic

2. **Rule Deployment Failures:**
   - Validate rule syntax
   - Check Firebase project permissions
   - Verify CLI authentication

3. **Performance Issues:**
   - Review Firestore indexes
   - Optimize query patterns
   - Monitor rule evaluation complexity

### Support Resources

- [Firebase Security Rules Documentation](https://firebase.google.com/docs/rules)
- [Firestore Security Rules Guide](https://firebase.google.com/docs/firestore/security/get-started)
- [Firebase Storage Security Rules](https://firebase.google.com/docs/storage/security)