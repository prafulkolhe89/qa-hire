import { AppLayout } from "@/components/layout";
import { useGetProfile, useCreateProfile, useUpdateProfile } from "@workspace/api-client-react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X, Plus, Loader2, Save } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
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

const profileSchema = z.object({
  skills: z.array(z.string()).min(1, "At least one skill is required"),
  yearsOfExperience: z.coerce.number().min(0, "Years of experience cannot be negative"),
  preferredLocations: z.array(z.string()).min(1, "Select at least one location"),
  noticePeriod: z.string().min(1, "Notice period is required"),
  jobTypes: z.array(z.string()).min(1, "Select at least one job type"),
  includeKeywords: z.array(z.string()).default([]),
  excludeKeywords: z.array(z.string()).default([]),
  expectedSalaryMin: z.coerce.number().optional().nullable(),
  expectedSalaryMax: z.coerce.number().optional().nullable(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function Profile() {
  const { toast } = useToast();
  const { data: profile, isLoading } = useGetProfile();
  const createProfile = useCreateProfile();
  const updateProfile = useUpdateProfile();
  
  const [skillInput, setSkillInput] = useState("");
  const [incKeywordInput, setIncKeywordInput] = useState("");
  const [excKeywordInput, setExcKeywordInput] = useState("");

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
    
    // Cast jobTypes to correct enum
    const formattedData = {
      ...data,
      jobTypes: data.jobTypes as ProfileInputJobTypesItem[],
    };

    const mutation = isUpdating ? updateProfile : createProfile;
    
    mutation.mutate(
      { data: formattedData },
      {
        onSuccess: () => {
          toast({
            title: "Profile saved",
            description: "Your job preferences have been updated successfully.",
          });
        },
        onError: () => {
          toast({
            title: "Error",
            description: "Failed to save profile. Please try again.",
            variant: "destructive",
          });
        }
      }
    );
  };

  const handleAddChip = (
    e: React.KeyboardEvent | React.MouseEvent, 
    field: "skills" | "includeKeywords" | "excludeKeywords",
    inputVal: string,
    setInputVal: (v: string) => void
  ) => {
    if ((e.type === 'keydown' && (e as React.KeyboardEvent).key !== 'Enter') || !inputVal.trim()) {
      return;
    }
    e.preventDefault();
    
    const currentValues = form.getValues(field);
    if (!currentValues.includes(inputVal.trim())) {
      form.setValue(field, [...currentValues, inputVal.trim()], { shouldValidate: true });
    }
    setInputVal("");
  };

  const handleRemoveChip = (field: "skills" | "includeKeywords" | "excludeKeywords", valueToRemove: string) => {
    const currentValues = form.getValues(field);
    form.setValue(
      field, 
      currentValues.filter(v => v !== valueToRemove),
      { shouldValidate: true }
    );
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

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto pb-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Job Preferences</h1>
          <p className="text-muted-foreground mt-1">Tell us exactly what you're looking for so our AI can score jobs accurately.</p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <Card className="border-border/50 shadow-sm">
              <CardHeader>
                <CardTitle>Core Profile</CardTitle>
                <CardDescription>Your essential QA background</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                
                {/* Skills */}
                <FormField
                  control={form.control}
                  name="skills"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>QA Skills & Technologies</FormLabel>
                      <FormDescription>Select from common skills or type your own and press Enter</FormDescription>
                      <div className="flex flex-col gap-3">
                        <div className="flex flex-wrap gap-2 mb-2">
                          {QA_SKILLS.filter(s => !field.value.includes(s)).map(skill => (
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
                          <Button 
                            type="button" 
                            variant="secondary" 
                            onClick={(e) => handleAddChip(e, "skills", skillInput, setSkillInput)}
                          >
                            Add
                          </Button>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {field.value.map(skill => (
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
                            <SelectItem value="Immediate">Immediate</SelectItem>
                            <SelectItem value="15 days">15 days</SelectItem>
                            <SelectItem value="30 days">30 days</SelectItem>
                            <SelectItem value="45 days">45 days</SelectItem>
                            <SelectItem value="60 days">60 days</SelectItem>
                            <SelectItem value="90 days">90 days</SelectItem>
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
                
                {/* Locations */}
                <FormField
                  control={form.control}
                  name="preferredLocations"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Preferred Locations</FormLabel>
                      <div className="flex flex-wrap gap-2">
                        {LOCATIONS.map(loc => {
                          const isSelected = field.value.includes(loc);
                          return (
                            <Badge
                              key={loc}
                              variant={isSelected ? "default" : "outline"}
                              className={`cursor-pointer transition-colors ${isSelected ? 'bg-primary/90' : 'hover:bg-muted'}`}
                              onClick={() => {
                                const newValues = isSelected 
                                  ? field.value.filter(v => v !== loc)
                                  : [...field.value, loc];
                                form.setValue("preferredLocations", newValues, { shouldValidate: true });
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

                {/* Job Types */}
                <FormField
                  control={form.control}
                  name="jobTypes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Job Types</FormLabel>
                      <div className="flex flex-wrap gap-2">
                        {["full-time", "remote", "hybrid", "contract"].map(type => {
                          const isSelected = field.value.includes(type);
                          return (
                            <Badge
                              key={type}
                              variant={isSelected ? "default" : "outline"}
                              className={`cursor-pointer transition-colors capitalize ${isSelected ? 'bg-primary/90' : 'hover:bg-muted'}`}
                              onClick={() => {
                                const newValues = isSelected 
                                  ? field.value.filter(v => v !== type)
                                  : [...field.value, type];
                                form.setValue("jobTypes", newValues, { shouldValidate: true });
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

                {/* Salary */}
                <div className="grid md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="expectedSalaryMin"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Min Expected Salary (INR LPA)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.5" placeholder="e.g. 12" {...field} value={field.value || ''} />
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
                        <FormLabel>Max Expected Salary (INR LPA) (Optional)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.5" placeholder="e.g. 18" {...field} value={field.value || ''} />
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
                        {field.value.map(keyword => (
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
                        {field.value.map(keyword => (
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