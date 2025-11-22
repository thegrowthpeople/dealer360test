import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Plus, LayoutGrid, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useCompanies } from "@/hooks/useCompanies";
import { Company } from "@/types/company";
import { CompanyFilters } from "@/components/companies/CompanyFilters";
import { CompanyTile } from "@/components/companies/CompanyTile";
import { CompanyTable } from "@/components/companies/CompanyTable";
import { CompanyHeader } from "@/components/companies/CompanyHeader";
import { AboutSection } from "@/components/companies/AboutSection";
import { FleetSection } from "@/components/companies/FleetSection";
import { StakeholdersSection } from "@/components/companies/StakeholdersSection";
import { NewCompanyDialog } from "@/components/companies/NewCompanyDialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { format } from "date-fns";
import { User, Building, Calendar, DollarSign } from "lucide-react";

export default function Companies() {
  const location = useLocation();
  const { companies, createCompany, updateCompany, deleteCompany, filterCompanies } = useCompanies();
  
  const [viewMode, setViewMode] = useState<'tile' | 'table'>('tile');
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [showNewCompanyDialog, setShowNewCompanyDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  
  // Filters
  const [selectedBdmId, setSelectedBdmId] = useState<number | null>(null);
  const [selectedDealerGroup, setSelectedDealerGroup] = useState<string>('');
  const [selectedDealershipId, setSelectedDealershipId] = useState<number | null>(null);
  const [selectedType, setSelectedType] = useState<string>('');
  const [selectedSegment, setSelectedSegment] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');

  const filteredCompanies = filterCompanies({
    bdmId: selectedBdmId,
    dealerGroup: selectedDealerGroup,
    dealershipId: selectedDealershipId,
    type: selectedType,
    segment: selectedSegment,
    status: selectedStatus
  });

  const hasActiveFilters = Boolean(
    selectedBdmId || selectedDealerGroup || selectedDealershipId || 
    selectedType || selectedSegment || selectedStatus
  );

  const handleClearFilters = () => {
    setSelectedBdmId(null);
    setSelectedDealerGroup('');
    setSelectedDealershipId(null);
    setSelectedType('');
    setSelectedSegment('');
    setSelectedStatus('');
  };

  const handleCompanyClick = (company: Company) => {
    setSelectedCompany(company);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCloseCompany = () => {
    setSelectedCompany(null);
  };

  const handleEditCompany = () => {
    toast.info('Edit functionality coming soon');
  };

  const handleDeleteCompany = () => {
    setShowDeleteDialog(true);
  };

  const confirmDelete = () => {
    if (selectedCompany) {
      deleteCompany(selectedCompany.id);
      toast.success('Company deleted successfully');
      setSelectedCompany(null);
      setShowDeleteDialog(false);
    }
  };

  const handleCreateCompany = (companyData: Omit<Company, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>) => {
    createCompany(companyData);
  };

  // Close company detail when navigating
  useEffect(() => {
    setSelectedCompany(null);
  }, [location.pathname]);

  if (selectedCompany) {
    return (
      <div className="min-h-screen bg-background">
        <CompanyHeader
          company={selectedCompany}
          onClose={handleCloseCompany}
          onEdit={handleEditCompany}
          onDelete={handleDeleteCompany}
        />

        <div className="container mx-auto p-6 space-y-6">
          {/* Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
            <Card>
              <CardContent className="p-4 space-y-3">
                <h3 className="text-sm font-medium text-muted-foreground">Account Information</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Building className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">{selectedCompany.dealershipName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Building className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">{selectedCompany.dealerGroup}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">{selectedCompany.accountManagerName}</span>
                  </div>
                  {selectedCompany.lastContactDate && (
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">
                        Last Contact: {format(new Date(selectedCompany.lastContactDate), 'EEE d MMM')}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 space-y-3">
                <h3 className="text-sm font-medium text-muted-foreground">Company Value</h3>
                <div className="space-y-2">
                  {selectedCompany.estimatedValue && (
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium">
                        ${selectedCompany.estimatedValue.toLocaleString()}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <span className="text-sm">Status: {selectedCompany.status}</span>
                  </div>
                  {selectedCompany.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {selectedCompany.tags.map(tag => (
                        <span key={tag} className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Sections */}
          <div className="space-y-4">
            <div className="animate-fade-in" style={{ animationDelay: '100ms' }}>
              <AboutSection company={selectedCompany} />
            </div>
            
            <div className="animate-fade-in" style={{ animationDelay: '200ms' }}>
              <FleetSection company={selectedCompany} />
            </div>
            
            <div className="animate-fade-in" style={{ animationDelay: '300ms' }}>
              <StakeholdersSection company={selectedCompany} />
            </div>
          </div>
        </div>

        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Company</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete {selectedCompany.accountName}? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="animate-fade-in">
        <h1 className="text-3xl font-bold text-foreground mb-2">Companies</h1>
        <p className="text-muted-foreground">Manage customer accounts and track relationships</p>
      </div>

      {/* Filters and Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <CompanyFilters
          selectedBdmId={selectedBdmId}
          selectedDealerGroup={selectedDealerGroup}
          selectedDealershipId={selectedDealershipId}
          selectedType={selectedType}
          selectedSegment={selectedSegment}
          selectedStatus={selectedStatus}
          onBdmChange={setSelectedBdmId}
          onDealerGroupChange={setSelectedDealerGroup}
          onDealershipChange={setSelectedDealershipId}
          onTypeChange={setSelectedType}
          onSegmentChange={setSelectedSegment}
          onStatusChange={setSelectedStatus}
          onClearFilters={handleClearFilters}
          hasActiveFilters={hasActiveFilters}
        />

        <div className="flex items-center gap-2">
          <div className="flex border rounded-md">
            <Button
              variant={viewMode === 'tile' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('tile')}
              className="rounded-r-none"
            >
              <LayoutGrid className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'table' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('table')}
              className="rounded-l-none"
            >
              <List className="w-4 h-4" />
            </Button>
          </div>

          <Button onClick={() => setShowNewCompanyDialog(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            New Company
          </Button>
        </div>
      </div>

      {/* Content */}
      {filteredCompanies.length === 0 ? (
        <Card className="p-12 text-center animate-fade-in">
          <Building className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="text-lg font-semibold mb-2">No companies found</h3>
          <p className="text-muted-foreground mb-4">
            {hasActiveFilters 
              ? 'No companies match your current filters'
              : 'Get started by adding your first company'}
          </p>
          {hasActiveFilters ? (
            <Button variant="outline" onClick={handleClearFilters}>Clear Filters</Button>
          ) : (
            <Button onClick={() => setShowNewCompanyDialog(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              Add Your First Company
            </Button>
          )}
        </Card>
      ) : viewMode === 'tile' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCompanies.map((company, index) => (
            <div key={company.id} style={{ animationDelay: `${index * 50}ms` }}>
              <CompanyTile company={company} onClick={handleCompanyClick} />
            </div>
          ))}
        </div>
      ) : (
        <CompanyTable companies={filteredCompanies} onCompanyClick={handleCompanyClick} />
      )}

      <NewCompanyDialog
        open={showNewCompanyDialog}
        onOpenChange={setShowNewCompanyDialog}
        onSave={handleCreateCompany}
      />
    </div>
  );
}
