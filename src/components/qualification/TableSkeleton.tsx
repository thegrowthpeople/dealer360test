import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

export function TableSkeleton() {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Customer</TableHead>
          <TableHead>Opportunity</TableHead>
          <TableHead>Score</TableHead>
          <TableHead>Framework</TableHead>
          <TableHead>Account Manager</TableHead>
          <TableHead>Expected Close</TableHead>
          <TableHead>Version</TableHead>
          <TableHead>Last Modified</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {Array.from({ length: 6 }).map((_, index) => (
          <TableRow key={index}>
            <TableCell>
              <Skeleton className="h-4 w-32 shimmer" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-4 w-40 shimmer" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-8 w-8 rounded-full shimmer" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-5 w-16 rounded-full shimmer" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-4 w-28 shimmer" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-4 w-24 shimmer" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-5 w-10 rounded-full shimmer" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-4 w-20 shimmer" />
            </TableCell>
            <TableCell>
              <div className="flex gap-1">
                <Skeleton className="h-8 w-8 shimmer" />
                <Skeleton className="h-8 w-8 shimmer" />
                <Skeleton className="h-8 w-8 shimmer" />
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
