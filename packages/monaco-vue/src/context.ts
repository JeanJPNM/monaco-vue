import { provide, type InjectionKey, inject } from 'vue'
import type { MonacoRef } from './monaco'

export interface MonacoContext {
  monacoRef: MonacoRef
}

const key: InjectionKey<MonacoContext> = Symbol()

export function provideMonaco(context: MonacoContext) {
  provide(key, context)
}

export function injectMonaco() {
  const context = inject(key)
  if (!context) throw new Error('provideMonaco must be called within a parent component')
  return context
}
