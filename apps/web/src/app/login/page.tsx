import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { LoginForm } from './login-form'

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12 bg-gradient-to-b from-background via-background to-muted">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">Welcome Back, Adventurer</CardTitle>
          <CardDescription className="text-center">
            Sign in to continue your chronicle
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm />
        </CardContent>
      </Card>
    </div>
  )
}
