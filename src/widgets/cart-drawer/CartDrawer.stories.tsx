import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { createStore, Provider } from "jotai";

import { cartLinesAtom, cartOpenAtom } from "@/entities/cart";

import { CartDrawer } from "./CartDrawer";

const meta: Meta<typeof CartDrawer> = { title: "widgets/CartDrawer", component: CartDrawer };
export default meta;

const openStore = (lines: { slug: string; quantity: number }[]) => {
  const store = createStore();
  store.set(cartLinesAtom, lines);
  store.set(cartOpenAtom, true);
  return store;
};

export const WithItems: StoryObj<typeof CartDrawer> = {
  render: () => (
    <Provider store={openStore([{ slug: "baklava", quantity: 2 }])}>
      <CartDrawer />
    </Provider>
  ),
};

export const Empty: StoryObj<typeof CartDrawer> = {
  render: () => (
    <Provider store={openStore([])}>
      <CartDrawer />
    </Provider>
  ),
};
