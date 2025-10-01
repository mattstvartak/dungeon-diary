"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { AuthGuard } from "@/components/auth-guard"
import { useAuth } from "@/hooks/use-auth"
import { getUser } from "@/lib/firestore"
import { doc, updateDoc } from "firebase/firestore"
import { db, auth } from "@/lib/firebase"
import { signOut } from "firebase/auth"
import type { User as FirestoreUser } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft, Save, LogOut } from "lucide-react"

function ProfileContent() {
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  const [userData, setUserData] = useState<FirestoreUser | null>(null)
  const [displayName, setDisplayName] = useState("")
  const [avatarUrl, setAvatarUrl] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (user) {
      loadUserData()
    }
  }, [user])

  const loadUserData = async () => {
    if (!user) return

    try {
      const data = await getUser(user.uid)
      if (data) {
        setUserData(data)
        setDisplayName(data.displayName || "")
        setAvatarUrl(data.avatarUrl || "")
      }
    } catch (error) {
      console.error("[v0] Error loading user data:", error)
      toast({
        title: "Error",
        description: "Failed to load profile data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!user || !displayName.trim()) {
      toast({
        title: "Validation error",
        description: "Display name is required",
        variant: "destructive",
      })
      return
    }

    setSaving(true)
    try {
      const userRef = doc(db, "users", user.uid)
      await updateDoc(userRef, {
        displayName: displayName.trim(),
        avatarUrl: avatarUrl.trim() || null,
      })

      setUserData({
        ...userData!,
        displayName: displayName.trim(),
        avatarUrl: avatarUrl.trim() || undefined,
      })

      toast({
        title: "Profile updated",
        description: "Your changes have been saved",
      })
    } catch (error) {
      console.error("[v0] Error updating profile:", error)
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleSignOut = async () => {
    try {
      await signOut(auth)
      router.push("/auth")
    } catch (error) {
      console.error("[v0] Error signing out:", error)
      toast({
        title: "Error",
        description: "Failed to sign out",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#101010]">
        <div className="text-[#EDEDEE]">Loading profile...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#101010]">
      {/* Header */}
      <header className="border-b border-[#A3A3A3]/20 bg-[#1D1D1D]">
        <div className="container mx-auto flex items-center gap-4 px-4 py-4">
          <Button asChild variant="ghost" size="icon" className="text-[#EDEDEE] hover:bg-[#101010]">
            <Link href="/app">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <h1 className="text-xl font-bold text-[#F94933]">Profile</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <Card className="bg-[#1D1D1D] border-[#A3A3A3]/20">
          <CardHeader>
            <CardTitle className="text-[#EDEDEE]">Account Settings</CardTitle>
            <CardDescription className="text-[#A3A3A3]">Manage your profile information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Avatar Preview */}
            <div className="flex flex-col items-center gap-4 py-4">
              <Avatar className="h-24 w-24 bg-[#F94933]">
                {avatarUrl ? (
                  <AvatarImage src={avatarUrl || "/placeholder.svg"} alt={displayName} />
                ) : (
                  <AvatarFallback className="bg-[#F94933] text-white text-3xl">
                    {displayName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "U"}
                  </AvatarFallback>
                )}
              </Avatar>
              <p className="text-[#A3A3A3] text-sm">Profile Picture</p>
            </div>

            {/* Email (Read-only) */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-[#EDEDEE]">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={user?.email || ""}
                readOnly
                className="bg-[#101010] border-[#A3A3A3]/30 text-[#A3A3A3]"
              />
              <p className="text-xs text-[#A3A3A3]">Email cannot be changed</p>
            </div>

            {/* Display Name */}
            <div className="space-y-2">
              <Label htmlFor="displayName" className="text-[#EDEDEE]">
                Display Name <span className="text-[#F94933]">*</span>
              </Label>
              <Input
                id="displayName"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Enter your display name"
                className="bg-[#101010] border-[#A3A3A3]/30 text-[#EDEDEE] placeholder:text-[#A3A3A3]"
              />
            </div>

            {/* Avatar URL */}
            <div className="space-y-2">
              <Label htmlFor="avatarUrl" className="text-[#EDEDEE]">
                Avatar URL (Optional)
              </Label>
              <Input
                id="avatarUrl"
                type="url"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="https://example.com/avatar.jpg"
                className="bg-[#101010] border-[#A3A3A3]/30 text-[#EDEDEE] placeholder:text-[#A3A3A3]"
              />
              <p className="text-xs text-[#A3A3A3]">Enter a URL to your profile picture</p>
            </div>

            {/* Save Button */}
            <Button
              onClick={handleSave}
              disabled={saving}
              className="w-full bg-[#F94933] hover:bg-[#F94933]/90 text-white"
            >
              <Save className="mr-2 h-4 w-4" />
              {saving ? "Saving..." : "Save Changes"}
            </Button>

            {/* Divider */}
            <div className="border-t border-[#A3A3A3]/20 pt-6">
              <h3 className="text-[#EDEDEE] font-semibold mb-4">Account Actions</h3>

              {/* Sign Out Button */}
              <Button
                onClick={handleSignOut}
                variant="outline"
                className="w-full border-[#EF4444] text-[#EF4444] hover:bg-[#EF4444] hover:text-white bg-transparent"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Account Info */}
        <Card className="mt-6 bg-[#1D1D1D] border-[#A3A3A3]/20">
          <CardHeader>
            <CardTitle className="text-[#EDEDEE]">Account Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-[#A3A3A3]">Account created:</span>
              <span className="text-[#EDEDEE]">
                {userData?.createdAt
                  ? new Date(userData.createdAt.toDate()).toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })
                  : "Unknown"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#A3A3A3]">User ID:</span>
              <span className="text-[#EDEDEE] font-mono text-xs">{user?.uid}</span>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

export default function ProfilePage() {
  return (
    <AuthGuard>
      <ProfileContent />
    </AuthGuard>
  )
}
