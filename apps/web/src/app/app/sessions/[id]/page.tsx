import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export default function SessionDetailPage({ params }: { params: { id: string } }) {
  return (
    <div className="space-y-8">
      {/* Session Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Badge variant="completed">Completed</Badge>
            <span className="text-sm text-muted-foreground">Session #12</span>
          </div>
          <h1 className="font-heading text-4xl font-bold">The Dragon's Lair</h1>
          <p className="text-muted-foreground mt-2">Curse of Strahd • Recorded 3 hours ago</p>
          <div className="flex gap-4 mt-3 text-sm text-muted-foreground">
            <span>⏱️ Duration: 3h 24m</span>
            <span>📅 Oct 9, 2025</span>
          </div>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary">
            Share
          </Button>
          <Button variant="secondary">
            Export PDF
          </Button>
          <Button>
            Generate Recap
          </Button>
        </div>
      </div>

      {/* AI Summary */}
      <Card className="border-l-4 border-secondary">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>🔮</span> AI Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground leading-relaxed">
            The party descended into the ancient dragon's lair beneath Castle Ravenloft. After a tense negotiation with the vampire spawn guards, they discovered a hidden chamber containing the legendary Sunsword. A fierce battle ensued with Count Strahd himself, who appeared to reclaim the weapon. The session ended with the party barely escaping through a secret passage, with Strahd vowing revenge.
          </p>
        </CardContent>
      </Card>

      {/* Key Moments */}
      <Card>
        <CardHeader>
          <CardTitle>Key Moments</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-4 p-4 rounded-lg bg-muted">
              <div className="flex-shrink-0 w-16 text-secondary font-mono text-sm font-semibold">
                00:15:23
              </div>
              <div className="flex-1">
                <Badge variant="default" className="mb-2">Combat</Badge>
                <p className="text-muted-foreground">Battle with vampire spawn in the entrance hall</p>
              </div>
            </div>

            <div className="flex gap-4 p-4 rounded-lg bg-muted">
              <div className="flex-shrink-0 w-16 text-secondary font-mono text-sm font-semibold">
                01:42:18
              </div>
              <div className="flex-1">
                <Badge variant="default" className="mb-2">Discovery</Badge>
                <p className="text-muted-foreground">Party finds the Sunsword in a hidden chamber</p>
              </div>
            </div>

            <div className="flex gap-4 p-4 rounded-lg bg-muted">
              <div className="flex-shrink-0 w-16 text-secondary font-mono text-sm font-semibold">
                02:30:45
              </div>
              <div className="flex-1">
                <Badge variant="default" className="mb-2">Combat</Badge>
                <p className="text-muted-foreground">Epic confrontation with Count Strahd</p>
              </div>
            </div>

            <div className="flex gap-4 p-4 rounded-lg bg-muted">
              <div className="flex-shrink-0 w-16 text-secondary font-mono text-sm font-semibold">
                03:15:20
              </div>
              <div className="flex-1">
                <Badge variant="default" className="mb-2">Plot</Badge>
                <p className="text-muted-foreground">Narrow escape through secret passage, Strahd's vow of revenge</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* NPCs, Locations, Loot Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>NPCs Mentioned</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="px-3 py-2 rounded bg-muted text-sm">Count Strahd</div>
              <div className="px-3 py-2 rounded bg-muted text-sm">Vampire Spawn</div>
              <div className="px-3 py-2 rounded bg-muted text-sm">Rahadin</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Locations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="px-3 py-2 rounded bg-muted text-sm">Dragon's Lair</div>
              <div className="px-3 py-2 rounded bg-muted text-sm">Castle Ravenloft</div>
              <div className="px-3 py-2 rounded bg-muted text-sm">Secret Passage</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Loot Acquired</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="px-3 py-2 rounded bg-muted text-sm">💎 Sunsword (legendary)</div>
              <div className="px-3 py-2 rounded bg-muted text-sm">🗝️ Ancient Key</div>
              <div className="px-3 py-2 rounded bg-muted text-sm">📜 Strahd's Journal</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transcript */}
      <Card>
        <CardHeader>
          <CardTitle>Full Transcript</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="max-h-96 overflow-y-auto space-y-4 text-muted-foreground leading-relaxed">
            <p>
              <span className="text-secondary font-mono text-xs font-semibold mr-2">00:00:15</span>
              DM: As you descend the spiral staircase, the air grows thick with the smell of sulfur and decay. You can hear the distant sound of dripping water echoing through the darkness.
            </p>
            <p>
              <span className="text-secondary font-mono text-xs font-semibold mr-2">00:00:32</span>
              Aria: I'll cast Light on my staff to illuminate the path ahead.
            </p>
            <p>
              <span className="text-secondary font-mono text-xs font-semibold mr-2">00:00:45</span>
              DM: The magical light reveals ancient stone walls covered in cryptic runes. Ahead, you see a large chamber with several shadowy figures standing guard.
            </p>
            <p className="text-muted-foreground italic">
              [Transcript continues... Full transcript available after AI processing]
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
