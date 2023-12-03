<script lang="ts">
type EditorOptions = monaco.editor.IDiffEditorConstructionOptions
type DiffCodeEditor = monaco.editor.IStandaloneDiffEditor

export interface DiffEditorProps {
  original?: string
  modified?: string
  language?: string

  originalLanguage?: string
  modifiedLanguage?: string

  originalPath?: string
  modifiedPath?: string

  options?: EditorOptions
}
</script>

<script setup lang="ts">
import { useEditorValue } from '@/bindings'
import { injectMonaco } from '@/context'
import { ModelTracker } from '@/model_tracker'
import { getOrCreateModel, type Monaco, type DiffEditorRef } from '@/monaco'
import type * as monaco from 'monaco-editor'
import { computed, ref, shallowRef, watch, watchEffect } from 'vue'

const emit = defineEmits<{
  (e: 'update:original', value: string): void
  (e: 'update:modified', value: string): void
  (e: 'ready', editor: DiffCodeEditor): void
}>()

const props = withDefaults(defineProps<DiffEditorProps>(), {
  original: '',
  modified: '',
  language: 'plaintext',
  options: () => ({})
})

const modelTracker = new ModelTracker()
const containerRef = ref<HTMLElement>()

const { monacoRef } = injectMonaco()

const diffEditorRef = useDiffCodeEditor()

const originalEditorRef = computed(() => diffEditorRef.value?.getOriginalEditor())
const modifiedEditorRef = computed(() => diffEditorRef.value?.getModifiedEditor())

const originalRef = useEditorValue(
  monacoRef,
  originalEditorRef,
  () => props.original,
  () => {
    emit('update:original', originalRef.value)
  }
)

const modifiedRef = useEditorValue(
  monacoRef,
  modifiedEditorRef,
  () => props.modified,
  () => {
    emit('update:modified', modifiedRef.value)
  }
)

watchEffect(() => {
  const diffEditor = diffEditorRef.value
  diffEditor?.updateOptions(props.options)
})

watchEffect(() => {
  const monaco = monacoRef.value
  const diffEditor = diffEditorRef.value
  if (!monaco || !diffEditor) return
  const { original, modified } = diffEditor.getModel()!

  monaco.editor.setModelLanguage(original, props.originalLanguage || props.language)
  monaco.editor.setModelLanguage(modified, props.modifiedLanguage || props.language)
})

watch(
  [() => props.originalPath, monacoRef, originalEditorRef],
  ([path, monaco, editor], [previousPath]) => {
    if (!editor || !monaco || path === previousPath) return
    const model = getOrCreateModel(
      monaco,
      props.original,
      props.originalLanguage || props.language,
      path
    )

    if (model === editor.getModel()) return
    modelTracker.add(model)
  }
)

watch(
  [() => props.modifiedPath, monacoRef, modifiedEditorRef],
  ([path, monaco, editor], [previousPath]) => {
    if (!editor || !monaco || path === previousPath) return
    const model = getOrCreateModel(
      monaco,
      props.modified,
      props.modifiedLanguage || props.language,
      path
    )

    if (model === editor.getModel()) return
    modelTracker.add(model)
  }
)

function createEditor(monaco: Monaco, container: HTMLElement) {
  const editor = monaco.editor.createDiffEditor(container, {
    automaticLayout: true,
    ...props.options
  })

  const originalModel = getOrCreateModel(
    monaco,
    props.original,
    props.originalLanguage || props.language,
    props.originalPath
  )

  const modifiedModel = getOrCreateModel(
    monaco,
    props.modified,
    props.modifiedLanguage || props.language,
    props.modifiedPath
  )

  modelTracker.add(originalModel)
  modelTracker.add(modifiedModel)

  editor.setModel({ original: originalModel, modified: modifiedModel })

  return editor
}

function useDiffCodeEditor() {
  const editorRef: DiffEditorRef = shallowRef()

  watch([containerRef, monacoRef], ([container, monaco], _, onCleanup) => {
    if (!monaco || !container) return

    const editor = createEditor(monaco, container)
    editorRef.value = editor

    emit('ready', editor)

    onCleanup(() => {
      modelTracker.disposeModels()

      editor.dispose()
    })
  })

  return editorRef
}
</script>
<template>
  <slot name="loading" v-if="!diffEditorRef">Loading...</slot>

  <div
    ref="containerRef"
    :class="{ container: true, hidden: !diffEditorRef }"
    v-bind="$attrs"
  ></div>
</template>

<style scoped>
.container {
  width: var(--monaco-vue-diff-editor-width, 100%);
  height: var(--monaco-vue-diff-editor-height, 100%);
}
.hidden {
  display: none;
}
</style>
