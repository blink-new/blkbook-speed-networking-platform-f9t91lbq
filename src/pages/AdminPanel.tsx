import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function AdminPanel() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Admin Panel</CardTitle>
          <CardDescription>Manage events and users</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Admin panel functionality coming soon...
          </p>
        </CardContent>
      </Card>
    </div>
  )
}