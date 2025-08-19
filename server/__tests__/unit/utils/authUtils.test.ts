import { PasswordUtils, TokenUtils, ValidationUtils } from '../../../src/utils/authUtils';

describe('AuthUtils', () => {
  describe('PasswordUtils', () => {
    describe('hashPassword', () => {
      it('should hash password successfully', async () => {
        const password = 'testpassword123';
        const hashedPassword = await PasswordUtils.hashPassword(password);

        expect(hashedPassword).toBeDefined();
        expect(hashedPassword).not.toBe(password);
        expect(typeof hashedPassword).toBe('string');
        expect(hashedPassword.length).toBeGreaterThan(50);
      });

      it('should generate different hashes for same password', async () => {
        const password = 'testpassword123';
        const hash1 = await PasswordUtils.hashPassword(password);
        const hash2 = await PasswordUtils.hashPassword(password);

        expect(hash1).not.toBe(hash2);
      });
    });

    describe('comparePassword', () => {
      it('should return true for correct password', async () => {
        const password = 'testpassword123';
        const hashedPassword = await PasswordUtils.hashPassword(password);
        
        const isMatch = await PasswordUtils.comparePassword(password, hashedPassword);
        expect(isMatch).toBe(true);
      });

      it('should return false for incorrect password', async () => {
        const password = 'testpassword123';
        const wrongPassword = 'wrongpassword';
        const hashedPassword = await PasswordUtils.hashPassword(password);
        
        const isMatch = await PasswordUtils.comparePassword(wrongPassword, hashedPassword);
        expect(isMatch).toBe(false);
      });
    });
  });

  describe('TokenUtils', () => {
    describe('generateAccessToken', () => {
      it('should generate valid JWT token', () => {
        const payload = { userId: 'test-user-id', email: 'test@example.com' };
        const token = TokenUtils.generateAccessToken(payload);

        expect(token).toBeDefined();
        expect(typeof token).toBe('string');
        expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
      });
    });

    describe('generateRefreshToken', () => {
      it('should generate valid refresh token', () => {
        const token = TokenUtils.generateRefreshToken();

        expect(token).toBeDefined();
        expect(typeof token).toBe('string');
        expect(token.length).toBeGreaterThan(30); // UUID format
      });
    });

    describe('generateTokenPair', () => {
      it('should generate both access and refresh tokens', () => {
        const userId = 'test-user-id';
        const email = 'test@example.com';
        const tokens = TokenUtils.generateTokenPair(userId, email);

        expect(tokens).toHaveProperty('accessToken');
        expect(tokens).toHaveProperty('refreshToken');
        expect(typeof tokens.accessToken).toBe('string');
        expect(typeof tokens.refreshToken).toBe('string');
      });
    });

    describe('verifyToken', () => {
      it('should verify valid access token', () => {
        const payload = { userId: 'test-user-id', email: 'test@example.com' };
        const token = TokenUtils.generateAccessToken(payload);
        
        const decoded = TokenUtils.verifyToken(token);
        expect(decoded).toBeDefined();
        expect(decoded.userId).toBe(payload.userId);
        expect(decoded.email).toBe(payload.email);
      });

      it('should throw error for invalid token', () => {
        const invalidToken = 'invalid.token.here';
        
        expect(() => {
          TokenUtils.verifyToken(invalidToken);
        }).toThrow('Invalid or expired token');
      });
    });
  });

  describe('ValidationUtils', () => {
    describe('isValidEmail', () => {
      it('should validate correct email formats', () => {
        const validEmails = [
          'test@example.com',
          'user.name@domain.co.uk',
          'firstname+lastname@company.org'
        ];

        validEmails.forEach(email => {
          expect(ValidationUtils.isValidEmail(email)).toBe(true);
        });
      });

      it('should reject invalid email formats', () => {
        const invalidEmails = [
          'invalid-email',
          '@example.com',
          'user@',
          'user.name',
          ''
        ];

        invalidEmails.forEach(email => {
          expect(ValidationUtils.isValidEmail(email)).toBe(false);
        });
      });
    });

    describe('isValidName', () => {
      it('should validate correct name formats', () => {
        const validNames = [
          'John Doe',
          'Jane',
          'Mary Jane Watson',
          'Anne Marie'
        ];

        validNames.forEach(name => {
          expect(ValidationUtils.isValidName(name)).toBe(true);
        });
      });

      it('should reject invalid name formats', () => {
        const invalidNames = [
          '',
          'A', // Too short
          'A'.repeat(51), // Too long
          'John123', // Contains numbers
          'John@Doe' // Contains special characters
        ];

        invalidNames.forEach(name => {
          expect(ValidationUtils.isValidName(name)).toBe(false);
        });
      });
    });

    describe('doPasswordsMatch', () => {
      it('should return true for matching passwords', () => {
        const password = 'testpassword123';
        const confirmPassword = 'testpassword123';
        
        expect(ValidationUtils.doPasswordsMatch(password, confirmPassword)).toBe(true);
      });

      it('should return false for non-matching passwords', () => {
        const password = 'testpassword123';
        const confirmPassword = 'differentpassword';
        
        expect(ValidationUtils.doPasswordsMatch(password, confirmPassword)).toBe(false);
      });
    });
  });
});
