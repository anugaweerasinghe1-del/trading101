import { Trade } from "@/lib/types";
import { getJournalEntries, getJournalSummary } from "@/lib/tradingJournal";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText } from "lucide-react";
import { cn } from "@/lib/utils";

interface TradingJournalProps {
  trades: Trade[];
}

export function TradingJournal({ trades }: TradingJournalProps) {
  const journalTrades = getJournalEntries(trades);
  const summary = getJournalSummary(trades);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold mb-2">Trading Journal</h2>
          <p className="text-muted-foreground">
            {journalTrades.length} {journalTrades.length === 1 ? "trade" : "trades"} with journal entries
          </p>
        </div>

      </div>

      <Tabs defaultValue="entries" className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="entries">Entries</TabsTrigger>
          <TabsTrigger value="emotions">Emotions</TabsTrigger>
          <TabsTrigger value="insights">Summary</TabsTrigger>
        </TabsList>

        <TabsContent value="entries" className="space-y-4">
          {journalTrades.length === 0 ? (
            <Card className="p-12 text-center">
              <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <p className="text-xl text-muted-foreground">
                No journal entries yet. Add notes to your trades to track your psychology!
              </p>
            </Card>
          ) : (
            <ScrollArea className="h-[600px]">
              <div className="space-y-4">
                {journalTrades.map((trade) => (
                  <Card key={trade.id} className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-bold">{trade.symbol}</h3>
                          <Badge variant={trade.type === 'buy' ? 'default' : 'outline'}>
                            {trade.type.toUpperCase()}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {new Date(trade.timestamp).toLocaleString()}
                        </p>
                      </div>
                      <p className={cn(
                        "text-xl font-bold",
                        trade.type === 'buy' ? "text-success" : "text-destructive"
                      )}>
                        ${trade.total.toFixed(2)}
                      </p>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <p className="text-sm font-medium mb-2">Emotions:</p>
                        <div className="flex flex-wrap gap-2">
                          {trade.journal?.emotions.map((emotion, i) => (
                            <Badge key={i} variant="secondary">{emotion}</Badge>
                          ))}
                        </div>
                      </div>

                      {trade.journal?.reasoning && (
                        <div>
                          <p className="text-sm font-medium mb-1">Reasoning:</p>
                          <p className="text-sm text-muted-foreground">{trade.journal.reasoning}</p>
                        </div>
                      )}

                      {trade.journal?.notes && (
                        <div>
                          <p className="text-sm font-medium mb-1">Notes:</p>
                          <p className="text-sm text-muted-foreground">{trade.journal.notes}</p>
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}
        </TabsContent>

        <TabsContent value="emotions">
          <Card className="p-6">
            <h3 className="text-xl font-bold mb-6">Emotional Breakdown</h3>
            <div className="space-y-4">
              {summary.emotions.map(({ emotion, count }) => (
                  <div key={emotion} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">{emotion}</Badge>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-24 sm:w-64 h-3 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary"
                          style={{ width: `${(count / summary.totalEntries) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium w-12 text-right">{count}</span>
                    </div>
                  </div>
                ))}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="insights">
          <Card className="p-6 space-y-4">
            <h3 className="text-xl font-bold">Journal Summary</h3>
            <p className="text-muted-foreground">
              This summary counts your current journal entries and emotion tags in this browser.
              It uses no AI and does not calculate returns or win rates by emotion.
            </p>
            {summary.totalEntries === 0 ? (
              <p>No journal entries yet. Add a note to a practice trade to begin reviewing your decisions.</p>
            ) : (
              <>
                <p>{summary.totalEntries} journal {summary.totalEntries === 1 ? "entry" : "entries"}; {summary.taggedEntries} {summary.taggedEntries === 1 ? "includes" : "include"} emotion tags.</p>
                {summary.emotions.length === 0 ? (
                  <p className="text-muted-foreground">No emotion tags recorded.</p>
                ) : (
                  <ul className="space-y-2">
                    {summary.emotions.map(({ emotion, count }) => (
                      <li key={emotion} className="flex flex-wrap items-center justify-between gap-2">
                        <Badge variant="outline">{emotion}</Badge>
                        <span>{count} of {summary.totalEntries} {summary.totalEntries === 1 ? "entry" : "entries"}</span>
                      </li>
                    ))}
                  </ul>
                )}
                <p className="text-sm text-muted-foreground">
                  An entry can include several emotions, so counts across tags can exceed the entry total.
                  Frequency does not show whether an emotion caused a profitable or losing trade.
                </p>
                <h4 className="font-semibold">Questions for your own review</h4>
                <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
                  <li>How did the action you took compare with your written reason for the trade?</li>
                  <li>Did you change your plan, and did you record why?</li>
                  <li>What information would help you review the decision later?</li>
                </ul>
              </>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
