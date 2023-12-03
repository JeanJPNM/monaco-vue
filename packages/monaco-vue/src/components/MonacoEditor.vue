<script lang="ts">
export interface EditorProps {
  value?: string
  defaultValue?: string
  language?: string
  defaultLanguage?: string
  path?: string
  options?: monaco.editor.IStandaloneEditorConstructionOptions
  overrideServices?: monaco.editor.IEditorOverrideServices
  saveViewState?: boolean
}
</script>
<script setup lang="ts">
import { ref, shallowRef, watch } from 'vue'
import { getOrCreateModel, type CodeEditor, type CodeEditorRef } from '../monaco'
import type * as monaco from 'monaco-editor'
import { ModelTracker } from '@/model_tracker'
import { injectMonaco } from '@/context'
import { useEditorLanguage, useEditorValue } from '@/bindings'

const emit = defineEmits<{
  (e: 'update:value', value: string): void
  (e: 'update:language', language: string): void
  (e: 'ready', editor: CodeEditor): void
}>()

const props = withDefaults(defineProps<EditorProps>(), {
  value: '',
  language: 'plaintext',
  options: () => ({}),
  saveViewState: true,
  overrideServices: () => ({})
})

const viewStates = new Map<string | undefined, monaco.editor.ICodeEditorViewState | null>()

const modelTracker = new ModelTracker()

const containerRef = ref<HTMLElement>()

const { monacoRef } = injectMonaco()
const editorRef = useCodeEditor()

const valueRef = useEditorValue(
  monacoRef,
  editorRef,
  () => props.value,
  () => {
    emit('update:value', valueRef.value)
  }
)

const languageRef = useEditorLanguage(
  monacoRef,
  editorRef,
  () => props.language,
  () => {
    emit('update:language', languageRef.value)
  }
)

watch([() => props.path, monacoRef, editorRef], ([path, monaco, editor], [previousPath]) => {
  if (!editor || !monaco || path === previousPath) return
  const model = getOrCreateModel(
    monaco,
    props.defaultValue ?? props.value,
    props.defaultLanguage,
    path
  )

  if (model === editor.getModel()) return
  modelTracker.add(model)

  if (props.saveViewState) viewStates.set(previousPath, editor.saveViewState())
  editor.setModel(model)
  if (props.saveViewState) editor.restoreViewState(viewStates.get(path) ?? null)
})

watch([editorRef, () => props.options], ([editor, options]) => {
  if (!editor) return
  editor.updateOptions(options)
})

watch([monacoRef, editorRef, () => props.language], ([monaco, editor, language]) => {
  if (!editor || !monaco) return
  monaco.editor.setModelLanguage(editor.getModel()!, language)
})

function useCodeEditor() {
  const editorRef: CodeEditorRef = shallowRef()

  watch([monacoRef, containerRef], ([monaco, container], _, onCleanup) => {
    if (!monaco || !container) return

    const defaultModel = getOrCreateModel(
      monaco,
      props.defaultValue ?? props.value,
      props.defaultLanguage,
      props.path
    )

    const editor = monaco.editor.create(
      container,
      {
        model: defaultModel,
        automaticLayout: true,
        ...props.options
      },
      props.overrideServices
    )
    editorRef.value = editor

    if (props.saveViewState) editor.restoreViewState(viewStates.get(props.path) ?? null)

    modelTracker.add(defaultModel)

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
  <slot name="loading" v-if="!editorRef"> Loading... </slot>

  <div ref="containerRef" :class="{ container: true, hidden: !editorRef }" v-bind="$attrs"></div>
</template>

<style scoped>
.container {
  width: var(--monaco-vue-editor-width, 100%);
  height: var(--monaco-vue-editor-height, 100%);
}
.hidden {
  display: none;
}
</style>
