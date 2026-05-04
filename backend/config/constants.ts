// Backend configuration constants
// Version: 1.0.1

export const JWT_CONFIG = {
  secret: process.env.JWT_SECRET || 'exam-reminder-secret-key-2024',
  expiresIn: '7d',
};

export const AUTH_ERRORS = {
  // User-Exam association: Error messages for exam enrollment
  UNAUTHORIZED: 'Unauthorized',
  INVALID_TOKEN: 'Invalid or expired token',
  ADMIN_REQUIRED: 'Admin access required',
  USER_NOT_FOUND: 'User not found',
  INVALID_CREDENTIALS: 'Invalid email or password',
  EMAIL_TAKEN: 'Email already in use',
  ACCOUNT_DISABLED: 'Account has been disabled',
};
