import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { X, Plus, ArrowRight, ArrowLeft } from 'lucide-react'
import { blink } from '@/blink/client'
import { useToast } from '@/hooks/use-toast'
import { ContactSyncService, type Contact } from '@/utils/contactSync'
import { EmailService } from '@/utils/emailService'

const COMMON_GOALS = [
  'Find investors', 'Raise funding', 'Find co-founder', 'Business partnerships',
  'Job opportunities', 'Mentorship', 'Industry insights', 'Client acquisition',
  'Supplier connections', 'Strategic alliances'
]

const COMMON_SKILLS = [
  'Software Development', 'Marketing', 'Sales', 'Finance', 'Operations',
  'Product Management', 'Design', 'Data Analysis', 'Legal', 'HR',
  'Business Development', 'Consulting', 'Project Management'
]

export default function OnboardingFlow() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [importedContacts, setImportedContacts] = useState<Contact[]>([])
  const [isImporting, setIsImporting] = useState(false)

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    jobTitle: '',
    company: '',
    industry: '',
    goals: [] as string[],
    skills: [] as string[],
    meetingLink: '',
    customGoal: '',
    customSkill: ''
  })

  const totalSteps = 4
  const progress = (currentStep / totalSteps) * 100

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const addGoal = (goal: string) => {
    if (!formData.goals.includes(goal)) {
      setFormData({ ...formData, goals: [...formData.goals, goal] })
    }
  }

  const removeGoal = (goal: string) => {
    setFormData({ ...formData, goals: formData.goals.filter(g => g !== goal) })
  }

  const addCustomGoal = () => {
    if (formData.customGoal.trim() && !formData.goals.includes(formData.customGoal.trim())) {
      setFormData({ 
        ...formData, 
        goals: [...formData.goals, formData.customGoal.trim()],
        customGoal: ''
      })
    }
  }

  const addSkill = (skill: string) => {
    if (!formData.skills.includes(skill)) {
      setFormData({ ...formData, skills: [...formData.skills, skill] })
    }
  }

  const removeSkill = (skill: string) => {
    setFormData({ ...formData, skills: formData.skills.filter(s => s !== skill) })
  }

  const addCustomSkill = () => {
    if (formData.customSkill.trim() && !formData.skills.includes(formData.customSkill.trim())) {
      setFormData({ 
        ...formData, 
        skills: [...formData.skills, formData.customSkill.trim()],
        customSkill: ''
      })
    }
  }

  const handleCSVImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsImporting(true)
    try {
      const contacts = await ContactSyncService.importFromCSV(file)
      setImportedContacts(contacts)
      
      toast({
        title: "Contacts imported successfully!",
        description: `Imported ${contacts.length} contacts from CSV file.`
      })
    } catch (error) {
      console.error('Error importing CSV:', error)
      toast({
        title: "Error importing contacts",
        description: "Please check your CSV format and try again.",
        variant: "destructive"
      })
    } finally {
      setIsImporting(false)
    }
  }

  const handleLinkedInConnect = async () => {
    try {
      const authUrl = await ContactSyncService.connectLinkedIn()
      window.open(authUrl, '_blank', 'width=600,height=600')
      
      toast({
        title: "LinkedIn authorization opened",
        description: "Complete the authorization in the popup window."
      })
    } catch (error) {
      console.error('Error connecting LinkedIn:', error)
      toast({
        title: "Error connecting LinkedIn",
        description: "Please try again.",
        variant: "destructive"
      })
    }
  }

  const handleGmailConnect = async () => {
    try {
      const authUrl = await ContactSyncService.connectGmail()
      window.open(authUrl, '_blank', 'width=600,height=600')
      
      toast({
        title: "Gmail authorization opened",
        description: "Complete the authorization in the popup window."
      })
    } catch (error) {
      console.error('Error connecting Gmail:', error)
      toast({
        title: "Error connecting Gmail",
        description: "Please try again.",
        variant: "destructive"
      })
    }
  }

  const handleSubmit = async () => {
    setLoading(true)
    try {
      const user = await blink.auth.me()
      
      // Create user profile
      await blink.db.users.create({
        id: user.id,
        email: user.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
        jobTitle: formData.jobTitle,
        company: formData.company,
        industry: formData.industry,
        goals: JSON.stringify(formData.goals),
        skills: JSON.stringify(formData.skills),
        meetingLink: formData.meetingLink,
        importedContacts: JSON.stringify(importedContacts),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })

      // Send welcome email
      await EmailService.sendWelcomeEmail(
        user.email,
        formData.firstName
      )

      toast({
        title: "Profile created successfully!",
        description: "Welcome to BLKBOOK. Let's find your next networking opportunity."
      })

      navigate('/dashboard')
    } catch (error) {
      console.error('Error creating profile:', error)
      toast({
        title: "Error creating profile",
        description: "Please try again.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return formData.firstName && formData.lastName && formData.jobTitle && formData.company && formData.industry
      case 2:
        return formData.goals.length > 0 && formData.skills.length > 0
      case 3:
        return formData.meetingLink
      case 4:
        return true // Contact import is optional
      default:
        return false
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary mb-2">Welcome to BLKBOOK</h1>
          <p className="text-muted-foreground">Let's set up your networking profile</p>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <div className="flex justify-between text-sm text-muted-foreground mb-2">
            <span>Step {currentStep} of {totalSteps}</span>
            <span>{Math.round(progress)}% complete</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>
              {currentStep === 1 && "Basic Information"}
              {currentStep === 2 && "Goals & Skills"}
              {currentStep === 3 && "Meeting Preferences"}
              {currentStep === 4 && "Import Contacts (Optional)"}
            </CardTitle>
            <CardDescription>
              {currentStep === 1 && "Tell us about yourself and your professional background"}
              {currentStep === 2 && "What are you looking to achieve through networking?"}
              {currentStep === 3 && "How would you like to connect with others?"}
              {currentStep === 4 && "Import your contacts for better AI matching"}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Step 1: Basic Information */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      placeholder="John"
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      placeholder="Doe"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="jobTitle">Job Title</Label>
                  <Input
                    id="jobTitle"
                    value={formData.jobTitle}
                    onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                    placeholder="Software Engineer"
                  />
                </div>

                <div>
                  <Label htmlFor="company">Company</Label>
                  <Input
                    id="company"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    placeholder="Tech Corp"
                  />
                </div>

                <div>
                  <Label htmlFor="industry">Industry</Label>
                  <Input
                    id="industry"
                    value={formData.industry}
                    onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                    placeholder="Technology"
                  />
                </div>
              </div>
            )}

            {/* Step 2: Goals & Skills */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div>
                  <Label className="text-base font-medium">What are your networking goals?</Label>
                  <p className="text-sm text-muted-foreground mb-3">Select all that apply or add your own</p>
                  
                  <div className="flex flex-wrap gap-2 mb-4">
                    {COMMON_GOALS.map((goal) => (
                      <Badge
                        key={goal}
                        variant={formData.goals.includes(goal) ? "default" : "outline"}
                        className="cursor-pointer hover:bg-accent hover:text-accent-foreground"
                        onClick={() => formData.goals.includes(goal) ? removeGoal(goal) : addGoal(goal)}
                      >
                        {goal}
                        {formData.goals.includes(goal) && <X className="ml-1 h-3 w-3" />}
                      </Badge>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <Input
                      placeholder="Add custom goal..."
                      value={formData.customGoal}
                      onChange={(e) => setFormData({ ...formData, customGoal: e.target.value })}
                      onKeyPress={(e) => e.key === 'Enter' && addCustomGoal()}
                    />
                    <Button onClick={addCustomGoal} size="sm">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div>
                  <Label className="text-base font-medium">What skills can you offer?</Label>
                  <p className="text-sm text-muted-foreground mb-3">Select your areas of expertise</p>
                  
                  <div className="flex flex-wrap gap-2 mb-4">
                    {COMMON_SKILLS.map((skill) => (
                      <Badge
                        key={skill}
                        variant={formData.skills.includes(skill) ? "default" : "outline"}
                        className="cursor-pointer hover:bg-accent hover:text-accent-foreground"
                        onClick={() => formData.skills.includes(skill) ? removeSkill(skill) : addSkill(skill)}
                      >
                        {skill}
                        {formData.skills.includes(skill) && <X className="ml-1 h-3 w-3" />}
                      </Badge>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <Input
                      placeholder="Add custom skill..."
                      value={formData.customSkill}
                      onChange={(e) => setFormData({ ...formData, customSkill: e.target.value })}
                      onKeyPress={(e) => e.key === 'Enter' && addCustomSkill()}
                    />
                    <Button onClick={addCustomSkill} size="sm">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Meeting Preferences */}
            {currentStep === 3 && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="meetingLink">Video Meeting Link</Label>
                  <Input
                    id="meetingLink"
                    value={formData.meetingLink}
                    onChange={(e) => setFormData({ ...formData, meetingLink: e.target.value })}
                    placeholder="https://zoom.us/j/your-meeting-room"
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    This will be used for follow-up meetings after networking events
                  </p>
                </div>

                <div className="bg-secondary/50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Profile Summary</h4>
                  <div className="space-y-2 text-sm">
                    <p><strong>Name:</strong> {formData.firstName} {formData.lastName}</p>
                    <p><strong>Role:</strong> {formData.jobTitle} at {formData.company}</p>
                    <p><strong>Industry:</strong> {formData.industry}</p>
                    <p><strong>Goals:</strong> {formData.goals.join(', ')}</p>
                    <p><strong>Skills:</strong> {formData.skills.join(', ')}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Contact Import */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <div className="text-center mb-6">
                  <h3 className="text-lg font-semibold mb-2">Supercharge Your Networking</h3>
                  <p className="text-muted-foreground">
                    Import your contacts to help our AI find the perfect matches and send smart invitations
                  </p>
                </div>

                {/* CSV Import */}
                <div className="border border-border rounded-lg p-4">
                  <h4 className="font-medium mb-2">📄 Upload CSV File</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Upload a CSV file with columns: email, first_name, last_name, job_title, company
                  </p>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleCSVImport}
                    disabled={isImporting}
                    className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-accent file:text-accent-foreground hover:file:bg-accent/90"
                  />
                  {isImporting && (
                    <div className="mt-2 text-sm text-muted-foreground">
                      Importing contacts...
                    </div>
                  )}
                </div>

                {/* LinkedIn Integration */}
                <div className="border border-border rounded-lg p-4">
                  <h4 className="font-medium mb-2">💼 Connect LinkedIn</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Import your LinkedIn connections for professional networking
                  </p>
                  <Button 
                    variant="outline" 
                    onClick={handleLinkedInConnect}
                    className="w-full"
                  >
                    Connect LinkedIn
                  </Button>
                </div>

                {/* Gmail Integration */}
                <div className="border border-border rounded-lg p-4">
                  <h4 className="font-medium mb-2">📧 Connect Gmail</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Import your Gmail contacts for comprehensive networking
                  </p>
                  <Button 
                    variant="outline" 
                    onClick={handleGmailConnect}
                    className="w-full"
                  >
                    Connect Gmail
                  </Button>
                </div>

                {/* Imported Contacts Summary */}
                {importedContacts.length > 0 && (
                  <div className="bg-secondary/50 p-4 rounded-lg">
                    <h4 className="font-medium mb-2">✅ Contacts Imported</h4>
                    <div className="space-y-2 text-sm">
                      <p><strong>Total:</strong> {importedContacts.length} contacts</p>
                      <p><strong>With Job Titles:</strong> {importedContacts.filter(c => c.jobTitle).length}</p>
                      <p><strong>With Companies:</strong> {importedContacts.filter(c => c.company).length}</p>
                    </div>
                  </div>
                )}

                <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">🤖 How AI Matching Works</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• AI analyzes your goals and imported contacts</li>
                    <li>• Finds relevant people based on job titles and companies</li>
                    <li>• Sends personalized invitations when you RSVP to events</li>
                    <li>• Learns from your networking behavior to improve matches</li>
                  </ul>
                </div>

                <div className="text-center text-sm text-muted-foreground">
                  You can always import contacts later from your dashboard
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between pt-6">
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={currentStep === 1}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>

              {currentStep < totalSteps ? (
                <Button
                  onClick={handleNext}
                  disabled={!canProceed()}
                  className="bg-accent hover:bg-accent/90"
                >
                  Next
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="bg-accent hover:bg-accent/90"
                >
                  {loading ? "Creating Profile..." : "Complete Setup"}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}