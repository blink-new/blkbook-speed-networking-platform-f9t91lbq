import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { 
  Calendar, Users, Settings, Plus, Edit, Trash2, 
  Eye, Play, Pause, BarChart3, Clock, MapPin,
  UserCheck, UserX, Mail, Phone
} from 'lucide-react'
import { blink } from '@/blink/client'
import { useToast } from '@/hooks/use-toast'
import type { User, Event, EventParticipant } from '@/types'

interface EventWithStats extends Event {
  registeredCount: number
  activeCount: number
  completedCount: number
}

interface UserWithStats extends User {
  totalEvents: number
  totalConnections: number
  lastActive: string
}

export default function AdminPanel() {
  const navigate = useNavigate()
  const { toast } = useToast()
  
  // State
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [events, setEvents] = useState<EventWithStats[]>([])
  const [users, setUsers] = useState<UserWithStats[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedEvent, setSelectedEvent] = useState<EventWithStats | null>(null)
  const [isCreateEventOpen, setIsCreateEventOpen] = useState(false)
  const [isEditEventOpen, setIsEditEventOpen] = useState(false)

  // Form state for creating/editing events
  const [eventForm, setEventForm] = useState({
    title: '',
    description: '',
    date: '',
    startTime: '',
    endTime: '',
    maxParticipants: 20,
    status: 'upcoming' as 'upcoming' | 'active' | 'completed'
  })

  const loadEventsWithStats = useCallback(async () => {
    try {
      const allEvents = await blink.db.events.list({
        orderBy: { date: 'desc' },
        limit: 50
      })

      const eventsWithStats = await Promise.all(
        allEvents.map(async (event) => {
          // Get participant statistics
          const participants = await blink.db.eventParticipants.list({
            where: { eventId: event.id }
          })

          const registeredCount = participants.filter(p => p.status === 'registered').length
          const activeCount = participants.filter(p => p.status === 'active').length
          const completedCount = participants.filter(p => p.status === 'completed').length

          return {
            ...event,
            registeredCount,
            activeCount,
            completedCount
          }
        })
      )

      setEvents(eventsWithStats)
    } catch (error) {
      console.error('Error loading events:', error)
    }
  }, [])

  const loadUsersWithStats = useCallback(async () => {
    try {
      const allUsers = await blink.db.users.list({
        orderBy: { createdAt: 'desc' },
        limit: 100
      })

      const usersWithStats = await Promise.all(
        allUsers.map(async (user) => {
          // Get user statistics
          const userEvents = await blink.db.eventParticipants.list({
            where: { userId: user.id }
          })

          const userConnections = await blink.db.connections.list({
            where: {
              OR: [
                { user1Id: user.id },
                { user2Id: user.id }
              ]
            }
          })

          return {
            ...user,
            goals: typeof user.goals === 'string' ? JSON.parse(user.goals) : user.goals,
            skills: typeof user.skills === 'string' ? JSON.parse(user.skills) : user.skills,
            totalEvents: userEvents.length,
            totalConnections: userConnections.length,
            lastActive: user.updatedAt || user.createdAt
          }
        })
      )

      setUsers(usersWithStats)
    } catch (error) {
      console.error('Error loading users:', error)
    }
  }, [])

  // Enhanced admin functions for user management
  const handleSendUserEmail = async (userId: string, userEmail: string) => {
    try {
      const { EmailService } = await import('@/utils/emailService')
      const user = users.find(u => u.id === userId)
      if (!user) return

      await EmailService.sendWelcomeEmail(userEmail, user.firstName)
      
      toast({
        title: "Email sent successfully!",
        description: `Welcome email sent to ${user.firstName}.`
      })
    } catch (error) {
      console.error('Error sending email:', error)
      toast({
        title: "Error sending email",
        description: "Please try again.",
        variant: "destructive"
      })
    }
  }

  const handleToggleUserStatus = async (userId: string) => {
    try {
      // In a real app, this would toggle user active/inactive status
      toast({
        title: "User status updated",
        description: "User status has been toggled."
      })
    } catch (error) {
      console.error('Error updating user status:', error)
    }
  }

  const loadAdminData = useCallback(async () => {
    try {
      // Check if user is admin (in real app, this would be a proper role check)
      const authUser = await blink.auth.me()
      const userProfile = await blink.db.users.list({
        where: { id: authUser.id },
        limit: 1
      })

      if (userProfile.length === 0) {
        navigate('/onboarding')
        return
      }

      const userData = userProfile[0]
      const parsedUser = {
        ...userData,
        goals: typeof userData.goals === 'string' ? JSON.parse(userData.goals) : userData.goals,
        skills: typeof userData.skills === 'string' ? JSON.parse(userData.skills) : userData.skills
      }
      setCurrentUser(parsedUser)

      // Load events with statistics
      await loadEventsWithStats()
      
      // Load users with statistics
      await loadUsersWithStats()

    } catch (error) {
      console.error('Error loading admin data:', error)
      toast({
        title: "Error loading admin panel",
        description: "Please try refreshing the page.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }, [navigate, loadEventsWithStats, loadUsersWithStats, toast])

  useEffect(() => {
    loadAdminData()
  }, [loadAdminData])

  const handleCreateEvent = async () => {
    try {
      await blink.db.events.create({
        id: `event_${Date.now()}`,
        title: eventForm.title,
        description: eventForm.description,
        date: eventForm.date,
        startTime: eventForm.startTime,
        endTime: eventForm.endTime,
        maxParticipants: eventForm.maxParticipants,
        currentParticipants: 0,
        status: eventForm.status,
        createdAt: new Date().toISOString()
      })

      toast({
        title: "Event created successfully!",
        description: `${eventForm.title} has been scheduled.`
      })

      setIsCreateEventOpen(false)
      setEventForm({
        title: '',
        description: '',
        date: '',
        startTime: '',
        endTime: '',
        maxParticipants: 20,
        status: 'upcoming'
      })

      await loadEventsWithStats()
    } catch (error) {
      console.error('Error creating event:', error)
      toast({
        title: "Error creating event",
        description: "Please try again.",
        variant: "destructive"
      })
    }
  }

  const handleEditEvent = async () => {
    if (!selectedEvent) return

    try {
      await blink.db.events.update(selectedEvent.id, {
        title: eventForm.title,
        description: eventForm.description,
        date: eventForm.date,
        startTime: eventForm.startTime,
        endTime: eventForm.endTime,
        maxParticipants: eventForm.maxParticipants,
        status: eventForm.status
      })

      toast({
        title: "Event updated successfully!",
        description: `${eventForm.title} has been updated.`
      })

      setIsEditEventOpen(false)
      setSelectedEvent(null)
      await loadEventsWithStats()
    } catch (error) {
      console.error('Error updating event:', error)
      toast({
        title: "Error updating event",
        description: "Please try again.",
        variant: "destructive"
      })
    }
  }

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm('Are you sure you want to delete this event?')) return

    try {
      await blink.db.events.delete(eventId)
      
      toast({
        title: "Event deleted",
        description: "The event has been removed."
      })

      await loadEventsWithStats()
    } catch (error) {
      console.error('Error deleting event:', error)
      toast({
        title: "Error deleting event",
        description: "Please try again.",
        variant: "destructive"
      })
    }
  }

  const handleEventStatusChange = async (eventId: string, newStatus: 'upcoming' | 'active' | 'completed') => {
    try {
      await blink.db.events.update(eventId, { status: newStatus })
      
      toast({
        title: "Event status updated",
        description: `Event is now ${newStatus}.`
      })

      await loadEventsWithStats()
    } catch (error) {
      console.error('Error updating event status:', error)
    }
  }

  const openEditEvent = (event: EventWithStats) => {
    setSelectedEvent(event)
    setEventForm({
      title: event.title,
      description: event.description,
      date: event.date,
      startTime: event.startTime,
      endTime: event.endTime,
      maxParticipants: event.maxParticipants,
      status: event.status
    })
    setIsEditEventOpen(true)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-bold text-primary mb-2">Loading Admin Panel...</div>
        </div>
      </div>
    )
  }

  if (!currentUser) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="text-2xl font-bold text-primary">BLKBOOK Admin</div>
              <Badge variant="secondary">Administrator</Badge>
            </div>

            <div className="flex items-center space-x-4">
              <Button variant="ghost" onClick={() => navigate('/dashboard')}>
                Back to Dashboard
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Calendar className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Total Events</p>
                  <p className="text-2xl font-bold">{events.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                  <p className="text-2xl font-bold">{users.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Play className="h-8 w-8 text-orange-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Active Events</p>
                  <p className="text-2xl font-bold">
                    {events.filter(e => e.status === 'active').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <BarChart3 className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Total Participants</p>
                  <p className="text-2xl font-bold">
                    {events.reduce((sum, event) => sum + event.currentParticipants, 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="events" className="space-y-6">
          <TabsList>
            <TabsTrigger value="events">Event Management</TabsTrigger>
            <TabsTrigger value="users">User Management</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          {/* Events Tab */}
          <TabsContent value="events" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Event Management</h2>
              <Dialog open={isCreateEventOpen} onOpenChange={setIsCreateEventOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-accent hover:bg-accent/90">
                    <Plus className="mr-2 h-4 w-4" />
                    Create Event
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Create New Event</DialogTitle>
                    <DialogDescription>
                      Set up a new speed networking event
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="title">Event Title</Label>
                      <Input
                        id="title"
                        value={eventForm.title}
                        onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                        placeholder="Tech Startup Networking"
                      />
                    </div>
                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={eventForm.description}
                        onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                        placeholder="Connect with fellow entrepreneurs..."
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="date">Date</Label>
                        <Input
                          id="date"
                          type="date"
                          value={eventForm.date}
                          onChange={(e) => setEventForm({ ...eventForm, date: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="maxParticipants">Max Participants</Label>
                        <Input
                          id="maxParticipants"
                          type="number"
                          value={eventForm.maxParticipants}
                          onChange={(e) => setEventForm({ ...eventForm, maxParticipants: parseInt(e.target.value) })}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="startTime">Start Time</Label>
                        <Input
                          id="startTime"
                          type="time"
                          value={eventForm.startTime}
                          onChange={(e) => setEventForm({ ...eventForm, startTime: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="endTime">End Time</Label>
                        <Input
                          id="endTime"
                          type="time"
                          value={eventForm.endTime}
                          onChange={(e) => setEventForm({ ...eventForm, endTime: e.target.value })}
                        />
                      </div>
                    </div>
                    <Button onClick={handleCreateEvent} className="w-full">
                      Create Event
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Event</TableHead>
                      <TableHead>Date & Time</TableHead>
                      <TableHead>Participants</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {events.map((event) => (
                      <TableRow key={event.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{event.title}</div>
                            <div className="text-sm text-muted-foreground">
                              {event.description.substring(0, 50)}...
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>{new Date(event.date).toLocaleDateString()}</div>
                            <div className="text-muted-foreground">
                              {event.startTime} - {event.endTime}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>{event.currentParticipants}/{event.maxParticipants}</div>
                            <div className="text-muted-foreground">
                              {event.registeredCount} registered
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Select
                            value={event.status}
                            onValueChange={(value) => handleEventStatusChange(event.id, value as any)}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="upcoming">Upcoming</SelectItem>
                              <SelectItem value="active">Active</SelectItem>
                              <SelectItem value="completed">Completed</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openEditEvent(event)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => navigate(`/event-lobby/${event.id}`)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteEvent(event.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-6">
            <h2 className="text-2xl font-bold">User Management</h2>
            
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Company</TableHead>
                      <TableHead>Goals</TableHead>
                      <TableHead>Activity</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {user.firstName} {user.lastName}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {user.email}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {user.jobTitle}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{user.company}</div>
                            <div className="text-sm text-muted-foreground">
                              {user.industry}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {user.goals.slice(0, 2).map((goal) => (
                              <Badge key={goal} variant="secondary" className="text-xs">
                                {goal}
                              </Badge>
                            ))}
                            {user.goals.length > 2 && (
                              <Badge variant="secondary" className="text-xs">
                                +{user.goals.length - 2}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>{user.totalEvents} events</div>
                            <div>{user.totalConnections} connections</div>
                            <div className="text-muted-foreground">
                              Last: {new Date(user.lastActive).toLocaleDateString()}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button variant="outline" size="sm">
                              <Mail className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="sm">
                              <UserCheck className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <h2 className="text-2xl font-bold">Platform Analytics</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Event Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span>Average Participants per Event</span>
                      <span className="font-bold">
                        {events.length > 0 ? 
                          Math.round(events.reduce((sum, e) => sum + e.currentParticipants, 0) / events.length) : 
                          0
                        }
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Registrations</span>
                      <span className="font-bold">
                        {events.reduce((sum, e) => sum + e.registeredCount, 0)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Completion Rate</span>
                      <span className="font-bold">
                        {events.length > 0 ? 
                          Math.round((events.filter(e => e.status === 'completed').length / events.length) * 100) : 
                          0
                        }%
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>User Engagement</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span>Average Events per User</span>
                      <span className="font-bold">
                        {users.length > 0 ? 
                          (users.reduce((sum, u) => sum + u.totalEvents, 0) / users.length).toFixed(1) : 
                          0
                        }
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Average Connections per User</span>
                      <span className="font-bold">
                        {users.length > 0 ? 
                          (users.reduce((sum, u) => sum + u.totalConnections, 0) / users.length).toFixed(1) : 
                          0
                        }
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Active Users (Last 30 days)</span>
                      <span className="font-bold">
                        {users.filter(u => 
                          new Date(u.lastActive) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
                        ).length}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Edit Event Dialog */}
        <Dialog open={isEditEventOpen} onOpenChange={setIsEditEventOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Event</DialogTitle>
              <DialogDescription>
                Update event details
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-title">Event Title</Label>
                <Input
                  id="edit-title"
                  value={eventForm.title}
                  onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={eventForm.description}
                  onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-date">Date</Label>
                  <Input
                    id="edit-date"
                    type="date"
                    value={eventForm.date}
                    onChange={(e) => setEventForm({ ...eventForm, date: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-maxParticipants">Max Participants</Label>
                  <Input
                    id="edit-maxParticipants"
                    type="number"
                    value={eventForm.maxParticipants}
                    onChange={(e) => setEventForm({ ...eventForm, maxParticipants: parseInt(e.target.value) })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-startTime">Start Time</Label>
                  <Input
                    id="edit-startTime"
                    type="time"
                    value={eventForm.startTime}
                    onChange={(e) => setEventForm({ ...eventForm, startTime: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-endTime">End Time</Label>
                  <Input
                    id="edit-endTime"
                    type="time"
                    value={eventForm.endTime}
                    onChange={(e) => setEventForm({ ...eventForm, endTime: e.target.value })}
                  />
                </div>
              </div>
              <Button onClick={handleEditEvent} className="w-full">
                Update Event
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}