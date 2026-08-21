import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, Check, UserPlus, X, Building2, MapPin, Phone } from 'lucide-react';
import { Party } from '../types';

interface SearchablePartySelectProps {
  parties: Party[];
  selectedPartyId: string;
  partyName: string;
  onSelectParty: (party: Party) => void;
  onManualNameChange: (name: string) => void;
  onOpenAddPartyModal: () => void;
  placeholder?: string;
}

export const SearchablePartySelect: React.FC<SearchablePartySelectProps> = ({
  parties,
  selectedPartyId,
  partyName,
  onSelectParty,
  onManualNameChange,
  onOpenAddPartyModal,
  placeholder = 'Search or enter Party A/c Name...',
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

  // Filter parties by search query
  const filteredParties = parties.filter((p) => {
    const q = searchTerm.toLowerCase().trim();
    if (!q) return true;
    return (
      (p.partyName || '').toLowerCase().includes(q) ||
      (p.city || '').toLowerCase().includes(q) ||
      (p.state || '').toLowerCase().includes(q) ||
      (p.phone || '').toLowerCase().includes(q) ||
      (p.gstin || '').toLowerCase().includes(q) ||
      (p.contactPerson || '').toLowerCase().includes(q)
    );
  });

  const selectedParty = parties.find((p) => p.id === selectedPartyId);

  return (
    <div className="relative flex-1" ref={containerRef}>
      {/* Primary Input / Button Trigger */}
      <div className="flex items-center gap-1.5 w-full">
        <div className="relative flex-1 flex items-center">
          <input
            type="text"
            value={partyName}
            onChange={(e) => {
              onManualNameChange(e.target.value);
            }}
            onFocus={() => setIsOpen(true)}
            placeholder={placeholder}
            className="w-full bg-white border-b-2 border-slate-300 focus:border-blue-600 px-2 py-1.5 text-sm sm:text-base font-semibold text-slate-900 outline-none uppercase placeholder:normal-case placeholder:font-normal placeholder:text-slate-400"
          />

          {partyName && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onManualNameChange('');
              }}
              className="absolute right-7 p-1 text-slate-400 hover:text-slate-600 rounded-full"
              title="Clear party"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="p-1.5 text-slate-500 hover:text-slate-800 rounded transition-colors"
            title="Search & Select Party Dropdown"
          >
            <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180 text-blue-600' : ''}`} />
          </button>
        </div>

        <button
          type="button"
          onClick={onOpenAddPartyModal}
          className="py-1 px-2 sm:px-2.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg border border-blue-200 text-xs font-semibold flex items-center space-x-1 shrink-0 transition-colors shadow-xs"
          title="Create New Party Master"
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span className="hidden xs:inline">+ New Party</span>
        </button>
      </div>

      {/* Searchable Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1.5 bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-100 max-h-80 flex flex-col">
          
          {/* Quick Search Header */}
          <div className="p-2.5 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Type to search party name, city, GSTIN, mobile..."
                className="w-full pl-8 pr-7 py-1.5 text-xs sm:text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onOpenAddPartyModal();
              }}
              className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center space-x-1 shrink-0 transition-colors shadow-xs"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Add Party</span>
            </button>
          </div>

          {/* Party List Results */}
          <div className="overflow-y-auto divide-y divide-slate-100 flex-1">
            {filteredParties.length > 0 ? (
              filteredParties.map((p) => {
                const isSelected = p.id === selectedPartyId || p.partyName.toLowerCase() === partyName.toLowerCase();
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      onSelectParty(p);
                      setIsOpen(false);
                    }}
                    className={`w-full text-left p-2.5 sm:p-3 hover:bg-blue-50/80 transition-colors flex items-start justify-between gap-2 ${
                      isSelected ? 'bg-blue-50/50 border-l-4 border-blue-600' : ''
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-xs sm:text-sm text-slate-900 truncate">
                          {p.partyName}
                        </span>
                        {p.partyType && (
                          <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-medium shrink-0">
                            {p.partyType}
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1 text-[11px] text-slate-500">
                        {(p.city || p.state) && (
                          <span className="flex items-center space-x-1">
                            <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>{[p.city, p.state].filter(Boolean).join(', ')}</span>
                          </span>
                        )}
                        {p.phone && (
                          <span className="flex items-center space-x-1">
                            <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="font-mono">{p.phone}</span>
                          </span>
                        )}
                        {p.gstin && (
                          <span className="font-mono text-slate-600 font-semibold bg-slate-100 px-1.5 py-0.2 rounded text-[10px]">
                            GST: {p.gstin}
                          </span>
                        )}
                      </div>
                    </div>

                    {isSelected && (
                      <Check className="w-4 h-4 text-blue-600 shrink-0 mt-1" />
                    )}
                  </button>
                );
              })
            ) : (
              <div className="p-5 text-center space-y-2">
                <p className="text-xs text-slate-500">
                  No parties found matching <strong className="text-slate-800">"{searchTerm}"</strong>
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    onOpenAddPartyModal();
                  }}
                  className="inline-flex items-center space-x-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Create "{searchTerm}" as New Party</span>
                </button>
              </div>
            )}
          </div>

          {/* Footer status / count */}
          <div className="px-3 py-1.5 bg-slate-50 border-t border-slate-200 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Showing {filteredParties.length} of {parties.length} parties</span>
            <span className="text-slate-400">Click to auto-fill details</span>
          </div>
        </div>
      )}
    </div>
  );
};
