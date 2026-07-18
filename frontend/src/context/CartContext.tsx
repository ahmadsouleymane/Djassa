import { createContext, useContext, useState, useCallback, useEffect, useMemo, type ReactNode } from "react";

export type CartItem = {
  productId: string;
  vendorId: string;
  title: string;
  price: number;
  photo: string | null;
  quantity: number;
};

const MAX_QTY = 99;

type CartContextValue = {
  items: CartItem[];
  count: number;
  total: number;
  addItem: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  removeItem: (productId: string) => void;
  setQuantity: (productId: string, quantity: number) => void;
  clear: () => void;
  isInCart: (productId: string) => boolean;
};

const STORAGE_KEY = "djassa_cart_v2";

const CartContext = createContext<CartContextValue | null>(null);

function clampQty(n: number): number {
  if (!Number.isFinite(n)) return 1;
  return Math.max(1, Math.min(MAX_QTY, Math.round(n)));
}

function loadCart(): CartItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as CartItem[];
    if (!Array.isArray(parsed)) return [];
    // Normalise (anciennes entrées sans quantité)
    return parsed
      .filter((p) => p && typeof p.productId === "string")
      .map((p) => ({ ...p, quantity: clampQty(p.quantity ?? 1) }));
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(loadCart);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const addItem = useCallback((item: Omit<CartItem, "quantity">, quantity = 1) => {
    const qty = clampQty(quantity);
    setItems((prev) => {
      const existing = prev.find((p) => p.productId === item.productId);
      if (existing) {
        return prev.map((p) =>
          p.productId === item.productId ? { ...p, quantity: clampQty(p.quantity + qty) } : p,
        );
      }
      return [...prev, { ...item, quantity: qty }];
    });
  }, []);

  const removeItem = useCallback((productId: string) => {
    setItems((prev) => prev.filter((p) => p.productId !== productId));
  }, []);

  const setQuantity = useCallback((productId: string, quantity: number) => {
    setItems((prev) =>
      prev.map((p) => (p.productId === productId ? { ...p, quantity: clampQty(quantity) } : p)),
    );
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const isInCart = useCallback((productId: string) => items.some((p) => p.productId === productId), [items]);

  const count = useMemo(() => items.reduce((sum, item) => sum + item.quantity, 0), [items]);
  const total = useMemo(() => items.reduce((sum, item) => sum + item.price * item.quantity, 0), [items]);

  return (
    <CartContext.Provider value={{ items, count, total, addItem, removeItem, setQuantity, clear, isInCart }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart doit être utilisé dans CartProvider");
  return ctx;
}
