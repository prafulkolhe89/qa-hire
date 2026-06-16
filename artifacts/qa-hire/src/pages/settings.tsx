import { AppLayout } from "@/components/layout";
import { useGetProfile } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useClerk, useUser } from "@clerk/react";
import { Loader2, User, ShieldAlert } from "lucide-react";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";

export default function Settings() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const { data: profile, isLoading } = useGetProfile();

  const handleSignOut = () => {
    signOut({ redirectUrl: import.meta.env.BASE_URL.replace(/\/$/, "") || "/" });
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto pb-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Account Settings</h1>
          <p className="text-muted-foreground mt-1">Manage your account and preferences.</p>
        </div>

        <div className="space-y-6">
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
                  <p className="font-medium capitalize">{user?.externalAccounts[0]?.provider.replace('oauth_', '') || 'Email/Password'}</p>
                </div>
              </div>
              <div className="mt-6">
                <Button variant="outline" onClick={handleSignOut}>Log out of all devices</Button>
              </div>
            </CardContent>
          </Card>

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