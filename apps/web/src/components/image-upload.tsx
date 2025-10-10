'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Upload, Sparkles, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface ImageUploadProps {
  label: string
  imageUrl: string
  onImageUrlChange: (url: string) => void
  onGenerateImage: () => Promise<void>
  generatingImage: boolean
  entityType: 'location' | 'npc' | 'item'
}

export function ImageUpload({
  label,
  imageUrl,
  onImageUrlChange,
  onGenerateImage,
  generatingImage,
  entityType
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const supabase = createClient()

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be less than 5MB')
      return
    }

    try {
      setUploading(true)

      // Generate unique filename
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`
      const filePath = `${entityType}s/${fileName}`

      // Upload to Supabase Storage
      const { error: uploadError, data } = await supabase.storage
        .from('images')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('images')
        .getPublicUrl(filePath)

      onImageUrlChange(urlData.publicUrl)
    } catch (err) {
      console.error('Error uploading image:', err)
      alert('Failed to upload image. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-2">
      <Label htmlFor="imageUrl">{label}</Label>
      <div className="flex gap-2">
        <Input
          id="imageUrl"
          type="url"
          value={imageUrl}
          onChange={(e) => onImageUrlChange(e.target.value)}
          placeholder="https://... or upload/generate"
          className="flex-1"
        />
        <Button
          type="button"
          variant="outline"
          onClick={() => document.getElementById('file-upload')?.click()}
          disabled={uploading || generatingImage}
        >
          {uploading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
            </>
          ) : (
            <>
              <Upload className="h-4 w-4" />
            </>
          )}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onGenerateImage}
          disabled={uploading || generatingImage}
        >
          {generatingImage ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
            </>
          )}
        </Button>
        <input
          id="file-upload"
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          className="hidden"
        />
      </div>
      {imageUrl && (
        <div className="mt-2">
          <img
            src={imageUrl}
            alt="Preview"
            className="rounded-lg border max-w-sm"
          />
        </div>
      )}
    </div>
  )
}
