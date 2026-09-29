// lib/print/print-text.ts
// Every word a kitchen ticket says, in the restaurant's default language: the kitchen reads one
// language, whatever the guest ordered in. The two held in step by `satisfies`.
import type { ChangeReason } from '@/lib/bill-rules'
import type { Locale } from '@/lib/menu'

type PrintText = {
  table: string
  additionTo: (number: number) => string
  guest: string
  waiter: (name: string) => string
  note: string
  cancel: string
  cancelWhole: (number: number) => string
  cancelSome: (number: number) => string
  reason: Record<ChangeReason, string>
  test: string
  testBody: (printer: string) => string
}

/** The ticket's words, by the restaurant's default language. */
export const PRINT_TEXT = {
  en: {
    table: 'TABLE',
    additionTo: (number) => `ADDITION TO #${number}`,
    guest: 'Guest order (QR)',
    waiter: (name) => `Waiter: ${name}`,
    note: 'NOTE',
    cancel: 'CANCEL',
    cancelWhole: (number) => `Stop all of ticket #${number}`,
    cancelSome: (number) => `Take off ticket #${number}`,
    reason: { changed_mind: 'Guest changed their mind', mistake: 'Ordered by mistake', too_slow: 'Took too long', unavailable: 'Kitchen can’t make it', other: 'Other' },
    test: 'TEST PAGE',
    testBody: (printer) => `Printer “${printer}” is set up. Kitchen tickets will print here.`,
  },
  fr: {
    table: 'TABLE',
    additionTo: (number) => `SUPPLÉMENT AU #${number}`,
    guest: 'Commande client (QR)',
    waiter: (name) => `Serveur : ${name}`,
    note: 'NOTE',
    cancel: 'ANNULATION',
    cancelWhole: (number) => `Arrêter tout le ticket #${number}`,
    cancelSome: (number) => `Retirer du ticket #${number}`,
    reason: { changed_mind: 'Le client a changé d’avis', mistake: 'Commandé par erreur', too_slow: 'Trop d’attente', unavailable: 'La cuisine ne peut pas le faire', other: 'Autre' },
    test: 'PAGE DE TEST',
    testBody: (printer) => `L’imprimante « ${printer} » est prête. Les tickets de cuisine sortiront ici.`,
  },
} as const satisfies Record<Locale, PrintText>
