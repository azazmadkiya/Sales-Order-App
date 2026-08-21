import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  Camera, 
  Search, 
  UserPlus, 
  PackagePlus, 
  Save, 
  Truck, 
  Printer, 
  Check, 
  ArrowLeft,
  DollarSign,
  Percent,
  Calendar,
  AlertCircle,
  RotateCcw,
  Sparkles,
  Bell,
  Layers
} from 'lucide-react';
import { 
  SalesOrder, 
  OrderItem, 
  InvoiceType, 
  Party, 
  Product, 
  OrderStatus 
} from '../types';
import { useApp } from '../context/AppContext';
import { calculateOrderSummary, formatCurrency, formatDateDisplay } from '../utils/taxCalculator';
import { 
  generateNextOrderNo, 
  getFinancialYear, 
  getFinancialYearLabel, 
  updateOrderNoForNewDate 
} from '../utils/billNumberGenerator';
import { QuickAddPartyModal } from './QuickAddPartyModal';
import { QuickAddProductModal } from './QuickAddProductModal';
import { SearchablePartySelect } from './SearchablePartySelect';
import { SearchableProductSelect } from './SearchableProductSelect';

interface OrderFormProps {
  initialOrder?: SalesOrder | null;
  onSaveSuccess: (order: SalesOrder, openDispatchModal?: boolean) => void;
  onCancel: () => void;
  onPreviewInvoice: (order: SalesOrder) => void;
}

export const OrderForm: React.FC<OrderFormProps> = ({
  initialOrder,
  onSaveSuccess,
  onCancel,
  onPreviewInvoice,
}) => {
  const { parties, products, orders, businessProfile, addOrder, updateOrder, savePartyFromOrder } = useApp();

  // Date in YYYY-MM-DD
  const [orderDate, setOrderDate] = useState(
    initialOrder?.orderDate || new Date().toISOString().split('T')[0]
  );

  // Track if user explicitly hand-typed the order number
  const [isManualOrderNo, setIsManualOrderNo] = useState(Boolean(initialOrder));

  // Basic Details - Auto generate MOB/0/26-27 format
  const [orderNo, setOrderNo] = useState<string>(() => {
    if (initialOrder?.orderNo) return initialOrder.orderNo;
    const initialDate = new Date().toISOString().split('T')[0];
    return generateNextOrderNo({
      orders,
      orderDate: initialDate,
      prefix: businessProfile?.invoicePrefix || 'MOB',
      startingNumber: businessProfile?.invoiceStartingNo ?? 0,
    });
  });
  
  const [invoiceType, setInvoiceType] = useState<InvoiceType>(
    initialOrder?.invoiceType || 'GST'
  );

  // Handle Order Date change with Financial Year auto calculation
  const handleDateChange = (newDate: string) => {
    setOrderDate(newDate);
    if (!isManualOrderNo && !initialOrder) {
      const updatedNo = generateNextOrderNo({
        orders,
        orderDate: newDate,
        prefix: businessProfile?.invoicePrefix || 'MOB',
        startingNumber: businessProfile?.invoiceStartingNo ?? 0,
      });
      setOrderNo(updatedNo);
    } else {
      // If user typed a custom series like MOB/0/XX-XX, update the FY suffix automatically
      const updatedNo = updateOrderNoForNewDate(orderNo, newDate, businessProfile?.invoicePrefix || 'MOB');
      setOrderNo(updatedNo);
    }
  };

  // Regenerate / reset next series number
  const handleRegenerateOrderNo = () => {
    setIsManualOrderNo(false);
    const nextNo = generateNextOrderNo({
      orders,
      orderDate,
      prefix: businessProfile?.invoicePrefix || 'MOB',
      startingNumber: businessProfile?.invoiceStartingNo ?? 0,
    });
    setOrderNo(nextNo);
  };

  // Selected Party
  const [selectedPartyId, setSelectedPartyId] = useState<string>(initialOrder?.partyId || '');
  const [partyName, setPartyName] = useState<string>(initialOrder?.partyName || '');
  const [partyPhone, setPartyPhone] = useState<string>(initialOrder?.partyPhone || '');
  const [partyGstin, setPartyGstin] = useState<string>(initialOrder?.partyGstin || '');
  const [partyAddress, setPartyAddress] = useState<string>(initialOrder?.partyAddress || '');
  const [partyState, setPartyState] = useState<string>(initialOrder?.partyState || 'Gujarat');

  // Multi-product Items list
  const [items, setItems] = useState<Array<Partial<OrderItem>>>(() => {
    if (initialOrder && initialOrder.items.length > 0) {
      return initialOrder.items;
    }
    // Default initial line item matching reference with CAUSTIC SODA FLAKES (IRC)
    const defaultProd = products.find(p => p.itemCode === 'CHEM-CSF') || products[0];
    const conv = defaultProd?.conversionFactor || 50.000;
    const initialQty2 = 1.00;
    return [
      {
        id: `item_${Date.now()}`,
        productId: defaultProd?.id || '',
        itemCode: defaultProd?.itemCode || 'CHEM-CSF',
        itemName: defaultProd?.name || 'CAUSTIC SODA FLAKES (IRC)',
        unit: defaultProd?.unit || 'KG',
        secondaryUnit: defaultProd?.secondaryUnit || 'BAG',
        qty2: initialQty2,
        conversion: conv,
        qty: Number((initialQty2 * conv).toFixed(3)),
        rate: defaultProd?.defaultRate || 55.00,
        discountPercent: 0,
        gstRate: defaultProd?.gstRate || 18,
      }
    ];
  });

  // Freight & Tax Calculations
  const [freightCharges, setFreightCharges] = useState<number>(initialOrder?.freightCharges || 0);
  const [freightGstRate, setFreightGstRate] = useState<number>(initialOrder?.freightGstRate || 18);
  const [isManualRoundOff, setIsManualRoundOff] = useState<boolean>(false);
  const [customRoundOff, setCustomRoundOff] = useState<number | null>(null);

  // Status & Follow-up Reminders
  const [status, setStatus] = useState<OrderStatus>(initialOrder?.status || 'Pending');
  const [hasReminder, setHasReminder] = useState<boolean>(Boolean(initialOrder?.reminderDate));
  const [reminderDate, setReminderDate] = useState<string>(
    initialOrder?.reminderDate || new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [reminderNotes, setReminderNotes] = useState<string>(initialOrder?.reminderNotes || '');
  const [priority, setPriority] = useState<'Normal' | 'High' | 'Urgent'>(initialOrder?.priority || 'Normal');
  const [notes, setNotes] = useState<string>(initialOrder?.notes || '');

  // Quick Add Modals
  const [showPartyModal, setShowPartyModal] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [activeItemIndexForModal, setActiveItemIndexForModal] = useState<number | null>(null);

  // Update party fields when selecting registered party
  const handlePartySelect = (partyOrId: Party | string) => {
    const p = typeof partyOrId === 'string' ? parties.find((item) => item.id === partyOrId) : partyOrId;
    if (p) {
      setSelectedPartyId(p.id);
      setPartyName(p.partyName);
      setPartyPhone(p.phone || '');
      setPartyGstin(p.gstin || '');
      setPartyAddress(p.billingAddress || '');
      setPartyState(p.state || 'Gujarat');

      // Auto check tax type based on state
      if (businessProfile?.state && p.state) {
        if ((p.state || '').trim().toLowerCase() !== (businessProfile.state || '').trim().toLowerCase()) {
          setInvoiceType('IGST');
        } else {
          setInvoiceType('GST');
        }
      }
    }
  };

  // Add Item Row
  const handleAddItemRow = () => {
    const newItem: Partial<OrderItem> = {
      id: `item_${Date.now()}`,
      productId: '',
      itemCode: '',
      itemName: '',
      unit: 'KG',
      secondaryUnit: 'BAG',
      qty2: 1,
      conversion: 50,
      qty: 50,
      rate: 0,
      discountPercent: 0,
      gstRate: 18,
    };
    setItems([...items, newItem]);
  };

  // Delete Item Row
  const handleDeleteItemRow = (index: number) => {
    if (items.length <= 1) {
      setItems([{
        id: `item_${Date.now()}`,
        productId: '',
        itemCode: '',
        itemName: '',
        unit: 'KG',
        secondaryUnit: 'BAG',
        qty2: 1,
        conversion: 50,
        qty: 50,
        rate: 0,
        discountPercent: 0,
        gstRate: 18,
      }]);
      return;
    }
    const updated = items.filter((_, i) => i !== index);
    setItems(updated);
  };

  // Item Field Change Handler with Qty2 * Conversion = Qty Math
  const handleItemFieldChange = (index: number, field: keyof OrderItem, value: any) => {
    const updated = [...items];
    const current = { ...updated[index], [field]: value };

    // Auto calculate Total Qty if Qty2 or Conversion changes
    if (field === 'qty2' || field === 'conversion') {
      const q2 = parseFloat(field === 'qty2' ? value : current.qty2) || 0;
      const conv = parseFloat(field === 'conversion' ? value : current.conversion) || 1;
      current.qty = Number((q2 * conv).toFixed(3));
    }

    // Recalculate Qty2 if user manually updates Qty
    if (field === 'qty') {
      const q = parseFloat(value) || 0;
      const conv = parseFloat(current.conversion) || 1;
      if (conv > 0) {
        current.qty2 = Number((q / conv).toFixed(2));
      }
    }

    updated[index] = current;
    setItems(updated);
  };

  // Handle Master Product Selection
  const handleProductSelect = (index: number, productOrCode: Product | string) => {
    let prod: Product | undefined;
    let safeCode = '';

    if (typeof productOrCode === 'string') {
      safeCode = productOrCode.trim();
      prod = products.find(
        p => p.id === safeCode || (p.itemCode || '').toLowerCase() === safeCode.toLowerCase()
      );
    } else if (productOrCode && typeof productOrCode === 'object') {
      prod = productOrCode;
      safeCode = prod.itemCode;
    }

    const updated = [...items];
    if (prod) {
      const conv = prod.conversionFactor || 50;
      const currentQty2 = updated[index].qty2 || 1;
      updated[index] = {
        ...updated[index],
        productId: prod.id,
        itemCode: prod.itemCode,
        itemName: prod.name,
        hsnCode: prod.hsnCode,
        unit: prod.unit || 'KG',
        secondaryUnit: prod.secondaryUnit || 'BAG',
        conversion: conv,
        qty: Number((currentQty2 * conv).toFixed(3)),
        rate: prod.defaultRate || updated[index].rate || 0,
        gstRate: prod.gstRate ?? 18,
      };
    } else {
      updated[index] = {
        ...updated[index],
        itemCode: safeCode.toUpperCase(),
      };
    }
    setItems(updated);
  };

  // Photo upload
  const handleItemPhotoUpload = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const updated = [...items];
        updated[index] = {
          ...updated[index],
          photoUrl: reader.result as string,
        };
        setItems(updated);
      };
      reader.readAsDataURL(file);
    }
  };

  // Summary calculation
  const summary = calculateOrderSummary(
    items,
    invoiceType,
    freightCharges,
    freightGstRate,
    isManualRoundOff ? (customRoundOff ?? undefined) : undefined
  );

  // Handle Save
  const handleSave = async (openDispatch: boolean = false) => {
    if (!partyName.trim()) {
      alert('Please enter or select a Party Name.');
      return;
    }
    if (summary.items.length === 0) {
      alert('Please add at least one line item.');
      return;
    }

    const newOrderData: Omit<SalesOrder, 'id' | 'createdAt' | 'updatedAt'> = {
      orderNo: orderNo.trim() || `MOB/0/${getFinancialYear(orderDate)}`,
      orderDate,
      invoiceType,
      partyId: selectedPartyId || `party_${Date.now()}`,
      partyName: partyName.trim(),
      partyGstin: partyGstin.trim(),
      partyPhone: partyPhone.trim(),
      partyAddress: partyAddress.trim(),
      partyState: partyState.trim(),
      items: summary.items,
      totalItems: summary.totalItems,
      totalQty: summary.totalQty,
      subtotalTaxable: summary.subtotalTaxable,
      freightCharges: summary.freightCharges,
      freightGstRate: summary.freightGstRate,
      freightCgst: summary.freightCgst,
      freightSgst: summary.freightSgst,
      freightIgst: summary.freightIgst,
      freightTotal: summary.freightTotal,
      totalCgst: summary.totalCgst,
      totalSgst: summary.totalSgst,
      totalIgst: summary.totalIgst,
      totalTax: summary.totalTax,
      roundOff: summary.roundOff,
      grandTotal: summary.grandTotal,
      status: openDispatch ? 'Dispatched' : status,
      hasReminder,
      reminderDate: hasReminder ? reminderDate : undefined,
      reminderNotes: hasReminder ? reminderNotes : undefined,
      priority: hasReminder ? priority : 'Normal',
      notes: notes.trim(),
    };

    let savedOrder: SalesOrder;

    if (initialOrder) {
      savedOrder = {
        ...initialOrder,
        ...newOrderData,
        updatedAt: new Date().toISOString(),
      };
      await updateOrder(initialOrder.id, newOrderData);
    } else {
      savedOrder = await addOrder(newOrderData);
    }

    // Auto save party to master if new
    if (!selectedPartyId && partyName.trim()) {
      try {
        await savePartyFromOrder(partyName, partyPhone, partyGstin, partyAddress, partyState);
      } catch (e) {
        console.warn('Auto party save note:', e);
      }
    }

    onSaveSuccess(savedOrder, openDispatch);
  };

  return (
    <div className="max-w-7xl mx-auto py-3 sm:py-5 px-2.5 sm:px-6 space-y-4">
      
      {/* Top Header Card */}
      <div className="bg-slate-900 text-white rounded-xl sm:rounded-2xl p-4 sm:p-5 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-2.5">
          <button
            type="button"
            onClick={onCancel}
            className="p-1.5 sm:p-2 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
            title="Go back to list"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-base sm:text-xl font-bold tracking-tight">
              {initialOrder ? `Edit Order: ${initialOrder.orderNo}` : 'New Sales Voucher / Order'}
            </h1>
            <p className="text-[11px] sm:text-xs text-slate-400">
              Multi-product GST invoice with packaging units & auto FY series
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xs font-mono bg-slate-800 px-2.5 py-1 rounded-lg text-slate-300 border border-slate-700">
            {orderNo}
          </span>
          <span className="text-[11px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-700 px-2 py-0.5 rounded-lg">
            FY {getFinancialYear(orderDate)}
          </span>
        </div>
      </div>

      {/* Main Order Form Body */}
      <div className="bg-white border border-slate-200 rounded-xl sm:rounded-2xl shadow-xs p-3 sm:p-6 space-y-5">
        
        {/* Top Header Controls */}
        <div className="space-y-3.5 bg-slate-50 p-3 sm:p-4 rounded-xl border border-slate-200">
          
          {/* Bill No. Series Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-white p-3 rounded-lg border border-slate-200">
            <div className="flex items-center space-x-2 sm:min-w-32">
              <label className="text-xs sm:text-sm font-bold text-slate-800 tracking-tight">
                Bill / Order No.
              </label>
            </div>

            <div className="flex-1 flex flex-wrap sm:flex-nowrap items-center gap-2">
              <input
                type="text"
                value={orderNo}
                onChange={(e) => {
                  setOrderNo(e.target.value);
                  setIsManualOrderNo(true);
                }}
                placeholder="e.g. MOB/0/26-27"
                className="w-full sm:w-56 bg-slate-50 border-b-2 border-blue-600 focus:bg-white px-2 py-1 text-sm sm:text-base font-mono font-bold text-blue-900 outline-none uppercase"
              />

              <button
                type="button"
                onClick={handleRegenerateOrderNo}
                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-semibold border border-slate-300 flex items-center space-x-1 transition-colors shrink-0"
                title="Auto-calculate next sequence for this financial year"
              >
                <RotateCcw className="w-3.5 h-3.5 text-blue-600" />
                <span>Next No.</span>
              </button>

              <div className="flex items-center space-x-1.5 ml-auto text-xs">
                <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-mono font-semibold">
                  FY: {getFinancialYear(orderDate)}
                </span>
              </div>
            </div>
          </div>

          {/* Party A/c Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center space-x-2 sm:min-w-32">
              <label className="text-xs sm:text-sm font-bold text-slate-800 tracking-tight">
                Party A/c Name
              </label>
            </div>

            <div className="flex-1 flex items-center">
              <SearchablePartySelect
                parties={parties}
                selectedPartyId={selectedPartyId}
                partyName={partyName}
                onSelectParty={handlePartySelect}
                onManualNameChange={(name) => {
                  setPartyName(name);
                  setSelectedPartyId('');
                }}
                onOpenAddPartyModal={() => setShowPartyModal(true)}
              />
            </div>
          </div>

          {/* Order Date Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center space-x-2 sm:min-w-32">
              <label className="text-xs sm:text-sm font-bold text-slate-800 tracking-tight">
                Order Date
              </label>
            </div>

            <div className="flex-1 flex flex-wrap sm:flex-nowrap items-center gap-2 sm:gap-3">
              <input
                type="date"
                value={orderDate}
                onChange={(e) => handleDateChange(e.target.value)}
                className="bg-white border-b-2 border-slate-300 focus:border-blue-600 px-2 py-1 text-xs sm:text-sm font-medium text-slate-900 outline-none"
              />
              <span className="text-xs text-slate-500 font-mono">
                {formatDateDisplay(orderDate)}
              </span>
              <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                {getFinancialYearLabel(orderDate)}
              </span>
            </div>
          </div>

          {/* Invoice Type Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center space-x-2 sm:min-w-32">
              <label className="text-xs sm:text-sm font-bold text-slate-800 tracking-tight">
                Invoice Tax Type
              </label>
            </div>

            <div className="flex-1 flex flex-wrap items-center gap-2">
              <select
                value={invoiceType}
                onChange={(e) => setInvoiceType(e.target.value as InvoiceType)}
                className="bg-white border-b-2 border-slate-300 focus:border-blue-600 px-2 py-1 text-xs sm:text-sm font-semibold text-slate-900 outline-none"
              >
                <option value="GST">GST (Intra-State: CGST + SGST)</option>
                <option value="IGST">IGST (Inter-State: Integrated Tax)</option>
                <option value="NON_GST">Non-GST / Bill of Supply (0% Tax)</option>
              </select>

              <span className="text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-medium">
                {invoiceType === 'GST' ? 'CGST 9% + SGST 9%' : invoiceType === 'IGST' ? 'IGST 18%' : 'Tax Exempt'}
              </span>
            </div>
          </div>
        </div>

        {/* Multi-Product Line Items Section */}
        <div className="border border-slate-300 rounded-xl overflow-hidden shadow-xs">
          
          {/* Header Action Bar */}
          <div className="bg-slate-200 px-3 py-2.5 border-b border-slate-300 flex items-center justify-between text-xs font-bold text-slate-800">
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={handleAddItemRow}
                title="Add Product Row"
                className="p-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md shadow-xs transition-colors flex items-center space-x-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Add Item</span>
              </button>
              <span className="uppercase tracking-wider font-extrabold text-[11px] text-slate-700 hidden sm:inline">
                Product Line Items ({items.length})
              </span>
            </div>

            <div className="text-right text-slate-700 font-mono text-[11px]">
              Total Qty: <strong className="text-slate-900">{summary.totalQty.toFixed(2)}</strong> | Total: <strong className="text-slate-900">{formatCurrency(summary.subtotalTaxable)}</strong>
            </div>
          </div>

          {/* 1. DESKTOP LINE ITEMS (Visible on lg: >= 1024px) */}
          <div className="hidden lg:block divide-y divide-slate-200 bg-white">
            {/* Column labels */}
            <div className="bg-slate-100 px-3 py-1.5 flex items-center justify-between text-[11px] font-bold text-slate-600 uppercase">
              <div className="flex-1">Product Details</div>
              <div className="flex items-center space-x-3 text-right">
                <span className="w-16 text-center text-amber-900">Qty2 (Bags)</span>
                <span className="w-20 text-center text-amber-900">Conversion</span>
                <span className="w-20 text-center text-emerald-900">Qty (KG)</span>
                <span className="w-14 text-center">Unit</span>
                <span className="w-20 text-right">Rate (₹)</span>
                <span className="w-24 text-right">Amount (₹)</span>
              </div>
            </div>

            {items.map((item, index) => {
              const qty = Number(item.qty) || 0;
              const rate = Number(item.rate) || 0;
              const lineTaxable = qty * rate;

              return (
                <div key={item.id || index} className="p-3 hover:bg-slate-50 transition-colors flex items-center justify-between gap-3">
                  <div className="flex items-center space-x-2 flex-1 min-w-0">
                    <button
                      type="button"
                      onClick={() => handleDeleteItemRow(index)}
                      className="text-slate-400 hover:text-rose-600 p-1 rounded transition-colors shrink-0"
                      title="Delete Item Row"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <input
                      type="text"
                      value={item.itemCode || ''}
                      onChange={(e) => handleProductSelect(index, e.target.value)}
                      placeholder="Item Code"
                      className="w-24 bg-white border-b-2 border-slate-300 focus:border-emerald-600 px-1.5 py-1 text-sm font-mono font-bold text-slate-900 uppercase outline-none shrink-0"
                    />

                    <div className="w-56 shrink-0">
                      <SearchableProductSelect
                        products={products}
                        selectedProductId={item.productId}
                        itemCode={item.itemCode}
                        itemName={item.itemName}
                        onSelectProduct={(p) => handleProductSelect(index, p)}
                        onOpenAddProductModal={() => {
                          setActiveItemIndexForModal(index);
                          setShowProductModal(true);
                        }}
                        placeholder="Search / Choose Product..."
                        compact
                      />
                    </div>

                    <input
                      type="text"
                      value={item.itemName || ''}
                      onChange={(e) => handleItemFieldChange(index, 'itemName', e.target.value)}
                      placeholder="Product Name"
                      className="flex-1 bg-white border-b border-slate-200 focus:border-emerald-600 px-1.5 py-0.5 text-xs text-slate-800 font-medium outline-none truncate"
                    />

                    <button
                      type="button"
                      onClick={() => {
                        setActiveItemIndexForModal(index);
                        setShowProductModal(true);
                      }}
                      className="p-1 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded text-xs border border-emerald-200 shrink-0"
                      title="Add New Master Product"
                    >
                      <PackagePlus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center justify-end space-x-3 shrink-0">
                    <div className="w-16">
                      <input
                        type="number"
                        step="any"
                        value={item.qty2 === undefined || item.qty2 === ('' as any) ? '' : item.qty2}
                        onChange={(e) => handleItemFieldChange(index, 'qty2', e.target.value)}
                        placeholder="1.00"
                        className="w-full text-center bg-amber-50/70 border border-amber-300 focus:border-amber-500 rounded px-1 py-1 text-sm font-bold font-mono text-amber-950 outline-none"
                      />
                      <div className="text-[10px] text-center text-amber-700 font-medium truncate">
                        {item.secondaryUnit || 'BAG'}
                      </div>
                    </div>

                    <div className="w-20">
                      <input
                        type="number"
                        step="any"
                        value={item.conversion === undefined || item.conversion === ('' as any) ? '' : item.conversion}
                        onChange={(e) => handleItemFieldChange(index, 'conversion', e.target.value)}
                        placeholder="50.000"
                        className="w-full text-center bg-amber-50/70 border border-amber-300 focus:border-amber-500 rounded px-1 py-1 text-sm font-bold font-mono text-amber-950 outline-none"
                      />
                      <div className="text-[10px] text-center text-slate-500 font-medium">Conv</div>
                    </div>

                    <div className="w-20">
                      <input
                        type="number"
                        step="any"
                        value={item.qty === 0 || item.qty === ('' as any) ? '' : item.qty}
                        onChange={(e) => handleItemFieldChange(index, 'qty', e.target.value)}
                        placeholder="50.000"
                        className="w-full text-center bg-emerald-50/70 border border-emerald-300 focus:border-emerald-500 rounded px-1 py-1 text-sm font-bold font-mono text-emerald-950 outline-none"
                      />
                      <div className="text-[10px] text-center text-emerald-700 font-semibold">{item.unit || 'KG'}</div>
                    </div>

                    <div className="w-14">
                      <select
                        value={item.unit || 'KG'}
                        onChange={(e) => handleItemFieldChange(index, 'unit', e.target.value)}
                        className="w-full bg-slate-100 border border-slate-300 rounded px-1 py-1 text-xs font-bold text-slate-700 outline-none"
                      >
                        <option value="KG">KG</option>
                        <option value="PCS">PCS</option>
                        <option value="BOX">BOX</option>
                        <option value="LTR">LTR</option>
                        <option value="BAG">BAG</option>
                        <option value="MTR">MTR</option>
                      </select>
                    </div>

                    <div className="w-20">
                      <input
                        type="number"
                        step="any"
                        value={item.rate === 0 || item.rate === ('' as any) ? '' : item.rate}
                        onChange={(e) => handleItemFieldChange(index, 'rate', parseFloat(e.target.value) || 0)}
                        placeholder="55.00"
                        className="w-full text-right bg-white border border-slate-300 focus:border-blue-600 rounded px-1.5 py-1 text-sm font-semibold font-mono text-slate-900 outline-none"
                      />
                      <div className="text-[10px] text-right text-slate-400">/ {item.unit || 'KG'}</div>
                    </div>

                    <div className="w-24 text-right font-mono font-bold text-slate-900 text-sm pt-1">
                      {formatCurrency(lineTaxable)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* 2. MOBILE CARD ITEM LIST (Visible on < 1024px screens) */}
          <div className="block lg:hidden divide-y divide-slate-200 bg-white">
            {items.map((item, index) => {
              const qty = Number(item.qty) || 0;
              const rate = Number(item.rate) || 0;
              const lineTaxable = qty * rate;

              return (
                <div key={item.id || index} className="p-3.5 space-y-3 bg-white hover:bg-slate-50 transition-colors">
                  {/* Row Header: Item # + Delete + Code + Master Searchable dropdown */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded shrink-0">
                      #{index + 1}
                    </span>

                    <input
                      type="text"
                      value={item.itemCode || ''}
                      onChange={(e) => handleProductSelect(index, e.target.value)}
                      placeholder="Code"
                      className="w-20 bg-slate-50 border-b-2 border-emerald-600 px-1.5 py-0.5 text-xs font-mono font-bold text-slate-900 uppercase outline-none shrink-0"
                    />

                    <div className="flex-1 min-w-0">
                      <SearchableProductSelect
                        products={products}
                        selectedProductId={item.productId}
                        itemCode={item.itemCode}
                        itemName={item.itemName}
                        onSelectProduct={(p) => handleProductSelect(index, p)}
                        onOpenAddProductModal={() => {
                          setActiveItemIndexForModal(index);
                          setShowProductModal(true);
                        }}
                        placeholder="Search item..."
                        compact
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteItemRow(index)}
                      className="text-rose-500 hover:bg-rose-50 p-1.5 rounded transition-colors shrink-0"
                      title="Delete Item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Product Name */}
                  <input
                    type="text"
                    value={item.itemName || ''}
                    onChange={(e) => handleItemFieldChange(index, 'itemName', e.target.value)}
                    placeholder="Product / Description"
                    className="w-full bg-white border-b border-slate-300 focus:border-emerald-600 px-2 py-1 text-xs font-medium text-slate-900 outline-none"
                  />

                  {/* 3-Box Row: Qty2 (Bags) | Conversion | Total Qty */}
                  <div className="grid grid-cols-3 gap-2 bg-slate-50 p-2 rounded-lg border border-slate-200 text-center">
                    <div>
                      <span className="text-[10px] font-bold text-amber-800 block mb-0.5">
                        Qty2 ({item.secondaryUnit || 'BAG'})
                      </span>
                      <input
                        type="number"
                        step="any"
                        value={item.qty2 === undefined || item.qty2 === ('' as any) ? '' : item.qty2}
                        onChange={(e) => handleItemFieldChange(index, 'qty2', e.target.value)}
                        placeholder="1.00"
                        className="w-full text-center bg-white border border-amber-300 rounded py-1 text-xs font-bold font-mono text-amber-950 outline-none"
                      />
                    </div>

                    <div>
                      <span className="text-[10px] font-bold text-slate-600 block mb-0.5">
                        Conv Factor
                      </span>
                      <input
                        type="number"
                        step="any"
                        value={item.conversion === undefined || item.conversion === ('' as any) ? '' : item.conversion}
                        onChange={(e) => handleItemFieldChange(index, 'conversion', e.target.value)}
                        placeholder="50"
                        className="w-full text-center bg-white border border-slate-300 rounded py-1 text-xs font-bold font-mono text-slate-900 outline-none"
                      />
                    </div>

                    <div>
                      <span className="text-[10px] font-bold text-emerald-800 block mb-0.5">
                        Total {item.unit || 'KG'}
                      </span>
                      <input
                        type="number"
                        step="any"
                        value={item.qty === 0 || item.qty === ('' as any) ? '' : item.qty}
                        onChange={(e) => handleItemFieldChange(index, 'qty', e.target.value)}
                        placeholder="50"
                        className="w-full text-center bg-white border border-emerald-400 rounded py-1 text-xs font-bold font-mono text-emerald-950 outline-none"
                      />
                    </div>
                  </div>

                  {/* Rate & Line Amount */}
                  <div className="flex items-center justify-between gap-3 pt-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold text-slate-700">Rate: ₹</span>
                      <input
                        type="number"
                        step="any"
                        value={item.rate === 0 || item.rate === ('' as any) ? '' : item.rate}
                        onChange={(e) => handleItemFieldChange(index, 'rate', parseFloat(e.target.value) || 0)}
                        placeholder="55.00"
                        className="w-24 bg-white border border-slate-300 rounded px-2 py-1 text-xs font-semibold font-mono text-slate-900 outline-none"
                      />
                      <select
                        value={item.unit || 'KG'}
                        onChange={(e) => handleItemFieldChange(index, 'unit', e.target.value)}
                        className="bg-slate-100 border border-slate-300 rounded px-1.5 py-1 text-xs font-bold text-slate-700 outline-none"
                      >
                        <option value="KG">/ KG</option>
                        <option value="PCS">/ PCS</option>
                        <option value="BOX">/ BOX</option>
                        <option value="BAG">/ BAG</option>
                        <option value="LTR">/ LTR</option>
                      </select>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block font-medium">Item Amount</span>
                      <span className="text-sm font-black font-mono text-slate-950">
                        {formatCurrency(lineTaxable)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Subtotal Ribbon */}
          <div className="bg-slate-100 px-4 py-2.5 border-t border-slate-300 flex items-center justify-between text-xs sm:text-sm font-bold text-slate-800">
            <div>
              Total Qty: <span className="font-mono text-emerald-800 font-black">{summary.totalQty.toFixed(2)}</span>
            </div>
            <div>
              Taxable: <span className="font-mono text-slate-900 font-black">{formatCurrency(summary.subtotalTaxable)}</span>
            </div>
          </div>
        </div>

        {/* Billing & Tax Summary Panel */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 sm:p-5 space-y-3 font-medium">
          
          {/* Freight Charges Row */}
          <div className="flex items-center justify-between text-xs sm:text-sm">
            <div className="flex items-center space-x-2">
              <label className="text-slate-800 font-bold">Freight / Delivery</label>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="number"
                step="any"
                value={freightCharges === 0 ? '' : freightCharges}
                onChange={(e) => setFreightCharges(parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                className="w-24 sm:w-28 text-right bg-white border border-slate-300 rounded px-2 py-1 text-xs sm:text-sm font-semibold text-slate-900 outline-none font-mono"
              />
            </div>
          </div>

          {/* Central Tax (CGST) */}
          {invoiceType === 'GST' && (
            <>
              <div className="flex items-center justify-between text-xs sm:text-sm">
                <span className="text-slate-800 font-bold">Central Tax (CGST)</span>
                <span className="font-mono font-semibold text-slate-900">
                  {summary.totalCgst.toFixed(2)}
                </span>
              </div>

              {/* State/UT Tax (SGST) */}
              <div className="flex items-center justify-between text-xs sm:text-sm">
                <span className="text-slate-800 font-bold">State/UT Tax (SGST)</span>
                <span className="font-mono font-semibold text-slate-900">
                  {summary.totalSgst.toFixed(2)}
                </span>
              </div>
            </>
          )}

          {/* Integrated Tax (IGST) */}
          {invoiceType === 'IGST' && (
            <div className="flex items-center justify-between text-xs sm:text-sm">
              <span className="text-slate-800 font-bold">Integrated Tax (IGST)</span>
              <span className="font-mono font-semibold text-slate-900">
                {summary.totalIgst.toFixed(2)}
              </span>
            </div>
          )}

          {/* Round Off Row */}
          <div className="flex items-center justify-between text-xs sm:text-sm pt-1 border-t border-slate-200">
            <span className="text-slate-800 font-bold">Round Off</span>
            <span className="font-mono font-semibold text-slate-900">
              {summary.roundOff >= 0 ? `+${summary.roundOff.toFixed(2)}` : summary.roundOff.toFixed(2)}
            </span>
          </div>

          {/* Grand Total Amount */}
          <div className="flex items-center justify-between text-base sm:text-lg font-extrabold text-slate-950 pt-2 border-t-2 border-slate-300">
            <span>Grand Total (Final Billing)</span>
            <span className="text-emerald-700 font-mono text-lg sm:text-xl font-black">
              {formatCurrency(summary.grandTotal)}
            </span>
          </div>
        </div>

        {/* Order Status & Follow-up Reminder */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Status Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5 uppercase tracking-wider">
                Order Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as OrderStatus)}
                className={`w-full border-2 rounded-xl px-3 py-2 text-xs sm:text-sm font-bold outline-none ${
                  status === 'Dispatched' || status === 'Delivered' || status === 'In Transit'
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-800'
                    : 'bg-rose-50 border-rose-500 text-rose-800'
                }`}
              >
                <option value="Pending">🔴 Pending (Draft / Awaiting Dispatch)</option>
                <option value="Confirmed">🔴 Confirmed (Pending Packing)</option>
                <option value="Ready to Pack">🔴 Ready to Pack</option>
                <option value="Dispatched">🟢 Dispatched (OK / Out for Delivery)</option>
                <option value="In Transit">🟢 In Transit (With Transporter)</option>
                <option value="Delivered">🟢 Delivered (Completed)</option>
                <option value="Cancelled">⚪ Cancelled</option>
              </select>
            </div>

            {/* Reminder Toggle */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-1.5">
                  <Bell className="w-3.5 h-3.5 text-amber-600" />
                  <span>Follow-up Reminder</span>
                </label>
                <input
                  type="checkbox"
                  id="toggleReminder"
                  checked={hasReminder}
                  onChange={(e) => setHasReminder(e.target.checked)}
                  className="w-4 h-4 text-amber-600 rounded"
                />
              </div>

              {hasReminder ? (
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="date"
                    value={reminderDate}
                    onChange={(e) => setReminderDate(e.target.value)}
                    className="w-full bg-white border border-amber-300 rounded-lg px-2 py-1 text-xs font-semibold text-slate-800 outline-none"
                  />
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className="w-full bg-white border border-amber-300 rounded-lg px-2 py-1 text-xs font-semibold text-slate-800 outline-none"
                  >
                    <option value="Normal">Normal</option>
                    <option value="High">High ⚡</option>
                    <option value="Urgent">Urgent 🔥</option>
                  </select>
                </div>
              ) : (
                <div 
                  onClick={() => setHasReminder(true)}
                  className="border border-dashed border-slate-300 rounded-lg p-2 text-center text-xs text-slate-500 hover:bg-white cursor-pointer"
                >
                  + Click to set reminder alert
                </div>
              )}
            </div>
          </div>

          {/* Reminder Note input if active */}
          {hasReminder && (
            <div>
              <input
                type="text"
                value={reminderNotes}
                onChange={(e) => setReminderNotes(e.target.value)}
                placeholder="Follow-up notes (e.g. Call party for dispatch confirmation)"
                className="w-full bg-white border border-amber-300 rounded-lg px-3 py-1.5 text-xs text-slate-800 outline-none"
              />
            </div>
          )}

          {/* Remarks */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Dispatch Instructions / Remarks
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Send via local tempo, packed in bags"
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>

        {/* Action Buttons Bar */}
        <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2.5">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                const tempOrder: SalesOrder = {
                  id: initialOrder?.id || 'temp_preview',
                  orderNo,
                  orderDate,
                  invoiceType,
                  partyId: selectedPartyId,
                  partyName,
                  partyGstin,
                  partyPhone,
                  partyAddress,
                  partyState,
                  items: summary.items,
                  totalItems: summary.totalItems,
                  totalQty: summary.totalQty,
                  subtotalTaxable: summary.subtotalTaxable,
                  freightCharges: summary.freightCharges,
                  freightGstRate: summary.freightGstRate,
                  freightCgst: summary.freightCgst,
                  freightSgst: summary.freightSgst,
                  freightIgst: summary.freightIgst,
                  freightTotal: summary.freightTotal,
                  totalCgst: summary.totalCgst,
                  totalSgst: summary.totalSgst,
                  totalIgst: summary.totalIgst,
                  totalTax: summary.totalTax,
                  roundOff: summary.roundOff,
                  grandTotal: summary.grandTotal,
                  status,
                  hasReminder,
                  reminderDate: hasReminder ? reminderDate : undefined,
                  reminderNotes: hasReminder ? reminderNotes : undefined,
                  priority: hasReminder ? priority : 'Normal',
                  notes,
                  createdAt: initialOrder?.createdAt || new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                };
                onPreviewInvoice(tempOrder);
              }}
              className="px-3.5 py-2.5 text-xs sm:text-sm font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg transition-colors flex items-center space-x-1.5 cursor-pointer"
            >
              <Printer className="w-4 h-4 text-slate-600" />
              <span>Preview Bill</span>
            </button>

            <button
              type="button"
              onClick={() => handleSave(true)}
              className="px-4 py-2.5 text-xs sm:text-sm font-semibold bg-amber-600 hover:bg-amber-700 text-white rounded-lg shadow-sm transition-colors flex items-center space-x-1.5 cursor-pointer"
            >
              <Truck className="w-4 h-4" />
              <span>Save & Dispatch</span>
            </button>

            <button
              type="button"
              onClick={() => handleSave(false)}
              className="px-5 py-2.5 text-xs sm:text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-sm transition-colors flex items-center space-x-1.5 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Save Order</span>
            </button>
          </div>
        </div>
      </div>

      {/* Quick Add Party Modal */}
      <QuickAddPartyModal
        isOpen={showPartyModal}
        onClose={() => setShowPartyModal(false)}
        initialPartyName={partyName}
        onPartyCreated={(newParty) => {
          setSelectedPartyId(newParty.id);
          setPartyName(newParty.partyName);
          setPartyPhone(newParty.phone);
          setPartyGstin(newParty.gstin || '');
          setPartyAddress(newParty.billingAddress);
          setPartyState(newParty.state);
        }}
      />

      {/* Quick Add Product Modal */}
      <QuickAddProductModal
        isOpen={showProductModal}
        onClose={() => setShowProductModal(false)}
        onProductCreated={(newProduct) => {
          if (activeItemIndexForModal !== null) {
            handleProductSelect(activeItemIndexForModal, newProduct.id);
          }
        }}
      />
    </div>
  );
};
