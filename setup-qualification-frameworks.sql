-- =====================================================
-- QualificationFrameworks Table Setup
-- Run this SQL in your Supabase SQL Editor
-- =====================================================

-- Create QualificationFrameworks table with JSONB structure
create table public."QualificationFrameworks" (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  active boolean default true not null,
  display_order integer not null default 0,
  structure jsonb not null,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

-- Index for active frameworks
create index qualification_frameworks_active_idx 
  on public."QualificationFrameworks"(active) 
  where active = true;

-- Enable RLS
alter table public."QualificationFrameworks" enable row level security;

-- Allow all authenticated users to read active frameworks
create policy "All authenticated users can view active frameworks"
  on public."QualificationFrameworks"
  for select
  to authenticated
  using (active = true);

-- Only admins can manage frameworks
create policy "Admins can manage frameworks"
  on public."QualificationFrameworks"
  for all
  to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- Insert FAINT framework with all questions
insert into public."QualificationFrameworks" (name, description, structure)
values (
  'FAINT',
  'Funds, Authority, Interest, Need, Timing qualification framework',
  '{
    "categories": [
      {
        "name": "funds",
        "displayName": "Funds",
        "color": "bg-blue-500",
        "questions": [
          "Budget range identified and documented ($XXk-$XXk)",
          "Budget holder confirmed with spending authority",
          "Approval process mapped (steps, timing, stakeholders)",
          "Finance pre-approval or credit check completed",
          "Total cost of ownership calculation shared and accepted",
          "Payment terms agreed (deposit, installments, timing)",
          "Fast-track finance pathway available if needed",
          "Trade-in or buyback value confirmed in writing"
        ]
      },
      {
        "name": "authority",
        "displayName": "Authority",
        "color": "bg-purple-500",
        "questions": [
          "Economic buyer (budget holder) identified and engaged",
          "Legal signatory confirmed and available for meetings",
          "All key influencers mapped with power/influence levels",
          "Decision-making process documented (committee, solo, consensus)",
          "Direct access to C-level or final decision-maker established",
          "End user/driver preferences captured and weighted",
          "Internal champion actively supporting our solution",
          "Each stakeholder''s win criteria and concerns understood"
        ]
      },
      {
        "name": "interest",
        "displayName": "Interest",
        "color": "bg-green-500",
        "questions": [
          "Business problem/pain points clearly articulated by customer",
          "Cost of doing nothing quantified (lost revenue, penalties, risks)",
          "Both emotional motivators and ROI drivers identified",
          "Previous relationship with brand or positive sentiment confirmed",
          "Driver turnover or satisfaction issues impacting operations",
          "Unexpected maintenance costs creating budget pressure",
          "New contract won requiring additional capacity/vehicles",
          "Downtime costs measured and creating urgency"
        ]
      },
      {
        "name": "need",
        "displayName": "Need",
        "color": "bg-orange-500",
        "questions": [
          "Technical specifications documented and validated",
          "Current vehicle costs benchmarked (fuel, maintenance, downtime)",
          "Payload and capacity requirements confirmed with operations",
          "Route analysis completed (distance, terrain, urban/rural mix)",
          "Body/upfitting requirements specified with preferred suppliers",
          "Fleet replacement cycle and disposal strategy understood",
          "Driver ergonomics and safety requirements prioritized",
          "Solution directly addresses top 3 customer pain points"
        ]
      },
      {
        "name": "timing",
        "displayName": "Timing",
        "color": "bg-red-500",
        "questions": [
          "Compelling event identified (contract start, lease end, etc.)",
          "Impact of delay quantified (lost revenue, penalties, missed opportunities)",
          "Customer''s internal decision timeline confirmed with dates",
          "Body builder lead times verified and factored into schedule",
          "Finance approval timeline mapped with key milestones",
          "Demo/trial period scheduled with specific evaluation criteria",
          "Contract start date or delivery deadline confirmed in writing",
          "Competitor timelines known and our proposal favorably positioned"
        ]
      }
    ]
  }'::jsonb
);

-- Add framework_id to QualificationScorecards
alter table public."QualificationScorecards"
  add column framework_id uuid references public."QualificationFrameworks"(id) on delete restrict;

-- Set default framework to FAINT for existing scorecards
update public."QualificationScorecards"
set framework_id = (select id from public."QualificationFrameworks" where name = 'FAINT' limit 1)
where framework_id is null;

-- Make framework_id not null with default
alter table public."QualificationScorecards"
  alter column framework_id set default (select id from public."QualificationFrameworks" where name = 'FAINT' limit 1);
  
alter table public."QualificationScorecards"
  alter column framework_id set not null;

-- Add index
create index qualification_scorecards_framework_idx 
  on public."QualificationScorecards"(framework_id);

-- Add comment
comment on table public."QualificationFrameworks" is 'Stores qualification frameworks (FAINT, BANT, MEDDIC, etc.) with dynamic question structures';

-- =====================================================
-- Setup Complete! 
-- The FAINT framework is now in the database and 
-- all existing scorecards are linked to it.
-- =====================================================
