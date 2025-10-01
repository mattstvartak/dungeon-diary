"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Save } from "lucide-react"
import type { Summary } from "@/lib/types"

interface SummaryTabProps {
  summary: Summary | null
  notes: string
  onNotesChange: (notes: string) => void
  onSaveNotes: () => void
}

export function SummaryTab({ summary, notes, onNotesChange, onSaveNotes }: SummaryTabProps) {
  return (
    <div className="space-y-6">
      {/* Session Summary */}
      <Card className="bg-[#1D1D1D] border-[#A3A3A3]/20">
        <CardHeader>
          <CardTitle className="text-[#EDEDEE]">Session Summary</CardTitle>
          <CardDescription className="text-[#A3A3A3]">
            AI-generated summary of the session
          </CardDescription>
        </CardHeader>
        <CardContent>
          {summary ? (
            <div className="prose prose-invert max-w-none">
              <p className="text-[#EDEDEE] leading-relaxed whitespace-pre-wrap">
                {summary.content}
              </p>
            </div>
          ) : (
            <p className="text-[#A3A3A3] text-sm italic">
              No summary available yet. Summaries are generated after audio processing is complete.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Session Notes */}
      <Card className="bg-[#1D1D1D] border-[#A3A3A3]/20">
        <CardHeader>
          <CardTitle className="text-[#EDEDEE]">Session Notes</CardTitle>
          <CardDescription className="text-[#A3A3A3]">
            Add your own notes about this session
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={notes}
            onChange={(e) => onNotesChange(e.target.value)}
            placeholder="Add your notes about this session..."
            className="bg-[#101010] border-[#A3A3A3]/20 text-[#EDEDEE] min-h-[200px]"
          />
          <Button
            onClick={onSaveNotes}
            className="bg-[#22C55E] hover:bg-[#22C55E]/90 text-white"
          >
            <Save className="mr-2 h-4 w-4" />
            Save Notes
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
