import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Plus, FileText, Calendar, GitCompare, Clock, ArrowUp, ArrowDown, Copy, Trash2, Download, Archive, CheckSquare, FileSpreadsheet, LayoutGrid, List, Star, Tag, X, Edit2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScorecardForm } from "@/components/qualification/ScorecardForm";
import { ScoreHeader } from "@/components/qualification/ScoreHeader";
import { FAINTSection } from "@/components/qualification/FAINTSection";
import { ScorecardComparison } from "@/components/qualification/ScorecardComparison";
import { ScorecardTimeline } from "@/components/qualification/ScorecardTimeline";
import { ScorecardFilters, FilterState } from "@/components/qualification/ScorecardFilters";
import { StatsSummary } from "@/components/qualification/StatsSummary";
import { ConfidenceIndicator } from "@/components/qualification/ConfidenceIndicator";
import { Scorecard, QuestionState } from "@/types/scorecard";
import { DatabaseScorecard } from "@/types/qualificationScorecard";
import { toast } from "sonner";
import { useScorecards } from "@/hooks/useScorecards";
import { useAuth } from "@/contexts/AuthContext";
import { useFrameworks } from "@/hooks/useFrameworks";
import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const createEmptyScorecard = (data: Partial<Scorecard>): Scorecard => {
  const createEmptyQuestions = () => Array(8).fill(null).map(() => ({
    state: "blank" as const,
    note: "",
  }));

  return {
      id: Date.now().toString(),
      version: 1,
      accountManager: data.accountManager || "",
      customerName: data.customerName || "",
    opportunityName: data.opportunityName || "",
    expectedOrderDate: data.expectedOrderDate || "",
    reviewDate: data.reviewDate || "",
    createdAt: new Date().toISOString(),
    funds: { questions: createEmptyQuestions() },
    authority: { questions: createEmptyQuestions() },
    interest: { questions: createEmptyQuestions() },
    need: { questions: createEmptyQuestions() },
    timing: { questions: createEmptyQuestions() },
  };
};

// Helper to convert DatabaseScorecard to Scorecard format  
const convertToScorecard = (db: DatabaseScorecard): Scorecard => ({
  id: db.id,
  version: db.version,
  accountManager: db.account_manager,
  customerName: db.customer_name,
  opportunityName: db.opportunity_name,
  expectedOrderDate: db.expected_order_date || "",
  reviewDate: db.review_date,
  createdAt: db.created_at,
  archived: db.archived,
  pinned: db.pinned,
  tags: db.tags,
  frameworkId: db.framework_id,
  funds: db.funds,
  authority: db.authority,
  interest: db.interest,
  need: db.need,
  timing: db.timing,
});

// Helper to convert Scorecard to database format
const convertToDatabase = (scorecard: Scorecard, bdmId: number | null, frameworkId: string) => ({
  account_manager: scorecard.accountManager,
  customer_name: scorecard.customerName,
  opportunity_name: scorecard.opportunityName,
  expected_order_date: scorecard.expectedOrderDate || null,
  review_date: scorecard.reviewDate,
  bdm_id: bdmId,
  framework_id: frameworkId,
  funds: scorecard.funds,
  authority: scorecard.authority,
  interest: scorecard.interest,
  need: scorecard.need,
  timing: scorecard.timing,
  tags: scorecard.tags || [],
});

const Index = () => {
  const { bdmId } = useAuth();
  const { 
    scorecards: dbScorecards, 
    isLoading, 
    createScorecard: createScorecardMutation, 
    updateScorecard: updateScorecardMutation, 
    deleteScorecard,
    duplicateScorecard: duplicateScorecardMutation,
    togglePin 
  } = useScorecards();
  const { frameworks, defaultFramework, isLoading: isLoadingFrameworks } = useFrameworks();
  
  // Helper to get framework name by ID
  const getFrameworkName = (frameworkId?: string) => {
    if (!frameworkId) return "Unknown";
    const framework = frameworks.find(f => f.id === frameworkId);
    return framework?.name || "Unknown";
  };
  
  // Convert database scorecards to UI format
  const scorecards = dbScorecards?.map(convertToScorecard) || [];
  const [activeScorecard, setActiveScorecard] = useState<Scorecard | null>(null);
  const [originalScorecard, setOriginalScorecard] = useState<Scorecard | null>(null);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);
  const [hasCreatedVersionForEdit, setHasCreatedVersionForEdit] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [timelineView, setTimelineView] = useState<string | null>(null); // stores opportunityName for timeline
  const [viewAllVersionsFor, setViewAllVersionsFor] = useState<string | null>(null); // stores "opportunityName_customerName" key
  const [filters, setFilters] = useState<FilterState>({
    version: "latest",
    showArchived: false,
    tags: [],
    dateFrom: undefined,
    dateTo: undefined,
    accountManager: null,
    customer: null,
  });
  const [sortBy, setSortBy] = useState<"date" | "score" | "accountManager" | "customer">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  
  
  const [duplicateDialogOpen, setDuplicateDialogOpen] = useState(false);
  const [scorecardToDuplicate, setScorecardToDuplicate] = useState<Scorecard | null>(null);
  const [viewMode, setViewMode] = useState<"tiles" | "table">("tiles");
  const [editingTag, setEditingTag] = useState<string | null>(null);
  const [newTagName, setNewTagName] = useState("");

  // Tag color mapping based on keywords
  const getTagColor = (tag: string): string => {
    const tagLower = tag.toLowerCase();
    
    // Priority levels
    if (tagLower.includes("high") || tagLower.includes("urgent") || tagLower.includes("hot")) {
      return "destructive";
    }
    if (tagLower.includes("medium") || tagLower.includes("warm")) {
      return "default";
    }
    if (tagLower.includes("low") || tagLower.includes("cold")) {
      return "secondary";
    }
    
    // Deal types
    if (tagLower.includes("enterprise") || tagLower.includes("large")) {
      return "default";
    }
    if (tagLower.includes("smb") || tagLower.includes("small")) {
      return "outline";
    }
    
    // Status
    if (tagLower.includes("won") || tagLower.includes("closed") || tagLower.includes("success")) {
      return "default";
    }
    if (tagLower.includes("lost") || tagLower.includes("rejected")) {
      return "destructive";
    }
    
    // Default
    return "secondary";
  };

  const getScoreColorClass = (score: number): string => {
    if (score < 15) {
      return "border-red-500 bg-red-500/5";
    }
    if (score >= 15 && score <= 30) {
      return "border-orange-500 bg-orange-500/5";
    }
    return "border-green-500 bg-green-500/5";
  };

  const handleCreateScorecard = async (data: Partial<Scorecard> & { frameworkId?: string }) => {
    const frameworkId = data.frameworkId || defaultFramework?.id;
    
    if (!frameworkId) {
      toast.error("Please select a qualification framework");
      return;
    }
    
    const newScorecard = createEmptyScorecard(data);
    setIsDialogOpen(false);
    
    try {
      const created = await createScorecardMutation(convertToDatabase(newScorecard, bdmId, frameworkId));
      const converted = convertToScorecard(created);
      setActiveScorecard(converted);
      setOriginalScorecard(JSON.parse(JSON.stringify(converted)));
      setHasCreatedVersionForEdit(true);
      toast.success("Scorecard created successfully!");
    } catch (error) {
      console.error('Failed to create scorecard:', error);
      toast.error("Failed to create scorecard");
    }
  };

  const handleUpdateComponent = async (
    component: keyof Pick<Scorecard, "funds" | "authority" | "interest" | "need" | "timing">,
    index: number,
    state: any,
    note: string
  ) => {
    if (!activeScorecard) return;

    // If this is the first edit on an existing scorecard, create a new version
    if (!hasCreatedVersionForEdit) {
      try {
        const dbScorecard = dbScorecards.find(s => s.id === activeScorecard.id);
        if (!dbScorecard) return;
        
        const created = await duplicateScorecardMutation(dbScorecard);
        const newVersion = convertToScorecard(created);
        
        // Apply the change to the new version
        newVersion[component].questions[index] = { state, note };
        
        setActiveScorecard(newVersion);
        setOriginalScorecard(JSON.parse(JSON.stringify(newVersion)));
        setHasCreatedVersionForEdit(true);
        
        // Update in database
        await updateScorecardMutation({
          id: newVersion.id,
          [component]: newVersion[component],
        });
        
        toast.success(`Version ${newVersion.version} created from changes!`);
      } catch (error) {
        console.error('Failed to create new version:', error);
        toast.error("Failed to create new version");
      }
      return;
    }

    // Otherwise, update the current (already versioned) scorecard
    const updatedScorecard = { ...activeScorecard };
    updatedScorecard[component].questions[index] = { state, note };
    
    setActiveScorecard(updatedScorecard);
  };

  const handleNewVersion = async () => {
    if (!activeScorecard) return;
    
    try {
      const dbScorecard = dbScorecards.find(s => s.id === activeScorecard.id);
      if (!dbScorecard) return;
      
      const created = await duplicateScorecardMutation(dbScorecard);
      const newVersion = convertToScorecard(created);
      
      setActiveScorecard(newVersion);
      setOriginalScorecard(JSON.parse(JSON.stringify(newVersion)));
      setHasCreatedVersionForEdit(true);
      toast.success(`Version ${newVersion.version} created!`);
    } catch (error) {
      console.error('Failed to create new version:', error);
      toast.error("Failed to create new version");
    }
  };

  const hasUnsavedChanges = () => {
    if (!activeScorecard || !originalScorecard) return false;
    return JSON.stringify(activeScorecard) !== JSON.stringify(originalScorecard);
  };

  const handleBackClick = () => {
    if (hasUnsavedChanges()) {
      setShowUnsavedDialog(true);
    } else {
      setActiveScorecard(null);
      setOriginalScorecard(null);
      setHasCreatedVersionForEdit(false);
    }
  };

  const handleSaveAndClose = async () => {
    if (!activeScorecard || !defaultFramework) return;
    
    try {
      // Save current changes to database
      await updateScorecardMutation({
        id: activeScorecard.id,
        ...convertToDatabase(activeScorecard, bdmId, defaultFramework.id),
      });
      
      setShowUnsavedDialog(false);
      setActiveScorecard(null);
      setOriginalScorecard(null);
      setHasCreatedVersionForEdit(false);
      if (pendingNavigation) {
        navigate(pendingNavigation);
        setPendingNavigation(null);
      }
      toast.success("Changes saved successfully!");
    } catch (error) {
      console.error('Failed to save changes:', error);
      toast.error("Failed to save changes");
    }
  };

  const handleDiscardAndClose = async () => {
    if (originalScorecard && hasCreatedVersionForEdit && activeScorecard) {
      // Remove the auto-created version if user discards
      try {
        await deleteScorecard(activeScorecard.id);
      } catch (error) {
        console.error('Failed to delete auto-created version:', error);
      }
    }
    setShowUnsavedDialog(false);
    setActiveScorecard(null);
    setOriginalScorecard(null);
    setHasCreatedVersionForEdit(false);
    if (pendingNavigation) {
      navigate(pendingNavigation);
      setPendingNavigation(null);
    }
  };

  const handleCancelDialog = () => {
    // Just close the dialog and stay on the current screen
    setShowUnsavedDialog(false);
    setPendingNavigation(null);
  };

  // Warn when closing browser tab/window with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (activeScorecard && hasUnsavedChanges()) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [activeScorecard, originalScorecard]);

  // Intercept navigation within the app using click handler on sidebar
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const link = target.closest('a[href]');
      
      if (link && activeScorecard && hasUnsavedChanges()) {
        const href = link.getAttribute('href');
        if (href && !href.startsWith('#') && href !== location.pathname) {
          e.preventDefault();
          e.stopPropagation();
          setPendingNavigation(href);
          setShowUnsavedDialog(true);
        }
      }
    };

    document.addEventListener('click', handleClick, true);
    return () => document.removeEventListener('click', handleClick, true);
  }, [activeScorecard, originalScorecard, location]);




  const handleUnarchive = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await updateScorecardMutation({
        id,
        archived: false,
      });
      toast.success("Scorecard unarchived");
    } catch (error) {
      console.error('Failed to unarchive:', error);
      toast.error("Failed to unarchive scorecard");
    }
  };

  const handleTogglePin = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const scorecard = scorecards.find(s => s.id === id);
    if (!scorecard) return;
    
    try {
      await togglePin({ id, pinned: !scorecard.pinned });
      toast.success(scorecard.pinned ? "Scorecard unpinned" : "Scorecard pinned");
    } catch (error) {
      console.error('Failed to toggle pin:', error);
      toast.error("Failed to update pin status");
    }
  };

  const handleAddTag = async (id: string, tag: string) => {
    if (!tag.trim()) return;
    const scorecard = scorecards.find(s => s.id === id);
    if (!scorecard) return;
    
    try {
      await updateScorecardMutation({
        id,
        tags: [...(scorecard.tags || []), tag.trim()],
      });
      toast.success("Tag added");
    } catch (error) {
      console.error('Failed to add tag:', error);
      toast.error("Failed to add tag");
    }
  };

  const handleRemoveTag = async (id: string, tagToRemove: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const scorecard = scorecards.find(s => s.id === id);
    if (!scorecard) return;
    
    try {
      await updateScorecardMutation({
        id,
        tags: (scorecard.tags || []).filter(t => t !== tagToRemove),
      });
      toast.success("Tag removed");
    } catch (error) {
      console.error('Failed to remove tag:', error);
      toast.error("Failed to remove tag");
    }
  };

  const handleRenameTag = async (oldTag: string, newTag: string) => {
    if (!newTag.trim() || oldTag === newTag) {
      setEditingTag(null);
      setNewTagName("");
      return;
    }

    try {
      // Update all scorecards that have this tag
      const updatePromises = scorecards
        .filter(card => card.tags?.includes(oldTag))
        .map(card => updateScorecardMutation({
          id: card.id,
          tags: card.tags?.map(t => t === oldTag ? newTag.trim() : t)
        }));
      
      await Promise.all(updatePromises);

      setFilters(prevFilters => ({
        ...prevFilters,
        tags: prevFilters.tags.map(t => t === oldTag ? newTag.trim() : t)
      }));

      setEditingTag(null);
      setNewTagName("");
      toast.success(`Tag renamed from "${oldTag}" to "${newTag}"`);
    } catch (error) {
      console.error('Failed to rename tag:', error);
      toast.error("Failed to rename tag");
    }
  };


  const handleDuplicate = (scorecard: Scorecard) => {
    setScorecardToDuplicate(scorecard);
    setDuplicateDialogOpen(true);
  };

  const handleDuplicateSubmit = async (data: Partial<Scorecard>) => {
    if (!scorecardToDuplicate) return;
    
    try {
      const dbScorecard = dbScorecards.find(s => s.id === scorecardToDuplicate.id);
      if (!dbScorecard) return;
      
      const created = await duplicateScorecardMutation(dbScorecard);
      const converted = convertToScorecard(created);
      
      // Update with custom data if provided
      if (data.accountManager || data.customerName || data.opportunityName || 
          data.expectedOrderDate || data.reviewDate) {
        await updateScorecardMutation({
          id: converted.id,
          account_manager: data.accountManager || converted.accountManager,
          customer_name: data.customerName || converted.customerName,
          opportunity_name: data.opportunityName || converted.opportunityName,
          expected_order_date: data.expectedOrderDate || converted.expectedOrderDate || null,
          review_date: data.reviewDate || converted.reviewDate,
        });
      }
      
      setDuplicateDialogOpen(false);
      setScorecardToDuplicate(null);
      toast.success("Scorecard duplicated successfully!");
    } catch (error) {
      console.error('Failed to duplicate scorecard:', error);
      toast.error("Failed to duplicate scorecard");
    }
  };

  const handleScorecardSelect = (id: string) => {
    const scorecard = scorecards.find(s => s.id === id) || null;
    setActiveScorecard(scorecard);
    setOriginalScorecard(scorecard ? JSON.parse(JSON.stringify(scorecard)) : null);
    setHasCreatedVersionForEdit(false); // Reset flag when opening a scorecard
  };


  // Get timeline scorecards (all versions of the same opportunity)
  const timelineScorecards = timelineView
    ? scorecards.filter(s => 
        s.opportunityName === timelineView && 
        s.customerName === scorecards.find(sc => sc.opportunityName === timelineView)?.customerName
      )
    : null;

  // Apply filters to scorecards
  let filteredScorecards = scorecards.filter((scorecard) => {
    // Filter archived scorecards based on showArchived setting
    if (!filters.showArchived && scorecard.archived) {
      return false;
    }

    // Account Manager filter
    if (filters.accountManager && scorecard.accountManager !== filters.accountManager) {
      return false;
    }

    // Customer filter
    if (filters.customer && scorecard.customerName !== filters.customer) {
      return false;
    }

    // Tags filter
    if (filters.tags.length > 0) {
      const scorecardTags = scorecard.tags || [];
      const hasMatchingTag = filters.tags.some(filterTag => scorecardTags.includes(filterTag));
      if (!hasMatchingTag) {
        return false;
      }
    }

    // Date from filter
    if (filters.dateFrom) {
      const scorecardDate = new Date(scorecard.createdAt);
      if (scorecardDate < filters.dateFrom) {
        return false;
      }
    }

    // Date to filter
    if (filters.dateTo) {
      const scorecardDate = new Date(scorecard.createdAt);
      // Set time to end of day for dateTo
      const dateToEnd = new Date(filters.dateTo);
      dateToEnd.setHours(23, 59, 59, 999);
      if (scorecardDate > dateToEnd) {
        return false;
      }
    }

    return true;
  });

  // If viewing all versions for a specific opportunity, filter to that
  if (viewAllVersionsFor) {
    const [oppName, custName] = viewAllVersionsFor.split('_');
    filteredScorecards = filteredScorecards.filter(
      (scorecard) => scorecard.opportunityName === oppName && scorecard.customerName === custName
    );
  } else {
    // Version filter - handle "latest" specially (only when not viewing all versions of specific opportunity)
    if (filters.version === "latest") {
      // Group by opportunity and customer, then keep only the highest version
      const latestVersions = new Map<string, Scorecard>();
      filteredScorecards.forEach((scorecard) => {
        const key = `${scorecard.opportunityName}_${scorecard.customerName}`;
        const existing = latestVersions.get(key);
        if (!existing || scorecard.version > existing.version) {
          latestVersions.set(key, scorecard);
        }
      });
      filteredScorecards = Array.from(latestVersions.values());
    } else if (filters.version && filters.version !== "all") {
      // Specific version filter
      filteredScorecards = filteredScorecards.filter(
        (scorecard) => scorecard.version.toString() === filters.version
      );
    }
  }

  // Get unique values for filter options
  const uniqueVersions = Array.from(new Set(scorecards.map(s => s.version)));
  const availableTags = Array.from(new Set(scorecards.flatMap(s => s.tags || []))).sort();
  const uniqueAccountManagers = Array.from(new Set(scorecards.map(s => s.accountManager).filter(Boolean))).sort();
  const uniqueCustomers = Array.from(new Set(scorecards.map(s => s.customerName).filter(Boolean))).sort();

  // Calculate scores for sorting
  const scorecardsWithScores = filteredScorecards.map(scorecard => ({
    ...scorecard,
    totalScore: [
      scorecard.funds,
      scorecard.authority,
      scorecard.interest,
      scorecard.need,
      scorecard.timing,
    ].reduce((sum, component) => sum + component.questions.filter((q) => q.state === "positive").length, 0)
  }));

  // Apply sorting
  const sortedScorecards = [...scorecardsWithScores].sort((a, b) => {
    // Always show pinned scorecards first
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    
    let comparison = 0;
    
    switch (sortBy) {
      case "date":
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        break;
      case "score":
        comparison = a.totalScore - b.totalScore;
        break;
      case "accountManager":
        comparison = a.accountManager.localeCompare(b.accountManager);
        break;
      case "customer":
        comparison = a.customerName.localeCompare(b.customerName);
        break;
    }
    
    return sortOrder === "asc" ? comparison : -comparison;
  });

  // Group scorecards by opportunity for timeline view
  const opportunityGroups = sortedScorecards.reduce((acc, scorecard) => {
    const key = `${scorecard.opportunityName}_${scorecard.customerName}`;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(scorecard);
    return acc;
  }, {} as Record<string, Scorecard[]>);

  const toggleSortOrder = () => {
    setSortOrder(sortOrder === "asc" ? "desc" : "asc");
  };

  // Loading and framework checks
  if (isLoading || isLoadingFrameworks) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!defaultFramework) {
    return (
      <div className="h-screen flex items-center justify-center">
        <p className="text-muted-foreground">No qualification framework available</p>
      </div>
    );
  }

  // Get questions from framework dynamically
  const frameworkQuestions = {
    funds: defaultFramework.structure.categories.find(c => c.name === 'funds')?.questions || [],
    authority: defaultFramework.structure.categories.find(c => c.name === 'authority')?.questions || [],
    interest: defaultFramework.structure.categories.find(c => c.name === 'interest')?.questions || [],
    need: defaultFramework.structure.categories.find(c => c.name === 'need')?.questions || [],
    timing: defaultFramework.structure.categories.find(c => c.name === 'timing')?.questions || [],
  };

  return (
    <div className="min-h-screen space-y-6">
        <div className="flex items-center justify-between">
          <div>
          <h1 className="text-4xl xl:text-5xl font-bold text-foreground mb-4">
            {activeScorecard ? "Qualification Scorecard" : "Qualification Scorecards"}
          </h1>
          <p className="text-muted-foreground">
            {activeScorecard 
              ? "Indication of confidence to win based on activity and findings."
              : "Track and manage qualification and activity for sales opportunities"
            }
          </p>
          </div>
          {!activeScorecard && (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button size="lg" className="gap-2">
                  <Plus className="w-5 h-5" />
                  New Scorecard
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create New Scorecard</DialogTitle>
                </DialogHeader>
                <ScorecardForm onSubmit={handleCreateScorecard} />
              </DialogContent>
            </Dialog>
          )}
        </div>

        <Separator className="my-6" />

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <>

      <Dialog open={duplicateDialogOpen} onOpenChange={setDuplicateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Duplicate Scorecard</DialogTitle>
          </DialogHeader>
          {scorecardToDuplicate && (
            <ScorecardForm 
              onSubmit={handleDuplicateSubmit}
              submitLabel="Duplicate Scorecard"
              initialData={{
                accountManager: scorecardToDuplicate.accountManager,
                customerName: scorecardToDuplicate.customerName,
                opportunityName: `${scorecardToDuplicate.opportunityName} (Copy)`,
                expectedOrderDate: scorecardToDuplicate.expectedOrderDate,
                reviewDate: new Date().toISOString().split('T')[0],
              }}
            />
          )}
        </DialogContent>
      </Dialog>

        {!activeScorecard && !timelineScorecards && (
          <>
            {viewAllVersionsFor && (
              <div className="mb-6">
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setViewAllVersionsFor(null)}
                  >
                    ← Back to All
                  </Button>
                  <h2 className="text-xl font-semibold text-foreground">
                    All Versions - {scorecards.find(s => `${s.opportunityName}_${s.customerName}` === viewAllVersionsFor)?.opportunityName}
                  </h2>
                </div>
              </div>
            )}

            {!timelineView && !viewAllVersionsFor && (
              <ScorecardFilters
                filters={filters}
                onFiltersChange={(newFilters) => {
                  setFilters(newFilters);
                  setViewAllVersionsFor(null); // Clear version view when filters change
                }}
                versions={uniqueVersions}
                availableTags={availableTags}
                accountManagers={uniqueAccountManagers}
                customers={uniqueCustomers}
                onTagRename={(tag) => {
                  setEditingTag(tag);
                  setNewTagName(tag);
                }}
              />
            )}
            
            {sortedScorecards.length > 0 && (
              <div className="flex items-center justify-between gap-3 mb-4 mt-4">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-muted-foreground">Sort by:</span>
                  <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="date">Date</SelectItem>
                      <SelectItem value="score">Score</SelectItem>
                      <SelectItem value="accountManager">Account Manager</SelectItem>
                      <SelectItem value="customer">Customer Name</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={toggleSortOrder}
                    className="gap-2"
                  >
                    {sortOrder === "asc" ? (
                      <ArrowUp className="w-4 h-4" />
                    ) : (
                      <ArrowDown className="w-4 h-4" />
                    )}
                  </Button>
                </div>
                
                <ToggleGroup type="single" value={viewMode} onValueChange={(value) => value && setViewMode(value as "tiles" | "table")}>
                  <ToggleGroupItem value="tiles" aria-label="Tile view">
                    <LayoutGrid className="h-4 w-4" />
                  </ToggleGroupItem>
                  <ToggleGroupItem value="table" aria-label="Table view">
                    <List className="h-4 w-4" />
                  </ToggleGroupItem>
                </ToggleGroup>
              </div>
            )}
            

            {sortedScorecards.length === 0 ? (
              <Card className="p-12 text-center">
                <p className="text-lg text-muted-foreground mb-4">No scorecards match your filters</p>
                <Button variant="outline" onClick={() => setFilters({ version: "latest", showArchived: false, tags: [], dateFrom: undefined, dateTo: undefined, accountManager: null, customer: null })}>
                  Clear Filters
                </Button>
              </Card>
            ) : (
              <>
                {viewMode === "tiles" ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {sortedScorecards.map((scorecard) => {
                    const opportunityKey = `${scorecard.opportunityName}_${scorecard.customerName}`;
                    const versionsForOpportunity = opportunityGroups[opportunityKey] || [];
                    const maxVersion = Math.max(...versionsForOpportunity.map(s => s.version));
                    const isLatestVersion = scorecard.version === maxVersion;
                    
                    return (
                      <Card
                        key={scorecard.id}
                        className={`relative cursor-pointer hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 border ${
                          "hover:border-primary/50"
                        } ${scorecard.archived ? "opacity-60" : ""}`}
                        onClick={() => handleScorecardSelect(scorecard.id)}
                      >
                        <div className="absolute top-3 right-3 flex gap-2">
                          <>
                            <Popover>
                                <PopoverTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <Tag className="h-4 w-4" />
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-56 bg-background border border-border shadow-lg z-50" align="start">
                                  <div className="space-y-2">
                                    <Label className="text-sm font-medium">New Tag</Label>
                                    <Input
                                      placeholder="Enter tag name..."
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                          handleAddTag(scorecard.id, e.currentTarget.value);
                                          e.currentTarget.value = '';
                                        }
                                      }}
                                    />
                                  </div>
                                </PopoverContent>
                              </Popover>
                              {!scorecard.archived && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDuplicate(scorecard);
                                  }}
                                >
                                  <Copy className="h-4 w-4" />
                                </Button>
                              )}
                            </>
                          </div>
                          <div className="absolute top-3 right-3 flex gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={(e) => handleTogglePin(scorecard.id, e)}
                          >
                            <Star className={`h-4 w-4 ${scorecard.pinned ? "fill-yellow-500 text-yellow-500" : ""}`} />
                          </Button>
                          {scorecard.archived && (
                            <Badge variant="secondary">Archived</Badge>
                          )}
                          <Badge 
                            variant="outline"
                            className="bg-primary/10 border-primary/30 text-primary"
                          >
                            {getFrameworkName(scorecard.frameworkId)}
                          </Badge>
                          <Badge 
                            variant={isLatestVersion ? "default" : "secondary"}
                            className={isLatestVersion ? "bg-green-600 hover:bg-green-700" : ""}
                          >
                            v{scorecard.version}{isLatestVersion ? " - Latest" : ""}
                          </Badge>
                        </div>
                        <CardHeader className="pb-3 pt-12">
                          <CardTitle className="text-xl flex items-center justify-between">
                            {scorecard.opportunityName}
                            <div className="text-right">
                              <div className="text-2xl font-bold text-primary">{scorecard.totalScore}/40</div>
                              {(() => {
                                const totalNegative = [
                                  scorecard.funds,
                                  scorecard.authority,
                                  scorecard.interest,
                                  scorecard.need,
                                  scorecard.timing,
                                ].reduce((sum, component) => sum + component.questions.filter(q => q.state === "negative").length, 0);
                                return totalNegative > 0 && (
                                  <div className="text-xs text-destructive mt-1">
                                    -{totalNegative}
                                  </div>
                                );
                              })()}
                            </div>
                          </CardTitle>
                          <p className="text-sm text-muted-foreground font-medium">{scorecard.customerName}</p>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Calendar className="w-4 h-4" />
                              <span className="font-medium">Expected:</span> {scorecard.expectedOrderDate}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              <span className="font-medium">Account Manager:</span> {scorecard.accountManager}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              <span className="font-medium">Framework:</span> 
                              <Badge 
                                variant="outline"
                                className="ml-2 bg-primary/10 border-primary/30 text-primary text-xs"
                              >
                                {getFrameworkName(scorecard.frameworkId)}
                              </Badge>
                            </div>
                            <div className="text-xs text-muted-foreground pt-2 border-t border-border">
                              <span>Created: {new Date(scorecard.createdAt).toLocaleDateString()}</span>
                            </div>
                            
                            {/* Tags Section */}
                            <div className="pt-2 border-t border-border">
                              <div className="flex flex-wrap gap-1">
                                {(scorecard.tags || []).map((tag) => (
                                  <Badge
                                    key={tag}
                                    variant={getTagColor(tag) as any}
                                    className="text-xs gap-1"
                                  >
                                    <Tag className="w-3 h-3" />
                                    {tag}
                                    <button
                                      onClick={(e) => handleRemoveTag(scorecard.id, tag, e)}
                                      className="ml-1 hover:text-destructive"
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  </Badge>
                                ))}
                              </div>
                            </div>
                            
                            {scorecard.archived && (
                              <div className="pt-2 flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="flex-1 gap-2"
                                  onClick={(e) => handleUnarchive(scorecard.id, e)}
                                >
                                  <Archive className="w-4 h-4" />
                                  Unarchive
                                </Button>
                              </div>
                            )}
                            
                            {opportunityGroups[`${scorecard.opportunityName}_${scorecard.customerName}`]?.length > 1 && (
                              <div className="pt-2 flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="flex-1 gap-2"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setViewAllVersionsFor(`${scorecard.opportunityName}_${scorecard.customerName}`);
                                  }}
                                >
                                  <FileText className="w-4 h-4" />
                                  All Versions ({opportunityGroups[`${scorecard.opportunityName}_${scorecard.customerName}`].length})
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="flex-1 gap-2"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setTimelineView(scorecard.opportunityName);
                                    setActiveScorecard(null);
                                    setHasCreatedVersionForEdit(false);
                                  }}
                                >
                                  <Clock className="w-4 h-4" />
                                  Timeline
                                </Button>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
                ) : (
                  /* Table View */
                  <div className="border rounded-lg">
                    <table className="w-full">
                      <thead className="bg-muted/50">
                        <tr className="border-b">
                          <th className="text-left p-3 font-semibold">Opportunity</th>
                          <th className="text-left p-3 font-semibold">Customer</th>
                          <th className="text-left p-3 font-semibold">Account Manager</th>
                          <th className="text-left p-3 font-semibold">Framework</th>
                          <th className="text-left p-3 font-semibold">Score</th>
                          <th className="text-left p-3 font-semibold">Version</th>
                          <th className="text-left p-3 font-semibold">Expected Date</th>
                          <th className="text-left p-3 font-semibold">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sortedScorecards.map((scorecard) => {
                          const opportunityKey = `${scorecard.opportunityName}_${scorecard.customerName}`;
                          const versionsForOpportunity = opportunityGroups[opportunityKey] || [];
                          const maxVersion = Math.max(...versionsForOpportunity.map(s => s.version));
                          const isLatestVersion = scorecard.version === maxVersion;
                          
                          return (
                            <tr
                              key={scorecard.id}
                              className={`border-b hover:bg-muted/30 cursor-pointer transition-colors ${
                                scorecard.archived ? "opacity-60" : ""
                              }`}
                              onClick={() => handleScorecardSelect(scorecard.id)}
                            >
                              <td className="p-3">
                                <div className="flex items-center gap-2">
                                  {scorecard.pinned && <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />}
                                  {scorecard.opportunityName}
                                </div>
                              </td>
                              <td className="p-3">{scorecard.customerName}</td>
                              <td className="p-3">{scorecard.accountManager}</td>
                              <td className="p-3">
                                <Badge 
                                  variant="outline"
                                  className="bg-primary/10 border-primary/30 text-primary text-xs"
                                >
                                  {getFrameworkName(scorecard.frameworkId)}
                                </Badge>
                              </td>
                              <td className="p-3">
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold">{scorecard.totalScore}/40</span>
                                  {(() => {
                                    const totalNegative = [
                                      scorecard.funds,
                                      scorecard.authority,
                                      scorecard.interest,
                                      scorecard.need,
                                      scorecard.timing,
                                    ].reduce((sum, component) => sum + component.questions.filter(q => q.state === "negative").length, 0);
                                    return totalNegative > 0 && (
                                      <span className="text-xs text-destructive">
                                        -{totalNegative}
                                      </span>
                                    );
                                  })()}
                                </div>
                              </td>
                              <td className="p-3">
                                <Badge 
                                  variant={isLatestVersion ? "default" : "secondary"}
                                  className={isLatestVersion ? "bg-green-600 hover:bg-green-700" : ""}
                                >
                                  v{scorecard.version}{isLatestVersion ? " - Latest" : ""}
                                </Badge>
                              </td>
                              <td className="p-3 text-sm text-muted-foreground">
                                {scorecard.expectedOrderDate}
                              </td>
                              <td className="p-3">
                                <div className="flex items-center gap-1">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={(e) => handleTogglePin(scorecard.id, e)}
                                  >
                                    <Star className={`h-4 w-4 ${scorecard.pinned ? "fill-yellow-500 text-yellow-500" : ""}`} />
                                  </Button>
                                  {!scorecard.archived && (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDuplicate(scorecard);
                                      }}
                                    >
                                      <Copy className="h-4 w-4" />
                                    </Button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
                
                
              </>
            )}
          </>
        )}


        {timelineScorecards && timelineScorecards.length > 0 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-foreground">Timeline View</h2>
                <p className="text-muted-foreground mt-1">Track score evolution across versions</p>
              </div>
              <Button 
                variant="outline" 
                onClick={() => {
                  setTimelineView(null);
                }}
              >
                ← Back to List
              </Button>
            </div>
            <ScorecardTimeline scorecards={timelineScorecards} opportunityName={timelineView} />
          </div>
        )}

        {activeScorecard && (
          <div className="space-y-6">
            <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
              <div className="flex flex-col lg:flex-row lg:items-start gap-6">
                {/* Confidence Indicator - Left Side */}
                <ConfidenceIndicator scorecard={activeScorecard} />

                {/* Scorecard Details - Middle */}
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                    {activeScorecard.opportunityName}
                    {hasUnsavedChanges() && (
                      <span className="w-2 h-2 rounded-full bg-warning animate-pulse" title="Unsaved changes" />
                    )}
                  </h2>
                  <p className="text-muted-foreground mt-1">
                    {activeScorecard.customerName} • {activeScorecard.accountManager}
                  </p>
                  <div className="flex gap-4 text-sm text-muted-foreground mt-2">
                    <span>Expected: {activeScorecard.expectedOrderDate}</span>
                    <span>•</span>
                    <span>Review: {activeScorecard.reviewDate}</span>
                    <span>•</span>
                    <Badge 
                      variant="outline"
                      className="bg-primary/10 border-primary/30 text-primary text-xs"
                    >
                      {getFrameworkName(activeScorecard.frameworkId)}
                    </Badge>
                    <span>•</span>
                    <span className="flex items-center gap-2">
                      v{activeScorecard.version}
                      {(() => {
                        const opportunityKey = `${activeScorecard.opportunityName}_${activeScorecard.customerName}`;
                        const versionsForOpportunity = opportunityGroups[opportunityKey] || [];
                        const maxVersion = Math.max(...versionsForOpportunity.map(s => s.version));
                        const isLatestVersion = activeScorecard.version === maxVersion;
                        return isLatestVersion && (
                          <Badge variant="secondary" className="text-xs px-1.5 py-0">
                            Latest
                          </Badge>
                        );
                      })()}
                    </span>
                  </div>
                </div>

                {/* Action Buttons - Right Side */}
                <div className="flex flex-col gap-2 lg:self-start">
                  {opportunityGroups[`${activeScorecard.opportunityName}_${activeScorecard.customerName}`]?.length > 1 && (
                    <Button 
                      onClick={() => {
                        setTimelineView(activeScorecard.opportunityName);
                        setActiveScorecard(null);
                        setOriginalScorecard(null);
                        setHasCreatedVersionForEdit(false);
                      }} 
                      variant="outline" 
                      size="sm" 
                      className="gap-2"
                    >
                      <Clock className="w-4 h-4" />
                      Timeline
                    </Button>
                  )}
                  <Button onClick={handleNewVersion} variant="outline" size="sm" className="gap-2">
                    <Plus className="w-4 h-4" />
                    New Version
                  </Button>
                  <Button variant="outline" onClick={handleBackClick} size="sm">
                    Close
                  </Button>
                </div>
              </div>
            </div>

            <ScoreHeader scorecard={activeScorecard} />

            <div className="space-y-6">
              <FAINTSection
                title="Funds"
                color="bg-primary"
                component={activeScorecard.funds}
                questions={frameworkQuestions.funds}
                onUpdate={(index, state, note) => handleUpdateComponent("funds", index, state, note)}
              />
              
              <FAINTSection
                title="Authority"
                color="bg-accent"
                component={activeScorecard.authority}
                questions={frameworkQuestions.authority}
                onUpdate={(index, state, note) => handleUpdateComponent("authority", index, state, note)}
              />
              
              <FAINTSection
                title="Interest"
                color="bg-success"
                component={activeScorecard.interest}
                questions={frameworkQuestions.interest}
                onUpdate={(index, state, note) => handleUpdateComponent("interest", index, state, note)}
              />
              
              <FAINTSection
                title="Need"
                color="bg-warning"
                component={activeScorecard.need}
                questions={frameworkQuestions.need}
                onUpdate={(index, state, note) => handleUpdateComponent("need", index, state, note)}
              />
              
              <FAINTSection
                title="Timing"
                color="bg-destructive"
                component={activeScorecard.timing}
                questions={frameworkQuestions.timing}
                onUpdate={(index, state, note) => handleUpdateComponent("timing", index, state, note)}
              />
            </div>
          </div>
        )}

      {/* Tag Rename Dialog */}
      <Dialog open={editingTag !== null} onOpenChange={(open) => {
        if (!open) {
          setEditingTag(null);
          setNewTagName("");
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Tag</DialogTitle>
            <DialogDescription>
              This will rename the tag across all scorecards.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Current name</label>
              <div className="mt-1 p-2 bg-muted rounded-md text-sm">{editingTag}</div>
            </div>
            <div>
              <label className="text-sm font-medium">New name</label>
              <Input
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                placeholder="Enter new tag name"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && editingTag) {
                    handleRenameTag(editingTag, newTagName);
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setEditingTag(null);
              setNewTagName("");
            }}>
              Cancel
            </Button>
            <Button onClick={() => editingTag && handleRenameTag(editingTag, newTagName)}>
              Rename
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Unsaved Changes Dialog */}
      <AlertDialog open={showUnsavedDialog} onOpenChange={(open) => {
        if (!open) handleCancelDialog();
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unsaved Changes</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes. Would you like to save them before leaving?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel onClick={handleCancelDialog}>
              Cancel
            </AlertDialogCancel>
            <Button variant="outline" onClick={handleDiscardAndClose}>
              Don't Save
            </Button>
            <AlertDialogAction onClick={handleSaveAndClose}>
              Save Changes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
        </>
      )}
    </div>
  );
};

export default Index;
