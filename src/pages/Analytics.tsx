import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function Analytics() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Analytics</CardTitle>
          <CardDescription>View your networking performance</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Analytics dashboard functionality coming soon...
          </p>
        </CardContent>
      </Card>
    </div>
  )
}