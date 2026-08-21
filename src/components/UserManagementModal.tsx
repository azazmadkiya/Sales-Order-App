import React, { useState } from 'react';
import { 
  Users, 
  UserPlus, 
  Shield, 
  ShieldCheck, 
  Eye, 
  EyeOff,
  FileText, 
  Truck, 
  Trash2, 
  Edit3, 
  KeyRound, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  X, 
  Lock, 
  User as UserIcon, 
  Phone, 
  Mail,
  HelpCircle,
  Check,
  DollarSign,
  Sliders,
  Sparkles
} from 'lucide-react';
import { AppUser, UserRole, UserPermissions } from '../types';
import { useAuth } from '../context/AuthContext';

interface UserManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ROLE_DEFINITIONS: {
  role: UserRole;
  label: string;
  badgeColor: string;
  icon: any;
  summary: string;
  defaultHideAmounts: boolean;
  permissions: { allowed: string[]; restricted: string[] };
}[] = [
  {
    role: 'admin',
    label: 'Admin (Full Control)',
    badgeColor: 'bg-purple-900/60 text-purple-200 border-purple-700',
    icon: ShieldCheck,
    summary: 'Full master access to orders, billing amounts, user rights, dispatch, and system settings.',
    defaultHideAmounts: false,
    permissions: {
      allowed: [
        'Create, edit & delete sales orders',
        'View & manage all pricing, rates & totals',
        'Dispatch tracking & LR docket management',
        'Party master & Product catalog management',
        'User management & role assignment',
        'Business profile & invoice series config',
      ],
      restricted: [],
    },
  },
  {
    role: 'viewer',
    label: 'Viewer (View Only)',
    badgeColor: 'bg-slate-800 text-slate-200 border-slate-700',
    icon: Eye,
    summary: 'Read-only access to view orders, dispatch status, customer details, and print challans/invoices.',
    defaultHideAmounts: false,
    permissions: {
      allowed: [
        'View sales orders & dispatch status',
        'View customer & product directories',
        'Print delivery challans & vouchers',
      ],
      restricted: [
        'Cannot create or edit sales orders',
        'Cannot dispatch orders or edit LR numbers',
        'Cannot delete any orders or master data',
        'Cannot access user management or business settings',
      ],
    },
  },
  {
    role: 'order_creator',
    label: 'Sales Creator (Add Orders)',
    badgeColor: 'bg-blue-900/60 text-blue-200 border-blue-700',
    icon: FileText,
    summary: 'Create and edit sales orders, vouchers, select parties and products.',
    defaultHideAmounts: false,
    permissions: {
      allowed: [
        'Create new Sales Orders & Vouchers',
        'Edit line items, quantities & taxes',
        'Add & select Customer Parties and Products',
        'Print Sales Orders & Invoices',
      ],
      restricted: [
        'Cannot dispatch orders or log LR docket numbers',
        'Cannot change order dispatch status',
        'Cannot delete existing sales orders',
        'Cannot access user management or business settings',
      ],
    },
  },
  {
    role: 'dispatch_manager',
    label: 'Dispatch / Logistics Manager',
    badgeColor: 'bg-amber-900/60 text-amber-200 border-amber-700',
    icon: Truck,
    summary: 'Manage dispatch queue, transporters, vehicle numbers, LR dockets, and transit tracking.',
    defaultHideAmounts: true, // Dispatches usually only need quantities, weights & LR numbers
    permissions: {
      allowed: [
        'Manage Dispatch Queue & Shipments',
        'Log Transporter, LR/Docket No, Vehicle No',
        'Mark orders as Dispatched / In Transit / Delivered',
        'Generate & Print Delivery Challans / Gate Passes',
      ],
      restricted: [
        'Cannot create new sales orders or change prices',
        'Cannot alter item prices, taxes, or discounts',
        'Cannot delete sales orders',
        'Cannot access user management or business settings',
      ],
    },
  },
];

export const UserManagementModal: React.FC<UserManagementModalProps> = ({ isOpen, onClose }) => {
  const { users, user: currentUser, addUser, updateUser, deleteUser } = useAuth();

  const [activeTab, setActiveTab] = useState<'LIST' | 'FORM'>('LIST');
  const [editingUserId, setEditingUserId] = useState<string | null>(null);

  // Form State
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('order_creator');
  const [hideAmounts, setHideAmounts] = useState<boolean>(false);
  const [showAdvancedRights, setShowAdvancedRights] = useState<boolean>(false);
  const [customPermissions, setCustomPermissions] = useState<Partial<UserPermissions>>({});
  const [isActive, setIsActive] = useState(true);
  
  const [formError, setFormError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const resetForm = () => {
    setEditingUserId(null);
    setDisplayName('');
    setUsername('');
    setPassword('');
    setPhone('');
    setEmail('');
    setSelectedRole('order_creator');
    setHideAmounts(false);
    setShowAdvancedRights(false);
    setCustomPermissions({});
    setIsActive(true);
    setFormError('');
  };

  const handleOpenAddForm = () => {
    resetForm();
    setActiveTab('FORM');
  };

  const handleOpenEditForm = (targetUser: AppUser) => {
    setEditingUserId(targetUser.id);
    setDisplayName(targetUser.displayName);
    setUsername(targetUser.username);
    setPassword(targetUser.password || '');
    setPhone(targetUser.phone || '');
    setEmail(targetUser.email || '');
    setSelectedRole(targetUser.role);
    setHideAmounts(Boolean(targetUser.hideAmounts));
    setCustomPermissions(targetUser.customPermissions || {});
    setShowAdvancedRights(Boolean(targetUser.customPermissions && Object.keys(targetUser.customPermissions).length > 0));
    setIsActive(targetUser.isActive);
    setFormError('');
    setActiveTab('FORM');
  };

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    const def = ROLE_DEFINITIONS.find((r) => r.role === role);
    if (def && !editingUserId) {
      setHideAmounts(def.defaultHideAmounts);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setSuccessMessage('');

    if (!username.trim()) {
      setFormError('Username / Login ID is required.');
      return;
    }

    if (!editingUserId && !password.trim()) {
      setFormError('Password is required for new users.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingUserId) {
        await updateUser(editingUserId, {
          displayName: displayName.trim() || username.trim(),
          phone: phone.trim() || undefined,
          email: email.trim() || undefined,
          role: selectedRole,
          hideAmounts,
          customPermissions: showAdvancedRights ? customPermissions : undefined,
          isActive,
          ...(password.trim() ? { password: password.trim() } : {}),
        });
        setSuccessMessage('User details & rights updated successfully!');
      } else {
        await addUser({
          username: username.trim(),
          displayName: displayName.trim() || username.trim(),
          password: password.trim(),
          phone: phone.trim() || undefined,
          email: email.trim() || undefined,
          role: selectedRole,
          hideAmounts,
          customPermissions: showAdvancedRights ? customPermissions : undefined,
          isActive,
        });
        setSuccessMessage('New user created successfully with configured rights!');
      }

      setTimeout(() => {
        setSuccessMessage('');
        setActiveTab('LIST');
        resetForm();
      }, 1000);
    } catch (err: any) {
      setFormError(err.message || 'Failed to save user.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (targetUser: AppUser) => {
    if ((targetUser.username || '').toLowerCase() === 'azazmadkiya') {
      alert('The primary administrator account cannot be deleted.');
      return;
    }

    if (window.confirm(`Are you sure you want to remove user "${targetUser.displayName || targetUser.username}"?`)) {
      try {
        await deleteUser(targetUser.id);
      } catch (err: any) {
        alert(err.message || 'Failed to delete user.');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="px-5 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded-xl">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <span>User Management & Access Rights</span>
                <span className="px-2 py-0.5 text-[11px] font-semibold bg-blue-950 border border-blue-800 text-blue-300 rounded-full">
                  RBAC & Privacy
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Configure user roles, login credentials, and permission to view/hide financial amounts & rates
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="px-5 pt-3 bg-slate-900/60 border-b border-slate-800 flex items-center justify-between">
          <div className="flex space-x-2">
            <button
              onClick={() => {
                setActiveTab('LIST');
                resetForm();
              }}
              className={`px-4 py-2 text-xs font-semibold rounded-t-lg transition-all border-b-2 flex items-center space-x-2 ${
                activeTab === 'LIST'
                  ? 'border-blue-500 text-blue-400 bg-slate-800/60'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>All Users ({users.length})</span>
            </button>
            <button
              onClick={handleOpenAddForm}
              className={`px-4 py-2 text-xs font-semibold rounded-t-lg transition-all border-b-2 flex items-center space-x-2 ${
                activeTab === 'FORM' && !editingUserId
                  ? 'border-blue-500 text-blue-400 bg-slate-800/60'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>+ Add New User & Set Rights</span>
            </button>
          </div>

          <div className="hidden sm:flex items-center space-x-2 text-xs text-slate-400">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
              {users.filter(u => u.isActive).length} Active
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <EyeOff className="w-3 h-3 text-amber-400 inline-block" />
              {users.filter(u => u.hideAmounts).length} Amounts Hidden
            </span>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="p-5 overflow-y-auto flex-1 text-slate-200">
          
          {/* TAB 1: USERS LIST */}
          {activeTab === 'LIST' && (
            <div className="space-y-4">
              
              {/* Quick Role & Privacy Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                {ROLE_DEFINITIONS.map((def) => {
                  const Icon = def.icon;
                  const count = users.filter((u) => u?.role === def.role).length;
                  return (
                    <div
                      key={def.role}
                      className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl"
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center space-x-1.5">
                          <Icon className="w-4 h-4 text-slate-300" />
                          <span className="text-xs font-bold text-slate-200">{(def.label || '').split(' ')[0]}</span>
                        </div>
                        <span className="px-2 py-0.5 text-[10px] font-bold bg-slate-800 text-slate-300 rounded-full">
                          {count} {count === 1 ? 'user' : 'users'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-tight">
                        {def.summary}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* Users Table */}
              <div className="bg-slate-950/70 border border-slate-800 rounded-xl overflow-hidden shadow-inner">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 bg-slate-950/90 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                        <th className="py-3 px-4">Staff Member</th>
                        <th className="py-3 px-3">Username / Login</th>
                        <th className="py-3 px-3">Role & Access</th>
                        <th className="py-3 px-3">Amount Visibility</th>
                        <th className="py-3 px-3">Status</th>
                        <th className="py-3 px-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {users.map((u) => {
                        const roleDef = ROLE_DEFINITIONS.find((r) => r.role === u?.role) || ROLE_DEFINITIONS[1];
                        const RoleIcon = roleDef.icon;
                        const isPrimaryAdmin = (u?.username || '').toLowerCase() === 'azazmadkiya';
                        const isSelf = currentUser?.id === u?.id;
                        const isAmountsHidden = Boolean(u?.hideAmounts);

                        return (
                          <tr key={u.id} className="hover:bg-slate-800/30 transition-colors">
                            
                            {/* Member Info */}
                            <td className="py-3 px-4">
                              <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 rounded-full bg-blue-900/60 border border-blue-700/50 flex items-center justify-center text-blue-300 font-bold text-xs uppercase shrink-0">
                                  {(u.displayName || u.username || 'U').charAt(0)}
                                </div>
                                <div>
                                  <div className="font-semibold text-slate-100 flex items-center gap-1.5">
                                    <span>{u.displayName || u.username}</span>
                                    {isSelf && (
                                      <span className="px-1.5 py-0.2 bg-blue-950 border border-blue-700 text-blue-300 text-[9px] rounded font-mono">
                                        YOU
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[11px] text-slate-400 flex items-center gap-2">
                                    {u.phone && <span>{u.phone}</span>}
                                    {u.email && <span className="text-slate-500">{u.email}</span>}
                                  </div>
                                </div>
                              </div>
                            </td>

                            {/* Username */}
                            <td className="py-3 px-3 font-mono text-slate-300">
                              @{u.username}
                            </td>

                            {/* Role Badge */}
                            <td className="py-3 px-3">
                              <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border shadow-xs"
                                style={{
                                  backgroundColor: u.role === 'admin' ? '#3b0764' : u.role === 'order_creator' ? '#1e3a8a' : u.role === 'dispatch_manager' ? '#78350f' : '#1e293b',
                                  borderColor: u.role === 'admin' ? '#7e22ce' : u.role === 'order_creator' ? '#3b82f6' : u.role === 'dispatch_manager' ? '#d97706' : '#475569',
                                  color: u.role === 'admin' ? '#e9d5ff' : u.role === 'order_creator' ? '#bfdbfe' : u.role === 'dispatch_manager' ? '#fde68a' : '#cbd5e1'
                                }}
                              >
                                <RoleIcon className="w-3.5 h-3.5" />
                                <span>{roleDef.label}</span>
                              </div>
                            </td>

                            {/* Amount Visibility Badge */}
                            <td className="py-3 px-3">
                              {isAmountsHidden ? (
                                <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-950/80 border border-amber-700/70 text-amber-300" title="User cannot see rates, totals, taxes, or account balances">
                                  <EyeOff className="w-3 h-3" />
                                  <span>Amounts Hidden</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-800 border border-slate-700 text-slate-300">
                                  <Eye className="w-3 h-3 text-emerald-400" />
                                  <span>Amounts Visible</span>
                                </span>
                              )}
                            </td>

                            {/* Status */}
                            <td className="py-3 px-3">
                              {u.isActive ? (
                                <span className="inline-flex items-center space-x-1 text-emerald-400 font-medium text-[11px]">
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>Active</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center space-x-1 text-rose-400 font-medium text-[11px]">
                                  <XCircle className="w-3.5 h-3.5" />
                                  <span>Inactive</span>
                                </span>
                              )}
                            </td>

                            {/* Actions */}
                            <td className="py-3 px-3 text-right">
                              <div className="flex items-center justify-end space-x-1">
                                <button
                                  onClick={() => handleOpenEditForm(u)}
                                  title="Edit User & Rights"
                                  className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-slate-800 rounded-lg transition-colors flex items-center space-x-1"
                                >
                                  <Edit3 className="w-4 h-4" />
                                  <span className="text-[11px] hidden sm:inline">Set Rights</span>
                                </button>
                                
                                {!isPrimaryAdmin && (
                                  <button
                                    onClick={() => handleDelete(u)}
                                    title="Delete User"
                                    className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            </td>

                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ADD / EDIT USER FORM */}
          {activeTab === 'FORM' && (
            <form onSubmit={handleFormSubmit} className="space-y-5">
              
              {/* Form Title */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div>
                  <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                    {editingUserId ? <Edit3 className="w-4 h-4 text-blue-400" /> : <UserPlus className="w-4 h-4 text-blue-400" />}
                    <span>{editingUserId ? 'Edit User Details & Access Rights' : 'Add New User & Set Rights'}</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Configure staff login credentials, assign access role, and set financial amount visibility
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('LIST');
                    resetForm();
                  }}
                  className="text-xs text-slate-400 hover:text-slate-200 underline"
                >
                  Cancel
                </button>
              </div>

              {/* Feedback messages */}
              {formError && (
                <div className="p-3 bg-rose-950/80 border border-rose-800 rounded-xl text-rose-200 text-xs flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {successMessage && (
                <div className="p-3 bg-emerald-950/80 border border-emerald-800 rounded-xl text-emerald-200 text-xs flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{successMessage}</span>
                </div>
              )}

              {/* Form Fields Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Full Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Full Name / Staff Name <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                      <UserIcon className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="e.g. Ramesh Patel"
                      required
                      className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 text-sm focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Username */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Username / Login ID <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                      <KeyRound className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s+/g, '_'))}
                      placeholder="e.g. ramesh_sales"
                      disabled={Boolean(editingUserId)}
                      required
                      className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 text-sm focus:outline-none focus:border-blue-500 disabled:opacity-50 disabled:bg-slate-900"
                    />
                  </div>
                  {editingUserId && (
                    <p className="text-[10px] text-slate-500 mt-0.5">Username cannot be changed after creation.</p>
                  )}
                </div>

                {/* Password */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                    {editingUserId ? 'New Password (leave blank to keep current)' : 'Login Password / PIN *'}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={editingUserId ? '••••••••' : 'Enter password / PIN'}
                      required={!editingUserId}
                      className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 text-sm focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Mobile Phone (Optional)
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                      <Phone className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="e.g. 9876543210"
                      className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 text-sm focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

              </div>

              {/* ROLE SELECTION CARDS */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Select User Access Role <span className="text-rose-400">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {ROLE_DEFINITIONS.map((def) => {
                    const Icon = def.icon;
                    const isSelected = selectedRole === def.role;

                    return (
                      <div
                        key={def.role}
                        onClick={() => handleRoleSelect(def.role)}
                        className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-slate-950 border-blue-500 shadow-md ring-1 ring-blue-500/50'
                            : 'bg-slate-950/50 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center space-x-2.5">
                            <div className={`p-2 rounded-lg ${isSelected ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400'}`}>
                              <Icon className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                                <span>{def.label}</span>
                              </div>
                              <p className="text-[11px] text-slate-400 mt-0.5">
                                {def.summary}
                              </p>
                            </div>
                          </div>
                          
                          <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 mt-1 ${
                            isSelected ? 'bg-blue-600 border-blue-600' : 'border-slate-700'
                          }`}>
                            {isSelected && <Check className="w-3 h-3 text-white" />}
                          </div>
                        </div>

                        {/* Allowed vs Restricted Pills */}
                        <div className="mt-3 pt-2.5 border-t border-slate-800/80 space-y-1 text-[11px]">
                          {def.permissions.allowed.slice(0, 2).map((item, idx) => (
                            <div key={idx} className="flex items-center space-x-1.5 text-emerald-400">
                              <Check className="w-3 h-3 shrink-0" />
                              <span className="truncate">{item}</span>
                            </div>
                          ))}
                          {def.permissions.restricted.slice(0, 2).map((item, idx) => (
                            <div key={idx} className="flex items-center space-x-1.5 text-rose-400/80">
                              <X className="w-3 h-3 shrink-0" />
                              <span className="truncate">{item}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* CRITICAL FEATURE: AMOUNT & FINANCIAL PRIVACY CONTROLS */}
              <div className="p-4 bg-slate-950/80 border-2 border-amber-500/40 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <div className="p-2 bg-amber-500/20 text-amber-400 rounded-lg border border-amber-500/30">
                      <EyeOff className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-amber-200 uppercase tracking-wider flex items-center gap-1.5">
                        <span>Financial Amount & Pricing Privacy Option</span>
                      </h4>
                      <p className="text-xs text-slate-300">
                        Control whether this user can view financial rates, taxable values, totals, and balances
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={hideAmounts}
                        onChange={(e) => setHideAmounts(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
                    </label>
                  </div>
                </div>

                <div className={`p-3 rounded-lg border text-xs leading-relaxed transition-all ${
                  hideAmounts
                    ? 'bg-amber-950/40 border-amber-600/50 text-amber-200'
                    : 'bg-slate-900 border-slate-800 text-slate-300'
                }`}>
                  {hideAmounts ? (
                    <div className="flex items-start space-x-2">
                      <Lock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-amber-300 font-bold block mb-0.5">
                          ✓ RESTRICTED MODE ACTIVE: "View all details, but DO NOT view amounts"
                        </strong>
                        <span>
                          This user will have full access to view order numbers, customer party names, addresses, item names, HSN codes, packages, dispatch LR tracking, and status — <strong>but all rates (₹), total billing amounts, GST tax breakdown, and ledger balances will be hidden/masked with ••••••</strong>.
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start space-x-2">
                      <Eye className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-slate-200 font-bold block mb-0.5">
                          Standard Mode: Amounts Visible
                        </strong>
                        <span>
                          This user can view item rates, order subtotals, GST tax amounts, grand totals, and customer balances according to their assigned role.
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* ADVANCED CUSTOM PERMISSIONS ACCORDION */}
              <div className="border border-slate-800 rounded-xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => setShowAdvancedRights(!showAdvancedRights)}
                  className="w-full px-4 py-3 bg-slate-950/50 hover:bg-slate-950 flex items-center justify-between text-xs font-semibold text-slate-300 transition-colors"
                >
                  <div className="flex items-center space-x-2">
                    <Sliders className="w-4 h-4 text-blue-400" />
                    <span>Fine-Grained Custom Permissions & Overrides (Optional)</span>
                  </div>
                  <span className="text-[11px] text-blue-400 font-normal">
                    {showAdvancedRights ? 'Hide Fine Controls ▲' : 'Customize Rights ▼'}
                  </span>
                </button>

                {showAdvancedRights && (
                  <div className="p-4 bg-slate-950/90 border-t border-slate-800 space-y-3">
                    <p className="text-xs text-slate-400 mb-2">
                      Override specific permissions for this individual account (unchecked uses role defaults):
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      
                      <label className="flex items-center space-x-2 p-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={customPermissions.canCreateOrder ?? (selectedRole === 'admin' || selectedRole === 'order_creator')}
                          onChange={(e) => setCustomPermissions({ ...customPermissions, canCreateOrder: e.target.checked })}
                          className="w-4 h-4 rounded text-blue-600 bg-slate-950 border-slate-700"
                        />
                        <span className="text-slate-200">Can Create New Sales Orders</span>
                      </label>

                      <label className="flex items-center space-x-2 p-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={customPermissions.canEditOrder ?? (selectedRole === 'admin' || selectedRole === 'order_creator')}
                          onChange={(e) => setCustomPermissions({ ...customPermissions, canEditOrder: e.target.checked })}
                          className="w-4 h-4 rounded text-blue-600 bg-slate-950 border-slate-700"
                        />
                        <span className="text-slate-200">Can Edit Orders & Items</span>
                      </label>

                      <div className="flex items-center space-x-2 p-2 rounded-lg bg-slate-900 border border-slate-800 opacity-80">
                        <input
                          type="checkbox"
                          checked={selectedRole === 'admin'}
                          disabled={true}
                          className="w-4 h-4 rounded text-purple-600 bg-slate-950 border-slate-700 cursor-not-allowed"
                        />
                        <span className="text-slate-300">
                          Delete Orders <span className="text-[10px] text-purple-400 font-bold ml-1">(Strictly Admin Only)</span>
                        </span>
                      </div>

                      <label className="flex items-center space-x-2 p-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={customPermissions.canDispatch ?? (selectedRole === 'admin' || selectedRole === 'dispatch_manager')}
                          onChange={(e) => setCustomPermissions({ ...customPermissions, canDispatch: e.target.checked })}
                          className="w-4 h-4 rounded text-blue-600 bg-slate-950 border-slate-700"
                        />
                        <span className="text-slate-200">Can Dispatch & Manage LR Dockets</span>
                      </label>

                      <label className="flex items-center space-x-2 p-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={customPermissions.canManageParties ?? (selectedRole === 'admin' || selectedRole === 'order_creator')}
                          onChange={(e) => setCustomPermissions({ ...customPermissions, canManageParties: e.target.checked })}
                          className="w-4 h-4 rounded text-blue-600 bg-slate-950 border-slate-700"
                        />
                        <span className="text-slate-200">Can Manage Customer Parties</span>
                      </label>

                      <label className="flex items-center space-x-2 p-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={customPermissions.canManageProducts ?? (selectedRole === 'admin' || selectedRole === 'order_creator')}
                          onChange={(e) => setCustomPermissions({ ...customPermissions, canManageProducts: e.target.checked })}
                          className="w-4 h-4 rounded text-blue-600 bg-slate-950 border-slate-700"
                        />
                        <span className="text-slate-200">Can Manage Products Catalog</span>
                      </label>
                    </div>
                  </div>
                )}
              </div>

              {/* Active Toggle */}
              <div className="pt-2">
                <label className="flex items-center space-x-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="w-4 h-4 rounded bg-slate-950 border-slate-700 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-xs font-medium text-slate-200">
                    Account is Active (User can log in)
                  </span>
                </label>
              </div>

              {/* Submit Buttons */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('LIST');
                    resetForm();
                  }}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-md transition-colors flex items-center space-x-2"
                >
                  {isSubmitting ? (
                    <span>Saving User & Rights...</span>
                  ) : (
                    <span>{editingUserId ? 'Save User & Access Rights' : 'Create User Account with Rights'}</span>
                  )}
                </button>
              </div>

            </form>
          )}

        </div>

      </div>
    </div>
  );
};
