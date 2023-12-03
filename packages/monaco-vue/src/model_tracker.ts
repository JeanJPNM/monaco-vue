import type * as monaco from 'monaco-editor'

type Model = monaco.editor.ITextModel

/** Tracks how many components depend on each model id */
const modelUsage = new Map<string, number>()

/**
 * Helps the editor componets to track which
 * editor models they are using to later dispose
 * of them in order to prevent memory leaks.
 */
export class ModelTracker {
  #usedModels = new Set<Model>()

  add(model: Model) {
    if (this.#usedModels.has(model)) return
    this.#usedModels.add(model)
    registerModel(model)
  }

  disposeModels() {
    for (const model of this.#usedModels) {
      unregisterModel(model)
      if (canDisposeModel(model)) model.dispose()
    }
  }
}

/**
 * Increments the model's usage count if it is not present in `usedModels`
 */
function registerModel(model: Model) {
  const count = modelUsage.get(model.id) ?? 0
  modelUsage.set(model.id, count + 1)
}

/**
 * Decrements the model's usage count.
 */
function unregisterModel(model: Model) {
  const count = modelUsage.get(model.id) ?? 0

  if (count > 1) {
    modelUsage.set(model.id, count - 1)
    return
  }

  modelUsage.delete(model.id)
}

function canDisposeModel(model: Model) {
  const count = modelUsage.get(model.id) ?? 0
  return count == 0
}
