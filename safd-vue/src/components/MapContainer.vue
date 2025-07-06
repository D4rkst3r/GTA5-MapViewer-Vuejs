<!-- src/components/MapContainer.vue - EINFACHE KORRIGIERTE VERSION -->
<template>
  <div id="map" ref="mapContainer" class="map-container"></div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import maplibregl from 'maplibre-gl'
import MapboxDraw from '@mapbox/mapbox-gl-draw'
import { useMapStore } from '@/stores/map'
import { useHydrantsStore } from '@/stores/hydrants'
import { useUIStore } from '@/stores/ui'
import { usePOIStore } from '@/stores/pois'
import { useMarkersStore } from '@/stores/markers'

// 🎭 Props & Emits
const emit = defineEmits(['map-ready', 'hydrant-selected', 'position-picked'])

// 🏪 Stores
const mapStore = useMapStore()
const hydrantsStore = useHydrantsStore()
const uiStore = useUIStore()
const poiStore = usePOIStore()
const markersStore = useMarkersStore()

// 📍 Refs
const mapContainer = ref(null)
let map = null
let draw = null

// 🎨 Drawing Styles Management
let currentDrawingStyles = {
  strokeColor: '#ff4444',
  fillColor: '#ff4444',
  strokeWidth: 3,
  fillOpacity: 0.3,
}

// 🏭 POI Categories
const poiCategories = {
  gas_station: { name: 'Tankstelle', color: '#ff6b35', icon: '⛽' },
  windmill: { name: 'Windrad', color: '#74c0fc', icon: '💨' },
  power_plant: { name: 'Umspannwerk', color: '#ffd43b', icon: '⚡' },
  oil_pump: { name: 'Ölpumpe', color: '#495057', icon: '🛢️' },
  tanks: { name: 'Tanks', color: '#20c997', icon: '🛢️' },
}

// 📍 Marker Categories
const markerCategories = {
  route: { name: 'Anfahrtsweg', color: '#4287f5', icon: '🚗' },
  assembly: { name: 'Sammelplatz', color: '#ff8800', icon: '👥' },
  warning: { name: 'Warnung', color: '#ff4757', icon: '⚠️' },
  star: { name: 'Markierung', color: '#9d4edd', icon: '⭐' },
  staging: { name: 'Bereitstellungsraum', color: '#2ed573', icon: '🏕️' },
  command: { name: 'Einsatzleitung', color: '#ff6b35', icon: '🎯' },
}

// 🚀 Map Initialization - VEREINFACHT
const initializeMap = () => {
  console.log('🗺️ Initialisiere MapLibre GL...')

  try {
    map = new maplibregl.Map({
      container: mapContainer.value,
      style: {
        version: 8,
        sources: {},
        layers: [],
      },
      center: [0, 0],
      zoom: 2,
    })

    map.on('load', () => {
      console.log('✅ Map geladen')
      setupBaseLayers()
      setupDataLayers()
      setupMapEvents()
      setupDrawingTools()

      mapStore.setMap(map)
      emit('map-ready', map)

      console.log('🎉 MapContainer vollständig initialisiert')
    })

    map.on('error', (e) => {
      console.error('❌ Map Error:', e)
    })
  } catch (error) {
    console.error('❌ Map Initialisierung Fehler:', error)
  }
}

// 🎨 Setup Base Layers
const setupBaseLayers = () => {
  console.log('🎨 Setup Base Layers...')

  map.addLayer({
    id: 'road-layer',
    type: 'background',
    paint: {
      'background-color': '#2a2a2a',
    },
  })

  map.addLayer({
    id: 'satellite-layer',
    type: 'background',
    layout: { visibility: 'none' },
    paint: {
      'background-color': '#1a1a1a',
    },
  })

  map.addLayer({
    id: 'atlas-layer',
    type: 'background',
    layout: { visibility: 'none' },
    paint: {
      'background-color': '#0f1419',
    },
  })

  console.log('✅ Base Layers hinzugefügt')
}

// 📊 Setup Data Layers
const setupDataLayers = () => {
  console.log('📊 Setup Data Layers...')

  addHydrantLayer()
  addPOILayer()
  addMarkersLayer()

  console.log('✅ Alle Data Layers hinzugefügt')
}

// 🚒 Hydrant Layer
const addHydrantLayer = () => {
  console.log('🚒 Füge Hydrant Layer hinzu...')

  try {
    map.addSource('hydrants', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: [],
      },
    })

    map.addLayer({
      id: 'hydrants-layer',
      type: 'circle',
      source: 'hydrants',
      paint: {
        'circle-radius': [
          'case',
          ['==', ['get', 'status'], 'ok'],
          8,
          ['==', ['get', 'status'], 'wartung'],
          10,
          ['==', ['get', 'status'], 'defekt'],
          12,
          8,
        ],
        'circle-color': [
          'case',
          ['==', ['get', 'status'], 'ok'],
          '#2ed573',
          ['==', ['get', 'status'], 'wartung'],
          '#ffa502',
          ['==', ['get', 'status'], 'defekt'],
          '#ff4757',
          '#cccccc',
        ],
        'circle-stroke-width': 3,
        'circle-stroke-color': '#ffffff',
      },
    })

    refreshHydrantLayer()
    console.log('✅ Hydrant Layer hinzugefügt')
  } catch (error) {
    console.error('❌ Hydrant Layer Fehler:', error)
  }
}

const refreshHydrantLayer = () => {
  if (map && map.getSource('hydrants')) {
    const features = hydrantsStore.hydrants.map((hydrant) => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [hydrant.lng, hydrant.lat],
      },
      properties: hydrant,
    }))

    map.getSource('hydrants').setData({
      type: 'FeatureCollection',
      features,
    })
  }
}

// 🏭 POI Layer - KORRIGIERT für graue POIs
const addPOILayer = () => {
  console.log('🏭 Füge POI Layer hinzu...')

  try {
    map.addSource('pois', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: [],
      },
    })

    map.addLayer({
      id: 'pois-layer',
      type: 'circle',
      source: 'pois',
      paint: {
        'circle-radius': 12,
        'circle-color': [
          'case',
          ['==', ['get', 'category'], 'gas_station'],
          '#ff6b35',
          ['==', ['get', 'category'], 'windmill'],
          '#74c0fc',
          ['==', ['get', 'category'], 'power_plant'],
          '#ffd43b',
          ['==', ['get', 'category'], 'oil_pump'],
          '#495057',
          ['==', ['get', 'category'], 'tanks'],
          '#20c997',
          '#ff4444', // KORRIGIERT: Fallback-Farbe für leere Kategorien
        ],
        'circle-stroke-width': 2,
        'circle-stroke-color': '#ffffff',
      },
    })

    refreshPOILayer()
    console.log('✅ POI Layer hinzugefügt')
  } catch (error) {
    console.error('❌ POI Layer Fehler:', error)
  }
}

const refreshPOILayer = () => {
  if (map && map.getSource('pois')) {
    // KORRIGIERT: Filtere POIs basierend auf Kategorie-Sichtbarkeit
    const visiblePOIs = poiStore.pois.filter((poi) => {
      if (!poi.category) {
        console.warn('⚠️ POI ohne Kategorie gefunden:', poi)
        return true // Zeige POIs ohne Kategorie trotzdem an
      }
      return mapStore.layers[poi.category] !== false
    })

    console.log(`🏭 POI Refresh: ${visiblePOIs.length}/${poiStore.pois.length} POIs sichtbar`)

    const features = visiblePOIs.map((poi) => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [poi.lng, poi.lat],
      },
      properties: poi,
    }))

    map.getSource('pois').setData({
      type: 'FeatureCollection',
      features,
    })
  }
}

// 📍 Markers Layer - KORRIGIERT mit Icons
const addMarkersLayer = () => {
  console.log('📍 Füge Markers Layer hinzu...')

  try {
    map.addSource('markers', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: [],
      },
    })

    // Background Circle für bessere Sichtbarkeit
    map.addLayer({
      id: 'markers-background',
      type: 'circle',
      source: 'markers',
      paint: {
        'circle-radius': 14,
        'circle-color': [
          'case',
          ['==', ['get', 'category'], 'route'],
          '#4287f5',
          ['==', ['get', 'category'], 'assembly'],
          '#ff8800',
          ['==', ['get', 'category'], 'warning'],
          '#ff4757',
          ['==', ['get', 'category'], 'star'],
          '#9d4edd',
          ['==', ['get', 'category'], 'staging'],
          '#2ed573',
          ['==', ['get', 'category'], 'command'],
          '#ff6b35',
          '#cccccc',
        ],
        'circle-stroke-width': 2,
        'circle-stroke-color': '#ffffff',
        'circle-opacity': 0.9,
      },
    })

    // Text/Icon Layer darüber
    map.addLayer({
      id: 'markers-layer',
      type: 'symbol',
      source: 'markers',
      layout: {
        'text-field': [
          'case',
          ['==', ['get', 'category'], 'route'],
          '🚗',
          ['==', ['get', 'category'], 'assembly'],
          '👥',
          ['==', ['get', 'category'], 'warning'],
          '⚠️',
          ['==', ['get', 'category'], 'star'],
          '⭐',
          ['==', ['get', 'category'], 'staging'],
          '🏕️',
          ['==', ['get', 'category'], 'command'],
          '🎯',
          '📍',
        ],
        'text-size': 14,
        'text-anchor': 'center',
        'text-allow-overlap': true,
        'text-ignore-placement': true,
      },
      paint: {
        'text-color': '#ffffff',
      },
    })

    refreshMarkersLayer()
    console.log('✅ Markers Layer mit Icons hinzugefügt')
  } catch (error) {
    console.error('❌ Markers Layer Fehler:', error)
  }
}

const refreshMarkersLayer = () => {
  if (map && map.getSource('markers')) {
    const features = markersStore.markers.map((marker) => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [marker.lng, marker.lat],
      },
      properties: marker,
    }))

    map.getSource('markers').setData({
      type: 'FeatureCollection',
      features,
    })
  }
}

// 💬 Popup Functions
const showHydrantPopup = (feature, lngLat) => {
  const props = feature.properties
  const statusColors = {
    ok: '#2ed573',
    wartung: '#ffa502',
    defekt: '#ff4757',
  }

  const popupContent = `
    <div style="color: #ffffff; font-weight: bold; margin-bottom: 8px;">
      🚒 Hydrant #${props.id}
    </div>
    <div style="font-size: 12px; line-height: 1.4;">
      <strong>Gebiet:</strong> ${props.area}<br>
      <strong>Typ:</strong> ${props.type}<br>
      <strong>Status:</strong> <span style="color: ${statusColors[props.status] || '#cccccc'}">${props.status}</span><br>
      <strong>Letzte Wartung:</strong> ${props.lastService || 'Unbekannt'}<br>
      <strong>Nächste Wartung:</strong> ${props.nextService || 'Nicht geplant'}
    </div>
  `

  new maplibregl.Popup().setLngLat(lngLat).setHTML(popupContent).addTo(map)
}

const showPOIPopup = (feature, lngLat) => {
  const props = feature.properties

  const popupContent = `
    <div style="color: #ffffff; font-weight: bold; margin-bottom: 8px;">
      🏭 ${props.name || 'Unbenannter POI'}
    </div>
    <div style="font-size: 12px; line-height: 1.4;">
      <strong>Kategorie:</strong> ${poiCategories[props.category]?.name || props.category || 'Unbekannt'}<br>
      <strong>Beschreibung:</strong> ${props.description || 'Keine Beschreibung'}
    </div>
  `

  new maplibregl.Popup().setLngLat(lngLat).setHTML(popupContent).addTo(map)
}

const showMarkerPopup = (feature, lngLat) => {
  const props = feature.properties

  const popupContent = `
    <div style="color: #ffffff; font-weight: bold; margin-bottom: 8px;">
      📍 ${props.name || 'Unbenannter Marker'}
    </div>
    <div style="font-size: 12px; line-height: 1.4;">
      <strong>Kategorie:</strong> ${markerCategories[props.category]?.name || props.category || 'Unbekannt'}<br>
      <strong>Beschreibung:</strong> ${props.description || 'Keine Beschreibung'}
    </div>
  `

  new maplibregl.Popup().setLngLat(lngLat).setHTML(popupContent).addTo(map)
}

// 🎛️ Layer Toggle Management - KORRIGIERT
const toggleLayer = (layerName, visible) => {
  if (!map) return

  const visibility = visible ? 'visible' : 'none'

  // Multi-Layer für Marker
  if (layerName === 'markers') {
    ;['markers-background', 'markers-layer'].forEach((layer) => {
      if (map.getLayer(layer)) {
        map.setLayoutProperty(layer, 'visibility', visibility)
      }
    })
    console.log(`🔄 Toggle markers (multi): ${visibility}`)
    return
  }

  // Standard Layer
  if (map.getLayer(layerName)) {
    map.setLayoutProperty(layerName, 'visibility', visibility)
    console.log(`🔄 Toggle ${layerName}: ${visibility}`)
  }
}

// 🎯 Map Events Setup
const setupMapEvents = () => {
  console.log('🎯 Setup Map Events...')

  // Main Map Click
  map.on('click', (e) => {
    console.log('🗺️ Map Click:', e.lngLat)

    if (uiStore.isPickingPosition) {
      handlePositionPick(e.lngLat)
      return
    }

    console.log('🗺️ Normal map click')
  })

  // Layer Click Events
  map.on('click', 'hydrants-layer', (e) => {
    const hydrant = e.features[0].properties
    console.log('🚒 Hydrant geklickt:', hydrant)
    showHydrantPopup(e.features[0], e.lngLat)
    hydrantsStore.selectHydrant(hydrant.id)
    e.stopPropagation()
  })

  map.on('click', 'pois-layer', (e) => {
    const poi = e.features[0].properties
    console.log('🏭 POI geklickt:', poi)
    showPOIPopup(e.features[0], e.lngLat)
    poiStore.selectPOI(poi.id)
    e.stopPropagation()
  })

  // Marker Click Events für beide Layer
  ;['markers-layer', 'markers-background'].forEach((layerName) => {
    map.on('click', layerName, (e) => {
      const marker = e.features[0].properties
      console.log('📍 Marker geklickt:', marker)
      showMarkerPopup(e.features[0], e.lngLat)
      markersStore.selectMarker(marker.id)
      e.stopPropagation()
    })
  })

  // Hover Effects
  ;['hydrants-layer', 'pois-layer', 'markers-layer', 'markers-background'].forEach((layerName) => {
    map.on('mouseenter', layerName, () => {
      map.getCanvas().style.cursor = 'pointer'
    })

    map.on('mouseleave', layerName, () => {
      map.getCanvas().style.cursor = ''
    })
  })

  console.log('✅ Map Events eingerichtet')
}

// 🎯 Handle Position Picking - KORRIGIERT
const handlePositionPick = (lngLat) => {
  console.log('🎯 Position gepickt:', lngLat)

  try {
    if (uiStore.isAddingHydrant && uiStore.pendingHydrantData) {
      const newHydrant = hydrantsStore.addHydrant({
        ...uiStore.pendingHydrantData,
        lng: lngLat.lng,
        lat: lngLat.lat,
      })
      console.log('✅ Hydrant hinzugefügt:', newHydrant)

      if (window.showToast) {
        window.showToast(`Hydrant #${newHydrant.id} hinzugefügt`, 'success')
      }

      uiStore.resetPositionPicking()
      emit('position-picked', { type: 'hydrant', data: newHydrant })
    }

    if (uiStore.isAddingPOI && uiStore.pendingPOIData) {
      console.log('🏭 POI Daten beim Position Picking:', uiStore.pendingPOIData)

      // KORRIGIERT: Prüfe dass POI-Daten vollständig sind
      if (!uiStore.pendingPOIData.name || !uiStore.pendingPOIData.category) {
        console.error('❌ POI Daten unvollständig:', uiStore.pendingPOIData)
        if (window.showToast) {
          window.showToast('POI Daten sind unvollständig', 'error')
        }
        uiStore.resetPositionPicking()
        return
      }

      const newPOI = poiStore.addPOI({
        ...uiStore.pendingPOIData,
        lng: lngLat.lng,
        lat: lngLat.lat,
      })
      console.log('✅ POI hinzugefügt:', newPOI)

      if (window.showToast) {
        window.showToast(`POI "${newPOI.name}" hinzugefügt`, 'success')
      }

      uiStore.resetPositionPicking()
      emit('position-picked', { type: 'poi', data: newPOI })
    }

    if (uiStore.isAddingMarker && uiStore.pendingMarkerData) {
      const newMarker = markersStore.addMarker({
        ...uiStore.pendingMarkerData,
        lng: lngLat.lng,
        lat: lngLat.lat,
      })
      console.log('✅ Marker hinzugefügt:', newMarker)

      if (window.showToast) {
        window.showToast(`Marker "${newMarker.name}" hinzugefügt`, 'success')
      }

      uiStore.resetPositionPicking()
      emit('position-picked', { type: 'marker', data: newMarker })
    }

    map.getCanvas().style.cursor = ''
  } catch (error) {
    console.error('❌ Fehler beim Position Picking:', error)
    uiStore.resetPositionPicking()

    if (window.showToast) {
      window.showToast('Fehler beim Platzieren des Objekts', 'error')
    }
  }
}

// 🎨 Drawing Tools Setup
const setupDrawingTools = () => {
  console.log('🎨 Setup Drawing Tools...')

  try {
    draw = new MapboxDraw({
      displayControlsDefault: false,
      controls: {},
      styles: [
        {
          id: 'gl-draw-polygon-fill',
          type: 'fill',
          filter: ['all', ['==', '$type', 'Polygon']],
          paint: {
            'fill-color': currentDrawingStyles.fillColor,
            'fill-opacity': currentDrawingStyles.fillOpacity,
          },
        },
        {
          id: 'gl-draw-polygon-stroke',
          type: 'line',
          filter: ['all', ['==', '$type', 'Polygon']],
          paint: {
            'line-color': currentDrawingStyles.strokeColor,
            'line-width': currentDrawingStyles.strokeWidth,
          },
        },
        {
          id: 'gl-draw-line',
          type: 'line',
          filter: ['all', ['==', '$type', 'LineString']],
          paint: {
            'line-color': currentDrawingStyles.strokeColor,
            'line-width': currentDrawingStyles.strokeWidth,
          },
        },
        {
          id: 'gl-draw-point',
          type: 'circle',
          filter: ['all', ['==', '$type', 'Point']],
          paint: {
            'circle-radius': 6,
            'circle-color': currentDrawingStyles.strokeColor,
            'circle-stroke-width': 2,
            'circle-stroke-color': '#ffffff',
          },
        },
      ],
    })

    map.addControl(draw, 'top-left')
    setupDrawingEvents()
    loadDrawingsFromStore()

    console.log('✅ Drawing Tools eingerichtet')
  } catch (error) {
    console.error('❌ Drawing Tools Fehler:', error)
  }
}

const setupDrawingEvents = () => {
  if (!draw) return

  map.on('draw.create', updateDrawingsInStore)
  map.on('draw.update', updateDrawingsInStore)
  map.on('draw.delete', updateDrawingsInStore)

  window.addEventListener('changeDrawingMode', (event) => {
    const { mode } = event.detail
    changeDrawingMode(mode)
  })

  window.addEventListener('updateDrawingStyles', (event) => {
    const { styles } = event.detail
    updateDrawingStyles(styles)
  })

  window.addEventListener('clearAllDrawings', () => {
    clearAllDrawings()
  })

  window.addEventListener('importDrawings', (event) => {
    const { drawings } = event.detail
    importDrawings(drawings)
  })
}

const updateDrawingsInStore = () => {
  if (draw) {
    const drawings = draw.getAll()
    mapStore.drawings = drawings
    mapStore.saveDrawings()
  }
}

const loadDrawingsFromStore = () => {
  console.log('📊 Lade Drawings aus Store...')

  if (draw && mapStore.drawings?.features?.length > 0) {
    draw.deleteAll()

    mapStore.drawings.features.forEach((feature) => {
      draw.add(feature)
    })

    console.log(`✅ ${mapStore.drawings.features.length} Drawings geladen`)
  }
}

const changeDrawingMode = (mode) => {
  if (draw) {
    draw.changeMode(mode)
    console.log(`🎨 Drawing Mode: ${mode}`)
  }
}

const updateDrawingStyles = (styles) => {
  currentDrawingStyles = { ...currentDrawingStyles, ...styles }
  console.log('🎨 Drawing Styles aktualisiert:', currentDrawingStyles)
}

const clearAllDrawings = () => {
  if (draw) {
    draw.deleteAll()
    updateDrawingsInStore()
    console.log('🗑️ Alle Drawings gelöscht')
  }
}

const importDrawings = (drawings) => {
  if (draw && drawings?.features) {
    draw.deleteAll()
    drawings.features.forEach((feature) => {
      draw.add(feature)
    })
    updateDrawingsInStore()
    console.log(`📥 ${drawings.features.length} Drawings importiert`)
  }
}

// 👀 Watchers - KORRIGIERT
watch(
  () => hydrantsStore.hydrants,
  () => {
    refreshHydrantLayer()
  },
  { deep: true },
)

watch(
  () => poiStore.pois,
  () => {
    refreshPOILayer()
  },
  { deep: true },
)

watch(
  () => markersStore.markers,
  () => {
    refreshMarkersLayer()
  },
  { deep: true },
)

// KORRIGIERT: Layer Visibility Watch
watch(
  () => mapStore.layers,
  (newLayers) => {
    console.log('🎛️ Layer Toggle erkannt:', newLayers)

    Object.keys(newLayers).forEach((layerName) => {
      if (layerName === 'hydrants') {
        toggleLayer('hydrants-layer', newLayers[layerName])
      } else if (layerName === 'drawings') {
        // Drawing Layer Visibility
        if (draw) {
          const visibility = newLayers[layerName] ? 'visible' : 'none'
          const drawLayers = [
            'gl-draw-polygon-fill',
            'gl-draw-polygon-stroke',
            'gl-draw-line',
            'gl-draw-point',
          ]
          drawLayers.forEach((drawLayer) => {
            if (map.getLayer(drawLayer)) {
              map.setLayoutProperty(drawLayer, 'visibility', visibility)
            }
          })
        }
      } else if (
        ['gas_station', 'windmill', 'power_plant', 'oil_pump', 'tanks'].includes(layerName)
      ) {
        // POI Kategorie Toggle - refresh POI Layer
        refreshPOILayer()
      } else if (layerName === 'routes' || layerName === 'exclusions') {
        // Marker Layer
        toggleLayer('markers', newLayers[layerName])
      } else {
        // Standard Layer
        toggleLayer(layerName, newLayers[layerName])
      }
    })
  },
  { deep: true },
)

// Map Style Watch
watch(
  () => mapStore.mapStyle,
  (newStyle) => {
    if (map && newStyle) {
      const layers = ['road-layer', 'satellite-layer', 'atlas-layer']
      layers.forEach((layer) => {
        if (map.getLayer(layer)) {
          map.setLayoutProperty(layer, 'visibility', 'none')
        }
      })

      const targetLayer = `${newStyle}-layer`
      if (map.getLayer(targetLayer)) {
        map.setLayoutProperty(targetLayer, 'visibility', 'visible')
      }

      console.log(`🎨 Map Style gewechselt zu: ${newStyle}`)
    }
  },
)

// 🎬 Lifecycle - VEREINFACHT
onMounted(() => {
  // Kleine Verzögerung für sicheres DOM-Rendering
  setTimeout(() => {
    initializeMap()
  }, 50)
})

onUnmounted(() => {
  if (map) {
    map.remove()
  }
})

// 📤 Expose Methods
defineExpose({
  map: () => map,
  draw: () => draw,
  centerOnLosSantos: () => {
    if (map) {
      map.flyTo({ center: [0, 0], zoom: 2, duration: 2000 })
    }
  },
  showAllHydrants: () => {
    if (map && hydrantsStore.hydrants.length > 0) {
      const bounds = new maplibregl.LngLatBounds()
      hydrantsStore.hydrants.forEach((hydrant) => {
        bounds.extend([hydrant.lng, hydrant.lat])
      })
      map.fitBounds(bounds, { padding: 50, duration: 2000 })
    }
  },
  setDrawingMode: changeDrawingMode,
  clearAllDrawings,
  exportDrawings: () => {
    if (draw) {
      return draw.getAll()
    }
    return { type: 'FeatureCollection', features: [] }
  },
  importDrawings,
  updateDrawingStyles,
})

// 🔧 Debug für Entwicklung
if (import.meta.env.DEV) {
  window.debugMap = {
    getMap: () => map,
    getDraw: () => draw,
    getLayers: () => map?.getStyle().layers.map((l) => l.id),
    getSources: () => Object.keys(map?.getStyle().sources || {}),
    getStores: () => ({ mapStore, hydrantsStore, poiStore, markersStore, uiStore }),
    testPOI: () => {
      const testData = { name: 'Test POI', category: 'gas_station', description: 'Test' }
      uiStore.startPOIPicking(testData)
      console.log('🧪 Test POI Picking gestartet')
    },
  }
}
</script>

<style scoped>
.map-container {
  width: 100vw;
  height: 100vh;
}

/* MapLibre Custom Styles */
:deep(.maplibregl-ctrl-group) {
  background: var(--surface) !important;
  border: 1px solid var(--border-color) !important;
  border-radius: 12px !important;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3) !important;
  backdrop-filter: blur(20px) !important;
}

:deep(.maplibregl-ctrl button) {
  background: transparent !important;
  border: none !important;
  color: var(--text-primary) !important;
  font-size: 18px !important;
  padding: 8px !important;
}

:deep(.maplibregl-ctrl button:hover) {
  background: var(--hover-bg) !important;
}

:deep(.maplibregl-popup-content) {
  background: var(--surface) !important;
  color: var(--text-primary) !important;
  border: 1px solid var(--border-color) !important;
  border-radius: 12px !important;
  backdrop-filter: blur(20px) !important;
}

:deep(.maplibregl-popup-close-button) {
  color: var(--text-primary) !important;
  font-size: 18px !important;
}
</style>
