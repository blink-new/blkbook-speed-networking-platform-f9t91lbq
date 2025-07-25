import { blink } from '@/blink/client'
import type { User } from '@/types'

export interface MatchingProfile {
  id: string
  firstName: string
  lastName: string
  jobTitle: string
  company: string
  industry: string
  goals: string[]
  skills: string[]
  bio?: string
  experience?: string
  interests?: string[]
}

export interface AIMatchResult {
  userId: string
  compatibilityScore: number
  reasoning: string
  matchStrengths: string[]
  potentialOpportunities: string[]
  conversationStarters: string[]
  riskFactors?: string[]
}

export interface NetworkingInsight {
  type: 'goal_alignment' | 'skill_complement' | 'industry_connection' | 'mutual_benefit'
  description: string
  confidence: number
}

export class AIMatchingService {
  /**
   * Advanced AI-powered compatibility scoring using OpenAI
   */
  static async calculateAdvancedCompatibility(
    user1: MatchingProfile,
    user2: MatchingProfile,
    context?: {
      eventType?: string
      previousInteractions?: number
      mutualConnections?: number
    }
  ): Promise<AIMatchResult> {
    try {
      const prompt = this.buildMatchingPrompt(user1, user2, context)
      
      const { object: matchResult } = await blink.ai.generateObject({
        prompt,
        schema: {
          type: 'object',
          properties: {
            compatibilityScore: {
              type: 'number',
              description: 'Compatibility score from 0-100'
            },
            reasoning: {
              type: 'string',
              description: 'Detailed explanation of the compatibility assessment'
            },
            matchStrengths: {
              type: 'array',
              items: { type: 'string' },
              description: 'Key strengths of this potential match'
            },
            potentialOpportunities: {
              type: 'array',
              items: { type: 'string' },
              description: 'Specific opportunities that could arise from this connection'
            },
            conversationStarters: {
              type: 'array',
              items: { type: 'string' },
              description: 'Suggested conversation topics and questions'
            },
            riskFactors: {
              type: 'array',
              items: { type: 'string' },
              description: 'Potential challenges or misalignments to be aware of'
            }
          },
          required: ['compatibilityScore', 'reasoning', 'matchStrengths', 'potentialOpportunities', 'conversationStarters']
        }
      })

      return {
        userId: user2.id,
        ...matchResult
      }
    } catch (error) {
      console.error('Error calculating AI compatibility:', error)
      
      // Fallback to basic scoring
      return this.calculateBasicCompatibility(user1, user2)
    }
  }

  /**
   * Generate personalized networking insights for a user
   */
  static async generateNetworkingInsights(
    user: MatchingProfile,
    recentMatches: AIMatchResult[],
    networkingHistory?: {
      totalConnections: number
      successfulFollowUps: number
      topIndustries: string[]
      goalProgress: Record<string, number>
    }
  ): Promise<{
    insights: NetworkingInsight[]
    recommendations: string[]
    nextSteps: string[]
  }> {
    try {
      const prompt = `
Analyze this professional's networking profile and recent matches to provide personalized insights:

PROFILE:
Name: ${user.firstName} ${user.lastName}
Role: ${user.jobTitle} at ${user.company}
Industry: ${user.industry}
Goals: ${user.goals.join(', ')}
Skills: ${user.skills.join(', ')}

RECENT MATCHES:
${recentMatches.map(match => `
- Compatibility: ${match.compatibilityScore}%
- Strengths: ${match.matchStrengths.join(', ')}
- Opportunities: ${match.potentialOpportunities.join(', ')}
`).join('\n')}

NETWORKING HISTORY:
${networkingHistory ? `
- Total Connections: ${networkingHistory.totalConnections}
- Successful Follow-ups: ${networkingHistory.successfulFollowUps}
- Top Industries: ${networkingHistory.topIndustries.join(', ')}
- Goal Progress: ${Object.entries(networkingHistory.goalProgress).map(([goal, progress]) => `${goal}: ${progress}%`).join(', ')}
` : 'No history available'}

Provide strategic networking insights and actionable recommendations.
      `

      const { object: analysis } = await blink.ai.generateObject({
        prompt,
        schema: {
          type: 'object',
          properties: {
            insights: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  type: {
                    type: 'string',
                    enum: ['goal_alignment', 'skill_complement', 'industry_connection', 'mutual_benefit']
                  },
                  description: { type: 'string' },
                  confidence: { type: 'number' }
                }
              }
            },
            recommendations: {
              type: 'array',
              items: { type: 'string' },
              description: 'Strategic recommendations for improving networking effectiveness'
            },
            nextSteps: {
              type: 'array',
              items: { type: 'string' },
              description: 'Specific actionable next steps'
            }
          },
          required: ['insights', 'recommendations', 'nextSteps']
        }
      })

      return analysis
    } catch (error) {
      console.error('Error generating networking insights:', error)
      
      // Fallback insights
      return {
        insights: [
          {
            type: 'goal_alignment',
            description: 'Focus on connecting with professionals who share your primary goals',
            confidence: 0.8
          }
        ],
        recommendations: [
          'Attend events that align with your industry and goals',
          'Follow up with connections within 24 hours',
          'Be specific about how you can help others'
        ],
        nextSteps: [
          'Update your profile with more specific goals',
          'Import more contacts for better matching',
          'Schedule follow-up calls with recent connections'
        ]
      }
    }
  }

  /**
   * Generate personalized conversation starters for a specific match
   */
  static async generateConversationStarters(
    user1: MatchingProfile,
    user2: MatchingProfile,
    context: {
      eventType: string
      timeLimit: number
      previousConversations?: string[]
    }
  ): Promise<{
    iceBreakers: string[]
    deepQuestions: string[]
    collaborationTopics: string[]
    followUpSuggestions: string[]
  }> {
    try {
      const prompt = `
Generate conversation starters for a ${context.timeLimit}-minute networking conversation:

PERSON 1: ${user1.firstName} ${user1.lastName}
- Role: ${user1.jobTitle} at ${user1.company}
- Goals: ${user1.goals.join(', ')}
- Skills: ${user1.skills.join(', ')}

PERSON 2: ${user2.firstName} ${user2.lastName}
- Role: ${user2.jobTitle} at ${user2.company}
- Goals: ${user2.goals.join(', ')}
- Skills: ${user2.skills.join(', ')}

EVENT: ${context.eventType}
TIME LIMIT: ${context.timeLimit} minutes

${context.previousConversations ? `PREVIOUS TOPICS: ${context.previousConversations.join(', ')}` : ''}

Create conversation starters that maximize value for both parties.
      `

      const { object: starters } = await blink.ai.generateObject({
        prompt,
        schema: {
          type: 'object',
          properties: {
            iceBreakers: {
              type: 'array',
              items: { type: 'string' },
              description: 'Light, engaging opening questions'
            },
            deepQuestions: {
              type: 'array',
              items: { type: 'string' },
              description: 'Meaningful questions that uncover opportunities'
            },
            collaborationTopics: {
              type: 'array',
              items: { type: 'string' },
              description: 'Topics that could lead to collaboration'
            },
            followUpSuggestions: {
              type: 'array',
              items: { type: 'string' },
              description: 'Suggestions for continuing the relationship'
            }
          },
          required: ['iceBreakers', 'deepQuestions', 'collaborationTopics', 'followUpSuggestions']
        }
      })

      return starters
    } catch (error) {
      console.error('Error generating conversation starters:', error)
      
      // Fallback conversation starters
      return {
        iceBreakers: [
          "What brought you to this networking event?",
          "What's the most exciting project you're working on right now?",
          "How did you get started in your industry?"
        ],
        deepQuestions: [
          "What's your biggest challenge in achieving your current goals?",
          "What kind of partnerships or collaborations are you looking for?",
          "What trends are you seeing in your industry?"
        ],
        collaborationTopics: [
          "Potential synergies between your companies",
          "Shared industry challenges and solutions",
          "Mutual professional development opportunities"
        ],
        followUpSuggestions: [
          "Schedule a coffee chat to explore collaboration",
          "Share relevant industry resources",
          "Make introductions to mutual connections"
        ]
      }
    }
  }

  /**
   * Analyze conversation outcomes and provide learning insights
   */
  static async analyzeConversationOutcome(
    user1: MatchingProfile,
    user2: MatchingProfile,
    conversationData: {
      duration: number
      connectionMade: boolean
      userRating: number
      notes?: string
      followUpScheduled: boolean
    }
  ): Promise<{
    insights: string[]
    improvementSuggestions: string[]
    futureMatchingAdjustments: string[]
  }> {
    try {
      const prompt = `
Analyze this networking conversation outcome:

PARTICIPANTS:
1. ${user1.firstName} ${user1.lastName} (${user1.jobTitle} at ${user1.company})
2. ${user2.firstName} ${user2.lastName} (${user2.jobTitle} at ${user2.company})

CONVERSATION DATA:
- Duration: ${conversationData.duration} minutes
- Connection Made: ${conversationData.connectionMade}
- User Rating: ${conversationData.userRating}/5
- Follow-up Scheduled: ${conversationData.followUpScheduled}
${conversationData.notes ? `- Notes: ${conversationData.notes}` : ''}

Provide insights for improving future networking experiences.
      `

      const { object: analysis } = await blink.ai.generateObject({
        prompt,
        schema: {
          type: 'object',
          properties: {
            insights: {
              type: 'array',
              items: { type: 'string' },
              description: 'Key insights from this conversation'
            },
            improvementSuggestions: {
              type: 'array',
              items: { type: 'string' },
              description: 'Suggestions for improving future conversations'
            },
            futureMatchingAdjustments: {
              type: 'array',
              items: { type: 'string' },
              description: 'Adjustments to make for future AI matching'
            }
          },
          required: ['insights', 'improvementSuggestions', 'futureMatchingAdjustments']
        }
      })

      return analysis
    } catch (error) {
      console.error('Error analyzing conversation outcome:', error)
      
      return {
        insights: ['Conversation completed successfully'],
        improvementSuggestions: ['Continue practicing active listening'],
        futureMatchingAdjustments: ['Maintain current matching criteria']
      }
    }
  }

  /**
   * Build the AI prompt for matching
   */
  private static buildMatchingPrompt(
    user1: MatchingProfile,
    user2: MatchingProfile,
    context?: {
      eventType?: string
      previousInteractions?: number
      mutualConnections?: number
    }
  ): string {
    return `
You are an expert networking consultant analyzing the compatibility between two professionals for a networking event.

PERSON 1: ${user1.firstName} ${user1.lastName}
- Role: ${user1.jobTitle} at ${user1.company}
- Industry: ${user1.industry}
- Goals: ${user1.goals.join(', ')}
- Skills: ${user1.skills.join(', ')}
${user1.bio ? `- Bio: ${user1.bio}` : ''}

PERSON 2: ${user2.firstName} ${user2.lastName}
- Role: ${user2.jobTitle} at ${user2.company}
- Industry: ${user2.industry}
- Goals: ${user2.goals.join(', ')}
- Skills: ${user2.skills.join(', ')}
${user2.bio ? `- Bio: ${user2.bio}` : ''}

CONTEXT:
${context?.eventType ? `- Event Type: ${context.eventType}` : ''}
${context?.previousInteractions ? `- Previous Interactions: ${context.previousInteractions}` : ''}
${context?.mutualConnections ? `- Mutual Connections: ${context.mutualConnections}` : ''}

Analyze their compatibility for networking, considering:
1. Goal alignment and mutual benefit potential
2. Skill complementarity and learning opportunities
3. Industry synergies and collaboration potential
4. Professional development opportunities
5. Business partnership possibilities

Provide a comprehensive assessment with specific, actionable insights.
    `
  }

  /**
   * Fallback basic compatibility calculation
   */
  private static calculateBasicCompatibility(
    user1: MatchingProfile,
    user2: MatchingProfile
  ): AIMatchResult {
    let score = 0
    const matchStrengths: string[] = []
    const potentialOpportunities: string[] = []

    // Goal-skill matching
    user1.goals.forEach(goal => {
      user2.skills.forEach(skill => {
        if (goal.toLowerCase().includes(skill.toLowerCase()) || 
            skill.toLowerCase().includes(goal.toLowerCase())) {
          score += 20
          matchStrengths.push(`${user2.firstName}'s ${skill} expertise aligns with your ${goal} goal`)
        }
      })
    })

    // Industry alignment
    if (user1.industry === user2.industry) {
      score += 15
      matchStrengths.push('Same industry background')
    }

    // Mutual opportunities
    if (user1.goals.some(g => g.toLowerCase().includes('partnership')) &&
        user2.goals.some(g => g.toLowerCase().includes('partnership'))) {
      score += 25
      potentialOpportunities.push('Business partnership opportunities')
    }

    return {
      userId: user2.id,
      compatibilityScore: Math.min(100, score),
      reasoning: 'Basic compatibility assessment based on goals, skills, and industry alignment',
      matchStrengths,
      potentialOpportunities,
      conversationStarters: [
        `What's driving your interest in ${user2.goals[0]}?`,
        `How has your experience at ${user2.company} shaped your perspective?`,
        `What opportunities are you seeing in ${user2.industry}?`
      ]
    }
  }

  /**
   * Learn from user behavior to improve future matching
   */
  static async updateMatchingModel(
    userId: string,
    interactions: Array<{
      matchedUserId: string
      compatibilityScore: number
      actualOutcome: {
        connectionMade: boolean
        userRating: number
        followUpScheduled: boolean
        opportunityCreated: boolean
      }
    }>
  ): Promise<void> {
    try {
      // Store learning data for future model improvements
      await blink.db.userBehaviorLearning.create({
        id: `learning_${Date.now()}`,
        userId,
        interactionData: JSON.stringify(interactions),
        createdAt: new Date().toISOString()
      })

      // Analyze patterns for immediate adjustments
      const successfulMatches = interactions.filter(i => 
        i.actualOutcome.connectionMade && i.actualOutcome.userRating >= 4
      )

      if (successfulMatches.length > 0) {
        const avgSuccessfulScore = successfulMatches.reduce((sum, match) => 
          sum + match.compatibilityScore, 0
        ) / successfulMatches.length

        // Update user's matching preferences
        await blink.db.users.update(userId, {
          preferredCompatibilityThreshold: avgSuccessfulScore,
          updatedAt: new Date().toISOString()
        })
      }
    } catch (error) {
      console.error('Error updating matching model:', error)
    }
  }
}