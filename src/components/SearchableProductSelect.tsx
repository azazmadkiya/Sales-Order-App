import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, Check, PackagePlus, X, Tag } from 'lucide-react';
import { Product } from '../types';

interface SearchableProductSelectProps {
  products: Product[];
  selectedProductId?: string;
  itemCode?: string;
  itemName?: string;
  onSelectProduct: (product: Product) => void;
  onOpenAddProductModal?: () => void;
  placeholder?: string;
  compact?: boolean;
}

export const SearchableProductSelect: React.FC<SearchableProductSelectProps> = ({
  products,
  selectedProductId,
  itemCode,
  itemName,
  onSelectProduct,
  onOpenAddProductModal,
  placeholder = 'Select Product / Item...',
  compact = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Auto focus search input when opening
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else {
      setSearchTerm('');
    }
  }, [isOpen]);

  // Filter products by search term
  const filteredProducts = products.filter((p) => {
    const q = searchTerm.toLowerCase().trim();
    if (!q) return true;
    return (
      (p.itemCode || '').toLowerCase().includes(q) ||
      (p.name || '').toLowerCase().includes(q) ||
      (p.hsnCode || '').toLowerCase().includes(q) ||
      (p.category || '').toLowerCase().includes(q)
    );
  });

  const selectedProduct = products.find(
    (p) => p.id === selectedProductId || (itemCode && (p.itemCode || '').toLowerCase() === itemCode.toLowerCase())
  );

  const displayText = selectedProduct
    ? `${selectedProduct.itemCode} - ${selectedProduct.name}`
    : itemName
    ? itemName
    : placeholder;

  return (
    <div className="relative flex-1 min-w-0" ref={containerRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full text-left bg-slate-50 hover:bg-slate-100/90 border border-slate-300 rounded px-2 py-1 text-slate-800 transition-colors flex items-center justify-between gap-1 shadow-2xs ${
          compact ? 'text-xs' : 'text-xs sm:text-sm'
        } ${selectedProduct ? 'font-semibold text-slate-900' : 'text-slate-500 font-normal'}`}
      >
        <span className="truncate flex-1">
          {displayText}
        </span>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-500 shrink-0 transition-transform duration-150 ${isOpen ? 'rotate-180 text-emerald-600' : ''}`} />
      </button>

      {/* Searchable Dropdown Popup */}
      {isOpen && (
        <div className="absolute top-full left-0 z-50 mt-1 bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-100 w-72 sm:w-96 max-h-80 flex flex-col">
          
          {/* Quick Search Header */}
          <div className="p-2 bg-slate-50 border-b border-slate-200 flex items-center gap-1.5">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search Item Code, Product Name, HSN..."
                className="w-full pl-8 pr-7 py-1 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-slate-900"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {onOpenAddProductModal && (
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onOpenAddProductModal();
                }}
                className="p-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center space-x-1 shrink-0 transition-colors shadow-xs"
                title="Create New Master Product"
              >
                <PackagePlus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">New</span>
              </button>
            )}
          </div>

          {/* Product Items List */}
          <div className="overflow-y-auto divide-y divide-slate-100 flex-1">
            {filteredProducts.length > 0 ? (
              filteredProducts.map((p) => {
                const isSelected = p.id === selectedProductId || (itemCode && p.itemCode.toLowerCase() === itemCode.toLowerCase());
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      onSelectProduct(p);
                      setIsOpen(false);
                    }}
                    className={`w-full text-left p-2 hover:bg-emerald-50/80 transition-colors flex items-center justify-between gap-2 ${
                      isSelected ? 'bg-emerald-50/60 border-l-4 border-emerald-600' : ''
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-1.5">
                        <span className="font-mono font-bold text-xs text-blue-700 bg-blue-50 border border-blue-200 px-1 py-0.2 rounded">
                          {p.itemCode}
                        </span>
                        <span className="font-semibold text-xs text-slate-900 truncate">
                          {p.name}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5 mt-0.5 text-[10px] text-slate-500">
                        {p.defaultRate ? (
                          <span className="font-mono text-emerald-800 font-bold">
                            ₹{p.defaultRate} / {p.unit || 'KG'}
                          </span>
                        ) : null}
                        {p.secondaryUnit && (
                          <span className="text-amber-800 font-medium">
                            1 {p.secondaryUnit} = {p.conversionFactor || 50} {p.unit || 'KG'}
                          </span>
                        )}
                        {p.gstRate !== undefined && (
                          <span className="text-slate-500 font-mono">
                            GST {p.gstRate}%
                          </span>
                        )}
                        {p.hsnCode && (
                          <span className="text-slate-400 font-mono">
                            HSN: {p.hsnCode}
                          </span>
                        )}
                      </div>
                    </div>

                    {isSelected && (
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    )}
                  </button>
                );
              })
            ) : (
              <div className="p-4 text-center space-y-2">
                <p className="text-xs text-slate-500">
                  No products found matching <strong className="text-slate-800">"{searchTerm}"</strong>
                </p>
                {onOpenAddProductModal && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsOpen(false);
                      onOpenAddProductModal();
                    }}
                    className="inline-flex items-center space-x-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs"
                  >
                    <PackagePlus className="w-3.5 h-3.5" />
                    <span>Create "{searchTerm}" as Product</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Footer count */}
          <div className="px-2.5 py-1 bg-slate-50 border-t border-slate-200 text-[10px] text-slate-500 flex items-center justify-between">
            <span>Showing {filteredProducts.length} of {products.length} products</span>
            <span className="text-slate-400">Click to apply rate & units</span>
          </div>
        </div>
      )}
    </div>
  );
};
