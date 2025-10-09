import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { SignupForm } from './signup-form'

export default function SignupPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12 bg-gradient-to-b from-background via-background to-muted">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">Begin Your Journey</CardTitle>
          <CardDescription className="text-center">
            Create an account to start chronicling your adventures
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SignupForm />
        </CardContent>
      </Card>
    </div>
  )
}
