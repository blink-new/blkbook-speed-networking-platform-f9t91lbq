import { useParams } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function EventLobby() {
  const { eventId } = useParams()

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Event Lobby</CardTitle>
          <CardDescription>Event ID: {eventId}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Event lobby functionality coming soon...
          </p>
        </CardContent>
      </Card>
    </div>
  )
}