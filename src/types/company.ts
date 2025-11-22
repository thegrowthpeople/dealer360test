export interface FleetItem {
  id: string;
  brand: string;
  quantity: number;
  averageAge: number;
}

export interface Stakeholder {
  id: string;
  salutation: 'Mr' | 'Ms' | 'Mrs' | 'Dr' | 'Prof';
  firstName: string;
  lastName: string;
  jobTitle: string;
  phone?: string;
  email?: string;
  likes?: string;
  dislikes?: string;
  thingsToRemember?: string;
  isPrimaryContact: boolean;
}

export interface Company {
  id: string;
  // Basic Info
  accountName: string;
  dealershipId: number | null;
  dealershipName?: string;
  dealerGroup?: string;
  accountManagerId: number | null;
  accountManagerName?: string;
  bdmId: number | null;
  
  // Company Details
  about: string;
  industryApplication: 'Construction' | 'Mining' | 'Logistics' | 'Waste Management' | 
                       'Agriculture' | 'Utilities' | 'Government' | 'Other';
  type: 'Existing' | 'Prospect';
  segment: 'Owner Operator' | 'Small Business' | 'Small Fleet' | 
           'Corporate Fleet' | 'Government Fleet';
  
  // Fleet Information
  existingFleet: FleetItem[];
  
  // Links
  website?: string;
  linkedinUrl?: string;
  
  // Stakeholders
  stakeholders: Stakeholder[];
  
  // Metadata
  status: 'Active' | 'Inactive' | 'On Hold';
  tags: string[];
  lastContactDate?: string;
  nextFollowUpDate?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}
