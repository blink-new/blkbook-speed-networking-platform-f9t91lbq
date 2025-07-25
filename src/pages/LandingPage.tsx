import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, Video, BarChart3, Calendar, Zap, Target } from 'lucide-react'
import { blink } from '@/blink/client'

export default function LandingPage() {
  const handleSignIn = () => {
    blink.auth.login()
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="text-2xl font-bold text-primary">BLKBOOK</div>
            </div>
            <Button onClick={handleSignIn} className="bg-accent hover:bg-accent/90">
              Sign In
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-5xl font-bold text-primary mb-6">
            Professional Networking
            <span className="block text-accent">Reimagined</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            Connect with the right people at the right time. Our AI-powered platform matches you with 
            relevant professionals and facilitates meaningful conversations through structured speed networking events.
          </p>
          <Button 
            onClick={handleSignIn}
            size="lg" 
            className="bg-accent hover:bg-accent/90 text-lg px-8 py-6"
          >
            Get Started
          </Button>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-secondary/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-primary mb-4">
              Everything You Need to Network Effectively
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              From AI-powered matching to post-event analytics, we've built the complete networking solution.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="border-border hover:shadow-lg transition-shadow">
              <CardHeader>
                <Target className="h-12 w-12 text-accent mb-4" />
                <CardTitle>Smart Matching</CardTitle>
                <CardDescription>
                  AI analyzes your goals and skills to connect you with the most relevant professionals
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-border hover:shadow-lg transition-shadow">
              <CardHeader>
                <Video className="h-12 w-12 text-accent mb-4" />
                <CardTitle>Speed Networking</CardTitle>
                <CardDescription>
                  Structured 1:1 video conversations with automatic rotation and time management
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-border hover:shadow-lg transition-shadow">
              <CardHeader>
                <Users className="h-12 w-12 text-accent mb-4" />
                <CardTitle>Connection Management</CardTitle>
                <CardDescription>
                  Track your connections, purchase contact info, and schedule follow-up meetings
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-border hover:shadow-lg transition-shadow">
              <CardHeader>
                <Calendar className="h-12 w-12 text-accent mb-4" />
                <CardTitle>Event Discovery</CardTitle>
                <CardDescription>
                  Find and RSVP to networking events tailored to your industry and goals
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-border hover:shadow-lg transition-shadow">
              <CardHeader>
                <BarChart3 className="h-12 w-12 text-accent mb-4" />
                <CardTitle>Analytics & Insights</CardTitle>
                <CardDescription>
                  Track your networking performance and identify opportunities for improvement
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-border hover:shadow-lg transition-shadow">
              <CardHeader>
                <Zap className="h-12 w-12 text-accent mb-4" />
                <CardTitle>Learning Algorithm</CardTitle>
                <CardDescription>
                  Our system learns from your interactions to improve future matches and recommendations
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-primary mb-4">How It Works</h2>
            <p className="text-lg text-muted-foreground">Simple steps to meaningful connections</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-accent text-white rounded-full w-12 h-12 flex items-center justify-center text-xl font-bold mx-auto mb-4">
                1
              </div>
              <h3 className="text-xl font-semibold text-primary mb-2">Complete Onboarding</h3>
              <p className="text-muted-foreground">
                Tell us about your goals, skills, and what you're looking for in networking connections
              </p>
            </div>

            <div className="text-center">
              <div className="bg-accent text-white rounded-full w-12 h-12 flex items-center justify-center text-xl font-bold mx-auto mb-4">
                2
              </div>
              <h3 className="text-xl font-semibold text-primary mb-2">Join Events</h3>
              <p className="text-muted-foreground">
                RSVP to speed networking events and get matched with relevant professionals
              </p>
            </div>

            <div className="text-center">
              <div className="bg-accent text-white rounded-full w-12 h-12 flex items-center justify-center text-xl font-bold mx-auto mb-4">
                3
              </div>
              <h3 className="text-xl font-semibold text-primary mb-2">Network & Follow Up</h3>
              <p className="text-muted-foreground">
                Connect during events, purchase contact info, and schedule follow-up calls
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Transform Your Networking?</h2>
          <p className="text-lg mb-8 opacity-90">
            Join thousands of professionals who are building meaningful connections through BLKBOOK
          </p>
          <Button 
            onClick={handleSignIn}
            size="lg" 
            variant="secondary"
            className="text-lg px-8 py-6"
          >
            Start Networking Today
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center text-muted-foreground">
            <p>&copy; 2024 BLKBOOK. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}