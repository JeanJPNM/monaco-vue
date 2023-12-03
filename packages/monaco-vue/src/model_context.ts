import type * as monaco from 'monaco-editor'
import { inject, provide, type InjectionKey } from 'vue'

export interface ModelContext {
  models: monaco.editor.ITextModel[]
}

const key: InjectionKey<ModelContext> = Symbol()

export function provideModelContext(context: ModelContext) {
  provide(key, context)
}

export function injectModelContext() {
  const context = inject(key)
  if (!context) throw new Error('A model component must be a child of an editor or a model scope')
  return context
}
