export interface User {
  code: string;
  name: string;
  role: string;
}

export const getStoredUser = (): User | null => {
  if (typeof window === 'undefined') return null;
  
  try {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  } catch {
    return null;
  }
};

export const updateStoredUser = (updatedUser: User) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('user', JSON.stringify(updatedUser));
  }
};

export const logout = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('user');
    window.location.href = '/';
  }
};

export const isAuthenticated = (): boolean => {
  return getStoredUser() !== null;
};