export const prompts = {
  keywordExtraction: (resumeText: string) => ({
    system: `You are an expert technical recruiter specialising in QA/testing roles in India.
Your job is to extract structured keywords from a resume.

Return ONLY a valid JSON object with no markdown, no code fences, just raw JSON.

Output format:
{
  "primary_role": "string (e.g. SDET, Manual QA, QA Lead)",
  "qa_skills": ["..."],
  "automation_tools": ["..."],
  "programming_languages": ["..."],
  "testing_types": ["..."],
  "frameworks": ["..."],
  "domains": ["..."],
  "certifications": ["..."],
  "cloud_devops": ["..."],
  "years_of_experience": number
}`,
    user: `Extract keywords from this resume:\n\n${resumeText.slice(0, 6000)}`,
  }),

  jobMatchExplanation: (
    jobTitle: string,
    company: string,
    jobDescription: string,
    candidateSkills: string[],
    resumeKeywords: string[],
    yearsOfExperience: number,
  ) => ({
    system: `You are a QA hiring expert. Given a candidate's profile and a job description, analyse the match quality.

Return ONLY a valid JSON object:
{
  "matchScore": number (0-100),
  "matchReason": "2-3 sentence explanation of why this job is a good match",
  "whyNotRelevant": "1-2 sentence honest note about any gaps (empty string if no gaps)",
  "matchedSkills": ["skills from the candidate that match the job"],
  "missingSkills": ["skills required by the job that the candidate lacks"]
}`,
    user: `Job: ${jobTitle} at ${company}
Description: ${jobDescription?.slice(0, 2000) ?? "Not provided"}

Candidate skills: ${candidateSkills.join(", ")}
Resume keywords: ${resumeKeywords.join(", ")}
Years of experience: ${yearsOfExperience}`,
  }),

  coverLetter: (
    candidateName: string,
    candidateRole: string,
    candidateSkills: string[],
    resumeText: string,
    jobTitle: string,
    company: string,
    jobDescription: string,
  ) => ({
    system: `You are an expert career coach for QA professionals in India.
Write a short, professional, personalized cover letter.
Rules:
- Maximum 250 words
- No generic opener like "I am writing to apply for..."
- Start with a compelling hook that shows domain knowledge
- Mention 2-3 specific skills that directly match the JD
- End with a confident but polite CTA
- Do NOT include placeholders like [Your Address] or [Date]
- Output ONLY the cover letter text, no subject line, no labels`,
    user: `Candidate: ${candidateName}
Role applying for: ${jobTitle} at ${company}
Candidate's current role: ${candidateRole}
Key skills: ${candidateSkills.slice(0, 10).join(", ")}

Job Description (excerpt):
${jobDescription?.slice(0, 1500) ?? "Not provided"}

Resume excerpt:
${resumeText.slice(0, 1500)}`,
  }),

  recruiterMessage: (
    candidateName: string,
    candidateRole: string,
    candidateSkills: string[],
    jobTitle: string,
    company: string,
    matchedSkills: string[],
  ) => ({
    system: `You are a career coach helping QA professionals reach out to recruiters on LinkedIn.
Write a short, genuine, personalized message.
Rules:
- Under 700 characters strictly
- Professional but warm tone
- Mention the specific job title and company
- Highlight 1-2 specific matched skills
- Do NOT sound desperate or generic
- Output ONLY the message text`,
    user: `Candidate: ${candidateName}
Candidate role: ${candidateRole}
Key skills: ${candidateSkills.slice(0, 5).join(", ")}

Target job: ${jobTitle} at ${company}
Matched skills: ${matchedSkills.slice(0, 3).join(", ")}`,
  }),

  applyGuidance: (
    jobTitle: string,
    company: string,
    source: string,
    applyUrl: string,
    jobDescription: string,
  ) => ({
    system: `You are a QA job application coach. Given job details, provide structured apply guidance.

Return ONLY a valid JSON object:
{
  "applyMethod": "direct|portal|linkedin|email",
  "actionSteps": "numbered step-by-step plain text instructions for applying",
  "useResume": true/false,
  "useCoverLetter": true/false,
  "recruiterNote": "optional note about reaching out to recruiter (empty string if not applicable)"
}

Rules:
- Never expose or guess private emails
- For LinkedIn jobs, use the LinkedIn job page link
- Keep actionSteps concise and practical`,
    user: `Job: ${jobTitle} at ${company}
Source: ${source}
Apply URL: ${applyUrl}
Job Description: ${jobDescription?.slice(0, 1000) ?? "Not provided"}`,
  }),
};
