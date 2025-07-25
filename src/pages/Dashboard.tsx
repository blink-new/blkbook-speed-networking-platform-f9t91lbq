import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Calendar, Users, BarChart3, Settings, LogOut, Clock, MapPin } from 'lucide-react'
import { blink } from '@/blink/client'
import { useToast } from '@/hooks/use-toast'
import type { User, Event } from '@/types'

export default function Dashboard() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [user, setUser] = useState<User | null>(null)
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)

  const loadDashboardData = useCallback(async () => {
    try {
      const authUser = await blink.auth.me()
      
      // Load user profile
      const userProfile = await blink.db.users.list({
        where: { id: authUser.id },
        limit: 1
      })

      if (userProfile.length === 0) {
        // User hasn't completed onboarding
        navigate('/onboarding')
        return
      }

      setUser(userProfile[0])

      // Load upcoming events
      const upcomingEvents = await blink.db.events.list({
        where: { status: 'upcoming' },
        orderBy: { date: 'asc' },
        limit: 10
      })

      setEvents(upcomingEvents)
    } catch (error) {
      console.error('Error loading dashboard:', error)
      toast({
        title: "Error loading dashboard",
        description: "Please try refreshing the page.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }, [navigate, toast])

  useEffect(() => {
    loadDashboardData()
  }, [loadDashboardData])

  const handleRSVP = async (eventId: string) => {
    try {
      const authUser = await blink.auth.me()
      
      // Check if already registered
      const existingRegistration = await blink.db.eventParticipants.list({
        where: { 
          AND: [
            { eventId: eventId },
            { userId: authUser.id }
          ]
        },
        limit: 1
      })

      if (existingRegistration.length > 0) {
        toast({
          title: "Already registered",
          description: "You're already registered for this event."
        })
        return
      }

      // Register for event
      await blink.db.eventParticipants.create({
        eventId: eventId,
        userId: authUser.id,
        status: 'registered'
      })

      toast({
        title: "RSVP confirmed!",
        description: "You've been registered for the event."
      })

      // Refresh events
      loadDashboardData()
    } catch (error) {
      console.error('Error RSVPing to event:', error)
      toast({
        title: "Error registering",
        description: "Please try again.",
        variant: "destructive"
      })
    }
  }

  const handleLogout = () => {
    blink.auth.logout()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-bold text-primary mb-2">Loading Dashboard...</div>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="text-2xl font-bold text-primary">BLKBOOK</div>
              <nav className="hidden md:flex space-x-6">
                <Button variant="ghost" onClick={() => navigate('/dashboard')}>
                  Dashboard
                </Button>
                <Button variant="ghost" onClick={() => navigate('/connections')}>
                  <Users className="mr-2 h-4 w-4" />
                  Connections
                </Button>
                <Button variant="ghost" onClick={() => navigate('/analytics')}>
                  <BarChart3 className="mr-2 h-4 w-4" />
                  Analytics
                </Button>
              </nav>
            </div>

            <div className="flex items-center space-x-4">
              <Avatar>
                <AvatarFallback>
                  {user.firstName[0]}{user.lastName[0]}
                </AvatarFallback>
              </Avatar>
              <div className="hidden md:block">
                <div className="text-sm font-medium">{user.firstName} {user.lastName}</div>
                <div className="text-xs text-muted-foreground">{user.jobTitle}</div>
              </div>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-primary mb-2">
            Welcome back, {user.firstName}!
          </h1>
          <p className="text-muted-foreground">
            Ready to make meaningful connections? Here are your upcoming networking opportunities.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Upcoming Events */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="mr-2 h-5 w-5" />
                  Upcoming Events
                </CardTitle>
                <CardDescription>
                  Speed networking events tailored to your goals and industry
                </CardDescription>
              </CardHeader>
              <CardContent>
                {events.length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium text-primary mb-2">No upcoming events</h3>
                    <p className="text-muted-foreground">
                      New events are added regularly. Check back soon!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {events.map((event) => (
                      <div key={event.id} className="border border-border rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h3 className="font-semibold text-primary mb-1">{event.title}</h3>
                            <p className="text-sm text-muted-foreground mb-2">{event.description}</p>
                          </div>
                          <Badge variant="outline">
                            {event.currentParticipants}/{event.maxParticipants} spots
                          </Badge>
                        </div>
                        
                        <div className="flex items-center text-sm text-muted-foreground mb-3 space-x-4">
                          <div className="flex items-center">
                            <Calendar className="mr-1 h-4 w-4" />
                            {new Date(event.date).toLocaleDateString()}
                          </div>
                          <div className="flex items-center">
                            <Clock className="mr-1 h-4 w-4" />
                            {event.startTime} - {event.endTime}
                          </div>
                        </div>

                        <div className="flex justify-between items-center">
                          <div className="text-sm text-muted-foreground">
                            {event.maxParticipants - event.currentParticipants} spots remaining
                          </div>
                          <Button 
                            onClick={() => handleRSVP(event.id)}
                            className="bg-accent hover:bg-accent/90"
                            disabled={event.currentParticipants >= event.maxParticipants}
                          >
                            {event.currentParticipants >= event.maxParticipants ? 'Full' : 'RSVP'}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>
                  Manage your networking activities
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button 
                    variant="outline" 
                    className="h-20 flex-col"
                    onClick={() => navigate('/connections')}
                  >
                    <Users className="h-6 w-6 mb-2" />
                    View Connections
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-20 flex-col"
                    onClick={() => navigate('/analytics')}
                  >
                    <BarChart3 className="h-6 w-6 mb-2" />
                    View Analytics
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Profile Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Your Profile</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="font-medium">{user.firstName} {user.lastName}</div>
                  <div className="text-sm text-muted-foreground">{user.jobTitle}</div>
                  <div className="text-sm text-muted-foreground">{user.company}</div>
                </div>

                <div>
                  <div className="text-sm font-medium mb-2">Goals</div>
                  <div className="flex flex-wrap gap-1">
                    {user.goals.slice(0, 3).map((goal) => (
                      <Badge key={goal} variant="secondary" className="text-xs">
                        {goal}
                      </Badge>
                    ))}
                    {user.goals.length > 3 && (
                      <Badge variant="secondary" className="text-xs">
                        +{user.goals.length - 3} more
                      </Badge>
                    )}
                  </div>
                </div>

                <div>
                  <div className="text-sm font-medium mb-2">Skills</div>
                  <div className="flex flex-wrap gap-1">
                    {user.skills.slice(0, 3).map((skill) => (
                      <Badge key={skill} variant="outline" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                    {user.skills.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{user.skills.length - 3} more
                      </Badge>
                    )}
                  </div>
                </div>

                <Button variant="outline" size="sm" className="w-full">
                  <Settings className="mr-2 h-4 w-4" />
                  Edit Profile
                </Button>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-4">
                  <div className="text-sm text-muted-foreground">
                    No recent activity yet. Join an event to get started!
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}