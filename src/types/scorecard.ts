export type QuestionState = "blank" | "unknown" | "positive" | "negative";

export interface QuestionData {
  state: QuestionState;
  note: string;
}

export interface FAINTComponent {
  questions: QuestionData[];
}

export interface Scorecard {
  id: string;
  version: number;
  salesperson: string;
  customerName: string;
  opportunityName: string;
  expectedOrderDate: string;
  reviewDate: string;
  createdAt: string;
  archived?: boolean;
  pinned?: boolean;
  tags?: string[];
  funds: FAINTComponent;
  authority: FAINTComponent;
  interest: FAINTComponent;
  need: FAINTComponent;
  timing: FAINTComponent;
}

export const FAINT_QUESTIONS = {
  funds: [
    "Budget range identified and documented ($XXk-$XXk)",
    "Budget holder confirmed with spending authority",
    "Approval process mapped (steps, timing, stakeholders)",
    "Finance pre-approval or credit check completed",
    "Total cost of ownership calculation shared and accepted",
    "Payment terms agreed (deposit, installments, timing)",
    "Fast-track finance pathway available if needed",
    "Trade-in or buyback value confirmed in writing",
  ],
  authority: [
    "Economic buyer (budget holder) identified and engaged",
    "Legal signatory confirmed and available for meetings",
    "All key influencers mapped with power/influence levels",
    "Decision-making process documented (committee, solo, consensus)",
    "Direct access to C-level or final decision-maker established",
    "End user/driver preferences captured and weighted",
    "Internal champion actively supporting our solution",
    "Each stakeholder's win criteria and concerns understood",
  ],
  interest: [
    "Business problem/pain points clearly articulated by customer",
    "Cost of doing nothing quantified (lost revenue, penalties, risks)",
    "Both emotional motivators and ROI drivers identified",
    "Previous relationship with brand or positive sentiment confirmed",
    "Driver turnover or satisfaction issues impacting operations",
    "Unexpected maintenance costs creating budget pressure",
    "New contract won requiring additional capacity/vehicles",
    "Downtime costs measured and creating urgency",
  ],
  need: [
    "Technical specifications documented and validated",
    "Current vehicle costs benchmarked (fuel, maintenance, downtime)",
    "Payload and capacity requirements confirmed with operations",
    "Route analysis completed (distance, terrain, urban/rural mix)",
    "Body/upfitting requirements specified with preferred suppliers",
    "Fleet replacement cycle and disposal strategy understood",
    "Driver ergonomics and safety requirements prioritized",
    "Solution directly addresses top 3 customer pain points",
  ],
  timing: [
    "Compelling event identified (contract start, lease end, etc.)",
    "Impact of delay quantified (lost revenue, penalties, missed opportunities)",
    "Customer's internal decision timeline confirmed with dates",
    "Body builder lead times verified and factored into schedule",
    "Finance approval timeline mapped with key milestones",
    "Demo/trial period scheduled with specific evaluation criteria",
    "Contract start date or delivery deadline confirmed in writing",
    "Competitor timelines known and our proposal favorably positioned",
  ],
};
