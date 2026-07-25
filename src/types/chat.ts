// src/types/chat.ts

export interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export interface CustomerProfile {
  state: string | null;
  industry: string | null;
  business_model: string | null;
  business_age: number | null;
  annual_turnover: number | null;
  funding_required: number | null;
  company_type: string | null;
  business_stage: string | null;
  gst_registered: boolean | null;
  udyam_registered: boolean | null;
  dpiit_registered: boolean | null;
  women_owned: boolean | null;
  sc_st: boolean | null;
}