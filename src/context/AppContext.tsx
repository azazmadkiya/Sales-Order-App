import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  where,
  getDocs,
  writeBatch
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from './AuthContext';
import { 
  BusinessProfile, 
  Party, 
  Product, 
  SalesOrder, 
  DispatchDetails, 
  OrderStatus 
} from '../types';
import { 
  initialBusinessProfile, 
  initialParties, 
  initialProducts, 
  initialOrders 
} from '../utils/mockData';

// Known mock IDs to purge
const MOCK_PARTY_IDS = new Set(['party_1', 'party_2', 'party_3', 'party_4']);
const MOCK_PRODUCT_IDS = new Set(['prod_csf', 'prod_13', 'prod_01', 'prod_02', 'prod_03', 'prod_04', 'prod_05']);
const MOCK_ORDER_IDS = new Set(['ord_1001', 'ord_1002', 'ord_1003', 'ord_1004']);

interface AppContextType {
  parties: Party[];
  products: Product[];
  orders: SalesOrder[];
  businessProfile: BusinessProfile;
  isLoadingData: boolean;
  
  // Party actions
  addParty: (party: Omit<Party, 'id' | 'createdAt'>) => Promise<Party>;
  updateParty: (id: string, party: Partial<Party>) => Promise<void>;
  deleteParty: (id: string) => Promise<void>;
  
  // Product actions
  addProduct: (product: Omit<Product, 'id' | 'createdAt'>) => Promise<Product>;
  updateProduct: (id: string, product: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  
  // Order actions
  addOrder: (order: Omit<SalesOrder, 'id' | 'createdAt' | 'updatedAt'>) => Promise<SalesOrder>;
  updateOrder: (id: string, order: Partial<SalesOrder>) => Promise<void>;
  deleteOrder: (id: string) => Promise<void>;
  dispatchOrder: (orderId: string, dispatchDetails: DispatchDetails) => Promise<void>;
  updateOrderStatus: (orderId: string, status: OrderStatus) => Promise<void>;
  updateOrderReminder: (orderId: string, reminderData: {
    hasReminder: boolean;
    reminderDate?: string;
    reminderTime?: string;
    reminderNotes?: string;
    isReminderCompleted?: boolean;
    priority?: 'Normal' | 'High' | 'Urgent';
  }) => Promise<void>;
  
  // Business Profile
  updateBusinessProfile: (profile: Partial<BusinessProfile>) => Promise<void>;

  // Quick Master Helpers
  savePartyFromOrder: (partyName: string, phone?: string, gstin?: string, address?: string, state?: string) => Promise<Party>;
  saveProductFromOrder: (itemCode: string, name: string, rate: number, unit?: string, gstRate?: number, hsnCode?: string) => Promise<Product>;
  
  // Clean Data actions
  clearAllOrders: () => Promise<void>;
  clearAllParties: () => Promise<void>;
  clearAllProducts: () => Promise<void>;
  clearAllData: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'vyaparflow_app_cache_v2';

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  
  const [parties, setParties] = useState<Party[]>(() => {
    try {
      const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_parties`);
      if (saved) {
        const parsed: Party[] = JSON.parse(saved);
        return parsed.filter(p => !MOCK_PARTY_IDS.has(p.id));
      }
      return [];
    } catch {
      return [];
    }
  });

  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_products`);
      if (saved) {
        const parsed: Product[] = JSON.parse(saved);
        return parsed.filter(p => !MOCK_PRODUCT_IDS.has(p.id));
      }
      return [];
    } catch {
      return [];
    }
  });

  const [orders, setOrders] = useState<SalesOrder[]>(() => {
    try {
      const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_orders`);
      if (saved) {
        const parsed: SalesOrder[] = JSON.parse(saved);
        return parsed.filter(o => !MOCK_ORDER_IDS.has(o.id));
      }
      return [];
    } catch {
      return [];
    }
  });

  const [businessProfile, setBusinessProfile] = useState<BusinessProfile>(() => {
    try {
      const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_profile`);
      if (saved) {
        return JSON.parse(saved);
      }
      return initialBusinessProfile;
    } catch {
      return initialBusinessProfile;
    }
  });

  const [isLoadingData, setIsLoadingData] = useState<boolean>(false);

  // Clean old localStorage keys from previous cache version
  useEffect(() => {
    try {
      localStorage.removeItem('vyaparflow_app_cache_v1_parties');
      localStorage.removeItem('vyaparflow_app_cache_v1_products');
      localStorage.removeItem('vyaparflow_app_cache_v1_orders');
    } catch {
      // ignore
    }
  }, []);

  // Sync to local storage
  useEffect(() => {
    try {
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_parties`, JSON.stringify(parties));
    } catch (e) {
      console.error(e);
    }
  }, [parties]);

  useEffect(() => {
    try {
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_products`, JSON.stringify(products));
    } catch (e) {
      console.error(e);
    }
  }, [products]);

  useEffect(() => {
    try {
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_orders`, JSON.stringify(orders));
    } catch (e) {
      console.error(e);
    }
  }, [orders]);

  useEffect(() => {
    try {
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_profile`, JSON.stringify(businessProfile));
    } catch (e) {
      console.error(e);
    }
  }, [businessProfile]);

  // Firestore Real-Time Subscriptions when User is Authenticated
  useEffect(() => {
    if (!user) return;

    setIsLoadingData(true);

    // Parties listener
    const partiesQuery = query(collection(db, 'parties'));
    const unsubscribeParties = onSnapshot(partiesQuery, (snapshot) => {
      const loaded: Party[] = [];
      const toDeleteFromDb: string[] = [];

      snapshot.forEach((docSnap) => {
        const id = docSnap.id;
        if (MOCK_PARTY_IDS.has(id)) {
          toDeleteFromDb.push(id);
        } else {
          loaded.push({ ...(docSnap.data() as Party), id });
        }
      });

      // Purge mock parties from firestore if found
      if (toDeleteFromDb.length > 0) {
        toDeleteFromDb.forEach(async (dId) => {
          try {
            await deleteDoc(doc(db, 'parties', dId));
          } catch {
            // ignore
          }
        });
      }

      setParties(loaded);
      setIsLoadingData(false);
    }, (error) => {
      console.warn('Firestore parties error (falling back to local):', error);
      setIsLoadingData(false);
    });

    // Products listener
    const productsQuery = query(collection(db, 'products'));
    const unsubscribeProducts = onSnapshot(productsQuery, (snapshot) => {
      const loaded: Product[] = [];
      const toDeleteFromDb: string[] = [];

      snapshot.forEach((docSnap) => {
        const id = docSnap.id;
        if (MOCK_PRODUCT_IDS.has(id)) {
          toDeleteFromDb.push(id);
        } else {
          loaded.push({ ...(docSnap.data() as Product), id });
        }
      });

      // Purge mock products from firestore if found
      if (toDeleteFromDb.length > 0) {
        toDeleteFromDb.forEach(async (dId) => {
          try {
            await deleteDoc(doc(db, 'products', dId));
          } catch {
            // ignore
          }
        });
      }

      setProducts(loaded);
    }, (error) => {
      console.warn('Firestore products error:', error);
    });

    // Orders listener
    const ordersQuery = query(collection(db, 'orders'));
    const unsubscribeOrders = onSnapshot(ordersQuery, (snapshot) => {
      const loaded: SalesOrder[] = [];
      const toDeleteFromDb: string[] = [];

      snapshot.forEach((docSnap) => {
        const id = docSnap.id;
        if (MOCK_ORDER_IDS.has(id)) {
          toDeleteFromDb.push(id);
        } else {
          loaded.push({ ...(docSnap.data() as SalesOrder), id });
        }
      });

      // Purge mock orders from firestore if found
      if (toDeleteFromDb.length > 0) {
        toDeleteFromDb.forEach(async (dId) => {
          try {
            await deleteDoc(doc(db, 'orders', dId));
          } catch {
            // ignore
          }
        });
      }

      // Sort by orderDate descending
      loaded.sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime());
      setOrders(loaded);
    }, (error) => {
      console.warn('Firestore orders error:', error);
    });

    // Profile listener
    const profileDocRef = doc(db, 'business_profile', 'primary');
    const unsubscribeProfile = onSnapshot(profileDocRef, (docSnap) => {
      if (docSnap.exists()) {
        setBusinessProfile(docSnap.data() as BusinessProfile);
      } else {
        // Initialize clean business profile if document doesn't exist
        setDoc(profileDocRef, { ...initialBusinessProfile, updatedAt: new Date().toISOString() }).catch(() => {});
      }
    }, (error) => {
      console.warn('Firestore profile error (falling back to local):', error);
    });

    return () => {
      unsubscribeParties();
      unsubscribeProducts();
      unsubscribeOrders();
      unsubscribeProfile();
    };
  }, [user]);

  const addParty = async (partyData: Omit<Party, 'id' | 'createdAt'>): Promise<Party> => {
    const newId = `party_${Date.now()}`;
    const newParty: Party = {
      ...partyData,
      id: newId,
      userId: user?.id,
      createdAt: new Date().toISOString(),
    };

    // Optimistic update
    setParties((prev) => [newParty, ...prev]);

    if (user) {
      try {
        await setDoc(doc(db, 'parties', newId), newParty);
      } catch (err) {
        console.error('Error saving party to Firestore:', err);
      }
    }

    return newParty;
  };

  const updateParty = async (id: string, partyData: Partial<Party>) => {
    setParties((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...partyData, updatedAt: new Date().toISOString() } : p))
    );

    if (user) {
      try {
        await setDoc(doc(db, 'parties', id), partyData, { merge: true });
      } catch (err) {
        console.error('Error updating party in Firestore:', err);
      }
    }
  };

  const deleteParty = async (id: string) => {
    setParties((prev) => prev.filter((p) => p.id !== id));

    if (user) {
      try {
        await deleteDoc(doc(db, 'parties', id));
      } catch (err) {
        console.error('Error deleting party from Firestore:', err);
      }
    }
  };

  const addProduct = async (productData: Omit<Product, 'id' | 'createdAt'>): Promise<Product> => {
    const newId = `prod_${Date.now()}`;
    const newProduct: Product = {
      ...productData,
      id: newId,
      userId: user?.id,
      createdAt: new Date().toISOString(),
    };

    // Optimistic update
    setProducts((prev) => [newProduct, ...prev]);

    if (user) {
      try {
        await setDoc(doc(db, 'products', newId), newProduct);
      } catch (err) {
        console.error('Error saving product to Firestore:', err);
      }
    }

    return newProduct;
  };

  const updateProduct = async (id: string, productData: Partial<Product>) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...productData, updatedAt: new Date().toISOString() } : p))
    );

    if (user) {
      try {
        await setDoc(doc(db, 'products', id), productData, { merge: true });
      } catch (err) {
        console.error('Error updating product in Firestore:', err);
      }
    }
  };

  const deleteProduct = async (id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));

    if (user) {
      try {
        await deleteDoc(doc(db, 'products', id));
      } catch (err) {
        console.error('Error deleting product from Firestore:', err);
      }
    }
  };

  const addOrder = async (orderData: Omit<SalesOrder, 'id' | 'createdAt' | 'updatedAt'>): Promise<SalesOrder> => {
    const newId = `ord_${Date.now()}`;
    const now = new Date().toISOString();
    const newOrder: SalesOrder = {
      ...orderData,
      id: newId,
      userId: user?.id,
      createdAt: now,
      updatedAt: now,
    };

    // Optimistic update
    setOrders((prev) => [newOrder, ...prev]);

    if (user) {
      try {
        await setDoc(doc(db, 'orders', newId), newOrder);
      } catch (err) {
        console.error('Error saving order to Firestore:', err);
      }
    }

    return newOrder;
  };

  const updateOrder = async (id: string, orderData: Partial<SalesOrder>) => {
    const now = new Date().toISOString();
    setOrders((prev) =>
      prev.map((o) => (o.id === id ? { ...o, ...orderData, updatedAt: now } : o))
    );

    if (user) {
      try {
        await setDoc(doc(db, 'orders', id), { ...orderData, updatedAt: now }, { merge: true });
      } catch (err) {
        console.error('Error updating order in Firestore:', err);
      }
    }
  };

  const deleteOrder = async (id: string) => {
    if (user && user.role !== 'admin') {
      alert('Access Denied: Only Admin users have rights to delete sales orders.');
      return;
    }

    setOrders((prev) => prev.filter((o) => o.id !== id));

    if (user) {
      try {
        await deleteDoc(doc(db, 'orders', id));
      } catch (err) {
        console.error('Error deleting order from Firestore:', err);
      }
    }
  };

  const dispatchOrder = async (orderId: string, dispatchDetails: DispatchDetails) => {
    const updatedStatus: OrderStatus = 'Dispatched';
    const now = new Date().toISOString();
    
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? {
              ...o,
              status: updatedStatus,
              dispatchDetails,
              updatedAt: now,
            }
          : o
      )
    );

    if (user) {
      try {
        await setDoc(
          doc(db, 'orders', orderId),
          {
            status: updatedStatus,
            dispatchDetails,
            updatedAt: now,
          },
          { merge: true }
        );
      } catch (err) {
        console.error('Error updating dispatch in Firestore:', err);
      }
    }
  };

  const updateOrderStatus = async (orderId: string, status: OrderStatus) => {
    const now = new Date().toISOString();
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId ? { ...o, status, updatedAt: now } : o
      )
    );

    if (user) {
      try {
        await setDoc(doc(db, 'orders', orderId), { status, updatedAt: now }, { merge: true });
      } catch (err) {
        console.error('Error updating order status in Firestore:', err);
      }
    }
  };

  const updateOrderReminder = async (
    orderId: string,
    reminderData: {
      hasReminder: boolean;
      reminderDate?: string;
      reminderTime?: string;
      reminderNotes?: string;
      isReminderCompleted?: boolean;
      priority?: 'Normal' | 'High' | 'Urgent';
    }
  ) => {
    const now = new Date().toISOString();
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? {
              ...o,
              ...reminderData,
              updatedAt: now,
            }
          : o
      )
    );

    if (user) {
      try {
        await setDoc(
          doc(db, 'orders', orderId),
          {
            ...reminderData,
            updatedAt: now,
          },
          { merge: true }
        );
      } catch (err) {
        console.error('Error updating reminder in Firestore:', err);
      }
    }
  };

  const updateBusinessProfile = async (profileData: Partial<BusinessProfile>) => {
    const updated = { ...businessProfile, ...profileData };
    setBusinessProfile(updated);

    if (user) {
      try {
        await setDoc(doc(db, 'business_profile', 'primary'), updated, { merge: true });
      } catch (err) {
        console.error('Error updating profile in Firestore:', err);
      }
    }
  };

  // Helper to save party entered manually in order voucher or dispatch
  const savePartyFromOrder = async (
    partyName: string,
    phone?: string,
    gstin?: string,
    address?: string,
    state?: string
  ): Promise<Party> => {
    const cleanPartyName = (partyName || '').trim();
    const existing = parties.find(
      (p) => (p?.partyName || '').trim().toLowerCase() === cleanPartyName.toLowerCase()
    );
    if (existing) {
      // Update phone or gstin if not present
      if ((phone && !existing.phone) || (gstin && !existing.gstin)) {
        await updateParty(existing.id, {
          phone: phone || existing.phone,
          gstin: gstin || existing.gstin,
          billingAddress: address || existing.billingAddress,
          state: state || existing.state,
        });
      }
      return existing;
    }

    return await addParty({
      partyName: cleanPartyName,
      phone: phone || '',
      gstin: gstin || '',
      billingAddress: address || '',
      shippingAddress: address || '',
      state: state || 'Gujarat',
      city: 'Ahmedabad',
      partyType: 'Customer',
      currentBalance: 0,
    });
  };

  // Helper to save product entered manually in order voucher or dispatch
  const saveProductFromOrder = async (
    itemCode: string,
    name: string,
    rate: number,
    unit: string = 'PCS',
    gstRate: number = 18,
    hsnCode: string = ''
  ): Promise<Product> => {
    const cleanItemCode = (itemCode || '').trim();
    const existing = products.find(
      (p) => (p?.itemCode || '').trim().toLowerCase() === cleanItemCode.toLowerCase()
    );
    if (existing) {
      return existing;
    }

    return await addProduct({
      itemCode: cleanItemCode.toUpperCase(),
      name: (name || '').trim() || cleanItemCode.toUpperCase(),
      unit: (unit as any) || 'PCS',
      defaultRate: rate,
      gstRate: gstRate || 18,
      hsnCode: hsnCode || '',
      stockQty: 100,
    });
  };

  // Clear actions
  const clearAllOrders = async () => {
    setOrders([]);
    localStorage.removeItem(`${LOCAL_STORAGE_KEY}_orders`);
    if (user) {
      try {
        const snap = await getDocs(collection(db, 'orders'));
        const batch = writeBatch(db);
        snap.forEach((d) => batch.delete(d.ref));
        await batch.commit();
      } catch (e) {
        console.error('Error clearing orders:', e);
      }
    }
  };

  const clearAllParties = async () => {
    setParties([]);
    localStorage.removeItem(`${LOCAL_STORAGE_KEY}_parties`);
    if (user) {
      try {
        const snap = await getDocs(collection(db, 'parties'));
        const batch = writeBatch(db);
        snap.forEach((d) => batch.delete(d.ref));
        await batch.commit();
      } catch (e) {
        console.error('Error clearing parties:', e);
      }
    }
  };

  const clearAllProducts = async () => {
    setProducts([]);
    localStorage.removeItem(`${LOCAL_STORAGE_KEY}_products`);
    if (user) {
      try {
        const snap = await getDocs(collection(db, 'products'));
        const batch = writeBatch(db);
        snap.forEach((d) => batch.delete(d.ref));
        await batch.commit();
      } catch (e) {
        console.error('Error clearing products:', e);
      }
    }
  };

  const clearAllData = async () => {
    await clearAllOrders();
    await clearAllParties();
    await clearAllProducts();
  };

  return (
    <AppContext.Provider
      value={{
        parties,
        products,
        orders,
        businessProfile,
        isLoadingData,
        addParty,
        updateParty,
        deleteParty,
        addProduct,
        updateProduct,
        deleteProduct,
        addOrder,
        updateOrder,
        deleteOrder,
        dispatchOrder,
        updateOrderStatus,
        updateOrderReminder,
        updateBusinessProfile,
        savePartyFromOrder,
        saveProductFromOrder,
        clearAllOrders,
        clearAllParties,
        clearAllProducts,
        clearAllData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
