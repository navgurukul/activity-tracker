// Returns a Date object representing the IST business date (00:00:00 IST, with 7AM cutoff)
export function getISTBusinessDate(nowUTC: Date = new Date()): Date {
  // Convert UTC to IST (+5:30)
  const utc = nowUTC.getTime() + nowUTC.getTimezoneOffset() * 60000;
  const istOffset = 5.5 * 60 * 60000;
  const istNow = new Date(utc + istOffset);
  const cutoffHour = 7;
  let businessDate = new Date(istNow);
  if (istNow.getHours() < cutoffHour) {
    businessDate.setDate(businessDate.getDate() - 1);
  }
  businessDate.setHours(0, 0, 0, 0);
  return businessDate;
}
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
