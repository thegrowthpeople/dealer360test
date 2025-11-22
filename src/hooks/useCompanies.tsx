import { useState, useEffect, useMemo } from 'react';
import { Company, FleetItem, Stakeholder } from '@/types/company';
import { useAuth } from '@/contexts/AuthContext';

// Mock data for testing
const generateMockCompanies = (): Company[] => {
  return [
    {
      id: '1',
      accountName: 'ABC Construction Ltd',
      dealershipId: 1,
      dealershipName: 'City Trucks',
      dealerGroup: 'Metro Group',
      accountManagerId: 1,
      accountManagerName: 'John Smith',
      bdmId: 1,
      about: 'Leading construction company specializing in commercial infrastructure projects across the region.',
      industryApplication: 'Construction',
      type: 'Existing',
      segment: 'Corporate Fleet',
      existingFleet: [
        { id: 'f1', brand: 'Volvo', quantity: 15, averageAge: 3 },
        { id: 'f2', brand: 'Scania', quantity: 8, averageAge: 5 }
      ],
      website: 'https://abcconstruction.com',
      linkedinUrl: 'https://linkedin.com/company/abc-construction',
      stakeholders: [
        {
          id: 's1',
          salutation: 'Mr',
          firstName: 'David',
          lastName: 'Wilson',
          jobTitle: 'Fleet Manager',
          phone: '+1 555-0101',
          email: 'dwilson@abcconstruction.com',
          likes: 'Golf, efficiency metrics',
          dislikes: 'Delays, poor communication',
          thingsToRemember: 'Prefers morning meetings, very data-driven',
          isPrimaryContact: true
        }
      ],
      status: 'Active',
      tags: ['High Value', 'Repeat Customer'],
      lastContactDate: '2025-01-15',
      nextFollowUpDate: '2025-02-01',
      createdAt: '2024-01-10T10:00:00Z',
      updatedAt: '2025-01-15T14:30:00Z',
      createdBy: 'user1'
    },
    {
      id: '2',
      accountName: 'Rapid Logistics Inc',
      dealershipId: 2,
      dealershipName: 'Highway Motors',
      dealerGroup: 'Regional Group',
      accountManagerId: 2,
      accountManagerName: 'Sarah Johnson',
      bdmId: 1,
      about: 'Fast-growing logistics company focused on last-mile delivery solutions.',
      industryApplication: 'Logistics',
      type: 'Prospect',
      segment: 'Small Fleet',
      existingFleet: [
        { id: 'f3', brand: 'Mercedes', quantity: 5, averageAge: 6 }
      ],
      website: 'https://rapidlogistics.com',
      linkedinUrl: 'https://linkedin.com/company/rapid-logistics',
      stakeholders: [
        {
          id: 's2',
          salutation: 'Ms',
          firstName: 'Emma',
          lastName: 'Brown',
          jobTitle: 'Operations Director',
          phone: '+1 555-0202',
          email: 'ebrown@rapidlogistics.com',
          likes: 'Innovation, tech solutions',
          dislikes: 'Traditional approaches',
          thingsToRemember: 'Very tech-savvy, interested in electric vehicles',
          isPrimaryContact: true
        }
      ],
      status: 'Active',
      tags: ['Prospect', 'Growing'],
      lastContactDate: '2025-01-10',
      nextFollowUpDate: '2025-01-25',
      createdAt: '2024-11-20T09:00:00Z',
      updatedAt: '2025-01-10T11:00:00Z',
      createdBy: 'user1'
    },
    {
      id: '3',
      accountName: 'Green Waste Management',
      dealershipId: 1,
      dealershipName: 'City Trucks',
      dealerGroup: 'Metro Group',
      accountManagerId: 1,
      accountManagerName: 'John Smith',
      bdmId: 2,
      about: 'Environmental services company providing waste collection and recycling solutions.',
      industryApplication: 'Waste Management',
      type: 'Existing',
      segment: 'Small Business',
      existingFleet: [
        { id: 'f4', brand: 'MAN', quantity: 10, averageAge: 4 }
      ],
      website: 'https://greenwaste.com',
      stakeholders: [
        {
          id: 's3',
          salutation: 'Mr',
          firstName: 'Robert',
          lastName: 'Green',
          jobTitle: 'CEO',
          phone: '+1 555-0303',
          email: 'rgreen@greenwaste.com',
          isPrimaryContact: true
        }
      ],
      status: 'Active',
      tags: ['Sustainable', 'Local'],
      lastContactDate: '2025-01-12',
      createdAt: '2023-08-15T08:00:00Z',
      updatedAt: '2025-01-12T16:00:00Z',
      createdBy: 'user1'
    }
  ];
};

export const useCompanies = () => {
  const [companies, setCompanies] = useState<Company[]>(generateMockCompanies());
  const [loading, setLoading] = useState(false);
  const { bdmId, isAdmin, isManager } = useAuth();

  // Filter companies based on user role
  const filteredCompanies = useMemo(() => {
    if (isAdmin || (isManager && !bdmId)) {
      return companies;
    }
    return companies.filter(company => company.bdmId === bdmId);
  }, [companies, bdmId, isAdmin, isManager]);

  const createCompany = (companyData: Omit<Company, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>) => {
    const newCompany: Company = {
      ...companyData,
      id: `company-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'current-user'
    };
    setCompanies(prev => [...prev, newCompany]);
    return newCompany;
  };

  const updateCompany = (id: string, updates: Partial<Company>) => {
    setCompanies(prev =>
      prev.map(company =>
        company.id === id
          ? { ...company, ...updates, updatedAt: new Date().toISOString() }
          : company
      )
    );
  };

  const deleteCompany = (id: string) => {
    setCompanies(prev => prev.filter(company => company.id !== id));
  };

  const getCompanyById = (id: string) => {
    return companies.find(company => company.id === id);
  };

  const filterCompanies = (filters: {
    bdmId?: number | null;
    dealerGroup?: string;
    dealershipId?: number | null;
    type?: string;
    segment?: string;
    tags?: string[];
    search?: string;
  }) => {
    return filteredCompanies.filter(company => {
      if (filters.bdmId !== undefined && filters.bdmId !== null && company.bdmId !== filters.bdmId) return false;
      if (filters.dealerGroup && company.dealerGroup !== filters.dealerGroup) return false;
      if (filters.dealershipId !== undefined && filters.dealershipId !== null && company.dealershipId !== filters.dealershipId) return false;
      if (filters.type && company.type !== filters.type) return false;
      if (filters.segment && company.segment !== filters.segment) return false;
      if (filters.tags && filters.tags.length > 0 && !filters.tags.some(tag => company.tags.includes(tag))) return false;
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesCompanyOrManager = 
          company.accountName.toLowerCase().includes(searchLower) ||
          company.accountManagerName?.toLowerCase().includes(searchLower) ||
          company.dealershipName?.toLowerCase().includes(searchLower);
        
        // Also search in stakeholders
        const matchesStakeholder = company.stakeholders.some(stakeholder => 
          `${stakeholder.firstName} ${stakeholder.lastName}`.toLowerCase().includes(searchLower) ||
          stakeholder.email?.toLowerCase().includes(searchLower)
        );
        
        return matchesCompanyOrManager || matchesStakeholder;
      }
      return true;
    });
  };

  return {
    companies: filteredCompanies,
    loading,
    createCompany,
    updateCompany,
    deleteCompany,
    getCompanyById,
    filterCompanies
  };
};
