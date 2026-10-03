export type {
  ResumeCertification,
  ResumeDocument,
  ResumeEducation,
  ResumeExperience,
  ResumeImportResponse,
  ResumeLanguage,
  ResumeLink,
  ResumeProject,
  ResumeRow,
  ResumeSectionKey,
  ResumeSkillGroup
} from '../schemas/resume'

export type { ResumeTemplateDefinition, ResumeTemplateKey } from '../data/resumeTemplates'

export type ResumeSaveStatus = 'idle' | 'dirty' | 'saving' | 'saved' | 'error'
export type ResumeCreationSource = 'profile' | 'cv' | 'blank'

export type CandidateProfile = {
  full_name?: string | null
  bio?: string | null
  skills?: string[] | null
  experience?: Array<Record<string, unknown>> | null
  education?: Array<Record<string, unknown>> | null
  portfolio_links?: Array<Record<string, unknown>> | null
  github_url?: string | null
  linkedin_url?: string | null
  cv_file_path?: string | null
}
