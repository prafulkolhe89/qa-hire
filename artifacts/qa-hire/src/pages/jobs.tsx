import { AppLayout } from "@/components/layout";
import { useListJobs } from "@workspace/api-client-react";
import { useState } from "react";
import { JobCard } from "@/components/job-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { ListJobsStatus } from "@workspace/api-client-react";
import { Search, FilterX, Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function Jobs() {
  const [status, setStatus] = useState<ListJobsStatus | "all">("new");
  const [minScore, setMinScore] = useState<string>("0");
  const [location, setLocation] = useState<string>("");
  
  // Use debounced values for API calls if needed, but for simplicity we'll let wouter/query handle it
  const { data, isLoading, isFetching } = useListJobs({
    status: status === "all" ? undefined : status,
    minScore: minScore ? parseInt(minScore) : undefined,
    location: location || undefined,
    limit: 50
  });

  const clearFilters = () => {
    setStatus("all");
    setMinScore("");
    setLocation("");
  };

  return (
    <AppLayout>
      <div className="flex flex-col gap-6 h-full pb-10">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Job Matches</h1>
          <p className="text-muted-foreground mt-1">Review and manage your curated QA opportunities.</p>
        </div>

        {/* Filters */}
        <div className="bg-card border border-border/50 rounded-xl p-4 shadow-sm flex flex-col md:flex-row gap-4 items-end">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full flex-1">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Status</label>
              <Select value={status} onValueChange={(v: any) => setStatus(v)}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="new">New Matches</SelectItem>
                  <SelectItem value="interested">Interested</SelectItem>
                  <SelectItem value="applied">Applied</SelectItem>
                  <SelectItem value="not_relevant">Hidden</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Min Match Score</label>
              <Select value={minScore} onValueChange={setMinScore}>
                <SelectTrigger>
                  <SelectValue placeholder="Any score" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Any score</SelectItem>
                  <SelectItem value="60">60+ Good</SelectItem>
                  <SelectItem value="75">75+ Very Good</SelectItem>
                  <SelectItem value="90">90+ Excellent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Location</label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="e.g. Pune, Remote..." 
                  className="pl-9"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>
            </div>
          </div>
          
          <Button variant="ghost" onClick={clearFilters} className="text-muted-foreground shrink-0 md:mb-0.5">
            <FilterX className="w-4 h-4 mr-2" />
            Clear
          </Button>
        </div>

        {/* Results */}
        <div className="flex-1">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-sm font-medium text-muted-foreground">
              {data ? `${data.total} jobs found` : 'Loading...'}
            </h2>
            {isFetching && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
          </div>

          {isLoading ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <Skeleton key={i} className="h-[280px] rounded-xl" />
              ))}
            </div>
          ) : data?.jobs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed rounded-xl bg-muted/10">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                <Search className="w-8 h-8 text-muted-foreground/50" />
              </div>
              <h3 className="text-lg font-bold">No jobs found</h3>
              <p className="text-muted-foreground max-w-sm mt-2">
                We couldn't find any jobs matching your current filters. Try adjusting your search criteria or updating your profile.
              </p>
              <Button variant="outline" className="mt-6" onClick={clearFilters}>
                Clear all filters
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {data?.jobs.map(job => (
                <JobCard key={job.id} job={job} />
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}