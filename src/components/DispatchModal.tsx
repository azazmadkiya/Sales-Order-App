import React, { useState } from 'react';
import { 
  X, 
  Truck, 
  Package, 
  UserCheck, 
  PlusCircle, 
  FileText, 
  CheckCircle2, 
  MapPin, 
  Phone, 
  Calendar,
  AlertCircle,
  Building2
} from 'lucide-react';
import { SalesOrder, DispatchDetails, OrderStatus } from '../types';
import { useApp } from '../context/AppContext';
import { formatCurrency, formatDateDisplay } from '../utils/taxCalculator';

interface DispatchModalProps {
  order: SalesOrder | null;
  isOpen: boolean;
  onClose: () => void;
  onPrintDeliveryChallan?: (order: SalesOrder) => void;
}

export const DispatchModal: React.FC<DispatchModalProps> = ({
  order,
  isOpen,
  onClose,
  onPrintDeliveryChallan,
}) => {
  const { 
    dispatchOrder, 
    updateOrderStatus, 
    parties, 
    products, 
    savePartyFromOrder, 
    saveProductFromOrder 
  } = useApp();

  const [transporterName, setTransporterName] = useState(
    order?.dispatchDetails?.transporterName || 'VRL Logistics'
  );
  const [lrDocketNo, setLrDocketNo] = useState(
    order?.dispatchDetails?.lrDocketNo || `LR-${Math.floor(100000 + Math.random() * 900000)}`
  );
  const [vehicleNo, setVehicleNo] = useState(
    order?.dispatchDetails?.vehicleNo || 'GJ-01-DX-4412'
  );
  const [ewayBillNo, setEwayBillNo] = useState(
    order?.dispatchDetails?.ewayBillNo || ''
  );
  const [dispatchDate, setDispatchDate] = useState(
    order?.dispatchDetails?.dispatchDate || new Date().toISOString().split('T')[0]
  );
  const [shippingAddress, setShippingAddress] = useState(
    order?.dispatchDetails?.shippingAddress || order?.partyAddress || ''
  );
  const [deliveryContactName, setDeliveryContactName] = useState(
    order?.dispatchDetails?.deliveryContactName || order?.partyName || ''
  );
  const [deliveryPhone, setDeliveryPhone] = useState(
    order?.dispatchDetails?.deliveryPhone || order?.partyPhone || ''
  );
  const [dispatchNotes, setDispatchNotes] = useState(
    order?.dispatchDetails?.dispatchNotes || ''
  );
  const [targetStatus, setTargetStatus] = useState<OrderStatus>(
    order?.status === 'Pending' || order?.status === 'Confirmed' ? 'Dispatched' : (order?.status || 'Dispatched')
  );

  // States for Party/Product master save confirmation
  const [partySavedFeedback, setPartySavedFeedback] = useState(false);
  const [productSavedFeedback, setProductSavedFeedback] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !order) return null;

  // Check if current party exists in Master
  const isPartyInMaster = parties.some(
    p => p.partyName.trim().toLowerCase() === order.partyName.trim().toLowerCase()
  );

  const handleSavePartyToMaster = async () => {
    try {
      await savePartyFromOrder(
        order.partyName,
        order.partyPhone,
        order.partyGstin,
        order.partyAddress,
        order.partyState
      );
      setPartySavedFeedback(true);
      setTimeout(() => setPartySavedFeedback(false), 3000);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveProductToMaster = async (itemCode: string, name: string, rate: number, unit: string) => {
    try {
      await saveProductFromOrder(itemCode, name, rate, unit);
      setProductSavedFeedback(prev => ({ ...prev, [itemCode]: true }));
    } catch (e) {
      console.error(e);
    }
  };

  const handleConfirmDispatch = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const details: DispatchDetails = {
        transporterName: transporterName.trim(),
        lrDocketNo: lrDocketNo.trim(),
        vehicleNo: vehicleNo.trim(),
        ewayBillNo: ewayBillNo.trim(),
        dispatchDate,
        shippingAddress: shippingAddress.trim(),
        deliveryContactName: deliveryContactName.trim(),
        deliveryPhone: deliveryPhone.trim(),
        dispatchNotes: dispatchNotes.trim(),
      };

      await dispatchOrder(order.id, details);
      if (targetStatus !== 'Dispatched') {
        await updateOrderStatus(order.id, targetStatus);
      }
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full border border-slate-200 overflow-hidden my-6">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-900 text-white">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-600 rounded-lg">
              <Truck className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg">
                Dispatch Shipment & Transport Details
              </h3>
              <p className="text-xs text-slate-300">
                Order: <span className="font-mono font-semibold text-blue-400">{order.orderNo}</span> | Party: <span className="font-semibold text-white">{order.partyName}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body - 2 Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-6">
          
          {/* Left Form: Dispatch & LR Entries (7 cols) */}
          <form onSubmit={handleConfirmDispatch} className="lg:col-span-7 space-y-4">
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Transporter / Courier Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={transporterName}
                  onChange={(e) => setTransporterName(e.target.value)}
                  placeholder="e.g. VRL, BlueDart, DTDC, Local Tempo"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  LR / Bilty / Docket No <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={lrDocketNo}
                  onChange={(e) => setLrDocketNo(e.target.value)}
                  placeholder="e.g. VRL-992019"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Vehicle / Tempo No
                </label>
                <input
                  type="text"
                  value={vehicleNo}
                  onChange={(e) => setVehicleNo(e.target.value.toUpperCase())}
                  placeholder="GJ-01-XX-0000"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs sm:text-sm font-mono uppercase focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  E-Way Bill No
                </label>
                <input
                  type="text"
                  value={ewayBillNo}
                  onChange={(e) => setEwayBillNo(e.target.value)}
                  placeholder="12-digit number"
                  maxLength={12}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs sm:text-sm font-mono focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Dispatch Date
                </label>
                <input
                  type="date"
                  value={dispatchDate}
                  onChange={(e) => setDispatchDate(e.target.value)}
                  className="w-full px-2.5 py-2 border border-slate-300 rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Delivery Contact Person
                </label>
                <input
                  type="text"
                  value={deliveryContactName}
                  onChange={(e) => setDeliveryContactName(e.target.value)}
                  placeholder="Recipient Name"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Recipient Contact Phone
                </label>
                <input
                  type="tel"
                  value={deliveryPhone}
                  onChange={(e) => setDeliveryPhone(e.target.value)}
                  placeholder="Mobile Number"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Destination Shipping Address
              </label>
              <textarea
                rows={2}
                value={shippingAddress}
                onChange={(e) => setShippingAddress(e.target.value)}
                placeholder="Full delivery address / Godown location"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Update Shipment Status To
                </label>
                <select
                  value={targetStatus}
                  onChange={(e) => setTargetStatus(e.target.value as OrderStatus)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-semibold text-slate-800 bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="Dispatched">Dispatched (Out of Godown)</option>
                  <option value="In Transit">In Transit (On the Road)</option>
                  <option value="Delivered">Delivered (Handed to Party)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Dispatch Notes
                </label>
                <input
                  type="text"
                  value={dispatchNotes}
                  onChange={(e) => setDispatchNotes(e.target.value)}
                  placeholder="e.g. 2 boxes, fragile handle with care"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm transition-colors flex items-center space-x-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Confirm & Update Dispatch</span>
              </button>
            </div>
          </form>

          {/* Right Panel: Party & Products Master Save Section (5 cols) */}
          <div className="lg:col-span-5 bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-4">
            
            <div className="border-b border-slate-200 pb-2">
              <h4 className="font-bold text-slate-900 text-sm flex items-center space-x-1.5">
                <Building2 className="w-4 h-4 text-blue-600" />
                <span>Master Records Quick Save</span>
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Save or link this Party & Products directly into Master Dropdowns for future orders.
              </p>
            </div>

            {/* Party Master Quick Option */}
            <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 uppercase">Party Master</span>
                {isPartyInMaster || partySavedFeedback ? (
                  <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 flex items-center space-x-1">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Saved in Master</span>
                  </span>
                ) : (
                  <span className="text-[11px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    Not in Master
                  </span>
                )}
              </div>
              
              <div className="text-xs text-slate-700 font-medium">
                <p className="font-bold text-slate-900">{order.partyName}</p>
                {order.partyPhone && <p className="text-slate-500">Phone: {order.partyPhone}</p>}
                {order.partyGstin && <p className="font-mono text-slate-500">GST: {order.partyGstin}</p>}
              </div>

              {!isPartyInMaster && !partySavedFeedback && (
                <button
                  type="button"
                  onClick={handleSavePartyToMaster}
                  className="w-full mt-1.5 py-1.5 px-3 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-md text-xs font-semibold border border-blue-200 flex items-center justify-center space-x-1.5 transition-colors"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Save Party to Master</span>
                </button>
              )}
            </div>

            {/* Products Master Quick Option */}
            <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 uppercase">Products in Order</span>
                <span className="text-xs text-slate-500">{order.items.length} Items</span>
              </div>

              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {order.items.map((it, idx) => {
                  const isItemInMaster = products.some(
                    p => p.itemCode.trim().toLowerCase() === it.itemCode.trim().toLowerCase()
                  );
                  const isSavedJustNow = productSavedFeedback[it.itemCode];

                  return (
                    <div key={it.id || idx} className="p-2 rounded bg-slate-50 border border-slate-200 text-xs flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <span className="font-mono font-bold text-slate-900">{it.itemCode}</span>
                        <p className="text-slate-600 truncate">{it.itemName}</p>
                        <p className="text-slate-500 font-mono">
                          {it.qty} {it.unit} @ ₹{it.rate} = {formatCurrency(it.taxableAmount)}
                        </p>
                      </div>

                      <div className="shrink-0">
                        {isItemInMaster || isSavedJustNow ? (
                          <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 flex items-center space-x-1 font-semibold">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Saved</span>
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleSaveProductToMaster(it.itemCode, it.itemName, it.rate, it.unit)}
                            className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-semibold transition-colors shadow-xs"
                          >
                            + Save Master
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Delivery Challan Print Button */}
            {onPrintDeliveryChallan && (
              <button
                type="button"
                onClick={() => onPrintDeliveryChallan(order)}
                className="w-full py-2 px-3 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold flex items-center justify-center space-x-2 transition-colors"
              >
                <FileText className="w-4 h-4 text-blue-400" />
                <span>Print Delivery Challan / LR Slip</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
