// e2e/test/auth/data/auth-credentials.ts

export interface AuthUser {
  name: string;
  email: string;
  password: string;
}

export const AUTH_USERS: AuthUser[] = [
  {
    name: 'Test User 1',
    email: 'testuser1@authtest.com',
    password: 'SecurePass123!'
  },
  {
    name: 'Test User 2', 
    email: 'testuser2@authtest.com',
    password: 'AnotherPass456#'
  }
];

export const INVALID_CREDENTIALS = [
  {
    email: 'invalid@example.com',
    password: 'wrongpassword',
    error: '이메일 또는 비밀번호가 올바르지 않습니다'
  },
  {
    email: 'testuser1@authtest.com',
    password: 'wrongpass',
    error: '이메일 또는 비밀번호가 올바르지 않습니다'
  },
  {
    email: '',
    password: 'password',
    error: '이메일을 입력해주세요'
  }
];

export const SECURITY_PAYLOADS = {
  sqlInjection: [
    "'; DROP TABLE users; --",
    "' OR '1'='1",
    "admin'--"
  ],
  xss: [
    "<script>alert('XSS')</script>",
    "<img src=x onerror=alert('XSS')>",
    "javascript:alert('XSS')"
  ]
};

export function generateUniqueUser(): AuthUser {
  const timestamp = Date.now();
  return {
    name: `Test User ${timestamp}`,
    email: `test${timestamp}@example.com`,
    password: 'TestPass123!'
  };
}
