<template>
  <div class="map">
    <div ref="mapEl" class="basemap"></div>

    <div v-if="hasFilters" class="filtering-pill" @click="evStore.clearFilters()">
      ● 篩選中：{{ activeFilterLabel }} ✕
    </div>

    <MapSearch @fly-to="handleFlyTo" />
    <MapFilter />
    <EventCard
      :event="selectedEvent"
      :click-pos="clickPos"
      @close="evStore.clearSelection()"
      @action="handleAction"
    />
    <MapLegend />
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { storeToRefs } from 'pinia'
import { setOptions, importLibrary } from '@googlemaps/js-api-loader'
import { useEventsStore } from '../../stores/events'
import MapSearch from './MapSearch.vue'
import MapFilter from './MapFilter.vue'
import EventCard from './EventCard.vue'
import MapLegend from './MapLegend.vue'

const evStore = useEventsStore()
const { filteredEvents, selectedId, selectedEvent, clickPos, hasFilters, activeFilterLabel } = storeToRefs(evStore)

const mapEl = ref(null)
let map = null
const markers = new Map()

const STATUS_COLORS = {
  Unconfirmed: '#E5B84B',
  Verified:    '#3FB77E',
  Cleared:     '#6B7A92',
  Expired:     '#4A5568',
  FalseReport: '#4A5568',
}

const ICON_SHAPES = {
  Checkpoint:   { fn: c => `<path d="M13 1 L25 6 V15 C25 23 19 27 13 29 C7 27 1 23 1 15 V6 Z" fill="${c}" stroke="#0D1117" stroke-width="1.5"/>`, w: 26, h: 30 },
  Accident:     { fn: c => `<path d="M13 1 L25 22 H1 Z" fill="${c}" stroke="#0D1117" stroke-width="1.5"/>`, w: 26, h: 24 },
  Construction: { fn: c => `<rect x="1" y="1" width="20" height="20" rx="3" fill="${c}" stroke="#0D1117" stroke-width="1.5"/>`, w: 22, h: 22 },
  Control:      { fn: c => `<path d="M12 1 L22 7 V17 L12 23 L2 17 V7 Z" fill="${c}" stroke="#0D1117" stroke-width="1.5"/>`, w: 24, h: 24 },
  Flooding:     { fn: c => `<path d="M13 1 C13 1 1 14 1 20 C1 26 6.5 30 13 30 C19.5 30 25 26 25 20 C25 14 13 1 13 1 Z" fill="${c}" stroke="#0D1117" stroke-width="1.5"/>`, w: 26, h: 31 },
}

function makeIcon(type, status, selected = false) {
  const color = STATUS_COLORS[status] ?? '#9AA7BA'
  const s = ICON_SHAPES[type] ?? ICON_SHAPES.Checkpoint
  const scale = selected ? 1.3 : 1
  const w = Math.round(s.w * scale), h = Math.round(s.h * scale)
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${s.w} ${s.h}">${s.fn(color)}</svg>`
  return {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    scaledSize: new google.maps.Size(w, h),
    anchor: new google.maps.Point(w / 2, h / 2),
  }
}

const DARK_STYLE = [
  { elementType: 'geometry', stylers: [{ color: '#1D2533' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#8A9BB5' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#1D2533' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#2C3A52' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#334466' }] },
  { featureType: 'road.arterial', elementType: 'geometry', stylers: [{ color: '#263448' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#101825' }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  { featureType: 'administrative.land_parcel', stylers: [{ visibility: 'off' }] },
  { featureType: 'administrative.neighborhood', stylers: [{ visibility: 'off' }] },
  { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#5A6B80' }] },
]

async function initMap() {
  setOptions({
    key: import.meta.env.VITE_GOOGLE_MAPS_KEY || '',
    version: 'weekly',
  })
  await importLibrary('maps')

  map = new google.maps.Map(mapEl.value, {
    center: { lat: 25.054, lng: 121.531 },
    zoom: 13,
    styles: DARK_STYLE,
    disableDefaultUI: true,
    zoomControl: true,
    zoomControlOptions: { position: google.maps.ControlPosition.RIGHT_BOTTOM },
    gestureHandling: 'greedy',
  })

  map.addListener('click', () => evStore.clearSelection())
  evStore.events.forEach(ev => addMarker(ev))
  syncVisibility()
}

function addMarker(ev) {
  if (ev.lat == null) return
  const m = new google.maps.Marker({
    map,
    position: { lat: ev.lat, lng: ev.lng },
    icon: makeIcon(ev.type, ev.status, ev.id === selectedId.value),
    title: ev.road,
    zIndex: ev.id === selectedId.value ? 10 : 1,
  })
  m.addListener('click', (mapsEvent) => {
    evStore.select(ev.id)
    const rect = mapEl.value.getBoundingClientRect()
    const de = mapsEvent.domEvent
    evStore.setClickPos({
      x: de.clientX - rect.left,
      y: de.clientY - rect.top,
      containerW: rect.width,
      containerH: rect.height,
    })
  })
  markers.set(ev.id, m)
}

function syncVisibility() {
  if (!map) return
  const visible = new Set(filteredEvents.value.map(e => e.id))
  markers.forEach((m, id) => m.setVisible(visible.has(id)))
}

function refreshIcon(id) {
  if (!map) return
  const m = markers.get(id)
  const ev = evStore.events.find(e => e.id === id)
  if (!m || !ev) return
  const sel = id === selectedId.value
  m.setIcon(makeIcon(ev.type, ev.status, sel))
  m.setZIndex(sel ? 10 : 1)
}

watch(filteredEvents, syncVisibility)

watch(selectedId, (next, prev) => {
  if (prev) refreshIcon(prev)
  if (next) refreshIcon(next)
})

watch(evStore.events, () => {
  evStore.events.forEach(ev => {
    const m = markers.get(ev.id)
    if (m) {
      m.setIcon(makeIcon(ev.type, ev.status, ev.id === selectedId.value))
    } else {
      addMarker(ev)
    }
  })
}, { deep: true })

onMounted(async () => {
  await initMap()
  evStore.loadMap()
})
onUnmounted(() => {
  markers.forEach(m => m.setMap(null))
  markers.clear()
})

function handleFlyTo({ lat, lng }) {
  map?.panTo({ lat, lng })
  map?.setZoom(16)
}

async function handleAction({ eventId, action, basis }) {
  try {
    await evStore.applyEventAction(eventId, action, basis)
  } catch (err) {
    console.error('action failed', err)
  }
}
</script>

<style scoped>
.map {
  position: absolute;
  inset: 0;
  background: #0D1117;
  overflow: hidden;
}
.basemap {
  position: absolute;
  inset: 0;
}
.filtering-pill {
  position: absolute;
  left: 50%;
  top: 18px;
  transform: translateX(-50%);
  background: rgba(229, 184, 75, .92);
  color: #1A1405;
  font-size: 13px;
  font-weight: 600;
  border-radius: 999px;
  padding: 6px 16px;
  cursor: pointer;
  z-index: 22;
  white-space: nowrap;
}
</style>
