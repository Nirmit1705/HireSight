// Mock Google OAuth Strategy
export const mockGoogleStrategy = {
  authenticate: jest.fn(),
  success: jest.fn(),
  fail: jest.fn(),
  redirect: jest.fn(),
  pass: jest.fn(),
  error: jest.fn()
};

// Mock Passport
export const mockPassport = {
  use: jest.fn(),
  authenticate: jest.fn(),
  serializeUser: jest.fn(),
  deserializeUser: jest.fn()
};

// Mock Redis client
export const mockRedisClient = {
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
  exists: jest.fn(),
  expire: jest.fn(),
  disconnect: jest.fn()
};

// Mock request object
export const createMockRequest = (overrides = {}) => ({
  body: {},
  params: {},
  query: {},
  headers: {},
  user: null,
  ...overrides
});

// Mock response object
export const createMockResponse = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.cookie = jest.fn().mockReturnValue(res);
  res.clearCookie = jest.fn().mockReturnValue(res);
  res.redirect = jest.fn().mockReturnValue(res);
  return res;
};

// Mock next function
export const mockNext = jest.fn();

// Test data factories
export const createTestUserData = (overrides = {}) => ({
  email: 'test@example.com',
  name: 'Test User',
  password: 'password123',
  confirmPassword: 'password123',
  ...overrides
});

export const createTestAptitudeQuestion = (overrides = {}) => ({
  id: 'test-question-1',
  questionText: 'What is 2 + 2?',
  options: ['3', '4', '5', '6'],
  correctAnswer: 1,
  category: 'NUMERICAL',
  difficulty: 'EASY',
  ...overrides
});
