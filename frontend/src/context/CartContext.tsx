import { createContext, useContext, useState, useCallback, useEffect, useMemo, type ReactNode } from "react";

export type CartItem = {
  productId: string;
  vendorId: string;
  title: string;
  price: number;
  photo: string | null;
};

type CartContextValue = {
  items: CartItem[];
  count: number;
  total: number;
  addItem: (item: CartItem) => void;
  removeItem: (productId: string) => void;
  clear: () => void;
  isInCart: (productId: string) => boolean;
};

const STORAGE_KEY = "jassa_cart_v1";

const CartContext = createContext<CartContextValue | null>(null);

function loadCart(): CartItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CartItem[]) : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(loadCart);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const addItem = useCallback((item: CartItem) => {
    setItems((prev) => (prev.some((p) => p.productId === item.productId) ? prev : [...prev, item]));
  }, []);

  const removeItem = useCallback((productId: string) => {
    setItems((prev) => prev.filter((p) => p.productId !== productId));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const isInCart = useCallback((productId: string) => items.some((p) => p.productId === productId), [items]);

  const count = items.length;
  const total = useMemo(() => items.reduce((sum, item) => sum + item.price, 0), [items]);

  return (
    <CartContext.Provider value={{ items, count, total, addItem, removeItem, clear, isInCart }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart doit être utilisé dans CartProvider");
  return ctx;
}
