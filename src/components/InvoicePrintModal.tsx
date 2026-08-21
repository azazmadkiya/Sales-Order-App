import React, { useRef } from 'react';
import { X, Printer, Download, Truck, CheckCircle2, Lock } from 'lucide-react';
import { SalesOrder, BusinessProfile } from '../types';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { formatCurrency, formatDateDisplay } from '../utils/taxCalculator';
import { numberToIndianWords } from '../utils/numberToWords';

interface InvoicePrintModalProps {
  order: SalesOrder | null;
  mode?: 'TAX_INVOICE' | 'DELIVERY_CHALLAN';
  isOpen: boolean;
  onClose: () => void;
}

export const InvoicePrintModal: React.FC<InvoicePrintModalProps> = ({
  order,
  mode = 'TAX_INVOICE',
  isOpen,
  onClose,
}) => {
  const { businessProfile } = useApp();
  const { permissions } = useAuth();
  const printContentRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !order) return null;

  const handlePrint = () => {
    window.print();
  };

  const isDeliveryChallan = mode === 'DELIVERY_CHALLAN' || !permissions.canViewAmounts;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/75 backdrop-blur-xs overflow-y-auto print:p-0 print:bg-white">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full border border-slate-200 overflow-hidden my-4 flex flex-col print:border-none print:shadow-none print:my-0 print:rounded-none">
        
        {/* Action Bar (Hidden on print) */}
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-slate-200 bg-slate-900 text-white print:hidden">
          <div className="flex items-center space-x-2">
            <Printer className="w-5 h-5 text-blue-400" />
            <h3 className="font-bold text-sm sm:text-base">
              {isDeliveryChallan ? 'Delivery Challan & LR Dispatch Note' : 'Tax Invoice & Sales Voucher'}
            </h3>
            <span className="text-xs bg-slate-800 px-2 py-0.5 rounded text-slate-300 font-mono">
              {order.orderNo}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-md text-xs font-semibold flex items-center space-x-1.5 transition-colors shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save as PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-md text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Paper Document Container */}
        <div ref={printContentRef} className="p-6 sm:p-8 text-slate-900 font-sans text-xs sm:text-sm print:p-0 bg-white">
          
          {/* Header Title */}
          <div className="text-center border-b-2 border-slate-900 pb-2 mb-4">
            <h2 className="text-lg sm:text-xl font-black uppercase tracking-wider text-slate-950">
              {isDeliveryChallan ? 'DELIVERY CHALLAN / DISPATCH SLIP' : 'TAX INVOICE'}
            </h2>
            <p className="text-[10px] text-slate-500 font-medium tracking-tight">
              (Original for Recipient / Triplicate for Transporter)
            </p>
          </div>

          {/* Company & Voucher Meta Grid */}
          <div className="grid grid-cols-2 gap-4 border border-slate-300 rounded-lg p-3.5 mb-4">
            
            {/* Seller Company */}
            <div className="border-r border-slate-200 pr-3 space-y-1">
              <h3 className="font-extrabold text-sm sm:text-base text-slate-950 tracking-tight">
                {businessProfile.companyName}
              </h3>
              {businessProfile.tagline && (
                <p className="text-[11px] text-slate-600 font-medium">{businessProfile.tagline}</p>
              )}
              <p className="text-[11px] text-slate-700 leading-relaxed">
                {businessProfile.address}, {businessProfile.city}, {businessProfile.state} - {businessProfile.pincode}
              </p>
              <p className="text-[11px] text-slate-800">
                <strong>Phone:</strong> {businessProfile.phone} | <strong>Email:</strong> {businessProfile.email}
              </p>
              {businessProfile.gstin && (
                <p className="text-xs font-mono font-bold text-blue-900 mt-1">
                  GSTIN: {businessProfile.gstin}
                </p>
              )}
            </div>

            {/* Invoice & Dispatch Meta */}
            <div className="pl-1 space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500 font-semibold">Bill / Invoice No:</span>
                <span className="font-mono font-bold text-slate-950">{order.orderNo}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-semibold">Order Date:</span>
                <span className="font-medium">{formatDateDisplay(order.orderDate)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-semibold">Invoice Type:</span>
                <span className="font-bold text-blue-800">{order.invoiceType}</span>
              </div>
              {order.dispatchDetails?.transporterName && (
                <div className="flex justify-between border-t border-slate-200 pt-1 mt-1">
                  <span className="text-slate-500 font-semibold">Transporter:</span>
                  <span className="font-semibold text-slate-900">{order.dispatchDetails.transporterName}</span>
                </div>
              )}
              {order.dispatchDetails?.lrDocketNo && (
                <div className="flex justify-between">
                  <span className="text-slate-500 font-semibold">LR / Docket No:</span>
                  <span className="font-mono font-bold text-slate-900">{order.dispatchDetails.lrDocketNo}</span>
                </div>
              )}
              {order.dispatchDetails?.vehicleNo && (
                <div className="flex justify-between">
                  <span className="text-slate-500 font-semibold">Vehicle No:</span>
                  <span className="font-mono">{order.dispatchDetails.vehicleNo}</span>
                </div>
              )}
              {order.dispatchDetails?.ewayBillNo && (
                <div className="flex justify-between">
                  <span className="text-slate-500 font-semibold">E-Way Bill No:</span>
                  <span className="font-mono">{order.dispatchDetails.ewayBillNo}</span>
                </div>
              )}
            </div>
          </div>

          {/* Billed To & Shipped To */}
          <div className="grid grid-cols-2 gap-4 border border-slate-300 rounded-lg p-3.5 mb-4 bg-slate-50/50">
            <div className="border-r border-slate-200 pr-3 space-y-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Billed To (Customer):
              </span>
              <h4 className="font-extrabold text-sm text-slate-950 uppercase">
                {order.partyName}
              </h4>
              <p className="text-[11px] text-slate-700 leading-snug">
                {order.partyAddress || 'Address on record'}
              </p>
              <p className="text-[11px] text-slate-800">
                <strong>State:</strong> {order.partyState || 'Gujarat'} {order.partyPhone && `| Phone: ${order.partyPhone}`}
              </p>
              {order.partyGstin && (
                <p className="text-xs font-mono font-bold text-slate-900 mt-0.5">
                  GSTIN / UIN: {order.partyGstin}
                </p>
              )}
            </div>

            <div className="pl-1 space-y-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Shipped / Consigned To:
              </span>
              <h4 className="font-extrabold text-sm text-slate-950 uppercase">
                {order.dispatchDetails?.deliveryContactName || order.partyName}
              </h4>
              <p className="text-[11px] text-slate-700 leading-snug">
                {order.dispatchDetails?.shippingAddress || order.partyAddress || 'Same as billing'}
              </p>
              <p className="text-[11px] text-slate-800">
                <strong>Delivery Phone:</strong> {order.dispatchDetails?.deliveryPhone || order.partyPhone || '—'}
              </p>
            </div>
          </div>

          {/* Product Items Table */}
          <table className="w-full border border-slate-300 mb-4 text-xs">
            <thead className="bg-slate-200 text-slate-900 font-bold border-b border-slate-300 text-center">
              <tr>
                <th className="py-2 px-2 border-r border-slate-300 w-8">#</th>
                <th className="py-2 px-3 border-r border-slate-300 text-left">Item Code & Description</th>
                <th className="py-2 px-2 border-r border-slate-300 w-16">HSN</th>
                <th className="py-2 px-2 border-r border-slate-300 w-14">Qty2</th>
                <th className="py-2 px-2 border-r border-slate-300 w-14">Conv.</th>
                <th className="py-2 px-2 border-r border-slate-300 w-14">Qty</th>
                <th className="py-2 px-2 border-r border-slate-300 w-12">Unit</th>
                <th className="py-2 px-3 border-r border-slate-300 text-right w-20">Rate (₹)</th>
                <th className="py-2 px-3 border-r border-slate-300 text-right w-24">Taxable (₹)</th>
                <th className="py-2 px-2 border-r border-slate-300 w-12">GST%</th>
                <th className="py-2 px-3 text-right w-24">Amount (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {order.items.map((it, idx) => (
                <tr key={it.id || idx}>
                  <td className="py-2 px-2 text-center border-r border-slate-300 text-slate-500 font-mono">
                    {idx + 1}
                  </td>
                  <td className="py-2 px-3 border-r border-slate-300">
                    <span className="font-mono font-bold text-slate-950 uppercase">{it.itemCode}</span>
                    <p className="text-slate-600 text-[11px] font-medium">{it.itemName}</p>
                    {it.qty2 && it.conversion && it.conversion > 1 && (
                      <p className="text-[10px] text-amber-900 font-mono">
                        Pack: {it.qty2} {it.secondaryUnit || 'BAG'} &times; {it.conversion} = {it.qty} {it.unit}
                      </p>
                    )}
                  </td>
                  <td className="py-2 px-2 text-center border-r border-slate-300 font-mono text-slate-600">
                    {it.hsnCode || '—'}
                  </td>
                  <td className="py-2 px-2 text-center border-r border-slate-300 font-mono">
                    {it.qty2 !== undefined ? `${it.qty2} ${it.secondaryUnit || ''}` : '—'}
                  </td>
                  <td className="py-2 px-2 text-center border-r border-slate-300 font-mono">
                    {it.conversion !== undefined ? it.conversion : '1.000'}
                  </td>
                  <td className="py-2 px-2 text-center border-r border-slate-300 font-bold font-mono">
                    {it.qty}
                  </td>
                  <td className="py-2 px-2 text-center border-r border-slate-300 text-slate-600">
                    {it.unit}
                  </td>
                  <td className="py-2 px-3 text-right border-r border-slate-300 font-mono">
                    {permissions.canViewAmounts ? it.rate.toFixed(2) : '••••'}
                  </td>
                  <td className="py-2 px-3 text-right border-r border-slate-300 font-mono font-semibold">
                    {permissions.canViewAmounts ? it.taxableAmount.toFixed(2) : '••••'}
                  </td>
                  <td className="py-2 px-2 text-center border-r border-slate-300 font-semibold text-slate-700">
                    {permissions.canViewAmounts ? `${it.gstRate}%` : '—'}
                  </td>
                  <td className="py-2 px-3 text-right font-mono font-bold text-slate-950">
                    {permissions.canViewAmounts ? it.totalAmount.toFixed(2) : '••••'}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-slate-100 font-bold border-t border-slate-300">
              <tr>
                <td colSpan={3} className="py-2 px-3 text-left border-r border-slate-300">
                  Total Items: {order.totalItems}
                </td>
                <td colSpan={2} className="border-r border-slate-300 text-center text-[10px] text-slate-500">
                  Packaging Details
                </td>
                <td className="py-2 px-2 text-center border-r border-slate-300 font-mono">
                  {order.totalQty}
                </td>
                <td className="border-r border-slate-300"></td>
                <td className="py-2 px-3 text-right border-r border-slate-300">Subtotal</td>
                <td className="py-2 px-3 text-right border-r border-slate-300 font-mono">
                  {permissions.canViewAmounts ? order.subtotalTaxable.toFixed(2) : '••••••'}
                </td>
                <td className="border-r border-slate-300"></td>
                <td className="py-2 px-3 text-right font-mono font-bold">
                  {permissions.canViewAmounts ? (order.subtotalTaxable + order.totalTax).toFixed(2) : '••••••'}
                </td>
              </tr>
            </tfoot>
          </table>

          {/* Final Billing & Tax Summary Breakdown (Matching user format) */}
          <div className="grid grid-cols-12 gap-4 border border-slate-300 rounded-lg p-3.5 mb-4">
            
            {/* Left: Indian Amount in Words & Bank Details (7 cols) */}
            <div className="col-span-7 space-y-3 border-r border-slate-200 pr-3">
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  Amount Chargeable (in words):
                </span>
                <p className="font-bold text-slate-900 text-xs mt-0.5 italic">
                  {permissions.canViewAmounts ? numberToIndianWords(order.grandTotal) : '(Financial amounts masked under user access policy)'}
                </p>
              </div>

              {businessProfile.bankName && (
                <div className="bg-slate-50 p-2.5 rounded border border-slate-200 text-[11px] space-y-0.5">
                  <span className="font-bold text-slate-800 block uppercase tracking-tight text-[10px]">
                    Bank Transfer & NEFT / RTGS Details:
                  </span>
                  <p><strong>Bank:</strong> {businessProfile.bankName} | <strong>Branch:</strong> {businessProfile.branchName}</p>
                  <p><strong>A/c No:</strong> <span className="font-mono font-bold">{businessProfile.accountNumber}</span> | <strong>IFSC:</strong> <span className="font-mono font-bold">{businessProfile.ifscCode}</span></p>
                  {businessProfile.upiId && <p><strong>UPI ID:</strong> <span className="font-mono text-blue-700">{businessProfile.upiId}</span></p>}
                </div>
              )}

              {businessProfile.termsAndConditions && (
                <div className="text-[10px] text-slate-500">
                  <p className="font-bold text-slate-700 uppercase">Terms & Conditions:</p>
                  <p className="whitespace-pre-line leading-relaxed">{businessProfile.termsAndConditions}</p>
                </div>
              )}
            </div>

            {/* Right: Tax & Freight Calculations (5 cols) */}
            <div className="col-span-5 space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-600">Taxable Value:</span>
                <span className="font-mono font-semibold">{permissions.canViewAmounts ? order.subtotalTaxable.toFixed(2) : '••••••'}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-slate-600">Freight (Transport):</span>
                <span className="font-mono font-semibold">{permissions.canViewAmounts ? order.freightCharges.toFixed(2) : '••••••'}</span>
              </div>

              {order.invoiceType === 'GST' && (
                <>
                  <div className="flex justify-between text-slate-700">
                    <span>Central Tax (CGST):</span>
                    <span className="font-mono font-semibold">{permissions.canViewAmounts ? order.totalCgst.toFixed(2) : '••••••'}</span>
                  </div>
                  <div className="flex justify-between text-slate-700">
                    <span>State/UT Tax (SGST):</span>
                    <span className="font-mono font-semibold">{permissions.canViewAmounts ? order.totalSgst.toFixed(2) : '••••••'}</span>
                  </div>
                </>
              )}

              {order.invoiceType === 'IGST' && (
                <div className="flex justify-between text-slate-700">
                  <span>Integrated Tax (IGST):</span>
                  <span className="font-mono font-semibold">{permissions.canViewAmounts ? order.totalIgst.toFixed(2) : '••••••'}</span>
                </div>
              )}

              <div className="flex justify-between text-slate-600 pt-1 border-t border-slate-200">
                <span>Round Off:</span>
                <span className="font-mono font-semibold">
                  {permissions.canViewAmounts 
                    ? (order.roundOff >= 0 ? `+${order.roundOff.toFixed(2)}` : order.roundOff.toFixed(2))
                    : '••••'}
                </span>
              </div>

              <div className="flex justify-between text-sm sm:text-base font-black text-slate-950 pt-2 border-t-2 border-slate-900">
                <span>Grand Total:</span>
                <span className="font-mono text-emerald-800">
                  {permissions.canViewAmounts ? formatCurrency(order.grandTotal) : '₹ ••••••'}
                </span>
              </div>
            </div>
          </div>

          {/* Signatory Footer */}
          <div className="flex justify-between items-end pt-6 border-t border-slate-300 text-xs">
            <div>
              <p className="text-[10px] text-slate-400">Customer Receiver's Signature & Stamp</p>
              <div className="w-44 border-b border-slate-400 mt-8"></div>
            </div>

            <div className="text-right">
              <p className="font-bold text-slate-900 text-xs">For {businessProfile.companyName}</p>
              <div className="h-10"></div>
              <p className="text-slate-700 font-semibold">{businessProfile.signatureText || 'Authorised Signatory'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
