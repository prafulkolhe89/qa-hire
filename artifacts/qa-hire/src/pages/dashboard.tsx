import { AppLayout } from "@/components/layout";
import {
  useGetDashboardStats,
  useGetRecentJobs,
  useGetSourceBreakdown,
  useGetScoreDistribution,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Briefcase, CheckCircle, Target, ThumbsUp } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { JobCard } from "@/components/job-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

const COLORS = ['#0F766E', '#0369A1', '#4338CA', '#6D28D9', '#BE185D'];

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useGetDashboardStats();
  const { data: recentJobs, isLoading: jobsLoading } = useGetRecentJobs();
  const { data: sourceBreakdown, isLoading: sourcesLoading } = useGetSourceBreakdown();
  const { data: scoreDistribution, isLoading: scoresLoading } = useGetScoreDistribution();

  const isLoading = statsLoading || jobsLoading || sourcesLoading || scoresLoading;
  const error = !stats && !statsLoading;

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex flex-col gap-8 animate-in fade-in duration-500">
          <div>
            <Skeleton className="h-10 w-48 mb-2" />
            <Skeleton className="h-5 w-64" />
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 rounded-xl" />)}
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Skeleton className="h-[300px] rounded-xl" />
            <Skeleton className="h-[300px] rounded-xl" />
          </div>
        </div>
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout>
        <div className="text-center py-20">
          <h2 className="text-2xl font-bold text-destructive mb-2">Failed to load dashboard</h2>
          <p className="text-muted-foreground">Please try refreshing the page.</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="flex flex-col gap-8 pb-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Command Center</h1>
            <p className="text-muted-foreground mt-1">Your daily QA job briefing.</p>
          </div>
          
          {stats && (!stats.profileComplete || !stats.telegramConnected) && (
            <div className="hidden md:flex gap-3">
              {!stats.profileComplete && (
                <Button variant="outline" asChild className="border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100">
                  <Link href="/profile">Complete Profile</Link>
                </Button>
              )}
              {!stats.telegramConnected && (
                <Button variant="outline" asChild className="border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100">
                  <Link href="/telegram">Connect Telegram</Link>
                </Button>
              )}
            </div>
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="border-border/50 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">New Matches</CardTitle>
              <Briefcase className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats?.newJobs ?? 0}</div>
              <p className="text-xs text-muted-foreground mt-1 text-emerald-600 font-medium">Ready for review</p>
            </CardContent>
          </Card>
          
          <Card className="border-border/50 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Interested</CardTitle>
              <ThumbsUp className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats?.interestedJobs ?? 0}</div>
              <p className="text-xs text-muted-foreground mt-1">Saved for later</p>
            </CardContent>
          </Card>
          
          <Card className="border-border/50 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Applied</CardTitle>
              <CheckCircle className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats?.appliedJobs ?? 0}</div>
              <p className="text-xs text-muted-foreground mt-1">Applications tracked</p>
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Avg Match Score</CardTitle>
              <Target className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats?.avgMatchScore?.toFixed(0) ?? 0}</div>
              <p className="text-xs text-muted-foreground mt-1">Based on your profile</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="border-border/50 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Match Score Distribution</CardTitle>
              <CardDescription>Quality of recently found jobs</CardDescription>
            </CardHeader>
            <CardContent className="h-[250px] pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={scoreDistribution ?? []} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
                  <XAxis dataKey="range" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis fontSize={12} tickLine={false} axisLine={false} />
                  <RechartsTooltip 
                    cursor={{ fill: 'var(--muted)' }}
                    contentStyle={{ borderRadius: '8px', border: '1px solid var(--border)', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} 
                  />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Job Sources</CardTitle>
              <CardDescription>Where your matches are coming from</CardDescription>
            </CardHeader>
            <CardContent className="h-[250px] flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={sourceBreakdown ?? []}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="count"
                    nameKey="source"
                  >
                    {(sourceBreakdown ?? []).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    contentStyle={{ borderRadius: '8px', border: '1px solid var(--border)', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute right-8 top-1/2 -translate-y-1/2 flex flex-col gap-2">
                {(sourceBreakdown ?? []).map((entry, index) => (
                  <div key={entry.source} className="flex items-center gap-2 text-sm">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                    <span className="text-muted-foreground">{entry.source} ({entry.count})</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Top Recent Matches</h2>
            <Button variant="link" asChild className="text-primary">
              <Link href="/jobs">View all</Link>
            </Button>
          </div>
          
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {(recentJobs ?? []).slice(0, 3).map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
            {(!recentJobs || recentJobs.length === 0) && (
              <div className="col-span-full py-12 text-center border border-dashed rounded-xl bg-muted/30">
                <p className="text-muted-foreground">No recent matches found. Update your profile to get better results.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}