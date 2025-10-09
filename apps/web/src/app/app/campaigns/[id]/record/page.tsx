'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import Link from 'next/link'
import { useAuth } from '@/providers/auth-provider'
import { createClient } from '@/lib/supabase/client'

interface Campaign {
  id: string
  name: string
  player_names: string[]
}

export default function RecordSessionPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const supabase = createClient()

  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [sessionTitle, setSessionTitle] = useState('')
  const [presentPlayers, setPresentPlayers] = useState<string[]>([])
  const [guestPlayers, setGuestPlayers] = useState<string[]>([])
  const [newGuestName, setNewGuestName] = useState('')
  const [mode, setMode] = useState<'record' | 'upload'>('record')
  const [isRecording, setIsRecording] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (user && params.id) {
      loadCampaign()
    }
  }, [user, params.id])

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [])

  const loadCampaign = async () => {
    try {
      const { data, error } = await supabase
        .from('campaigns')
        .select('id, name, player_names')
        .eq('id', params.id)
        .single()

      if (error) throw error
      setCampaign(data)
      // By default, mark all players as present
      setPresentPlayers(data.player_names || [])
    } catch (err) {
      console.error('Error loading campaign:', err)
    }
  }

  const togglePlayerPresence = (playerName: string) => {
    setPresentPlayers(prev =>
      prev.includes(playerName)
        ? prev.filter(p => p !== playerName)
        : [...prev, playerName]
    )
  }

  const addGuest = () => {
    if (newGuestName.trim() && !guestPlayers.includes(newGuestName.trim())) {
      setGuestPlayers([...guestPlayers, newGuestName.trim()])
      setPresentPlayers([...presentPlayers, newGuestName.trim()])
      setNewGuestName('')
    }
  }

  const removeGuest = (guestName: string) => {
    setGuestPlayers(guestPlayers.filter(g => g !== guestName))
    setPresentPlayers(presentPlayers.filter(p => p !== guestName))
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        setAudioBlob(audioBlob)
        stream.getTracks().forEach(track => track.stop())
      }

      mediaRecorder.start()
      setIsRecording(true)
      setIsPaused(false)

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)
    } catch (err) {
      console.error('Error starting recording:', err)
      alert('Failed to start recording. Please check microphone permissions.')
    }
  }

  const pauseRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.pause()
      setIsPaused(true)
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }

  const resumeRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      mediaRecorderRef.current.resume()
      setIsPaused(false)
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      setIsPaused(false)
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setUploadedFile(file)
      // Calculate duration from file if possible
      const audio = new Audio(URL.createObjectURL(file))
      audio.addEventListener('loadedmetadata', () => {
        setRecordingTime(Math.floor(audio.duration))
      })
    }
  }

  const saveSession = async () => {
    const audioSource = mode === 'record' ? audioBlob : uploadedFile

    if (!audioSource || !sessionTitle.trim()) {
      alert('Please provide a session title and audio')
      return
    }

    setUploading(true)

    try {
      // Get next session number
      const { data: sessions } = await supabase
        .from('sessions')
        .select('session_number')
        .eq('campaign_id', params.id)
        .order('session_number', { ascending: false })
        .limit(1)

      const nextSessionNumber = sessions && sessions.length > 0 ? sessions[0].session_number + 1 : 1

      // Create session record
      const { data: session, error: sessionError } = await supabase
        .from('sessions')
        .insert({
          campaign_id: params.id,
          title: sessionTitle,
          session_number: nextSessionNumber,
          duration_seconds: recordingTime || 0,
          status: 'processing'
        })
        .select()
        .single()

      if (sessionError) throw sessionError

      // Determine file extension and content type
      const isUpload = mode === 'upload'
      const fileExt = isUpload && uploadedFile ? uploadedFile.name.split('.').pop() : 'webm'
      const contentType = isUpload && uploadedFile ? uploadedFile.type : 'audio/webm'
      const fileName = `${session.id}.${fileExt}`

      // Upload audio to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('session-audio')
        .upload(fileName, audioSource, {
          contentType,
          upsert: false
        })

      if (uploadError) throw uploadError

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('session-audio')
        .getPublicUrl(fileName)

      // Update session with audio URL
      const { error: updateError } = await supabase
        .from('sessions')
        .update({
          audio_url: urlData.publicUrl,
          audio_size_bytes: audioSource.size
        })
        .eq('id', session.id)

      if (updateError) throw updateError

      // Redirect to session detail
      router.push(`/app/sessions/${session.id}`)
    } catch (err) {
      console.error('Error saving session:', err)
      alert('Failed to save session')
    } finally {
      setUploading(false)
    }
  }

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <Link href={`/app/campaigns/${params.id}`} className="text-muted-foreground hover:text-foreground mb-2 inline-block">
          ← Back to Campaign
        </Link>
        <h1 className="font-heading text-4xl font-bold">Record Session</h1>
        {campaign && (
          <p className="text-muted-foreground mt-2">Campaign: {campaign.name}</p>
        )}
      </div>

      {/* Mode Toggle */}
      <div className="flex gap-4">
        <Button
          variant={mode === 'record' ? 'primary' : 'secondary'}
          onClick={() => setMode('record')}
          disabled={isRecording || audioBlob !== null || uploadedFile !== null}
          className="flex-1"
        >
          🎙️ Record
        </Button>
        <Button
          variant={mode === 'upload' ? 'primary' : 'secondary'}
          onClick={() => setMode('upload')}
          disabled={isRecording || audioBlob !== null || uploadedFile !== null}
          className="flex-1"
        >
          📤 Upload
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Session Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="session-title">Session Title</Label>
            <Input
              id="session-title"
              placeholder="e.g., The Quest for the Lost Artifact"
              value={sessionTitle}
              onChange={(e) => setSessionTitle(e.target.value)}
              disabled={isRecording || audioBlob !== null || uploadedFile !== null}
            />
          </div>

          {/* Player Attendance */}
          {campaign && campaign.player_names.length > 0 && (
            <div className="space-y-2">
              <Label>Player Attendance</Label>
              <div className="space-y-2">
                {campaign.player_names.map((player) => (
                  <div
                    key={player}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted hover:bg-card transition-colors"
                  >
                    <span className="text-foreground">{player}</span>
                    <Select
                      value={presentPlayers.includes(player) ? 'present' : 'absent'}
                      onValueChange={(value) => {
                        if (value === 'present' && !presentPlayers.includes(player)) {
                          setPresentPlayers([...presentPlayers, player])
                        } else if (value === 'absent' && presentPlayers.includes(player)) {
                          setPresentPlayers(presentPlayers.filter(p => p !== player))
                        }
                      }}
                      disabled={isRecording || audioBlob !== null}
                    >
                      <SelectTrigger className="w-[130px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="present">Present</SelectItem>
                        <SelectItem value="absent">Absent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Guest Players */}
          <div className="space-y-2">
            <Label>Guest Players</Label>

            {/* Add Guest Input */}
            <div className="flex gap-2">
              <Input
                placeholder="Guest player name"
                value={newGuestName}
                onChange={(e) => setNewGuestName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addGuest()}
                disabled={isRecording || audioBlob !== null}
              />
              <Button
                type="button"
                variant="secondary"
                onClick={addGuest}
                disabled={isRecording || audioBlob !== null || !newGuestName.trim()}
              >
                Add Guest
              </Button>
            </div>

            {/* Guest List */}
            {guestPlayers.length > 0 && (
              <div className="space-y-2 mt-3">
                {guestPlayers.map((guest) => (
                  <div
                    key={guest}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted hover:bg-card transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-foreground">{guest}</span>
                      <span className="text-xs text-muted-foreground">(Guest)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Select
                        value={presentPlayers.includes(guest) ? 'present' : 'absent'}
                        onValueChange={(value) => {
                          if (value === 'present' && !presentPlayers.includes(guest)) {
                            setPresentPlayers([...presentPlayers, guest])
                          } else if (value === 'absent' && presentPlayers.includes(guest)) {
                            setPresentPlayers(presentPlayers.filter(p => p !== guest))
                          }
                        }}
                        disabled={isRecording || audioBlob !== null}
                      >
                        <SelectTrigger className="w-[130px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="present">Present</SelectItem>
                          <SelectItem value="absent">Absent</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeGuest(guest)}
                        disabled={isRecording || audioBlob !== null}
                        className="text-muted-foreground hover:text-destructive h-8 w-8 p-0"
                      >
                        ✕
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Summary */}
          <div className="bg-card p-4 rounded-lg">
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">{presentPlayers.length}</span> player{presentPlayers.length !== 1 ? 's' : ''} attending
              {guestPlayers.length > 0 && (
                <span> (including {guestPlayers.length} guest{guestPlayers.length !== 1 ? 's' : ''})</span>
              )}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{mode === 'record' ? 'Recording' : 'Upload Audio'}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {mode === 'record' ? (
            <>
              {/* Recording Timer */}
              <div className="text-center">
                <div className="text-6xl font-bold font-mono text-foreground mb-4">
                  {formatTime(recordingTime)}
                </div>
                {isRecording && (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-3 h-3 bg-error rounded-full animate-pulse" />
                    <span className="text-muted-foreground">
                      {isPaused ? 'Paused' : 'Recording...'}
                    </span>
                  </div>
                )}
              </div>

              {/* Recording Controls */}
              <div className="flex justify-center gap-4">
                {!isRecording && !audioBlob && (
                  <Button size="lg" onClick={startRecording}>
                    <span className="mr-2">🎙️</span>
                    Start Recording
                  </Button>
                )}

                {isRecording && !isPaused && (
                  <>
                    <Button size="lg" variant="secondary" onClick={pauseRecording}>
                      <span className="mr-2">⏸️</span>
                      Pause
                    </Button>
                    <Button size="lg" variant="secondary" onClick={stopRecording}>
                      <span className="mr-2">⏹️</span>
                      Stop
                    </Button>
                  </>
                )}

                {isRecording && isPaused && (
                  <>
                    <Button size="lg" onClick={resumeRecording}>
                      <span className="mr-2">▶️</span>
                      Resume
                    </Button>
                    <Button size="lg" variant="secondary" onClick={stopRecording}>
                      <span className="mr-2">⏹️</span>
                      Stop
                    </Button>
                  </>
                )}

                {audioBlob && (
                  <>
                    <Button size="lg" variant="secondary" onClick={() => {
                      setAudioBlob(null)
                      setRecordingTime(0)
                    }}>
                      <span className="mr-2">🔄</span>
                      Re-record
                    </Button>
                    <Button size="lg" onClick={saveSession} disabled={uploading}>
                      <span className="mr-2">💾</span>
                      {uploading ? 'Saving...' : 'Save Session'}
                    </Button>
                  </>
                )}
              </div>

              {/* Audio Preview */}
              {audioBlob && (
                <div className="mt-6">
                  <p className="text-sm text-muted-foreground mb-2">Preview:</p>
                  <audio controls src={URL.createObjectURL(audioBlob)} className="w-full" />
                </div>
              )}
            </>
          ) : (
            <>
              {/* Upload Mode */}
              {!uploadedFile ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">📤</div>
                  <h3 className="text-xl font-semibold mb-2">Upload Audio File</h3>
                  <p className="text-muted-foreground mb-6">
                    Select an audio file from your device
                  </p>
                  <label className="inline-block">
                    <input
                      type="file"
                      accept="audio/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <Button size="lg" as="span">
                      <span className="mr-2">📁</span>
                      Choose File
                    </Button>
                  </label>
                </div>
              ) : (
                <>
                  <div className="text-center">
                    <div className="text-6xl mb-4">✅</div>
                    <h3 className="text-xl font-semibold mb-2">File Selected</h3>
                    <p className="text-muted-foreground mb-4">{uploadedFile.name}</p>
                    <p className="text-sm text-muted-foreground">Duration: {formatTime(recordingTime)}</p>
                  </div>

                  <div className="flex justify-center gap-4">
                    <Button size="lg" variant="secondary" onClick={() => {
                      setUploadedFile(null)
                      setRecordingTime(0)
                    }}>
                      <span className="mr-2">🔄</span>
                      Choose Different File
                    </Button>
                    <Button size="lg" onClick={saveSession} disabled={uploading}>
                      <span className="mr-2">💾</span>
                      {uploading ? 'Saving...' : 'Save Session'}
                    </Button>
                  </div>

                  {/* Audio Preview */}
                  <div className="mt-6">
                    <p className="text-sm text-muted-foreground mb-2">Preview:</p>
                    <audio controls src={URL.createObjectURL(uploadedFile)} className="w-full" />
                  </div>
                </>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
