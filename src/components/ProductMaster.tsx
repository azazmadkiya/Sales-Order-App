import React, { useState } from 'react';
import { 
  Package, 
  PackagePlus, 
  Search, 
  Filter, 
  Edit3, 
  Trash2, 
  Tag, 
  Percent, 
  Layers, 
  AlertTriangle,
  CheckCircle2,
  DollarSign
} from 'lucide-react';
import { Product, UnitType } from '../types';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { formatCurrency } from '../utils/taxCalculator';
import { QuickAddProductModal } from './QuickAddProductModal';

export const ProductMaster: React.FC = () => {
  const { products, updateProduct, deleteProduct } = useApp();
  const { permissions } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const categories = ['ALL', ...Array.from(new Set(products.map(p => p.category || 'General').filter(Boolean)))];

  const filteredProducts = products.filter((p) => {
    if (categoryFilter !== 'ALL' && (p.category || 'General') !== categoryFilter) return false;
    if (searchTerm && searchTerm.trim()) {
      const q = searchTerm.trim().toLowerCase();
      const matchCode = (p.itemCode || '').toLowerCase().includes(q);
      const matchName = (p.name || '').toLowerCase().includes(q);
      const matchHsn = (p.hsnCode || '').toLowerCase().includes(q);
      if (!matchCode && !matchName && !matchHsn) return false;
    }
    return true;
  });

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    await updateProduct(editingProduct.id, editingProduct);
    setEditingProduct(null);
  };

  return (
    <div className="max-w-7xl mx-auto py-5 px-3 sm:px-6 space-y-5">
      
      {/* Header */}
      <div className="bg-slate-900 text-white rounded-xl p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-emerald-600 rounded-lg">
              <Package className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold tracking-tight">
              Product Master
            </h1>
          </div>
          <p className="text-xs text-slate-300 mt-1 max-w-xl">
            Register Item Codes (e.g. PRD13), default pricing, and GST tax slabs. Items here appear in your Sales Order dropdowns.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-sm transition-colors self-start sm:self-auto"
        >
          <PackagePlus className="w-4 h-4" />
          <span>+ Add New Product</span>
        </button>
      </div>

      {/* Filter & Search */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by Item Code (PRD13...), Name, HSN..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
          />
        </div>

        {/* Category selector */}
        <div className="flex items-center space-x-2 overflow-x-auto text-xs font-semibold">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-md border transition-colors whitespace-nowrap ${
                categoryFilter === cat
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {cat === 'ALL' ? 'All Items' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Product Cards Table / Grid */}
      <div className="border border-slate-300 rounded-xl overflow-x-auto bg-white shadow-xs">
        <table className="w-full text-left text-xs sm:text-sm">
          <thead className="bg-slate-200 text-slate-900 font-bold border-b border-slate-300">
            <tr>
              <th className="py-3 px-4">Item Code</th>
              <th className="py-3 px-4">Product Name & Description</th>
              <th className="py-3 px-3 text-center">Unit</th>
              <th className="py-3 px-3 text-center">Conversion / Qty2</th>
              <th className="py-3 px-3 text-right">Default Rate (₹)</th>
              <th className="py-3 px-3 text-center">GST %</th>
              <th className="py-3 px-3 text-center">HSN Code</th>
              <th className="py-3 px-3 text-right">Stock Qty</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {filteredProducts.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-12 text-center text-slate-500">
                  <Package className="w-8 h-8 text-slate-300 mx-auto mb-1" />
                  <p className="font-semibold text-slate-700">No Products Registered</p>
                  <p className="text-xs text-slate-400 mt-0.5">Click "+ Add New Product" to populate your catalog.</p>
                </td>
              </tr>
            ) : (
              filteredProducts.map((prod) => {
                const isLowStock = (prod.minStockLevel || 0) > 0 && prod.stockQty <= (prod.minStockLevel || 0);
                const hasConv = (prod.conversionFactor && prod.conversionFactor > 1) || prod.secondaryUnit;

                return (
                  <tr key={prod.id} className="hover:bg-emerald-50/30 transition-colors">
                    {/* Item Code (e.g. PRD13) */}
                    <td className="py-3 px-4 font-mono font-bold text-emerald-800 whitespace-nowrap">
                      <span className="bg-emerald-100/70 text-emerald-900 px-2 py-1 rounded border border-emerald-200">
                        {prod.itemCode}
                      </span>
                    </td>

                    {/* Product Name */}
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{prod.name}</div>
                      {prod.description && (
                        <div className="text-xs text-slate-500 line-clamp-1">{prod.description}</div>
                      )}
                      {prod.category && (
                        <span className="text-[10px] text-slate-400 font-medium">{prod.category}</span>
                      )}
                    </td>

                    {/* Unit */}
                    <td className="py-3 px-3 text-center font-semibold text-slate-700 whitespace-nowrap">
                      {prod.unit}
                    </td>

                    {/* Conversion */}
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      {hasConv ? (
                        <span className="bg-amber-100 text-amber-900 text-xs font-bold px-2 py-0.5 rounded border border-amber-300 inline-block font-mono">
                          1 {prod.secondaryUnit || 'BAG'} = {prod.conversionFactor || 50} {prod.unit}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400 font-mono">1.000</span>
                      )}
                    </td>

                    {/* Default Rate */}
                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                      {permissions.canViewAmounts ? formatCurrency(prod.defaultRate) : '₹ ••••••'}
                    </td>

                    {/* GST Rate */}
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      <span className="bg-blue-50 text-blue-800 font-bold px-2 py-0.5 rounded text-xs border border-blue-100">
                        {prod.gstRate}%
                      </span>
                    </td>

                    {/* HSN Code */}
                    <td className="py-3 px-3 text-center font-mono text-slate-600 whitespace-nowrap">
                      {prod.hsnCode || '—'}
                    </td>

                    {/* Stock Qty */}
                    <td className="py-3 px-3 text-right whitespace-nowrap">
                      <span className={`font-mono font-bold ${isLowStock ? 'text-rose-600' : 'text-slate-800'}`}>
                        {prod.stockQty} {prod.unit}
                      </span>
                      {isLowStock && (
                        <span className="block text-[10px] text-rose-500 font-semibold">Low Stock</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          onClick={() => setEditingProduct(prod)}
                          className="p-1.5 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-md transition-colors"
                          title="Edit Product"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Delete product ${prod.itemCode} (${prod.name})?`)) {
                              deleteProduct(prod.id);
                            }
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                          title="Delete Product"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Add Product Modal */}
      <QuickAddProductModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onProductCreated={() => {}}
      />

      {/* Edit Product Modal */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden my-8">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
              <h3 className="font-bold text-slate-800 text-base">Edit Product</h3>
              <button
                onClick={() => setEditingProduct(null)}
                className="p-1 rounded text-slate-400 hover:text-slate-600"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Item Code / SKU</label>
                  <input
                    type="text"
                    required
                    value={editingProduct.itemCode}
                    onChange={(e) => setEditingProduct({ ...editingProduct, itemCode: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono uppercase outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Unit</label>
                  <select
                    value={editingProduct.unit}
                    onChange={(e) => setEditingProduct({ ...editingProduct, unit: e.target.value as UnitType })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none bg-white font-medium"
                  >
                    <option value="PCS">PCS</option>
                    <option value="BOX">BOX</option>
                    <option value="KG">KG</option>
                    <option value="MTR">MTR</option>
                    <option value="LTR">LTR</option>
                    <option value="BAG">BAG</option>
                    <option value="DOZEN">DOZEN</option>
                    <option value="SET">SET</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Product Name</label>
                <input
                  type="text"
                  required
                  value={editingProduct.name}
                  onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-semibold outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Rate (₹)</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={editingProduct.defaultRate}
                    onChange={(e) => setEditingProduct({ ...editingProduct, defaultRate: parseFloat(e.target.value) || 0 })}
                    className="w-full px-2.5 py-2 border border-slate-300 rounded-lg text-sm font-bold font-mono outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">GST %</label>
                  <select
                    value={editingProduct.gstRate}
                    onChange={(e) => setEditingProduct({ ...editingProduct, gstRate: Number(e.target.value) })}
                    className="w-full px-2.5 py-2 border border-slate-300 rounded-lg text-sm outline-none bg-white font-medium"
                  >
                    <option value={0}>0%</option>
                    <option value={5}>5%</option>
                    <option value={12}>12%</option>
                    <option value={18}>18%</option>
                    <option value={28}>28%</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">HSN</label>
                  <input
                    type="text"
                    value={editingProduct.hsnCode || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, hsnCode: e.target.value })}
                    className="w-full px-2.5 py-2 border border-slate-300 rounded-lg text-sm font-mono outline-none"
                  />
                </div>
              </div>

              {/* Unit Conversion Configuration */}
              <div className="bg-amber-50/70 border border-amber-200 rounded-lg p-3 space-y-2">
                <label className="text-xs font-bold text-amber-900 uppercase tracking-wider block">
                  Unit Conversion (Qty2 & Packaging Factor)
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Secondary / Packaging Unit
                    </label>
                    <select
                      value={editingProduct.secondaryUnit || 'BAG'}
                      onChange={(e) => setEditingProduct({ ...editingProduct, secondaryUnit: e.target.value })}
                      className="w-full px-2.5 py-1.5 border border-amber-300 rounded-lg text-xs font-bold outline-none bg-white"
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
                      Conversion Factor ({editingProduct.unit} per 1 {editingProduct.secondaryUnit || 'BAG'})
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={editingProduct.conversionFactor || 1}
                      onChange={(e) => setEditingProduct({ ...editingProduct, conversionFactor: parseFloat(e.target.value) || 1 })}
                      placeholder="e.g. 50.000"
                      className="w-full px-2.5 py-1.5 border border-amber-300 rounded-lg text-xs font-bold font-mono outline-none bg-white"
                    />
                  </div>
                </div>
                <p className="text-[10px] text-amber-800">
                  Example: 1.00 {editingProduct.secondaryUnit || 'BAG'} &times; {editingProduct.conversionFactor || 50} = {editingProduct.conversionFactor || 50} {editingProduct.unit}
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Available Stock</label>
                <input
                  type="number"
                  value={editingProduct.stockQty}
                  onChange={(e) => setEditingProduct({ ...editingProduct, stockQty: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-sm"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
