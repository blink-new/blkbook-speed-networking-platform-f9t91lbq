import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function Connections() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Connections</CardTitle>
          <CardDescription>Manage your networking connections</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Connections management functionality coming soon...
          </p>
        </CardContent>
      </Card>
    </div>
  )
}