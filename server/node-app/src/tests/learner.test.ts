import { learnerService } from '../modules/learner/service';
import { learnerRepository } from '../modules/learner/repository';
import { hashPassword, comparePassword } from '../utils/bcrypt';
import { generateTokens } from '../utils/jwt';

// Mock dependencies
jest.mock('../modules/learner/repository');
jest.mock('../utils/bcrypt');
jest.mock('../utils/jwt');

describe('Learner Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register a new learner successfully with email', async () => {
      const mockInput = {
        email: 'learner@example.com',
        password: 'password123',
      };

      const mockLearner = {
        id: 1,
        email: 'learner@example.com',
        phone: null,
        hashed_password: 'hashed_password',
        profileFolder: null,
        profileUrl: null,
        external_digilocker_id: null,
        status: 'active',
        other_emails: [],
        created_at: new Date(),
      };

      (learnerRepository.findByEmail as jest.Mock).mockResolvedValue(null);
      (hashPassword as jest.Mock).mockResolvedValue('hashed_password');
      (learnerRepository.create as jest.Mock).mockResolvedValue(mockLearner);
      (generateTokens as jest.Mock).mockReturnValue({
        accessToken: 'access_token',
        refreshToken: 'refresh_token',
      });

      const result = await learnerService.register(mockInput);

      expect(result.learner.id).toBe(1);
      expect(result.learner.email).toBe('learner@example.com');
      expect(result.tokens.accessToken).toBe('access_token');
    });

    it('should register a new learner successfully with phone', async () => {
      const mockInput = {
        phone: '+1234567890',
        password: 'password123',
      };

      const mockLearner = {
        id: 2,
        email: null,
        phone: '+1234567890',
        hashed_password: 'hashed_password',
        profileFolder: null,
        profileUrl: null,
        external_digilocker_id: null,
        status: 'active',
        other_emails: [],
        created_at: new Date(),
      };

      (learnerRepository.findByPhone as jest.Mock).mockResolvedValue(null);
      (hashPassword as jest.Mock).mockResolvedValue('hashed_password');
      (learnerRepository.create as jest.Mock).mockResolvedValue(mockLearner);
      (generateTokens as jest.Mock).mockReturnValue({
        accessToken: 'access_token',
        refreshToken: 'refresh_token',
      });

      const result = await learnerService.register(mockInput);

      expect(result.learner.id).toBe(2);
      expect(result.learner.phone).toBe('+1234567890');
    });

    it('should register a new learner with DOB and gender', async () => {
      const mockInput = {
        email: 'newuser@example.com',
        password: 'password123',
        dob: new Date('1990-01-01'),
        gender: 'Female' as const,
      };

      const mockLearner = {
        id: 3,
        email: 'newuser@example.com',
        phone: null,
        hashed_password: 'hashed_password',
        profileFolder: null,
        profileUrl: null,
        external_digilocker_id: null,
        status: 'active',
        other_emails: [],
        dob: new Date('1990-01-01'),
        gender: 'Female',
        created_at: new Date(),
      };

      (learnerRepository.findByEmail as jest.Mock).mockResolvedValue(null);
      (hashPassword as jest.Mock).mockResolvedValue('hashed_password');
      (learnerRepository.create as jest.Mock).mockResolvedValue(mockLearner);
      (generateTokens as jest.Mock).mockReturnValue({
        accessToken: 'access_token',
        refreshToken: 'refresh_token',
      });

      const result = await learnerService.register(mockInput);

      expect(learnerRepository.create).toHaveBeenCalledWith(expect.objectContaining({
        dob: new Date('1990-01-01'),
        gender: 'Female',
      }));
      expect(result.learner.dob).toEqual(new Date('1990-01-01'));
      expect(result.learner.gender).toBe('Female');
    });

    it('should register with all gender options', async () => {
      const genderOptions = ['Male', 'Female', 'Others', 'Not to disclose'] as const;
      
      for (const gender of genderOptions) {
        const mockInput = {
          email: `${gender.toLowerCase().replace(' ', '')}@example.com`,
          password: 'password123',
          gender,
        };

        const mockLearner = {
          id: Math.floor(Math.random() * 1000),
          email: mockInput.email,
          phone: null,
          hashed_password: 'hashed_password',
          profileFolder: null,
          profileUrl: null,
          external_digilocker_id: null,
          status: 'active',
          other_emails: [],
          dob: null,
          gender,
          created_at: new Date(),
        };

        (learnerRepository.findByEmail as jest.Mock).mockResolvedValue(null);
        (hashPassword as jest.Mock).mockResolvedValue('hashed_password');
        (learnerRepository.create as jest.Mock).mockResolvedValue(mockLearner);
        (generateTokens as jest.Mock).mockReturnValue({
          accessToken: 'access_token',
          refreshToken: 'refresh_token',
        });

        const result = await learnerService.register(mockInput);
        expect(result.learner.gender).toBe(gender);
      }
    });

    it('should throw error if learner email already exists', async () => {
      const mockInput = {
        email: 'existing@example.com',
        password: 'password123',
      };

      (learnerRepository.findByEmail as jest.Mock).mockResolvedValue({ id: 1 });

      await expect(learnerService.register(mockInput)).rejects.toThrow(
        'Learner with this email already exists'
      );
    });
  });

  describe('login', () => {
    it('should login successfully with email', async () => {
      const mockInput = {
        email: 'learner@example.com',
        password: 'password123',
      };

      const mockLearner = {
        id: 1,
        email: 'learner@example.com',
        phone: null,
        hashed_password: 'hashed_password',
        profileFolder: null,
        profileUrl: null,
        external_digilocker_id: null,
        status: 'active',
        other_emails: [],
        created_at: new Date(),
      };

      (learnerRepository.findByEmail as jest.Mock).mockResolvedValue(mockLearner);
      (comparePassword as jest.Mock).mockResolvedValue(true);
      (generateTokens as jest.Mock).mockReturnValue({
        accessToken: 'access_token',
        refreshToken: 'refresh_token',
      });

      const result = await learnerService.login(mockInput);

      expect(result.learner.email).toBe('learner@example.com');
      expect(result.tokens).toBeDefined();
    });

    it('should throw error if learner status is not active', async () => {
      const mockInput = {
        email: 'suspended@example.com',
        password: 'password123',
      };

      const mockLearner = {
        id: 1,
        email: 'suspended@example.com',
        hashed_password: 'hashed_password',
        status: 'suspended',
      };

      (learnerRepository.findByEmail as jest.Mock).mockResolvedValue(mockLearner);

      await expect(learnerService.login(mockInput)).rejects.toThrow('Account is suspended');
    });

    it('should throw error with invalid credentials', async () => {
      const mockInput = {
        email: 'learner@example.com',
        password: 'wrongpassword',
      };

      const mockLearner = {
        id: 1,
        email: 'learner@example.com',
        hashed_password: 'hashed_password',
        status: 'active',
      };

      (learnerRepository.findByEmail as jest.Mock).mockResolvedValue(mockLearner);
      (comparePassword as jest.Mock).mockResolvedValue(false);

      await expect(learnerService.login(mockInput)).rejects.toThrow('Invalid credentials');
    });
  });
});
