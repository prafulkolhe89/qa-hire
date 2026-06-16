import { AppLayout } from "@/components/layout";
import { useGetTelegramStatus, useConnectTelegram, useDisconnectTelegram, useSendTelegramTest } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, CheckCircle2, AlertCircle, Loader2, MessageSquare, Trash2 } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

export default function TelegramSetup() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: status, isLoading } = useGetTelegramStatus();
  
  const connectTelegram = useConnectTelegram();
  const disconnectTelegram = useDisconnectTelegram();
  const sendTest = useSendTelegramTest();

  const [chatId, setChatId] = useState("");

  const handleConnect = () => {
    if (!chatId.trim()) {
      toast({ title: "Error", description: "Please enter a valid Chat ID", variant: "destructive" });
      return;
    }
    
    connectTelegram.mutate({ data: { chatId: chatId.trim() } }, {
      onSuccess: () => {
        toast({ title: "Connected", description: "Telegram account successfully linked!" });
        setChatId("");
        queryClient.invalidateQueries({ queryKey: ["/api/telegram/status"] });
        queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      },
      onError: () => {
        toast({ title: "Connection failed", description: "Could not connect to Telegram. Please check your Chat ID.", variant: "destructive" });
      }
    });
  };

  const handleDisconnect = () => {
    disconnectTelegram.mutate(undefined, {
      onSuccess: () => {
        toast({ title: "Disconnected", description: "Telegram notifications have been disabled." });
        queryClient.invalidateQueries({ queryKey: ["/api/telegram/status"] });
        queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      }
    });
  };

  const handleSendTest = () => {
    sendTest.mutate(undefined, {
      onSuccess: () => {
        toast({ title: "Test sent", description: "Check your Telegram app for the test message." });
      },
      onError: () => {
        toast({ title: "Failed", description: "Could not send test message. Check your connection.", variant: "destructive" });
      }
    });
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

  const isConnected = status?.connected;

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto pb-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Send className="w-8 h-8 text-blue-500" /> Telegram Delivery
          </h1>
          <p className="text-muted-foreground mt-2">
            Receive your daily curated QA job matches directly in your Telegram inbox.
          </p>
        </div>

        {isConnected ? (
          <Card className="border-border/50 shadow-sm border-t-4 border-t-blue-500">
            <CardHeader>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-6 h-6 text-blue-500" />
                <CardTitle>Connected Successfully</CardTitle>
              </div>
              <CardDescription>
                Your QAHire account is linked to Telegram {status.username ? `(@${status.username})` : `(Chat ID: ${status.chatId})`}.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-blue-50/50 p-4 rounded-lg border border-blue-100 flex items-start gap-3 text-sm text-blue-800">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <p>
                  You will receive a daily briefing message containing your top matched QA roles based on your profile preferences.
                </p>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-border/40">
              <Button 
                variant="outline" 
                onClick={handleSendTest}
                disabled={sendTest.isPending}
                className="w-full sm:w-auto"
              >
                {sendTest.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <MessageSquare className="w-4 h-4 mr-2" />}
                Send Test Message
              </Button>
              <Button 
                variant="ghost" 
                onClick={handleDisconnect}
                disabled={disconnectTelegram.isPending}
                className="w-full sm:w-auto text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                {disconnectTelegram.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
                Disconnect
              </Button>
            </CardFooter>
          </Card>
        ) : (
          <div className="grid md:grid-cols-5 gap-8">
            <div className="md:col-span-3 space-y-6">
              <Card className="border-border/50 shadow-sm">
                <CardHeader>
                  <CardTitle>Connect Your Account</CardTitle>
                  <CardDescription>Follow the instructions to get your unique Chat ID.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Telegram Chat ID</label>
                    <div className="flex gap-2">
                      <Input 
                        placeholder="e.g. 123456789" 
                        value={chatId}
                        onChange={(e) => setChatId(e.target.value)}
                      />
                      <Button onClick={handleConnect} disabled={connectTelegram.isPending} className="bg-blue-500 hover:bg-blue-600 text-white">
                        {connectTelegram.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Connect"}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="md:col-span-2">
              <Card className="bg-muted/30 border-border/50">
                <CardHeader>
                  <CardTitle className="text-lg">Instructions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                  <ol className="list-decimal list-inside space-y-3 text-muted-foreground marker:text-foreground/70 marker:font-medium">
                    <li>Open Telegram and search for <strong className="text-foreground">@QAHireBot</strong>.</li>
                    <li>Start a conversation with the bot by sending <strong className="text-foreground">/start</strong>.</li>
                    <li>The bot will reply with your unique Chat ID.</li>
                    <li>Copy that ID and paste it in the field to the left.</li>
                  </ol>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}