import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import { 
  Video, VideoOff, Mic, MicOff, Phone, PhoneOff, 
  Clock, Users, Heart, X, ArrowRight, Volume2, VolumeX 
} from 'lucide-react'
import { blink } from '@/blink/client'
import { useToast } from '@/hooks/use-toast'
import { AIMatchingService, type MatchingProfile } from '@/utils/aiMatchingService'
import type { User, Match } from '@/types'
import Peer from 'simple-peer'

// Enhanced WebRTC peer connection setup
interface PeerConnection {
  peer: Peer.Instance
  stream: MediaStream | null
  userId: string
  isInitiator: boolean
}

interface MatchedUser {
  id: string
  firstName: string
  lastName: string
  jobTitle: string
  company: string
  goals: string[]
  skills: string[]
  compatibilityScore: number
  primaryGoal: string
  canHelpWith: string
}

export default function SpeedNetworkingRoom() {
  const { eventId } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  
  // Video refs
  const localVideoRef = useRef<HTMLVideoElement>(null)
  const remoteVideoRef = useRef<HTMLVideoElement>(null)
  const localStreamRef = useRef<MediaStream | null>(null)
  const peerConnectionRef = useRef<PeerConnection | null>(null)
  
  // State
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [currentMatch, setCurrentMatch] = useState<MatchedUser | null>(null)
  const [isVideoEnabled, setIsVideoEnabled] = useState(true)
  const [isAudioEnabled, setIsAudioEnabled] = useState(true)
  const [isSpeakerEnabled, setIsSpeakerEnabled] = useState(true)
  const [timeRemaining, setTimeRemaining] = useState(300) // 5 minutes default
  const [isConnected, setIsConnected] = useState(false)
  const [connectionRequested, setConnectionRequested] = useState(false)
  const [extensionRequested, setExtensionRequested] = useState(false)
  const [matchStatus, setMatchStatus] = useState<'waiting' | 'matched' | 'extending' | 'ending'>('waiting')
  const [participants, setParticipants] = useState<User[]>([])

  const cleanup = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop())
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.peer.destroy()
      peerConnectionRef.current = null
    }
  }, [])

  const createPeerConnection = useCallback((isInitiator: boolean, targetUserId: string) => {
    if (!localStreamRef.current) return null

    const peer = new Peer({
      initiator: isInitiator,
      trickle: false,
      stream: localStreamRef.current,
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:global.stun.twilio.com:3478' }
        ]
      }
    })

    peer.on('signal', (data) => {
      // In a real app, this would be sent through a signaling server
      console.log('Peer signal:', data)
      // For demo, we'll simulate the signaling
    })

    peer.on('stream', (remoteStream) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStream
      }
      setIsConnected(true)
    })

    peer.on('connect', () => {
      console.log('Peer connected!')
      setIsConnected(true)
    })

    peer.on('error', (err) => {
      console.error('Peer error:', err)
      toast({
        title: "Connection error",
        description: "Failed to establish video connection. Please try again.",
        variant: "destructive"
      })
    })

    const peerConnection: PeerConnection = {
      peer,
      stream: localStreamRef.current,
      userId: targetUserId,
      isInitiator
    }

    peerConnectionRef.current = peerConnection
    return peerConnection
  }, [toast])

  const loadParticipants = useCallback(async () => {
    try {
      const eventParticipants = await blink.db.eventParticipants.list({
        where: { eventId: eventId, status: 'active' }
      })

      const participantUsers = await Promise.all(
        eventParticipants.map(async (participant) => {
          const user = await blink.db.users.list({
            where: { id: participant.userId },
            limit: 1
          })
          return user[0]
        })
      )

      setParticipants(participantUsers.filter(Boolean))
    } catch (error) {
      console.error('Error loading participants:', error)
    }
  }, [eventId])

  const initializeMedia = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      })
      
      localStreamRef.current = stream
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream
      }
    } catch (error) {
      console.error('Error accessing media:', error)
      toast({
        title: "Media access denied",
        description: "Please allow camera and microphone access to join the networking room.",
        variant: "destructive"
      })
    }
  }, [toast])

  const findMatch = useCallback(async () => {
    if (!currentUser) return

    try {
      setMatchStatus('waiting')
      
      // Simulate AI matchmaking algorithm
      const potentialMatches = participants.filter(p => p.id !== currentUser.id)
      
      if (potentialMatches.length === 0) {
        toast({
          title: "No matches available",
          description: "Waiting for more participants to join..."
        })
        return
      }

      // Advanced AI-powered compatibility scoring
      const scoredMatches = await Promise.all(
        potentialMatches.map(async (participant) => {
          const participantGoals = typeof participant.goals === 'string' ? 
            JSON.parse(participant.goals) : participant.goals
          const participantSkills = typeof participant.skills === 'string' ? 
            JSON.parse(participant.skills) : participant.skills

          // Create matching profiles for AI analysis
          const userProfile: MatchingProfile = {
            id: currentUser.id,
            firstName: currentUser.firstName,
            lastName: currentUser.lastName,
            jobTitle: currentUser.jobTitle,
            company: currentUser.company,
            industry: currentUser.industry,
            goals: currentUser.goals,
            skills: currentUser.skills
          }

          const participantProfile: MatchingProfile = {
            id: participant.id,
            firstName: participant.firstName,
            lastName: participant.lastName,
            jobTitle: participant.jobTitle,
            company: participant.company,
            industry: participant.industry,
            goals: participantGoals,
            skills: participantSkills
          }

          try {
            // Use AI for advanced matching
            const aiMatch = await AIMatchingService.calculateAdvancedCompatibility(
              userProfile,
              participantProfile,
              {
                eventType: 'Speed Networking',
                previousInteractions: 0,
                mutualConnections: 0
              }
            )

            return {
              ...participant,
              compatibilityScore: aiMatch.compatibilityScore,
              primaryGoal: participantGoals[0] || 'Networking',
              canHelpWith: participantSkills.slice(0, 2).join(', ') || 'Various skills',
              aiReasoning: aiMatch.reasoning,
              matchStrengths: aiMatch.matchStrengths,
              conversationStarters: aiMatch.conversationStarters
            }
          } catch (error) {
            console.error('AI matching failed, using fallback:', error)
            
            // Fallback to basic scoring
            let score = 0
            
            currentUser.goals.forEach(goal => {
              participantSkills.forEach((skill: string) => {
                if (goal.toLowerCase().includes(skill.toLowerCase()) || 
                    skill.toLowerCase().includes(goal.toLowerCase())) {
                  score += 20
                }
              })
            })

            if (participant.industry === currentUser.industry) {
              score += 10
            }

            score += Math.random() * 20

            return {
              ...participant,
              compatibilityScore: Math.min(100, Math.round(score)),
              primaryGoal: participantGoals[0] || 'Networking',
              canHelpWith: participantSkills.slice(0, 2).join(', ') || 'Various skills'
            }
          }
        })
      )

      // Select best match
      const bestMatch = scoredMatches.sort((a, b) => b.compatibilityScore - a.compatibilityScore)[0]
      
      if (bestMatch) {
        setCurrentMatch(bestMatch)
        setMatchStatus('matched')
        setTimeRemaining(300) // Reset to 5 minutes
        
        // Create WebRTC connection
        const isInitiator = currentUser.id < bestMatch.id // Deterministic initiator selection
        createPeerConnection(isInitiator, bestMatch.id)
        
        // Create match record
        await blink.db.matches.create({
          id: `match_${Date.now()}`,
          eventId: eventId!,
          user1Id: currentUser.id,
          user2Id: bestMatch.id,
          compatibilityScore: bestMatch.compatibilityScore,
          status: 'active',
          startTime: new Date().toISOString(),
          connectionRequested: false,
          connectionApproved: false,
          createdAt: new Date().toISOString()
        })

        toast({
          title: "Match found!",
          description: `Connected with ${bestMatch.firstName} (${bestMatch.compatibilityScore}% compatibility)`
        })
      }

    } catch (error) {
      console.error('Error finding match:', error)
    }
  }, [currentUser, participants, eventId, toast, createPeerConnection])

  const handleSkip = useCallback(async () => {
    setMatchStatus('waiting')
    setCurrentMatch(null)
    setConnectionRequested(false)
    setExtensionRequested(false)
    
    // Find next match
    setTimeout(() => {
      findMatch()
    }, 1000)
  }, [findMatch])

  const handleTimeUp = useCallback(() => {
    setMatchStatus('ending')
    toast({
      title: "Time's up!",
      description: "Moving to next match..."
    })
    
    setTimeout(() => {
      handleSkip()
    }, 2000)
  }, [handleSkip, toast])

  const initializeRoom = useCallback(async () => {
    try {
      // Get current user
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

      // Load event participants
      await loadParticipants()

      // Initialize media
      await initializeMedia()

      // Start matchmaking
      await findMatch()

    } catch (error) {
      console.error('Error initializing room:', error)
      toast({
        title: "Error joining room",
        description: "Please check your camera and microphone permissions.",
        variant: "destructive"
      })
    }
  }, [navigate, loadParticipants, initializeMedia, findMatch, toast])

  // Timer effect
  useEffect(() => {
    if (matchStatus === 'matched' && timeRemaining > 0) {
      const timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            handleTimeUp()
            return 0
          }
          return prev - 1
        })
      }, 1000)
      
      return () => clearInterval(timer)
    }
  }, [matchStatus, timeRemaining, handleTimeUp])

  // Initialize media and load data
  useEffect(() => {
    initializeRoom()
    return () => {
      cleanup()
    }
  }, [initializeRoom, cleanup])

  const handleExtendTime = async () => {
    if (!currentMatch || !currentUser) return

    setExtensionRequested(true)
    
    // In a real app, this would send a request to the other user
    // For demo, we'll auto-approve after 2 seconds
    setTimeout(() => {
      setTimeRemaining(prev => prev + 180) // Add 3 minutes
      setExtensionRequested(false)
      setMatchStatus('matched')
      
      toast({
        title: "Time extended!",
        description: "Added 3 more minutes to your conversation."
      })
    }, 2000)
  }

  const handleConnect = async () => {
    if (!currentMatch || !currentUser) return

    setConnectionRequested(true)
    
    try {
      // Create connection record
      await blink.db.connections.create({
        id: `connection_${Date.now()}`,
        eventId: eventId!,
        user1Id: currentUser.id,
        user2Id: currentMatch.id,
        contactInfoPurchased: false,
        followUpScheduled: false,
        callCompleted: false,
        createdAt: new Date().toISOString()
      })

      // Update match record
      const matches = await blink.db.matches.list({
        where: {
          AND: [
            { eventId: eventId },
            { user1Id: currentUser.id },
            { user2Id: currentMatch.id }
          ]
        },
        limit: 1
      })

      if (matches.length > 0) {
        await blink.db.matches.update(matches[0].id, {
          connectionRequested: true,
          connectionApproved: true // Auto-approve for demo
        })
      }

      toast({
        title: "Connection made!",
        description: `You're now connected with ${currentMatch.firstName}. You can view their contact info after the event.`
      })

    } catch (error) {
      console.error('Error creating connection:', error)
    }
  }

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0]
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled
        setIsVideoEnabled(videoTrack.enabled)
      }
    }
  }

  const toggleAudio = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0]
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled
        setIsAudioEnabled(audioTrack.enabled)
      }
    }
  }

  const toggleSpeaker = () => {
    setIsSpeakerEnabled(!isSpeakerEnabled)
    if (remoteVideoRef.current) {
      remoteVideoRef.current.muted = isSpeakerEnabled
    }
  }

  const leaveRoom = () => {
    cleanup()
    navigate('/dashboard')
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-bold text-primary mb-2">Loading...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <div className="text-xl font-bold text-primary">BLKBOOK Speed Networking</div>
            <Badge variant="outline" className="flex items-center">
              <Users className="mr-1 h-3 w-3" />
              {participants.length} participants
            </Badge>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="text-sm text-muted-foreground">
              {currentUser.firstName} {currentUser.lastName}
            </div>
            <Button variant="outline" onClick={leaveRoom}>
              <PhoneOff className="mr-2 h-4 w-4" />
              Leave Room
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Video Area */}
          <div className="lg:col-span-3">
            <Card>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  {/* Local Video */}
                  <div className="relative bg-secondary rounded-lg overflow-hidden aspect-video">
                    <video
                      ref={localVideoRef}
                      autoPlay
                      muted
                      playsInline
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-2 left-2 bg-black/50 text-white px-2 py-1 rounded text-sm">
                      You
                    </div>
                    {!isVideoEnabled && (
                      <div className="absolute inset-0 bg-secondary flex items-center justify-center">
                        <Avatar className="h-16 w-16">
                          <AvatarFallback className="text-2xl">
                            {currentUser.firstName[0]}{currentUser.lastName[0]}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                    )}
                  </div>

                  {/* Remote Video */}
                  <div className="relative bg-secondary rounded-lg overflow-hidden aspect-video">
                    {currentMatch ? (
                      <>
                        <video
                          ref={remoteVideoRef}
                          autoPlay
                          playsInline
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute bottom-2 left-2 bg-black/50 text-white px-2 py-1 rounded text-sm">
                          {currentMatch.firstName}
                        </div>
                        {/* Placeholder for demo - in real app this would show actual video */}
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                          <Avatar className="h-16 w-16">
                            <AvatarFallback className="text-2xl text-white">
                              {currentMatch.firstName[0]}{currentMatch.lastName[0]}
                            </AvatarFallback>
                          </Avatar>
                        </div>
                      </>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                        {matchStatus === 'waiting' ? 'Finding your next match...' : 'No match yet'}
                      </div>
                    )}
                  </div>
                </div>

                {/* Timer */}
                {matchStatus === 'matched' && (
                  <div className="mb-6">
                    <div className="flex items-center justify-center space-x-4 mb-2">
                      <Clock className="h-5 w-5 text-muted-foreground" />
                      <span className="text-2xl font-bold text-primary">
                        {formatTime(timeRemaining)}
                      </span>
                    </div>
                    <Progress 
                      value={(timeRemaining / 300) * 100} 
                      className="h-2"
                    />
                  </div>
                )}

                {/* Controls */}
                <div className="flex justify-center space-x-4">
                  <Button
                    variant={isVideoEnabled ? "default" : "destructive"}
                    size="lg"
                    onClick={toggleVideo}
                  >
                    {isVideoEnabled ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
                  </Button>
                  
                  <Button
                    variant={isAudioEnabled ? "default" : "destructive"}
                    size="lg"
                    onClick={toggleAudio}
                  >
                    {isAudioEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
                  </Button>
                  
                  <Button
                    variant={isSpeakerEnabled ? "default" : "outline"}
                    size="lg"
                    onClick={toggleSpeaker}
                  >
                    {isSpeakerEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Match Info & Actions */}
          <div className="space-y-6">
            {/* Current Match */}
            {currentMatch && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    Current Match
                    <Badge variant="secondary">
                      {currentMatch.compatibilityScore}% match
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center">
                    <Avatar className="h-16 w-16 mx-auto mb-3">
                      <AvatarFallback className="text-xl">
                        {currentMatch.firstName[0]}{currentMatch.lastName[0]}
                      </AvatarFallback>
                    </Avatar>
                    <h3 className="font-semibold text-lg">{currentMatch.firstName}</h3>
                    <p className="text-sm text-muted-foreground">{currentMatch.jobTitle}</p>
                    <p className="text-sm text-muted-foreground">{currentMatch.company}</p>
                  </div>

                  <div>
                    <div className="text-sm font-medium mb-1">Primary Goal</div>
                    <Badge variant="outline" className="text-xs">
                      {currentMatch.primaryGoal}
                    </Badge>
                  </div>

                  <div>
                    <div className="text-sm font-medium mb-1">Can Help With</div>
                    <p className="text-sm text-muted-foreground">{currentMatch.canHelpWith}</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Actions */}
            {matchStatus === 'matched' && currentMatch && (
              <Card>
                <CardHeader>
                  <CardTitle>Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button 
                    className="w-full bg-green-600 hover:bg-green-700"
                    onClick={handleConnect}
                    disabled={connectionRequested}
                  >
                    <Heart className="mr-2 h-4 w-4" />
                    {connectionRequested ? 'Connected!' : 'Connect'}
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={handleExtendTime}
                    disabled={extensionRequested || timeRemaining < 60}
                  >
                    <Clock className="mr-2 h-4 w-4" />
                    {extensionRequested ? 'Requesting...' : 'Extend Time (+3 min)'}
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={handleSkip}
                  >
                    <ArrowRight className="mr-2 h-4 w-4" />
                    Next Match
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Waiting State */}
            {matchStatus === 'waiting' && (
              <Card>
                <CardHeader>
                  <CardTitle>Finding Match...</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-sm text-muted-foreground">
                      AI is finding your perfect networking match based on your goals and skills...
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Participants */}
            <Card>
              <CardHeader>
                <CardTitle>Active Participants</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {participants.slice(0, 5).map((participant) => (
                    <div key={participant.id} className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm">
                        {participant.firstName} {participant.lastName[0]}.
                      </span>
                    </div>
                  ))}
                  {participants.length > 5 && (
                    <div className="text-sm text-muted-foreground">
                      +{participants.length - 5} more participants
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}