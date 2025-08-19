export const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const expectError = async (fn: () => Promise<any>, expectedError?: string) => {
  try {
    await fn();
    throw new Error('Expected function to throw an error');
  } catch (error: any) {
    if (expectedError) {
      expect(error.message).toContain(expectedError);
    }
    return error;
  }
};

export const generateUniqueEmail = () => `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}@example.com`;

export const stripTimestamps = (obj: any) => {
  const { createdAt, updatedAt, ...rest } = obj;
  return rest;
};
