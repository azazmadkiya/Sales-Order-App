import React, { useState } from 'react';
import { X, PackagePlus, Tag, Hash, Percent } from 'lucide-react';
import { Product, UnitType } from '../types';
import { useApp } from '../context/AppContext';

interface QuickAddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProductCreated: (product: Product) => void;
  initialCode?: string;
}

export const QuickAddProductModal: React.FC<QuickAddProductModalProps> = ({
  isOpen,
  onClose,
  onProductCreated,
  initialCode = '',
}) => {
  const { addProduct } = useApp();
  const [itemCode, setItemCode] = useState(initialCode || `PRD${Math.floor(10 + Math.random() * 90)}`);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [unit, setUnit] = useState<UnitType>('PCS');
  const [defaultRate, setDefaultRate] = useState<number>(0);
  const [mrp, setMrp] = useState<number>(0);
  const [gstRate, setGstRate] = useState<number>(18);
  const [hsnCode, setHsnCode] = useState('');
  const [stockQty, setStockQty] = useState<number>(100);
  const [category, setCategory] = useState('General Products');
  const [conversionFactor, setConversionFactor] = useState<number>(50);
  const [secondaryUnit, setSecondaryUnit] = useState<string>('BAG');
  const [enableConversion, setEnableConversion] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemCode.trim() || !name.trim()) return;

    setIsSubmitting(true);
    try {
      const newProduct = await addProduct({
        itemCode: itemCode.trim().toUpperCase(),
        name: name.trim(),
        description: description.trim(),
        unit,
        secondaryUnit: enableConversion ? secondaryUnit : undefined,
        conversionFactor: enableConversion ? Number(conversionFactor) || 1 : 1,
        defaultRate: Number(defaultRate) || 0,
        mrp: Number(mrp) || Number(defaultRate) || 0,
        gstRate: Number(gstRate) || 18,
        hsnCode: hsnCode.trim(),
        stockQty: Number(stockQty) || 0,
        category: category.trim(),
      });

      onProductCreated(newProduct);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden my-8">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg">
              <PackagePlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800 text-base">Add New Product / Item</h3>
              <p className="text-xs text-slate-500">Save product SKU & rates to Product Master</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Item Code / SKU <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={itemCode}
                onChange={(e) => setItemCode(e.target.value.toUpperCase())}
                placeholder="e.g. PRD13 or ITEM-01"
                className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm font-mono uppercase focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Unit of Measure
              </label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value as UnitType)}
                className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none bg-white font-medium"
              >
                <option value="PCS">PCS (Pieces)</option>
                <option value="BOX">BOX (Boxes)</option>
                <option value="KG">KG (Kilograms)</option>
                <option value="MTR">MTR (Meters)</option>
                <option value="LTR">LTR (Liters)</option>
                <option value="BAG">BAG (Bags)</option>
                <option value="DOZEN">DOZEN</option>
                <option value="SET">SET</option>
                <option value="SQFT">SQFT (Square Feet)</option>
                <option value="PKT">PKT (Packets)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Product Name / Description <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Standard Precision Valve Fitting 1/2 inch"
              className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Sales Rate (₹) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                step="any"
                required
                value={defaultRate}
                onChange={(e) => setDefaultRate(parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                GST Rate (%)
              </label>
              <select
                value={gstRate}
                onChange={(e) => setGstRate(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none bg-white font-medium"
              >
                <option value={0}>0% (Exempt)</option>
                <option value={5}>5%</option>
                <option value={12}>12%</option>
                <option value={18}>18% (Standard)</option>
                <option value={28}>28%</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                HSN Code
              </label>
              <input
                type="text"
                value={hsnCode}
                onChange={(e) => setHsnCode(e.target.value)}
                placeholder="e.g. 848180"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
          </div>

          {/* Unit Conversion Configuration */}
          <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-amber-900 uppercase tracking-wider flex items-center space-x-1.5">
                <Tag className="w-3.5 h-3.5 text-amber-700" />
                <span>Unit Conversion / Packaging (Qty2 & Conversion)</span>
              </label>
              <label className="flex items-center space-x-1.5 text-xs text-amber-900 font-semibold cursor-pointer">
                <input
                  type="checkbox"
                  checked={enableConversion}
                  onChange={(e) => setEnableConversion(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                />
                <span>Enable Conversion</span>
              </label>
            </div>

            {enableConversion && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Packaging / Secondary Unit (Qty2 Unit)
                  </label>
                  <select
                    value={secondaryUnit}
                    onChange={(e) => setSecondaryUnit(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-amber-300 rounded-lg text-xs font-bold text-slate-800 outline-none"
                  >
                    <option value="BAG">BAG (Bags / Sacks)</option>
                    <option value="BOX">BOX (Cartons / Boxes)</option>
                    <option value="DRUM">DRUM (Barrels / Drums)</option>
                    <option value="CAN">CAN (Cans / Tins)</option>
                    <option value="CTN">CTN (Cartons)</option>
                    <option value="PKT">PKT (Packets)</option>
                    <option value="ROLL">ROLL (Rolls / Bundles)</option>
                    <option value="PCS">PCS (Pieces)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Conversion Factor ({unit} per 1 {secondaryUnit})
                  </label>
                  <input
                    type="number"
                    step="any"
                    required={enableConversion}
                    value={conversionFactor}
                    onChange={(e) => setConversionFactor(parseFloat(e.target.value) || 0)}
                    placeholder="e.g. 50.000"
                    className="w-full px-3 py-1.5 bg-white border border-amber-300 rounded-lg text-xs font-bold font-mono text-slate-900 outline-none"
                  />
                </div>

                <div className="sm:col-span-2 text-[11px] text-amber-800 bg-amber-100/60 px-2.5 py-1 rounded font-medium">
                  <strong>Example:</strong> 1.00 {secondaryUnit} &times; {conversionFactor || 50} = {(conversionFactor || 50)} {unit} billing Qty (Like <code>CAUSTIC SODA FLAKES (IRC) Qty2: 1.00 | Conversion: 50.000 | Qty: 50.000</code>).
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Opening Stock Qty
              </label>
              <input
                type="number"
                value={stockQty}
                onChange={(e) => setStockQty(Number(e.target.value))}
                className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Category
              </label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="e.g. Industrial Hardware"
                className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-sm font-medium bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-sm transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : 'Save Product & Add to Order'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
