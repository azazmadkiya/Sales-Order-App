import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { 
  signInAnonymously,
  signOut as firebaseSignOut
} from 'firebase/auth';
import { 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  deleteDoc, 
  onSnapshot 
} from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { AppUser, UserRole, UserPermissions } from '../types';

interface AuthContextType {
  user: AppUser | null;
  users: AppUser[];
  loading: boolean;
  permissions: UserPermissions;
  loginUser: (usernameInput: string, passwordInput: string, remember?: boolean) => Promise<{ success: boolean; error?: string }>;
  loginAdmin: (usernameInput: string, passwordInput: string, remember?: boolean) => Promise<{ success: boolean; error?: string }>;
  logOut: () => Promise<void>;
  addUser: (userData: Omit<AppUser, 'id' | 'createdAt'>) => Promise<AppUser>;
  updateUser: (id: string, userData: Partial<AppUser>) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = 'vyaparflow_user_session_v2';
const USERS_LOCAL_KEY = 'vyaparflow_users_master_v2';

const DEFAULT_USERS: AppUser[] = [
  {
    id: 'user_admin_primary',
    username: 'azazmadkiya',
    displayName: 'Azaz Madkiya',
    email: 'azazmadkiya@gmail.com',
    password: '9687709315',
    role: 'admin',
    isActive: true,
    phone: '9687709315',
    createdAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'user_order_creator_sample',
    username: 'sales_user',
    displayName: 'Sales Operator',
    email: 'sales@westernchemzone.com',
    password: 'sales123',
    role: 'order_creator',
    isActive: true,
    createdAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'user_dispatch_sample',
    username: 'dispatch_user',
    displayName: 'Logistics Manager',
    email: 'dispatch@westernchemzone.com',
    password: 'dispatch123',
    role: 'dispatch_manager',
    isActive: true,
    createdAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'user_viewer_sample',
    username: 'viewer_user',
    displayName: 'Auditor (View Only)',
    email: 'auditor@westernchemzone.com',
    password: 'view123',
    role: 'viewer',
    isActive: true,
    createdAt: '2024-01-01T00:00:00.000Z',
  },
];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<AppUser[]>(() => {
    try {
      const saved = localStorage.getItem(USERS_LOCAL_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Failed to parse local users:', e);
    }
    return DEFAULT_USERS;
  });

  const [user, setUser] = useState<AppUser | null>(() => {
    try {
      const saved = localStorage.getItem(AUTH_STORAGE_KEY) || sessionStorage.getItem(AUTH_STORAGE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [loading, setLoading] = useState(false);

  // Sync users with Firestore if available
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    
    const initUsersSync = async () => {
      try {
        if (db) {
          const usersCol = collection(db, 'users');
          unsubscribe = onSnapshot(usersCol, (snapshot) => {
            if (!snapshot.empty) {
              const loadedUsers: AppUser[] = [];
              snapshot.forEach((docSnap) => {
                loadedUsers.push({ id: docSnap.id, ...(docSnap.data() as any) });
              });
              
              // Ensure primary admin is always present
              const hasPrimary = loadedUsers.some(u => (u?.username || '').toLowerCase() === 'azazmadkiya');
              if (!hasPrimary) {
                loadedUsers.unshift(DEFAULT_USERS[0]);
              }
              
              setUsers(loadedUsers);
              localStorage.setItem(USERS_LOCAL_KEY, JSON.stringify(loadedUsers));
            } else {
              // Seed default users in firestore
              DEFAULT_USERS.forEach(async (u) => {
                try {
                  await setDoc(doc(db, 'users', u.id), u);
                } catch (err) {
                  console.warn('Failed to seed user in firestore:', err);
                }
              });
            }
          }, (error) => {
            console.warn('Firestore users listener fallback to local:', error);
          });
        }
      } catch (err) {
        console.warn('Firestore users init error:', err);
      }
    };

    initUsersSync();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Save users to localStorage whenever they change
  useEffect(() => {
    if (users.length > 0) {
      localStorage.setItem(USERS_LOCAL_KEY, JSON.stringify(users));
    }
  }, [users]);

  // Keep logged in user data in sync if updated in users list
  useEffect(() => {
    if (user) {
      const freshUser = users.find(u => 
        (u?.id && user?.id && u.id === user.id) || 
        ((u?.username || '').toLowerCase() === (user?.username || '').toLowerCase())
      );
      if (freshUser && (freshUser.role !== user.role || freshUser.displayName !== user.displayName || freshUser.isActive !== user.isActive)) {
        if (!freshUser.isActive) {
          // If deactivated, log out
          logOut();
        } else {
          setUser(freshUser);
          const isLocalStorage = localStorage.getItem(AUTH_STORAGE_KEY) !== null;
          if (isLocalStorage) {
            localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(freshUser));
          } else {
            sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(freshUser));
          }
        }
      }
    }
  }, [users, user]);

  // Calculate permissions based on role & custom overrides
  const permissions = useMemo<UserPermissions>(() => {
    const role: UserRole = user?.role || 'viewer';
    let base: UserPermissions;

    switch (role) {
      case 'admin':
        base = {
          canCreateOrder: true,
          canEditOrder: true,
          canDeleteOrder: true,
          canDispatch: true,
          canManageUsers: true,
          canEditBusinessProfile: true,
          canManageParties: true,
          canManageProducts: true,
          canViewReports: true,
          canViewAmounts: true,
        };
        break;
      
      case 'order_creator':
        base = {
          canCreateOrder: true,
          canEditOrder: true,
          canDeleteOrder: false,
          canDispatch: false, // NO dispatch rights
          canManageUsers: false,
          canEditBusinessProfile: false,
          canManageParties: true,
          canManageProducts: true,
          canViewReports: true,
          canViewAmounts: true,
        };
        break;

      case 'dispatch_manager':
        base = {
          canCreateOrder: false, // NO order creation
          canEditOrder: false,   // NO editing order pricing/totals
          canDeleteOrder: false,
          canDispatch: true,     // ONLY dispatch rights
          canManageUsers: false,
          canEditBusinessProfile: false,
          canManageParties: false,
          canManageProducts: false,
          canViewReports: false,
          canViewAmounts: false,
        };
        break;

      case 'viewer':
      default:
        base = {
          canCreateOrder: false,
          canEditOrder: false,
          canDeleteOrder: false,
          canDispatch: false,
          canManageUsers: false,
          canEditBusinessProfile: false,
          canManageParties: false,
          canManageProducts: false,
          canViewReports: true,
          canViewAmounts: true,
        };
        break;
    }

    // Apply custom permission overrides if set
    if (user?.customPermissions) {
      base = { ...base, ...user.customPermissions };
    }

    // STRICT POLICY: ONLY Admin accounts have rights to delete orders. Other users never have delete rights.
    if (role !== 'admin') {
      base.canDeleteOrder = false;
      base.canManageUsers = false;
      base.canEditBusinessProfile = false;
    } else {
      base.canDeleteOrder = true;
    }

    // Explicit hideAmounts flag enforcement
    if (user?.hideAmounts === true) {
      base.canViewAmounts = false;
    } else if (user?.hideAmounts === false) {
      base.canViewAmounts = true;
    }

    return base;
  }, [user]);

  // Login handler
  const loginUser = async (
    usernameInput: string, 
    passwordInput: string, 
    remember: boolean = true
  ): Promise<{ success: boolean; error?: string }> => {
    setLoading(true);
    try {
      const cleanUsername = (usernameInput || '').trim().toLowerCase();
      const cleanPassword = (passwordInput || '').trim();

      // Find matching user
      const matchedUser = users.find(
        (u) => 
          (((u?.username || '').toLowerCase() === cleanUsername || 
            ((u?.email || '').toLowerCase() === cleanUsername)) &&
           (u?.password || '') === cleanPassword)
      );

      // Fallback check for master admin credentials
      const isMasterAdmin = 
        (cleanUsername === 'azazmadkiya' || 
         cleanUsername === 'azazmadkiya@gmail.com' || 
         cleanUsername === 'admin') &&
        cleanPassword === '9687709315';

      let authenticatedUser: AppUser | null = matchedUser || null;

      if (!authenticatedUser && isMasterAdmin) {
        authenticatedUser = DEFAULT_USERS[0];
      }

      if (!authenticatedUser) {
        setLoading(false);
        return { 
          success: false, 
          error: 'Invalid Username or Password. Please verify your credentials or contact the Administrator.' 
        };
      }

      if (!authenticatedUser.isActive) {
        setLoading(false);
        return {
          success: false,
          error: 'This account has been deactivated. Please contact the Administrator.'
        };
      }

      // Anonymous sign in to enable Firestore
      try {
        if (auth && !auth.currentUser) {
          await signInAnonymously(auth);
        }
      } catch (fbErr) {
        console.warn('Firebase auth connection notice:', fbErr);
      }

      const sessionUser: AppUser = {
        ...authenticatedUser,
        lastLogin: new Date().toISOString(),
      };

      setUser(sessionUser);

      if (remember) {
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(sessionUser));
      } else {
        sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(sessionUser));
      }

      setLoading(false);
      return { success: true };
    } catch (err: any) {
      setLoading(false);
      return { 
        success: false, 
        error: err.message || 'Login failed due to an unexpected error.' 
      };
    }
  };

  // Add new user
  const addUser = async (userData: Omit<AppUser, 'id' | 'createdAt'>): Promise<AppUser> => {
    // Check if username already exists
    const cleanUsername = (userData.username || '').trim().toLowerCase();
    if (users.some(u => (u?.username || '').toLowerCase() === cleanUsername)) {
      throw new Error(`Username "${userData.username}" is already in use. Please choose a different username.`);
    }

    const newUser: AppUser = {
      ...userData,
      id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      username: cleanUsername,
      displayName: (userData.displayName || '').trim() || cleanUsername,
      isActive: userData.isActive !== undefined ? userData.isActive : true,
      createdAt: new Date().toISOString(),
    };

    // Update state
    const updatedUsers = [...users, newUser];
    setUsers(updatedUsers);
    localStorage.setItem(USERS_LOCAL_KEY, JSON.stringify(updatedUsers));

    // Save to Firestore
    try {
      if (db) {
        await setDoc(doc(db, 'users', newUser.id), newUser);
      }
    } catch (err) {
      console.warn('Failed to save user to firestore:', err);
    }

    return newUser;
  };

  // Update user
  const updateUser = async (id: string, userData: Partial<AppUser>): Promise<void> => {
    const updatedUsers = users.map(u => {
      if (u.id === id) {
        return {
          ...u,
          ...userData,
          updatedAt: new Date().toISOString(),
        };
      }
      return u;
    });

    setUsers(updatedUsers);
    localStorage.setItem(USERS_LOCAL_KEY, JSON.stringify(updatedUsers));

    // Update in Firestore
    try {
      if (db) {
        const userDoc = updatedUsers.find(u => u.id === id);
        if (userDoc) {
          await setDoc(doc(db, 'users', id), userDoc, { merge: true });
        }
      }
    } catch (err) {
      console.warn('Failed to update user in firestore:', err);
    }
  };

  // Delete user
  const deleteUser = async (id: string): Promise<void> => {
    const target = users.find(u => u.id === id);
    if ((target?.username || '').toLowerCase() === 'azazmadkiya') {
      throw new Error('Primary administrator account cannot be deleted.');
    }

    const updatedUsers = users.filter(u => u.id !== id);
    setUsers(updatedUsers);
    localStorage.setItem(USERS_LOCAL_KEY, JSON.stringify(updatedUsers));

    // Delete in Firestore
    try {
      if (db) {
        await deleteDoc(doc(db, 'users', id));
      }
    } catch (err) {
      console.warn('Failed to delete user from firestore:', err);
    }
  };

  const logOut = async () => {
    try {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      sessionStorage.removeItem(AUTH_STORAGE_KEY);
      setUser(null);
      if (auth) {
        await firebaseSignOut(auth).catch(() => {});
      }
    } catch (error) {
      console.error('Sign Out failed:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      users, 
      loading, 
      permissions, 
      loginUser, 
      loginAdmin: loginUser, 
      logOut, 
      addUser, 
      updateUser, 
      deleteUser 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
