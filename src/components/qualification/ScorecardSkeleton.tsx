import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function ScorecardSkeleton() {
  return (
    <Card className="p-4 hover:shadow-md transition-all duration-200">
      {/* Top confidence bar */}
      <Skeleton className="h-2 w-full mb-4 shimmer" />
      
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 space-y-2">
          {/* Customer name */}
          <Skeleton className="h-5 w-3/4 shimmer" />
          {/* Opportunity name */}
          <Skeleton className="h-4 w-1/2 shimmer" />
        </div>
        
        {/* Score circle */}
        <Skeleton className="h-16 w-16 rounded-full shimmer" />
      </div>
      
      <div className="flex items-center justify-between mt-4 pt-3 border-t">
        <div className="flex gap-2">
          {/* Framework badge */}
          <Skeleton className="h-5 w-16 rounded-full shimmer" />
          {/* Version badge */}
          <Skeleton className="h-5 w-12 rounded-full shimmer" />
        </div>
        
        {/* Date */}
        <Skeleton className="h-4 w-20 shimmer" />
      </div>
    </Card>
  );
}
