import type * as monaco from 'monaco-editor'
import { watch, type Ref, ref, watchEffect, shallowRef } from 'vue'
import type { CodeEditorRef, MonacoRef } from '.'
import { setEditorValue } from './monaco'

export function useEditorValue(
  monacoRef: MonacoRef,
  editorRef: CodeEditorRef,
  valueGetter: () => string,
  onChangeEvent: (event: monaco.editor.IModelContentChangedEvent) => void
) {
  const valueRef = ref<string>('')

  watch(editorRef, (editor, _, onCleanup) => {
    if (!editor) return

    const modelContentSubscription = editor.onDidChangeModelContent((event) => {
      const text = editor.getValue()

      if (text === valueRef.value) return
      valueRef.value = text
      onChangeEvent(event)
    })

    onCleanup(() => modelContentSubscription.dispose())
  })

  watch([monacoRef, editorRef, valueGetter], ([monaco, editor, value]) => {
    // only update the text after the editor has been created
    if (!monaco || !editor) return

    if (value === valueRef.value) return
    valueRef.value = value

    setEditorValue(monaco, editor, value)
  })

  return valueRef
}

export function useEditorLanguage(
  monacoRef: MonacoRef,
  editorRef: CodeEditorRef,
  languageGetter: () => string,
  onChangeEvent: (
    language: string,
    event: monaco.editor.IModelLanguageChangedEvent | monaco.editor.IModelChangedEvent
  ) => void
) {
  const languageRef = ref(languageGetter())

  watch([monacoRef, editorRef, languageGetter], ([monaco, editor, language]) => {
    languageRef.value = language

    if (!monaco || !editor) return
    monaco.editor.setModelLanguage(editor.getModel()!, language)
  })

  watch([monacoRef, editorRef], ([monaco, editor], _, onCleanup) => {
    if (!monaco || !editor) return

    const modelChangedSub = editor.onDidChangeModel((e) => {
      const model = editor.getModel()
      if (!model) return

      languageRef.value = model.getLanguageId()
      onChangeEvent(languageRef.value, e)
    })
    const languageChangedSub = editor.onDidChangeModelLanguage((e) => {
      languageRef.value = e.newLanguage
      onChangeEvent(languageRef.value, e)
    })

    onCleanup(() => {
      languageChangedSub.dispose()
      modelChangedSub.dispose()
    })
  })

  return languageRef
}

export function useMonacoTheme(monacoRef: MonacoRef, themeRef: Ref<string>) {
  watchEffect(() => {
    const monaco = monacoRef.value
    if (!monaco) return
    monaco.editor.setTheme(themeRef.value)
  })
}

export function useEditorMarkers(monacoRef: MonacoRef, editorRef: CodeEditorRef) {
  const markersRef = shallowRef<monaco.editor.IMarker[]>([])

  watchEffect((onCleanup) => {
    const monaco = monacoRef.value
    const editor = editorRef.value
    if (!monaco || !editor) return

    const markerSubscription = monaco.editor.onDidChangeMarkers((uris) => {
      const editorUri = editor.getModel()?.uri

      if (!editorUri) return
      const hasMarkerChanges = uris.some((uri) => uri.path === editorUri.path)

      if (!hasMarkerChanges) return

      markersRef.value = monaco.editor.getModelMarkers({ resource: editorUri })
    })

    onCleanup(() => markerSubscription.dispose())
  })
  return markersRef
}
