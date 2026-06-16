// Single source of truth for appointment time slots, shared by the public
// booking form, the availability endpoint, and the POST validator. Keeping one
// list here is what lets the form, the slot-availability check, and the
// authoritative server-side conflict check agree on what a valid slot is.

export const CLINIC_TZ = "Asia/Kolkata";

// Canonical consulting slots. Order matters (rendered top-to-bottom).
export const TIME_SLOTS = [
  "09:00 AM - 10:00 AM",
  "10:00 AM - 11:00 AM",
  "11:00 AM - 12:00 PM",
  "12:00 PM - 01:00 PM",
  "05:00 PM - 06:00 PM",
  "06:00 PM - 07:00 PM",
  "07:00 PM - 08:00 PM",
  "08:00 PM - 08:30 PM",
] as const;

export type TimeSlot = (typeof TIME_SLOTS)[number];

// One patient per doctor per slot. Bump if the clinic ever runs parallel chairs.
export const SLOT_CAPACITY = 1;

// Statuses that occupy a slot. Cancelled/Completed free it up again.
export const BLOCKING_STATUSES = ["Pending", "Confirmed"] as const;

export function isValidSlot(time: string): time is TimeSlot {
  return (TIME_SLOTS as readonly string[]).includes(time);
}

// "YYYY-MM-DD" must be a real, well-formed calendar date.
export function isValidDateString(date: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  const [y, m, d] = date.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

// Today's date in the clinic timezone, as "YYYY-MM-DD" (en-CA yields ISO order).
export function todayInClinicTZ(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: CLINIC_TZ }).format(now);
}

// Minutes-since-midnight of the clinic-local wall clock right now.
export function nowMinutesInClinicTZ(now: Date = new Date()): number {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: CLINIC_TZ,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(now);
  const hh = Number(parts.find((p) => p.type === "hour")?.value ?? "0");
  const mm = Number(parts.find((p) => p.type === "minute")?.value ?? "0");
  return hh * 60 + mm;
}

// Parse the START time of a slot ("09:00 AM - 10:00 AM") to minutes-since-midnight.
export function slotStartMinutes(slot: string): number {
  const start = slot.split(" - ")[0]?.trim() ?? "";
  const m = start.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!m) return -1;
  let hour = Number(m[1]) % 12;
  if (m[3].toUpperCase() === "PM") hour += 12;
  return hour * 60 + Number(m[2]);
}

// True if the slot's start has already passed for the given date (clinic time).
// Only meaningful for "today"; future dates are never past, past dates always.
export function isSlotInPast(slot: string, date: string, now: Date = new Date()): boolean {
  const today = todayInClinicTZ(now);
  if (date > today) return false;
  if (date < today) return true;
  return slotStartMinutes(slot) <= nowMinutesInClinicTZ(now);
}
