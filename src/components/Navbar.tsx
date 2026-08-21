import React, { useState } from 'react';
import { 
  FileText, 
  PlusCircle, 
  Truck, 
  Users, 
  Package, 
  Building2, 
  LogOut, 
  Menu,
  X,
  ShieldCheck,
  UserCheck,
  UserPlus,
  Eye,
  Download,
  Smartphone
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';

export type ActiveTab = 
  | 'orders_list' 
  | 'new_order' 
  | 'shipments' 
  | 'parties' 
  | 'products';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onOpenProfile: () => void;
  onOpenNewOrder: () => void;
  onOpenUserManagement?: () => void;
  onOpenInstallModal?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenProfile,
  onOpenNewOrder,
  onOpenUserManagement,
  onOpenInstallModal,
}) => {
  const { user, permissions, logOut } = useAuth();
  const { businessProfile } = useApp();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showAuthMenu, setShowAuthMenu] = useState(false);

  const navItems: { id: ActiveTab; label: string; icon: React.ReactNode; show?: boolean }[] = [
    { id: 'orders_list', label: 'Sales Orders', icon: <FileText className="w-4 h-4" /> },
    { id: 'shipments', label: 'Shipments & Dispatch', icon: <Truck className="w-4 h-4" /> },
    { id: 'parties', label: 'Parties Master', icon: <Users className="w-4 h-4" /> },
    { id: 'products', label: 'Products Master', icon: <Package className="w-4 h-4" /> },
  ];

  const getRoleBadge = (role?: string) => {
    switch (role) {
      case 'admin':
        return { label: 'Admin', color: 'bg-purple-950 text-purple-300 border-purple-800' };
      case 'order_creator':
        return { label: 'Sales Creator', color: 'bg-blue-950 text-blue-300 border-blue-800' };
      case 'dispatch_manager':
        return { label: 'Dispatch Mgr', color: 'bg-amber-950 text-amber-300 border-amber-800' };
      case 'viewer':
      default:
        return { label: 'Viewer (Read Only)', color: 'bg-slate-800 text-slate-300 border-slate-700' };
    }
  };

  const roleBadge = getRoleBadge(user?.role);

  return (
    <header className="sticky top-0 z-40 bg-slate-900 text-white border-b border-slate-800 shadow-md">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16">
          
          {/* Brand Zone */}
          <div className="flex items-center space-x-2.5 sm:space-x-3 shrink-0 min-w-0">
            <button 
              onClick={() => setActiveTab('orders_list')}
              className="text-left group flex items-center space-x-2 focus:outline-none"
            >
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-xs sm:text-sm text-white shadow-inner shrink-0 tracking-tight">
                SOA
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-sm sm:text-lg tracking-tight text-slate-100 group-hover:text-blue-400 transition-colors truncate max-w-[130px] sm:max-w-none">
                  Sales Order App
                </span>
                <span className="text-[10px] text-slate-400 font-medium leading-none hidden xs:inline truncate max-w-[140px] sm:max-w-none">
                  {businessProfile?.companyName || 'WESTERN CHEM ZONE'}
                </span>
              </div>
            </button>
          </div>

          {/* Navigation Items (Desktop Zone 2) */}
          <nav className="hidden lg:flex items-center space-x-1">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Action Zone (Zone 3) */}
          <div className="flex items-center space-x-1.5 sm:space-x-2.5">
            {/* Install Android App / Shortcut CTA */}
            {onOpenInstallModal && (
              <button
                onClick={onOpenInstallModal}
                title="Install and create shortcut on Android / Desktop"
                className="flex items-center space-x-1.5 bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-600 hover:to-indigo-600 text-white px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs font-semibold shadow-sm transition-all whitespace-nowrap active:scale-95 cursor-pointer border border-blue-500/30"
              >
                <Smartphone className="w-3.5 h-3.5 text-sky-300" />
                <span className="hidden sm:inline">Install App</span>
                <span className="sm:hidden text-[11px]">Install</span>
              </button>
            )}

            {/* New Order CTA - Only if user has order creation permissions */}
            {permissions.canCreateOrder && (
              <button
                onClick={onOpenNewOrder}
                className="hidden sm:flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold shadow-sm transition-all whitespace-nowrap active:scale-95 cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>+ Add Order</span>
              </button>
            )}

            {/* Manage Users & Access Rights CTA (for Admin) */}
            {permissions.canManageUsers && onOpenUserManagement && (
              <button
                onClick={onOpenUserManagement}
                title="User Management & Access Rights"
                className="hidden md:flex items-center space-x-1.5 bg-purple-950/80 hover:bg-purple-900/90 text-purple-200 border border-purple-800/80 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition-colors cursor-pointer"
              >
                <UserCheck className="w-3.5 h-3.5 text-purple-400" />
                <span>Users & Rights</span>
              </button>
            )}

            {/* Business Profile Button (for Admin) */}
            {permissions.canEditBusinessProfile && (
              <button
                onClick={onOpenProfile}
                title="Business Settings & GST Profile"
                className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors shrink-0"
              >
                <Building2 className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            )}

            {/* Auth Profile Dropdown */}
            <div className="relative">
              {user && (
                <div>
                  <button
                    onClick={() => setShowAuthMenu(!showAuthMenu)}
                    className="flex items-center space-x-1.5 sm:space-x-2 px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 focus:outline-none transition-colors"
                    title={user.displayName || user.username}
                  >
                    <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold text-white shadow-xs shrink-0 uppercase">
                      {(user.displayName || user.username || 'U').charAt(0)}
                    </div>
                    <div className="hidden xl:flex flex-col text-left">
                      <span className="text-xs font-bold text-slate-200 leading-tight truncate max-w-[100px]">
                        {user.displayName || user.username}
                      </span>
                      <span className="text-[10px] text-slate-400 font-semibold leading-none capitalize">
                        {roleBadge.label}
                      </span>
                    </div>
                  </button>

                  {showAuthMenu && (
                    <div className="absolute right-0 mt-2 w-72 bg-slate-900 rounded-xl shadow-2xl py-2 border border-slate-800 z-50 text-sm">
                      <div className="px-4 py-2.5 border-b border-slate-800 bg-slate-950/60">
                        <div className="flex items-center justify-between">
                          <p className="font-bold text-slate-100 truncate">{user.displayName || user.username}</p>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${roleBadge.color}`}>
                            {roleBadge.label}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 font-mono mt-0.5 truncate">
                          ID: @{user.username} {user.email ? `• ${user.email}` : ''}
                        </p>
                      </div>

                      {/* User Management Menu Option (for Admin) */}
                      {permissions.canManageUsers && onOpenUserManagement && (
                        <button
                          onClick={() => {
                            onOpenUserManagement();
                            setShowAuthMenu(false);
                          }}
                          className="w-full text-left px-4 py-2 text-purple-300 hover:bg-purple-950/40 flex items-center space-x-2.5 transition-colors text-xs font-medium"
                        >
                          <UserPlus className="w-4 h-4 text-purple-400" />
                          <span>Add Users & Manage Rights</span>
                        </button>
                      )}

                      {/* Business Profile (for Admin) */}
                      {permissions.canEditBusinessProfile && (
                        <button
                          onClick={() => {
                            onOpenProfile();
                            setShowAuthMenu(false);
                          }}
                          className="w-full text-left px-4 py-2 text-slate-300 hover:bg-slate-800 flex items-center space-x-2.5 transition-colors text-xs font-medium"
                        >
                          <Building2 className="w-4 h-4 text-blue-400" />
                          <span>Business Profile & GST</span>
                        </button>
                      )}

                      <div className="border-t border-slate-800 my-1"></div>

                      <button
                        onClick={() => {
                          logOut();
                          setShowAuthMenu(false);
                        }}
                        className="w-full text-left px-4 py-2 text-rose-400 hover:bg-rose-950/40 hover:text-rose-300 flex items-center space-x-2.5 transition-colors font-medium text-xs"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out (Lock Session)</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Mobile menu trigger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-1.5 sm:p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 focus:outline-none"
              aria-label="Toggle navigation drawer"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-800 bg-slate-950 px-4 pt-3 pb-5 space-y-1 shadow-2xl animate-in slide-in-from-top duration-150">
          <div className="px-3 py-1 flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Navigation Menu
            </span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${roleBadge.color}`}>
              {roleBadge.label}
            </span>
          </div>

          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-left transition-colors ${
                  isActive ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-300 hover:bg-slate-800/80'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            );
          })}

          <div className="border-t border-slate-800 my-2 pt-2 space-y-1">
            {onOpenInstallModal && (
              <button
                onClick={() => {
                  onOpenInstallModal();
                  setMobileMenuOpen(false);
                }}
                className="w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-blue-900/60 to-indigo-900/60 border border-blue-700/50 text-blue-200"
              >
                <Smartphone className="w-4 h-4 text-blue-400" />
                <span>Install & Create Shortcut (Android App)</span>
              </button>
            )}

            {permissions.canCreateOrder && (
              <button
                onClick={() => {
                  onOpenNewOrder();
                  setMobileMenuOpen(false);
                }}
                className="w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold bg-emerald-600 text-white"
              >
                <PlusCircle className="w-4 h-4" />
                <span>+ Create New Sales Order</span>
              </button>
            )}

            {permissions.canManageUsers && onOpenUserManagement && (
              <button
                onClick={() => {
                  onOpenUserManagement();
                  setMobileMenuOpen(false);
                }}
                className="w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-purple-300 bg-purple-950/60 border border-purple-800/60"
              >
                <UserPlus className="w-4 h-4 text-purple-400" />
                <span>Add Users & Manage Rights</span>
              </button>
            )}

            {permissions.canEditBusinessProfile && (
              <button
                onClick={() => {
                  onOpenProfile();
                  setMobileMenuOpen(false);
                }}
                className="w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-300 hover:bg-slate-800"
              >
                <Building2 className="w-4 h-4 text-blue-400" />
                <span>Business Settings & GST</span>
              </button>
            )}
          </div>

          <div className="pt-2 text-center border-t border-slate-900">
            <span className="text-[11px] text-slate-500 font-medium">
              Design By <span className="text-slate-400 font-semibold">Azazmadkiya</span>
            </span>
          </div>
        </div>
      )}
    </header>
  );
};
