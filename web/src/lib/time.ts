// Time helpers. Everything the user sees is in IST (I8); quarters use Indian FY labels (I4).
const TZ = "Asia/Kolkata";

const MON: Record<string, string> = {
  Jan: "01", Feb: "02", Mar: "03", Apr: "04", May: "05", Jun: "06",
  Jul: "07", Aug: "08", Sep: "09", Oct: "10", Nov: "11", Dec: "12",
};

/** NSE "12-Nov-2026 18:45:52" (IST) → ISO "2026-11-12T18:45:52+05:30" */
export function nseToIso(s: string): string {
  const m = /^(\d{2})-([A-Za-z]{3})-(\d{4}) (\d{2}:\d{2}:\d{2})/.exec(s || "");
  if (!m) return new Date().toISOString();
  return `${m[3]}-${MON[m[2]] ?? "01"}-${m[1]}T${m[4]}+05:30`;
}

/** YYYY-MM-DD of an instant, in IST */
export function istDate(t: string | number | Date): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(t));
}

export function istTime(t: string | number | Date): string {
  return new Intl.DateTimeFormat("en-GB", { timeZone: TZ, hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date(t));
}

/** "Fri 18:40", "yesterday 18:40", "today 09:12", "5 Nov" — real time anchors (fix #4) */
export function anchor(t: string | number | Date, now = Date.now()): string {
  const d = istDate(t);
  const today = istDate(now);
  const yest = istDate(now - 864e5);
  const time = istTime(t);
  if (d === today) return `today ${time}`;
  if (d === yest) return `yesterday ${time}`;
  const age = now - new Date(t).getTime();
  if (age < 6 * 864e5) {
    const wd = new Intl.DateTimeFormat("en-GB", { timeZone: TZ, weekday: "short" }).format(new Date(t));
    return `${wd} ${time}`;
  }
  return shortDate(t);
}

export function shortDate(t: string | number | Date): string {
  return new Intl.DateTimeFormat("en-GB", { timeZone: TZ, day: "numeric", month: "short" }).format(new Date(t));
}

export function weekday(dateYmd: string): string {
  return new Intl.DateTimeFormat("en-GB", { timeZone: "UTC", weekday: "short" }).format(new Date(dateYmd + "T00:00:00Z"));
}

/** "2026-09-30" → { q: "Q2 FY27", months: "Jul–Sep 2026" } */
export function fyQuarter(periodEnd: string): { q: string; months: string } {
  const [y, m] = periodEnd.split("-").map(Number);
  const qn = m >= 4 && m <= 6 ? 1 : m >= 7 && m <= 9 ? 2 : m >= 10 ? 3 : 4;
  const fy = (m >= 4 ? y + 1 : y) % 100;
  const names = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const start = names[(m - 3 + 12) % 12];
  return { q: `Q${qn} FY${String(fy).padStart(2, "0")}`, months: `${start}–${names[m - 1]} ${y}` };
}

/** Next scheduled brief after `now` given "HH:MM" times, weekdays only. */
export function nextBrief(times: string[], weekdaysOnly: boolean, now = Date.now()): string {
  for (let dayOff = 0; dayOff < 8; dayOff++) {
    const base = new Date(now + dayOff * 864e5);
    const ymd = istDate(base);
    const wd = new Date(ymd + "T00:00:00Z").getUTCDay();
    if (weekdaysOnly && (wd === 0 || wd === 6)) continue;
    for (const hm of [...times].sort()) {
      const at = new Date(`${ymd}T${hm}:00+05:30`).getTime();
      if (at > now) {
        const label = dayOff === 0 ? "today" : dayOff === 1 ? "tomorrow" : weekday(ymd);
        return `${label} ${hm}`;
      }
    }
  }
  return "";
}
