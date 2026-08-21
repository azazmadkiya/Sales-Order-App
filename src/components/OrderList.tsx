import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Plus, 
  Search, 
  Calendar, 
  Printer, 
  Truck, 
  Edit3, 
  Trash2, 
  Download, 
  CheckCircle2, 
  Clock, 
  Package, 
  Bell, 
  AlertCircle,
  Sparkles,
  ArrowRight,
  MoreVertical,
  Check,
  X,
  FileText,
  AlertTriangle,
  Phone,
  Share2
} from 'lucide-react';
import { SalesOrder, OrderStatus } from '../types';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { formatCurrency, formatDateDisplay } from '../utils/taxCalculator';
import { ReminderModal } from './ReminderModal';

interface OrderListProps {
  onAddNewOrder: () => void;
  onEditOrder: (order: SalesOrder) => void;
  onViewInvoice: (order: SalesOrder) => void;
  onOpenDispatch: (order: SalesOrder) => void;
}

interface ContextMenuState {
  order: SalesOrder;
  x: number;
  y: number;
}

export const OrderList: React.FC<OrderListProps> = ({
  onAddNewOrder,
  onEditOrder,
  onViewInvoice,
  onOpenDispatch,
}) => {
  const { orders, deleteOrder, updateOrderStatus, updateOrderReminder } = useApp();
  const { permissions } = useAuth();

  // Date Range Filters (e.g. FY 2019-20 to current)
  const [fromDate, setFromDate] = useState<string>('2019-04-01');
  const [toDate, setToDate] = useState<string>('2026-12-31');

  // Search & Filter Tabs
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'DISPATCHED' | 'REMINDERS'>('ALL');

  // Right-Click Context Menu State
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const contextMenuRef = useRef<HTMLDivElement | null>(null);

  // Active Reminder Modal State
  const [selectedOrderForReminder, setSelectedOrderForReminder] = useState<SalesOrder | null>(null);

  // Close context menu on outside click or escape
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(e.target as Node)) {
        setContextMenu(null);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setContextMenu(null);
    };

    window.addEventListener('click', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('click', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Handle Right-Click on Order Row
  const handleRowContextMenu = (e: React.MouseEvent, ord: SalesOrder) => {
    e.preventDefault();
    e.stopPropagation();

    // Calculate safe coordinates
    const clickX = e.clientX;
    const clickY = e.clientY;
    const windowW = window.innerWidth;
    const windowH = window.innerHeight;

    const posX = clickX + 220 > windowW ? windowW - 230 : clickX;
    const posY = clickY + 280 > windowH ? windowH - 290 : clickY;

    setContextMenu({
      order: ord,
      x: Math.max(10, posX),
      y: Math.max(10, posY),
    });
  };

  // Quick Date presets
  const handleSetPreset = (preset: 'ALL' | 'THIS_FY' | 'THIS_MONTH' | '2019_FY') => {
    const now = new Date();
    if (preset === 'ALL') {
      setFromDate('2019-01-01');
      setToDate('2030-12-31');
    } else if (preset === '2019_FY') {
      setFromDate('2019-04-01');
      setToDate('2020-03-31');
    } else if (preset === 'THIS_FY') {
      const year = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
      setFromDate(`${year}-04-01`);
      setToDate(`${year + 1}-03-31`);
    } else if (preset === 'THIS_MONTH') {
      const y = now.getFullYear();
      const m = String(now.getMonth() + 1).padStart(2, '0');
      setFromDate(`${y}-${m}-01`);
      const lastDay = new Date(y, now.getMonth() + 1, 0).getDate();
      setToDate(`${y}-${m}-${lastDay}`);
    }
  };

  // Filtered Orders Logic
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      // 1. Date Range Filter
      if (order.orderDate < fromDate || order.orderDate > toDate) {
        return false;
      }

      // 2. Status Filter
      if (statusFilter === 'PENDING') {
        if (order.status !== 'Pending' && order.status !== 'Confirmed' && order.status !== 'Ready to Pack') {
          return false;
        }
      } else if (statusFilter === 'DISPATCHED') {
        if (order.status !== 'Dispatched' && order.status !== 'Delivered' && order.status !== 'In Transit') {
          return false;
        }
      } else if (statusFilter === 'REMINDERS') {
        if (!order.reminderDate) {
          return false;
        }
      }

      // 3. Search query
      if (searchTerm && searchTerm.trim()) {
        const query = searchTerm.trim().toLowerCase();
        const matchParty = (order.partyName || '').toLowerCase().includes(query);
        const matchOrderNo = (order.orderNo || '').toLowerCase().includes(query);
        const matchPhone = (order.partyPhone || '').includes(query);
        const matchGst = (order.partyGstin || '').toLowerCase().includes(query);
        const matchReminder = (order.reminderNotes || '').toLowerCase().includes(query);
        const matchLr = (order.dispatchDetails?.lrDocketNo || '').toLowerCase().includes(query);
        const matchTrans = (order.dispatchDetails?.transporterName || '').toLowerCase().includes(query);
        const matchItem = (order.items || []).some(it => 
          (it?.itemName || '').toLowerCase().includes(query) || (it?.itemCode || '').toLowerCase().includes(query)
        );

        if (!matchParty && !matchOrderNo && !matchPhone && !matchGst && !matchReminder && !matchLr && !matchTrans && !matchItem) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime());
  }, [orders, fromDate, toDate, statusFilter, searchTerm]);

  // Overall Statistics
  const stats = useMemo(() => {
    let totalSales = 0;
    let totalPending = 0;
    let totalDispatched = 0;
    let totalReminders = 0;

    orders.forEach((o) => {
      totalSales += o.grandTotal || 0;
      if (o.status === 'Pending' || o.status === 'Confirmed' || o.status === 'Ready to Pack') {
        totalPending++;
      } else if (o.status === 'Dispatched' || o.status === 'In Transit' || o.status === 'Delivered') {
        totalDispatched++;
      }
      if (o.reminderDate) {
        totalReminders++;
      }
    });

    return { totalSales, totalPending, totalDispatched, totalReminders };
  }, [orders]);

  // Toggle order status between Pending and Dispatched
  const handleToggleStatus = (order: SalesOrder) => {
    const isCurrentlyDispatched = order.status === 'Dispatched' || order.status === 'In Transit' || order.status === 'Delivered';
    const newStatus: OrderStatus = isCurrentlyDispatched ? 'Pending' : 'Dispatched';
    updateOrderStatus(order.id, newStatus);
  };

  // Export to CSV - All Sales Voucher & Order Data
  const handleExportCSV = () => {
    const headers = [
      'Order / Voucher No',
      'Order Date',
      'Invoice Type',
      'Status',
      'Party Name',
      'Party Phone',
      'Party GSTIN',
      'Billing Address',
      'Party City',
      'Party State',
      'Items Detail Summary',
      'Total Item Types',
      'Total Quantity',
      'Subtotal Taxable (₹)',
      'Freight Charges (₹)',
      'Freight GST (₹)',
      'CGST (₹)',
      'SGST (₹)',
      'IGST (₹)',
      'Total GST (₹)',
      'Round Off (₹)',
      'Grand Total (₹)',
      'Transporter Name',
      'LR / Docket No',
      'Vehicle No',
      'E-Way Bill No',
      'Dispatch Date',
      'Delivery Address',
      'Delivery Contact',
      'Delivery Phone',
      'Follow-up / Reminder Date',
      'Reminder Time',
      'Priority',
      'Follow-up Notes',
      'Payment Terms',
      'Terms & Notes'
    ];

    const rows = filteredOrders.map(o => {
      const itemsSummary = o.items.map(it => 
        `${it.itemName || it.itemCode} [${it.qty} ${it.unit} @ ₹${it.rate} + ${it.gstRate}% GST = ₹${it.totalAmount}]`
      ).join('; ');

      return [
        `"${(o.orderNo || '').replace(/"/g, '""')}"`,
        o.orderDate || '',
        o.invoiceType || 'GST',
        o.status || 'Pending',
        `"${(o.partyName || '').replace(/"/g, '""')}"`,
        `"${(o.partyPhone || '').replace(/"/g, '""')}"`,
        `"${(o.partyGstin || '').replace(/"/g, '""')}"`,
        `"${(o.partyAddress || '').replace(/"/g, '""')}"`,
        `"${(o.partyCity || '').replace(/"/g, '""')}"`,
        `"${(o.partyState || '').replace(/"/g, '""')}"`,
        `"${itemsSummary.replace(/"/g, '""')}"`,
        o.items?.length || 0,
        o.totalQty || 0,
        o.subtotalTaxable || 0,
        o.freightCharges || 0,
        (o.freightCgst || 0) + (o.freightSgst || 0) + (o.freightIgst || 0),
        o.totalCgst || 0,
        o.totalSgst || 0,
        o.totalIgst || 0,
        o.totalTax || 0,
        o.roundOff || 0,
        o.grandTotal || 0,
        `"${(o.dispatchDetails?.transporterName || '').replace(/"/g, '""')}"`,
        `"${(o.dispatchDetails?.lrDocketNo || '').replace(/"/g, '""')}"`,
        `"${(o.dispatchDetails?.vehicleNo || '').replace(/"/g, '""')}"`,
        `"${(o.dispatchDetails?.ewayBillNo || '').replace(/"/g, '""')}"`,
        o.dispatchDetails?.dispatchDate || '',
        `"${(o.dispatchDetails?.shippingAddress || '').replace(/"/g, '""')}"`,
        `"${(o.dispatchDetails?.deliveryContactName || '').replace(/"/g, '""')}"`,
        `"${(o.dispatchDetails?.deliveryPhone || '').replace(/"/g, '""')}"`,
        o.reminderDate || '',
        o.reminderTime || '',
        o.priority || 'Normal',
        `"${(o.reminderNotes || '').replace(/"/g, '""')}"`,
        `"${(o.paymentTerms || '').replace(/"/g, '""')}"`,
        `"${(o.notes || '').replace(/"/g, '""')}"`
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Sales_Voucher_Orders_All_Data_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-7xl mx-auto py-3 sm:py-5 px-2.5 sm:px-6 space-y-4">
      
      {/* Top Banner & Heading Bar */}
      <div className="bg-slate-900 text-white rounded-xl sm:rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <div className="p-1.5 sm:p-2 bg-blue-600 rounded-lg">
              <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <h1 className="text-lg sm:text-xl font-bold tracking-tight">
              Sales Orders
            </h1>
          </div>
        </div>

        <div className="flex items-center space-x-2 self-stretch sm:self-auto justify-end flex-wrap gap-2">
          <button
            onClick={handleExportCSV}
            title="Export all sales voucher and order data to Excel/CSV"
            className="flex-1 sm:flex-none flex items-center justify-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 px-3.5 py-2 rounded-lg text-xs font-semibold border border-slate-700 transition-colors cursor-pointer whitespace-nowrap shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Sales Voucher / Order ALL DATA</span>
          </button>
          {permissions.canCreateOrder && (
            <button
              onClick={onAddNewOrder}
              className="flex-1 sm:flex-none flex items-center justify-center space-x-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-2 rounded-lg text-xs font-bold shadow-sm transition-all active:scale-95 cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add Order</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Container */}
      <div className="bg-white border border-slate-200 p-3 sm:p-4 rounded-xl shadow-xs space-y-3.5">
        
        {/* Date Filter & Search Bar */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
          
          {/* From & To Date Controls */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <div className="flex items-center space-x-1.5">
              <label className="text-xs font-bold text-slate-800">From</label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="bg-white border border-slate-300 rounded px-2 py-1 text-xs font-medium text-slate-900 outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center space-x-1.5">
              <label className="text-xs font-bold text-slate-800">To</label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="bg-white border border-slate-300 rounded px-2 py-1 text-xs font-medium text-slate-900 outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* Quick Presets */}
            <div className="flex items-center space-x-1 text-[11px]">
              <button
                onClick={() => handleSetPreset('ALL')}
                className="px-2 py-1 bg-white border border-slate-300 rounded text-slate-700 hover:bg-slate-100 font-medium"
              >
                All
              </button>
              <button
                onClick={() => handleSetPreset('THIS_FY')}
                className="px-2 py-1 bg-white border border-slate-300 rounded text-slate-700 hover:bg-slate-100 font-medium"
              >
                This FY
              </button>
              <button
                onClick={() => handleSetPreset('2019_FY')}
                className="px-2 py-1 bg-white border border-slate-300 rounded text-slate-700 hover:bg-slate-100 font-medium hidden sm:inline"
              >
                2019-20
              </button>
            </div>
          </div>

          {/* Search bar */}
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search Party, Order No, Reminder, LR..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>

        {/* Color-Coded Status Filter Tabs (Horizontal scroll on mobile) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-semibold scrollbar-none">
          <button
            onClick={() => setStatusFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg border transition-all flex items-center space-x-1.5 shrink-0 ${
              statusFilter === 'ALL'
                ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
            }`}
          >
            <span>All Orders</span>
            <span className="bg-slate-700 text-slate-100 px-1.5 py-0.2 rounded-full text-[10px]">
              {orders.length}
            </span>
          </button>

          {/* Red Pending Filter Button */}
          <button
            onClick={() => setStatusFilter('PENDING')}
            className={`px-3 py-1.5 rounded-lg border transition-all flex items-center space-x-1.5 shrink-0 ${
              statusFilter === 'PENDING'
                ? 'bg-rose-600 text-white border-rose-700 shadow-md ring-2 ring-rose-300'
                : 'bg-rose-50 text-rose-700 border-rose-300 hover:bg-rose-100'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            <span>🔴 Pending ({stats.totalPending})</span>
          </button>

          {/* Green Dispatched Filter Button */}
          <button
            onClick={() => setStatusFilter('DISPATCHED')}
            className={`px-3 py-1.5 rounded-lg border transition-all flex items-center space-x-1.5 shrink-0 ${
              statusFilter === 'DISPATCHED'
                ? 'bg-emerald-600 text-white border-emerald-700 shadow-md ring-2 ring-emerald-300'
                : 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>🟢 Dispatched ({stats.totalDispatched})</span>
          </button>

          {/* Reminder Filter Button */}
          <button
            onClick={() => setStatusFilter('REMINDERS')}
            className={`px-3 py-1.5 rounded-lg border transition-all flex items-center space-x-1.5 shrink-0 ${
              statusFilter === 'REMINDERS'
                ? 'bg-amber-600 text-white border-amber-700 shadow-md ring-2 ring-amber-300'
                : 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100'
            }`}
          >
            <Bell className="w-3.5 h-3.5 text-amber-600" />
            <span>🔔 Follow-ups ({stats.totalReminders})</span>
          </button>
        </div>

        {/* Metric Summary Ribbon */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 pt-1">
          <div className="bg-rose-50 border-2 border-rose-200 rounded-lg p-2 sm:p-2.5 text-rose-950">
            <span className="text-[10px] sm:text-[11px] font-extrabold text-rose-700 block uppercase tracking-wider flex items-center justify-between">
              <span>🔴 Pending</span>
              <Clock className="w-3.5 h-3.5 text-rose-600" />
            </span>
            <span className="text-base sm:text-lg font-black font-mono text-rose-800">{stats.totalPending} Orders</span>
          </div>

          <div className="bg-emerald-50 border-2 border-emerald-200 rounded-lg p-2 sm:p-2.5 text-emerald-950">
            <span className="text-[10px] sm:text-[11px] font-extrabold text-emerald-700 block uppercase tracking-wider flex items-center justify-between">
              <span>🟢 Dispatched</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            </span>
            <span className="text-base sm:text-lg font-black font-mono text-emerald-800">{stats.totalDispatched} Orders</span>
          </div>

          <div className="bg-amber-50 border-2 border-amber-200 rounded-lg p-2 sm:p-2.5 text-amber-950">
            <span className="text-[10px] sm:text-[11px] font-extrabold text-amber-800 block uppercase tracking-wider flex items-center justify-between">
              <span>🔔 Follow-ups</span>
              <Bell className="w-3.5 h-3.5 text-amber-600" />
            </span>
            <span className="text-base sm:text-lg font-black font-mono text-amber-800">{stats.totalReminders} Set</span>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 sm:p-2.5 text-blue-950">
            <span className="text-[10px] sm:text-[11px] font-bold text-blue-800 block uppercase tracking-wider">Total Sales</span>
            <span className="text-base sm:text-lg font-black font-mono text-blue-900 truncate block">
              {permissions.canViewAmounts ? formatCurrency(stats.totalSales) : '₹ ••••••'}
            </span>
          </div>
        </div>

        {/* 1. MOBILE CARD VIEW (Visible on mobile screens < 768px) */}
        <div className="block md:hidden space-y-3 pt-1">
          {filteredOrders.length === 0 ? (
            <div className="py-10 text-center text-slate-500 bg-slate-50 rounded-xl border border-slate-200 p-4">
              <AlertCircle className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="font-semibold text-slate-700 text-sm">No Sales Orders found</p>
              <p className="text-xs text-slate-400 mt-1">Adjust filters or click "+ Add Order"</p>
            </div>
          ) : (
            filteredOrders.map((ord) => {
              const isDispatched = ord.status === 'Dispatched' || ord.status === 'In Transit' || ord.status === 'Delivered';
              return (
                <div 
                  key={ord.id}
                  className={`bg-white border rounded-xl p-3.5 shadow-xs transition-all space-y-2.5 ${
                    isDispatched ? 'border-emerald-200 hover:border-emerald-300' : 'border-rose-200 hover:border-rose-300'
                  }`}
                >
                  {/* Card Header: Order No + Date + Status */}
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <div className="flex items-center space-x-1.5">
                      <span className="font-mono font-bold text-sm text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        {ord.orderNo}
                      </span>
                      <span className="text-[11px] text-slate-500 font-medium">
                        {formatDateDisplay(ord.orderDate)}
                      </span>
                    </div>

                    <button
                      onClick={() => handleToggleStatus(ord)}
                      className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold flex items-center space-x-1 border transition-transform active:scale-95 ${
                        isDispatched 
                          ? 'bg-emerald-100 text-emerald-900 border-emerald-300' 
                          : 'bg-rose-100 text-rose-900 border-rose-300'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${isDispatched ? 'bg-emerald-600' : 'bg-rose-600 animate-ping'}`} />
                      <span>{isDispatched ? '🟢 Dispatched' : '🔴 Pending'}</span>
                    </button>
                  </div>

                  {/* Card Body: Party & Amount */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-slate-900 text-sm truncate">{ord.partyName}</p>
                      <div className="flex items-center space-x-2 text-xs text-slate-500 mt-0.5">
                        <span>{ord.items.length} Item{ord.items.length > 1 ? 's' : ''}</span>
                        {ord.partyPhone && (
                          <span className="flex items-center space-x-0.5 text-slate-600">
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span>{ord.partyPhone}</span>
                          </span>
                        )}
                      </div>
                      {ord.items[0] && (
                        <p className="text-[11px] text-slate-600 font-medium truncate mt-0.5">
                          {ord.items[0].itemName} ({ord.items[0].qty} {ord.items[0].unit})
                        </p>
                      )}
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[10px] text-slate-400 font-medium block">Total Amount</span>
                      <span className="text-base font-black font-mono text-slate-900 block">
                        {permissions.canViewAmounts ? formatCurrency(ord.grandTotal) : '₹ ••••••'}
                      </span>
                    </div>
                  </div>

                  {/* Follow-up / LR Badge if exists */}
                  {(ord.reminderDate || ord.dispatchDetails?.lrDocketNo) && (
                    <div className="bg-slate-50 p-2 rounded-lg border border-slate-200 flex flex-wrap items-center justify-between gap-1.5 text-[11px]">
                      {ord.reminderDate && (
                        <span className="text-amber-800 font-semibold flex items-center space-x-1">
                          <Bell className="w-3 h-3 text-amber-600" />
                          <span>Follow-up: {formatDateDisplay(ord.reminderDate)}</span>
                        </span>
                      )}
                      {ord.dispatchDetails?.lrDocketNo && (
                        <span className="text-blue-800 font-mono font-medium">
                          LR: {ord.dispatchDetails.lrDocketNo} ({ord.dispatchDetails.transporterName || 'Transporter'})
                        </span>
                      )}
                    </div>
                  )}

                  {/* Action Buttons Row */}
                  <div className="flex items-center justify-between gap-1.5 pt-1 border-t border-slate-100">
                    <button
                      onClick={() => onViewInvoice(ord)}
                      className="flex-1 py-1.5 px-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-semibold border border-blue-200 flex items-center justify-center space-x-1 transition-colors"
                    >
                      <Printer className="w-3.5 h-3.5 text-blue-600" />
                      <span>Invoice</span>
                    </button>

                    {permissions.canDispatch && (
                      <button
                        onClick={() => onOpenDispatch(ord)}
                        className="flex-1 py-1.5 px-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-xs font-semibold border border-emerald-200 flex items-center justify-center space-x-1 transition-colors"
                      >
                        <Truck className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Dispatch</span>
                      </button>
                    )}

                    <button
                      onClick={() => setSelectedOrderForReminder(ord)}
                      className="p-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg border border-amber-200 transition-colors"
                      title="Set Reminder"
                    >
                      <Bell className="w-3.5 h-3.5" />
                    </button>

                    {permissions.canEditOrder && (
                      <button
                        onClick={() => onEditOrder(ord)}
                        className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg border border-slate-300 transition-colors"
                        title="Edit Order"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {permissions.canDeleteOrder && (
                      <button
                        onClick={() => {
                          if (confirm(`Delete Order ${ord.orderNo}?`)) {
                            deleteOrder(ord.id);
                          }
                        }}
                        className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Delete Order"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* 2. DESKTOP TABLE VIEW (Visible on md: >= 768px screens) */}
        <div className="hidden md:block border border-slate-300 rounded-xl overflow-x-auto shadow-xs">
          <table className="w-full text-left text-xs sm:text-sm select-none">
            <thead className="bg-slate-200 text-slate-900 font-bold border-b border-slate-300">
              <tr>
                <th className="py-2.5 px-3 whitespace-nowrap">Date</th>
                <th className="py-2.5 px-3 whitespace-nowrap">Order No</th>
                <th className="py-2.5 px-3 whitespace-nowrap">Account Name (Party)</th>
                <th className="py-2.5 px-3 whitespace-nowrap text-center">Items / Qty</th>
                <th className="py-2.5 px-3 whitespace-nowrap text-right">Total Amount</th>
                <th className="py-2.5 px-3 whitespace-nowrap text-center">Dispatch Status</th>
                <th className="py-2.5 px-3 whitespace-nowrap text-center">Follow-up Reminder</th>
                <th className="py-2.5 px-3 whitespace-nowrap text-right">Quick Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    <AlertCircle className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                    <p className="font-semibold text-slate-700 text-base">No Sales Orders found</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Adjust date or status filters, or click "+ Add Sales Order" to collect a new voucher.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredOrders.map((ord) => {
                  const isDispatched = ord.status === 'Dispatched' || ord.status === 'In Transit' || ord.status === 'Delivered';
                  const isPending = ord.status === 'Pending' || ord.status === 'Confirmed' || ord.status === 'Ready to Pack';

                  return (
                    <tr 
                      key={ord.id} 
                      onContextMenu={(e) => handleRowContextMenu(e, ord)}
                      className={`hover:bg-blue-50/40 transition-colors group cursor-context-menu ${
                        isDispatched ? 'bg-emerald-50/20' : 'bg-rose-50/20'
                      }`}
                    >
                      {/* Date */}
                      <td className="py-2.5 px-3 whitespace-nowrap font-medium text-slate-800">
                        {formatDateDisplay(ord.orderDate)}
                      </td>

                      {/* Order No */}
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-300">
                          {ord.orderNo}
                        </span>
                      </td>

                      {/* Party Name */}
                      <td className="py-2.5 px-3 font-semibold text-slate-900 max-w-[220px] truncate">
                        <div>
                          <span>{ord.partyName}</span>
                          {ord.partyPhone && (
                            <span className="text-[11px] text-slate-500 font-normal ml-1.5">
                              ({ord.partyPhone})
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Items / Qty */}
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        <span className="bg-slate-100 text-slate-800 text-xs px-2 py-0.5 rounded-full font-mono font-semibold border border-slate-300">
                          {ord.items.length} items ({ord.items.reduce((s, it) => s + (it.qty || 0), 0)} {ord.items[0]?.unit || 'KG'})
                        </span>
                      </td>

                      {/* Total Amount */}
                      <td className="py-2.5 px-3 text-right whitespace-nowrap font-mono font-bold text-slate-900">
                        {permissions.canViewAmounts ? formatCurrency(ord.grandTotal) : '₹ ••••••'}
                      </td>

                      {/* Dispatch Status (Toggle Pill) */}
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        {permissions.canDispatch ? (
                          <button
                            onClick={() => handleToggleStatus(ord)}
                            className={`px-3 py-1 rounded-full text-xs font-bold inline-flex items-center space-x-1.5 shadow-2xs border transition-all cursor-pointer ${
                              isDispatched
                                ? 'bg-emerald-100 text-emerald-900 border-emerald-300 hover:bg-emerald-200'
                                : 'bg-rose-100 text-rose-900 border-rose-300 hover:bg-rose-200'
                            }`}
                            title="Click to toggle status between Pending & Dispatched"
                          >
                            <span className={`w-2 h-2 rounded-full ${isDispatched ? 'bg-emerald-600' : 'bg-rose-600 animate-pulse'}`} />
                            <span>{isDispatched ? 'Dispatched (OK)' : 'Pending Dispatch'}</span>
                          </button>
                        ) : (
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-bold inline-flex items-center space-x-1.5 shadow-2xs border ${
                              isDispatched
                                ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                                : 'bg-rose-100 text-rose-900 border-rose-300'
                            }`}
                          >
                            <span className={`w-2 h-2 rounded-full ${isDispatched ? 'bg-emerald-600' : 'bg-rose-600'}`} />
                            <span>{isDispatched ? 'Dispatched' : 'Pending'}</span>
                          </span>
                        )}
                      </td>

                      {/* Follow-up Reminder */}
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        {ord.reminderDate ? (
                          <button
                            onClick={() => setSelectedOrderForReminder(ord)}
                            className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300 hover:bg-amber-200 transition-colors"
                            title={ord.reminderNotes || 'Follow-up set'}
                          >
                            <Bell className="w-3 h-3 text-amber-600" />
                            <span>{formatDateDisplay(ord.reminderDate)}</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => setSelectedOrderForReminder(ord)}
                            className="text-slate-400 hover:text-amber-600 text-xs px-2 py-0.5 rounded hover:bg-amber-50 transition-colors"
                            title="Set Follow-up Reminder"
                          >
                            + Set Reminder
                          </button>
                        )}
                      </td>

                      {/* Quick Actions */}
                      <td className="py-2.5 px-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end space-x-1">
                          <button
                            onClick={() => onViewInvoice(ord)}
                            className="p-1.5 text-blue-600 hover:bg-blue-100 rounded transition-colors"
                            title="Print Tax Invoice"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                          {permissions.canDispatch && (
                            <button
                              onClick={() => onOpenDispatch(ord)}
                              className="p-1.5 text-emerald-600 hover:bg-emerald-100 rounded transition-colors"
                              title="Log Dispatch / LR Docket"
                            >
                              <Truck className="w-4 h-4" />
                            </button>
                          )}
                          {permissions.canEditOrder && (
                            <button
                              onClick={() => onEditOrder(ord)}
                              className="p-1.5 text-slate-600 hover:bg-slate-100 rounded transition-colors"
                              title="Edit Order"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                          )}
                          {permissions.canDeleteOrder && (
                            <button
                              onClick={() => {
                                if (confirm(`Are you sure you want to delete order ${ord.orderNo}?`)) {
                                  deleteOrder(ord.id);
                                }
                              }}
                              className="p-1.5 text-rose-500 hover:bg-rose-100 rounded transition-colors"
                              title="Delete Order"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Right-Click Context Menu */}
      {contextMenu && (
        <div
          ref={contextMenuRef}
          style={{ top: contextMenu.y, left: contextMenu.x }}
          className="fixed z-50 w-56 bg-slate-900 text-white rounded-xl shadow-2xl py-1.5 border border-slate-700 text-xs animate-in fade-in duration-100"
        >
          <div className="px-3 py-1.5 border-b border-slate-800 text-slate-400 font-mono">
            Order: <strong className="text-slate-200">{contextMenu.order.orderNo}</strong>
          </div>

          {permissions.canDispatch && (
            <>
              <button
                onClick={() => {
                  updateOrderStatus(contextMenu.order.id, 'Dispatched');
                  setContextMenu(null);
                }}
                className="w-full text-left px-3 py-2 text-emerald-400 hover:bg-slate-800 flex items-center space-x-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Mark as Dispatched (Green)</span>
              </button>

              <button
                onClick={() => {
                  updateOrderStatus(contextMenu.order.id, 'Pending');
                  setContextMenu(null);
                }}
                className="w-full text-left px-3 py-2 text-rose-400 hover:bg-slate-800 flex items-center space-x-2"
              >
                <Clock className="w-4 h-4" />
                <span>Mark as Pending (Red)</span>
              </button>
            </>
          )}

          <button
            onClick={() => {
              const ord = contextMenu.order;
              setContextMenu(null);
              setSelectedOrderForReminder(ord);
            }}
            className="w-full text-left px-3 py-2 text-amber-400 hover:bg-slate-800 flex items-center space-x-2"
          >
            <Bell className="w-4 h-4" />
            <span>Set Follow-up Reminder</span>
          </button>

          <div className="border-t border-slate-800 my-1"></div>

          <button
            onClick={() => {
              const ord = contextMenu.order;
              setContextMenu(null);
              onViewInvoice(ord);
            }}
            className="w-full text-left px-3 py-2 text-slate-200 hover:bg-slate-800 flex items-center space-x-2"
          >
            <Printer className="w-4 h-4 text-blue-400" />
            <span>View / Print Invoice</span>
          </button>

          {permissions.canDispatch && (
            <button
              onClick={() => {
                const ord = contextMenu.order;
                setContextMenu(null);
                onOpenDispatch(ord);
              }}
              className="w-full text-left px-3 py-2 text-slate-200 hover:bg-slate-800 flex items-center space-x-2"
            >
              <Truck className="w-4 h-4 text-emerald-400" />
              <span>Dispatch & LR Docket</span>
            </button>
          )}

          {permissions.canEditOrder && (
            <button
              onClick={() => {
                const ord = contextMenu.order;
                setContextMenu(null);
                onEditOrder(ord);
              }}
              className="w-full text-left px-3 py-2 text-slate-200 hover:bg-slate-800 flex items-center space-x-2"
            >
              <Edit3 className="w-4 h-4 text-slate-400" />
              <span>Edit Order</span>
            </button>
          )}
        </div>
      )}

      {/* Reminder Modal */}
      {selectedOrderForReminder && (
        <ReminderModal
          order={selectedOrderForReminder}
          isOpen={Boolean(selectedOrderForReminder)}
          onClose={() => setSelectedOrderForReminder(null)}
          onSaveReminder={async (orderId, reminderData) => {
            await updateOrderReminder(orderId, reminderData);
            setSelectedOrderForReminder(null);
          }}
        />
      )}
    </div>
  );
};
