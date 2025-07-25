import { Loader2 } from 'lucide-react'

export default function LoadingScreen() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="mb-4">
          <div className="text-3xl font-bold text-primary mb-2">BLKBOOK</div>
          <div className="text-sm text-muted-foreground">Speed Networking Platform</div>
        </div>
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-accent" />
      </div>
    </div>
  )
}