import { AppLayout } from "@/components/layout";
import { useGetProfile, useGetSubscription } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useClerk, useUser } from "@clerk/react";
import { Loader2, User, ShieldAlert, Zap, CheckCircle2, Crown } from "lucide-react";
import { Link } from "wouter";

function UsageBar({ label, used, limit }: { label: string; used: number; limit: number | null }) {
  const pct = limit ? Math.min(100, Math.round((used / limit) * 100)) : 0;
  const isLimited = limit !== null;
  const isNearLimit = isLimited && pct >= 80;
  const isAtLimit = isLimited && used >= limit;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className={`font-medium ${isAtLimit ? "text-red-600" : isNearLimit ? "text-amber-600" : "text-foreground"}`}>
          {used}{isLimited ? ` / ${limit}` : " (unlimited)"}
        </span>
      </div>
      {isLimited && (
        <Progress
          value={pct}
          className={`h-2 ${isAtLimit ? "[&>div]:bg-red-500" : isNearLimit ? "[&>div]:bg-amber-500" : ""}`}
        />
      )}
    </div>
  );
}

export default function Settings() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const { data: profile, isLoading } = useGetProfile();
  const { data: subscription, isLoading: subLoading } = useGetSubscription();

  const handleSignOut = () => {
    signOut({ redirectUrl: import.meta.env.BASE_URL.replace(/\/$/, "") || "/" });
  };

  if (isLoading || subLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  const plan = subscription?.plan ?? "free";
  const isPro = plan === "pro";

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto pb-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Account Settings</h1>
          <p className="text-muted-foreground mt-1">Manage your account, billing, and preferences.</p>
        </div>

        <div className="space-y-6">
          {/* Account Info */}
          <Card className="border-border/50 shadow-sm">
            <CardHeader className="flex flex-row items-center gap-4">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                <User className="w-6 h-6" />
              </div>
              <div>
                <CardTitle>{user?.fullName || "QA Professional"}</CardTitle>
                <CardDescription>{user?.primaryEmailAddress?.emailAddress}</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="border-t border-border/40 pt-6">
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div>
                  <h4 className="font-medium text-muted-foreground mb-1">Profile Status</h4>
                  {profile ? (
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Active</Badge>
                  ) : (
                    <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">Incomplete</Badge>
                  )}
                </div>
                <div>
                  <h4 className="font-medium text-muted-foreground mb-1">Auth Provider</h4>
                  <p className="font-medium capitalize">
                    {user?.externalAccounts[0]?.provider.replace("oauth_", "") || "Email/Password"}
                  </p>
                </div>
                {subscription && (
                  <div>
                    <h4 className="font-medium text-muted-foreground mb-1">Profile Version</h4>
                    <p className="font-medium">v{subscription.profileVersion}</p>
                  </div>
                )}
              </div>
              <div className="mt-6">
                <Button variant="outline" onClick={handleSignOut}>Log out of all devices</Button>
              </div>
            </CardContent>
          </Card>

          {/* Billing & Subscription */}
          <Card className={`border-border/50 shadow-sm ${isPro ? "border-purple-200" : ""}`}>
            <CardHeader>
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {isPro ? <Crown className="w-5 h-5 text-purple-500" /> : <Zap className="w-5 h-5 text-amber-500" />}
                    {isPro ? "Pro Plan" : "Free Plan"}
                  </CardTitle>
                  <CardDescription>
                    {isPro
                      ? "You have unlimited access to all features."
                      : "Upgrade to Pro for unlimited job matches, cover letters, and profile edits."}
                  </CardDescription>
                </div>
                {!isPro && (
                  <Button className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-sm">
                    <Zap className="w-4 h-4 mr-2" /> Upgrade to Pro
                  </Button>
                )}
                {isPro && (
                  <Badge className="bg-purple-100 text-purple-700 border-purple-200">Active</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="border-t border-border/40 pt-6 space-y-4">
              {!isPro && (
                <div className="grid md:grid-cols-3 gap-4 mb-6">
                  {[
                    { feature: "Profile edits / month", free: "5", pro: "Unlimited" },
                    { feature: "Job matches / day", free: "15", pro: "Unlimited" },
                    { feature: "Cover letters / day", free: "3", pro: "Unlimited" },
                  ].map((row) => (
                    <div key={row.feature} className="bg-muted/30 rounded-lg p-3">
                      <p className="text-xs text-muted-foreground mb-2">{row.feature}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{row.free}</span>
                        <span className="text-sm font-bold text-primary">{row.pro}</span>
                      </div>
                      <div className="flex items-center justify-between mt-0.5">
                        <span className="text-xs text-muted-foreground">Free</span>
                        <span className="text-xs text-primary">Pro</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {subscription && (
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Current Usage</h4>
                  <UsageBar
                    label="Profile edits this month"
                    used={subscription.usage.monthlyProfileEdits.used}
                    limit={subscription.usage.monthlyProfileEdits.limit}
                  />
                  <UsageBar
                    label="Job matches today"
                    used={subscription.usage.dailyJobMatches.used}
                    limit={subscription.usage.dailyJobMatches.limit}
                  />
                  <UsageBar
                    label="Cover letters today"
                    used={subscription.usage.dailyCoverLetters.used}
                    limit={subscription.usage.dailyCoverLetters.limit}
                  />
                  {subscription.quotaResetDate && (
                    <p className="text-xs text-muted-foreground">
                      Daily limits reset at midnight. Monthly limits reset on the 1st.
                    </p>
                  )}
                </div>
              )}

              {!isPro && (
                <div className="border-t border-border/40 pt-4 mt-4">
                  <p className="text-sm font-semibold mb-3">What you get with Pro:</p>
                  <div className="grid md:grid-cols-2 gap-2">
                    {[
                      "Unlimited profile edits",
                      "Unlimited daily job matches",
                      "Unlimited cover letter generation",
                      "Advanced AI matching",
                      "Priority Telegram briefings",
                      "Multiple profile versions",
                    ].map((benefit) => (
                      <div key={benefit} className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                        {benefit}
                      </div>
                    ))}
                  </div>
                  <Button className="mt-4 w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white">
                    <Zap className="w-4 h-4 mr-2" /> Upgrade to Pro — ₹499/month
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card className="border-border/50 shadow-sm">
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>Manage how we contact you</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="p-4 bg-muted/30 rounded-lg border border-border/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h4 className="font-medium">Telegram Daily Briefing</h4>
                  <p className="text-sm text-muted-foreground">Get daily matches curated by our AI</p>
                </div>
                <Button variant="secondary" asChild>
                  <Link href="/telegram">Manage</Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="border-red-100 shadow-sm">
            <CardHeader>
              <CardTitle className="text-red-600 flex items-center gap-2">
                <ShieldAlert className="w-5 h-5" /> Danger Zone
              </CardTitle>
              <CardDescription>Permanent account actions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4 border-t border-red-100">
                <div>
                  <h4 className="font-medium">Deactivate Profile</h4>
                  <p className="text-sm text-muted-foreground">Pause all job matching and Telegram messages</p>
                </div>
                <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700">Deactivate</Button>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4 border-t border-red-100">
                <div>
                  <h4 className="font-medium">Delete Account</h4>
                  <p className="text-sm text-muted-foreground">Permanently remove your data from QAHire</p>
                </div>
                <Button variant="destructive">Delete Account</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
