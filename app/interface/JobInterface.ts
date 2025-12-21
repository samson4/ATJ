// Updated Job interface to include all fields used across the app
interface Job {
  id: string;
  // timestamps
  created_at: string | null;
  updated_at?: string | null;

  // job/role fields
  role: string;
  title?: string;
  job_description?: string | null;
  short_description?: string | null;
  description?: string | null;

  // company relation
  company_id: string;
  company_name: string;
  company_logo?: string | null;
  company_website?: string | null;
  company_description?: string | null;

  // meta
  tags?: string[]; // tag list
  workplace?: string; // remote / onsite / hybrid / contract
  employment_type?: string; // full-time, part-time, contract ...
  salary_min?: number | null;
  salary_max?: number | null;
  currency?: string | null;

  // application & verification
  link?: string | null; // application link / email
  deadline?: string | null;
  rating?: number | null;
  verified?: boolean | null;
  proposals?: number | null;

  // any extra fields
  [key: string]: any;
}