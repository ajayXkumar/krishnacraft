// Server-side authoritative catalog. Prices are computed from this file,
// never from data sent by the client.
//
// IMPORTANT: keep this file in sync with src/data/products.ts in the frontend.
// (When you migrate to a Firestore `products` collection, replace this with a Firestore read.)

export interface ServerProduct {
  id: string;
  name: string;
  category: string;
  price: number;
  img: string;
  wood: string;
}

export const PRODUCTS: ServerProduct[] = [
  { id: 'lg-singhasan-01', name: 'Royal Singhasan for Ladoo Gopal', category: 'Ladoo Gopal', price: 4999, img: 'https://images.unsplash.com/photo-1599583863916-e06c29087f51?w=900&q=80', wood: 'Sheesham' },
  { id: 'lg-bed-02', name: 'Krishna Palang — Carved Royal Bed', category: 'Ladoo Gopal', price: 3499, img: 'https://images.unsplash.com/photo-1567016432779-094069958ea5?w=900&q=80', wood: 'Mango Wood' },
  { id: 'lg-jhula-03', name: 'Bal Gopal Wooden Jhula', category: 'Ladoo Gopal', price: 2799, img: 'https://images.unsplash.com/photo-1602810316693-3667c854239a?w=900&q=80', wood: 'Mango Wood' },
  { id: 'lg-mandir-04', name: 'Heritage Pooja Mandir', category: 'Ladoo Gopal', price: 18999, img: 'https://images.unsplash.com/photo-1583846783214-7229a91b20ed?w=900&q=80', wood: 'Teak' },
  { id: 'lg-chowki-05', name: 'Carved Pooja Chowki Set', category: 'Ladoo Gopal', price: 1899, img: 'https://images.unsplash.com/photo-1591019479261-1a103585c559?w=900&q=80', wood: 'Sheesham' },
  { id: 'lg-shringar-06', name: 'Bal Gopal Shringar Box', category: 'Ladoo Gopal', price: 3499, img: 'https://images.unsplash.com/photo-1585412727339-54e4bae3bbf9?w=900&q=80', wood: 'Sheesham' },
  { id: 'bed-king-01', name: 'Maharaja King Size Bed', category: 'Beds', price: 89000, img: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=900&q=80', wood: 'Solid Sheesham' },
  { id: 'bed-queen-01', name: 'Heritage Queen Carved Bed', category: 'Beds', price: 65000, img: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=900&q=80', wood: 'Mango Wood' },
  { id: 'bed-low-01', name: 'Minimalist Low Platform Bed', category: 'Beds', price: 42000, img: 'https://images.unsplash.com/photo-1540518614846-7eded433c457?w=900&q=80', wood: 'Sheesham' },
  { id: 'bed-storage-01', name: 'Solid Wood Storage Bed', category: 'Beds', price: 72000, img: 'https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=900&q=80', wood: 'Solid Sheesham' },
  { id: 'bed-four-poster-01', name: 'Four-Poster Heritage Bed', category: 'Beds', price: 145000, img: 'https://images.unsplash.com/photo-1620626011761-996317b8d101?w=900&q=80', wood: 'Solid Teak' },
  { id: 'almirah-01', name: 'Jodhpur Royal Almirah', category: 'Almirahs', price: 54999, img: 'https://images.unsplash.com/photo-1595428774223-ef52624120d2?w=900&q=80', wood: 'Sheesham' },
  { id: 'almirah-02', name: 'Vintage Carved Almirah', category: 'Almirahs', price: 42500, img: 'https://images.unsplash.com/photo-1551298370-9d3d53740c72?w=900&q=80', wood: 'Mango Wood' },
  { id: 'almirah-modern-01', name: 'Modern Wardrobe with Mirror', category: 'Almirahs', price: 38000, img: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=900&q=80', wood: 'Sheesham' },
  { id: 'almirah-display-01', name: 'Heritage Display Cabinet', category: 'Almirahs', price: 48000, img: 'https://images.unsplash.com/photo-1564540583246-934409427776?w=900&q=80', wood: 'Sheesham' },
  { id: 'gate-01', name: 'Haveli Carved Entrance Door', category: 'Gates', price: 35000, img: 'https://images.unsplash.com/photo-1600585152915-d208bec867a1?w=900&q=80', wood: 'Teak' },
  { id: 'gate-02', name: 'Antique Brass-Studded Gate', category: 'Gates', price: 48000, img: 'https://images.unsplash.com/photo-1571055107559-3e67626fa8be?w=900&q=80', wood: 'Teak' },
  { id: 'gate-03', name: 'Carved Pooja Room Door', category: 'Gates', price: 22000, img: 'https://images.unsplash.com/photo-1517991104123-1d56a6e81ed9?w=900&q=80', wood: 'Sheesham' },
  { id: 'gate-04', name: 'Jharokha Window Frame', category: 'Gates', price: 28000, img: 'https://images.unsplash.com/photo-1452587925148-ce544e77e70d?w=900&q=80', wood: 'Teak' },
  { id: 'table-01', name: 'Live-Edge Dining Table', category: 'Tables', price: 38000, img: 'https://images.unsplash.com/photo-1577140917170-285929fb55b7?w=900&q=80', wood: 'Acacia' },
  { id: 'table-02', name: 'Walnut Coffee Table', category: 'Tables', price: 14500, img: 'https://images.unsplash.com/photo-1532372576444-dda954194ad0?w=900&q=80', wood: 'Walnut' },
  { id: 'table-03', name: 'Carved Console Table', category: 'Tables', price: 22000, img: 'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=900&q=80', wood: 'Sheesham' },
  { id: 'table-side-01', name: 'Round Side Table', category: 'Tables', price: 7500, img: 'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=900&q=80', wood: 'Mango Wood' },
  { id: 'table-study-01', name: 'Heritage Study Desk', category: 'Tables', price: 26000, img: 'https://images.unsplash.com/photo-1592078615290-033ee584e267?w=900&q=80', wood: 'Sheesham' },
  { id: 'table-nest-01', name: 'Nest of Three Tables', category: 'Tables', price: 12500, img: 'https://images.unsplash.com/photo-1631679706909-1844bbd07221?w=900&q=80', wood: 'Mango Wood' },
];

export function findProduct(id: string): ServerProduct | undefined {
  return PRODUCTS.find(p => p.id === id);
}
