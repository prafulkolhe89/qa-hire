import { AppLayout } from "@/components/layout";
import {
  useGetProfile,
  useCreateProfile,
  useUpdateProfile,
  useGetResume,
  useUploadResume,
  useDeleteResume,
  useExtractResumeKeywords,
  useGetKeywords,
  useAddKeyword,
  useDeleteKeyword,
  useGetSubscription,
} from "@workspace/api-client-react";
import type { Keyword } from "@workspace/api-client-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  X, Plus, Loader2, Save, Upload, Trash2, FileText, Sparkles,
  CheckCircle2, AlertCircle, RefreshCw, Info,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import type { ProfileInputJobTypesItem } from "@workspace/api-client-react";

const QA_SKILLS = [
  "Manual QA", "Automation QA", "Full Stack QA", "Playwright", "Selenium",
  "Cypress", "API Testing", "Performance Testing", "Mobile Testing",
  "AI-assisted QA", "Appium", "JMeter", "Postman", "JIRA", "TestRail"
];

const LOCATIONS = [
  "Pune", "Mumbai", "Bangalore", "Hyderabad", "Chennai",
  "Delhi NCR", "Kolkata", "Remote", "Pan India"
];

const CATEGORY_LABELS: Record<string, string> = {
  primary_role: "Primary Role",
  qa_skill: "QA Skills",
  automation_tool: "Automation Tools",
  programming_language: "Languages",
  testing_type: "Testing Types",
  framework: "Frameworks",
  domain: "Domains",
  certification: "Certifications",
  cloud_devops: "Cloud / DevOps",
  other: "Other",
};

const CATEGORY_COLORS: Record<string, string> = {
  primary_role: "bg-purple-100 text-purple-800 border-purple-200",
  qa_skill: "bg-blue-100 text-blue-800 border-blue-200",
  automation_tool: "bg-green-100 text-green-800 border-green-200",
  programming_language: "bg-yellow-100 text-yellow-800 border-yellow-200",
  testing_type: "bg-pink-100 text-pink-800 border-pink-200",
  framework: "bg-indigo-100 text-indigo-800 border-indigo-200",
  domain: "bg-orange-100 text-orange-800 border-orange-200",
  certification: "bg-teal-100 text-teal-800 border-teal-200",
  cloud_devops: "bg-sky-100 text-sky-800 border-sky-200",
  other: "bg-gray-100 text-gray-700 border-gray-200",
};

const profileSchema = z.object({
  skills: z.array(z.string()).min(1, "At least one skill is required"),
  yearsOfExperience: z.coerce.number().min(0),
  preferredLocations: z.array(z.string()).min(1, "Select at least one location"),
  noticePeriod: z.string().min(1, "Notice period is required"),
  jobTypes: z.array(z.string()).min(1, "Select at least one job type"),
  includeKeywords: z.array(z.string()).default([]),
  excludeKeywords: z.array(z.string()).default([]),
  expectedSalaryMin: z.coerce.number().optional().nullable(),
  expectedSalaryMax: z.coerce.number().optional().nullable(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

function groupKeywords(keywords: Keyword[]) {
  return keywords.reduce<Record<string, Keyword[]>>((acc, kw) => {
    const cat = kw.category || "other";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(kw);
    return acc;
  }, {});
}

export default function Profile() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: profile, isLoading } = useGetProfile();
  const { data: resume, isLoading: resumeLoading } = useGetResume();
  const { data: keywords, isLoading: keywordsLoading } = useGetKeywords();
  const { data: subscription } = useGetSubscription();

  const createProfile = useCreateProfile();
  const updateProfile = useUpdateProfile();
  const uploadResume = useUploadResume();
  const deleteResume = useDeleteResume();
  const extractKeywords = useExtractResumeKeywords();
  const addKeyword = useAddKeyword();
  const deleteKeyword = useDeleteKeyword();

  const [skillInput, setSkillInput] = useState("");
  const [incKeywordInput, setIncKeywordInput] = useState("");
  const [excKeywordInput, setExcKeywordInput] = useState("");
  const [newKeywordInput, setNewKeywordInput] = useState("");
  const [newKeywordCategory, setNewKeywordCategory] = useState("other");

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      skills: [],
      yearsOfExperience: 0,
      preferredLocations: [],
      noticePeriod: "",
      jobTypes: [],
      includeKeywords: [],
      excludeKeywords: [],
      expectedSalaryMin: null,
      expectedSalaryMax: null,
    },
  });

  useEffect(() => {
    if (profile) {
      form.reset({
        skills: profile.skills || [],
        yearsOfExperience: profile.yearsOfExperience || 0,
        preferredLocations: profile.preferredLocations || [],
        noticePeriod: profile.noticePeriod || "",
        jobTypes: profile.jobTypes || [],
        includeKeywords: profile.includeKeywords || [],
        excludeKeywords: profile.excludeKeywords || [],
        expectedSalaryMin: profile.expectedSalaryMin,
        expectedSalaryMax: profile.expectedSalaryMax,
      });
    }
  }, [profile, form]);

  const onSubmit = (data: ProfileFormValues) => {
    const isUpdating = !!profile;
    const formattedData = { ...data, jobTypes: data.jobTypes as ProfileInputJobTypesItem[] };
    const mutation = isUpdating ? updateProfile : createProfile;
    mutation.mutate(
      { data: formattedData },
      {
        onSuccess: () => {
          toast({ title: "Profile saved", description: "Your job preferences have been updated." });
          queryClient.invalidateQueries({ queryKey: ["/api/subscription"] });
        },
        onError: (err: any) => {
          const msg = err?.data?.error ?? "Failed to save profile. Please try again.";
          toast({ title: "Error", description: msg, variant: "destructive" });
        },
      }
    );
  };

  const handleAddChip = (
    e: React.KeyboardEvent | React.MouseEvent,
    field: "skills" | "includeKeywords" | "excludeKeywords",
    inputVal: string,
    setInputVal: (v: string) => void
  ) => {
    if ((e.type === "keydown" && (e as React.KeyboardEvent).key !== "Enter") || !inputVal.trim()) return;
    e.preventDefault();
    const current = form.getValues(field);
    if (!current.includes(inputVal.trim())) {
      form.setValue(field, [...current, inputVal.trim()], { shouldValidate: true });
    }
    setInputVal("");
  };

  const handleRemoveChip = (field: "skills" | "includeKeywords" | "excludeKeywords", val: string) => {
    form.setValue(field, form.getValues(field).filter((v) => v !== val), { shouldValidate: true });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("resume", file);
    uploadResume.mutate(formData, {
      onSuccess: () => {
        toast({ title: "Resume uploaded", description: "Text extraction is in progress." });
        queryClient.invalidateQueries({ queryKey: ["/api/resume"] });
      },
      onError: () => toast({ title: "Upload failed", description: "Please try again.", variant: "destructive" }),
    });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDeleteResume = () => {
    deleteResume.mutate(undefined, {
      onSuccess: () => {
        toast({ title: "Resume deleted" });
        queryClient.invalidateQueries({ queryKey: ["/api/resume"] });
        queryClient.invalidateQueries({ queryKey: ["/api/keywords"] });
      },
    });
  };

  const handleExtractKeywords = () => {
    extractKeywords.mutate(undefined, {
      onSuccess: (result) => {
        toast({
          title: "Keywords extracted",
          description: `${result.keywords.length} keywords extracted from your resume.`,
        });
        queryClient.invalidateQueries({ queryKey: ["/api/keywords"] });
      },
      onError: (err: any) => {
        const msg = err?.data?.error ?? "Extraction failed. Check OPENAI_API_KEY is set.";
        toast({ title: "Extraction failed", description: msg, variant: "destructive" });
      },
    });
  };

  const handleAddCustomKeyword = () => {
    if (!newKeywordInput.trim()) return;
    addKeyword.mutate(
      { keyword: newKeywordInput.trim(), category: newKeywordCategory, source: "user_added" },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["/api/keywords"] });
          setNewKeywordInput("");
        },
        onError: () => toast({ title: "Error", description: "Failed to add keyword.", variant: "destructive" }),
      }
    );
  };

  const handleDeleteKeyword = (id: number) => {
    deleteKeyword.mutate(id, {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/keywords"] }),
    });
  };

  const getResumeStatusIcon = () => {
    if (!resume) return null;
    switch (resume.status) {
      case "ready": return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case "processing": return <Loader2 className="w-4 h-4 text-amber-500 animate-spin" />;
      case "failed": return <AlertCircle className="w-4 h-4 text-red-500" />;
      default: return <Loader2 className="w-4 h-4 text-muted-foreground animate-spin" />;
    }
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

  const isPending = createProfile.isPending || updateProfile.isPending;
  const groupedKeywords = groupKeywords(keywords ?? []);

  // Subscription usage display
  const plan = subscription?.plan ?? "free";
  const editUsage = subscription?.usage.monthlyProfileEdits;
  const editProgress = editUsage?.limit ? Math.round((editUsage.used / editUsage.limit) * 100) : 0;

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto pb-12">
        <div className="mb-8 flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Job Preferences</h1>
            <p className="text-muted-foreground mt-1">Tell us exactly what you're looking for so our AI can score jobs accurately.</p>
          </div>
          {subscription && (
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={plan === "pro" ? "bg-purple-50 text-purple-700 border-purple-200" : "bg-gray-50 text-gray-600 border-gray-200"}>
                {plan === "pro" ? "Pro Plan" : "Free Plan"}
              </Badge>
              {profile && (
                <Badge variant="outline" className="text-xs text-muted-foreground">
                  Profile v{subscription.profileVersion}
                </Badge>
              )}
            </div>
          )}
        </div>

        {/* Subscription Usage Warning */}
        {editUsage && editUsage.limit && editUsage.used >= editUsage.limit - 1 && (
          <Alert className="mb-6 border-amber-200 bg-amber-50">
            <Info className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-700">
              You've used {editUsage.used}/{editUsage.limit} profile edits this month.
              {editUsage.used >= editUsage.limit ? " Upgrade to Pro for unlimited edits." : " You have 1 edit remaining."}
            </AlertDescription>
          </Alert>
        )}

        {/* ── Resume Section ── */}
        <Card className="border-border/50 shadow-sm mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" /> Resume
            </CardTitle>
            <CardDescription>Upload your resume to auto-fill keywords and improve job matching</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {resumeLoading ? (
              <div className="flex items-center gap-2 text-muted-foreground text-sm"><Loader2 className="w-4 h-4 animate-spin" /> Loading...</div>
            ) : resume ? (
              <div className="flex items-center justify-between gap-4 p-3 bg-muted/30 rounded-lg border border-border/50">
                <div className="flex items-center gap-3 min-w-0">
                  {getResumeStatusIcon()}
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{resume.fileName}</p>
                    <p className="text-xs text-muted-foreground capitalize">{resume.status === "ready" ? "Ready — text extracted" : resume.status}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {resume.status === "ready" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleExtractKeywords}
                      disabled={extractKeywords.isPending}
                      className="text-primary border-primary/30 hover:bg-primary/5"
                    >
                      {extractKeywords.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : <Sparkles className="w-4 h-4 mr-1.5" />}
                      Extract Keywords
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadResume.isPending}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <RefreshCw className="w-4 h-4 mr-1.5" /> Replace
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleDeleteResume}
                    disabled={deleteResume.isPending}
                    className="text-red-500 hover:text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <div
                className="border-2 border-dashed border-border/50 rounded-xl p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/20 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                {uploadResume.isPending ? (
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground">Uploading...</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <Upload className="w-8 h-8 text-muted-foreground/60" />
                    <p className="font-medium">Drop your resume here or click to upload</p>
                    <p className="text-xs text-muted-foreground">PDF or DOCX · Max 5 MB</p>
                  </div>
                )}
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx"
              className="hidden"
              onChange={handleFileChange}
            />
          </CardContent>
        </Card>

        {/* ── AI Keywords Section ── */}
        {(keywords && keywords.length > 0) && (
          <Card className="border-border/50 shadow-sm mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500" /> AI Extracted Keywords
              </CardTitle>
              <CardDescription>Keywords extracted from your resume. You can add or remove them.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {keywordsLoading ? (
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              ) : (
                <>
                  {Object.entries(groupedKeywords).map(([cat, kws]) => (
                    <div key={cat}>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                        {CATEGORY_LABELS[cat] ?? cat}
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {kws.map((kw) => (
                          <Badge
                            key={kw.id}
                            variant="outline"
                            className={`pr-1 text-xs ${CATEGORY_COLORS[kw.category] ?? CATEGORY_COLORS.other}`}
                          >
                            {kw.keyword}
                            <div
                              className="ml-1.5 cursor-pointer hover:opacity-70 transition-opacity"
                              onClick={() => handleDeleteKeyword(kw.id)}
                            >
                              <X className="w-3 h-3" />
                            </div>
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))}

                  <div className="pt-2 border-t border-border/40">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Add a Keyword</p>
                    <div className="flex items-center gap-2">
                      <Input
                        value={newKeywordInput}
                        onChange={(e) => setNewKeywordInput(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddCustomKeyword(); } }}
                        placeholder="e.g. BDD, Cucumber..."
                        className="max-w-xs"
                      />
                      <Select value={newKeywordCategory} onValueChange={setNewKeywordCategory}>
                        <SelectTrigger className="w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(CATEGORY_LABELS).map(([val, label]) => (
                            <SelectItem key={val} value={val}>{label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={handleAddCustomKeyword}
                        disabled={addKeyword.isPending || !newKeywordInput.trim()}
                      >
                        <Plus className="w-4 h-4 mr-1" /> Add
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* ── Profile Version & Edit usage ── */}
        {subscription && editUsage?.limit && (
          <Card className="border-border/50 shadow-sm mb-8">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">This Month's Profile Edits</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-muted-foreground">Profile edits used</span>
                <span className="font-medium">{editUsage.used} / {editUsage.limit}</span>
              </div>
              <Progress value={editProgress} className="h-2" />
              {plan === "free" && (
                <p className="text-xs text-muted-foreground mt-2">
                  Upgrade to Pro for unlimited profile edits and more daily job matches.
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* ── Profile Form ── */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <Card className="border-border/50 shadow-sm">
              <CardHeader>
                <CardTitle>Core Profile</CardTitle>
                <CardDescription>Your essential QA background</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="skills"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>QA Skills & Technologies</FormLabel>
                      <FormDescription>Select from common skills or type your own and press Enter</FormDescription>
                      <div className="flex flex-col gap-3">
                        <div className="flex flex-wrap gap-2 mb-2">
                          {QA_SKILLS.filter((s) => !field.value.includes(s)).map((skill) => (
                            <Badge
                              key={skill}
                              variant="outline"
                              className="cursor-pointer hover:bg-primary/10 hover:text-primary transition-colors border-dashed"
                              onClick={() => form.setValue("skills", [...field.value, skill], { shouldValidate: true })}
                            >
                              <Plus className="w-3 h-3 mr-1" /> {skill}
                            </Badge>
                          ))}
                        </div>
                        <div className="flex items-center gap-2">
                          <Input
                            value={skillInput}
                            onChange={(e) => setSkillInput(e.target.value)}
                            onKeyDown={(e) => handleAddChip(e, "skills", skillInput, setSkillInput)}
                            placeholder="Type a custom skill..."
                            className="max-w-md"
                          />
                          <Button type="button" variant="secondary" onClick={(e) => handleAddChip(e, "skills", skillInput, setSkillInput)}>Add</Button>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {field.value.map((skill) => (
                            <Badge key={skill} variant="default" className="bg-primary/90 hover:bg-primary pr-1">
                              {skill}
                              <div
                                className="ml-2 w-4 h-4 rounded-full flex items-center justify-center hover:bg-white/20 cursor-pointer"
                                onClick={() => handleRemoveChip("skills", skill)}
                              >
                                <X className="w-3 h-3" />
                              </div>
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="yearsOfExperience"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Years of Experience</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.5" min="0" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="noticePeriod"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notice Period</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select notice period" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {["Immediate", "15 days", "30 days", "45 days", "60 days", "90 days"].map((v) => (
                              <SelectItem key={v} value={v}>{v}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50 shadow-sm">
              <CardHeader>
                <CardTitle>Job Logistics</CardTitle>
                <CardDescription>Where and how you want to work</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="preferredLocations"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Preferred Locations</FormLabel>
                      <div className="flex flex-wrap gap-2">
                        {LOCATIONS.map((loc) => {
                          const isSelected = field.value.includes(loc);
                          return (
                            <Badge
                              key={loc}
                              variant={isSelected ? "default" : "outline"}
                              className={`cursor-pointer transition-colors ${isSelected ? "bg-primary/90" : "hover:bg-muted"}`}
                              onClick={() => {
                                const newVals = isSelected ? field.value.filter((v) => v !== loc) : [...field.value, loc];
                                form.setValue("preferredLocations", newVals, { shouldValidate: true });
                              }}
                            >
                              {loc}
                            </Badge>
                          );
                        })}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="jobTypes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Job Types</FormLabel>
                      <div className="flex flex-wrap gap-2">
                        {["full-time", "remote", "hybrid", "contract"].map((type) => {
                          const isSelected = field.value.includes(type);
                          return (
                            <Badge
                              key={type}
                              variant={isSelected ? "default" : "outline"}
                              className={`cursor-pointer transition-colors capitalize ${isSelected ? "bg-primary/90" : "hover:bg-muted"}`}
                              onClick={() => {
                                const newVals = isSelected ? field.value.filter((v) => v !== type) : [...field.value, type];
                                form.setValue("jobTypes", newVals, { shouldValidate: true });
                              }}
                            >
                              {type.replace("-", " ")}
                            </Badge>
                          );
                        })}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="expectedSalaryMin"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Min Expected Salary (INR LPA)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.5" placeholder="e.g. 12" {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="expectedSalaryMax"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Max Expected Salary (INR LPA)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.5" placeholder="e.g. 18" {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50 shadow-sm">
              <CardHeader>
                <CardTitle>AI Matching Fine-tuning</CardTitle>
                <CardDescription>Keywords to explicitly include or exclude from matching</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 grid md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="includeKeywords"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-emerald-600">Must Have Keywords</FormLabel>
                      <div className="flex items-center gap-2 mb-2">
                        <Input
                          value={incKeywordInput}
                          onChange={(e) => setIncKeywordInput(e.target.value)}
                          onKeyDown={(e) => handleAddChip(e, "includeKeywords", incKeywordInput, setIncKeywordInput)}
                          placeholder="e.g. Fintech, SDET..."
                        />
                        <Button type="button" variant="secondary" onClick={(e) => handleAddChip(e, "includeKeywords", incKeywordInput, setIncKeywordInput)}>Add</Button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {field.value.map((keyword) => (
                          <Badge key={keyword} variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 pr-1">
                            {keyword}
                            <div className="ml-1 hover:bg-emerald-100 rounded-full cursor-pointer p-0.5" onClick={() => handleRemoveChip("includeKeywords", keyword)}>
                              <X className="w-3 h-3" />
                            </div>
                          </Badge>
                        ))}
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="excludeKeywords"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-red-600">Dealbreaker Keywords</FormLabel>
                      <div className="flex items-center gap-2 mb-2">
                        <Input
                          value={excKeywordInput}
                          onChange={(e) => setExcKeywordInput(e.target.value)}
                          onKeyDown={(e) => handleAddChip(e, "excludeKeywords", excKeywordInput, setExcKeywordInput)}
                          placeholder="e.g. Web3, Night shift..."
                        />
                        <Button type="button" variant="secondary" onClick={(e) => handleAddChip(e, "excludeKeywords", excKeywordInput, setExcKeywordInput)}>Add</Button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {field.value.map((keyword) => (
                          <Badge key={keyword} variant="outline" className="bg-red-50 text-red-700 border-red-200 pr-1">
                            {keyword}
                            <div className="ml-1 hover:bg-red-100 rounded-full cursor-pointer p-0.5" onClick={() => handleRemoveChip("excludeKeywords", keyword)}>
                              <X className="w-3 h-3" />
                            </div>
                          </Badge>
                        ))}
                      </div>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <div className="flex justify-end pt-4">
              <Button type="submit" size="lg" className="px-8 shadow-sm" disabled={isPending}>
                {isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Save Profile
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </AppLayout>
  );
}
