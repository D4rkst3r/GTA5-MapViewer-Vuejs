<!-- src/components/MapContainer.vue (VOLLSTÄNDIG KORRIGIERT) -->
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

// 🏭 POI Categories für Category Layer
const poiCategories = {
  gas_station: { name: 'Tankstelle', color: '#ff6b35', icon: '⛽' },
  windmill: { name: 'Windrad', color: '#74c0fc', icon: '💨' },
  power_plant: { name: 'Umspannwerk', color: '#ffd43b', icon: '⚡' },
  oil_pump: { name: 'Ölpumpe', color: '#495057', icon: '🛢️' },
  tanks: { name: 'Tanks', color: '#20c997', icon: '🛢️' },
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

// 🎨 MapboxDraw Styles
const getDrawStyles = () => [
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
      'fill-color': '#ff4444',
      'fill-outline-color': '#ff4444',
      'fill-opacity': 0.3,
    },
  },
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
    paint: { 'line-color': '#ff4444', 'line-width': 3 },
  },
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
    paint: { 'line-color': '#ff4444', 'line-width': 3 },
  },
  {
    id: 'gl-draw-point-inactive',
    type: 'circle',
    filter: ['all', ['==', 'active', 'false'], ['==', '$type', 'Point'], ['!=', 'mode', 'static']],
    paint: {
      'circle-radius': 8,
      'circle-color': '#ff4444',
      'circle-stroke-width': 2,
      'circle-stroke-color': '#ffffff',
    },
  },
]

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
    })

    // Standard Map Events
    map.on('zoom', () => {
      mapStore.updateZoom(map.getZoom())
    })

    map.on('move', () => {
      mapStore.updateCenter(map.getCenter())
    })
  } catch (error) {
    console.error('❌ Map Initialisierung fehlgeschlagen:', error)
  }
}

// 🎯 Map Events Setup
const setupMapEvents = () => {
  console.log('🎯 Setup Map Events für Position Picking...')

  // Hauptsächlicher Map Click Handler
  map.on('click', (e) => {
    console.log('🗺️ Map Click:', e.lngLat)

    // ✅ KORRIGIERT: Verwende UI Store computed property
    if (uiStore.isPickingPosition) {
      handlePositionPick(e.lngLat)
      return // Früher Return verhindert weitere Click-Handler
    }

    // ℹ️ Normale Map Clicks (Info Panel schließen etc.)
    if (uiStore.showInfoPanel) {
      uiStore.closeInfoPanel()
    }

    console.log('🗺️ Normaler Map Click - keine Aktion erforderlich')
  })

  // Cursor Management für Position Picking
  map.on('mousemove', () => {
    if (uiStore.isPickingPosition) {
      map.getCanvas().style.cursor = 'crosshair'
    } else {
      map.getCanvas().style.cursor = ''
    }
  })
}

// ✅ KORRIGIERT: Position Pick Handler
const handlePositionPick = (lngLat) => {
  console.log('🎯 Position picked:', lngLat)

  try {
    // 🚒 Hydrant hinzufügen
    if (uiStore.isAddingHydrant && uiStore.pendingHydrantData) {
      const newHydrant = {
        ...uiStore.pendingHydrantData,
        lng: lngLat.lng,
        lat: lngLat.lat,
      }

      hydrantsStore.addHydrant(newHydrant)
      uiStore.resetPositionPicking()

      console.log('✅ Hydrant hinzugefügt:', newHydrant)
      emit('position-picked', { type: 'hydrant', data: newHydrant })
    }

    // 🏭 POI hinzufügen
    else if (uiStore.isAddingPOI && uiStore.pendingPOIData) {
      const newPOI = {
        ...uiStore.pendingPOIData,
        lng: lngLat.lng,
        lat: lngLat.lat,
      }

      poiStore.addPOI(newPOI)
      uiStore.resetPositionPicking()

      console.log('✅ POI hinzugefügt:', newPOI)
      emit('position-picked', { type: 'poi', data: newPOI })
    }

    // ✅ KORRIGIERT: Marker hinzufügen mit Store
    else if (uiStore.isAddingMarker && uiStore.pendingMarkerData) {
      const newMarker = {
        ...uiStore.pendingMarkerData,
        lng: lngLat.lng,
        lat: lngLat.lat,
      }

      markersStore.addMarker(newMarker)
      uiStore.resetPositionPicking()

      console.log('✅ Marker hinzugefügt:', newMarker)
      emit('position-picked', { type: 'marker', data: newMarker })
    }

    // Cursor zurücksetzen
    map.getCanvas().style.cursor = ''
  } catch (error) {
    console.error('❌ Fehler beim Position Picking:', error)
    uiStore.resetPositionPicking()
  }
}

// ✏️ Drawing System
const initializeDrawing = () => {
  try {
    draw = new MapboxDraw({
      displayControlsDefault: false,
      controls: {
        polygon: true,
        line_string: true,
        point: true,
        trash: true,
      },
      defaultMode: 'simple_select',
      styles: getDrawStyles(),
    })

    map.addControl(draw, 'top-left')

    // Drawing Events
    map.on('draw.create', () => {
      console.log('🎨 Zeichnung erstellt')
      updateDrawingsInStore()
    })

    map.on('draw.update', () => {
      console.log('🎨 Zeichnung aktualisiert')
      updateDrawingsInStore()
    })

    map.on('draw.delete', () => {
      console.log('🎨 Zeichnung gelöscht')
      updateDrawingsInStore()
    })

    console.log('✅ Drawing System initialisiert')
  } catch (error) {
    console.error('❌ Drawing System Fehler:', error)
  }
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

// 🚒 Hydrant Layer
const addHydrantLayer = () => {
  console.log('🚒 Füge Hydrant Layer hinzu...')

  // Hydrant GeoJSON erstellen
  const hydrantGeoJSON = {
    type: 'FeatureCollection',
    features: hydrantsStore.hydrants.map((hydrant) => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [hydrant.lng, hydrant.lat],
      },
      properties: {
        id: hydrant.id,
        area: hydrant.area,
        status: hydrant.status || 'ok',
        type: hydrant.type,
        lastService: hydrant.lastService,
        nextService: hydrant.nextService,
        title: `Hydrant #${hydrant.id}`,
      },
    })),
  }

  // Source hinzufügen
  map.addSource('hydrants', {
    type: 'geojson',
    data: hydrantGeoJSON,
    cluster: true,
    clusterMaxZoom: 14,
    clusterRadius: 50,
  })

  // Cluster Layer
  map.addLayer({
    id: 'clusters',
    type: 'circle',
    source: 'hydrants',
    filter: ['has', 'point_count'],
    paint: {
      'circle-color': ['step', ['get', 'point_count'], '#00ff88', 10, '#ff8800', 30, '#ff4444'],
      'circle-radius': ['step', ['get', 'point_count'], 15, 10, 20, 30, 25],
      'circle-stroke-width': 2,
      'circle-stroke-color': '#ffffff',
    },
  })

  // Cluster Count
  map.addLayer({
    id: 'cluster-count',
    type: 'symbol',
    source: 'hydrants',
    filter: ['has', 'point_count'],
    layout: {
      'text-field': '{point_count_abbreviated}',
      'text-font': ['Open Sans Semibold', 'Arial Unicode MS Bold'],
      'text-size': 12,
    },
    paint: {
      'text-color': '#000000',
    },
  })

  // Individual Hydrants
  map.addLayer({
    id: 'hydrant-points',
    type: 'circle',
    source: 'hydrants',
    filter: ['!', ['has', 'point_count']],
    paint: {
      'circle-color': [
        'match',
        ['get', 'status'],
        'ok',
        '#00ff00',
        'wartung',
        '#ffff00',
        'defekt',
        '#ff0000',
        '#888888',
      ],
      'circle-radius': 8,
      'circle-stroke-width': 2,
      'circle-stroke-color': '#ffffff',
    },
  })

  // Hydrant Symbols
  map.addLayer({
    id: 'hydrant-symbols',
    type: 'symbol',
    source: 'hydrants',
    filter: ['!', ['has', 'point_count']],
    layout: {
      'text-field': '🚒',
      'text-size': 16,
      'text-allow-overlap': true,
    },
  })

  // Hydrant Events Setup
  setupHydrantEvents()
}

// 🚒 Hydrant Events Setup
const setupHydrantEvents = () => {
  map.on('click', 'clusters', (e) => {
    if (uiStore.isPickingPosition) return

    const features = map.queryRenderedFeatures(e.point, { layers: ['clusters'] })
    const clusterId = features[0].properties.cluster_id
    map.getSource('hydrants').getClusterExpansionZoom(clusterId, (err, zoom) => {
      if (err) return
      map.easeTo({
        center: features[0].geometry.coordinates,
        zoom: zoom,
      })
    })
  })

  map.on('click', 'hydrant-points', (e) => {
    if (uiStore.isPickingPosition) return

    const feature = e.features[0]
    const hydrantId = parseInt(feature.properties.id)
    hydrantsStore.selectHydrant(hydrantId)
    showHydrantPopup(feature, e.lngLat)

    emit('hydrant-selected', hydrantId)
  })

  // Cursor Events
  map.on('mouseenter', 'clusters', () => {
    if (!uiStore.isPickingPosition) {
      map.getCanvas().style.cursor = 'pointer'
    }
  })

  map.on('mouseleave', 'clusters', () => {
    if (!uiStore.isPickingPosition) {
      map.getCanvas().style.cursor = ''
    }
  })

  map.on('mouseenter', 'hydrant-points', () => {
    if (!uiStore.isPickingPosition) {
      map.getCanvas().style.cursor = 'pointer'
    }
  })

  map.on('mouseleave', 'hydrant-points', () => {
    if (!uiStore.isPickingPosition) {
      map.getCanvas().style.cursor = ''
    }
  })
}

// 🏭 POI Layer hinzufügen - NUR Category Layer verwenden
const addPOILayer = () => {
  console.log('🏭 Füge POI Category Layer hinzu...')

  // POI GeoJSON erstellen
  const poiGeoJSON = {
    type: 'FeatureCollection',
    features: poiStore.pois.map((poi) => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [poi.lng, poi.lat],
      },
      properties: {
        id: poi.id,
        name: poi.name,
        category: poi.category,
        description: poi.description,
        priority: poi.priority || 'normal',
        title: poi.name,
      },
    })),
  }

  // POI Source hinzufügen
  map.addSource('pois', {
    type: 'geojson',
    data: poiGeoJSON,
  })

  // ✅ NUR kategorie-spezifische Layer erstellen (KEIN Haupt-POI Layer!)
  Object.keys(poiCategories).forEach((category) => {
    // POI Points für diese Kategorie
    map.addLayer({
      id: `poi-${category}`,
      type: 'circle',
      source: 'pois',
      filter: ['==', ['get', 'category'], category],
      paint: {
        'circle-color': poiCategories[category].color,
        'circle-radius': 10,
        'circle-stroke-width': 2,
        'circle-stroke-color': '#ffffff',
      },
    })

    // POI Labels für diese Kategorie
    map.addLayer({
      id: `poi-${category}-labels`,
      type: 'symbol',
      source: 'pois',
      filter: ['==', ['get', 'category'], category],
      layout: {
        'text-field': poiCategories[category].icon,
        'text-size': 20,
        'text-allow-overlap': true,
        'text-offset': [0, 0],
      },
    })

    // POI Namen für diese Kategorie (bei höherem Zoom)
    map.addLayer({
      id: `poi-${category}-names`,
      type: 'symbol',
      source: 'pois',
      filter: ['==', ['get', 'category'], category],
      layout: {
        'text-field': ['get', 'name'],
        'text-font': ['Open Sans Semibold', 'Arial Unicode MS Bold'],
        'text-size': 12,
        'text-offset': [0, 2],
        'text-anchor': 'top',
      },
      paint: {
        'text-color': '#ffffff',
        'text-halo-color': '#000000',
        'text-halo-width': 1,
      },
      minzoom: 3,
    })
  })

  // ✅ Click Events für ALLE Category Layer
  setupPOIEvents()
}

// ✅ KORRIGIERTE POI Events Setup
const setupPOIEvents = () => {
  Object.keys(poiCategories).forEach((category) => {
    // Click Events für jeden Category Layer
    map.on('click', `poi-${category}`, (e) => {
      if (uiStore.isPickingPosition) return

      const feature = e.features[0]
      const poiId = parseInt(feature.properties.id)
      poiStore.selectPOI(poiId)
      showPOIPopup(feature, e.lngLat)
    })

    // Hover Effects für jeden Category Layer
    map.on('mouseenter', `poi-${category}`, () => {
      if (!uiStore.isPickingPosition) {
        map.getCanvas().style.cursor = 'pointer'
      }
    })

    map.on('mouseleave', `poi-${category}`, () => {
      if (!uiStore.isPickingPosition) {
        map.getCanvas().style.cursor = ''
      }
    })
  })
}

// 📍 Markers Layer hinzufügen
const addMarkersLayer = () => {
  console.log('📍 Füge Markers Layer hinzu...')

  const markersGeoJSON = {
    type: 'FeatureCollection',
    features: markersStore.markers.map((marker) => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [marker.lng, marker.lat],
      },
      properties: {
        id: marker.id,
        name: marker.name,
        category: marker.category,
        description: marker.description,
      },
    })),
  }

  // Markers Source hinzufügen
  map.addSource('markers', {
    type: 'geojson',
    data: markersGeoJSON,
  })

  // Markers Layer
  map.addLayer({
    id: 'marker-points',
    type: 'circle',
    source: 'markers',
    paint: {
      'circle-color': [
        'match',
        ['get', 'category'],
        'route',
        '#4287f5',
        'assembly',
        '#ff8800',
        'warning',
        '#ff4757',
        '#9d4edd', // default purple
      ],
      'circle-radius': 8,
      'circle-stroke-width': 2,
      'circle-stroke-color': '#ffffff',
    },
  })

  // Marker Symbols
  map.addLayer({
    id: 'marker-symbols',
    type: 'symbol',
    source: 'markers',
    layout: {
      'text-field': [
        'match',
        ['get', 'category'],
        'route',
        '🛤️',
        'assembly',
        '🏟️',
        'warning',
        '⚠️',
        '⭐', // default star
      ],
      'text-size': 16,
      'text-allow-overlap': true,
    },
  })

  // Marker Events Setup
  setupMarkerEvents()
}

// 📍 Marker Events Setup
const setupMarkerEvents = () => {
  map.on('click', 'marker-points', (e) => {
    if (uiStore.isPickingPosition) return

    const feature = e.features[0]
    const markerId = parseInt(feature.properties.id)
    markersStore.selectMarker(markerId)
    showMarkerPopup(feature, e.lngLat)
  })

  map.on('mouseenter', 'marker-points', () => {
    if (!uiStore.isPickingPosition) {
      map.getCanvas().style.cursor = 'pointer'
    }
  })

  map.on('mouseleave', 'marker-points', () => {
    if (!uiStore.isPickingPosition) {
      map.getCanvas().style.cursor = ''
    }
  })
}

// ✅ KORRIGIERT: Layer Toggle mit POI Categories
const toggleLayer = (layerName, visible) => {
  if (!map) return

  const visibility = visible ? 'visible' : 'none'

  try {
    switch (layerName) {
      case 'hydrants':
        ;['hydrant-points', 'hydrant-symbols', 'clusters', 'cluster-count'].forEach((id) => {
          if (map.getLayer(id)) {
            map.setLayoutProperty(id, 'visibility', visibility)
          }
        })
        break

      case 'markers':
        ;['marker-points', 'marker-symbols'].forEach((id) => {
          if (map.getLayer(id)) {
            map.setLayoutProperty(id, 'visibility', visibility)
          }
        })
        break

      // ✅ KORRIGIERT: POI Category Toggles - alle Layer einer Kategorie
      case 'gas_station':
      case 'windmill':
      case 'power_plant':
      case 'oil_pump':
      case 'tanks':
        ;[`poi-${layerName}`, `poi-${layerName}-labels`, `poi-${layerName}-names`].forEach((id) => {
          if (map.getLayer(id)) {
            map.setLayoutProperty(id, 'visibility', visibility)
          }
        })
        break

      case 'drawings':
        if (draw) {
          if (visible) {
            draw.changeMode('simple_select')
          } else {
            draw.changeMode('static')
          }
        }
        break

      default:
        console.warn(`⚠️ Unbekannter Layer: ${layerName}`)
    }

    console.log(`🎛️ Layer ${layerName}: ${visible ? 'AN' : 'AUS'}`)
  } catch (error) {
    console.error(`❌ Layer toggle error for ${layerName}:`, error)
  }
}

// 🔄 Refresh Layer Functions
const refreshHydrantLayer = () => {
  if (!map || !map.getSource('hydrants')) return

  const hydrantGeoJSON = {
    type: 'FeatureCollection',
    features: hydrantsStore.hydrants.map((hydrant) => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [hydrant.lng, hydrant.lat],
      },
      properties: {
        id: hydrant.id,
        area: hydrant.area,
        status: hydrant.status || 'ok',
        type: hydrant.type,
        lastService: hydrant.lastService,
        nextService: hydrant.nextService,
        title: `Hydrant #${hydrant.id}`,
      },
    })),
  }

  map.getSource('hydrants').setData(hydrantGeoJSON)
}

const refreshPOILayer = () => {
  if (!map || !map.getSource('pois')) return

  const poiGeoJSON = {
    type: 'FeatureCollection',
    features: poiStore.pois.map((poi) => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [poi.lng, poi.lat],
      },
      properties: {
        id: poi.id,
        name: poi.name,
        category: poi.category,
        description: poi.description,
        priority: poi.priority || 'normal',
        title: poi.name,
      },
    })),
  }

  map.getSource('pois').setData(poiGeoJSON)
}

const refreshMarkersLayer = () => {
  if (!map || !map.getSource('markers')) return

  const markersGeoJSON = {
    type: 'FeatureCollection',
    features: markersStore.markers.map((marker) => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [marker.lng, marker.lat],
      },
      properties: {
        id: marker.id,
        name: marker.name,
        category: marker.category,
        description: marker.description,
      },
    })),
  }

  map.getSource('markers').setData(markersGeoJSON)
}

// 💬 Popup Functions
const showHydrantPopup = (feature, lngLat) => {
  const props = feature.properties

  const popupContent = `
    <div style="color: #ffffff; font-weight: bold; margin-bottom: 8px;">
      🚒 ${props.title}
    </div>
    <div style="font-size: 12px; line-height: 1.4;">
      <strong>Gebiet:</strong> ${props.area || 'Unbekannt'}<br>
      <strong>Status:</strong> ${props.status}<br>
      <strong>Typ:</strong> ${props.type || 'Unbekannt'}<br>
      <strong>Letzter Service:</strong> ${props.lastService || 'Nicht gesetzt'}<br>
      <strong>Nächster Service:</strong> ${props.nextService || 'Nicht gesetzt'}
    </div>
  `

  new maplibregl.Popup().setLngLat(lngLat).setHTML(popupContent).addTo(map)
}

const showPOIPopup = (feature, lngLat) => {
  const props = feature.properties

  const popupContent = `
    <div style="color: #ffffff; font-weight: bold; margin-bottom: 8px;">
      🏭 ${props.name}
    </div>
    <div style="font-size: 12px; line-height: 1.4;">
      <strong>Kategorie:</strong> ${props.category}<br>
      <strong>Priorität:</strong> ${props.priority}<br>
      <strong>Beschreibung:</strong> ${props.description || 'Keine Beschreibung'}
    </div>
  `

  new maplibregl.Popup().setLngLat(lngLat).setHTML(popupContent).addTo(map)
}

const showMarkerPopup = (feature, lngLat) => {
  const props = feature.properties

  const popupContent = `
    <div style="color: #ffffff; font-weight: bold; margin-bottom: 8px;">
      📍 ${props.name}
    </div>
    <div style="font-size: 12px; line-height: 1.4;">
      <strong>Kategorie:</strong> ${props.category}<br>
      <strong>Beschreibung:</strong> ${props.description || 'Keine Beschreibung'}
    </div>
  `

  new maplibregl.Popup().setLngLat(lngLat).setHTML(popupContent).addTo(map)
}

// ✅ KORRIGIERT: Watchers ohne Duplikate
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

watch(
  () => mapStore.layers,
  (newLayers) => {
    Object.keys(newLayers).forEach((layerName) => {
      toggleLayer(layerName, newLayers[layerName])
    })
  },
  { deep: true },
)

watch(
  () => mapStore.mapStyle,
  (newStyle) => {
    if (map) {
      mapStore.setMapStyle(newStyle)
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
  setDrawingMode: (mode) => {
    if (draw) {
      draw.changeMode(mode)
    }
  },
  clearAllDrawings: () => {
    if (draw) {
      draw.deleteAll()
      updateDrawingsInStore()
    }
  },
  exportDrawings: () => {
    if (draw) {
      return draw.getAll()
    }
    return { type: 'FeatureCollection', features: [] }
  },
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
}

:deep(.maplibregl-popup-close-button) {
  color: var(--text-primary) !important;
  font-size: 18px !important;
}
</style>
