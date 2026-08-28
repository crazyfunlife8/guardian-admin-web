<template>
  <div class="search" ref="containerRef">
    <span class="icon">🔍</span>
    <input
      ref="inputRef"
      v-model="query"
      placeholder="路名／路口定位（例：環河南路二段 市民高架）"
      @input="onInput"
      @keydown.escape="clear"
      @keydown.enter.prevent="selectActive"
      @keydown.down.prevent="moveSel(1)"
      @keydown.up.prevent="moveSel(-1)"
    />
    <span v-if="loading" class="hint">…</span>
    <kbd v-else class="hint">/</kbd>
    <ul v-if="suggestions.length" class="dropdown">
      <li
        v-for="(s, i) in suggestions"
        :key="s.place_id ?? i"
        :class="{ active: i === selIdx }"
        @mousedown.prevent="choose(s)"
        @mouseover="selIdx = i"
      >
        <span class="main">{{ s.structured_formatting?.main_text ?? s.description }}</span>
        <span v-if="s.structured_formatting?.secondary_text" class="sub">
          {{ s.structured_formatting.secondary_text }}
        </span>
      </li>
    </ul>
  </div>
</template>

<script setup>
import { ref, onUnmounted } from 'vue'
import { importLibrary } from '@googlemaps/js-api-loader'

const emit = defineEmits(['fly-to'])

const query        = ref('')
const suggestions  = ref([])
const loading      = ref(false)
const selIdx       = ref(-1)
const containerRef = ref(null)
const inputRef     = ref(null)

let autocompleteService = null
let geocoder = null
let debounceTimer = null

async function ensureServices() {
  if (autocompleteService) return
  await importLibrary('places')
  autocompleteService = new google.maps.places.AutocompleteService()
  geocoder = new google.maps.Geocoder()
}

async function onInput() {
  selIdx.value = -1
  clearTimeout(debounceTimer)
  if (!query.value.trim()) { suggestions.value = []; return }
  debounceTimer = setTimeout(async () => {
    loading.value = true
    try {
      await ensureServices()
      const { predictions, status } = await new Promise(resolve =>
        autocompleteService.getPlacePredictions(
          { input: query.value, componentRestrictions: { country: 'tw' }, language: 'zh-TW' },
          (p, s) => resolve({ predictions: p ?? [], status: s })
        )
      )
      suggestions.value = status === google.maps.places.PlacesServiceStatus.OK ? predictions : []
    } catch (e) {
      console.error('autocomplete error', e)
      suggestions.value = []
    } finally {
      loading.value = false
    }
  }, 300)
}

async function choose(prediction) {
  if (!prediction?.place_id) return
  loading.value = true
  try {
    const { results } = await new Promise(resolve =>
      geocoder.geocode({ placeId: prediction.place_id }, (r, s) => resolve({ results: r ?? [], status: s }))
    )
    if (results[0]?.geometry?.location) {
      const loc = results[0].geometry.location
      emit('fly-to', { lat: loc.lat(), lng: loc.lng() })
    }
    query.value = prediction.description
    suggestions.value = []
    selIdx.value = -1
  } catch (e) {
    console.error('geocode error', e)
  } finally {
    loading.value = false
  }
}

function selectActive() {
  const idx = selIdx.value >= 0 ? selIdx.value : 0
  if (suggestions.value[idx]) choose(suggestions.value[idx])
}

function moveSel(dir) {
  const max = suggestions.value.length - 1
  selIdx.value = Math.max(0, Math.min(max, selIdx.value + dir))
}

function clear() {
  query.value = ''
  suggestions.value = []
  selIdx.value = -1
}

function onKeySlash(e) {
  if (e.key === '/' && document.activeElement !== inputRef.value) {
    e.preventDefault()
    inputRef.value?.focus()
  }
}
function onDocClick(e) {
  if (containerRef.value && !containerRef.value.contains(e.target)) {
    suggestions.value = []
  }
}
document.addEventListener('keydown', onKeySlash)
document.addEventListener('mousedown', onDocClick)
onUnmounted(() => {
  document.removeEventListener('keydown', onKeySlash)
  document.removeEventListener('mousedown', onDocClick)
  clearTimeout(debounceTimer)
})
</script>

<style scoped>
.search {
  position: absolute;
  left: calc(16px + var(--todo-w, 280px) + 12px);
  top: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(21, 28, 38, .92);
  border: 1px solid var(--line);
  border-radius: 10px;
  padding: 9px 14px;
  width: 340px;
  backdrop-filter: blur(6px);
  z-index: 21;
}
.icon { flex: none; }
input {
  flex: 1;
  background: none;
  border: none;
  outline: none;
  color: var(--text-primary);
  font-size: 15px;
  font-family: var(--sans);
  min-width: 0;
}
input::placeholder { color: var(--text-secondary); }
.hint {
  font-family: var(--mono);
  font-size: 11px;
  color: var(--text-secondary);
  border: 1px solid var(--line);
  border-radius: 4px;
  padding: 1px 6px;
  flex: none;
}
.dropdown {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  right: 0;
  background: rgba(21, 28, 38, .98);
  border: 1px solid var(--line);
  border-radius: 10px;
  list-style: none;
  margin: 0;
  padding: 4px 0;
  z-index: 30;
  overflow: hidden;
  box-shadow: 0 8px 24px rgba(0,0,0,.5);
}
.dropdown li {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 10px 14px;
  cursor: pointer;
  border-bottom: 1px solid rgba(255,255,255,.04);
}
.dropdown li:last-child { border-bottom: none; }
.dropdown li.active { background: rgba(255,255,255,.07); }
.main { font-size: 14px; color: var(--text-primary); }
.sub  { font-size: 11px; color: var(--text-secondary); }
</style>
