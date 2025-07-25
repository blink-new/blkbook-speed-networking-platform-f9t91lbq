import { blink } from '@/blink/client'

export interface EmailTemplate {
  subject: string
  html: string
  text: string
}

export interface InvitationData {
  inviterName: string
  inviterTitle: string
  inviterCompany: string
  eventTitle: string
  eventDate: string
  eventTime: string
  eventDescription: string
  invitationReason: string
  rsvpLink: string
}

export class EmailService {
  static async sendEventInvitation(
    recipientEmail: string,
    recipientName: string,
    invitationData: InvitationData
  ): Promise<boolean> {
    try {
      const template = this.generateInvitationTemplate(recipientName, invitationData)
      
      const result = await blink.notifications.email({
        to: recipientEmail,
        from: 'events@blkbook.com',
        subject: template.subject,
        html: template.html,
        text: template.text
      })

      return result.success
    } catch (error) {
      console.error('Error sending invitation email:', error)
      return false
    }
  }

  static async sendWelcomeEmail(
    recipientEmail: string,
    recipientName: string,
    nextEventDate?: string
  ): Promise<boolean> {
    try {
      const template = this.generateWelcomeTemplate(recipientName, nextEventDate)
      
      const result = await blink.notifications.email({
        to: recipientEmail,
        from: 'welcome@blkbook.com',
        subject: template.subject,
        html: template.html,
        text: template.text
      })

      return result.success
    } catch (error) {
      console.error('Error sending welcome email:', error)
      return false
    }
  }

  static async sendConnectionNotification(
    recipientEmail: string,
    recipientName: string,
    connectionName: string,
    eventTitle: string
  ): Promise<boolean> {
    try {
      const template = this.generateConnectionTemplate(recipientName, connectionName, eventTitle)
      
      const result = await blink.notifications.email({
        to: recipientEmail,
        from: 'connections@blkbook.com',
        subject: template.subject,
        html: template.html,
        text: template.text
      })

      return result.success
    } catch (error) {
      console.error('Error sending connection notification:', error)
      return false
    }
  }

  static async sendFollowUpReminder(
    recipientEmail: string,
    recipientName: string,
    connectionName: string,
    meetingLink: string
  ): Promise<boolean> {
    try {
      const template = this.generateFollowUpTemplate(recipientName, connectionName, meetingLink)
      
      const result = await blink.notifications.email({
        to: recipientEmail,
        from: 'followup@blkbook.com',
        subject: template.subject,
        html: template.html,
        text: template.text
      })

      return result.success
    } catch (error) {
      console.error('Error sending follow-up reminder:', error)
      return false
    }
  }

  private static generateInvitationTemplate(
    recipientName: string,
    data: InvitationData
  ): EmailTemplate {
    const subject = `You're invited to ${data.eventTitle} by ${data.inviterName}`
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>BLKBOOK Event Invitation</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5; }
          .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
          .header { background: linear-gradient(135deg, #1a1a1a 0%, #3b82f6 100%); color: white; padding: 30px; text-align: center; }
          .header h1 { margin: 0; font-size: 28px; font-weight: bold; }
          .content { padding: 30px; }
          .event-card { background-color: #f8fafc; border-left: 4px solid #3b82f6; padding: 20px; margin: 20px 0; border-radius: 4px; }
          .cta-button { display: inline-block; background-color: #3b82f6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
          .cta-button:hover { background-color: #2563eb; }
          .footer { background-color: #f8fafc; padding: 20px; text-align: center; font-size: 14px; color: #666; }
          .reason-box { background-color: #eff6ff; border: 1px solid #bfdbfe; padding: 15px; border-radius: 6px; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🤝 BLKBOOK</h1>
            <p>Professional Speed Networking</p>
          </div>
          
          <div class="content">
            <h2>Hi ${recipientName},</h2>
            
            <p>You've been personally invited by <strong>${data.inviterName}</strong> (${data.inviterTitle} at ${data.inviterCompany}) to join an exclusive networking event!</p>
            
            <div class="reason-box">
              <h4>🎯 Why you're a perfect match:</h4>
              <p>${data.invitationReason}</p>
            </div>
            
            <div class="event-card">
              <h3>📅 ${data.eventTitle}</h3>
              <p><strong>Date:</strong> ${data.eventDate}</p>
              <p><strong>Time:</strong> ${data.eventTime}</p>
              <p><strong>Format:</strong> Virtual Speed Networking</p>
              <p>${data.eventDescription}</p>
            </div>
            
            <p>This is your chance to connect with like-minded professionals, potential partners, and industry leaders in focused 1:1 conversations.</p>
            
            <div style="text-align: center;">
              <a href="${data.rsvpLink}" class="cta-button">RSVP Now - It's Free!</a>
            </div>
            
            <p><strong>What to expect:</strong></p>
            <ul>
              <li>🎯 AI-powered matching based on your goals and expertise</li>
              <li>⏱️ Structured 5-minute conversations with extension options</li>
              <li>🤝 Mutual connection system for follow-ups</li>
              <li>📊 Post-event analytics and contact management</li>
            </ul>
            
            <p>Spots are limited and fill up quickly. Secure your place today!</p>
            
            <p>Best regards,<br>
            The BLKBOOK Team</p>
          </div>
          
          <div class="footer">
            <p>© 2024 BLKBOOK. Professional networking reimagined.</p>
            <p>If you don't want to receive these invitations, <a href="#">unsubscribe here</a>.</p>
          </div>
        </div>
      </body>
      </html>
    `
    
    const text = `
Hi ${recipientName},

You've been personally invited by ${data.inviterName} (${data.inviterTitle} at ${data.inviterCompany}) to join an exclusive networking event!

🎯 Why you're a perfect match:
${data.invitationReason}

📅 EVENT DETAILS:
${data.eventTitle}
Date: ${data.eventDate}
Time: ${data.eventTime}
Format: Virtual Speed Networking

${data.eventDescription}

This is your chance to connect with like-minded professionals, potential partners, and industry leaders in focused 1:1 conversations.

RSVP Now: ${data.rsvpLink}

What to expect:
• AI-powered matching based on your goals and expertise
• Structured 5-minute conversations with extension options
• Mutual connection system for follow-ups
• Post-event analytics and contact management

Spots are limited and fill up quickly. Secure your place today!

Best regards,
The BLKBOOK Team

© 2024 BLKBOOK. Professional networking reimagined.
    `
    
    return { subject, html, text }
  }

  private static generateWelcomeTemplate(
    recipientName: string,
    nextEventDate?: string
  ): EmailTemplate {
    const subject = `Welcome to BLKBOOK, ${recipientName}! Your networking journey starts here 🚀`
    
    const nextEventSection = nextEventDate ? `
      <div class="event-highlight">
        <h3>🎯 Your Next Opportunity</h3>
        <p>There's an upcoming networking event on <strong>${nextEventDate}</strong> that matches your goals perfectly. Check your dashboard to RSVP!</p>
      </div>
    ` : ''
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to BLKBOOK</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5; }
          .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
          .header { background: linear-gradient(135deg, #1a1a1a 0%, #3b82f6 100%); color: white; padding: 30px; text-align: center; }
          .content { padding: 30px; }
          .event-highlight { background-color: #eff6ff; border: 1px solid #bfdbfe; padding: 20px; border-radius: 6px; margin: 20px 0; }
          .cta-button { display: inline-block; background-color: #3b82f6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
          .footer { background-color: #f8fafc; padding: 20px; text-align: center; font-size: 14px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Welcome to BLKBOOK!</h1>
            <p>Where meaningful connections happen</p>
          </div>
          
          <div class="content">
            <h2>Hi ${recipientName},</h2>
            
            <p>Welcome to the future of professional networking! You've just joined a community of ambitious professionals who believe in the power of meaningful connections.</p>
            
            ${nextEventSection}
            
            <h3>🚀 What's Next?</h3>
            <ol>
              <li><strong>Complete your profile</strong> - Add your goals and skills for better matching</li>
              <li><strong>Browse upcoming events</strong> - Find networking opportunities that align with your objectives</li>
              <li><strong>RSVP to your first event</strong> - Start building valuable connections</li>
              <li><strong>Import your contacts</strong> - Help us find even better matches for you</li>
            </ol>
            
            <div style="text-align: center;">
              <a href="https://blkbook.com/dashboard" class="cta-button">Go to Dashboard</a>
            </div>
            
            <h3>💡 Pro Tips for Success:</h3>
            <ul>
              <li>Be specific about your networking goals</li>
              <li>Come prepared with a clear elevator pitch</li>
              <li>Follow up within 24 hours of making connections</li>
              <li>Use the platform's analytics to track your progress</li>
            </ul>
            
            <p>We're excited to see the connections you'll make and the opportunities that will unfold!</p>
            
            <p>Happy networking,<br>
            The BLKBOOK Team</p>
          </div>
          
          <div class="footer">
            <p>© 2024 BLKBOOK. Professional networking reimagined.</p>
          </div>
        </div>
      </body>
      </html>
    `
    
    const text = `
Welcome to BLKBOOK, ${recipientName}!

Welcome to the future of professional networking! You've just joined a community of ambitious professionals who believe in the power of meaningful connections.

${nextEventDate ? `🎯 Your Next Opportunity: There's an upcoming networking event on ${nextEventDate} that matches your goals perfectly. Check your dashboard to RSVP!` : ''}

🚀 What's Next?
1. Complete your profile - Add your goals and skills for better matching
2. Browse upcoming events - Find networking opportunities that align with your objectives
3. RSVP to your first event - Start building valuable connections
4. Import your contacts - Help us find even better matches for you

Dashboard: https://blkbook.com/dashboard

💡 Pro Tips for Success:
• Be specific about your networking goals
• Come prepared with a clear elevator pitch
• Follow up within 24 hours of making connections
• Use the platform's analytics to track your progress

We're excited to see the connections you'll make and the opportunities that will unfold!

Happy networking,
The BLKBOOK Team
    `
    
    return { subject, html, text }
  }

  private static generateConnectionTemplate(
    recipientName: string,
    connectionName: string,
    eventTitle: string
  ): EmailTemplate {
    const subject = `New connection made: ${connectionName} from ${eventTitle}`
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Connection - BLKBOOK</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5; }
          .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
          .header { background: linear-gradient(135deg, #16a34a 0%, #22c55e 100%); color: white; padding: 30px; text-align: center; }
          .content { padding: 30px; }
          .cta-button { display: inline-block; background-color: #16a34a; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
          .footer { background-color: #f8fafc; padding: 20px; text-align: center; font-size: 14px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Connection Made!</h1>
            <p>Your networking is paying off</p>
          </div>
          
          <div class="content">
            <h2>Great news, ${recipientName}!</h2>
            
            <p>You've successfully connected with <strong>${connectionName}</strong> at ${eventTitle}. This mutual connection shows real potential for collaboration!</p>
            
            <h3>🚀 Next Steps:</h3>
            <ol>
              <li><strong>Purchase contact info</strong> - Get their email and LinkedIn to continue the conversation</li>
              <li><strong>Schedule a follow-up</strong> - Strike while the iron is hot</li>
              <li><strong>Send a personalized message</strong> - Reference your conversation from the event</li>
            </ol>
            
            <div style="text-align: center;">
              <a href="https://blkbook.com/connections" class="cta-button">View Connection Details</a>
            </div>
            
            <p><strong>💡 Follow-up tip:</strong> The best time to reach out is within 24 hours while your conversation is still fresh in their mind.</p>
            
            <p>Keep up the great networking!</p>
            
            <p>Best regards,<br>
            The BLKBOOK Team</p>
          </div>
          
          <div class="footer">
            <p>© 2024 BLKBOOK. Professional networking reimagined.</p>
          </div>
        </div>
      </body>
      </html>
    `
    
    const text = `
Great news, ${recipientName}!

You've successfully connected with ${connectionName} at ${eventTitle}. This mutual connection shows real potential for collaboration!

🚀 Next Steps:
1. Purchase contact info - Get their email and LinkedIn to continue the conversation
2. Schedule a follow-up - Strike while the iron is hot
3. Send a personalized message - Reference your conversation from the event

View Connection Details: https://blkbook.com/connections

💡 Follow-up tip: The best time to reach out is within 24 hours while your conversation is still fresh in their mind.

Keep up the great networking!

Best regards,
The BLKBOOK Team
    `
    
    return { subject, html, text }
  }

  private static generateFollowUpTemplate(
    recipientName: string,
    connectionName: string,
    meetingLink: string
  ): EmailTemplate {
    const subject = `Reminder: Follow-up call with ${connectionName} scheduled`
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Follow-up Reminder - BLKBOOK</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5; }
          .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
          .header { background: linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%); color: white; padding: 30px; text-align: center; }
          .content { padding: 30px; }
          .meeting-card { background-color: #fef3c7; border: 1px solid #fcd34d; padding: 20px; border-radius: 6px; margin: 20px 0; }
          .cta-button { display: inline-block; background-color: #f59e0b; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
          .footer { background-color: #f8fafc; padding: 20px; text-align: center; font-size: 14px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⏰ Follow-up Reminder</h1>
            <p>Your networking call is coming up</p>
          </div>
          
          <div class="content">
            <h2>Hi ${recipientName},</h2>
            
            <p>This is a friendly reminder about your upcoming follow-up call with <strong>${connectionName}</strong>.</p>
            
            <div class="meeting-card">
              <h3>📞 Meeting Details</h3>
              <p><strong>With:</strong> ${connectionName}</p>
              <p><strong>Meeting Link:</strong> <a href="${meetingLink}">${meetingLink}</a></p>
            </div>
            
            <h3>📝 Preparation Tips:</h3>
            <ul>
              <li>Review your notes from the networking event</li>
              <li>Prepare specific questions about their business/goals</li>
              <li>Think about potential collaboration opportunities</li>
              <li>Have your calendar ready for scheduling next steps</li>
            </ul>
            
            <div style="text-align: center;">
              <a href="${meetingLink}" class="cta-button">Join Meeting</a>
            </div>
            
            <p>Make the most of this opportunity to deepen your professional relationship!</p>
            
            <p>Best of luck,<br>
            The BLKBOOK Team</p>
          </div>
          
          <div class="footer">
            <p>© 2024 BLKBOOK. Professional networking reimagined.</p>
          </div>
        </div>
      </body>
      </html>
    `
    
    const text = `
Hi ${recipientName},

This is a friendly reminder about your upcoming follow-up call with ${connectionName}.

📞 Meeting Details:
With: ${connectionName}
Meeting Link: ${meetingLink}

📝 Preparation Tips:
• Review your notes from the networking event
• Prepare specific questions about their business/goals
• Think about potential collaboration opportunities
• Have your calendar ready for scheduling next steps

Join Meeting: ${meetingLink}

Make the most of this opportunity to deepen your professional relationship!

Best of luck,
The BLKBOOK Team
    `
    
    return { subject, html, text }
  }
}