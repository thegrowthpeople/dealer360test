import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Plus, FileText, Calendar, GitCompare, Clock, ArrowUp, ArrowDown, Copy, Trash2, Download, Archive, CheckSquare, FileSpreadsheet, LayoutGrid, List, Star, X, Edit2, Settings } from "lucide-react";
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
import { format, differenceInDays } from "date-fns";
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
    updatedAt: new Date().toISOString(),
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
  updatedAt: db.updated_at,
  archived: db.archived,
  pinned: db.pinned,
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
    showOnlyPinned: false,
    showOnlyOverdue: false,
    dateFrom: undefined,
    dateTo: undefined,
    accountManager: null,
    customer: null,
    modifiedRange: null,
  });
  const [sortBy, setSortBy] = useState<"date" | "score" | "accountManager" | "customer" | "opportunity" | "framework" | "version" | "lastModified">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  
  
  const [duplicateDialogOpen, setDuplicateDialogOpen] = useState(false);
  const [scorecardToDuplicate, setScorecardToDuplicate] = useState<Scorecard | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [scorecardToDelete, setScorecardToDelete] = useState<Scorecard | null>(null);
  const [viewMode, setViewMode] = useState<"tiles" | "table">("tiles");
  const [animateTiles, setAnimateTiles] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState({
    opportunity: true,
    customer: true,
    accountManager: true,
    framework: true,
    score: true,
    version: true,
    expectedDate: true,
    lastModified: true,
  });

  const toggleColumnVisibility = (column: keyof typeof visibleColumns) => {
    setVisibleColumns(prev => ({ ...prev, [column]: !prev[column] }));
  };

  // Animate tiles on mount and when view mode changes
  useEffect(() => {
    setAnimateTiles(false);
    const timer = setTimeout(() => {
      setAnimateTiles(true);
    }, 100);
    return () => clearTimeout(timer);
  }, [viewMode]); // Re-trigger when view mode changes

  // Helper to check if scorecard was recently modified (within 48 hours)
  const isRecentlyModified = (updatedAt: string): boolean => {
    const now = new Date();
    const modifiedDate = new Date(updatedAt);
    const hoursDiff = (now.getTime() - modifiedDate.getTime()) / (1000 * 60 * 60);
    return hoursDiff <= 48;
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

  // Get confidence color based on score percentage (same logic as ConfidenceIndicator)
  const getConfidenceColor = (score: number): string => {
    const percentage = (score / 40) * 100;
    if (percentage >= 75) return "text-green-500";
    if (percentage >= 50) return "text-emerald-500";
    if (percentage >= 30) return "text-amber-500";
    return "text-red-500";
  };

  // Get confidence background color for tile bar
  const getConfidenceBgColor = (score: number): string => {
    const percentage = (score / 40) * 100;
    if (percentage >= 75) return "bg-green-500";
    if (percentage >= 50) return "bg-emerald-500";
    if (percentage >= 30) return "bg-amber-500";
    return "bg-red-500";
  };

  // Get confidence border and shadow colors for hover
  const getConfidenceHoverClasses = (score: number): string => {
    const percentage = (score / 40) * 100;
    if (percentage >= 75) return "hover:border-green-500 hover:shadow-green-500/20";
    if (percentage >= 50) return "hover:border-emerald-500 hover:shadow-emerald-500/20";
    if (percentage >= 30) return "hover:border-amber-500 hover:shadow-amber-500/20";
    return "hover:border-red-500 hover:shadow-red-500/20";
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

  const formatCloseDateWithDays = (dateStr: string): { date: string; days: string } => {
    if (!dateStr) return { date: "", days: "" };
    const closeDate = new Date(dateStr);
    const now = new Date();
    const daysUntil = differenceInDays(closeDate, now);
    const formattedDate = format(closeDate, "EEE d MMM");
    return { date: formattedDate, days: `${daysUntil}d` };
  };

  const getDaysColorClass = (dateStr: string): string => {
    if (!dateStr) return "";
    const closeDate = new Date(dateStr);
    const now = new Date();
    const daysUntil = differenceInDays(closeDate, now);
    
    if (daysUntil < 0) return "text-red-600 dark:text-red-400 font-semibold";
    if (daysUntil > 30) return "text-green-600 dark:text-green-400";
    if (daysUntil >= 15) return "text-amber-600 dark:text-amber-400";
    return "text-red-600 dark:text-red-400";
  };

  const isOverdue = (dateStr: string): boolean => {
    if (!dateStr) return false;
    const closeDate = new Date(dateStr);
    const now = new Date();
    const daysUntil = differenceInDays(closeDate, now);
    return daysUntil < 0;
  };

  const handleUpdateComponent = async (
    component: keyof Pick<Scorecard, "funds" | "authority" | "interest" | "need" | "timing">,
    index: number,
    state: any,
    note: string
  ) => {
    if (!activeScorecard) return;

    // Just update locally without creating a new version
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
      // Always create a new version based on the latest version for this opportunity/customer
      const opportunityKey = `${activeScorecard.opportunityName}_${activeScorecard.customerName}`;

      // Find all DB scorecards for this opportunity/customer
      const versionsForOpportunityDb = dbScorecards.filter(
        (s) => `${s.opportunity_name}_${s.customer_name}` === opportunityKey
      );

      if (versionsForOpportunityDb.length === 0) {
        // Fallback: no existing versions found in DB, just save current as-is
        await updateScorecardMutation({
          id: activeScorecard.id,
          ...convertToDatabase(activeScorecard, bdmId, defaultFramework.id),
        });
        toast.success("Changes saved successfully!");
      } else {
        // Get the latest version from DB
        const latestDbScorecard = versionsForOpportunityDb.reduce((prev, curr) =>
          curr.version > prev.version ? curr : prev
        );

        // Create a new version from the latest
        const created = await duplicateScorecardMutation(latestDbScorecard);
        const newVersion = convertToScorecard(created);

        // Apply all current changes (FAINT data) to the new version
        newVersion.funds = activeScorecard.funds;
        newVersion.authority = activeScorecard.authority;
        newVersion.interest = activeScorecard.interest;
        newVersion.need = activeScorecard.need;
        newVersion.timing = activeScorecard.timing;

        // Save the new version with changes
        await updateScorecardMutation({
          id: newVersion.id,
          ...convertToDatabase(newVersion, bdmId, defaultFramework.id),
        });

        toast.success(`Version ${newVersion.version} created and saved!`);
      }

      // Close the scorecard and return to list/tile view
      setShowUnsavedDialog(false);
      setActiveScorecard(null);
      setOriginalScorecard(null);
      setHasCreatedVersionForEdit(false);

      // If there was a pending navigation, execute it
      if (pendingNavigation) {
        navigate(pendingNavigation);
        setPendingNavigation(null);
      }
    } catch (error) {
      console.error('Failed to save changes:', error);
      toast.error("Failed to save changes");
    }
  };
  const handleDiscardAndClose = () => {
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
      
      if (link && activeScorecard) {
        const href = link.getAttribute('href');
        if (href && !href.startsWith('#')) {
          e.preventDefault();
          e.stopPropagation();
          
          // If there are unsaved changes, show dialog
          if (hasUnsavedChanges()) {
            setPendingNavigation(href);
            setShowUnsavedDialog(true);
          } else {
            // No unsaved changes - just close scorecard and navigate
            setActiveScorecard(null);
            setOriginalScorecard(null);
            setHasCreatedVersionForEdit(false);
            navigate(href);
          }
        }
      }
    };

    document.addEventListener('click', handleClick, true);
    return () => document.removeEventListener('click', handleClick, true);
  }, [activeScorecard, originalScorecard, location, navigate]);




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

  const handleDeleteScorecard = (scorecard: Scorecard, e: React.MouseEvent) => {
    e.stopPropagation();
    setScorecardToDelete(scorecard);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteScorecard = async () => {
    if (!scorecardToDelete) return;
    
    try {
      // Find all versions of this scorecard (same opportunity and customer)
      const versionsToDelete = scorecards.filter(
        s => s.opportunityName === scorecardToDelete.opportunityName && 
             s.customerName === scorecardToDelete.customerName
      );
      
      // Delete all versions
      await Promise.all(versionsToDelete.map(s => deleteScorecard(s.id)));
      
      toast.success(`Deleted ${versionsToDelete.length} version${versionsToDelete.length > 1 ? 's' : ''} of scorecard`);
      setDeleteDialogOpen(false);
      setScorecardToDelete(null);
    } catch (error) {
      console.error('Failed to delete scorecard:', error);
      toast.error("Failed to delete scorecard");
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

  const handleRippleEffect = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = e.currentTarget;
    const ripple = document.createElement('span');
    const rect = card.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;

    ripple.style.width = ripple.style.height = `${size}px`;
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;
    ripple.classList.add('ripple');

    card.appendChild(ripple);

    setTimeout(() => {
      ripple.remove();
    }, 600);
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

    // Show only pinned filter
    if (filters.showOnlyPinned && !scorecard.pinned) {
      return false;
    }

    // Show only overdue filter
    if (filters.showOnlyOverdue && !isOverdue(scorecard.expectedOrderDate)) {
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

    // Modified range filter
    if (filters.modifiedRange) {
      const now = new Date();
      const modifiedDate = new Date(scorecard.updatedAt);
      let cutoffDate = new Date();

      switch (filters.modifiedRange) {
        case "last7days":
          cutoffDate.setDate(now.getDate() - 7);
          break;
        case "last30days":
          cutoffDate.setDate(now.getDate() - 30);
          break;
        case "last90days":
          cutoffDate.setDate(now.getDate() - 90);
          break;
      }

      if (modifiedDate < cutoffDate) {
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
      case "lastModified":
        comparison = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
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
      case "opportunity":
        comparison = a.opportunityName.localeCompare(b.opportunityName);
        break;
      case "framework":
        comparison = getFrameworkName(a.frameworkId).localeCompare(getFrameworkName(b.frameworkId));
        break;
      case "version":
        comparison = a.version - b.version;
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

  const handleColumnSort = (column: typeof sortBy) => {
    if (sortBy === column) {
      // Toggle sort order if clicking the same column
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      // Set new column and default to descending
      setSortBy(column);
      setSortOrder("desc");
    }
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

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Scorecard</AlertDialogTitle>
            <AlertDialogDescription>
              {scorecardToDelete && (
                <>
                  Are you sure you want to delete all versions of <strong>{scorecardToDelete.opportunityName}</strong> for <strong>{scorecardToDelete.customerName}</strong>?
                  <br /><br />
                  This will permanently delete all {scorecards.filter(
                    s => s.opportunityName === scorecardToDelete.opportunityName && 
                         s.customerName === scorecardToDelete.customerName
                  ).length} version(s) of this scorecard. This action cannot be undone.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteScorecard} className="bg-destructive hover:bg-destructive/90">
              Delete All Versions
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
                accountManagers={uniqueAccountManagers}
                customers={uniqueCustomers}
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
                      <SelectItem value="lastModified">Last Modified</SelectItem>
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
                
                <div className="flex items-center gap-2">
                  <ToggleGroup type="single" value={viewMode} onValueChange={(value) => value && setViewMode(value as "tiles" | "table")}>
                    <ToggleGroupItem value="tiles" aria-label="Tile view">
                      <LayoutGrid className="h-4 w-4" />
                    </ToggleGroupItem>
                    <ToggleGroupItem value="table" aria-label="Table view">
                      <List className="h-4 w-4" />
                    </ToggleGroupItem>
                  </ToggleGroup>
                </div>
              </div>
            )}
            

            {sortedScorecards.length === 0 ? (
              <Card className="p-12 text-center">
                <p className="text-lg text-muted-foreground mb-4">No scorecards match your filters</p>
                <Button variant="outline" onClick={() => setFilters({ version: "latest", showArchived: false, showOnlyPinned: false, showOnlyOverdue: false, dateFrom: undefined, dateTo: undefined, accountManager: null, customer: null, modifiedRange: null })}>
                  Clear Filters
                </Button>
              </Card>
            ) : (
              <>
                {viewMode === "tiles" ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {sortedScorecards.map((scorecard, index) => {
                    const opportunityKey = `${scorecard.opportunityName}_${scorecard.customerName}`;
                    const versionsForOpportunity = opportunityGroups[opportunityKey] || [];
                    const maxVersion = Math.max(...versionsForOpportunity.map(s => s.version));
                    const isLatestVersion = scorecard.version === maxVersion;
                    
                    return (
                      <Card
                        key={scorecard.id}
                        className={`relative cursor-pointer group transition-all duration-300 border-2 overflow-hidden hover:shadow-2xl ${
                          getConfidenceHoverClasses(scorecard.totalScore)
                        } ${scorecard.archived ? "opacity-60" : ""} hover:-translate-y-2 animate-fade-in bg-gradient-to-br from-background to-muted/20`}
                        style={{
                          animationDelay: `${index * 50}ms`,
                          animationFillMode: 'backwards'
                        }}
                        onClick={(e) => {
                          handleRippleEffect(e);
                          handleScorecardSelect(scorecard.id);
                        }}
                      >
                        {/* Confidence Color Bar */}
                        <div className={`h-1.5 w-full ${getConfidenceBgColor(scorecard.totalScore)} transition-all duration-300 group-hover:h-2.5 group-hover:shadow-lg group-hover:brightness-110`} />
                        
                        {/* Action Buttons - Top Right */}
                        <div className="absolute top-4 right-4 flex gap-1.5 z-10">
                          {/* Pin Button - Always Visible When Pinned */}
                          <Button
                            variant="ghost"
                            size="icon"
                            className={`h-7 w-7 transition-all duration-200 hover:scale-110 ${
                              scorecard.pinned 
                                ? "bg-yellow-500 hover:bg-yellow-600 text-white opacity-100" 
                                : "bg-background/80 backdrop-blur-sm hover:bg-accent hover:text-accent-foreground opacity-0 group-hover:opacity-100"
                            }`}
                            onClick={(e) => handleTogglePin(scorecard.id, e)}
                          >
                            <Star className={`h-3.5 w-3.5 transition-all ${scorecard.pinned ? "fill-white" : ""}`} />
                          </Button>

                          {/* Other Action Buttons - Show on Hover */}
                          <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          {!scorecard.archived && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 bg-background/80 backdrop-blur-sm hover:bg-accent hover:text-accent-foreground transition-all duration-200 hover:scale-110"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDuplicate(scorecard);
                                }}
                              >
                                <Copy className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 bg-background/80 backdrop-blur-sm hover:bg-destructive hover:text-destructive-foreground transition-all duration-200 hover:scale-110"
                                onClick={(e) => handleDeleteScorecard(scorecard, e)}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </>
                          )}
                        </div>
                        </div>

                        <CardContent className="p-4 pt-3 flex flex-col h-full">
                          {/* Score Circle - Prominent */}
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1 pr-4">
                              <h3 className="text-xl font-bold text-foreground line-clamp-2 h-[56px] mb-2 group-hover:text-primary transition-colors">
                                {scorecard.customerName}
                              </h3>
                              
                              <p className="text-sm font-medium text-muted-foreground/90 line-clamp-2 h-[40px]">
                                {scorecard.opportunityName}
                              </p>
                            </div>
                            
                            {/* Circular Score Indicator */}
                            <div className="relative flex-shrink-0">
                              <svg className="w-20 h-20 transform -rotate-90">
                                <circle
                                  cx="40"
                                  cy="40"
                                  r="34"
                                  stroke="currentColor"
                                  strokeWidth="6"
                                  fill="none"
                                  className="text-muted"
                                />
                                <circle
                                  cx="40"
                                  cy="40"
                                  r="34"
                                  stroke="currentColor"
                                  strokeWidth="6"
                                  fill="none"
                                  strokeDasharray={animateTiles ? `${(scorecard.totalScore / 40) * 213.628} 213.628` : "0 213.628"}
                                  className={`${getConfidenceColor(scorecard.totalScore)} transition-all duration-1000 ease-out`}
                                  strokeLinecap="round"
                                />
                              </svg>
                              <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className={`text-2xl font-bold ${getConfidenceColor(scorecard.totalScore)}`}>{scorecard.totalScore}</span>
                                <span className="text-xs text-muted-foreground font-medium">/40</span>
                              </div>
                              {(() => {
                                const totalNegative = [
                                  scorecard.funds,
                                  scorecard.authority,
                                  scorecard.interest,
                                  scorecard.need,
                                  scorecard.timing,
                                ].reduce((sum, component) => sum + component.questions.filter(q => q.state === "negative").length, 0);
                                return totalNegative > 0 && (
                                  <div className="absolute -bottom-1 -right-1 bg-destructive text-destructive-foreground text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center shadow-lg">
                                    {totalNegative}
                                  </div>
                                );
                              })()}
                            </div>
                          </div>

                          {/* Spacer to push footer to bottom */}
                          <div className="flex-grow min-h-[8px]"></div>

                          {/* Info Section - Footer (fixed position) */}
                          <div className="space-y-2 pt-3 border-t border-border/50 mt-auto">
                            <div className="flex items-center justify-between text-sm h-[20px]">
                              <span className={`font-medium ${getDaysColorClass(scorecard.expectedOrderDate)}`}>
                                {formatCloseDateWithDays(scorecard.expectedOrderDate).date}
                              </span>
                              <div className="flex items-center gap-2">
                                {isOverdue(scorecard.expectedOrderDate) && (
                                  <Badge variant="destructive" className="text-xs">
                                    OVERDUE
                                  </Badge>
                                )}
                                <span className={`font-medium ${getDaysColorClass(scorecard.expectedOrderDate)}`}>
                                  {formatCloseDateWithDays(scorecard.expectedOrderDate).days}
                                </span>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2 text-sm text-muted-foreground h-[20px]">
                              <span className="font-medium">{scorecard.accountManager}</span>
                            </div>
                            
                            <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground/70 h-[20px]">
                              <div className="flex items-center gap-2">
                                <Clock className="w-3.5 h-3.5" />
                                <span>Modified {format(new Date(scorecard.updatedAt), "MMM d")}</span>
                                {isRecentlyModified(scorecard.updatedAt) && (
                                  <span 
                                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30"
                                    title="Modified within last 48 hours"
                                  >
                                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                                    <span className="text-[10px] font-medium uppercase tracking-wider">New</span>
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Badges Section */}
                          <div className="flex flex-wrap gap-1.5 mt-4 pt-3 border-t border-border/50 min-h-[32px]">
                            {scorecard.archived && (
                              <Badge variant="secondary" className="text-xs">Archived</Badge>
                            )}
                            <Badge 
                              variant="outline"
                              className="bg-primary/5 border-primary/30 text-primary text-xs"
                            >
                              {getFrameworkName(scorecard.frameworkId)}
                            </Badge>
                            <Badge 
                              variant={isLatestVersion ? "default" : "secondary"}
                              className={`text-xs ${isLatestVersion ? "bg-green-600" : ""}`}
                            >
                              v{scorecard.version}{isLatestVersion ? " • Latest" : ""}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    );
                    })}
                  </div>
                ) : (
                  /* Table View */
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-muted/50">
                        <tr className="border-b">
                          {visibleColumns.opportunity && (
                            <th 
                              className="text-left p-3 font-semibold cursor-pointer hover:bg-muted transition-colors select-none"
                              onClick={() => handleColumnSort("opportunity")}
                            >
                              <div className="flex items-center gap-2">
                                Opportunity
                                {sortBy === "opportunity" && (
                                  sortOrder === "asc" ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />
                                )}
                              </div>
                            </th>
                          )}
                          {visibleColumns.customer && (
                            <th 
                              className="text-left p-3 font-semibold cursor-pointer hover:bg-muted transition-colors select-none"
                              onClick={() => handleColumnSort("customer")}
                            >
                              <div className="flex items-center gap-2">
                                Customer
                                {sortBy === "customer" && (
                                  sortOrder === "asc" ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />
                                )}
                              </div>
                            </th>
                          )}
                          {visibleColumns.accountManager && (
                            <th 
                              className="text-left p-3 font-semibold cursor-pointer hover:bg-muted transition-colors select-none"
                              onClick={() => handleColumnSort("accountManager")}
                            >
                              <div className="flex items-center gap-2">
                                Account Manager
                                {sortBy === "accountManager" && (
                                  sortOrder === "asc" ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />
                                )}
                              </div>
                            </th>
                          )}
                          {visibleColumns.framework && (
                            <th 
                              className="text-left p-3 font-semibold cursor-pointer hover:bg-muted transition-colors select-none"
                              onClick={() => handleColumnSort("framework")}
                            >
                              <div className="flex items-center gap-2">
                                Framework
                                {sortBy === "framework" && (
                                  sortOrder === "asc" ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />
                                )}
                              </div>
                            </th>
                          )}
                          {visibleColumns.score && (
                            <th 
                              className="text-left p-3 font-semibold cursor-pointer hover:bg-muted transition-colors select-none"
                              onClick={() => handleColumnSort("score")}
                            >
                              <div className="flex items-center gap-2">
                                Score
                                {sortBy === "score" && (
                                  sortOrder === "asc" ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />
                                )}
                              </div>
                            </th>
                          )}
                          {visibleColumns.version && (
                            <th 
                              className="text-left p-3 font-semibold cursor-pointer hover:bg-muted transition-colors select-none"
                              onClick={() => handleColumnSort("version")}
                            >
                              <div className="flex items-center gap-2">
                                Version
                                {sortBy === "version" && (
                                  sortOrder === "asc" ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />
                                )}
                              </div>
                            </th>
                          )}
                          {visibleColumns.expectedDate && (
                            <th 
                              className="text-left p-3 font-semibold cursor-pointer hover:bg-muted transition-colors select-none"
                              onClick={() => handleColumnSort("date")}
                            >
                              <div className="flex items-center gap-2">
                                Expected Date
                                {sortBy === "date" && (
                                  sortOrder === "asc" ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />
                                )}
                              </div>
                            </th>
                          )}
                          {visibleColumns.lastModified && (
                            <th 
                              className="text-left p-3 font-semibold cursor-pointer hover:bg-muted transition-colors select-none"
                              onClick={() => handleColumnSort("lastModified")}
                            >
                              <div className="flex items-center gap-2">
                                Last Modified
                                {sortBy === "lastModified" && (
                                  sortOrder === "asc" ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />
                                )}
                              </div>
                            </th>
                          )}
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
                              {visibleColumns.opportunity && (
                                <td className="p-3">
                                  <div className="flex items-center gap-2">
                                    {scorecard.pinned && <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />}
                                    {scorecard.opportunityName}
                                  </div>
                                </td>
                              )}
                              {visibleColumns.customer && (
                                <td className="p-3">{scorecard.customerName}</td>
                              )}
                              {visibleColumns.accountManager && (
                                <td className="p-3">{scorecard.accountManager}</td>
                              )}
                              {visibleColumns.framework && (
                                <td className="p-3">
                                  <Badge 
                                    variant="outline"
                                    className="bg-primary/10 border-primary/30 text-primary text-xs"
                                  >
                                    {getFrameworkName(scorecard.frameworkId)}
                                  </Badge>
                                </td>
                              )}
                              {visibleColumns.score && (
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
                              )}
                              {visibleColumns.version && (
                                <td className="p-3">
                                  <Badge 
                                    variant={isLatestVersion ? "default" : "secondary"}
                                    className={isLatestVersion ? "bg-green-600 hover:bg-green-700" : ""}
                                  >
                                    v{scorecard.version}{isLatestVersion ? " - Latest" : ""}
                                  </Badge>
                                </td>
                              )}
                              {visibleColumns.expectedDate && (
                                <td className="p-3 text-sm">
                                  <div className="flex items-center justify-between gap-2">
                                    <span className={getDaysColorClass(scorecard.expectedOrderDate)}>
                                      {formatCloseDateWithDays(scorecard.expectedOrderDate).date}
                                    </span>
                                    <div className="flex items-center gap-2">
                                      {isOverdue(scorecard.expectedOrderDate) && (
                                        <Badge variant="destructive" className="text-xs">
                                          OVERDUE
                                        </Badge>
                                      )}
                                      <span className={getDaysColorClass(scorecard.expectedOrderDate)}>
                                        {formatCloseDateWithDays(scorecard.expectedOrderDate).days}
                                      </span>
                                    </div>
                                  </div>
                                </td>
                              )}
                              {visibleColumns.lastModified && (
                                 <td className="p-3">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm text-muted-foreground">
                                      {format(new Date(scorecard.updatedAt), "MMM d")}
                                    </span>
                                    {isRecentlyModified(scorecard.updatedAt) && (
                                      <Badge 
                                        variant="default"
                                        className="text-xs bg-amber-500 hover:bg-amber-600 text-white"
                                      >
                                        Recent
                                      </Badge>
                                    )}
                                  </div>
                                </td>
                              )}
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
                                    <>
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
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 hover:text-destructive"
                                        onClick={(e) => handleDeleteScorecard(scorecard, e)}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </>
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
                    <span className="flex items-center gap-2">
                      Expected: 
                      <span className={getDaysColorClass(activeScorecard.expectedOrderDate)}>
                        {formatCloseDateWithDays(activeScorecard.expectedOrderDate).date}
                      </span>
                      <span className={getDaysColorClass(activeScorecard.expectedOrderDate)}>
                        {formatCloseDateWithDays(activeScorecard.expectedOrderDate).days}
                      </span>
                      {isOverdue(activeScorecard.expectedOrderDate) && (
                        <Badge variant="destructive" className="text-xs">
                          OVERDUE
                        </Badge>
                      )}
                    </span>
                    <span>•</span>
                    <span>Review: {activeScorecard.reviewDate}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      Modified: {format(new Date(activeScorecard.updatedAt), "MMM d, yyyy h:mm a")}
                    </span>
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
