import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  arrayUnion,
} from 'firebase/firestore';
import { db } from './config';
import { deleteStorageFile } from './storageUtils';
import type { Order, OrderStatus } from './orders';
import type { UserProfile } from '../store/AuthContext';
import type { Product } from '../types';
import { PRODUCTS } from '../data/products';

function isStorageUrl(url: string) {
  return url.includes('firebasestorage.googleapis.com') || url.includes('firebasestorage.app');
}

// ─── Orders ────────────────────────────────────────────────────────────────

export async function adminGetAllOrders(statusFilter?: OrderStatus): Promise<Order[]> {
  let q;
  if (statusFilter) {
    q = query(collection(db, 'orders'), where('status', '==', statusFilter));
  } else {
    q = query(collection(db, 'orders'));
  }
  const snap = await getDocs(q);
  return snap.docs
    .map(d => ({ id: d.id, ...(d.data() as Omit<Order, 'id'>) }))
    .sort((a, b) => b.createdAt - a.createdAt);
}

export async function adminUpdateOrderStatus(
  orderId: string,
  status: OrderStatus,
  note?: string,
  trackingNumber?: string,
): Promise<void> {
  const updates: Record<string, unknown> = {
    status,
    updatedAt: Date.now(),
    statusHistory: arrayUnion({
      status,
      at: Date.now(),
      note: note || '',
    }),
  };
  if (status === 'delivered') updates.deliveredAt = Date.now();
  if (trackingNumber) updates.trackingNumber = trackingNumber;
  await updateDoc(doc(db, 'orders', orderId), updates);
}

// ─── Dashboard Stats ────────────────────────────────────────────────────────

export interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  ordersToday: number;
  revenueToday: number;
  ordersByStatus: Record<string, number>;
  recentOrders: Order[];
}

export async function adminGetDashboardStats(): Promise<DashboardStats> {
  const snap = await getDocs(collection(db, 'orders'));
  const orders = snap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<Order, 'id'>) }));

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayMs = todayStart.getTime();

  const paidOrders = orders.filter(o => o.paymentStatus === 'paid');
  const todayOrders = paidOrders.filter(o => o.createdAt >= todayMs);

  const ordersByStatus: Record<string, number> = {};
  for (const o of orders) {
    ordersByStatus[o.status] = (ordersByStatus[o.status] || 0) + 1;
  }

  const recentOrders = [...orders]
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, 8);

  return {
    totalRevenue: paidOrders.reduce((s, o) => s + o.total, 0),
    totalOrders: orders.length,
    ordersToday: todayOrders.length,
    revenueToday: todayOrders.reduce((s, o) => s + o.total, 0),
    ordersByStatus,
    recentOrders,
  };
}

// ─── Products (Firestore) ───────────────────────────────────────────────────

export interface AdminProduct extends Product {
  firestoreId?: string;
  inStock: boolean;
  sortOrder?: number;
}

export async function adminGetProducts(): Promise<AdminProduct[]> {
  const snap = await getDocs(collection(db, 'products'));
  if (snap.empty) {
    // Seed from in-code catalog on first load
    await adminSeedProducts();
    const seeded = await getDocs(collection(db, 'products'));
    return seeded.docs.map(d => ({ ...(d.data() as AdminProduct), firestoreId: d.id }));
  }
  return snap.docs
    .map(d => ({ ...(d.data() as AdminProduct), firestoreId: d.id }))
    .sort((a, b) => (a.sortOrder ?? 999) - (b.sortOrder ?? 999));
}

async function adminSeedProducts(): Promise<void> {
  const writes = PRODUCTS.map((p, i) =>
    setDoc(doc(db, 'products', p.id), { ...p, inStock: true, sortOrder: i }),
  );
  await Promise.all(writes);
}

export async function adminSaveProduct(product: AdminProduct): Promise<void> {
  const { firestoreId, ...data } = product;
  const docId = firestoreId || product.id;
  await setDoc(doc(db, 'products', docId), data, { merge: true });
}

export async function adminDeleteProduct(firestoreId: string, imageUrls?: string[]): Promise<void> {
  if (imageUrls?.length) {
    await Promise.allSettled(
      imageUrls.filter(isStorageUrl).map(url => deleteStorageFile(url)),
    );
  }
  await deleteDoc(doc(db, 'products', firestoreId));
}

// ─── Customers ──────────────────────────────────────────────────────────────

export interface CustomerWithOrders extends UserProfile {
  orderCount: number;
  totalSpent: number;
  lastOrderAt?: number;
}

export async function adminGetCustomers(): Promise<CustomerWithOrders[]> {
  const [usersSnap, ordersSnap] = await Promise.all([
    getDocs(collection(db, 'users')),
    getDocs(query(collection(db, 'orders'), where('paymentStatus', '==', 'paid'))),
  ]);

  const ordersByUser: Record<string, Order[]> = {};
  for (const d of ordersSnap.docs) {
    const o = { id: d.id, ...(d.data() as Omit<Order, 'id'>) };
    if (!ordersByUser[o.userId]) ordersByUser[o.userId] = [];
    ordersByUser[o.userId].push(o);
  }

  return usersSnap.docs.map(d => {
    const profile = { uid: d.id, ...(d.data() as Omit<UserProfile, 'uid'>) };
    const userOrders = ordersByUser[d.id] || [];
    return {
      ...profile,
      orderCount: userOrders.length,
      totalSpent: userOrders.reduce((s, o) => s + o.total, 0),
      lastOrderAt: userOrders.length
        ? Math.max(...userOrders.map(o => o.createdAt))
        : undefined,
    };
  });
}
