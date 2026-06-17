import { Link } from "wouter";
import { format } from "date-fns";
import type { Job } from "@workspace/api-client-react";
import { useUpdateJobStatus } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Building2, MapPin, ExternalLink, ThumbsUp, CheckCircle, XCircle,
  Clock, ChevronRight, CheckCircle2, AlertCircle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type JobStatus = "new" | "interested" | "applied" | "not_relevant" | "duplicate";

interface JobCardProps {
  job: Job & {
    matchedSkills?: string[];
    missingSkills?: string[];
  };
}

export function JobCard({ job }: JobCardProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const updateStatus = useUpdateJobStatus();

  const handleStatusUpdate = (status: JobStatus) => {
    updateStatus.mutate(
      { id: job.id, data: { status } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
          queryClient.invalidateQueries({ queryKey: ["/api/stats/dashboard"] });
          toast({ title: "Status updated", description: `Job marked as ${status.replace("_", " ")}` });
        },
        onError: () => toast({ title: "Error", description: "Failed to update job status.", variant: "destructive" }),
      }
    );
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return "bg-emerald-500/10 text-emerald-700 border-emerald-200";
    if (score >= 70) return "bg-amber-500/10 text-amber-700 border-amber-200";
    return "bg-red-500/10 text-red-700 border-red-200";
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "interested":
        return <Badge variant="secondary" className="bg-blue-100 text-blue-700 hover:bg-blue-100">Interested</Badge>;
      case "applied":
        return <Badge variant="secondary" className="bg-purple-100 text-purple-700 hover:bg-purple-100">Applied</Badge>;
      case "not_relevant":
        return <Badge variant="secondary" className="bg-gray-100 text-gray-700 hover:bg-gray-100">Archived</Badge>;
      default:
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 hover:bg-green-50">New</Badge>;
    }
  };

  const matchedSkills = (job as any).matchedSkills ?? [];
  const missingSkills = (job as any).missingSkills ?? [];

  return (
    <Card className="hover:shadow-md transition-all duration-200 border-border/50 shadow-sm overflow-hidden flex flex-col group">
      <CardHeader className="pb-3 flex flex-row items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            {getStatusBadge(job.status)}
            <Badge variant="outline" className="text-xs text-muted-foreground border-border/50 bg-muted/30">
              {job.source}
            </Badge>
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {job.postedAt ? format(new Date(job.postedAt), "MMM d") : "Recent"}
            </span>
          </div>
          <h3 className="font-bold text-lg leading-tight group-hover:text-primary transition-colors line-clamp-2">
            {job.title}
          </h3>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5" />
              {job.company}
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" />
              {job.location}
            </span>
          </div>
        </div>
        <div className={`flex flex-col items-center justify-center rounded-lg border px-3 py-2 shrink-0 ${getScoreColor(job.matchScore)}`}>
          <span className="text-xs font-semibold uppercase tracking-wider mb-0.5">Match</span>
          <span className="text-xl font-bold leading-none">{job.matchScore}</span>
        </div>
      </CardHeader>

      <CardContent className="flex-1 pb-4">
        <div className="bg-muted/30 rounded-md p-3 text-sm text-muted-foreground mb-3 border border-border/30">
          <p className="line-clamp-2">
            <span className="font-medium text-foreground/80">AI Insight:</span> {job.matchReason}
          </p>
        </div>

        {/* Matched skills */}
        {matchedSkills.length > 0 && (
          <div className="mb-2">
            <div className="flex flex-wrap gap-1.5">
              {matchedSkills.slice(0, 4).map((skill: string) => (
                <Badge key={skill} variant="outline" className="text-xs bg-emerald-50 text-emerald-700 border-emerald-200">
                  <CheckCircle2 className="w-3 h-3 mr-1" /> {skill}
                </Badge>
              ))}
              {missingSkills.slice(0, 2).map((skill: string) => (
                <Badge key={skill} variant="outline" className="text-xs bg-red-50 text-red-600 border-red-200">
                  <AlertCircle className="w-3 h-3 mr-1" /> {skill}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Job skills (fallback when no matched/missing) */}
        {matchedSkills.length === 0 && (
          <div className="flex flex-wrap gap-1.5">
            {job.skills.slice(0, 5).map((skill) => (
              <Badge key={skill} variant="secondary" className="text-xs font-normal bg-secondary/50">{skill}</Badge>
            ))}
            {job.skills.length > 5 && (
              <Badge variant="secondary" className="text-xs font-normal bg-secondary/50">+{job.skills.length - 5}</Badge>
            )}
          </div>
        )}
      </CardContent>

      <CardFooter className="pt-0 flex items-center justify-between gap-2 border-t border-border/30 px-4 py-3 bg-muted/10 flex-wrap">
        <div className="flex gap-1.5 flex-wrap">
          {job.status !== "interested" && job.status !== "applied" && (
            <Button
              size="sm"
              variant="outline"
              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200 h-8 px-2.5"
              onClick={() => handleStatusUpdate("interested")}
              disabled={updateStatus.isPending}
            >
              <ThumbsUp className="w-3.5 h-3.5 mr-1" /> Interested
            </Button>
          )}
          {job.status !== "applied" && (
            <Button
              size="sm"
              variant="outline"
              className="text-purple-600 hover:text-purple-700 hover:bg-purple-50 border-purple-200 h-8 px-2.5"
              onClick={() => handleStatusUpdate("applied")}
              disabled={updateStatus.isPending}
            >
              <CheckCircle className="w-3.5 h-3.5 mr-1" /> Applied
            </Button>
          )}
          {job.status !== "not_relevant" && (
            <Button
              size="sm"
              variant="ghost"
              className="text-muted-foreground hover:text-red-600 hover:bg-red-50 h-8 px-2.5"
              onClick={() => handleStatusUpdate("not_relevant")}
              disabled={updateStatus.isPending}
            >
              <XCircle className="w-3.5 h-3.5 mr-1" /> Hide
            </Button>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <Link href={`/jobs/${job.id}`}>
            <Button size="sm" variant="outline" className="h-8 px-2.5">
              Details <ChevronRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </Link>
          <Button size="sm" className="bg-primary/90 hover:bg-primary h-8 px-2.5" asChild>
            <a href={job.applyUrl} target="_blank" rel="noopener noreferrer">
              Apply <ExternalLink className="w-3.5 h-3.5 ml-1" />
            </a>
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
