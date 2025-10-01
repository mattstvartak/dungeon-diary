"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth"
import { doc, setDoc, serverTimestamp } from "firebase/firestore"
import { auth, db } from "@/lib/firebase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/hooks/use-auth"
import { useEffect } from "react"

export default function AuthPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { user, loading } = useAuth()
  const [isLoading, setIsLoading] = useState(false)

  // Redirect if already authenticated
  useEffect(() => {
    if (!loading && user) {
      router.push("/app")
    }
  }, [user, loading, router])

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)

    const formData = new FormData(e.currentTarget)
    const email = formData.get("signin-email") as string
    const password = formData.get("signin-password") as string

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password)

      toast({
        title: "Welcome back!",
        description: "You've successfully signed in.",
      })
      router.push("/app")
    } catch (error: any) {
      console.error("[v0] Sign in error:", error)

      let errorMessage = "Failed to sign in"

      if (error.code === "auth/invalid-credential" || error.code === "auth/wrong-password") {
        errorMessage = "Invalid email or password"
      } else if (error.code === "auth/user-not-found") {
        errorMessage = "No account found with this email"
      } else if (error.code === "auth/invalid-email") {
        errorMessage = "Invalid email address"
      } else if (error.code === "auth/too-many-requests") {
        errorMessage = "Too many failed attempts. Please try again later"
      } else if (error.code === "auth/network-request-failed") {
        errorMessage = "Network error. Please check your connection"
      } else if (error.code === "auth/invalid-api-key") {
        errorMessage = "Firebase configuration error. Please check your API key in environment variables"
      } else if (error.message) {
        errorMessage = error.message
      }

      toast({
        title: "Sign In Failed",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)

    const formData = new FormData(e.currentTarget)
    const email = formData.get("signup-email") as string
    const password = formData.get("signup-password") as string
    const displayName = formData.get("signup-name") as string

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      const user = userCredential.user

      // Create user document in Firestore
      await setDoc(doc(db, "users", user.uid), {
        displayName,
        email,
        createdAt: serverTimestamp(),
      })

      toast({
        title: "Account created!",
        description: "Welcome to Dungeon Diary.",
      })
      router.push("/app")
    } catch (error: any) {
      console.error("[v0] Sign up error:", error)

      let errorMessage = "Failed to create account"

      if (error.code === "auth/email-already-in-use") {
        errorMessage = "An account with this email already exists"
      } else if (error.code === "auth/invalid-email") {
        errorMessage = "Invalid email address"
      } else if (error.code === "auth/weak-password") {
        errorMessage = "Password should be at least 6 characters"
      } else if (error.code === "auth/network-request-failed") {
        errorMessage = "Network error. Please check your connection"
      } else if (error.code === "auth/invalid-api-key") {
        errorMessage = "Firebase configuration error. Please check your API key in environment variables"
      } else if (error.message) {
        errorMessage = error.message
      }

      toast({
        title: "Sign Up Failed",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleForgotPassword = async () => {
    const email = prompt("Enter your email address:")
    if (!email) return

    try {
      await sendPasswordResetEmail(auth, email)
      toast({
        title: "Password reset email sent",
        description: "Check your inbox for instructions.",
      })
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to send reset email"
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#101010]">
        <div className="text-[#EDEDEE]">Loading...</div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#101010] p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-[#F94933]">Dungeon Diary</h1>
          <p className="mt-2 text-[#EEA232]">Chronicle your adventures</p>
        </div>

        <Card className="bg-[#1D1D1D] border-[#A3A3A3]/20">
          <CardHeader>
            <CardTitle className="text-[#EDEDEE]">Welcome</CardTitle>
            <CardDescription className="text-[#A3A3A3]">Sign in or create an account to continue</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-[#101010]">
                <TabsTrigger value="signin" className="data-[state=active]:bg-[#F94933] data-[state=active]:text-white">
                  Sign In
                </TabsTrigger>
                <TabsTrigger value="signup" className="data-[state=active]:bg-[#F94933] data-[state=active]:text-white">
                  Sign Up
                </TabsTrigger>
              </TabsList>

              <TabsContent value="signin">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email" className="text-[#EDEDEE]">
                      Email
                    </Label>
                    <Input
                      id="signin-email"
                      name="signin-email"
                      type="email"
                      inputMode="email"
                      autoComplete="email"
                      placeholder="adventurer@example.com"
                      required
                      className="bg-[#101010] border-[#A3A3A3]/30 text-[#EDEDEE] placeholder:text-[#A3A3A3] h-12 text-base"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signin-password" className="text-[#EDEDEE]">
                      Password
                    </Label>
                    <Input
                      id="signin-password"
                      name="signin-password"
                      type="password"
                      autoComplete="current-password"
                      required
                      className="bg-[#101010] border-[#A3A3A3]/30 text-[#EDEDEE] h-12 text-base"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="link"
                    onClick={handleForgotPassword}
                    className="px-0 text-[#EEA232] hover:text-[#EEA232]/80 h-auto"
                  >
                    Forgot password?
                  </Button>
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-[#F94933] hover:bg-[#F94933]/90 text-white h-12 text-base"
                  >
                    {isLoading ? "Signing in..." : "Sign In"}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name" className="text-[#EDEDEE]">
                      Display Name
                    </Label>
                    <Input
                      id="signup-name"
                      name="signup-name"
                      type="text"
                      autoComplete="name"
                      placeholder="Dungeon Master"
                      required
                      className="bg-[#101010] border-[#A3A3A3]/30 text-[#EDEDEE] placeholder:text-[#A3A3A3] h-12 text-base"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email" className="text-[#EDEDEE]">
                      Email
                    </Label>
                    <Input
                      id="signup-email"
                      name="signup-email"
                      type="email"
                      inputMode="email"
                      autoComplete="email"
                      placeholder="adventurer@example.com"
                      required
                      className="bg-[#101010] border-[#A3A3A3]/30 text-[#EDEDEE] placeholder:text-[#A3A3A3] h-12 text-base"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password" className="text-[#EDEDEE]">
                      Password
                    </Label>
                    <Input
                      id="signup-password"
                      name="signup-password"
                      type="password"
                      autoComplete="new-password"
                      required
                      minLength={6}
                      className="bg-[#101010] border-[#A3A3A3]/30 text-[#EDEDEE] h-12 text-base"
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-[#F94933] hover:bg-[#F94933]/90 text-white h-12 text-base"
                  >
                    {isLoading ? "Creating account..." : "Create Account"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
