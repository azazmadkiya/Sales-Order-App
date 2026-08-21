import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar, ActiveTab } from './components/Navbar';
import { BottomNav } from './components/BottomNav';
import { OrderList } from './components/OrderList';
import { OrderForm } from './components/OrderForm';
import { ShipmentTracking } from './components/ShipmentTracking';
import { PartyMaster } from './components/PartyMaster';
import { ProductMaster } from './components/ProductMaster';
import { DispatchModal } from './components/DispatchModal';
import { InvoicePrintModal } from './components/InvoicePrintModal';
import { BusinessProfileModal } from './components/BusinessProfileModal';
import { UserManagementModal } from './components/UserManagementModal';
import { LoginPage } from './components/LoginPage';
import { SalesOrder } from './types';

function MainAppContent() {
  const { isLoadingData } = useApp();
  const { permissions } = useAuth();
  const [activeTab, setActiveTab] = useState<ActiveTab>('orders_list');
  const [editingOrder, setEditingOrder] = useState<SalesOrder | null>(null);

  // Modals
  const [activeDispatchOrder, setActiveDispatchOrder] = useState<SalesOrder | null>(null);
  const [isDispatchModalOpen, setIsDispatchModalOpen] = useState(false);

  const [activePrintOrder, setActivePrintOrder] = useState<SalesOrder | null>(null);
  const [printMode, setPrintMode] = useState<'TAX_INVOICE' | 'DELIVERY_CHALLAN'>('TAX_INVOICE');
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isUserManagementOpen, setIsUserManagementOpen] = useState(false);

  // Navigation handlers
  const handleAddNewOrder = () => {
    if (!permissions.canCreateOrder) return;
    setEditingOrder(null);
    setActiveTab('new_order');
  };

  const handleEditOrder = (order: SalesOrder) => {
    if (!permissions.canEditOrder) return;
    setEditingOrder(order);
    setActiveTab('new_order');
  };

  const handleOrderSaveSuccess = (order: SalesOrder, openDispatchModal?: boolean) => {
    setEditingOrder(null);
    if (openDispatchModal && permissions.canDispatch) {
      setActiveDispatchOrder(order);
      setIsDispatchModalOpen(true);
      setActiveTab('shipments');
    } else {
      setActiveTab('orders_list');
    }
  };

  const handleOpenDispatch = (order: SalesOrder) => {
    if (!permissions.canDispatch) return;
    setActiveDispatchOrder(order);
    setIsDispatchModalOpen(true);
  };

  const handleViewInvoice = (order: SalesOrder) => {
    setActivePrintOrder(order);
    setPrintMode('TAX_INVOICE');
    setIsPrintModalOpen(true);
  };

  const handlePrintDeliveryChallan = (order: SalesOrder) => {
    setActivePrintOrder(order);
    setPrintMode('DELIVERY_CHALLAN');
    setIsPrintModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Top Navigation Bar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenProfile={() => setIsProfileModalOpen(true)}
        onOpenNewOrder={handleAddNewOrder}
        onOpenUserManagement={() => setIsUserManagementOpen(true)}
      />

      {/* Main View Container */}
      <main className="flex-1 pb-20 sm:pb-8">
        {activeTab === 'orders_list' && (
          <OrderList
            onAddNewOrder={handleAddNewOrder}
            onEditOrder={handleEditOrder}
            onViewInvoice={handleViewInvoice}
            onOpenDispatch={handleOpenDispatch}
          />
        )}

        {activeTab === 'new_order' && permissions.canCreateOrder && (
          <OrderForm
            initialOrder={editingOrder}
            onSaveSuccess={handleOrderSaveSuccess}
            onCancel={() => {
              setEditingOrder(null);
              setActiveTab('orders_list');
            }}
            onPreviewInvoice={handleViewInvoice}
          />
        )}

        {activeTab === 'shipments' && (
          <ShipmentTracking
            onOpenDispatchModal={handleOpenDispatch}
            onPrintDeliveryChallan={handlePrintDeliveryChallan}
          />
        )}

        {activeTab === 'parties' && <PartyMaster />}

        {activeTab === 'products' && <ProductMaster />}

        {/* Global Footer Credits */}
        <footer className="mt-12 mb-16 sm:mb-4 py-4 text-center border-t border-slate-900/60">
          <p className="text-xs text-slate-500 font-medium tracking-wide">
            Designed & Developed by <span className="text-slate-300 font-semibold">Azazmadkiya</span>
          </p>
        </footer>
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <BottomNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenNewOrder={handleAddNewOrder}
        onOpenProfile={() => setIsProfileModalOpen(true)}
      />

      {/* Dispatch Modal */}
      {permissions.canDispatch && (
        <DispatchModal
          order={activeDispatchOrder}
          isOpen={isDispatchModalOpen}
          onClose={() => {
            setIsDispatchModalOpen(false);
            setActiveDispatchOrder(null);
          }}
          onPrintDeliveryChallan={handlePrintDeliveryChallan}
        />
      )}

      {/* Print Tax Invoice / Delivery Challan Modal */}
      <InvoicePrintModal
        order={activePrintOrder}
        mode={printMode}
        isOpen={isPrintModalOpen}
        onClose={() => {
          setIsPrintModalOpen(false);
          setActivePrintOrder(null);
        }}
      />

      {/* Business Profile Modal */}
      <BusinessProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />

      {/* User Management & Rights Modal (Admin Only) */}
      <UserManagementModal
        isOpen={isUserManagementOpen}
        onClose={() => setIsUserManagementOpen(false)}
      />
    </div>
  );
}

function RootApp() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-slate-400 font-mono font-medium">Initializing Sales Order App...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  return (
    <AppProvider>
      <MainAppContent />
    </AppProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <RootApp />
    </AuthProvider>
  );
}
