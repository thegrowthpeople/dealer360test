export interface Visitation {
  id: string;
  dateOfVisit: string;
  dealership: string;
  location: string;
  customerName: string;
  contact: string;
  industryApplication: string;
  brand: "Mercedes-Benz" | "Freightliner";
  truckModel: string;
  competitor: string;
  potentialDealSize: number;
  potentialDecisionDate: string;
  notes: string;
}

export interface Order {
  id: string;
  dateOfOrder: string;
  dealership: string;
  location: string;
  customerName: string;
  contact: string;
  industryApplication: string;
  brand: "Mercedes-Benz" | "Freightliner";
  truckModel: string;
  unitsOrdered: number;
  dtfs: boolean;
  servicePlan: boolean;
  competitor: string;
  notes: string;
}

export interface DeliveryForecast {
  committedUnits: number;
  committedNotes: string;
  potentialUpside: number;
  upsideNotes: string;
}

export interface WeeklyReport {
  id: string;
  weekEnding: string;
  bdmName: string;
  visitations: Visitation[];
  orders: Order[];
  deliveryForecast: DeliveryForecast;
  createdAt: string;
}

// Mock data for demo
export const mockReports: WeeklyReport[] = [
  {
    id: "1",
    weekEnding: "2025-10-03",
    bdmName: "John Smith",
    createdAt: "2025-10-03T16:30:00",
    visitations: [
      {
        id: "v1",
        dateOfVisit: "2025-09-29",
        dealership: "Premier Trucks Inc",
        location: "Atlanta, GA",
        customerName: "ABC Logistics",
        contact: "Michael Johnson - Fleet Manager",
        industryApplication: "Long Haul Freight",
        brand: "Freightliner",
        truckModel: "Cascadia",
        competitor: "Peterbilt 579",
        potentialDealSize: 450000,
        potentialDecisionDate: "2025-11-15",
        notes: "Strong interest in fuel efficiency features. Decision maker wants to compare TCO with current fleet."
      },
      {
        id: "v2",
        dateOfVisit: "2025-10-01",
        dealership: "Metro Commercial Vehicles",
        location: "Charlotte, NC",
        customerName: "Sunrise Construction",
        contact: "Sarah Williams - Operations Director",
        industryApplication: "Construction",
        brand: "Mercedes-Benz",
        truckModel: "Actros",
        competitor: "Volvo VNL",
        potentialDealSize: 320000,
        potentialDecisionDate: "2025-10-20",
        notes: "Impressed with safety features and driver comfort. Requesting demo unit for 2-week trial."
      },
      {
        id: "v3",
        dateOfVisit: "2025-10-02",
        dealership: "Southern Truck Center",
        location: "Birmingham, AL",
        customerName: "Delta Distribution",
        contact: "Robert Brown - VP Logistics",
        industryApplication: "Distribution",
        brand: "Freightliner",
        truckModel: "M2 106",
        competitor: "International MV",
        potentialDealSize: 180000,
        potentialDecisionDate: "2025-11-30",
        notes: "Looking to expand fleet by 3 units. Budget approved for Q4."
      }
    ],
    orders: [
      {
        id: "o1",
        dateOfOrder: "2025-09-30",
        dealership: "Premier Trucks Inc",
        location: "Atlanta, GA",
        customerName: "XYZ Transport",
        contact: "David Martinez - Fleet Director",
        industryApplication: "Refrigerated Transport",
        brand: "Freightliner",
        truckModel: "Cascadia",
        unitsOrdered: 5,
        dtfs: true,
        servicePlan: true,
        competitor: "Kenworth T680",
        notes: "5-year financing with DTFS. Full service plan included. Delivery scheduled for December."
      },
      {
        id: "o2",
        dateOfOrder: "2025-10-02",
        dealership: "Metro Commercial Vehicles",
        location: "Charlotte, NC",
        customerName: "Regional Carriers LLC",
        contact: "Jennifer Davis - Owner",
        industryApplication: "Regional Haul",
        brand: "Mercedes-Benz",
        truckModel: "Arocs",
        unitsOrdered: 2,
        dtfs: false,
        servicePlan: true,
        competitor: "Mack Anthem",
        notes: "Cash purchase. Extended service plan for 3 years. Customer very satisfied with previous MB units."
      }
    ],
    deliveryForecast: {
      committedUnits: 12,
      committedNotes: "8 Cascadia units for XYZ Transport, ABC Logistics (delivery confirmed). 4 Actros units for established customers with firm delivery dates.",
      potentialUpside: 6,
      upsideNotes: "3 units from Sunrise Construction pending final approval. 3 units from Delta Distribution if budget is approved early."
    }
  },
  {
    id: "2",
    weekEnding: "2025-09-26",
    bdmName: "John Smith",
    createdAt: "2025-09-26T17:15:00",
    visitations: [
      {
        id: "v4",
        dateOfVisit: "2025-09-23",
        dealership: "Premier Trucks Inc",
        location: "Atlanta, GA",
        customerName: "FastTrack Shipping",
        contact: "Tom Anderson - COO",
        industryApplication: "Express Freight",
        brand: "Freightliner",
        truckModel: "Cascadia",
        competitor: "Peterbilt 579",
        potentialDealSize: 580000,
        potentialDecisionDate: "2025-10-30",
        notes: "Interested in upgrading 6 units. Strong relationship, high conversion probability."
      },
      {
        id: "v5",
        dateOfVisit: "2025-09-25",
        dealership: "Southern Truck Center",
        location: "Birmingham, AL",
        customerName: "BuildRight Materials",
        contact: "Lisa Taylor - Fleet Supervisor",
        industryApplication: "Building Materials",
        brand: "Mercedes-Benz",
        truckModel: "Arocs",
        competitor: "Volvo FMX",
        potentialDealSize: 275000,
        potentialDecisionDate: "2025-11-10",
        notes: "New customer. Very impressed with Arocs capabilities for rough terrain."
      }
    ],
    orders: [
      {
        id: "o3",
        dateOfOrder: "2025-09-24",
        dealership: "Metro Commercial Vehicles",
        location: "Charlotte, NC",
        customerName: "Mountain Express",
        contact: "Chris Wilson - Fleet Manager",
        industryApplication: "Long Haul",
        brand: "Freightliner",
        truckModel: "Cascadia",
        unitsOrdered: 3,
        dtfs: true,
        servicePlan: true,
        competitor: "Kenworth T680",
        notes: "Repeat customer. DTFS financing approved. Delivery in November."
      }
    ],
    deliveryForecast: {
      committedUnits: 8,
      committedNotes: "3 Cascadia units for Mountain Express. 5 various models for ongoing customer commitments with confirmed delivery slots.",
      potentialUpside: 8,
      upsideNotes: "6 units from FastTrack Shipping if decision comes early. 2 units from BuildRight Materials showing strong interest."
    }
  },
  {
    id: "3",
    weekEnding: "2025-09-19",
    bdmName: "John Smith",
    createdAt: "2025-09-19T16:45:00",
    visitations: [
      {
        id: "v6",
        dateOfVisit: "2025-09-16",
        dealership: "Premier Trucks Inc",
        location: "Atlanta, GA",
        customerName: "Global Freight Solutions",
        contact: "Amanda White - VP Fleet",
        industryApplication: "International Freight",
        brand: "Freightliner",
        truckModel: "Cascadia",
        competitor: "Volvo VNL",
        potentialDealSize: 1200000,
        potentialDecisionDate: "2025-12-01",
        notes: "Major fleet expansion opportunity. 12 unit potential. Needs board approval."
      }
    ],
    orders: [
      {
        id: "o4",
        dateOfOrder: "2025-09-17",
        dealership: "Southern Truck Center",
        location: "Birmingham, AL",
        customerName: "Coastal Logistics",
        contact: "Kevin Moore - Owner",
        industryApplication: "Regional Distribution",
        brand: "Mercedes-Benz",
        truckModel: "Actros",
        unitsOrdered: 4,
        dtfs: true,
        servicePlan: false,
        competitor: "Mack Anthem",
        notes: "DTFS financing. No service plan. Customer handles maintenance in-house."
      }
    ],
    deliveryForecast: {
      committedUnits: 10,
      committedNotes: "4 Actros for Coastal Logistics. 6 mixed units for various customers with confirmed delivery dates in October.",
      potentialUpside: 4,
      upsideNotes: "4 units from smaller opportunities in pipeline. Moderate confidence level."
    }
  }
];

// Chart data derived from reports
export const getChartData = () => {
  return mockReports.map(report => ({
    week: report.weekEnding,
    meetings: report.visitations.length,
    orders: report.orders.reduce((sum, order) => sum + order.unitsOrdered, 0),
    forecast: report.deliveryForecast.committedUnits + report.deliveryForecast.potentialUpside
  })).reverse();
};
