interface Company {
  id: string;
  created_at: string;
  update_at: string;
  name: string;
  website: string;
  description: string;
  logo: string;
  industry?: string | null;
  company_size?: string | null;
  employee_count?: number | string | null;
  headquarters?: string | null;
  office_locations?: string[] | string | null;
  founded_year?: number | null;
  estimated_salary_min?: number | null;
  estimated_salary_max?: number | null;
  estimated_salary_currency?: string | null;
  estimated_salary_range?: string | null;
  linkedin_url?: string | null;
  twitter_url?: string | null;
}
