import { blink } from '@/blink/client'

export interface Contact {
  id?: string
  email: string
  firstName?: string
  lastName?: string
  name?: string
  jobTitle?: string
  company?: string
  phone?: string
  linkedinUrl?: string
  source: 'csv' | 'linkedin' | 'gmail' | 'manual'
  importedAt: string
}

export interface LinkedInProfile {
  id: string
  firstName: string
  lastName: string
  headline: string
  industry: string
  location: string
  publicProfileUrl: string
  emailAddress?: string
}

export interface GmailContact {
  resourceName: string
  etag: string
  names?: Array<{
    displayName: string
    givenName: string
    familyName: string
  }>
  emailAddresses?: Array<{
    value: string
    type: string
  }>
  organizations?: Array<{
    name: string
    title: string
    type: string
  }>
  phoneNumbers?: Array<{
    value: string
    type: string
  }>
}

export class ContactSyncService {
  // CSV Import
  static async importFromCSV(file: File): Promise<Contact[]> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      
      reader.onload = (e) => {
        try {
          const csv = e.target?.result as string
          const contacts = this.parseCSV(csv)
          resolve(contacts)
        } catch (error) {
          reject(error)
        }
      }
      
      reader.onerror = () => reject(new Error('Failed to read file'))
      reader.readAsText(file)
    })
  }

  private static parseCSV(csv: string): Contact[] {
    const lines = csv.split('\n').filter(line => line.trim())
    if (lines.length === 0) return []

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
    const contacts: Contact[] = []

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''))
      
      if (values.length < headers.length) continue

      const contact: Contact = {
        source: 'csv',
        importedAt: new Date().toISOString(),
        email: '',
        firstName: '',
        lastName: '',
        jobTitle: '',
        company: ''
      }

      headers.forEach((header, index) => {
        const value = values[index]
        
        switch (header) {
          case 'email':
          case 'email address':
            contact.email = value
            break
          case 'first name':
          case 'firstname':
          case 'given name':
            contact.firstName = value
            break
          case 'last name':
          case 'lastname':
          case 'family name':
            contact.lastName = value
            break
          case 'name':
          case 'full name':
            if (!contact.firstName && !contact.lastName) {
              const nameParts = value.split(' ')
              contact.firstName = nameParts[0] || ''
              contact.lastName = nameParts.slice(1).join(' ') || ''
            }
            contact.name = value
            break
          case 'job title':
          case 'title':
          case 'position':
            contact.jobTitle = value
            break
          case 'company':
          case 'organization':
          case 'employer':
            contact.company = value
            break
          case 'phone':
          case 'phone number':
            contact.phone = value
            break
          case 'linkedin':
          case 'linkedin url':
            contact.linkedinUrl = value
            break
        }
      })

      // Only add contacts with valid email addresses
      if (contact.email && this.isValidEmail(contact.email)) {
        contacts.push(contact)
      }
    }

    return contacts
  }

  // LinkedIn Integration
  static async connectLinkedIn(): Promise<string> {
    // LinkedIn OAuth flow
    const clientId = process.env.NEXT_PUBLIC_LINKEDIN_CLIENT_ID || 'your-linkedin-client-id'
    const redirectUri = encodeURIComponent(`${window.location.origin}/auth/linkedin/callback`)
    const scope = encodeURIComponent('r_liteprofile r_emailaddress r_basicprofile')
    const state = Math.random().toString(36).substring(7)
    
    // Store state for verification
    localStorage.setItem('linkedin_oauth_state', state)
    
    const authUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}&state=${state}`
    
    return authUrl
  }

  static async handleLinkedInCallback(code: string, state: string): Promise<Contact[]> {
    try {
      // Verify state
      const storedState = localStorage.getItem('linkedin_oauth_state')
      if (state !== storedState) {
        throw new Error('Invalid OAuth state')
      }

      // Exchange code for access token
      const tokenResponse = await fetch('/api/linkedin/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code })
      })

      if (!tokenResponse.ok) {
        throw new Error('Failed to get LinkedIn access token')
      }

      const { access_token } = await tokenResponse.json()

      // Get user's profile
      const profile = await this.getLinkedInProfile(access_token)
      
      // Get user's connections (Note: LinkedIn heavily restricts this)
      // In practice, you'd need LinkedIn Partner Program access
      const connections = await this.getLinkedInConnections(access_token)

      return connections
    } catch (error) {
      console.error('LinkedIn callback error:', error)
      throw error
    }
  }

  private static async getLinkedInProfile(accessToken: string): Promise<LinkedInProfile> {
    const response = await fetch('https://api.linkedin.com/v2/people/~?projection=(id,firstName,lastName,headline,industry,location,publicProfileUrl)', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error('Failed to get LinkedIn profile')
    }

    return await response.json()
  }

  private static async getLinkedInConnections(accessToken: string): Promise<Contact[]> {
    // Note: This requires LinkedIn Partner Program access
    // For demo purposes, we'll return the user's own profile as a contact
    try {
      const profile = await this.getLinkedInProfile(accessToken)
      
      return [{
        email: '', // LinkedIn doesn't provide connection emails without special access
        firstName: profile.firstName,
        lastName: profile.lastName,
        name: `${profile.firstName} ${profile.lastName}`,
        jobTitle: profile.headline,
        company: profile.industry,
        linkedinUrl: profile.publicProfileUrl,
        source: 'linkedin',
        importedAt: new Date().toISOString()
      }]
    } catch (error) {
      console.error('Error getting LinkedIn connections:', error)
      return []
    }
  }

  // Gmail Integration
  static async connectGmail(): Promise<string> {
    // Google OAuth flow
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || 'your-google-client-id'
    const redirectUri = encodeURIComponent(`${window.location.origin}/auth/google/callback`)
    const scope = encodeURIComponent('https://www.googleapis.com/auth/contacts.readonly')
    const state = Math.random().toString(36).substring(7)
    
    // Store state for verification
    localStorage.setItem('google_oauth_state', state)
    
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}&state=${state}&access_type=offline`
    
    return authUrl
  }

  static async handleGoogleCallback(code: string, state: string): Promise<Contact[]> {
    try {
      // Verify state
      const storedState = localStorage.getItem('google_oauth_state')
      if (state !== storedState) {
        throw new Error('Invalid OAuth state')
      }

      // Exchange code for access token
      const tokenResponse = await fetch('/api/google/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code })
      })

      if (!tokenResponse.ok) {
        throw new Error('Failed to get Google access token')
      }

      const { access_token } = await tokenResponse.json()

      // Get contacts from Google People API
      const contacts = await this.getGoogleContacts(access_token)

      return contacts
    } catch (error) {
      console.error('Google callback error:', error)
      throw error
    }
  }

  private static async getGoogleContacts(accessToken: string): Promise<Contact[]> {
    try {
      const response = await fetch('https://people.googleapis.com/v1/people/me/connections?personFields=names,emailAddresses,organizations,phoneNumbers&pageSize=1000', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to get Google contacts')
      }

      const data = await response.json()
      const connections = data.connections || []

      return connections.map((contact: GmailContact) => {
        const name = contact.names?.[0]
        const email = contact.emailAddresses?.[0]
        const organization = contact.organizations?.[0]
        const phone = contact.phoneNumbers?.[0]

        return {
          email: email?.value || '',
          firstName: name?.givenName || '',
          lastName: name?.familyName || '',
          name: name?.displayName || '',
          jobTitle: organization?.title || '',
          company: organization?.name || '',
          phone: phone?.value || '',
          source: 'gmail' as const,
          importedAt: new Date().toISOString()
        }
      }).filter((contact: Contact) => contact.email && this.isValidEmail(contact.email))
    } catch (error) {
      console.error('Error getting Google contacts:', error)
      return []
    }
  }

  // Save contacts to user profile
  static async saveContactsToProfile(userId: string, contacts: Contact[]): Promise<void> {
    try {
      // Get current user profile
      const userProfile = await blink.db.users.list({
        where: { id: userId },
        limit: 1
      })

      if (userProfile.length === 0) {
        throw new Error('User profile not found')
      }

      const user = userProfile[0]
      const existingContacts = user.importedContacts ? 
        JSON.parse(user.importedContacts) : []

      // Merge new contacts with existing ones (avoid duplicates by email)
      const existingEmails = new Set(existingContacts.map((c: Contact) => c.email.toLowerCase()))
      const newContacts = contacts.filter(c => !existingEmails.has(c.email.toLowerCase()))

      const allContacts = [...existingContacts, ...newContacts]

      // Update user profile with merged contacts
      await blink.db.users.update(userId, {
        importedContacts: JSON.stringify(allContacts),
        updatedAt: new Date().toISOString()
      })

      console.log(`Saved ${newContacts.length} new contacts to user profile`)
    } catch (error) {
      console.error('Error saving contacts to profile:', error)
      throw error
    }
  }

  // Utility functions
  private static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  static async analyzeContactsForMatching(contacts: Contact[]): Promise<{
    totalContacts: number
    bySource: Record<string, number>
    topCompanies: string[]
    topJobTitles: string[]
  }> {
    const bySource = contacts.reduce((acc, contact) => {
      acc[contact.source] = (acc[contact.source] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const companies = contacts
      .map(c => c.company)
      .filter(Boolean)
      .reduce((acc, company) => {
        acc[company!] = (acc[company!] || 0) + 1
        return acc
      }, {} as Record<string, number>)

    const jobTitles = contacts
      .map(c => c.jobTitle)
      .filter(Boolean)
      .reduce((acc, title) => {
        acc[title!] = (acc[title!] || 0) + 1
        return acc
      }, {} as Record<string, number>)

    const topCompanies = Object.entries(companies)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([company]) => company)

    const topJobTitles = Object.entries(jobTitles)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([title]) => title)

    return {
      totalContacts: contacts.length,
      bySource,
      topCompanies,
      topJobTitles
    }
  }
}