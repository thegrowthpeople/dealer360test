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
import { Scorecard, FAINT_QUESTIONS } from "@/types/scorecard";
import { toast } from "sonner";
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

const Index = () => {
  const [scorecards, setScorecards] = useState<Scorecard[]>([]);
  const [activeScorecard, setActiveScorecard] = useState<Scorecard | null>(null);
  const [originalScorecard, setOriginalScorecard] = useState<Scorecard | null>(null);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);
  const [hasCreatedVersionForEdit, setHasCreatedVersionForEdit] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [comparisonMode, setComparisonMode] = useState(false);
  const [selectedForComparison, setSelectedForComparison] = useState<string[]>([]);
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
  const [bulkSelectionMode, setBulkSelectionMode] = useState(false);
  const [selectedForBulk, setSelectedForBulk] = useState<string[]>([]);
  const [duplicateDialogOpen, setDuplicateDialogOpen] = useState(false);
  const [scorecardToDuplicate, setScorecardToDuplicate] = useState<Scorecard | null>(null);
  const [viewMode, setViewMode] = useState<"expanded" | "compact">("expanded");
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

  const handleCreateScorecard = (data: Partial<Scorecard>) => {
    const newScorecard = createEmptyScorecard(data);
    setScorecards([...scorecards, newScorecard]);
    setActiveScorecard(newScorecard);
    setOriginalScorecard(JSON.parse(JSON.stringify(newScorecard)));
    setHasCreatedVersionForEdit(true); // New scorecard, already a "new version"
    setIsDialogOpen(false);
    toast.success("Scorecard created successfully!");
  };

  const handleUpdateComponent = (
    component: keyof Pick<Scorecard, "funds" | "authority" | "interest" | "need" | "timing">,
    index: number,
    state: any,
    note: string
  ) => {
    if (!activeScorecard) return;

    // If this is the first edit on an existing scorecard, create a new version
    if (!hasCreatedVersionForEdit) {
      const newVersion: Scorecard = {
        ...activeScorecard,
        id: Date.now().toString(),
        version: activeScorecard.version + 1,
        reviewDate: new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString(),
      };
      
      // Apply the change to the new version
      newVersion[component].questions[index] = { state, note };
      
      // Add new version to scorecards and set it as active
      setScorecards([...scorecards, newVersion]);
      setActiveScorecard(newVersion);
      setOriginalScorecard(JSON.parse(JSON.stringify(newVersion)));
      setHasCreatedVersionForEdit(true);
      toast.success(`Version ${newVersion.version} created from changes!`);
      return;
    }

    // Otherwise, update the current (already versioned) scorecard
    const updatedScorecard = { ...activeScorecard };
    updatedScorecard[component].questions[index] = { state, note };
    
    setActiveScorecard(updatedScorecard);
    setScorecards(scorecards.map(s => s.id === updatedScorecard.id ? updatedScorecard : s));
  };

  const handleNewVersion = () => {
    if (!activeScorecard) return;
    
    const newVersion: Scorecard = {
      ...activeScorecard,
      id: Date.now().toString(),
      version: activeScorecard.version + 1,
      reviewDate: new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
    };
    
    setScorecards([...scorecards, newVersion]);
    setActiveScorecard(newVersion);
    setOriginalScorecard(JSON.parse(JSON.stringify(newVersion)));
    setHasCreatedVersionForEdit(true); // Manual version creation, can now edit this version
    toast.success(`Version ${newVersion.version} created!`);
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

  const handleSaveAndClose = () => {
    // Changes are already saved automatically via handleUpdateComponent
    setShowUnsavedDialog(false);
    setActiveScorecard(null);
    setOriginalScorecard(null);
    setHasCreatedVersionForEdit(false);
    if (pendingNavigation) {
      navigate(pendingNavigation);
      setPendingNavigation(null);
    }
    toast.success("Changes saved successfully!");
  };

  const handleDiscardAndClose = () => {
    if (originalScorecard && hasCreatedVersionForEdit) {
      // Remove the auto-created version if user discards
      setScorecards(scorecards.filter(s => s.id !== activeScorecard?.id));
    } else if (originalScorecard) {
      // Revert changes in the scorecards array
      setScorecards(scorecards.map(s => s.id === originalScorecard.id ? originalScorecard : s));
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


  const handleComparisonToggle = () => {
    setComparisonMode(!comparisonMode);
    setSelectedForComparison([]);
    setActiveScorecard(null);
    setViewAllVersionsFor(null);
    setBulkSelectionMode(false);
    setSelectedForBulk([]);
    setHasCreatedVersionForEdit(false);
  };

  const handleBulkModeToggle = () => {
    setBulkSelectionMode(!bulkSelectionMode);
    setSelectedForBulk([]);
    setComparisonMode(false);
    setSelectedForComparison([]);
  };

  const handleBulkSelect = (id: string) => {
    if (selectedForBulk.includes(id)) {
      setSelectedForBulk(selectedForBulk.filter(sid => sid !== id));
    } else {
      setSelectedForBulk([...selectedForBulk, id]);
    }
  };

  const handleBulkDelete = () => {
    setScorecards(scorecards.filter(s => !selectedForBulk.includes(s.id)));
    setSelectedForBulk([]);
    setBulkSelectionMode(false);
    toast.success(`Deleted ${selectedForBulk.length} scorecard(s)`);
  };

  const handleBulkArchive = () => {
    setScorecards(scorecards.map(s => 
      selectedForBulk.includes(s.id) ? { ...s, archived: true } : s
    ));
    setSelectedForBulk([]);
    setBulkSelectionMode(false);
    toast.success(`Archived ${selectedForBulk.length} scorecard(s)`);
  };

  const handleUnarchive = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setScorecards(scorecards.map(s => 
      s.id === id ? { ...s, archived: false } : s
    ));
    toast.success("Scorecard unarchived");
  };

  const handleTogglePin = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setScorecards(scorecards.map(s => 
      s.id === id ? { ...s, pinned: !s.pinned } : s
    ));
    const scorecard = scorecards.find(s => s.id === id);
    toast.success(scorecard?.pinned ? "Scorecard unpinned" : "Scorecard pinned");
  };

  const handleAddTag = (id: string, tag: string) => {
    if (!tag.trim()) return;
    setScorecards(scorecards.map(s => 
      s.id === id ? { ...s, tags: [...(s.tags || []), tag.trim()] } : s
    ));
    toast.success("Tag added");
  };

  const handleRemoveTag = (id: string, tagToRemove: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setScorecards(scorecards.map(s => 
      s.id === id ? { ...s, tags: (s.tags || []).filter(t => t !== tagToRemove) } : s
    ));
    toast.success("Tag removed");
  };

  const handleRenameTag = (oldTag: string, newTag: string) => {
    if (!newTag.trim() || oldTag === newTag) {
      setEditingTag(null);
      setNewTagName("");
      return;
    }

    setScorecards(prevCards =>
      prevCards.map(card => ({
        ...card,
        tags: card.tags?.map(t => t === oldTag ? newTag.trim() : t)
      }))
    );

    setFilters(prevFilters => ({
      ...prevFilters,
      tags: prevFilters.tags.map(t => t === oldTag ? newTag.trim() : t)
    }));

    setEditingTag(null);
    setNewTagName("");
    toast.success(`Tag renamed from "${oldTag}" to "${newTag}"`);
  };

  const handleBulkExport = () => {
    const selectedScorecards = scorecards.filter(s => selectedForBulk.includes(s.id));
    const dataStr = JSON.stringify(selectedScorecards, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `scorecards-export-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${selectedForBulk.length} scorecard(s) as JSON`);
  };

  const handleBulkExportCSV = () => {
    const selectedScorecards = scorecards.filter(s => selectedForBulk.includes(s.id));
    
    // CSV headers
    const headers = [
      "Opportunity Name",
      "Customer Name",
      "Account Manager",
      "Version",
      "Expected Order Date",
      "Review Date",
      "Created Date",
      "Total Score",
      "Funds Score",
      "Authority Score",
      "Interest Score",
      "Need Score",
      "Timing Score",
      "Status"
    ];
    
    // CSV rows
    const rows = selectedScorecards.map(scorecard => {
      const calculateComponentScore = (component: any) => 
        component.questions.filter((q: any) => q.state === "positive").length;
      
      const totalScore = [
        scorecard.funds,
        scorecard.authority,
        scorecard.interest,
        scorecard.need,
        scorecard.timing,
      ].reduce((sum, component) => sum + calculateComponentScore(component), 0);
      
      return [
        scorecard.opportunityName,
        scorecard.customerName,
        scorecard.accountManager,
        scorecard.version,
        scorecard.expectedOrderDate,
        scorecard.reviewDate,
        new Date(scorecard.createdAt).toLocaleDateString(),
        totalScore,
        calculateComponentScore(scorecard.funds),
        calculateComponentScore(scorecard.authority),
        calculateComponentScore(scorecard.interest),
        calculateComponentScore(scorecard.need),
        calculateComponentScore(scorecard.timing),
        scorecard.archived ? "Archived" : "Active"
      ].map(field => `"${field}"`).join(",");
    });
    
    const csv = [headers.join(","), ...rows].join("\n");
    const dataBlob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `scorecards-export-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${selectedForBulk.length} scorecard(s) as CSV`);
  };

  const handleDuplicate = (scorecard: Scorecard) => {
    setScorecardToDuplicate(scorecard);
    setDuplicateDialogOpen(true);
  };

  const handleDuplicateSubmit = (data: Partial<Scorecard>) => {
    if (!scorecardToDuplicate) return;
    
    const duplicated: Scorecard = {
      ...scorecardToDuplicate,
      id: Date.now().toString(),
      version: 1,
      accountManager: data.accountManager || scorecardToDuplicate.accountManager,
      customerName: data.customerName || scorecardToDuplicate.customerName,
      opportunityName: data.opportunityName || scorecardToDuplicate.opportunityName,
      expectedOrderDate: data.expectedOrderDate || scorecardToDuplicate.expectedOrderDate,
      reviewDate: data.reviewDate || new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
      archived: false,
    };
    
    setScorecards([...scorecards, duplicated]);
    setDuplicateDialogOpen(false);
    setScorecardToDuplicate(null);
    toast.success("Scorecard duplicated successfully!");
  };

  const handleScorecardSelect = (id: string) => {
    if (bulkSelectionMode) {
      handleBulkSelect(id);
      return;
    }
    
    if (comparisonMode) {
      if (selectedForComparison.includes(id)) {
        setSelectedForComparison(selectedForComparison.filter(sid => sid !== id));
      } else if (selectedForComparison.length < 2) {
        setSelectedForComparison([...selectedForComparison, id]);
      } else {
        toast.error("You can only compare 2 scorecards at a time");
      }
    } else {
      const scorecard = scorecards.find(s => s.id === id) || null;
      setActiveScorecard(scorecard);
      setOriginalScorecard(scorecard ? JSON.parse(JSON.stringify(scorecard)) : null);
      setHasCreatedVersionForEdit(false); // Reset flag when opening a scorecard
    }
  };

  const comparisonScorecards = selectedForComparison.length === 2
    ? [
        scorecards.find(s => s.id === selectedForComparison[0])!,
        scorecards.find(s => s.id === selectedForComparison[1])!
      ]
    : null;

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
    if (!filters.showArchived && !bulkSelectionMode && scorecard.archived) {
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

  return (
    <div className="min-h-screen">
      <div className="px-6 xl:px-12 2xl:px-16 space-y-6">
        <div className="flex items-center justify-between">
          <div>
          <h1 className="text-4xl xl:text-5xl font-bold text-foreground mb-4">Qualification Scorecards</h1>
          <p className="text-muted-foreground">
            Track and manage qualification and activity for sales opportunities
          </p>
          </div>
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
        </div>

        <Separator className="my-6" />

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

        {!activeScorecard && !comparisonScorecards && !timelineScorecards && (
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

            {!comparisonMode && !timelineView && !viewAllVersionsFor && (
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
                bulkSelectionMode={bulkSelectionMode}
                comparisonMode={comparisonMode}
                onBulkModeToggle={handleBulkModeToggle}
                onComparisonToggle={handleComparisonToggle}
                onTagRename={(tag) => {
                  setEditingTag(tag);
                  setNewTagName(tag);
                }}
              />
            )}
            
            {!comparisonMode && sortedScorecards.length > 0 && (
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
                
                <ToggleGroup type="single" value={viewMode} onValueChange={(value) => value && setViewMode(value as "expanded" | "compact")}>
                  <ToggleGroupItem value="expanded" aria-label="Expanded view">
                    <LayoutGrid className="h-4 w-4" />
                  </ToggleGroupItem>
                  <ToggleGroupItem value="compact" aria-label="Compact view">
                    <List className="h-4 w-4" />
                  </ToggleGroupItem>
                </ToggleGroup>
              </div>
            )}
            
            {bulkSelectionMode && selectedForBulk.length > 0 && (
              <div className="mb-4 p-4 bg-primary/5 border border-primary/20 rounded-lg">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-foreground font-semibold">
                    {selectedForBulk.length} scorecard(s) selected
                  </p>
                  <div className="flex gap-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="gap-2"
                        >
                          <Download className="w-4 h-4" />
                          Export
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="bg-background border border-border shadow-lg z-50">
                        <DropdownMenuItem onClick={handleBulkExportCSV}>
                          <FileSpreadsheet className="w-4 h-4 mr-2" />
                          Export as CSV
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleBulkExport}>
                          <FileText className="w-4 h-4 mr-2" />
                          Export as JSON
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={handleBulkArchive}
                      className="gap-2"
                    >
                      <Archive className="w-4 h-4" />
                      Archive
                    </Button>
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={handleBulkDelete}
                      className="gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {comparisonMode && selectedForComparison.length > 0 && (
              <div className="mb-4 p-4 bg-primary/5 border border-primary/20 rounded-lg">
                <p className="text-sm text-foreground">
                  <span className="font-semibold">{selectedForComparison.length}</span> of 2 scorecards selected
                  {selectedForComparison.length === 2 && (
                    <span className="ml-2 text-primary">• Click "View Comparison" below to see changes</span>
                  )}
                </p>
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
                <div className={viewMode === "compact" ? "grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3" : "grid grid-cols-1 md:grid-cols-2 gap-6"}>
                  {sortedScorecards.map((scorecard) => {
                    const isSelected = comparisonMode 
                      ? selectedForComparison.includes(scorecard.id)
                      : bulkSelectionMode
                        ? selectedForBulk.includes(scorecard.id)
                        : false;
                    
                    // Determine if this is the latest version for this opportunity
                    const opportunityKey = `${scorecard.opportunityName}_${scorecard.customerName}`;
                    const versionsForOpportunity = opportunityGroups[opportunityKey] || [];
                    const maxVersion = Math.max(...versionsForOpportunity.map(s => s.version));
                    const isLatestVersion = scorecard.version === maxVersion;
                    
                    if (viewMode === "compact") {
                      return (
                        <Card
                          key={scorecard.id}
                          className={`relative cursor-pointer hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 border ${
                            isSelected 
                              ? "border-primary bg-primary/5" 
                              : "hover:border-primary/50"
                          } ${scorecard.archived ? "opacity-60" : ""}`}
                          onClick={() => !bulkSelectionMode && handleScorecardSelect(scorecard.id)}
                        >
                          {bulkSelectionMode && (
                            <div className="absolute top-2 left-2 z-10" onClick={(e) => e.stopPropagation()}>
                              <Checkbox
                                checked={selectedForBulk.includes(scorecard.id)}
                                onCheckedChange={() => handleBulkSelect(scorecard.id)}
                              />
                            </div>
                          )}
                          <CardHeader className="pb-2 pt-8">
                            <div className="flex items-start justify-between gap-2">
                              <CardTitle className="text-sm line-clamp-2">{scorecard.opportunityName}</CardTitle>
                              <div className="shrink-0 text-right">
                                <div className="text-lg font-bold text-primary">{scorecard.totalScore}</div>
                                {(() => {
                                  const totalNegative = [
                                    scorecard.funds,
                                    scorecard.authority,
                                    scorecard.interest,
                                    scorecard.need,
                                    scorecard.timing,
                                  ].reduce((sum, component) => sum + component.questions.filter(q => q.state === "negative").length, 0);
                                  return totalNegative > 0 && (
                                    <div className="text-[10px] text-destructive mt-0.5">
                                      -{totalNegative}
                                    </div>
                                  );
                                })()}
                              </div>
                            </div>
                            <p className="text-xs text-muted-foreground line-clamp-1">{scorecard.customerName}</p>
                          </CardHeader>
                          <CardContent className="pb-3">
                            <div className="flex flex-wrap gap-1 mb-2">
                              {scorecard.archived && (
                                <Badge variant="secondary" className="text-xs h-5">Archived</Badge>
                              )}
                              <Badge 
                                variant={isLatestVersion ? "default" : "secondary"}
                                className={`text-xs h-5 ${isLatestVersion ? "bg-green-600" : ""}`}
                              >
                                v{scorecard.version}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground truncate">{scorecard.accountManager}</p>
                          </CardContent>
                        </Card>
                      );
                    }
                    
                    return (
                      <Card
                        key={scorecard.id}
                        className={`relative cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all duration-200 border-2 ${
                          isSelected 
                            ? "border-primary bg-primary/5" 
                            : scorecard.pinned 
                              ? "border-yellow-500/50 bg-yellow-50/5"
                              : getScoreColorClass(scorecard.totalScore)
                        } ${scorecard.archived ? "opacity-60" : ""}`}
                        onClick={() => !bulkSelectionMode && handleScorecardSelect(scorecard.id)}
                      >
                        {bulkSelectionMode && (
                          <div className="absolute top-3 left-3 z-10" onClick={(e) => e.stopPropagation()}>
                            <Checkbox
                              checked={selectedForBulk.includes(scorecard.id)}
                              onCheckedChange={() => handleBulkSelect(scorecard.id)}
                            />
                          </div>
                        )}
                        <div className="absolute top-3 right-3 flex gap-2">
                          {!bulkSelectionMode && !comparisonMode && (
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
                          )}
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
                            variant={isLatestVersion ? "default" : "secondary"}
                            className={isLatestVersion ? "bg-green-600 hover:bg-green-700" : ""}
                          >
                            v{scorecard.version}{isLatestVersion ? " - Latest" : ""}
                          </Badge>
                          {isSelected && !bulkSelectionMode && (
                            <Badge className="bg-primary">Selected</Badge>
                          )}
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
                            
                            {!comparisonMode && !bulkSelectionMode && scorecard.archived && (
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
                            
                            {!comparisonMode && !bulkSelectionMode && opportunityGroups[`${scorecard.opportunityName}_${scorecard.customerName}`]?.length > 1 && (
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
                
                {comparisonMode && selectedForComparison.length === 2 && (
                  <div className="mt-6 flex justify-center">
                    <Button 
                      size="lg" 
                      onClick={() => {
                        setComparisonMode(false);
                      }}
                      className="gap-2"
                    >
                      <GitCompare className="w-5 h-5" />
                      View Comparison
                    </Button>
                  </div>
                )}
              </>
            )}
          </>
        )}

        {comparisonScorecards && !comparisonMode && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-foreground">Scorecard Comparison</h2>
              <Button 
                variant="outline" 
                onClick={() => {
                  setSelectedForComparison([]);
                }}
              >
                ← Back to List
              </Button>
            </div>
            <ScorecardComparison 
              oldScorecard={comparisonScorecards[0]} 
              newScorecard={comparisonScorecards[1]} 
            />
          </div>
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
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
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

                {/* Confidence Indicator */}
                <ConfidenceIndicator scorecard={activeScorecard} />

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
                questions={FAINT_QUESTIONS.funds}
                onUpdate={(index, state, note) => handleUpdateComponent("funds", index, state, note)}
              />
              
              <FAINTSection
                title="Authority"
                color="bg-accent"
                component={activeScorecard.authority}
                questions={FAINT_QUESTIONS.authority}
                onUpdate={(index, state, note) => handleUpdateComponent("authority", index, state, note)}
              />
              
              <FAINTSection
                title="Interest"
                color="bg-success"
                component={activeScorecard.interest}
                questions={FAINT_QUESTIONS.interest}
                onUpdate={(index, state, note) => handleUpdateComponent("interest", index, state, note)}
              />
              
              <FAINTSection
                title="Need"
                color="bg-warning"
                component={activeScorecard.need}
                questions={FAINT_QUESTIONS.need}
                onUpdate={(index, state, note) => handleUpdateComponent("need", index, state, note)}
              />
              
              <FAINTSection
                title="Timing"
                color="bg-destructive"
                component={activeScorecard.timing}
                questions={FAINT_QUESTIONS.timing}
                onUpdate={(index, state, note) => handleUpdateComponent("timing", index, state, note)}
              />
            </div>
          </div>
        )}
      </div>

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
    </div>
  );
};

export default Index;
