<script setup>
import {onMounted, ref} from 'vue';
import mermaid from 'mermaid';
const props = defineProps({encoded: {type: String, required: true}});
const target = ref(null);
onMounted(async () => {
  mermaid.initialize({startOnLoad: false, securityLevel: 'strict', theme: 'neutral'});
  const bytes = Uint8Array.from(atob(props.encoded), (char) => char.charCodeAt(0));
  const code = new TextDecoder().decode(bytes);
  const id = `mermaid-${Math.random().toString(36).slice(2)}`;
  const {svg} = await mermaid.render(id, code);
  target.value.innerHTML = svg;
});
</script>
<template><div class="mermaid-wrap"><div ref="target" aria-label="Mermaid diagram"></div></div></template>
