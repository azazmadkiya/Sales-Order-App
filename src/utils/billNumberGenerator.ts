import { SalesOrder } from '../types';

/**
 * Calculates the Indian Financial Year (April 1 to March 31) for a given date.
 * Returns format: "26-27", "19-20", "24-25", etc.
 */
export function getFinancialYear(dateInput?: string | Date | null): string {
  let date: Date;

  if (!dateInput) {
    date = new Date();
  } else if (typeof dateInput === 'string') {
    // Check if YYYY-MM-DD
    const parts = dateInput.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10); // 1-indexed (1 to 12)
      const day = parseInt(parts[2], 10);
      date = new Date(year, month - 1, day);
    } else {
      date = new Date(dateInput);
    }
  } else {
    date = dateInput;
  }

  if (isNaN(date.getTime())) {
    date = new Date();
  }

  const year = date.getFullYear();
  const month = date.getMonth(); // 0-indexed: 0 is Jan, 2 is Mar, 3 is Apr, 11 is Dec

  // Indian Financial Year:
  // Apr (3) to Dec (11) -> startYear = year, endYear = year + 1
  // Jan (0) to Mar (2) -> startYear = year - 1, endYear = year
  let startYear: number;
  let endYear: number;

  if (month >= 3) {
    startYear = year;
    endYear = year + 1;
  } else {
    startYear = year - 1;
    endYear = year;
  }

  const startYY = String(startYear).slice(-2);
  const endYY = String(endYear).slice(-2);

  return `${startYY}-${endYY}`;
}

/**
 * Returns human readable FY range description, e.g. "FY 2026-27 (Apr 2026 - Mar 2027)"
 */
export function getFinancialYearLabel(dateInput?: string | Date | null): string {
  const fy = getFinancialYear(dateInput);
  const parts = fy.split('-');
  const startYY = parts[0];
  const endYY = parts[1];
  
  // Approximate century (assumes 2000s)
  const startFull = `20${startYY}`;
  const endFull = `20${endYY}`;

  return `FY ${startFull}-${endYY} (1 Apr ${startFull} – 31 Mar ${endFull})`;
}

/**
 * Generates the next sequential Order / Bill Number in the series format:
 * Pattern: PREFIX/SERIAL/FY (e.g. "MOB/0/26-27", "MOB/1/26-27", "MOB/2/26-27")
 */
export function generateNextOrderNo(params: {
  orders: SalesOrder[];
  orderDate?: string;
  prefix?: string;
  startingNumber?: number;
}): string {
  const {
    orders = [],
    orderDate,
    prefix = 'MOB',
    startingNumber = 0,
  } = params;

  const fy = getFinancialYear(orderDate);
  const cleanPrefix = (prefix || 'MOB').trim().replace(/\/+$/, '');

  // Escape special regex characters in prefix
  const escapedPrefix = cleanPrefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const escapedFy = fy.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  // Regex pattern matching PREFIX/number/FY (case-insensitive)
  const pattern = new RegExp(`^${escapedPrefix}\\/(\\d+)\\/(${escapedFy})$`, 'i');

  let maxSeq = -1;

  for (const ord of orders) {
    if (!ord.orderNo) continue;
    const match = ord.orderNo.trim().match(pattern);
    if (match && match[1] !== undefined) {
      const seq = parseInt(match[1], 10);
      if (!isNaN(seq) && seq > maxSeq) {
        maxSeq = seq;
      }
    }
  }

  const nextSeq = maxSeq >= 0 ? maxSeq + 1 : startingNumber;

  return `${cleanPrefix}/${nextSeq}/${fy}`;
}

/**
 * Updates the Financial Year portion in an existing bill number if it matches the pattern:
 * e.g., "MOB/0/19-20" -> changes to "MOB/0/26-27" when date changes to 2026.
 */
export function updateOrderNoForNewDate(
  currentOrderNo: string,
  newOrderDate: string,
  prefix: string = 'MOB'
): string {
  if (!currentOrderNo) return currentOrderNo;
  const newFy = getFinancialYear(newOrderDate);
  const cleanPrefix = (prefix || 'MOB').trim().replace(/\/+$/, '');

  // If matches {PREFIX}/{NUMBER}/{ANY_FY_FORMAT}
  const match = currentOrderNo.trim().match(/^([A-Za-z0-9_-]+)\/(\d+)\/(\d{2}-\d{2})$/);
  if (match) {
    const matchedPrefix = match[1];
    const num = match[2];
    return `${matchedPrefix}/${num}/${newFy}`;
  }

  // If old format SO-2019/1025, convert to MOB/0/FY
  if (currentOrderNo.startsWith('SO-')) {
    return `${cleanPrefix}/0/${newFy}`;
  }

  return currentOrderNo;
}
