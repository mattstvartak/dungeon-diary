import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import Link from 'next/link'

export default function DashboardPage() {
  return (
    <SidebarInset>
      <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbPage>Dashboard</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-heading text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground mt-1">Welcome back, Dungeon Master</p>
          </div>
          <Link href="/app/campaigns">
            <Button>
              <span className="mr-2">🎲</span>
              Record New Session
            </Button>
          </Link>
        </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-muted-foreground">
              Total Campaigns
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold font-heading">3</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-muted-foreground">
              Sessions Recorded
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold font-heading">24</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-muted-foreground">
              Hours Played
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold font-heading">72</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Sessions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Sessions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 rounded-lg bg-muted border-l-4 border-secondary hover:bg-card-hover transition-all cursor-pointer">
              <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary font-bold text-lg">
                12
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground">The Dragon's Lair</h3>
                <p className="text-sm text-muted-foreground">Campaign: Curse of Strahd • 3 hours ago</p>
              </div>
              <div className="px-3 py-1 rounded-full bg-success text-white text-xs font-semibold uppercase">
                Completed
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 rounded-lg bg-muted border-l-4 border-secondary hover:bg-card-hover transition-all cursor-pointer">
              <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary font-bold text-lg">
                8
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground">Journey to Waterdeep</h3>
                <p className="text-sm text-muted-foreground">Campaign: Lost Mine of Phandelver • 2 days ago</p>
              </div>
              <div className="px-3 py-1 rounded-full bg-success text-white text-xs font-semibold uppercase">
                Completed
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 rounded-lg bg-muted border-l-4 border-secondary hover:bg-card-hover transition-all cursor-pointer">
              <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary font-bold text-lg">
                5
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground">The Goblin Ambush</h3>
                <p className="text-sm text-muted-foreground">Campaign: Homebrew Adventure • 1 week ago</p>
              </div>
              <div className="px-3 py-1 rounded-full bg-success text-white text-xs font-semibold uppercase">
                Completed
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Campaigns Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Active Campaigns</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Link href="/app/campaigns/1">
              <Card className="border-2 border-primary hover:border-primary hover:shadow-lg-primary transition-all cursor-pointer">
                <CardHeader>
                  <CardTitle className="text-lg">Curse of Strahd</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">12 sessions • Last played 3 hours ago</p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/app/campaigns/2">
              <Card className="border-2 border-primary hover:border-primary hover:shadow-lg-primary transition-all cursor-pointer">
                <CardHeader>
                  <CardTitle className="text-lg">Lost Mine of Phandelver</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">8 sessions • Last played 2 days ago</p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/app/campaigns/3">
              <Card className="border-2 border-primary hover:border-primary hover:shadow-lg-primary transition-all cursor-pointer">
                <CardHeader>
                  <CardTitle className="text-lg">Homebrew Adventure</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">5 sessions • Last played 1 week ago</p>
                </CardContent>
              </Card>
            </Link>
          </div>
        </CardContent>
      </Card>
      </div>
    </SidebarInset>
  )
}
