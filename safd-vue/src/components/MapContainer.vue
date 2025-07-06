<!-- src/components/MapContainer.vue - VOLLSTÄNDIGE VERSION MIT ICONS -->
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

// 🗺️ Map Configuration
const tileSize = 256
const maxZoom = 5
const geoBounds = [-180, -85, 180, 85]

// 🎨 Drawing Styles Management
let currentDrawingStyles = {
  strokeColor: '#ff4444',
  fillColor: '#ff4444',
  strokeWidth: 3,
  fillOpacity: 0.3,
}

// 🏭 POI Categories für Category Layer
const poiCategories = {
  gas_station: { name: 'Tankstelle', color: '#ff6b35', icon: '⛽' },
  windmill: { name: 'Windrad', color: '#74c0fc', icon: '💨' },
  power_plant: { name: 'Umspannwerk', color: '#ffd43b', icon: '⚡' },
  oil_pump: { name: 'Ölpumpe', color: '#495057', icon: '🛢️' },
  tanks: { name: 'Tanks', color: '#20c997', icon: '🛢️' },
}

// 📍 Marker Categories
const markerCategories = {
  route: { name: 'Anfahrtsweg', color: '#4287f5', icon: 'fas fa-route' },
  assembly: { name: 'Sammelplatz', color: '#ff8800', icon: 'fas fa-users' },
  warning: { name: 'Warnung', color: '#ff4757', icon: 'fas fa-exclamation-triangle' },
  star: { name: 'Markierung', color: '#9d4edd', icon: 'fas fa-star' },
  staging: { name: 'Bereitstellung', color: '#2ed573', icon: 'fas fa-truck' },
  command: { name: 'Führungsstelle', color: '#ff6b35', icon: 'fas fa-flag' },
}

// 🎨 Map Style Configuration
const createMapStyle = () => ({
  version: 8,
  glyphs: 'https://api.maptiler.com/fonts/{fontstack}/{range}.pbf?key=ZyK9nG5JZdEGz82ucoJf',
  sources: {
    'gta5-road': {
      type: 'raster',
      tiles: ['tiles/road/{z}/{x}/{y}.png'],
      tileSize: tileSize,
      bounds: geoBounds,
      maxzoom: maxZoom,
      minzoom: 0,
    },
    'gta5-satellite': {
      type: 'raster',
      tiles: ['tiles/satellite/{z}/{x}/{y}.png'],
      tileSize: tileSize,
      bounds: geoBounds,
      maxzoom: maxZoom,
      minzoom: 0,
    },
    'gta5-atlas': {
      type: 'raster',
      tiles: ['tiles/atlas/{z}/{x}/{y}.png'],
      tileSize: tileSize,
      bounds: geoBounds,
      maxzoom: maxZoom,
      minzoom: 0,
    },
  },
  layers: [
    {
      id: 'road-layer',
      type: 'raster',
      source: 'gta5-road',
      paint: { 'raster-opacity': 1 },
    },
    {
      id: 'satellite-layer',
      type: 'raster',
      source: 'gta5-satellite',
      layout: { visibility: 'none' },
      paint: { 'raster-opacity': 1 },
    },
    {
      id: 'atlas-layer',
      type: 'raster',
      source: 'gta5-atlas',
      layout: { visibility: 'none' },
      paint: { 'raster-opacity': 1 },
    },
  ],
})

// 🎨 Enhanced MapboxDraw Styles mit Dynamic Colors
const getDrawStyles = () => {
  return [
    // Polygon Fill (inactive)
    {
      id: 'gl-draw-polygon-fill-inactive',
      type: 'fill',
      filter: [
        'all',
        ['==', 'active', 'false'],
        ['==', '$type', 'Polygon'],
        ['!=', 'mode', 'static'],
      ],
      paint: {
        'fill-color': currentDrawingStyles.fillColor,
        'fill-outline-color': currentDrawingStyles.strokeColor,
        'fill-opacity': currentDrawingStyles.fillOpacity,
      },
    },
    // Polygon Fill (active)
    {
      id: 'gl-draw-polygon-fill-active',
      type: 'fill',
      filter: ['all', ['==', 'active', 'true'], ['==', '$type', 'Polygon']],
      paint: {
        'fill-color': currentDrawingStyles.fillColor,
        'fill-outline-color': currentDrawingStyles.strokeColor,
        'fill-opacity': currentDrawingStyles.fillOpacity * 0.8,
      },
    },
    // Polygon Stroke (inactive)
    {
      id: 'gl-draw-polygon-stroke-inactive',
      type: 'line',
      filter: [
        'all',
        ['==', 'active', 'false'],
        ['==', '$type', 'Polygon'],
        ['!=', 'mode', 'static'],
      ],
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: {
        'line-color': currentDrawingStyles.strokeColor,
        'line-width': currentDrawingStyles.strokeWidth,
      },
    },
    // Polygon Stroke (active)
    {
      id: 'gl-draw-polygon-stroke-active',
      type: 'line',
      filter: ['all', ['==', 'active', 'true'], ['==', '$type', 'Polygon']],
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: {
        'line-color': currentDrawingStyles.strokeColor,
        'line-width': currentDrawingStyles.strokeWidth + 1,
      },
    },
    // LineString (inactive)
    {
      id: 'gl-draw-line-inactive',
      type: 'line',
      filter: [
        'all',
        ['==', 'active', 'false'],
        ['==', '$type', 'LineString'],
        ['!=', 'mode', 'static'],
      ],
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: {
        'line-color': currentDrawingStyles.strokeColor,
        'line-width': currentDrawingStyles.strokeWidth,
      },
    },
    // LineString (active)
    {
      id: 'gl-draw-line-active',
      type: 'line',
      filter: ['all', ['==', 'active', 'true'], ['==', '$type', 'LineString']],
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: {
        'line-color': currentDrawingStyles.strokeColor,
        'line-width': currentDrawingStyles.strokeWidth + 2,
      },
    },
    // Points (inactive)
    {
      id: 'gl-draw-point-inactive',
      type: 'circle',
      filter: [
        'all',
        ['==', 'active', 'false'],
        ['==', '$type', 'Point'],
        ['!=', 'mode', 'static'],
      ],
      paint: {
        'circle-radius': currentDrawingStyles.strokeWidth * 2 + 4,
        'circle-color': currentDrawingStyles.fillColor,
        'circle-stroke-width': currentDrawingStyles.strokeWidth,
        'circle-stroke-color': currentDrawingStyles.strokeColor,
      },
    },
    // Points (active)
    {
      id: 'gl-draw-point-active',
      type: 'circle',
      filter: ['all', ['==', 'active', 'true'], ['==', '$type', 'Point']],
      paint: {
        'circle-radius': currentDrawingStyles.strokeWidth * 2 + 6,
        'circle-color': currentDrawingStyles.fillColor,
        'circle-stroke-width': currentDrawingStyles.strokeWidth + 1,
        'circle-stroke-color': currentDrawingStyles.strokeColor,
      },
    },
    // Vertex points
    {
      id: 'gl-draw-polygon-and-line-vertex-inactive',
      type: 'circle',
      filter: ['all', ['==', 'meta', 'vertex'], ['==', '$type', 'Point']],
      paint: {
        'circle-radius': 5,
        'circle-color': '#ffffff',
        'circle-stroke-width': 2,
        'circle-stroke-color': currentDrawingStyles.strokeColor,
      },
    },
  ]
}

// 🔧 Map Initialization
const initializeMap = () => {
  console.log('🗺️ Initialisiere Karte...')

  try {
    map = new maplibregl.Map({
      container: mapContainer.value,
      style: createMapStyle(),
      center: [0, 0],
      zoom: 2,
      minZoom: 0,
      maxZoom: maxZoom,
      renderWorldCopies: false,
      attributionControl: false,
    })

    // 🎬 Map Events
    map.on('load', () => {
      console.log('✅ Karte geladen!')

      // Drawing System initialisieren
      initializeDrawing()

      // Enhanced Drawing Events
      setupEnhancedDrawingEvents()

      // Drawing Event Listeners für Sidebar
      setupDrawingEventListeners()

      // Map Events für Position Picking setup
      setupMapEvents()

      // ✅ ALLE Layer hinzufügen
      addHydrantLayer()
      addPOILayer()
      addMarkersLayer()

      // Drawings aus Store laden
      loadDrawingsFromStore()

      // Map Store aktualisieren
      mapStore.setMap(map)

      // Parent Component benachrichtigen
      emit('map-ready', map)

      // Debug Functions exposed
      exposeDrawingFunctions()
    })

    // Standard Map Events
    map.on('zoom', () => {
      mapStore.updateZoom(map.getZoom())
    })

    map.on('move', () => {
      mapStore.updateCenter(map.getCenter())
    })

    map.on('error', (e) => {
      console.error('❌ Map error:', e)
    })
  } catch (error) {
    console.error('❌ Map Initialisierung fehlgeschlagen:', error)
  }
}

// ✏️ Drawing System
const initializeDrawing = () => {
  try {
    draw = new MapboxDraw({
      displayControlsDefault: false,
      controls: {
        polygon: false,
        line_string: false,
        point: false,
        trash: false,
      },
      defaultMode: 'simple_select',
      styles: getDrawStyles(),
    })

    map.addControl(draw, 'top-left')

    console.log('✅ Drawing System initialisiert')
  } catch (error) {
    console.error('❌ Drawing System Fehler:', error)
  }
}

// 🎨 Enhanced Drawing Events
const setupEnhancedDrawingEvents = () => {
  if (!map || !draw) return

  // Drawing Created
  map.on('draw.create', (e) => {
    console.log('🎨 Zeichnung erstellt:', e.features[0].geometry.type)
    updateDrawingsInStore()

    // Show success feedback
    const feature = e.features[0]
    const type = feature.geometry.type
    const typeNames = {
      Point: 'Punkt',
      LineString: 'Linie',
      Polygon: 'Polygon',
    }

    if (window.showToast) {
      window.showToast(`${typeNames[type] || 'Zeichnung'} erstellt`, 'success')
    }

    // Auto-switch back to select mode after drawing
    setTimeout(() => {
      changeDrawingMode('simple_select')
    }, 500)
  })

  // Drawing Updated
  map.on('draw.update', (e) => {
    console.log('🎨 Zeichnung aktualisiert')
    updateDrawingsInStore()

    if (window.showToast) {
      window.showToast('Zeichnung aktualisiert', 'info')
    }
  })

  // Drawing Deleted
  map.on('draw.delete', (e) => {
    console.log('🎨 Zeichnung gelöscht')
    updateDrawingsInStore()

    if (window.showToast) {
      window.showToast(`${e.features.length} Zeichnung(en) gelöscht`, 'warning')
    }
  })

  // Drawing Mode Changed
  map.on('draw.modechange', (e) => {
    console.log('🎨 Draw Mode Changed:', e.mode)
    updateMapCursor(e.mode)
  })

  // Selection Changed
  map.on('draw.selectionchange', (e) => {
    const selectedCount = e.features.length
    console.log(`🎯 ${selectedCount} Zeichnung(en) ausgewählt`)
  })
}

// 🎨 Drawing Mode Management
const changeDrawingMode = (mode) => {
  if (!draw) {
    console.warn('❌ Draw system not initialized')
    return
  }

  try {
    console.log(`🎨 Ändere Zeichenmodus zu: ${mode}`)

    // Set the drawing mode
    draw.changeMode(mode)

    // Update cursor based on mode
    updateMapCursor(mode)

    // Show mode feedback
    showDrawingModeToast(mode)
  } catch (error) {
    console.error('❌ Fehler beim Zeichenmodus-Wechsel:', error)
  }
}

// 🎨 Update Map Cursor
const updateMapCursor = (mode) => {
  const canvas = map.getCanvas()

  switch (mode) {
    case 'draw_point':
      canvas.style.cursor = 'crosshair'
      break
    case 'draw_line_string':
      canvas.style.cursor = 'copy'
      break
    case 'draw_polygon':
      canvas.style.cursor = 'crosshair'
      break
    case 'simple_select':
    default:
      canvas.style.cursor = ''
      break
  }
}

// 🎨 Show Drawing Mode Toast
const showDrawingModeToast = (mode) => {
  const messages = {
    simple_select: 'Auswahlmodus aktiviert',
    draw_point: 'Punkt-Zeichenmodus aktiviert - Klicken Sie auf die Karte',
    draw_line_string:
      'Linien-Zeichenmodus aktiviert - Klicken Sie um Punkte zu setzen, Doppelklick zum Beenden',
    draw_polygon:
      'Polygon-Zeichenmodus aktiviert - Klicken Sie um Ecken zu setzen, Doppelklick zum Beenden',
  }

  const message = messages[mode] || 'Zeichenmodus geändert'

  if (window.showToast) {
    window.showToast(message, 'info', 3000)
  }
}

// 🎨 Update Drawing Styles
const updateDrawingStyles = (styles) => {
  currentDrawingStyles = { ...currentDrawingStyles, ...styles }

  if (draw && map.getStyle()) {
    try {
      // Get current drawings
      const currentDrawings = draw.getAll()

      // Remove and re-add draw control with new styles
      map.removeControl(draw)

      // Re-initialize with new styles
      draw = new MapboxDraw({
        displayControlsDefault: false,
        controls: {
          polygon: false,
          line_string: false,
          point: false,
          trash: false,
        },
        defaultMode: 'simple_select',
        styles: getDrawStyles(),
      })

      map.addControl(draw, 'top-left')

      // Re-add drawings
      if (currentDrawings.features.length > 0) {
        currentDrawings.features.forEach((feature) => {
          draw.add(feature)
        })
      }

      console.log('🎨 Zeichenstile aktualisiert:', currentDrawingStyles)

      if (window.showToast) {
        window.showToast('Zeichenstile angewendet', 'success')
      }
    } catch (error) {
      console.error('❌ Fehler beim Stil-Update:', error)
    }
  }
}

// 🎨 Clear All Drawings
const clearAllDrawings = () => {
  if (draw) {
    draw.deleteAll()
    updateDrawingsInStore()
    console.log('🗑️ Alle Zeichnungen gelöscht')
  }
}

// 🎨 Import Drawings
const importDrawings = (drawingsData) => {
  if (!draw || !drawingsData.features) {
    console.warn('❌ Cannot import drawings')
    return
  }

  try {
    // Clear existing drawings
    draw.deleteAll()

    // Add imported drawings
    drawingsData.features.forEach((feature) => {
      draw.add(feature)
    })

    // Update store
    updateDrawingsInStore()

    console.log(`📥 ${drawingsData.features.length} Zeichnungen importiert`)

    if (window.showToast) {
      window.showToast(`${drawingsData.features.length} Zeichnungen importiert`, 'success')
    }
  } catch (error) {
    console.error('❌ Import error:', error)
    if (window.showToast) {
      window.showToast('Fehler beim Importieren', 'error')
    }
  }
}

// 🎨 Get Drawing Statistics
const getDrawingStats = () => {
  if (!draw) return { total: 0, points: 0, lines: 0, polygons: 0 }

  const features = draw.getAll().features

  return {
    total: features.length,
    points: features.filter((f) => f.geometry.type === 'Point').length,
    lines: features.filter((f) => f.geometry.type === 'LineString').length,
    polygons: features.filter((f) => f.geometry.type === 'Polygon').length,
  }
}

// 🎨 Event Listeners für Sidebar Communication
const setupDrawingEventListeners = () => {
  // Drawing Mode Changed
  window.addEventListener('drawing-mode-changed', (event) => {
    const { mode } = event.detail
    changeDrawingMode(mode)
  })

  // Drawing Styles Changed
  window.addEventListener('drawing-styles-changed', (event) => {
    const { styles } = event.detail
    updateDrawingStyles(styles)
  })

  // Clear Drawings
  window.addEventListener('clear-drawings', () => {
    clearAllDrawings()
  })

  // Import Drawings
  window.addEventListener('import-drawings', (event) => {
    const { drawings } = event.detail
    importDrawings(drawings)
  })

  console.log('🎨 Drawing Event Listeners eingerichtet')
}

// 📊 Update Drawings in Store
const updateDrawingsInStore = () => {
  if (draw) {
    const drawings = draw.getAll()
    mapStore.drawings = drawings
    mapStore.saveDrawings()
  }
}

// 📊 Drawings aus Store laden
const loadDrawingsFromStore = () => {
  console.log('📊 Lade Drawings aus Store...')

  if (draw && mapStore.drawings?.features?.length > 0) {
    // Bestehende Drawings löschen
    draw.deleteAll()

    // Drawings aus Store hinzufügen
    mapStore.drawings.features.forEach((feature) => {
      draw.add(feature)
    })

    console.log(`✅ ${mapStore.drawings.features.length} Drawings geladen`)
  }
}

// 🎯 Map Events Setup - VOLLSTÄNDIG KORRIGIERT
const setupMapEvents = () => {
  console.log('🎯 Setup Map Events für Position Picking...')

  // Hauptsächlicher Map Click Handler
  map.on('click', (e) => {
    console.log('🗺️ Map Click:', e.lngLat)

    // Position Picking für Hydranten/POI/Marker
    if (uiStore.isPickingPosition) {
      handlePositionPick(e.lngLat)
      return
    }

    // Normale Map Clicks
    console.log('🗺️ Normal map click')
  })

  // 🚒 Hydrant Click Events
  map.on('click', 'hydrants-layer', (e) => {
    const hydrant = e.features[0].properties
    console.log('🚒 Hydrant geklickt:', hydrant)
    showHydrantPopup(e.features[0], e.lngLat)
    hydrantsStore.selectHydrant(hydrant.id)
  })

  // 🏭 POI Click Events (beide Layer abfangen)
  const handlePOIClick = (e) => {
    const poi = e.features[0].properties
    console.log('🏭 POI geklickt:', poi)
    showPOIPopup(e.features[0], e.lngLat)
    poiStore.selectPOI(poi.id)
  }

  map.on('click', 'pois-layer', handlePOIClick)
  map.on('click', 'pois-icons', handlePOIClick)

  // 📍 Marker Click Events (beide Layer abfangen)
  const handleMarkerClick = (e) => {
    const marker = e.features[0].properties
    console.log('📍 Marker geklickt:', marker)
    showMarkerPopup(e.features[0], e.lngLat)
    markersStore.selectMarker(marker.id)
  }

  map.on('click', 'markers-layer', handleMarkerClick)
  map.on('click', 'markers-icons', handleMarkerClick)

  // 🖱️ Cursor Events für alle Layer
  const setupCursorEvents = (layerName) => {
    map.on('mouseenter', layerName, () => {
      map.getCanvas().style.cursor = 'pointer'
    })
    map.on('mouseleave', layerName, () => {
      map.getCanvas().style.cursor = ''
    })
  }

  // Cursor Events für alle interaktiven Layer
  setupCursorEvents('hydrants-layer')
  setupCursorEvents('pois-layer')
  setupCursorEvents('pois-icons')
  setupCursorEvents('markers-layer')
  setupCursorEvents('markers-icons')
}

// 🎯 Handle Position Picking - KORRIGIERT für vollständige POI-Daten
const handlePositionPick = (lngLat) => {
  console.log('🎯 Position gepickt:', lngLat)

  try {
    if (uiStore.isAddingHydrant) {
      const newHydrant = hydrantsStore.addHydrant({
        ...uiStore.pendingHydrantData,
        lng: lngLat.lng,
        lat: lngLat.lat,
      })
      console.log('✅ Hydrant hinzugefügt:', newHydrant)
      emit('position-picked', { type: 'hydrant', data: newHydrant })
    }

    if (uiStore.isAddingPOI) {
      console.log('🏭 POI Daten beim Position Picking:', uiStore.pendingPOIData)

      // KORRIGIERT: Validierung für POI-Daten
      if (!uiStore.pendingPOIData.name || !uiStore.pendingPOIData.category) {
        console.error('❌ POI Daten unvollständig:', uiStore.pendingPOIData)
        if (window.showToast) {
          window.showToast(
            'POI Daten sind unvollständig - bitte Name und Kategorie eingeben',
            'error',
          )
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
      emit('position-picked', { type: 'poi', data: newPOI })
    }

    if (uiStore.isAddingMarker) {
      const newMarker = markersStore.addMarker({
        ...uiStore.pendingMarkerData,
        lng: lngLat.lng,
        lat: lngLat.lat,
      })
      console.log('✅ Marker hinzugefügt:', newMarker)
      emit('position-picked', { type: 'marker', data: newMarker })
    }

    // ✅ ERFOLGREICHEN RESET HINZUFÜGEN:
    uiStore.resetPositionPicking()

    // Cursor zurücksetzen
    map.getCanvas().style.cursor = ''
  } catch (error) {
    console.error('❌ Fehler beim Position Picking:', error)
    uiStore.resetPositionPicking()
  }
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
  if (map.getSource('hydrants')) {
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

// 🏭 POI Layer mit PNG Icons aus assets - KORRIGIERT für Kategorie-Filter
const addPOILayer = () => {
  console.log('🏭 Füge POI Layer mit PNG Icons hinzu...')

  try {
    // 📸 POI Icons aus assets dynamisch importieren
    const loadPOIIconsFromAssets = async () => {
      try {
        // POI Icons dynamisch importieren
        const gasStationIcon = await import('@/assets/icons/gas_station.png')
        const windmillIcon = await import('@/assets/icons/windmill.png')
        const powerPlantIcon = await import('@/assets/icons/power_plant.png')
        const oilPumpIcon = await import('@/assets/icons/oil_pump.png')
        const tanksIcon = await import('@/assets/icons/tanks.png')
        const defaultPOIIcon = await import('@/assets/icons/poi.png')

        // Icons in die Map laden
        const iconPromises = [
          { name: 'gas_station', url: gasStationIcon.default },
          { name: 'windmill', url: windmillIcon.default },
          { name: 'power_plant', url: powerPlantIcon.default },
          { name: 'oil_pump', url: oilPumpIcon.default },
          { name: 'tanks', url: tanksIcon.default },
          { name: 'default-poi', url: defaultPOIIcon.default },
        ].map((icon) => {
          return new Promise((resolve) => {
            map.loadImage(icon.url, (error, image) => {
              if (error) {
                console.warn(`⚠️ POI Icon ${icon.name} konnte nicht geladen werden:`, error)
              } else {
                map.addImage(icon.name, image)
                console.log(`✅ POI Icon geladen: ${icon.name}`)
              }
              resolve()
            })
          })
        })

        await Promise.all(iconPromises)
        return true
      } catch (error) {
        console.warn('⚠️ Einige POI Icons konnten nicht importiert werden:', error)
        return false
      }
    }

    // POI Icons laden und dann Layer erstellen
    loadPOIIconsFromAssets().then(() => {
      // Source hinzufügen
      map.addSource('pois', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: [],
        },
      })

      // 1. 🎨 Farbiger Kreis-Hintergrund
      map.addLayer({
        id: 'pois-layer',
        type: 'circle',
        source: 'pois',
        paint: {
          'circle-radius': 16, // Größer für Icon-Platz
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
            '#ff4444', // KORRIGIERT: Fallback für leere Kategorien (rot statt grau)
          ],
          'circle-stroke-width': 3,
          'circle-stroke-color': '#ffffff',
          'circle-opacity': 0.3, // Transparenter für Icon-Overlay
        },
      })

      // 2. 🎯 PNG Icon Layer darüber
      map.addLayer({
        id: 'pois-icons',
        type: 'symbol',
        source: 'pois',
        layout: {
          'icon-image': [
            'case',
            ['==', ['get', 'category'], 'gas_station'],
            'gas_station',
            ['==', ['get', 'category'], 'windmill'],
            'windmill',
            ['==', ['get', 'category'], 'power_plant'],
            'power_plant',
            ['==', ['get', 'category'], 'oil_pump'],
            'oil_pump',
            ['==', ['get', 'category'], 'tanks'],
            'tanks',
            'default-poi', // Fallback Icon
          ],
          'icon-size': 0.7, // POI Icons etwas größer als Marker
          'icon-allow-overlap': true,
          'icon-ignore-placement': true,
          'icon-anchor': 'center',
        },
      })

      refreshPOILayer()
      console.log('✅ POI Layer mit PNG Icons aus Assets hinzugefügt')
    })
  } catch (error) {
    console.error('❌ POI Layer Fehler:', error)
  }
}

const refreshPOILayer = () => {
  if (map.getSource('pois')) {
    // KORRIGIERT: Filter POIs basierend auf Kategorie-Sichtbarkeit
    const visiblePOIs = poiStore.pois.filter((poi) => {
      // Wenn keine Kategorie gesetzt ist, trotzdem anzeigen (mit Fallback-Icon)
      if (!poi.category) {
        console.warn('⚠️ POI ohne Kategorie gefunden:', poi)
        return true
      }
      // Prüfe ob Kategorie sichtbar ist
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

// 📍 Markers Layer mit PNG Icons aus assets
const addMarkersLayer = () => {
  console.log('📍 Füge Markers Layer mit PNG Icons hinzu...')

  try {
    // 📸 Icons aus assets dynamisch importieren
    const loadIconsFromAssets = async () => {
      const iconMap = {}

      try {
        // Icons dynamisch importieren
        const routeIcon = await import('@/assets/icons/route.png')
        const assemblyIcon = await import('@/assets/icons/assembly.png')
        const warningIcon = await import('@/assets/icons/warning.png')
        const starIcon = await import('@/assets/icons/star.png')
        const stagingIcon = await import('@/assets/icons/staging.png')
        const commandIcon = await import('@/assets/icons/command.png')
        const markerIcon = await import('@/assets/icons/marker.png')

        // Icons in die Map laden
        const iconPromises = [
          { name: 'route', url: routeIcon.default },
          { name: 'assembly', url: assemblyIcon.default },
          { name: 'warning', url: warningIcon.default },
          { name: 'star', url: starIcon.default },
          { name: 'staging', url: stagingIcon.default },
          { name: 'command', url: commandIcon.default },
          { name: 'default-marker', url: markerIcon.default },
        ].map((icon) => {
          return new Promise((resolve) => {
            map.loadImage(icon.url, (error, image) => {
              if (error) {
                console.warn(`⚠️ Icon ${icon.name} konnte nicht geladen werden:`, error)
              } else {
                map.addImage(icon.name, image)
                console.log(`✅ Icon geladen: ${icon.name}`)
              }
              resolve()
            })
          })
        })

        await Promise.all(iconPromises)
        return true
      } catch (error) {
        console.warn('⚠️ Einige Icons konnten nicht importiert werden:', error)
        return false
      }
    }

    // Icons laden und dann Layer erstellen
    loadIconsFromAssets().then(() => {
      // Source hinzufügen
      map.addSource('markers', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: [],
        },
      })

      // 1. 🎨 Farbiger Kreis-Hintergrund (falls Icons transparent sind)
      map.addLayer({
        id: 'markers-layer',
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
          'circle-opacity': 0.3, // Transparenter für Icon-Overlay
        },
      })

      // 2. 🎯 PNG Icon Layer
      map.addLayer({
        id: 'markers-icons',
        type: 'symbol',
        source: 'markers',
        layout: {
          'icon-image': [
            'case',
            ['==', ['get', 'category'], 'route'],
            'route',
            ['==', ['get', 'category'], 'assembly'],
            'assembly',
            ['==', ['get', 'category'], 'warning'],
            'warning',
            ['==', ['get', 'category'], 'star'],
            'star',
            ['==', ['get', 'category'], 'staging'],
            'staging',
            ['==', ['get', 'category'], 'command'],
            'command',
            'default-marker', // Fallback
          ],
          'icon-size': 0.6, // Icon-Größe anpassen
          'icon-allow-overlap': true,
          'icon-ignore-placement': true,
          'icon-anchor': 'center',
        },
      })

      refreshMarkersLayer()
      console.log('✅ Markers Layer mit PNG Icons aus Assets hinzugefügt')
    })
  } catch (error) {
    console.error('❌ Markers Layer Fehler:', error)
  }
}

const refreshMarkersLayer = () => {
  if (map.getSource('markers')) {
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

// 🎛️ Layer Toggle Management - KORRIGIERT für POI-Kategorien
const toggleLayer = (layerName, visible) => {
  if (map && map.getLayer(layerName)) {
    const visibility = visible ? 'visible' : 'none'
    map.setLayoutProperty(layerName, 'visibility', visibility)

    // Auch Icon-Layer toggling (falls vorhanden)
    const iconLayerName = layerName.replace('-layer', '-icons')
    if (map.getLayer(iconLayerName)) {
      map.setLayoutProperty(iconLayerName, 'visibility', visibility)
    }
  }
}

// 👀 Watchers
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

// KORRIGIERT: Layer Visibility Watch für POI-Kategorien
watch(
  () => mapStore.layers,
  (newLayers) => {
    console.log('🎛️ Layer Toggle erkannt:', newLayers)

    Object.keys(newLayers).forEach((layerName) => {
      // Standard Layer Mappings
      const layerMappings = {
        hydrants: 'hydrants-layer',
        pois: 'pois-layer',
        markers: 'markers-layer',
        districts: 'districts-layer',
        routes: 'routes-layer',
        exclusions: 'exclusions-layer',
      }

      // POI Kategorie Layer (spezielle Behandlung)
      if (['gas_station', 'windmill', 'power_plant', 'oil_pump', 'tanks'].includes(layerName)) {
        // Für POI-Kategorien: refresh POI Layer um Filter anzuwenden
        refreshPOILayer()
        return
      }

      // Drawing Layer (spezielle Behandlung)
      if (layerName === 'drawings') {
        if (draw) {
          const visibility = newLayers[layerName] ? 'visible' : 'none'
          const drawLayers = [
            'gl-draw-polygon-fill-inactive',
            'gl-draw-polygon-fill-active',
            'gl-draw-polygon-stroke-inactive',
            'gl-draw-polygon-stroke-active',
            'gl-draw-line-inactive',
            'gl-draw-line-active',
            'gl-draw-point-inactive',
            'gl-draw-point-active',
            'gl-draw-polygon-and-line-vertex-inactive',
          ]

          drawLayers.forEach((drawLayer) => {
            if (map.getLayer(drawLayer)) {
              map.setLayoutProperty(drawLayer, 'visibility', visibility)
            }
          })

          console.log(`🎨 Drawing Layer: ${visibility}`)
        }
        return
      }

      // Standard Layer Toggle
      const mapLayerName = layerMappings[layerName] || layerName
      toggleLayer(mapLayerName, newLayers[layerName])
    })
  },
  { deep: true },
)

watch(
  () => mapStore.mapStyle,
  (newStyle) => {
    if (map && newStyle) {
      // Switch map style
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
    }
  },
)

// 🎬 Lifecycle
onMounted(() => {
  initializeMap()
})

onUnmounted(() => {
  if (map) {
    map.remove()
  }
})

// 🔧 Expose Drawing Functions (für debugging)
const exposeDrawingFunctions = () => {
  window.debugDrawing = {
    changeMode: changeDrawingMode,
    updateStyles: updateDrawingStyles,
    clearAll: clearAllDrawings,
    getStats: getDrawingStats,
    getCurrentStyles: () => currentDrawingStyles,
    getDraw: () => draw,
    getMap: () => map,
  }

  console.log('🔧 Debug: Drawing functions available as window.debugDrawing')
}

// 📤 Expose Methods für Parent Components
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
  getDrawingStats,
})
</script>

<style scoped>
.map-container {
  width: 100vw;
  height: 100vh;
}

/* 🎨 MapLibre Custom Styles */
:deep(.maplibregl-ctrl-group) {
  background: var(--surface) !important;
  border: 1px solid var(--border-color) !important;
  border-radius: 12px !important;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3) !important;
  backdrop-filter: blur(20px) !important;
  display: none !important; /* Hide default controls */
}

:deep(.maplibregl-ctrl button) {
  background: transparent !important;
  color: var(--text-primary) !important;
  border: none !important;
  width: 40px !important;
  height: 40px !important;
}

:deep(.maplibregl-ctrl button:hover) {
  background: var(--surface-hover) !important;
}

:deep(.maplibregl-popup-content) {
  background: var(--surface) !important;
  color: var(--text-primary) !important;
  border: 1px solid var(--border-color) !important;
  border-radius: 12px !important;
  backdrop-filter: blur(20px) !important;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3) !important;
}

:deep(.maplibregl-popup-close-button) {
  color: var(--text-primary) !important;
  font-size: 18px !important;
  right: 8px !important;
  top: 8px !important;
}

:deep(.maplibregl-popup-tip) {
  border-top-color: var(--surface) !important;
}

/* Drawing Controls ausblenden */
:deep(.mapbox-gl-draw_ctrl-draw-btn) {
  display: none !important;
}

:deep(.mapbox-gl-draw_trash) {
  display: none !important;
}
</style>
