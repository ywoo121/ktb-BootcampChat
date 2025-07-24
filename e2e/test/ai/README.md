# Auth Testing Suite

## 📁 Folder Structure

```
e2e/test/auth/
├── login/                        # Login functionality tests
│   ├── successful-login.spec.ts
│   └── failed-login.spec.ts
├── registration/                 # Registration tests
│   ├── valid-registration.spec.ts
│   └── invalid-registration.spec.ts
├── security/                     # Security tests
│   ├── brute-force.spec.ts
│   └── injection-attacks.spec.ts
├── session/                      # Session management
│   └── session-timeout.spec.ts
├── data/                         # Test data
│   └── auth-test-data.ts
├── helpers/                      # Test helpers
│   └── auth-test-helpers.ts
└── README.md
```

## 🧪 Test Categories

### 1. Login Tests (`login/`)
- Valid credential login
- Invalid credential handling
- Remember me functionality
- Form validation

### 2. Registration Tests (`registration/`)
- Successful user registration
- Form validation errors
- Duplicate email handling
- Password requirements

### 3. Security Tests (`security/`)
- Brute force protection
- SQL injection prevention
- XSS attack prevention
- CSRF token validation

### 4. Session Tests (`session/`)
- Session persistence
- Automatic logout
- Concurrent sessions
- Cross-tab session sharing

## 🏃‍♂️ Running Tests

```bash
# Run all auth tests
npx playwright test test/auth/

# Run specific category
npx playwright test test/auth/login/
npx playwright test test/auth/security/
npx playwright test test/auth/registration/
npx playwright test test/auth/session/

# Run with UI mode
npx playwright test test/auth/ --ui

# Run specific test file
npx playwright test test/auth/login/successful-login.spec.ts
```

## 📊 Success Metrics

- **Login time**: < 3 seconds
- **Registration time**: < 5 seconds
- **Security**: No vulnerabilities
- **Success rate**: > 95%

## 🔧 Test Data

The auth tests use:
- **AUTH_USERS**: Valid test user accounts
- **INVALID_CREDENTIALS**: Invalid login attempts
- **SECURITY_PAYLOADS**: SQL injection and XSS test cases
- **generateUniqueUser()**: Creates unique users for registration tests

## 🛡️ Security Testing

The security tests verify protection against:
- **Brute force attacks**: Account lockout after failed attempts
- **SQL injection**: Parameterized queries and input validation
- **XSS attacks**: Proper output encoding and sanitization
- **CSRF attacks**: Token validation (if implemented)

## 💡 Usage Examples

```typescript
// Basic login test
const authHelper = new AuthTestHelpers(page);
await authHelper.login(AUTH_USERS[0]);

// Registration test
const newUser = generateUniqueUser();
await authHelper.register(newUser);

// Security test
await authHelper.testSecurityPayload("' OR '1'='1", 'email');

// Brute force test
await authHelper.attemptBruteForce('user@example.com', 6);
```

## 🔍 Test Patterns

Each test follows the pattern used in the AI folder:
- **Setup**: Create helper instances
- **Action**: Perform the test action
- **Verification**: Check expected results
- **Cleanup**: Automatic via test isolation

## 📝 Notes

- Tests use the same TestHelpers pattern as the AI tests
- All tests are isolated and don't affect each other
- Security tests focus on common web vulnerabilities
- Session tests verify proper authentication state management
- Compatible with existing test infrastructure

---

**Similar to the AI testing suite, this auth module provides focused testing of authentication functionality with practical, maintainable test cases.**
