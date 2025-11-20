export type QuestionState = "blank" | "unknown" | "positive" | "negative";

export interface QuestionData {
  state: QuestionState;
  note: string;
}

export interface FAINTComponent {
  questions: QuestionData[];
}

export interface DatabaseScorecard {
  id: string;
  version: number;
  account_manager: string;
  customer_name: string;
  opportunity_name: string;
  expected_order_date: string | null;
  review_date: string;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  archived: boolean;
  pinned: boolean;
  tags: string[];
  bdm_id: number | null;
  funds: FAINTComponent;
  authority: FAINTComponent;
  interest: FAINTComponent;
  need: FAINTComponent;
  timing: FAINTComponent;
}

export interface CreateScorecardInput {
  account_manager: string;
  customer_name: string;
  opportunity_name: string;
  expected_order_date?: string;
  review_date: string;
  bdm_id: number | null;
  funds: FAINTComponent;
  authority: FAINTComponent;
  interest: FAINTComponent;
  need: FAINTComponent;
  timing: FAINTComponent;
  tags?: string[];
}

export interface UpdateScorecardInput {
  id: string;
  account_manager?: string;
  customer_name?: string;
  opportunity_name?: string;
  expected_order_date?: string;
  review_date?: string;
  funds?: FAINTComponent;
  authority?: FAINTComponent;
  interest?: FAINTComponent;
  need?: FAINTComponent;
  timing?: FAINTComponent;
  archived?: boolean;
  pinned?: boolean;
  tags?: string[];
}
