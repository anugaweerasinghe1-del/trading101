/** Approximate regular weekday schedules. Holidays and special sessions are excluded. */
export interface MarketSession {
  name: string;
  flag: string;
  tz: string;
  openH: number;
  closeH: number;
  breakStartH?: number;
  breakEndH?: number;
}

export const MARKET_SESSIONS: MarketSession[] = [
  { name: "NYSE", flag: "🇺🇸", tz: "America/New_York", openH: 9.5, closeH: 16 },
  { name: "LSE", flag: "🇬🇧", tz: "Europe/London", openH: 8, closeH: 16.5 },
  { name: "TSE", flag: "🇯🇵", tz: "Asia/Tokyo", openH: 9, closeH: 15.5, breakStartH: 11.5, breakEndH: 12.5 },
  { name: "SGX", flag: "🇸🇬", tz: "Asia/Singapore", openH: 9, closeH: 17, breakStartH: 12, breakEndH: 13 },
];

function localParts(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone, year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  }).formatToParts(date);
  const value = (type: string) => Number(parts.find(p => p.type === type)?.value);
  return { year: value("year"), month: value("month"), day: value("day"), hour: value("hour"), minute: value("minute") };
}

// Convert a local opening to an instant, recalculating the offset on the target
// date so a weekend daylight-saving change cannot shift Monday's opening.
function openingInstant(localDate: Date, hour: number, timeZone: string) {
  const wall = Date.UTC(localDate.getUTCFullYear(), localDate.getUTCMonth(), localDate.getUTCDate(), Math.floor(hour), Math.round((hour % 1) * 60));
  let instant = wall;
  for (let attempt = 0; attempt < 3; attempt++) {
    const p = localParts(new Date(instant), timeZone);
    const represented = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute);
    instant += wall - represented;
  }
  return instant;
}

export function sessionStatus(session: MarketSession, now = new Date()): { open: boolean; nextEventInMin: number } {
  const p = localParts(now, session.tz);
  const date = new Date(Date.UTC(p.year, p.month - 1, p.day));
  const weekday = date.getUTCDay();
  const hours = p.hour + p.minute / 60;
  const onBreak = session.breakStartH !== undefined && session.breakEndH !== undefined && hours >= session.breakStartH && hours < session.breakEndH;
  const open = !onBreak && weekday !== 0 && weekday !== 6 && hours >= session.openH && hours < session.closeH;
  if (open) {
    const nextClose = session.breakStartH !== undefined && hours < session.breakStartH ? session.breakStartH : session.closeH;
    return { open, nextEventInMin: Math.round((nextClose - hours) * 60) };
  }
  if (onBreak && weekday !== 0 && weekday !== 6) return { open: false, nextEventInMin: Math.round((session.breakEndH! - hours) * 60) };
  for (let offset = 0; offset < 8; offset++) {
    const target = new Date(date.getTime() + offset * 86400000);
    if ([0, 6].includes(target.getUTCDay())) continue;
    const opening = openingInstant(target, session.openH, session.tz);
    if (opening > now.getTime()) return { open: false, nextEventInMin: Math.ceil((opening - now.getTime()) / 60000) };
  }
  throw new Error("No regular weekday opening found");
}
