export type Category = string;

export type ProductTag = 'new' | 'sacred' | 'sale';

export interface Product {
  id: string;
  name: string;
  category: Category;
  price: number;
  oldPrice?: number;
  tag?: ProductTag;
  img: string;        // primary / hero image (shown on card)
  images?: string[];  // full gallery; img is always images[0]
  videoUrl?: string;  // optional YouTube URL shown in gallery
  desc: string;
  wood: string;
  dimensions: string;
}

export interface CartItem {
  id: string;
  qty: number;
}

export type OrderStatus =
  | 'pending'
  | 'paid'
  | 'wood_sourcing'
  | 'cutting'
  | 'carving'
  | 'assembly'
  | 'finishing'
  | 'quality_check'
  | 'packed'
  | 'shipped'
  | 'delivered'
  | 'failed'
  | 'cancelled';

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  pending:       'Order Placed',
  paid:          'Payment Confirmed',
  wood_sourcing: 'Wood Sourcing',
  cutting:       'Cutting & Shaping',
  carving:       'Carving',
  assembly:      'Assembly',
  finishing:     'Finishing & Lacquer',
  quality_check: 'Quality Check',
  packed:        'Packed',
  shipped:       'Shipped',
  delivered:     'Delivered',
  failed:        'Payment Failed',
  cancelled:     'Cancelled',
};

// Ordered workshop progression (excludes terminal states)
export const ORDER_STATUS_FLOW: OrderStatus[] = [
  'pending',
  'paid',
  'wood_sourcing',
  'cutting',
  'carving',
  'assembly',
  'finishing',
  'quality_check',
  'packed',
  'shipped',
  'delivered',
];
