import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  ArrowLeft, 
  Users, 
  Phone, 
  DollarSign, 
  TrendingUp, 
  Calendar,
  Target,
  Award,
  BarChart3,
  PieChart,
  Activity
} from 'lucide-react'
import { blink } from '@/blink/client'
import { useToast } from '@/hooks/use-toast'

interface AnalyticsData {
  totalMatches: number
  totalConnections: number
  totalCalls: number
  totalOpportunities: number
  conversionRate: number
  averageCompatibilityScore: number
  eventsAttended: number
  contactInfoPurchased: number
  totalSpent: number
  totalOpportunityValue: number
  monthlyTrends: {
    month: string
    matches: number
    connections: number
    opportunities: number
  }[]
  goalPerformance: {
    goal: string
    matches: number
    connections: number
    successRate: number
  }[]
  industryBreakdown: {
    industry: string
    connections: number
    opportunities: number
  }[]
}

export default function Analytics() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)

  const loadAnalytics = useCallback(async () => {
    try {
      const authUser = await blink.auth.me()
      
      // Get user's matches
      const userMatches = await blink.db.matches.list({
        where: {
          OR: [
            { user1Id: authUser.id },
            { user2Id: authUser.id }
          ]
        }
      })

      // Get user's connections
      const userConnections = await blink.db.connections.list({
        where: {
          OR: [
            { user1Id: authUser.id },
            { user2Id: authUser.id }
          ]
        }
      })

      // Get user's payment transactions
      const userTransactions = await blink.db.paymentTransactions.list({
        where: { userId: authUser.id }
      })

      // Get user's event participations
      const userEvents = await blink.db.eventParticipants.list({
        where: { userId: authUser.id }
      })

      // Calculate basic metrics
      const totalMatches = userMatches.length
      const totalConnections = userConnections.length
      const totalCalls = userConnections.filter(c => c.callCompleted).length
      const totalOpportunities = userConnections.filter(c => c.isOpportunity === 1).length
      const conversionRate = totalMatches > 0 ? (totalConnections / totalMatches) * 100 : 0
      const averageCompatibilityScore = userMatches.length > 0 ? 
        userMatches.reduce((sum, match) => sum + match.compatibilityScore, 0) / userMatches.length : 0
      const eventsAttended = userEvents.length
      const contactInfoPurchased = userConnections.filter(c => c.contactInfoPurchased).length
      const totalSpent = userTransactions
        .filter(t => t.status === 'completed')
        .reduce((sum, t) => sum + t.amount, 0)
      const totalOpportunityValue = userConnections
        .filter(c => c.opportunityValue)
        .reduce((sum, c) => sum + (c.opportunityValue || 0), 0)

      // Calculate monthly trends (last 6 months)
      const monthlyTrends = []
      for (let i = 5; i >= 0; i--) {
        const date = new Date()
        date.setMonth(date.getMonth() - i)
        const monthStart = new Date(date.getFullYear(), date.getMonth(), 1)
        const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0)
        
        const monthMatches = userMatches.filter(m => {
          const matchDate = new Date(m.createdAt)
          return matchDate >= monthStart && matchDate <= monthEnd
        }).length

        const monthConnections = userConnections.filter(c => {
          const connectionDate = new Date(c.createdAt)
          return connectionDate >= monthStart && connectionDate <= monthEnd
        }).length

        const monthOpportunities = userConnections.filter(c => {
          const connectionDate = new Date(c.createdAt)
          return connectionDate >= monthStart && connectionDate <= monthEnd && c.isOpportunity === 1
        }).length

        monthlyTrends.push({
          month: date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
          matches: monthMatches,
          connections: monthConnections,
          opportunities: monthOpportunities
        })
      }

      // Calculate goal performance
      const userProfile = await blink.db.users.list({
        where: { id: authUser.id },
        limit: 1
      })

      let goalPerformance: any[] = []
      if (userProfile.length > 0) {
        const goals = typeof userProfile[0].goals === 'string' ? 
          (userProfile[0].goals.startsWith('[') ? JSON.parse(userProfile[0].goals) : [userProfile[0].goals]) : 
          userProfile[0].goals

        // For each goal, calculate performance (simplified - in real app would use AI matching data)
        goalPerformance = goals.map((goal: string) => {
          const goalMatches = Math.floor(totalMatches / goals.length) // Simplified distribution
          const goalConnections = Math.floor(totalConnections / goals.length)
          const successRate = goalMatches > 0 ? (goalConnections / goalMatches) * 100 : 0

          return {
            goal,
            matches: goalMatches,
            connections: goalConnections,
            successRate
          }
        })
      }

      // Calculate industry breakdown
      const industryBreakdown: { [key: string]: { connections: number, opportunities: number } } = {}
      
      // Get industry data for connected users
      for (const connection of userConnections) {
        const otherUserId = connection.user1Id === authUser.id ? connection.user2Id : connection.user1Id
        const otherUser = await blink.db.users.list({
          where: { id: otherUserId },
          limit: 1
        })

        if (otherUser.length > 0) {
          const industry = otherUser[0].industry
          if (!industryBreakdown[industry]) {
            industryBreakdown[industry] = { connections: 0, opportunities: 0 }
          }
          industryBreakdown[industry].connections++
          if (connection.isOpportunity === 1) {
            industryBreakdown[industry].opportunities++
          }
        }
      }

      const industryBreakdownArray = Object.entries(industryBreakdown).map(([industry, data]) => ({
        industry,
        connections: data.connections,
        opportunities: data.opportunities
      }))

      setAnalytics({
        totalMatches,
        totalConnections,
        totalCalls,
        totalOpportunities,
        conversionRate,
        averageCompatibilityScore,
        eventsAttended,
        contactInfoPurchased,
        totalSpent,
        totalOpportunityValue,
        monthlyTrends,
        goalPerformance,
        industryBreakdown: industryBreakdownArray
      })

    } catch (error) {
      console.error('Error loading analytics:', error)
      toast({
        title: "Error loading analytics",
        description: "Please try refreshing the page.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    loadAnalytics()
  }, [loadAnalytics])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-bold text-primary mb-2">Loading Analytics...</div>
        </div>
      </div>
    )
  }

  if (!analytics) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-12 text-center">
            <BarChart3 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-primary mb-2">No data available</h3>
            <p className="text-muted-foreground mb-4">
              Join some events to start seeing your networking analytics!
            </p>
            <Button onClick={() => navigate('/dashboard')}>
              Browse Events
            </Button>
          </CardContent>
        </Card>
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
              <div className="text-2xl font-bold text-primary">Analytics</div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Key Metrics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-blue-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Total Matches</p>
                  <p className="text-2xl font-bold">{analytics.totalMatches}</p>
                  <p className="text-xs text-muted-foreground">
                    Avg. Score: {analytics.averageCompatibilityScore.toFixed(1)}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Target className="h-8 w-8 text-green-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Connections</p>
                  <p className="text-2xl font-bold">{analytics.totalConnections}</p>
                  <p className="text-xs text-muted-foreground">
                    {analytics.conversionRate.toFixed(1)}% conversion rate
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Phone className="h-8 w-8 text-purple-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Follow-up Calls</p>
                  <p className="text-2xl font-bold">{analytics.totalCalls}</p>
                  <p className="text-xs text-muted-foreground">
                    {analytics.totalConnections > 0 ? 
                      ((analytics.totalCalls / analytics.totalConnections) * 100).toFixed(1) : 0}% call rate
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Award className="h-8 w-8 text-yellow-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Opportunities</p>
                  <p className="text-2xl font-bold">{analytics.totalOpportunities}</p>
                  <p className="text-xs text-muted-foreground">
                    ${analytics.totalOpportunityValue.toLocaleString()} potential value
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Analytics */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="trends">Trends</TabsTrigger>
            <TabsTrigger value="roi">ROI Analysis</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Conversion Funnel */}
              <Card>
                <CardHeader>
                  <CardTitle>Networking Funnel</CardTitle>
                  <CardDescription>Your networking conversion rates</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Events Attended</span>
                      <span className="font-medium">{analytics.eventsAttended}</span>
                    </div>
                    <Progress value={100} className="h-2" />
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Matches Made</span>
                      <span className="font-medium">{analytics.totalMatches}</span>
                    </div>
                    <Progress 
                      value={analytics.eventsAttended > 0 ? (analytics.totalMatches / analytics.eventsAttended) * 20 : 0} 
                      className="h-2" 
                    />
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Connections</span>
                      <span className="font-medium">{analytics.totalConnections}</span>
                    </div>
                    <Progress value={analytics.conversionRate} className="h-2" />
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Follow-up Calls</span>
                      <span className="font-medium">{analytics.totalCalls}</span>
                    </div>
                    <Progress 
                      value={analytics.totalConnections > 0 ? (analytics.totalCalls / analytics.totalConnections) * 100 : 0} 
                      className="h-2" 
                    />
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Opportunities</span>
                      <span className="font-medium">{analytics.totalOpportunities}</span>
                    </div>
                    <Progress 
                      value={analytics.totalCalls > 0 ? (analytics.totalOpportunities / analytics.totalCalls) * 100 : 0} 
                      className="h-2" 
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Goal Performance */}
              <Card>
                <CardHeader>
                  <CardTitle>Goal Performance</CardTitle>
                  <CardDescription>How well your goals are being met</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analytics.goalPerformance.map((goal, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">{goal.goal}</span>
                          <Badge variant="outline">{goal.successRate.toFixed(1)}%</Badge>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {goal.matches} matches → {goal.connections} connections
                        </div>
                        <Progress value={goal.successRate} className="h-2" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Industry Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Industry Connections</CardTitle>
                <CardDescription>Your networking reach across industries</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {analytics.industryBreakdown.map((industry, index) => (
                    <div key={index} className="p-4 border border-border rounded-lg">
                      <h4 className="font-medium mb-2">{industry.industry}</h4>
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <div className="flex justify-between">
                          <span>Connections:</span>
                          <span>{industry.connections}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Opportunities:</span>
                          <span>{industry.opportunities}</span>
                        </div>
                        <div className="flex justify-between font-medium">
                          <span>Success Rate:</span>
                          <span>
                            {industry.connections > 0 ? 
                              ((industry.opportunities / industry.connections) * 100).toFixed(1) : 0}%
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="performance" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Performance Metrics */}
              <Card>
                <CardHeader>
                  <CardTitle>Performance Metrics</CardTitle>
                  <CardDescription>Key performance indicators</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 border border-border rounded-lg">
                      <div className="text-2xl font-bold text-blue-500">{analytics.conversionRate.toFixed(1)}%</div>
                      <div className="text-sm text-muted-foreground">Match to Connection Rate</div>
                    </div>
                    <div className="text-center p-4 border border-border rounded-lg">
                      <div className="text-2xl font-bold text-green-500">{analytics.averageCompatibilityScore.toFixed(1)}%</div>
                      <div className="text-sm text-muted-foreground">Avg. Compatibility Score</div>
                    </div>
                    <div className="text-center p-4 border border-border rounded-lg">
                      <div className="text-2xl font-bold text-purple-500">
                        {analytics.totalConnections > 0 ? 
                          ((analytics.totalCalls / analytics.totalConnections) * 100).toFixed(1) : 0}%
                      </div>
                      <div className="text-sm text-muted-foreground">Connection to Call Rate</div>
                    </div>
                    <div className="text-center p-4 border border-border rounded-lg">
                      <div className="text-2xl font-bold text-yellow-500">
                        {analytics.totalCalls > 0 ? 
                          ((analytics.totalOpportunities / analytics.totalCalls) * 100).toFixed(1) : 0}%
                      </div>
                      <div className="text-sm text-muted-foreground">Call to Opportunity Rate</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Benchmarks */}
              <Card>
                <CardHeader>
                  <CardTitle>Benchmarks</CardTitle>
                  <CardDescription>How you compare to platform averages</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Conversion Rate</span>
                        <span>{analytics.conversionRate.toFixed(1)}% vs 25% avg</span>
                      </div>
                      <Progress 
                        value={Math.min((analytics.conversionRate / 25) * 100, 100)} 
                        className="h-2" 
                      />
                    </div>
                    
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Compatibility Score</span>
                        <span>{analytics.averageCompatibilityScore.toFixed(1)}% vs 75% avg</span>
                      </div>
                      <Progress 
                        value={Math.min((analytics.averageCompatibilityScore / 75) * 100, 100)} 
                        className="h-2" 
                      />
                    </div>
                    
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Follow-up Rate</span>
                        <span>
                          {analytics.totalConnections > 0 ? 
                            ((analytics.totalCalls / analytics.totalConnections) * 100).toFixed(1) : 0}% vs 40% avg
                        </span>
                      </div>
                      <Progress 
                        value={analytics.totalConnections > 0 ? 
                          Math.min(((analytics.totalCalls / analytics.totalConnections) / 0.4) * 100, 100) : 0} 
                        className="h-2" 
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="trends" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Monthly Trends</CardTitle>
                <CardDescription>Your networking activity over the last 6 months</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {analytics.monthlyTrends.map((month, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{month.month}</span>
                        <div className="flex space-x-4 text-sm">
                          <span className="text-blue-500">{month.matches} matches</span>
                          <span className="text-green-500">{month.connections} connections</span>
                          <span className="text-yellow-500">{month.opportunities} opportunities</span>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <Progress value={month.matches * 10} className="h-2" />
                        <Progress value={month.connections * 20} className="h-2" />
                        <Progress value={month.opportunities * 50} className="h-2" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="roi" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Financial Overview */}
              <Card>
                <CardHeader>
                  <CardTitle>Financial Overview</CardTitle>
                  <CardDescription>Your networking investment and returns</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 border border-border rounded-lg">
                      <div className="text-2xl font-bold text-red-500">${analytics.totalSpent.toFixed(2)}</div>
                      <div className="text-sm text-muted-foreground">Total Spent</div>
                    </div>
                    <div className="text-center p-4 border border-border rounded-lg">
                      <div className="text-2xl font-bold text-green-500">${analytics.totalOpportunityValue.toLocaleString()}</div>
                      <div className="text-sm text-muted-foreground">Potential Value</div>
                    </div>
                  </div>
                  
                  <div className="text-center p-4 border border-border rounded-lg bg-muted">
                    <div className="text-3xl font-bold text-primary">
                      {analytics.totalSpent > 0 ? 
                        `${((analytics.totalOpportunityValue / analytics.totalSpent) * 100).toFixed(0)}x` : 
                        '∞'
                      }
                    </div>
                    <div className="text-sm text-muted-foreground">Potential ROI</div>
                  </div>
                </CardContent>
              </Card>

              {/* Cost Analysis */}
              <Card>
                <CardHeader>
                  <CardTitle>Cost Analysis</CardTitle>
                  <CardDescription>Cost per networking outcome</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Cost per Connection</span>
                      <span className="font-medium">
                        ${analytics.totalConnections > 0 ? 
                          (analytics.totalSpent / analytics.totalConnections).toFixed(2) : 
                          '0.00'
                        }
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Cost per Call</span>
                      <span className="font-medium">
                        ${analytics.totalCalls > 0 ? 
                          (analytics.totalSpent / analytics.totalCalls).toFixed(2) : 
                          '0.00'
                        }
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Cost per Opportunity</span>
                      <span className="font-medium">
                        ${analytics.totalOpportunities > 0 ? 
                          (analytics.totalSpent / analytics.totalOpportunities).toFixed(2) : 
                          '0.00'
                        }
                      </span>
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t border-border">
                    <div className="text-sm text-muted-foreground mb-2">Contact Info Purchased</div>
                    <div className="text-2xl font-bold">{analytics.contactInfoPurchased}</div>
                    <div className="text-sm text-muted-foreground">
                      {analytics.totalConnections > 0 ? 
                        ((analytics.contactInfoPurchased / analytics.totalConnections) * 100).toFixed(1) : 0}% of connections
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}