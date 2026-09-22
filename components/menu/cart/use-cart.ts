// components/menu/cart/use-cart.ts
// The restaurant's cart as React state: one store per restaurant for the page's lifetime, read
// from localStorage on first use, written on every change, and followed across tabs through
// the storage event. The server renders the empty cart; the client's own appears once hydrated
// (useSyncExternalStore, so nothing is set from an effect).
'use client'

import { useCallback, useMemo, useSyncExternalStore } from 'react'
import { EMPTY_CART, cartCount, cartStorageKey, noteOf, parseCart, quantityOf, readCart, withNote, withQuantity, writeCart, type Cart } from '@/lib/cart'

type Store = { cart: Cart; listeners: Set<() => void> }
const stores = new Map<string, Store>()

/** The store of one restaurant, made from storage on first use; a table carried by the URL replaces the remembered one. */
function storeFor(restaurantId: string, urlTable?: string | null): Store {
  let store = stores.get(restaurantId)
  if (!store) {
    const stored = readCart(restaurantId)
    store = { cart: urlTable ? { ...stored, table: urlTable } : stored, listeners: new Set() }
    stores.set(restaurantId, store)
  }
  return store
}

function commit(restaurantId: string, cart: Cart) {
  const store = storeFor(restaurantId)
  if (cart === store.cart) return
  store.cart = cart
  writeCart(restaurantId, cart)
  store.listeners.forEach((listener) => listener())
}

/** Another tab changed this restaurant's cart: take its value as it is. */
function onStorage(restaurantId: string, event: StorageEvent) {
  if (event.key !== cartStorageKey(restaurantId)) return
  const store = storeFor(restaurantId)
  store.cart = parseCart(event.newValue)
  store.listeners.forEach((listener) => listener())
}

export interface CartApi {
  cart: Cart
  /** The number of items over every line. */
  count: number
  quantityOf: (dishId: string) => number
  /** What the guest asked for on a dish; '' when nothing. */
  noteOf: (dishId: string) => string
  /** One more of a dish, counted from the stored cart rather than this render's, so two quick taps add two. */
  addOne: (dishId: string) => void
  /** 0 removes the dish; the cart's bounds apply (lib/cart). */
  setQuantity: (dishId: string, quantity: number) => void
  /** What the guest asks for on a dish already in the order; a blank note is dropped. */
  setNote: (dishId: string, note: string) => void
  setTable: (table: string) => void
  /** Empties the lines; the table stays for the next order. */
  clear: () => void
}

export function useCart(restaurantId: string, urlTable?: string | null): CartApi {
  const subscribe = useCallback(
    (listener: () => void) => {
      const store = storeFor(restaurantId, urlTable)
      store.listeners.add(listener)
      const sync = (event: StorageEvent) => onStorage(restaurantId, event)
      window.addEventListener('storage', sync)
      return () => {
        store.listeners.delete(listener)
        window.removeEventListener('storage', sync)
      }
    },
    [restaurantId, urlTable],
  )
  const getSnapshot = useCallback(() => storeFor(restaurantId, urlTable).cart, [restaurantId, urlTable])
  const cart = useSyncExternalStore(subscribe, getSnapshot, () => EMPTY_CART)

  return useMemo(
    () => ({
      cart,
      count: cartCount(cart),
      quantityOf: (dishId: string) => quantityOf(cart, dishId),
      noteOf: (dishId: string) => noteOf(cart, dishId),
      addOne: (dishId: string) => {
        const stored = storeFor(restaurantId).cart
        commit(restaurantId, withQuantity(stored, dishId, quantityOf(stored, dishId) + 1))
      },
      setQuantity: (dishId: string, quantity: number) => commit(restaurantId, withQuantity(storeFor(restaurantId).cart, dishId, quantity)),
      setNote: (dishId: string, note: string) => commit(restaurantId, withNote(storeFor(restaurantId).cart, dishId, note)),
      setTable: (table: string) => commit(restaurantId, { ...storeFor(restaurantId).cart, table }),
      clear: () => commit(restaurantId, { ...storeFor(restaurantId).cart, lines: [] }),
    }),
    [cart, restaurantId],
  )
}
