import { auth } from "@/auth";
import { Session } from "next-auth";

export interface User {
  id: string;
  name: string;
  email: string;
  image?: string;
  role?: string;
}

export const getServerSession = async (): Promise<Session | null> => {
  return await auth();
};

export const getStoredUser = async (): Promise<User | null> => {
  const session = await auth();
  
  if (!session?.user) return null;
  
  return {
    id: session.user.id || '',
    name: session.user.name || '',
    email: session.user.email || '',
    image: session.user.image || undefined,
    role: session.user.role || 'user'
  };
};

export const isAuthenticated = async (): Promise<boolean> => {
  const session = await auth();
  return !!session?.user;
};

// Client-side auth helpers (for components that need client-side auth)
export const getClientUser = (): User | null => {
  // This will be used in client components with useSession
  return null; // Placeholder - will be handled by useSession hook
};

export const logout = () => {
  // This will be handled by signOut from next-auth/react
  return;
};

export const updateStoredUser = (updatedUser: User) => {
  // This will be handled through NextAuth session updates
  return;
};