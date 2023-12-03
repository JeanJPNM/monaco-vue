import MonacoEditor from './components/MonacoEditor.vue'
import MonacoDiffEditor from './components/MonacoDiffEditor.vue'

export { MonacoDiffEditor }
export default MonacoEditor

export { useMonacoTheme, useEditorMarkers } from './bindings'
export type { CodeEditorRef, DiffEditorRef, Monaco, MonacoRef } from './monaco'
export { provideMonaco, injectMonaco } from './context'
