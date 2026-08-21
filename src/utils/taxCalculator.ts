import { InvoiceType, OrderItem } from '../types';

export interface CalculationResult {
  items: OrderItem[];
  totalItems: number;
  totalQty: number;
  subtotalTaxable: number;
  totalCgst: number;
  totalSgst: number;
  totalIgst: number;
  totalTax: number;
  freightCharges: number;
  freightGstRate: number;
  freightCgst: number;
  freightSgst: number;
  freightIgst: number;
  freightTotal: number;
  roundOff: number;
  grandTotal: number;
}

export function calculateOrderSummary(
  rawItems: Array<Partial<OrderItem>>,
  invoiceType: InvoiceType,
  freightCharges: number = 0,
  freightGstRate: number = 0,
  manualRoundOff?: number
): CalculationResult {
  let subtotalTaxable = 0;
  let totalCgst = 0;
  let totalSgst = 0;
  let totalIgst = 0;
  let totalQty = 0;

  const items: OrderItem[] = rawItems.map((item, index) => {
    const conversion = Number(item.conversion) || 1;
    let qty2 = item.qty2 !== undefined ? Number(item.qty2) : undefined;
    let qty = Number(item.qty) || 0;

    // If Qty2 and Conversion are specified but Qty is 0, auto-compute Qty = Qty2 * Conversion
    if (qty2 !== undefined && qty2 > 0 && conversion > 0 && qty === 0) {
      qty = Number((qty2 * conversion).toFixed(3));
    } else if (qty > 0 && conversion > 1 && qty2 === undefined) {
      qty2 = Number((qty / conversion).toFixed(2));
    }

    const rate = Number(item.rate) || 0;
    const discountPercent = Number(item.discountPercent) || 0;
    const grossAmount = qty * rate;
    const discountAmount = (grossAmount * discountPercent) / 100;
    const taxableAmount = grossAmount - discountAmount;
    const gstRate = Number(item.gstRate) || 0;

    let cgstAmount = 0;
    let sgstAmount = 0;
    let igstAmount = 0;

    if (invoiceType === 'GST') {
      // Intra-state (CGST + SGST)
      const halfRate = gstRate / 2;
      cgstAmount = (taxableAmount * halfRate) / 100;
      sgstAmount = (taxableAmount * halfRate) / 100;
    } else if (invoiceType === 'IGST') {
      // Inter-state (IGST)
      igstAmount = (taxableAmount * gstRate) / 100;
    } else {
      // Non-GST
      cgstAmount = 0;
      sgstAmount = 0;
      igstAmount = 0;
    }

    const itemTotal = taxableAmount + cgstAmount + sgstAmount + igstAmount;

    subtotalTaxable += taxableAmount;
    totalCgst += cgstAmount;
    totalSgst += sgstAmount;
    totalIgst += igstAmount;
    totalQty += qty;

    return {
      id: item.id || `item_${index}_${Date.now()}`,
      productId: item.productId || '',
      itemCode: item.itemCode || '',
      itemName: item.itemName || '',
      unit: item.unit || 'PCS',
      secondaryUnit: item.secondaryUnit || undefined,
      qty2: qty2 !== undefined ? qty2 : undefined,
      conversion: conversion !== 1 ? conversion : item.conversion || 1,
      qty,
      rate,
      discountPercent,
      discountAmount,
      taxableAmount: Number(taxableAmount.toFixed(2)),
      gstRate,
      cgstAmount: Number(cgstAmount.toFixed(2)),
      sgstAmount: Number(sgstAmount.toFixed(2)),
      igstAmount: Number(igstAmount.toFixed(2)),
      totalAmount: Number(itemTotal.toFixed(2)),
      photoUrl: item.photoUrl || '',
      hsnCode: item.hsnCode || '',
    };
  });

  // Freight calculation
  const validFreight = Number(freightCharges) || 0;
  const validFreightGstRate = Number(freightGstRate) || 0;
  let freightCgst = 0;
  let freightSgst = 0;
  let freightIgst = 0;

  if (validFreight > 0 && validFreightGstRate > 0) {
    if (invoiceType === 'GST') {
      freightCgst = (validFreight * (validFreightGstRate / 2)) / 100;
      freightSgst = (validFreight * (validFreightGstRate / 2)) / 100;
    } else if (invoiceType === 'IGST') {
      freightIgst = (validFreight * validFreightGstRate) / 100;
    }
  }

  const freightTotal = validFreight + freightCgst + freightSgst + freightIgst;

  const combinedCgst = totalCgst + freightCgst;
  const combinedSgst = totalSgst + freightSgst;
  const combinedIgst = totalIgst + freightIgst;
  const totalTax = combinedCgst + combinedSgst + combinedIgst;

  const unroundedGrandTotal = subtotalTaxable + totalTax + validFreight;
  
  let roundOff = 0;
  let grandTotal = 0;

  if (manualRoundOff !== undefined && !isNaN(manualRoundOff)) {
    roundOff = manualRoundOff;
    grandTotal = Number((unroundedGrandTotal + roundOff).toFixed(2));
  } else {
    const rounded = Math.round(unroundedGrandTotal);
    roundOff = Number((rounded - unroundedGrandTotal).toFixed(2));
    grandTotal = rounded;
  }

  return {
    items,
    totalItems: items.length,
    totalQty: Number(totalQty.toFixed(3)),
    subtotalTaxable: Number(subtotalTaxable.toFixed(2)),
    totalCgst: Number(combinedCgst.toFixed(2)),
    totalSgst: Number(combinedSgst.toFixed(2)),
    totalIgst: Number(combinedIgst.toFixed(2)),
    totalTax: Number(totalTax.toFixed(2)),
    freightCharges: Number(validFreight.toFixed(2)),
    freightGstRate: validFreightGstRate,
    freightCgst: Number(freightCgst.toFixed(2)),
    freightSgst: Number(freightSgst.toFixed(2)),
    freightIgst: Number(freightIgst.toFixed(2)),
    freightTotal: Number(freightTotal.toFixed(2)),
    roundOff,
    grandTotal,
  };
}

export function formatCurrency(amount: number | undefined | null): string {
  if (amount === undefined || amount === null || isNaN(amount)) return '₹0.00';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDateDisplay(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const [year, month, day] = dateStr.split('-');
    if (year && month && day) {
      return `${day}/${month}/${year}`;
    }
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      const dd = String(d.getDate()).padStart(2, '0');
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const yyyy = d.getFullYear();
      return `${dd}/${mm}/${yyyy}`;
    }
  } catch {
    // fallback
  }
  return dateStr;
}
