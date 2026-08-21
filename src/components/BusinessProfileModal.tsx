import React, { useState, useEffect } from 'react';
import { X, Building2, Save, MapPin, Phone, Mail, CreditCard, FileText } from 'lucide-react';
import { BusinessProfile } from '../types';
import { useApp } from '../context/AppContext';

interface BusinessProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BusinessProfileModal: React.FC<BusinessProfileModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { businessProfile, updateBusinessProfile } = useApp();
  const [profile, setProfile] = useState<BusinessProfile>({ ...businessProfile });
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setProfile({ ...businessProfile });
    }
  }, [isOpen, businessProfile]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateBusinessProfile(profile);
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden my-6">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-900 text-white">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-blue-600 rounded-lg">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg">
                Business Profile & GST Billing Settings
              </h3>
              <p className="text-xs text-slate-300">
                Details appear on your printed Tax Invoices, Delivery Challans & Bilty notes
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Company / Business Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={profile.companyName}
                onChange={(e) => setProfile({ ...profile, companyName: e.target.value })}
                placeholder="e.g. WESTERN CHEM ZONE / NIRMAALADEVI CARE"
                className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm font-semibold uppercase focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                GSTIN Number (15 Digits)
              </label>
              <input
                type="text"
                maxLength={15}
                value={profile.gstin || ''}
                onChange={(e) => setProfile({ ...profile, gstin: e.target.value.toUpperCase() })}
                placeholder="24AABCV1234F1Z8"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono uppercase focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                PAN Number
              </label>
              <input
                type="text"
                maxLength={10}
                value={profile.panNo || ''}
                onChange={(e) => setProfile({ ...profile, panNo: e.target.value.toUpperCase() })}
                placeholder="AABCV1234F"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono uppercase focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Contact Phone / WhatsApp <span className="text-rose-500">*</span>
              </label>
              <input
                type="tel"
                required
                value={profile.phone}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Official Email Address
              </label>
              <input
                type="email"
                value={profile.email}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Business Address (Factory / Godown / Office)
              </label>
              <textarea
                rows={2}
                value={profile.address}
                onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">City</label>
              <input
                type="text"
                value={profile.city}
                onChange={(e) => setProfile({ ...profile, city: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">State</label>
              <input
                type="text"
                value={profile.state}
                onChange={(e) => setProfile({ ...profile, state: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Pincode</label>
              <input
                type="text"
                value={profile.pincode}
                onChange={(e) => setProfile({ ...profile, pincode: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none"
              />
            </div>
          </div>

          {/* Bill / Voucher Number Series Settings */}
          <div className="p-3.5 bg-blue-50/60 rounded-xl border border-blue-200 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-blue-900 uppercase tracking-wider flex items-center space-x-1.5">
                <FileText className="w-4 h-4 text-blue-600" />
                <span>Bill / Voucher Number Series Configuration</span>
              </h4>
              <span className="text-[11px] font-mono font-bold bg-blue-600 text-white px-2 py-0.5 rounded shadow-xs">
                Format: {profile.invoicePrefix || 'MOB'}/{profile.invoiceStartingNo ?? 0}/26-27
              </span>
            </div>

            <p className="text-xs text-slate-600">
              New orders will follow this billing series with auto-calculated Financial Year (e.g. <strong>26-27</strong> for FY 2026-27).
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Series Prefix <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={profile.invoicePrefix ?? 'MOB'}
                  onChange={(e) => setProfile({ ...profile, invoicePrefix: e.target.value.toUpperCase() })}
                  placeholder="e.g. MOB"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-md text-xs bg-white font-mono uppercase font-bold outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Starting Serial Sequence
                </label>
                <input
                  type="number"
                  min="0"
                  value={profile.invoiceStartingNo ?? 0}
                  onChange={(e) => setProfile({ ...profile, invoiceStartingNo: parseInt(e.target.value, 10) || 0 })}
                  placeholder="0"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-md text-xs bg-white font-mono outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Financial Year Calculation
                </label>
                <div className="flex items-center space-x-2 py-1.5">
                  <input
                    type="checkbox"
                    id="autoFY"
                    checked={profile.autoFinancialYear !== false}
                    onChange={(e) => setProfile({ ...profile, autoFinancialYear: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <label htmlFor="autoFY" className="text-xs text-slate-800 font-medium cursor-pointer">
                    Auto-Calculate (Apr–Mar)
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Bank Transfer Details */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-1.5">
              <CreditCard className="w-4 h-4 text-blue-600" />
              <span>Bank Account & Payment Details (For Invoices)</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Bank Name</label>
                <input
                  type="text"
                  value={profile.bankName || ''}
                  onChange={(e) => setProfile({ ...profile, bankName: e.target.value })}
                  placeholder="e.g. State Bank of India"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-md text-xs bg-white outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Account Number</label>
                <input
                  type="text"
                  value={profile.accountNumber || ''}
                  onChange={(e) => setProfile({ ...profile, accountNumber: e.target.value })}
                  placeholder="e.g. 382901928471"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-md text-xs bg-white font-mono outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">IFSC Code</label>
                <input
                  type="text"
                  value={profile.ifscCode || ''}
                  onChange={(e) => setProfile({ ...profile, ifscCode: e.target.value.toUpperCase() })}
                  placeholder="e.g. SBIN0001824"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-md text-xs bg-white font-mono uppercase outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">UPI ID (VPA)</label>
                <input
                  type="text"
                  value={profile.upiId || ''}
                  onChange={(e) => setProfile({ ...profile, upiId: e.target.value })}
                  placeholder="e.g. vyapar@okhdfcbank"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-md text-xs bg-white font-mono outline-none"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Invoice Terms & Conditions
            </label>
            <textarea
              rows={2}
              value={profile.termsAndConditions || ''}
              onChange={(e) => setProfile({ ...profile, termsAndConditions: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs outline-none"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm flex items-center space-x-1.5"
            >
              <Save className="w-4 h-4" />
              <span>{isSaved ? 'Saved Successfully!' : 'Save Business Settings'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
