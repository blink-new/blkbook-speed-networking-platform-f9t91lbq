import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Users, 
  ArrowLeft, 
  Phone, 
  Mail, 
  Calendar, 
  DollarSign, 
  CheckCircle, 
  Clock,
  Star,
  MessageSquare,
  Download,
  Upload
} from 'lucide-react'
import { blink } from '@/blink/client'
import { useToast } from '@/hooks/use-toast'
import type { Connection, User } from '@/types'

interface ConnectionWithUser extends Connection {
  otherUser: User
  eventTitle: string
}

export default function Connections() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [connections, setConnections] = useState<ConnectionWithUser[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedConnection, setSelectedConnection] = useState<ConnectionWithUser | null>(null)
  const [purchaseLoading, setPurchaseLoading] = useState<string | null>(null)
  const [callNotes, setCallNotes] = useState('')
  const [opportunityValue, setOpportunityValue] = useState('')
  const [showContactImport, setShowContactImport] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)

  const loadConnections = useCallback(async () => {
    try {
      const authUser = await blink.auth.me()
      
      // Get all connections for this user
      const userConnections = await blink.db.connections.list({
        where: {
          OR: [
            { user1Id: authUser.id },
            { user2Id: authUser.id }
          ]
        },
        orderBy: { createdAt: 'desc' }
      })

      // Enrich connections with user data and event info
      const enrichedConnections = await Promise.all(
        userConnections.map(async (connection) => {
          // Get the other user's ID
          const otherUserId = connection.user1Id === authUser.id ? connection.user2Id : connection.user1Id
          
          // Get other user's profile
          const otherUserData = await blink.db.users.list({
            where: { id: otherUserId },
            limit: 1
          })

          // Get event info
          const eventData = await blink.db.events.list({
            where: { id: connection.eventId },
            limit: 1
          })

          if (otherUserData.length === 0 || eventData.length === 0) {
            return null
          }

          const otherUser = otherUserData[0]
          const parsedOtherUser = {
            ...otherUser,
            goals: typeof otherUser.goals === 'string' ? 
              (otherUser.goals.startsWith('[') ? JSON.parse(otherUser.goals) : [otherUser.goals]) : 
              otherUser.goals,
            skills: typeof otherUser.skills === 'string' ? 
              (otherUser.skills.startsWith('[') ? JSON.parse(otherUser.skills) : [otherUser.skills]) : 
              otherUser.skills
          }

          return {
            ...connection,
            otherUser: parsedOtherUser,
            eventTitle: eventData[0].title
          }
        })
      )

      setConnections(enrichedConnections.filter(Boolean) as ConnectionWithUser[])
    } catch (error) {
      console.error('Error loading connections:', error)
      toast({
        title: "Error loading connections",
        description: "Please try refreshing the page.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    loadConnections()
  }, [loadConnections])

  const handlePurchaseContact = async (connectionId: string) => {
    setPurchaseLoading(connectionId)
    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Update connection to mark contact info as purchased
      await blink.db.connections.update(connectionId, {
        contactInfoPurchased: true,
        paymentStatus: 'paid'
      })

      // Create payment transaction record
      const authUser = await blink.auth.me()
      await blink.db.paymentTransactions.create({
        id: `txn_${Date.now()}`,
        userId: authUser.id,
        connectionId: connectionId,
        amount: 5.00,
        currency: 'USD',
        status: 'completed',
        paymentMethod: 'card',
        transactionId: `stripe_${Date.now()}`,
        createdAt: new Date().toISOString()
      })

      toast({
        title: "Contact info purchased!",
        description: "You can now see their contact details and schedule a follow-up."
      })

      loadConnections()
    } catch (error) {
      console.error('Error purchasing contact:', error)
      toast({
        title: "Purchase failed",
        description: "Please try again.",
        variant: "destructive"
      })
    } finally {
      setPurchaseLoading(null)
    }
  }

  const handleScheduleCall = async (connectionId: string) => {
    try {
      const callDate = new Date()
      callDate.setDate(callDate.getDate() + 7) // Schedule for next week

      await blink.db.connections.update(connectionId, {
        followUpScheduled: true,
        followUpCallScheduled: callDate.toISOString()
      })

      toast({
        title: "Call scheduled!",
        description: "Follow-up call has been scheduled for next week."
      })

      loadConnections()
    } catch (error) {
      console.error('Error scheduling call:', error)
      toast({
        title: "Error scheduling call",
        description: "Please try again.",
        variant: "destructive"
      })
    }
  }

  const handleCallCompleted = async (connectionId: string, isOpportunity: boolean) => {
    try {
      await blink.db.connections.update(connectionId, {
        callCompleted: true,
        isOpportunity: isOpportunity ? 1 : 0,
        opportunityConfirmed: isOpportunity,
        opportunityValue: isOpportunity ? parseFloat(opportunityValue) || 0 : null,
        notes: callNotes
      })

      // Record this outcome for AI learning
      const authUser = await blink.auth.me()
      await blink.db.userBehavior.create({
        id: `behavior_${Date.now()}`,
        userId: authUser.id,
        actionType: isOpportunity ? 'opportunity_confirmed' : 'opportunity_declined',
        actionData: JSON.stringify({
          connectionId,
          opportunityValue: isOpportunity ? parseFloat(opportunityValue) || 0 : 0,
          notes: callNotes
        }),
        timestamp: new Date().toISOString()
      })

      toast({
        title: "Call outcome recorded!",
        description: `This ${isOpportunity ? 'opportunity' : 'interaction'} has been saved for future matching improvements.`
      })

      setCallNotes('')
      setOpportunityValue('')
      setSelectedConnection(null)
      loadConnections()
    } catch (error) {
      console.error('Error recording call outcome:', error)
      toast({
        title: "Error recording outcome",
        description: "Please try again.",
        variant: "destructive"
      })
    }
  }

  const handleContactImport = async () => {
    if (!importFile) return

    try {
      const authUser = await blink.auth.me()
      const fileContent = await importFile.text()
      
      const contacts: any[] = []
      if (importFile.name.endsWith('.csv')) {
        // Parse CSV
        const lines = fileContent.split('\n')
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
        
        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(',')
          if (values.length >= headers.length) {
            const contact: any = {}
            headers.forEach((header, index) => {
              contact[header] = values[index]?.trim()
            })
            if (contact.email) {
              contacts.push(contact)
            }
          }
        }
      }

      // Store imported contacts
      await blink.db.contactImports.create({
        id: `import_${Date.now()}`,
        userId: authUser.id,
        source: 'csv',
        contactData: JSON.stringify(contacts),
        importDate: new Date().toISOString(),
        processed: false,
        matchesFound: 0
      })

      // Update user's imported contacts
      const currentUser = await blink.db.users.list({
        where: { id: authUser.id },
        limit: 1
      })

      if (currentUser.length > 0) {
        const existingContacts = currentUser[0].importedContacts ? 
          JSON.parse(currentUser[0].importedContacts) : []
        
        await blink.db.users.update(authUser.id, {
          importedContacts: JSON.stringify([...existingContacts, ...contacts])
        })
      }

      toast({
        title: "Contacts imported!",
        description: `Successfully imported ${contacts.length} contacts. AI will use these for better matching.`
      })

      setImportFile(null)
      setShowContactImport(false)
    } catch (error) {
      console.error('Error importing contacts:', error)
      toast({
        title: "Import failed",
        description: "Please check your file format and try again.",
        variant: "destructive"
      })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-bold text-primary mb-2">Loading Connections...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" onClick={() => navigate('/dashboard')}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
              </Button>
              <div className="text-2xl font-bold text-primary">Connections</div>
            </div>
            <Button onClick={() => setShowContactImport(true)}>
              <Upload className="mr-2 h-4 w-4" />
              Import Contacts
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-accent" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Total Connections</p>
                  <p className="text-2xl font-bold">{connections.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <DollarSign className="h-8 w-8 text-green-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Contact Info Purchased</p>
                  <p className="text-2xl font-bold">
                    {connections.filter(c => c.contactInfoPurchased).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Phone className="h-8 w-8 text-blue-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Calls Scheduled</p>
                  <p className="text-2xl font-bold">
                    {connections.filter(c => c.followUpScheduled).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Opportunities</p>
                  <p className="text-2xl font-bold">
                    {connections.filter(c => c.isOpportunity === 1).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Connections List */}
        <Tabs defaultValue="all" className="space-y-6">
          <TabsList>
            <TabsTrigger value="all">All Connections</TabsTrigger>
            <TabsTrigger value="purchased">Contact Info Purchased</TabsTrigger>
            <TabsTrigger value="scheduled">Calls Scheduled</TabsTrigger>
            <TabsTrigger value="opportunities">Opportunities</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            {connections.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium text-primary mb-2">No connections yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Join a networking event to start making connections!
                  </p>
                  <Button onClick={() => navigate('/dashboard')}>
                    Browse Events
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {connections.map((connection) => (
                  <Card key={connection.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-center space-x-3">
                        <Avatar>
                          <AvatarFallback>
                            {connection.otherUser.firstName[0]}{connection.otherUser.lastName[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="text-lg">
                            {connection.otherUser.firstName} {connection.otherUser.lastName}
                          </CardTitle>
                          <CardDescription>{connection.otherUser.jobTitle}</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="space-y-4">
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">Company</p>
                        <p className="font-medium">{connection.otherUser.company}</p>
                      </div>

                      <div>
                        <p className="text-sm text-muted-foreground mb-2">Event</p>
                        <Badge variant="outline">{connection.eventTitle}</Badge>
                      </div>

                      <div>
                        <p className="text-sm text-muted-foreground mb-2">Goals</p>
                        <div className="flex flex-wrap gap-1">
                          {connection.otherUser.goals.slice(0, 2).map((goal) => (
                            <Badge key={goal} variant="secondary" className="text-xs">
                              {goal}
                            </Badge>
                          ))}
                          {connection.otherUser.goals.length > 2 && (
                            <Badge variant="secondary" className="text-xs">
                              +{connection.otherUser.goals.length - 2}
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2">
                        {!connection.contactInfoPurchased ? (
                          <Button 
                            className="w-full" 
                            onClick={() => handlePurchaseContact(connection.id)}
                            disabled={purchaseLoading === connection.id}
                          >
                            {purchaseLoading === connection.id ? (
                              <>
                                <Clock className="mr-2 h-4 w-4 animate-spin" />
                                Processing...
                              </>
                            ) : (
                              <>
                                <DollarSign className="mr-2 h-4 w-4" />
                                Purchase Contact Info ($5)
                              </>
                            )}
                          </Button>
                        ) : (
                          <div className="space-y-2">
                            <div className="flex items-center text-green-600 text-sm">
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Contact info purchased
                            </div>
                            
                            <div className="grid grid-cols-2 gap-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => window.open(`mailto:${connection.otherUser.email}`)}
                              >
                                <Mail className="mr-1 h-3 w-3" />
                                Email
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => window.open(connection.otherUser.meetingLink)}
                              >
                                <Phone className="mr-1 h-3 w-3" />
                                Call
                              </Button>
                            </div>

                            {!connection.followUpScheduled ? (
                              <Button 
                                className="w-full" 
                                onClick={() => handleScheduleCall(connection.id)}
                              >
                                <Calendar className="mr-2 h-4 w-4" />
                                Schedule Follow-up
                              </Button>
                            ) : (
                              <div className="space-y-2">
                                <div className="flex items-center text-blue-600 text-sm">
                                  <Calendar className="mr-2 h-4 w-4" />
                                  Follow-up scheduled
                                </div>
                                
                                {!connection.callCompleted && (
                                  <Dialog>
                                    <DialogTrigger asChild>
                                      <Button 
                                        className="w-full" 
                                        onClick={() => setSelectedConnection(connection)}
                                      >
                                        <MessageSquare className="mr-2 h-4 w-4" />
                                        Record Call Outcome
                                      </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                      <DialogHeader>
                                        <DialogTitle>Record Call Outcome</DialogTitle>
                                        <DialogDescription>
                                          Help us improve future matches by recording the outcome of your call.
                                        </DialogDescription>
                                      </DialogHeader>
                                      
                                      <div className="space-y-4">
                                        <div>
                                          <Label htmlFor="notes">Call Notes</Label>
                                          <Textarea
                                            id="notes"
                                            placeholder="How did the call go? What was discussed?"
                                            value={callNotes}
                                            onChange={(e) => setCallNotes(e.target.value)}
                                          />
                                        </div>

                                        <div>
                                          <Label htmlFor="opportunity-value">Opportunity Value (if applicable)</Label>
                                          <Input
                                            id="opportunity-value"
                                            type="number"
                                            placeholder="Enter potential value in USD"
                                            value={opportunityValue}
                                            onChange={(e) => setOpportunityValue(e.target.value)}
                                          />
                                        </div>

                                        <div className="flex space-x-2">
                                          <Button 
                                            className="flex-1"
                                            onClick={() => handleCallCompleted(connection.id, true)}
                                          >
                                            <CheckCircle className="mr-2 h-4 w-4" />
                                            Yes, Opportunity
                                          </Button>
                                          <Button 
                                            variant="outline" 
                                            className="flex-1"
                                            onClick={() => handleCallCompleted(connection.id, false)}
                                          >
                                            No Opportunity
                                          </Button>
                                        </div>
                                      </div>
                                    </DialogContent>
                                  </Dialog>
                                )}

                                {connection.callCompleted && (
                                  <div className="flex items-center text-green-600 text-sm">
                                    <CheckCircle className="mr-2 h-4 w-4" />
                                    {connection.isOpportunity ? 'Opportunity confirmed' : 'Call completed'}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="purchased">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {connections.filter(c => c.contactInfoPurchased).map((connection) => (
                <Card key={connection.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-3 mb-4">
                      <Avatar>
                        <AvatarFallback>
                          {connection.otherUser.firstName[0]}{connection.otherUser.lastName[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold">{connection.otherUser.firstName} {connection.otherUser.lastName}</h3>
                        <p className="text-sm text-muted-foreground">{connection.otherUser.jobTitle}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center text-sm">
                        <Mail className="mr-2 h-4 w-4" />
                        {connection.otherUser.email}
                      </div>
                      <div className="flex items-center text-sm">
                        <Phone className="mr-2 h-4 w-4" />
                        Meeting Link Available
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="scheduled">
            <div className="space-y-4">
              {connections.filter(c => c.followUpScheduled).map((connection) => (
                <Card key={connection.id}>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center space-x-3">
                        <Avatar>
                          <AvatarFallback>
                            {connection.otherUser.firstName[0]}{connection.otherUser.lastName[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-semibold">{connection.otherUser.firstName} {connection.otherUser.lastName}</h3>
                          <p className="text-sm text-muted-foreground">{connection.otherUser.jobTitle}</p>
                          <p className="text-sm text-muted-foreground">
                            Scheduled: {connection.followUpCallScheduled ? 
                              new Date(connection.followUpCallScheduled).toLocaleDateString() : 
                              'Date TBD'
                            }
                          </p>
                        </div>
                      </div>
                      
                      <Badge variant={connection.callCompleted ? "default" : "secondary"}>
                        {connection.callCompleted ? "Completed" : "Scheduled"}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="opportunities">
            <div className="space-y-4">
              {connections.filter(c => c.isOpportunity === 1).map((connection) => (
                <Card key={connection.id}>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center space-x-3">
                        <Avatar>
                          <AvatarFallback>
                            {connection.otherUser.firstName[0]}{connection.otherUser.lastName[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-semibold">{connection.otherUser.firstName} {connection.otherUser.lastName}</h3>
                          <p className="text-sm text-muted-foreground">{connection.otherUser.jobTitle}</p>
                          {connection.opportunityValue && (
                            <p className="text-sm font-medium text-green-600">
                              Potential Value: ${connection.opportunityValue.toLocaleString()}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Star className="h-5 w-5 text-yellow-500" />
                        <Badge variant="default">Opportunity</Badge>
                      </div>
                    </div>
                    
                    {connection.notes && (
                      <div className="mt-4 p-3 bg-muted rounded-lg">
                        <p className="text-sm">{connection.notes}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Contact Import Dialog */}
      <Dialog open={showContactImport} onOpenChange={setShowContactImport}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import Contacts</DialogTitle>
            <DialogDescription>
              Upload your contacts to help us find better matches for you at future events.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="contact-file">Upload CSV File</Label>
              <Input
                id="contact-file"
                type="file"
                accept=".csv"
                onChange={(e) => setImportFile(e.target.files?.[0] || null)}
              />
              <p className="text-xs text-muted-foreground mt-1">
                CSV should include columns: email, first_name, last_name, company, job_title
              </p>
            </div>

            <div className="flex space-x-2">
              <Button 
                onClick={handleContactImport}
                disabled={!importFile}
                className="flex-1"
              >
                <Upload className="mr-2 h-4 w-4" />
                Import Contacts
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowContactImport(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}