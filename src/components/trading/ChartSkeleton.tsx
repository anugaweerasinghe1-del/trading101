import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

export function ChartSkeleton() {
  return (
    <Card className="h-full flex flex-col bg-card border-border overflow-hidden">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-4">
          <div className="space-y-2">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-4 w-32" />
          </div>
          <div className="ml-6 space-y-2">
            <Skeleton className="h-8 w-28" />
            <Skeleton className="h-4 w-20" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-8 w-48 rounded-lg" />
        </div>
      </div>

      {/* Chart Area Skeleton - Shimmer effect */}
      <div className="flex-1 p-4 flex items-end gap-1">
        {Array.from({ length: 50 }).map((_, i) => {
          // Keep decorative bars stable across quote/theme rerenders.
          const height = 20 + ((i * 37) % 61);
          return (
            <Skeleton 
              key={i} 
              className="flex-1 rounded-sm animate-pulse" 
              style={{ 
                height: `${height}%`,
                animationDelay: `${i * 30}ms`
              }} 
            />
          );
        })}
      </div>

      {/* OHLC Stats Skeleton */}
      <div className="flex items-center justify-between px-4 py-2 border-t border-border bg-secondary/30">
        <div className="flex gap-6">
          {['O', 'H', 'L', 'C'].map((label) => (
            <div key={label} className="flex items-center gap-1">
              <span className="text-xs text-muted-foreground">{label}</span>
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
        </div>
        <div className="flex items-center gap-1">
          <span className="text-xs text-muted-foreground">Vol</span>
          <Skeleton className="h-4 w-12" />
        </div>
      </div>
    </Card>
  );
}
