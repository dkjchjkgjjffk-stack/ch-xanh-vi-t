import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

type Cart = Record<string, number>;
const Ctx = createContext<{
  cart: Cart;
  add: (id: string, qty?: number) => void;
  setQty: (id: string, qty: number) => void;
  clear: () => void;
  count: number;
} | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<Cart>({});
  useEffect(() => {
    try { setCart(JSON.parse(localStorage.getItem("cart") || "{}")); } catch { /* bỏ qua */ }
  }, []);
  const save = (c: Cart) => { setCart(c); localStorage.setItem("cart", JSON.stringify(c)); };
  const add = (id: string, qty = 1) => save({ ...cart, [id]: (cart[id] || 0) + qty });
  const setQty = (id: string, qty: number) => {
    const c = { ...cart };
    if (qty <= 0) delete c[id]; else c[id] = qty;
    save(c);
  };
  const count = Object.values(cart).reduce((a, b) => a + b, 0);
  return <Ctx.Provider value={{ cart, add, setQty, clear: () => save({}), count }}>{children}</Ctx.Provider>;
}

export function useCart() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useCart ngoài CartProvider");
  return c;
}
