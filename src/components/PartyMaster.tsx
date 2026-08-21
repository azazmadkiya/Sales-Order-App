import React, { useState } from 'react';
import { 
  Users, 
  UserPlus, 
  Search, 
  Filter, 
  Edit3, 
  Trash2, 
  Phone, 
  Mail, 
  MapPin, 
  Building2, 
  FileText,
  DollarSign,
  Plus
} from 'lucide-react';
import { Party, PartyType } from '../types';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { formatCurrency } from '../utils/taxCalculator';
import { QuickAddPartyModal } from './QuickAddPartyModal';

export const PartyMaster: React.FC = () => {
  const { parties, updateParty, deleteParty, orders } = useApp();
  const { permissions } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingParty, setEditingParty] = useState<Party | null>(null);

  const filteredParties = parties.filter((p) => {
    if (typeFilter !== 'ALL' && p.partyType !== typeFilter) return false;
    if (searchTerm && searchTerm.trim()) {
      const q = searchTerm.trim().toLowerCase();
      const matchName = (p.partyName || '').toLowerCase().includes(q);
      const matchPhone = (p.phone || '').includes(q);
      const matchGst = (p.gstin || '').toLowerCase().includes(q);
      const matchCity = (p.city || '').toLowerCase().includes(q);
      if (!matchName && !matchPhone && !matchGst && !matchCity) return false;
    }
    return true;
  });

  const getPartyOrderCount = (partyName: string) => {
    return orders.filter(
      o => (o.partyName || '').trim().toLowerCase() === (partyName || '').trim().toLowerCase()
    ).length;
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingParty) return;
    await updateParty(editingParty.id, editingParty);
    setEditingParty(null);
  };

  return (
    <div className="max-w-7xl mx-auto py-5 px-3 sm:px-6 space-y-5">
      
      {/* Header */}
      <div className="bg-slate-900 text-white rounded-xl p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-blue-600 rounded-lg">
              <Users className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold tracking-tight">
              Party Master & Accounts Ledger
            </h1>
          </div>
          <p className="text-xs text-slate-300 mt-1 max-w-xl">
            Manage your Customers and Suppliers. Parties added here will automatically appear in Sales Order / Voucher dropdowns.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-sm transition-colors self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          <span>+ Add New Party</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by Party Name, GSTIN, Phone, City..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        <div className="flex items-center space-x-2 text-xs font-semibold">
          {['ALL', 'Customer', 'Supplier', 'Both'].map((type) => (
            <button
              key={type}
              onClick={() => setTypeFilter(type)}
              className={`px-3 py-1.5 rounded-md border transition-colors ${
                typeFilter === type
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {type === 'ALL' ? 'All Parties' : type}
            </button>
          ))}
        </div>
      </div>

      {/* Parties Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredParties.length === 0 ? (
          <div className="col-span-full bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-500">
            <Users className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            <h3 className="font-bold text-slate-700 text-base">No Parties Found</h3>
            <p className="text-xs text-slate-400 mt-1">Click "+ Add New Party" to create your first customer or vendor account.</p>
          </div>
        ) : (
          filteredParties.map((party) => {
            const orderCount = getPartyOrderCount(party.partyName);
            return (
              <div
                key={party.id}
                className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-100">
                        {party.partyType}
                      </span>
                      <h3 className="font-bold text-slate-900 text-base uppercase mt-1">
                        {party.partyName}
                      </h3>
                      {party.contactPerson && (
                        <p className="text-xs text-slate-500">Attn: {party.contactPerson}</p>
                      )}
                    </div>

                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => setEditingParty(party)}
                        className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-md transition-colors"
                        title="Edit Party"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Delete party ${party.partyName}?`)) {
                            deleteParty(party.id);
                          }
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                        title="Delete Party"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-3 space-y-2 text-xs text-slate-600">
                    {party.phone && (
                      <div className="flex items-center space-x-2">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-medium">{party.phone}</span>
                      </div>
                    )}
                    {party.gstin && (
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">GST</span>
                        <span className="font-mono font-medium">{party.gstin}</span>
                      </div>
                    )}
                    {(party.billingAddress || party.city) && (
                      <div className="flex items-start space-x-2">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                        <span className="line-clamp-2">{party.billingAddress || `${party.city}, ${party.state}`}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Current Balance</span>
                    <span className="font-mono font-bold text-slate-900 text-sm">
                      {permissions.canViewAmounts ? formatCurrency(party.currentBalance || 0) : '₹ ••••••'}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-slate-400 block text-[10px]">Total Orders</span>
                    <span className="font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                      {orderCount} Vouchers
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add Party Modal */}
      <QuickAddPartyModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onPartyCreated={() => {}}
      />

      {/* Edit Party Modal */}
      {editingParty && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden my-8">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
              <h3 className="font-bold text-slate-800 text-base">Edit Party Account</h3>
              <button
                onClick={() => setEditingParty(null)}
                className="p-1 rounded text-slate-400 hover:text-slate-600"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Party Name
                </label>
                <input
                  type="text"
                  required
                  value={editingParty.partyName}
                  onChange={(e) => setEditingParty({ ...editingParty, partyName: e.target.value })}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm font-semibold uppercase outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={editingParty.phone}
                    onChange={(e) => setEditingParty({ ...editingParty, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">GSTIN</label>
                  <input
                    type="text"
                    value={editingParty.gstin || ''}
                    onChange={(e) => setEditingParty({ ...editingParty, gstin: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono uppercase outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Billing Address</label>
                <textarea
                  rows={2}
                  value={editingParty.billingAddress}
                  onChange={(e) => setEditingParty({ ...editingParty, billingAddress: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">City</label>
                  <input
                    type="text"
                    value={editingParty.city}
                    onChange={(e) => setEditingParty({ ...editingParty, city: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">State</label>
                  <input
                    type="text"
                    value={editingParty.state}
                    onChange={(e) => setEditingParty({ ...editingParty, state: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Balance (₹)</label>
                  <input
                    type="number"
                    value={editingParty.currentBalance || 0}
                    onChange={(e) => setEditingParty({ ...editingParty, currentBalance: parseFloat(e.target.value) || 0 })}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-mono outline-none"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setEditingParty(null)}
                  className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm"
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
