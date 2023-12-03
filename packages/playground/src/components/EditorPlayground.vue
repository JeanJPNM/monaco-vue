<script setup lang="ts">
import { onMounted, ref, shallowRef } from 'vue'
import MonacoEditor, { MonacoDiffEditor, provideMonaco, type MonacoRef } from '@jeanjpnm/monaco-vue'

const monacoRef: MonacoRef = shallowRef()
provideMonaco({ monacoRef })
const text = ref('')
const original = ref('')
const modified = ref('')

const diffMode = ref(false)

const files = ref(['example.ts'])
const currentFile = ref(files.value[0])

const languages = [
  'typescript',
  'javascript',
  'html',
  'css',
  'scss',
  'less',
  'handlebars',
  'json',
  'markdown',
  'python',
  'xml',
  'yaml',
  'plaintext'
]

const currentLanguage = ref('typescript')

onMounted(async () => {
  const monaco = await import('../monaco')
  monacoRef.value = monaco
  monaco.editor.setTheme('vs-dark')
})

function handleFileInput(e: KeyboardEvent) {
  const target = e.target as HTMLInputElement

  if (e.key !== 'Enter') return

  const fileName = target.value.trim()
  if (!fileName) return
  currentFile.value = fileName
  files.value.push(fileName)
  target.value = ''
}
</script>

<template>
  <div class="options">
    <label>
      <input type="checkbox" v-model="diffMode" />
      Diff Editor
    </label>

    <select v-model="currentLanguage">
      <option v-for="language in languages" :key="language" :value="language">
        {{ language }}
      </option>
    </select>

    <select v-model="currentFile">
      <option v-for="file in files" :key="file" :value="file">
        {{ file }}
      </option>
    </select>

    <div>
      <input type="text" @keypress="handleFileInput" placeholder="Enter a file name" />
    </div>
  </div>

  <div class="editor-wrapper">
    <div v-if="diffMode">
      <MonacoDiffEditor
        v-model:original="original"
        v-model:modified="modified"
        v-model:language="currentLanguage"
        :options="{ originalEditable: true }"
      >
      </MonacoDiffEditor>
    </div>
    <div v-else>
      <MonacoEditor v-model:value="text" v-model:language="currentLanguage" :path="currentFile">
      </MonacoEditor>
    </div>
  </div>
</template>

<style>
.editor-wrapper {
  --monaco-vue-editor-height: 500px;
  /* --monaco-vue-editor-width: 50vw; */
  --monaco-vue-diff-editor-height: 500px;
  --monaco-vue-diff-editor-height: 500px;
}
</style>
