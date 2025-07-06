<!-- src/components/DrawingControls.vue -->
<template>
  <BaseModal
    v-model="isOpen"
    title="Zeichentools"
    icon="fas fa-draw-polygon"
    size="medium"
    :header-color="'var(--accent-purple)'"
  >
    <!-- Drawing Status -->
    <div class="drawing-header">
      <div class="status-card" :class="drawingStatusClass">
        <div class="status-icon">
          <i :class="drawingStatusIcon"></i>
        </div>
        <div class="status-content">
          <div class="status-title">{{ drawingStatusText }}</div>
          <div class="status-subtitle">{{ drawingModeText }}</div>
        </div>
      </div>
    </div>

    <!-- Drawing Mode Selection -->
    <div class="drawing-modes">
      <h4 class="section-title">
        <i class="fas fa-mouse-pointer"></i>
        Zeichenmodus
      </h4>

      <div class="mode-grid">
        <button
          v-for="mode in drawingModes"
          :key="mode.value"
          @click="setDrawingMode(mode.value)"
          class="mode-btn"
          :class="{ active: currentMode === mode.value }"
        >
          <i :class="mode.icon"></i>
          <span>{{ mode.name }}</span>
        </button>
      </div>
    </div>

    <!-- Drawing Styles -->
    <div class="drawing-styles">
      <h4 class="section-title">
        <i class="fas fa-palette"></i>
        Zeichenstile
      </h4>

      <div class="style-controls">
        <!-- Stroke Color -->
        <div class="control-group">
          <label>Linienfarbe</label>
          <div class="color-selector">
            <input v-model="drawingStyles.strokeColor" type="color" class="color-input" />
            <div class="color-presets">
              <div
                v-for="color in colorPresets"
                :key="color"
                @click="drawingStyles.strokeColor = color"
                class="color-preset"
                :style="{ backgroundColor: color }"
                :class="{ active: drawingStyles.strokeColor === color }"
              ></div>
            </div>
          </div>
        </div>

        <!-- Fill Color -->
        <div class="control-group">
          <label>Füllfarbe</label>
          <div class="color-selector">
            <input v-model="drawingStyles.fillColor" type="color" class="color-input" />
            <div class="color-presets">
              <div
                v-for="color in fillPresets"
                :key="color"
                @click="drawingStyles.fillColor = color"
                class="color-preset"
                :style="{ backgroundColor: color }"
                :class="{ active: drawingStyles.fillColor === color }"
              ></div>
            </div>
          </div>
        </div>

        <!-- Stroke Width -->
        <div class="control-group">
          <label>Linienstärke: {{ drawingStyles.strokeWidth }}px</label>
          <input
            v-model="drawingStyles.strokeWidth"
            type="range"
            min="1"
            max="10"
            class="range-input"
          />
        </div>

        <!-- Fill Opacity -->
        <div class="control-group">
          <label>Füll-Transparenz: {{ Math.round(drawingStyles.fillOpacity * 100) }}%</label>
          <input
            v-model="drawingStyles.fillOpacity"
            type="range"
            min="0"
            max="1"
            step="0.1"
            class="range-input"
          />
        </div>
      </div>
    </div>

    <!-- Current Drawings -->
    <div class="drawings-list">
      <h4 class="section-title">
        <i class="fas fa-list"></i>
        Aktuelle Zeichnungen ({{ drawingsCount }})
      </h4>

      <div v-if="drawingsCount > 0" class="drawings-items">
        <div v-for="(drawing, index) in recentDrawings" :key="drawing.id" class="drawing-item">
          <div class="drawing-info">
            <i :class="getDrawingIcon(drawing.geometry.type)"></i>
            <span>{{ getDrawingName(drawing.geometry.type) }} #{{ index + 1 }}</span>
          </div>
          <div class="drawing-actions">
            <button @click="selectDrawing(drawing)" class="action-btn select-btn" title="Auswählen">
              <i class="fas fa-mouse-pointer"></i>
            </button>
            <button @click="deleteDrawing(drawing)" class="action-btn delete-btn" title="Löschen">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>
      </div>

      <div v-else class="empty-drawings">
        <i class="fas fa-draw-polygon"></i>
        <p>Noch keine Zeichnungen erstellt</p>
      </div>
    </div>

    <!-- Quick Actions -->
    <div class="quick-actions">
      <h4 class="section-title">
        <i class="fas fa-bolt"></i>
        Schnellaktionen
      </h4>

      <div class="action-grid">
        <button @click="clearAllDrawings" class="action-button warning">
          <i class="fas fa-trash-alt"></i>
          Alle löschen
        </button>

        <button @click="exportDrawings" class="action-button secondary">
          <i class="fas fa-download"></i>
          Exportieren
        </button>

        <button @click="importDrawings" class="action-button secondary">
          <i class="fas fa-upload"></i>
          Importieren
        </button>

        <button @click="saveAsTemplate" class="action-button primary">
          <i class="fas fa-save"></i>
          Als Vorlage
        </button>
      </div>
    </div>

    <!-- Footer -->
    <template #footer>
      <button @click="resetToDefault" class="btn btn-secondary">
        <i class="fas fa-undo"></i>
        Zurücksetzen
      </button>

      <button @click="applyStyles" class="btn btn-primary">
        <i class="fas fa-check"></i>
        Stile anwenden
      </button>

      <button @click="close" class="btn btn-primary">
        <i class="fas fa-times"></i>
        Schließen
      </button>
    </template>
  </BaseModal>

  <!-- Hidden File Input for Import -->
  <input
    ref="fileInput"
    type="file"
    accept=".geojson,.json"
    @change="handleFileImport"
    style="display: none"
  />
</template>

<script setup>
import { ref, computed, watch, inject } from 'vue'
import { useMapStore } from '@/stores/map'
import BaseModal from './BaseModal.vue'

// 🎭 Props & Emits
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits([
  'update:modelValue',
  'mode-changed',
  'styles-changed',
  'clear-drawings',
  'export-drawings',
  'import-drawings',
])

// 🏪 Store & Injections
const mapStore = useMapStore()

// 📊 Reactive State
const isOpen = ref(false)
const currentMode = ref('simple_select')
const fileInput = ref(null)

// Drawing Styles
const drawingStyles = ref({
  strokeColor: '#ff4444',
  fillColor: '#ff4444',
  strokeWidth: 3,
  fillOpacity: 0.3,
})

// Drawing Modes
const drawingModes = [
  {
    value: 'simple_select',
    name: 'Auswählen',
    icon: 'fas fa-mouse-pointer',
  },
  {
    value: 'draw_point',
    name: 'Punkt',
    icon: 'fas fa-map-pin',
  },
  {
    value: 'draw_line_string',
    name: 'Linie',
    icon: 'fas fa-minus',
  },
  {
    value: 'draw_polygon',
    name: 'Polygon',
    icon: 'fas fa-draw-polygon',
  },
]

// Color Presets
const colorPresets = [
  '#ff4444', // Feuerwehr Rot
  '#4287f5', // Blau
  '#2ed573', // Grün
  '#ffa502', // Orange
  '#9d4edd', // Lila
  '#ffffff', // Weiß
  '#000000', // Schwarz
]

const fillPresets = [
  '#ff444430', // Transparent Rot
  '#4287f530', // Transparent Blau
  '#2ed57330', // Transparent Grün
  '#ffa50230', // Transparent Orange
  '#9d4edd30', // Transparent Lila
  '#ffffff30', // Transparent Weiß
  '#00000030', // Transparent Schwarz
]

// 🧮 Computed Properties
const drawingStatusClass = computed(() => {
  switch (currentMode.value) {
    case 'simple_select':
      return 'status-select'
    case 'draw_point':
      return 'status-point'
    case 'draw_line_string':
      return 'status-line'
    case 'draw_polygon':
      return 'status-polygon'
    default:
      return 'status-default'
  }
})

const drawingStatusIcon = computed(() => {
  switch (currentMode.value) {
    case 'simple_select':
      return 'fas fa-mouse-pointer'
    case 'draw_point':
      return 'fas fa-map-pin'
    case 'draw_line_string':
      return 'fas fa-minus'
    case 'draw_polygon':
      return 'fas fa-draw-polygon'
    default:
      return 'fas fa-draw-polygon'
  }
})

const drawingStatusText = computed(() => {
  switch (currentMode.value) {
    case 'simple_select':
      return 'Auswahlmodus'
    case 'draw_point':
      return 'Punkt zeichnen'
    case 'draw_line_string':
      return 'Linie zeichnen'
    case 'draw_polygon':
      return 'Polygon zeichnen'
    default:
      return 'Bereit'
  }
})

const drawingModeText = computed(() => {
  switch (currentMode.value) {
    case 'simple_select':
      return 'Zeichnungen auswählen und bearbeiten'
    case 'draw_point':
      return 'Klicken Sie auf die Karte um Punkte zu setzen'
    case 'draw_line_string':
      return 'Klicken Sie um Linienpunkte zu setzen, Doppelklick zum Beenden'
    case 'draw_polygon':
      return 'Klicken Sie um Polygonpunkte zu setzen, Doppelklick zum Beenden'
    default:
      return 'Wählen Sie einen Zeichenmodus'
  }
})

const drawingsCount = computed(() => {
  return mapStore.drawings?.features?.length || 0
})

const recentDrawings = computed(() => {
  return mapStore.drawings?.features?.slice(-5) || []
})

// 👀 Watchers
watch(
  () => props.modelValue,
  (value) => {
    isOpen.value = value
  },
)

watch(isOpen, (value) => {
  emit('update:modelValue', value)
})

watch(
  drawingStyles,
  (newStyles) => {
    emit('styles-changed', newStyles)
  },
  { deep: true },
)

// 🎮 Methods
const close = () => {
  isOpen.value = false
}

const setDrawingMode = (mode) => {
  currentMode.value = mode
  emit('mode-changed', mode)
  console.log(`🎨 Zeichenmodus gewechselt zu: ${mode}`)
}

const applyStyles = () => {
  emit('styles-changed', drawingStyles.value)
  window.showToast?.('Zeichenstile angewendet', 'success')
}

const resetToDefault = () => {
  drawingStyles.value = {
    strokeColor: '#ff4444',
    fillColor: '#ff4444',
    strokeWidth: 3,
    fillOpacity: 0.3,
  }
  currentMode.value = 'simple_select'
  setDrawingMode('simple_select')
  window.showToast?.('Einstellungen zurückgesetzt', 'info')
}

const clearAllDrawings = async () => {
  const confirmed = await window.showConfirm?.(
    'Möchten Sie wirklich alle Zeichnungen löschen?',
    'Alle Zeichnungen löschen',
  )

  if (confirmed) {
    emit('clear-drawings')
    window.showToast?.('Alle Zeichnungen gelöscht', 'success')
  }
}

const exportDrawings = () => {
  const drawings = {
    type: 'FeatureCollection',
    features: mapStore.drawings?.features || [],
    metadata: {
      createdAt: new Date().toISOString(),
      styles: drawingStyles.value,
      totalFeatures: mapStore.drawings?.features?.length || 0,
    },
  }

  const blob = new Blob([JSON.stringify(drawings, null, 2)], {
    type: 'application/json',
  })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.download = `SAFD_Zeichnungen_${new Date().toISOString().split('T')[0]}.geojson`
  link.click()

  URL.revokeObjectURL(url)
  window.showToast?.('Zeichnungen exportiert', 'success')

  emit('export-drawings', drawings)
}

const importDrawings = () => {
  fileInput.value?.click()
}

const handleFileImport = (event) => {
  const file = event.target.files[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result)

      if (data.type === 'FeatureCollection' && data.features) {
        emit('import-drawings', data)
        window.showToast?.(`${data.features.length} Zeichnungen importiert`, 'success')
      } else {
        window.showToast?.('Ungültiges Dateiformat', 'error')
      }
    } catch (error) {
      console.error('Import error:', error)
      window.showToast?.('Fehler beim Importieren', 'error')
    }
  }

  reader.readAsText(file)
  event.target.value = '' // Reset file input
}

const saveAsTemplate = () => {
  const template = {
    name: `Vorlage_${new Date().toISOString().split('T')[0]}`,
    styles: drawingStyles.value,
    drawings: mapStore.drawings?.features || [],
  }

  // Save to localStorage as template
  const templates = JSON.parse(localStorage.getItem('safd_drawing_templates') || '[]')
  templates.push(template)
  localStorage.setItem('safd_drawing_templates', JSON.stringify(templates))

  window.showToast?.('Vorlage gespeichert', 'success')
}

const selectDrawing = (drawing) => {
  // Focus on the drawing
  setDrawingMode('simple_select')
  console.log('📍 Zeichnung ausgewählt:', drawing.id)
  // Here you could emit an event to center the map on this drawing
}

const deleteDrawing = (drawing) => {
  const index = mapStore.drawings.features.findIndex((f) => f.id === drawing.id)
  if (index !== -1) {
    mapStore.drawings.features.splice(index, 1)
    mapStore.saveDrawings()
    window.showToast?.('Zeichnung gelöscht', 'success')
  }
}

const getDrawingIcon = (geometryType) => {
  switch (geometryType) {
    case 'Point':
      return 'fas fa-map-pin'
    case 'LineString':
      return 'fas fa-minus'
    case 'Polygon':
      return 'fas fa-draw-polygon'
    default:
      return 'fas fa-question'
  }
}

const getDrawingName = (geometryType) => {
  switch (geometryType) {
    case 'Point':
      return 'Punkt'
    case 'LineString':
      return 'Linie'
    case 'Polygon':
      return 'Polygon'
    default:
      return 'Unbekannt'
  }
}
</script>

<style scoped>
/* Header */
.drawing-header {
  margin-bottom: 24px;
}

.status-card {
  display: flex;
  align-items: center;
  padding: 16px;
  border-radius: 12px;
  gap: 12px;
  border: 2px solid;
  transition: all 0.3s ease;
}

.status-select {
  background: rgba(66, 135, 245, 0.1);
  border-color: var(--accent-blue);
}

.status-point {
  background: rgba(46, 213, 115, 0.1);
  border-color: var(--success);
}

.status-line {
  background: rgba(255, 165, 2, 0.1);
  border-color: var(--warning);
}

.status-polygon {
  background: rgba(157, 77, 221, 0.1);
  border-color: var(--accent-purple);
}

.status-icon {
  font-size: 24px;
  color: var(--accent-blue);
}

.status-select .status-icon {
  color: var(--accent-blue);
}
.status-point .status-icon {
  color: var(--success);
}
.status-line .status-icon {
  color: var(--warning);
}
.status-polygon .status-icon {
  color: var(--accent-purple);
}

.status-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 4px;
}

.status-subtitle {
  font-size: 12px;
  color: var(--text-secondary);
}

/* Section Titles */
.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

/* Drawing Modes */
.drawing-modes {
  margin-bottom: 24px;
}

.mode-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.mode-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px 12px;
  background: rgba(255, 255, 255, 0.05);
  border: 2px solid var(--border-color);
  border-radius: 8px;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s ease;
  gap: 8px;
}

.mode-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: var(--text-primary);
}

.mode-btn.active {
  background: rgba(255, 68, 68, 0.1);
  border-color: var(--primary-color);
  color: var(--primary-color);
}

.mode-btn i {
  font-size: 20px;
}

.mode-btn span {
  font-size: 12px;
  font-weight: 500;
}

/* Drawing Styles */
.drawing-styles {
  margin-bottom: 24px;
}

.style-controls {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.control-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.control-group label {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
}

.color-selector {
  display: flex;
  align-items: center;
  gap: 12px;
}

.color-input {
  width: 40px;
  height: 40px;
  border: 2px solid var(--border-color);
  border-radius: 8px;
  cursor: pointer;
}

.color-presets {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.color-preset {
  width: 24px;
  height: 24px;
  border-radius: 4px;
  cursor: pointer;
  border: 2px solid transparent;
  transition: all 0.2s ease;
}

.color-preset:hover {
  transform: scale(1.1);
}

.color-preset.active {
  border-color: var(--text-primary);
  transform: scale(1.1);
}

.range-input {
  width: 100%;
  height: 6px;
  background: var(--border-color);
  border-radius: 3px;
  outline: none;
  cursor: pointer;
}

/* Drawings List */
.drawings-list {
  margin-bottom: 24px;
}

.drawings-items {
  max-height: 200px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.drawing-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 6px;
  border: 1px solid var(--border-color);
}

.drawing-info {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--text-primary);
  font-size: 14px;
}

.drawing-actions {
  display: flex;
  gap: 4px;
}

.action-btn {
  width: 28px;
  height: 28px;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  transition: all 0.2s ease;
}

.select-btn:hover {
  background: var(--accent-blue);
  color: white;
  border-color: var(--accent-blue);
}

.delete-btn:hover {
  background: var(--danger);
  color: white;
  border-color: var(--danger);
}

.empty-drawings {
  text-align: center;
  padding: 32px 16px;
  color: var(--text-secondary);
}

.empty-drawings i {
  font-size: 48px;
  margin-bottom: 12px;
  opacity: 0.5;
}

/* Quick Actions */
.quick-actions {
  margin-bottom: 20px;
}

.action-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.action-button {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px 8px;
  border: 1px solid;
  border-radius: 6px;
  background: transparent;
  cursor: pointer;
  transition: all 0.2s ease;
  gap: 6px;
  font-size: 12px;
}

.action-button.primary {
  border-color: var(--primary-color);
  color: var(--primary-color);
}

.action-button.primary:hover {
  background: var(--primary-color);
  color: white;
}

.action-button.secondary {
  border-color: var(--accent-blue);
  color: var(--accent-blue);
}

.action-button.secondary:hover {
  background: var(--accent-blue);
  color: white;
}

.action-button.warning {
  border-color: var(--warning);
  color: var(--warning);
}

.action-button.warning:hover {
  background: var(--warning);
  color: white;
}

/* Footer Buttons */
.btn {
  padding: 10px 16px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s ease;
}

.btn-primary {
  background: var(--primary-color);
  color: white;
}

.btn-secondary {
  background: var(--surface-hover);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
}

/* Responsive */
@media (max-width: 768px) {
  .mode-grid {
    grid-template-columns: 1fr;
  }

  .action-grid {
    grid-template-columns: 1fr;
  }

  .color-selector {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
