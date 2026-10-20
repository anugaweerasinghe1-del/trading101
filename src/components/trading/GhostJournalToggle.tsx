import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

interface GhostJournalToggleProps {
  journalEnabled: boolean;
  onToggle: (enabled: boolean) => void;
  rationale: string;
  onRationaleChange: (value: string) => void;
}

export function GhostJournalToggle({
  journalEnabled,
  onToggle,
  rationale,
  onRationaleChange,
}: GhostJournalToggleProps) {
  return (
    <div className="space-y-2">
      {/* Toggle Row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <BookOpen className="w-3.5 h-3.5" />
          <span>Ghost Journal</span>
        </div>
        <Switch
          aria-label="Enable Ghost Journal"
          checked={journalEnabled}
          onCheckedChange={onToggle}
          className="scale-75"
        />
      </div>

      {/* Slide-in Rationale Area */}
      <div
        className={cn(
          "overflow-hidden transition-all duration-300 ease-out",
          journalEnabled ? "max-h-40 opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <textarea
          aria-label="Trade rationale"
          hidden={!journalEnabled}
          value={rationale}
          onChange={(e) => onRationaleChange(e.target.value)}
          placeholder="Why are you making this trade? (required)"
          className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary/50 transition-colors resize-none"
          rows={3}
        />
      </div>
    </div>
  );
}
