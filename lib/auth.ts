import { auth } from "@/auth"

export interface User {
  id: string;
  name: string;
  email: string;
  image?: string;
  role?: string;
}

export const getStoredUser = async (): Promise<User | null> => {
  const session = await auth()
  
  if (!session?.user) return null
  
  return {
    id: session.user.id || session.user.email || '',
    name: session.user.name || '',
    email: session.user.email || '',
    image: session.user.image || undefined,
    role: 'user' // Default role, can be customized based on your needs
  }
}

export const updateStoredUser = (updatedUser: User) => {
  // In a real app, this would update the user in your database
  // For now, we'll just log it since Auth.js handles the session
  console.log('User update requested:', updatedUser)
}

export const logout = async () => {
  // This will be handled by Auth.js signOut
  window.location.href = '/api/auth/signout'
}

export const isAuthenticated = async (): Promise<boolean> => {
  const session = await auth()
  return !!session?.user
}