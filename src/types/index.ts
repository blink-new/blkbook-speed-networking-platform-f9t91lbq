export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  jobTitle: string
  company: string
  industry: string
  goals: string[] // Stored as JSON string in DB, parsed to array in app
  skills: string[] // Stored as JSON string in DB, parsed to array in app
  meetingLink: string
  profileImage?: string
  createdAt: string
  updatedAt: string
}

export interface Event {
  id: string
  title: string
  description: string
  date: string
  startTime: string
  endTime: string
  maxParticipants: number
  currentParticipants: number
  status: 'upcoming' | 'active' | 'completed'
  createdAt: string
}

export interface Match {
  id: string
  eventId: string
  user1Id: string
  user2Id: string
  compatibilityScore: number
  status: 'pending' | 'active' | 'completed' | 'skipped'
  startTime?: string
  endTime?: string
  connectionRequested: boolean
  connectionApproved: boolean
  createdAt: string
}

export interface Connection {
  id: string
  eventId: string
  user1Id: string
  user2Id: string
  contactInfoPurchased: boolean
  followUpScheduled: boolean
  callCompleted: boolean
  isOpportunity?: boolean
  createdAt: string
}

export interface EventParticipant {
  id: string
  eventId: string
  userId: string
  status: 'registered' | 'checked_in' | 'active' | 'completed'
  joinedAt?: string
  leftAt?: string
}

export interface Analytics {
  userId: string
  totalMatches: number
  totalConnections: number
  totalCalls: number
  totalOpportunities: number
  conversionRate: number
  averageCompatibilityScore: number
}