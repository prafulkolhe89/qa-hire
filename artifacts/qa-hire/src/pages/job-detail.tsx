import { AppLayout } from "@/components/layout";
import {
  useGetJob,
  useUpdateJobStatus,
  useGetCoverLetter,
  useGenerateCoverLetter,
  useUpdateCoverLetter,
  useGetRecruiterMessage,
  useGenerateRecruiterMessage,
  useGetApplyGuidance,
  useGenerateApplyGuidance,
} from "@workspace/api-client-react";
import { useParams, useLocation } from "wouter";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft, Building2, MapPin, Clock, ExternalLink, ThumbsUp, CheckCircle,
  XCircle, Sparkles, Copy, CheckCircle2, AlertCircle, Loader2, RefreshCw,
  FileText, MessageSquare, Navigation,
} from "lucide-react";

type JobStatus = "new" | "interested" | "applied" | "not_relevant" | "duplicate";

export default function JobDetail() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const jobId = Number(id);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: job, isLoading } = useGetJob(jobId);
  const updateStatus = useUpdateJobStatus();
  const { data: coverLetter, isLoading: clLoading } = useGetCoverLetter(jobId);
  const generateCL = useGenerateCoverLetter();
  const updateCL = useUpdateCoverLetter();
  const { data: recruiterMsg, isLoading: msgLoading } = useGetRecruiterMessage(jobId);
  const generateMsg = useGenerateRecruiterMessage();
  const { data: applyGuidance, isLoading: guidanceLoading } = useGetApplyGuidance(jobId);
  const generateGuidance = useGenerateApplyGuidance();

  const [editingCL, setEditingCL] = useState(false);
  const [clContent, setClContent] = useState("");
  const [copied, setCopied] = useState<string | null>(null);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
    toast({ title: "Copied to clipboard" });
  };

  const handleStatusUpdate = (status: JobStatus) => {
    updateStatus.mutate(
      { id: jobId, data: { status } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: [`/api/jobs/${jobId}`] });
          queryClient.invalidateQueries({ queryKey: ["/api/stats/dashboard"] });
          toast({ title: "Status updated" });
        },
      }
    );
  };

  const handleGenerateCL = () => {
    generateCL.mutate(jobId, {
      onSuccess: (result) => {
        queryClient.invalidateQueries({ queryKey: [`/api/jobs/${jobId}/cover-letter`] });
        setClContent(result.content);
        toast({ title: "Cover letter generated" });
      },
      onError: (err: any) => {
        const msg = err?.data?.error ?? "Generation failed.";
        toast({ title: "Error", description: msg, variant: "destructive" });
      },
    });
  };

  const handleSaveCL = () => {
    updateCL.mutate(
      { jobId, data: { content: clContent } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: [`/api/jobs/${jobId}/cover-letter`] });
          setEditingCL(false);
          toast({ title: "Cover letter saved" });
        },
      }
    );
  };

  const handleGenerateMsg = () => {
    generateMsg.mutate(jobId, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [`/api/jobs/${jobId}/recruiter-message`] });
        toast({ title: "Recruiter message generated" });
      },
      onError: (err: any) => {
        const msg = err?.data?.error ?? "Generation failed.";
        toast({ title: "Error", description: msg, variant: "destructive" });
      },
    });
  };

  const handleGenerateGuidance = () => {
    generateGuidance.mutate(jobId, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [`/api/jobs/${jobId}/apply-guidance`] });
        toast({ title: "Apply guidance generated" });
      },
      onError: (err: any) => {
        const msg = err?.data?.error ?? "Generation failed.";
        toast({ title: "Error", description: msg, variant: "destructive" });
      },
    });
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return "bg-emerald-500/10 text-emerald-700 border-emerald-200";
    if (score >= 70) return "bg-amber-500/10 text-amber-700 border-amber-200";
    return "bg-red-500/10 text-red-700 border-red-200";
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="max-w-4xl mx-auto space-y-6 pb-12">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-48 rounded-xl" />
          <Skeleton className="h-96 rounded-xl" />
        </div>
      </AppLayout>
    );
  }

  if (!job) {
    return (
      <AppLayout>
        <div className="text-center py-20">
          <h2 className="text-2xl font-bold text-destructive mb-2">Job not found</h2>
          <Button variant="outline" onClick={() => navigate("/jobs")} className="mt-4">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Jobs
          </Button>
        </div>
      </AppLayout>
    );
  }

  const matchedSkills = (job as any).matchedSkills ?? [];
  const missingSkills = (job as any).missingSkills ?? [];
  const currentCLContent = editingCL ? clContent : (coverLetter?.content ?? "");

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto pb-12">
        {/* Back button */}
        <Button variant="ghost" className="mb-6 text-muted-foreground hover:text-foreground" onClick={() => navigate("/jobs")}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Jobs
        </Button>

        {/* Job Header */}
        <Card className="border-border/50 shadow-sm mb-6">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl font-bold tracking-tight mb-2">{job.title}</h1>
                <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-muted-foreground">
                  <span className="flex items-center gap-1.5 font-medium text-foreground">
                    <Building2 className="w-4 h-4" /> {job.company}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4" /> {job.location}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4" />
                    {job.postedAt ? format(new Date(job.postedAt), "MMM d, yyyy") : "Recently posted"}
                  </span>
                  <Badge variant="outline" className="text-xs">{job.source}</Badge>
                </div>
                <div className="flex items-center gap-2 mt-3 flex-wrap">
                  {job.jobType && <Badge variant="secondary" className="capitalize">{job.jobType}</Badge>}
                  {job.experienceRequired && <Badge variant="outline" className="text-xs">{job.experienceRequired}</Badge>}
                  {job.salaryRange && <Badge variant="outline" className="text-xs">{job.salaryRange}</Badge>}
                </div>
              </div>
              <div className={`flex flex-col items-center justify-center rounded-xl border px-5 py-3 shrink-0 ${getScoreColor(job.matchScore)}`}>
                <span className="text-xs font-semibold uppercase tracking-wider mb-0.5">Match Score</span>
                <span className="text-3xl font-bold leading-none">{job.matchScore}</span>
                <span className="text-xs mt-0.5 opacity-70">/ 100</span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2 mt-5 pt-5 border-t border-border/40 flex-wrap">
              {job.status !== "interested" && job.status !== "applied" && (
                <Button variant="outline" className="text-blue-600 border-blue-200 hover:bg-blue-50" onClick={() => handleStatusUpdate("interested")} disabled={updateStatus.isPending}>
                  <ThumbsUp className="w-4 h-4 mr-2" /> Interested
                </Button>
              )}
              {job.status !== "applied" && (
                <Button variant="outline" className="text-purple-600 border-purple-200 hover:bg-purple-50" onClick={() => handleStatusUpdate("applied")} disabled={updateStatus.isPending}>
                  <CheckCircle className="w-4 h-4 mr-2" /> Mark Applied
                </Button>
              )}
              {job.status !== "not_relevant" && (
                <Button variant="ghost" className="text-muted-foreground hover:text-red-600 hover:bg-red-50" onClick={() => handleStatusUpdate("not_relevant")} disabled={updateStatus.isPending}>
                  <XCircle className="w-4 h-4 mr-2" /> Hide
                </Button>
              )}
              <div className="ml-auto">
                <Button className="bg-primary hover:bg-primary/90" asChild>
                  <a href={job.applyUrl} target="_blank" rel="noopener noreferrer">
                    Apply Now <ExternalLink className="w-4 h-4 ml-2" />
                  </a>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="overview">
          <TabsList className="mb-6 w-full md:w-auto">
            <TabsTrigger value="overview" className="flex-1 md:flex-none">Overview</TabsTrigger>
            <TabsTrigger value="cover-letter" className="flex-1 md:flex-none">
              <FileText className="w-4 h-4 mr-1.5" /> Cover Letter
            </TabsTrigger>
            <TabsTrigger value="message" className="flex-1 md:flex-none">
              <MessageSquare className="w-4 h-4 mr-1.5" /> Message
            </TabsTrigger>
            <TabsTrigger value="apply-guide" className="flex-1 md:flex-none">
              <Navigation className="w-4 h-4 mr-1.5" /> Apply Guide
            </TabsTrigger>
          </TabsList>

          {/* ── Overview tab ── */}
          <TabsContent value="overview" className="space-y-6">
            {/* AI Match Analysis */}
            <Card className="border-border/50 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Sparkles className="w-4 h-4 text-amber-500" /> AI Match Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                  <p className="text-sm leading-relaxed">{job.matchReason}</p>
                </div>

                {matchedSkills.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wider mb-2">Matched Skills</p>
                    <div className="flex flex-wrap gap-1.5">
                      {matchedSkills.map((skill: string) => (
                        <Badge key={skill} variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 mr-1" /> {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {missingSkills.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-red-600 uppercase tracking-wider mb-2">Skill Gaps</p>
                    <div className="flex flex-wrap gap-1.5">
                      {missingSkills.map((skill: string) => (
                        <Badge key={skill} variant="outline" className="bg-red-50 text-red-600 border-red-200">
                          <AlertCircle className="w-3 h-3 mr-1" /> {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {job.skills.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Required Skills</p>
                    <div className="flex flex-wrap gap-1.5">
                      {job.skills.map((skill) => (
                        <Badge key={skill} variant="secondary" className="text-xs">{skill}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Job Description */}
            {job.description && (
              <Card className="border-border/50 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base">Job Description</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm leading-relaxed whitespace-pre-wrap text-muted-foreground">
                    {job.description}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* ── Cover Letter tab ── */}
          <TabsContent value="cover-letter">
            <Card className="border-border/50 shadow-sm">
              <CardHeader>
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <FileText className="w-4 h-4 text-primary" /> Cover Letter
                    </CardTitle>
                    <CardDescription>AI-generated, personalized cover letter for this role</CardDescription>
                  </div>
                  <Button
                    onClick={handleGenerateCL}
                    disabled={generateCL.isPending}
                    variant={coverLetter ? "outline" : "default"}
                    className={coverLetter ? "" : "bg-primary hover:bg-primary/90"}
                  >
                    {generateCL.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <Sparkles className="w-4 h-4 mr-2" />
                    )}
                    {coverLetter ? "Regenerate" : "Generate"}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {clLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-5/6" />
                    <Skeleton className="h-4 w-4/6" />
                  </div>
                ) : coverLetter || generateCL.isPending ? (
                  <div className="space-y-4">
                    {editingCL ? (
                      <>
                        <Textarea
                          value={clContent}
                          onChange={(e) => setClContent(e.target.value)}
                          className="min-h-[320px] text-sm leading-relaxed font-mono resize-none"
                        />
                        <div className="flex gap-2">
                          <Button onClick={handleSaveCL} disabled={updateCL.isPending} size="sm">
                            {updateCL.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                            Save
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => setEditingCL(false)}>Cancel</Button>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="bg-muted/20 border border-border/40 rounded-lg p-5 text-sm leading-relaxed whitespace-pre-wrap min-h-[200px]">
                          {generateCL.isPending ? (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Loader2 className="w-4 h-4 animate-spin" /> Generating personalized cover letter...
                            </div>
                          ) : (
                            coverLetter?.content
                          )}
                        </div>
                        {coverLetter && (
                          <div className="flex gap-2 flex-wrap">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleCopy(coverLetter.content, "cl")}
                            >
                              {copied === "cl" ? <CheckCircle2 className="w-4 h-4 mr-2 text-emerald-500" /> : <Copy className="w-4 h-4 mr-2" />}
                              Copy
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => { setClContent(coverLetter.content); setEditingCL(true); }}
                            >
                              Edit
                            </Button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <FileText className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p className="font-medium">No cover letter yet</p>
                    <p className="text-sm mt-1">Click Generate to create a personalized cover letter for this job.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Recruiter Message tab ── */}
          <TabsContent value="message">
            <Card className="border-border/50 shadow-sm">
              <CardHeader>
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <MessageSquare className="w-4 h-4 text-primary" /> LinkedIn Recruiter Message
                    </CardTitle>
                    <CardDescription>Personalized outreach message — copy and send manually</CardDescription>
                  </div>
                  <Button
                    onClick={handleGenerateMsg}
                    disabled={generateMsg.isPending}
                    variant={recruiterMsg ? "outline" : "default"}
                  >
                    {generateMsg.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <Sparkles className="w-4 h-4 mr-2" />
                    )}
                    {recruiterMsg ? <><RefreshCw className="w-4 h-4 mr-2" />Regenerate</> : "Generate"}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {msgLoading ? (
                  <Skeleton className="h-32 w-full" />
                ) : recruiterMsg ? (
                  <div className="space-y-4">
                    <div className="bg-muted/20 border border-border/40 rounded-lg p-5 text-sm leading-relaxed whitespace-pre-wrap">
                      {recruiterMsg.message}
                    </div>
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                      <p className="text-xs text-muted-foreground">
                        {recruiterMsg.message.length} / 700 characters
                        {recruiterMsg.message.length > 700 && (
                          <span className="text-red-500 ml-1">(over limit — edit before sending)</span>
                        )}
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCopy(recruiterMsg.message, "msg")}
                      >
                        {copied === "msg" ? <CheckCircle2 className="w-4 h-4 mr-2 text-emerald-500" /> : <Copy className="w-4 h-4 mr-2" />}
                        Copy Message
                      </Button>
                    </div>
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-700">
                      Send this message manually on LinkedIn. Do not automate messaging.
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p className="font-medium">No message yet</p>
                    <p className="text-sm mt-1">Generate a personalized LinkedIn outreach message for this job.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Apply Guidance tab ── */}
          <TabsContent value="apply-guide">
            <Card className="border-border/50 shadow-sm">
              <CardHeader>
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Navigation className="w-4 h-4 text-primary" /> Apply Guidance
                    </CardTitle>
                    <CardDescription>Step-by-step instructions tailored for this job</CardDescription>
                  </div>
                  <Button
                    onClick={handleGenerateGuidance}
                    disabled={generateGuidance.isPending}
                    variant={applyGuidance ? "outline" : "default"}
                  >
                    {generateGuidance.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <Sparkles className="w-4 h-4 mr-2" />
                    )}
                    {applyGuidance ? "Refresh" : "Generate"}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {guidanceLoading ? (
                  <Skeleton className="h-48 w-full" />
                ) : applyGuidance ? (
                  <div className="space-y-5">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="bg-muted/30 rounded-lg p-3 text-center">
                        <p className="text-xs text-muted-foreground mb-1">Apply Via</p>
                        <p className="font-semibold capitalize text-sm">{applyGuidance.applyMethod}</p>
                      </div>
                      <div className="bg-muted/30 rounded-lg p-3 text-center">
                        <p className="text-xs text-muted-foreground mb-1">Resume</p>
                        <p className="font-semibold text-sm">{applyGuidance.useResume ? "Required" : "Optional"}</p>
                      </div>
                      <div className="bg-muted/30 rounded-lg p-3 text-center">
                        <p className="text-xs text-muted-foreground mb-1">Cover Letter</p>
                        <p className="font-semibold text-sm">{applyGuidance.useCoverLetter ? "Recommended" : "Not needed"}</p>
                      </div>
                      <div className="bg-muted/30 rounded-lg p-3 text-center">
                        <p className="text-xs text-muted-foreground mb-1">Source</p>
                        <p className="font-semibold text-sm">{job.source}</p>
                      </div>
                    </div>

                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Action Steps</p>
                      <div className="bg-muted/20 border border-border/40 rounded-lg p-4 text-sm leading-relaxed whitespace-pre-wrap">
                        {applyGuidance.actionSteps}
                      </div>
                    </div>

                    {applyGuidance.directApplyUrl && (
                      <Button asChild className="w-full bg-primary hover:bg-primary/90">
                        <a href={applyGuidance.directApplyUrl} target="_blank" rel="noopener noreferrer">
                          Apply Directly <ExternalLink className="w-4 h-4 ml-2" />
                        </a>
                      </Button>
                    )}

                    {applyGuidance.recruiterNote && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-700">
                        <p className="font-semibold mb-1">Recruiter Note</p>
                        <p>{applyGuidance.recruiterNote}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <Navigation className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p className="font-medium">No guidance yet</p>
                    <p className="text-sm mt-1">Generate step-by-step apply guidance for this specific job.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
