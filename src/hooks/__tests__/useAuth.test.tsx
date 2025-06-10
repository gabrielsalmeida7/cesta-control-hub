import { renderHook, act } from '@testing-library/react';
import { AuthProvider, useAuth } from '../useAuth';
import { db } from '@/integrations/local-db/client'; // Will be mocked
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';

// Mock dependencies
jest.mock('@/integrations/local-db/client');
jest.mock('bcryptjs');
jest.mock('jsonwebtoken');
jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}));


const mockDb = db as jest.Mocked<typeof db>;
const mockBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;
const mockJwt = jwt as jest.Mocked<typeof jwt>;

const JWT_SECRET = 'your-jwt-secret-key-here'; // Must match the one in useAuth.tsx

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
);

describe('useAuth Hook', () => {
  beforeEach(() => {
    // Clear mocks and localStorage before each test
    jest.clearAllMocks();
    localStorage.clear(); // Uses the mock localStorage due to setupFiles
  });

  it('should initialize with no user and session if no token is present', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    expect(result.current.user).toBeNull();
    expect(result.current.session).toBeNull();
    expect(result.current.profile).toBeNull();
    expect(result.current.loading).toBe(false);
  });

  describe('Login', () => {
    it('should log in with valid credentials and persist session', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        full_name: 'Test User',
        role: 'admin' as 'admin' | 'institution',
        password_hash: 'hashedpassword',
      };
      const mockProfile = {
        id: mockUser.id,
        email: mockUser.email,
        full_name: mockUser.full_name,
        role: mockUser.role,
      };
      const mockToken = 'mockToken';

      mockDb.query.mockResolvedValueOnce({ rows: [mockUser] } as any);
      mockBcrypt.compareSync.mockReturnValueOnce(true);
      mockJwt.sign.mockReturnValueOnce(mockToken);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await result.current.signIn('test@example.com', 'password');
      });

      expect(result.current.user).toEqual(mockProfile);
      expect(result.current.profile).toEqual(mockProfile);
      expect(result.current.session).toEqual({ token: mockToken });
      expect(localStorage.getItem('authToken')).toBe(mockToken);
      expect(mockDb.query).toHaveBeenCalledWith(
        'SELECT id, email, full_name, role, institution_id, password_hash FROM profiles WHERE email = $1',
        ['test@example.com']
      );
      expect(mockBcrypt.compareSync).toHaveBeenCalledWith('password', mockUser.password_hash);
      expect(mockJwt.sign).toHaveBeenCalledWith(mockProfile, JWT_SECRET, { expiresIn: '1h' });
    });

    it('should show error for invalid credentials (user not found)', async () => {
      mockDb.query.mockResolvedValueOnce({ rows: [] } as any);

      const { result } = renderHook(() => useAuth(), { wrapper });

      let signInError;
      await act(async () => {
        const res = await result.current.signIn('wrong@example.com', 'password');
        signInError = res.error;
      });

      expect(result.current.user).toBeNull();
      expect(result.current.session).toBeNull();
      expect(localStorage.getItem('authToken')).toBeNull();
      expect(signInError?.message).toBe('Credenciais inválidas.');
    });

    it('should show error for invalid credentials (wrong password)', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        password_hash: 'hashedpassword',
      };
      mockDb.query.mockResolvedValueOnce({ rows: [mockUser] } as any);
      mockBcrypt.compareSync.mockReturnValueOnce(false);

      const { result } = renderHook(() => useAuth(), { wrapper });
      let signInError;
      await act(async () => {
         const res = await result.current.signIn('test@example.com', 'wrongpassword');
         signInError = res.error;
      });

      expect(result.current.user).toBeNull();
      expect(result.current.session).toBeNull();
      expect(localStorage.getItem('authToken')).toBeNull();
      expect(signInError?.message).toBe('Credenciais inválidas.');
    });
  });

  describe('Logout', () => {
    it('should log out the user and clear session', async () => {
      // First, simulate a logged-in state
      const mockUser = { id: 'user-1', email: 'test@example.com', full_name: 'Test User', role: 'admin' as 'admin' | 'institution' };
      const mockToken = 'mockToken';
      localStorage.setItem('authToken', mockToken); // Mock that user was logged in
      mockJwt.verify.mockReturnValue({ ...mockUser, exp: Date.now() / 1000 + 3600 }); // Mock valid token
      mockDb.query.mockResolvedValueOnce({ rows: [mockUser] } as any); // For session restoration

      const { result, rerender } = renderHook(() => useAuth(), { wrapper });

      // Wait for initial loading to complete
      await act(async () => {
        // Need to wait for the useEffect in AuthProvider to run
        await new Promise(resolve => setTimeout(resolve, 0));
      });
      rerender(); // Rerender to reflect state changes from useEffect

      expect(result.current.user).toEqual(mockUser); // Verify user was loaded
      expect(localStorage.getItem('authToken')).toBe(mockToken);


      await act(async () => {
        await result.current.signOut();
      });

      expect(result.current.user).toBeNull();
      expect(result.current.session).toBeNull();
      expect(result.current.profile).toBeNull();
      expect(localStorage.getItem('authToken')).toBeNull();
    });
  });

  describe('Session Persistence', () => {
    it('should restore session if a valid token exists in localStorage', async () => {
      const mockUserFromToken = { id: 'user-persisted', email: 'persist@example.com', full_name: 'Persisted User', role: 'institution' as 'admin' | 'institution', institution_id: 'inst-1' };
      const mockToken = 'persistedToken';

      // Simulate token being in localStorage
      localStorage.setItem('authToken', mockToken);
      mockJwt.verify.mockReturnValue({ ...mockUserFromToken, exp: Date.now() / 1000 + 3600 }); // Simulate valid, non-expired token
      mockDb.query.mockResolvedValueOnce({ rows: [mockUserFromToken] } as any); // DB responds with user profile

      const { result } = renderHook(() => useAuth(), { wrapper });

      // Wait for useEffect to run and process the token
      await act(async () => {
        // This is a bit of a hack to wait for async operations in useEffect
        // A better way might be to expose loading state and wait for it.
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(result.current.loading).toBe(false);
      expect(result.current.user).toEqual(mockUserFromToken);
      expect(result.current.profile).toEqual(mockUserFromToken);
      expect(result.current.session).toEqual({ token: mockToken });
      expect(mockJwt.verify).toHaveBeenCalledWith(mockToken, JWT_SECRET);
      expect(mockDb.query).toHaveBeenCalledWith(
         'SELECT id, email, full_name, role, institution_id FROM profiles WHERE id = $1',
         [mockUserFromToken.id]
      );
    });

    it('should not restore session if token is expired', async () => {
      const mockUserFromToken = { id: 'user-expired', email: 'expired@example.com' };
      const mockToken = 'expiredToken';

      localStorage.setItem('authToken', mockToken);
      // Simulate expired token by setting 'exp' to a past timestamp
      mockJwt.verify.mockReturnValue({ ...mockUserFromToken, exp: Date.now() / 1000 - 3600 });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(result.current.loading).toBe(false);
      expect(result.current.user).toBeNull();
      expect(result.current.session).toBeNull();
      expect(localStorage.getItem('authToken')).toBeNull(); // Token should be cleared
      expect(mockJwt.verify).toHaveBeenCalledWith(mockToken, JWT_SECRET);
      expect(mockDb.query).not.toHaveBeenCalled(); // DB should not be queried if token is invalid/expired early
    });

    it('should not restore session if token is invalid', async () => {
      const mockToken = 'invalidToken';
      localStorage.setItem('authToken', mockToken);
      mockJwt.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(result.current.loading).toBe(false);
      expect(result.current.user).toBeNull();
      expect(result.current.session).toBeNull();
      expect(localStorage.getItem('authToken')).toBeNull(); // Token should be cleared
    });

     it('should handle case where user from token is not found in DB during session restore', async () => {
      const mockUserFromToken = { id: 'user-not-in-db', email: 'notindb@example.com', full_name: 'No DB User', role: 'admin' as 'admin' | 'institution' };
      const mockToken = 'validTokenButUserNotInDb';

      localStorage.setItem('authToken', mockToken);
      mockJwt.verify.mockReturnValue({ ...mockUserFromToken, exp: Date.now() / 1000 + 3600 });
      mockDb.query.mockResolvedValueOnce({ rows: [] } as any); // Simulate user not found in DB

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(result.current.loading).toBe(false);
      expect(result.current.user).toBeNull();
      expect(result.current.session).toBeNull();
      expect(localStorage.getItem('authToken')).toBeNull(); // Token should be cleared
      expect(mockDb.query).toHaveBeenCalledWith(
        'SELECT id, email, full_name, role, institution_id FROM profiles WHERE id = $1',
        [mockUserFromToken.id]
      );
    });
  });
});
