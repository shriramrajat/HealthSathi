# Firebase Authentication Testing Suite

This directory contains comprehensive tests for the Firebase Authentication system implemented in the NeuraNovaa healthcare platform.

## Test Structure

### Unit Tests
- **Location**: `lib/__tests__/auth-service.test.ts`
- **Coverage**: Core authentication service functions
- **Features Tested**:
  - Email/password authentication
  - Google OAuth integration
  - User profile management
  - Error handling and validation
  - Edge cases and concurrent operations

### Integration Tests
- **Location**: `test/integration/auth-flows.test.tsx`
- **Coverage**: Complete authentication workflows
- **Features Tested**:
  - Registration process with form validation
  - Login flows with error handling
  - Google sign-in integration
  - Role-based access control
  - Password reset functionality
  - Session management
  - Error recovery scenarios

### End-to-End Tests
- **Location**: `test/e2e/user-journeys.test.tsx`
- **Coverage**: Complete user journeys from start to finish
- **Features Tested**:
  - Full registration to dashboard access
  - Login to role-specific dashboard routing
  - Google authentication workflows
  - Password reset complete flow
  - Cross-platform navigation
  - Error recovery and resilience

## Test Utilities

### Test Setup
- **Location**: `test/setup.ts`
- **Purpose**: Global test configuration and Jest DOM setup

### Test Utils
- **Location**: `test/test-utils.ts`
- **Purpose**: Custom render functions, mock data, and common test scenarios
- **Features**:
  - Custom render with AuthProvider wrapper
  - Mock Firebase user and profile generators
  - Common test scenarios (valid/invalid data)
  - Firebase error scenarios

## Running Tests

### All Tests
```bash
npm test
```

### Specific Test Suites
```bash
# Unit tests only
npm test -- lib/__tests__/auth-service.test.ts --run

# Integration tests only
npm test -- test/integration/auth-flows.test.tsx --run

# End-to-end tests only
npm test -- test/e2e/user-journeys.test.tsx --run
```

### Watch Mode
```bash
npm run test:watch
```

### UI Mode
```bash
npm run test:ui
```

## Test Coverage

The test suite covers the following requirements from the Firebase Authentication specification:

### Requirement 1: User Registration
- ✅ Email/password registration
- ✅ Google OAuth registration
- ✅ Form validation and error handling
- ✅ Role-based profile creation
- ✅ Redirect to appropriate dashboard

### Requirement 2: User Authentication
- ✅ Email/password login
- ✅ Google OAuth login
- ✅ Invalid credential handling
- ✅ Password reset functionality
- ✅ Role-specific dashboard routing

### Requirement 3: User Profile Management
- ✅ Firestore profile creation
- ✅ Profile data retrieval
- ✅ Profile updates
- ✅ Data consistency validation
- ✅ Error handling for database operations

### Requirement 4: Role-Based Access Control
- ✅ Route protection middleware
- ✅ Role verification
- ✅ Unauthorized access prevention
- ✅ Session expiration handling
- ✅ Logout functionality

### Requirement 5: Form Validation and Error Handling
- ✅ Zod schema validation
- ✅ Firebase error mapping
- ✅ Network error handling
- ✅ Loading states
- ✅ User-friendly error messages

### Requirement 6: UI Consistency
- ✅ Component integration testing
- ✅ Design system compliance
- ✅ Loading and error state handling
- ✅ Responsive behavior
- ✅ Accessibility considerations

## Mock Strategy

### Firebase Mocking
- All Firebase services are mocked using Vitest's `vi.mock()`
- Mock implementations simulate real Firebase behavior
- Error scenarios are tested with controlled mock rejections
- Authentication state changes are simulated with callbacks

### Next.js Mocking
- Router functions are mocked to test navigation
- Path changes are tracked for verification
- Navigation state is maintained across tests

### Component Mocking
- Complex components are mocked to focus on authentication logic
- Test components simulate real UI interactions
- Form submissions and user interactions are tested

## Test Data

### Mock Users
```typescript
const mockFirebaseUser = {
  uid: 'test-uid-123',
  email: 'test@example.com',
  displayName: 'Test User',
  photoURL: null,
  phoneNumber: null,
}

const mockUserProfile = {
  uid: 'test-uid-123',
  email: 'test@example.com',
  name: 'Test User',
  role: 'patient',
  age: 30,
  qrId: 'QR123456',
  // ... additional fields
}
```

### Test Scenarios
- Valid registration data
- Invalid email formats
- Weak passwords
- Existing email addresses
- Network failures
- Permission errors

## Error Testing

### Firebase Errors
- `auth/email-already-in-use`
- `auth/wrong-password`
- `auth/user-not-found`
- `auth/weak-password`
- `auth/invalid-email`
- `auth/network-request-failed`
- `auth/popup-closed-by-user`

### Firestore Errors
- `permission-denied`
- Network connectivity issues
- Malformed data handling
- Concurrent operation conflicts

## Performance Testing

### Concurrent Operations
- Multiple simultaneous authentication attempts
- Rapid form submissions
- Session state changes
- Network retry scenarios

### Edge Cases
- Malformed user data
- Missing required fields
- Invalid role assignments
- Session timeout handling

## Accessibility Testing

### Form Accessibility
- ARIA labels and roles
- Keyboard navigation
- Screen reader compatibility
- Error message announcements
- Focus management

### Loading States
- Loading indicators
- Progress feedback
- Error state announcements
- Success confirmations

## Security Testing

### Input Validation
- SQL injection prevention
- XSS protection
- Input sanitization
- Data type validation

### Authentication Security
- Token validation
- Session management
- Role-based access
- Unauthorized access prevention

## Maintenance

### Adding New Tests
1. Follow existing test patterns
2. Use provided test utilities
3. Mock Firebase services appropriately
4. Test both success and error scenarios
5. Include accessibility considerations

### Updating Tests
1. Update mocks when Firebase APIs change
2. Maintain test data consistency
3. Update error scenarios as needed
4. Keep test documentation current

### Debugging Tests
1. Use `test:ui` for interactive debugging
2. Check mock implementations
3. Verify Firebase service mocking
4. Review error message assertions

## CI/CD Integration

### Test Commands
- Tests run automatically on push/PR
- Coverage reports are generated
- Failed tests block deployment
- Performance benchmarks are tracked

### Environment Setup
- Node.js and npm/pnpm required
- Firebase emulators for integration testing
- Test database for data operations
- Mock services for external dependencies

## Future Enhancements

### Planned Additions
- Visual regression testing
- Performance benchmarking
- Load testing scenarios
- Cross-browser compatibility
- Mobile device testing

### Test Automation
- Automated test generation
- Mutation testing
- Property-based testing
- Snapshot testing for UI components