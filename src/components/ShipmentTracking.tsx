import React, { useState } from 'react';
import { 
  Truck, 
  Package, 
  MapPin, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  Search, 
  Filter, 
  Printer, 
  ExternalLink,
  ChevronRight,
  User,
  Phone,
  FileCheck
} from 'lucide-react';
import { SalesOrder, OrderStatus } from '../types';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { formatCurrency, formatDateDisplay } from '../utils/taxCalculator';

interface ShipmentTrackingProps {
  onOpenDispatchModal: (order: SalesOrder) => void;
  onPrintDeliveryChallan: (order: SalesOrder) => void;
}

export const ShipmentTracking: React.FC<ShipmentTrackingProps> = ({
  onOpenDispatchModal,
  onPrintDeliveryChallan,
}) => {
  const { orders, updateOrderStatus } = useApp();
  const { permissions } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'DISPATCHED' | 'IN_TRANSIT' | 'DELIVERED'>('ALL');

  const filteredOrders = orders.filter((o) => {
    if (statusFilter === 'PENDING' && o.status !== 'Pending' && o.status !== 'Confirmed' && o.status !== 'Ready to Pack') return false;
    if (statusFilter === 'DISPATCHED' && o.status !== 'Dispatched') return false;
    if (statusFilter === 'IN_TRANSIT' && o.status !== 'In Transit') return false;
    if (statusFilter === 'DELIVERED' && o.status !== 'Delivered') return false;

    if (searchTerm && searchTerm.trim()) {
      const q = searchTerm.trim().toLowerCase();
      const matchParty = (o.partyName || '').toLowerCase().includes(q);
      const matchNo = (o.orderNo || '').toLowerCase().includes(q);
      const matchLR = (o.dispatchDetails?.lrDocketNo || '').toLowerCase().includes(q);
      const matchTrans = (o.dispatchDetails?.transporterName || '').toLowerCase().includes(q);
      if (!matchParty && !matchNo && !matchLR && !matchTrans) return false;
    }

    return true;
  });

  const awaitingDispatchCount = orders.filter(o => o.status === 'Pending' || o.status === 'Confirmed' || o.status === 'Ready to Pack').length;
  const dispatchedCount = orders.filter(o => o.status === 'Dispatched').length;
  const inTransitCount = orders.filter(o => o.status === 'In Transit').length;
  const deliveredCount = orders.filter(o => o.status === 'Delivered').length;

  return (
    <div className="max-w-7xl mx-auto py-5 px-3 sm:px-6 space-y-5">
      
      {/* Top Banner */}
      <div className="bg-slate-900 text-white rounded-xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-blue-600 rounded-lg">
              <Truck className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold tracking-tight">
              Shipment Tracking & Logistics Manager
            </h1>
          </div>
          <p className="text-xs text-slate-300 mt-1 max-w-xl">
            Track dispatches, record Lorry Receipt (LR) & Bilty numbers, monitor vehicle transit, and generate delivery challans.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setStatusFilter('ALL')}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-md text-xs font-semibold border border-slate-700 transition-colors"
          >
            All Shipments ({orders.length})
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <button
          onClick={() => setStatusFilter('PENDING')}
          className={`p-4 rounded-xl border text-left transition-all ${
            statusFilter === 'PENDING' ? 'bg-amber-500/10 border-amber-500 ring-2 ring-amber-500/20' : 'bg-white border-slate-200 hover:bg-slate-50'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">Awaiting Dispatch</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl font-bold font-mono text-slate-900 mt-1">{awaitingDispatchCount}</p>
          <span className="text-[11px] text-slate-500">Ready in godown</span>
        </button>

        <button
          onClick={() => setStatusFilter('DISPATCHED')}
          className={`p-4 rounded-xl border text-left transition-all ${
            statusFilter === 'DISPATCHED' ? 'bg-blue-500/10 border-blue-500 ring-2 ring-blue-500/20' : 'bg-white border-slate-200 hover:bg-slate-50'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">Dispatched</span>
            <Package className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-bold font-mono text-slate-900 mt-1">{dispatchedCount}</p>
          <span className="text-[11px] text-slate-500">Left warehouse</span>
        </button>

        <button
          onClick={() => setStatusFilter('IN_TRANSIT')}
          className={`p-4 rounded-xl border text-left transition-all ${
            statusFilter === 'IN_TRANSIT' ? 'bg-indigo-500/10 border-indigo-500 ring-2 ring-indigo-500/20' : 'bg-white border-slate-200 hover:bg-slate-50'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider">In Transit</span>
            <Truck className="w-4 h-4 text-indigo-600" />
          </div>
          <p className="text-2xl font-bold font-mono text-slate-900 mt-1">{inTransitCount}</p>
          <span className="text-[11px] text-slate-500">With transport vehicle</span>
        </button>

        <button
          onClick={() => setStatusFilter('DELIVERED')}
          className={`p-4 rounded-xl border text-left transition-all ${
            statusFilter === 'DELIVERED' ? 'bg-emerald-500/10 border-emerald-500 ring-2 ring-emerald-500/20' : 'bg-white border-slate-200 hover:bg-slate-50'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Delivered</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold font-mono text-slate-900 mt-1">{deliveredCount}</p>
          <span className="text-[11px] text-slate-500">Delivered & Verified</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by Party, Order No, LR / Docket No, Transporter..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-md text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        <div className="flex items-center space-x-2 text-xs font-semibold">
          <button
            onClick={() => setStatusFilter('ALL')}
            className={`px-3 py-1.5 rounded-md border ${statusFilter === 'ALL' ? 'bg-slate-900 text-white' : 'bg-white text-slate-700'}`}
          >
            All
          </button>
          <button
            onClick={() => setStatusFilter('PENDING')}
            className={`px-3 py-1.5 rounded-md border ${statusFilter === 'PENDING' ? 'bg-amber-600 text-white' : 'bg-white text-slate-700'}`}
          >
            Awaiting Dispatch
          </button>
          <button
            onClick={() => setStatusFilter('DISPATCHED')}
            className={`px-3 py-1.5 rounded-md border ${statusFilter === 'DISPATCHED' ? 'bg-blue-600 text-white' : 'bg-white text-slate-700'}`}
          >
            Dispatched
          </button>
          <button
            onClick={() => setStatusFilter('DELIVERED')}
            className={`px-3 py-1.5 rounded-md border ${statusFilter === 'DELIVERED' ? 'bg-emerald-600 text-white' : 'bg-white text-slate-700'}`}
          >
            Delivered
          </button>
        </div>
      </div>

      {/* Shipments List */}
      <div className="space-y-3">
        {filteredOrders.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
            <Truck className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <h3 className="font-bold text-slate-700 text-base">No Shipments Matching Filters</h3>
            <p className="text-xs text-slate-400 mt-1">Try adjusting the search query or shipment status filter.</p>
          </div>
        ) : (
          filteredOrders.map((ord) => {
            const hasDispatch = !!ord.dispatchDetails;
            return (
              <div
                key={ord.id}
                className="bg-white rounded-xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow p-4 sm:p-5"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-3.5">
                  
                  {/* Left: Order Info & Party */}
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2.5">
                      <span className="font-mono font-bold text-blue-700 text-base">
                        {ord.orderNo}
                      </span>
                      <span className="text-xs text-slate-400">•</span>
                      <span className="text-xs font-semibold text-slate-500">
                        Date: {formatDateDisplay(ord.orderDate)}
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        ord.status === 'Delivered' 
                          ? 'bg-emerald-100 text-emerald-800' 
                          : ord.status === 'Dispatched' || ord.status === 'In Transit'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {ord.status}
                      </span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-slate-900 text-base uppercase">
                        {ord.partyName}
                      </span>
                      {ord.partyPhone && (
                        <span className="text-xs text-slate-500 flex items-center space-x-1">
                          <Phone className="w-3 h-3" />
                          <span>{ord.partyPhone}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right: Bill & Actions */}
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="text-right pr-2">
                      <span className="text-xs text-slate-500 block">Grand Total</span>
                      <span className="text-base font-bold font-mono text-slate-900">
                        {permissions.canViewAmounts ? formatCurrency(ord.grandTotal) : '₹ ••••••'}
                      </span>
                    </div>

                    {permissions.canDispatch && (
                      <button
                        onClick={() => onOpenDispatchModal(ord)}
                        className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors shadow-xs cursor-pointer"
                      >
                        <Truck className="w-3.5 h-3.5" />
                        <span>{hasDispatch ? 'Update LR / Details' : 'Dispatch Now'}</span>
                      </button>
                    )}

                    <button
                      onClick={() => onPrintDeliveryChallan(ord)}
                      className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-medium flex items-center space-x-1.5 transition-colors cursor-pointer"
                      title="Print Delivery Challan"
                    >
                      <Printer className="w-3.5 h-3.5 text-slate-600" />
                      <span>Delivery Challan</span>
                    </button>
                  </div>
                </div>

                {/* Dispatch Details / Logistics Metadata Strip */}
                {hasDispatch ? (
                  <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3 rounded-lg text-xs border border-slate-100">
                    <div>
                      <span className="text-slate-400 block font-medium">Transporter</span>
                      <span className="font-semibold text-slate-800">{ord.dispatchDetails?.transporterName || '—'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-medium">LR / Docket No</span>
                      <span className="font-mono font-bold text-blue-700">{ord.dispatchDetails?.lrDocketNo || '—'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-medium">Vehicle / Tempo No</span>
                      <span className="font-mono font-semibold text-slate-800">{ord.dispatchDetails?.vehicleNo || '—'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-medium">Dispatch Date</span>
                      <span className="font-medium text-slate-800">
                        {ord.dispatchDetails?.dispatchDate ? formatDateDisplay(ord.dispatchDetails.dispatchDate) : '—'}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="mt-3 bg-amber-50/60 border border-amber-100 p-2.5 rounded-lg text-xs text-amber-800 flex items-center justify-between">
                    <span className="flex items-center space-x-1.5">
                      <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>Not dispatched yet. {permissions.canDispatch ? 'Click "Dispatch Now" to assign LR / Courier details.' : 'Pending dispatch by Logistics Manager.'}</span>
                    </span>
                    {permissions.canDispatch && (
                      <button
                        onClick={() => onOpenDispatchModal(ord)}
                        className="text-blue-700 hover:underline font-bold"
                      >
                        Assign LR & Dispatch &rarr;
                      </button>
                    )}
                  </div>
                )}

                {/* Items Summary in this shipment */}
                <div className="mt-2.5 flex flex-wrap items-center gap-2 text-xs text-slate-600">
                  <span className="font-semibold text-slate-700">Items:</span>
                  {ord.items.map((it, idx) => (
                    <span key={idx} className="bg-slate-100 px-2 py-0.5 rounded font-mono text-[11px] text-slate-800 border border-slate-200">
                      {it.itemCode} ({it.qty} {it.unit})
                    </span>
                  ))}
                  <span className="text-slate-400">•</span>
                  <span className="font-medium">Freight: ₹{ord.freightCharges}</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
