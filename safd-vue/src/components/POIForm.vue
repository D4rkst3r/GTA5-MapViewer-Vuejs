<!-- src/components/POIForm.vue (KORRIGIERT) -->
<template>
  <BaseModal
    v-model="isOpen"
    :title="isEditing ? `POI bearbeiten: ${poi?.name}` : 'Neuen POI hinzufügen'"
    icon="fas fa-map-marker-alt"
    size="medium"
    :header-color="selectedCategoryColor"
    @close="cancel"
  >
    <form @submit.prevent="submit" class="poi-form">
      <!-- Preview -->
      <div v-if="formData.category" class="poi-preview">
        <div class="preview-icon" :style="{ backgroundColor: selectedCategoryColor }">
          <i :class="getCategoryIcon(formData.category)"></i>
        </div>
        <div class="preview-info">
          <strong>{{ formData.name || 'Neuer POI' }}</strong>
          <span>{{ getCategoryName(formData.category) }}</span>
        </div>
      </div>

      <!-- Form Fields -->
      <div class="form-grid">
        <div class="form-group full-width">
          <label for="poi-name">Name *</label>
          <input
            id="poi-name"
            v-model="formData.name"
            type="text"
            class="form-input"
            placeholder="z.B. Shell Tankstelle Downtown"
            required
          />
        </div>

        <div class="form-group">
          <label for="poi-category">Kategorie *</label>
          <select
            id="poi-category"
            v-model="formData.category"
            class="form-input"
            required
            @change="onCategoryChange"
          >
            <option value="">– Kategorie wählen –</option>
            <option v-for="(categoryData, key) in poiCategories" :key="key" :value="key">
              {{ categoryData.name }}
            </option>
          </select>
        </div>

        <div class="form-group">
          <label for="poi-priority">Priorität</label>
          <select id="poi-priority" v-model="formData.priority" class="form-input">
            <option value="low">Niedrig</option>
            <option value="normal">Normal</option>
            <option value="high">Hoch</option>
            <option value="critical">Kritisch</option>
          </select>
        </div>

        <div class="form-group full-width">
          <label for="poi-description">Beschreibung</label>
          <textarea
            id="poi-description"
            v-model="formData.description"
            class="form-input"
            rows="4"
            placeholder="Zusätzliche Informationen, Öffnungszeiten, Notfallkontakt..."
          ></textarea>
        </div>

        <!-- ✅ ERWEITERT: Kategorie-spezifische Felder -->
        <template v-if="formData.category">
          <!-- Tankstelle Felder -->
          <template v-if="formData.category === 'gas_station'">
            <div class="form-group">
              <label for="opening-hours">Öffnungszeiten</label>
              <input
                id="opening-hours"
                v-model="formData.openingHours"
                type="text"
                class="form-input"
                placeholder="z.B. 24/7 oder Mo-Fr 6-22 Uhr"
              />
            </div>

            <div class="form-group">
              <label for="fuel-types">Kraftstoffarten</label>
              <input
                id="fuel-types"
                v-model="formData.fuelTypes"
                type="text"
                class="form-input"
                placeholder="z.B. Benzin, Diesel, LPG"
              />
            </div>

            <div class="form-group">
              <label for="has-shop">24h Shop</label>
              <select id="has-shop" v-model="formData.hasShop" class="form-input">
                <option value="">Unbekannt</option>
                <option value="yes">Ja</option>
                <option value="no">Nein</option>
              </select>
            </div>
          </template>

          <!-- Umspannwerk Felder -->
          <template v-if="formData.category === 'power_plant'">
            <div class="form-group">
              <label for="voltage">Spannung (kV)</label>
              <input
                id="voltage"
                v-model="formData.voltage"
                type="number"
                class="form-input"
                placeholder="z.B. 110"
                min="1"
                max="1000"
              />
            </div>

            <div class="form-group">
              <label for="operator">Betreiber</label>
              <input
                id="operator"
                v-model="formData.operator"
                type="text"
                class="form-input"
                placeholder="z.B. Los Santos Power"
              />
            </div>

            <div class="form-group">
              <label for="access-restricted">Zugang beschränkt</label>
              <select id="access-restricted" v-model="formData.accessRestricted" class="form-input">
                <option value="yes">Ja</option>
                <option value="no">Nein</option>
                <option value="emergency">Nur Notfall</option>
              </select>
            </div>
          </template>

          <!-- Windmühle Felder -->
          <template v-if="formData.category === 'windmill'">
            <div class="form-group">
              <label for="capacity">Leistung (MW)</label>
              <input
                id="capacity"
                v-model="formData.capacity"
                type="number"
                step="0.1"
                class="form-input"
                placeholder="z.B. 2.5"
                min="0"
                max="10"
              />
            </div>

            <div class="form-group">
              <label for="turbine-count">Anzahl Turbinen</label>
              <input
                id="turbine-count"
                v-model="formData.turbineCount"
                type="number"
                class="form-input"
                placeholder="z.B. 5"
                min="1"
                max="50"
              />
            </div>
          </template>

          <!-- Ölpumpe Felder -->
          <template v-if="formData.category === 'oil_pump'">
            <div class="form-group">
              <label for="daily-output">Tagesförderung (Barrel)</label>
              <input
                id="daily-output"
                v-model="formData.dailyOutput"
                type="number"
                class="form-input"
                placeholder="z.B. 1000"
                min="1"
              />
            </div>

            <div class="form-group">
              <label for="pump-status">Pump-Status</label>
              <select id="pump-status" v-model="formData.pumpStatus" class="form-input">
                <option value="active">Aktiv</option>
                <option value="maintenance">Wartung</option>
                <option value="inactive">Inaktiv</option>
              </select>
            </div>
          </template>

          <!-- Tanks Felder -->
          <template v-if="formData.category === 'tanks'">
            <div class="form-group">
              <label for="tank-count">Anzahl Tanks</label>
              <input
                id="tank-count"
                v-model="formData.tankCount"
                type="number"
                class="form-input"
                placeholder="z.B. 4"
                min="1"
                max="20"
              />
            </div>

            <div class="form-group">
              <label for="total-capacity">Gesamtkapazität (Liter)</label>
              <input
                id="total-capacity"
                v-model="formData.totalCapacity"
                type="number"
                class="form-input"
                placeholder="z.B. 50000"
                min="1"
              />
            </div>

            <div class="form-group">
              <label for="content-type">Inhalt</label>
              <select id="content-type" v-model="formData.contentType" class="form-input">
                <option value="fuel">Kraftstoff</option>
                <option value="oil">Rohöl</option>
                <option value="gas">Gas</option>
                <option value="water">Wasser</option>
                <option value="chemical">Chemikalien</option>
              </select>
            </div>
          </template>
        </template>
      </div>

      <!-- Position Info -->
      <div v-if="isEditing && poi" class="position-info">
        <h4><i class="fas fa-crosshairs"></i> Position</h4>
        <div class="position-details">
          <span><strong>Longitude:</strong> {{ poi.lng?.toFixed(6) }}</span>
          <span><strong>Latitude:</strong> {{ poi.lat?.toFixed(6) }}</span>
        </div>
      </div>

      <!-- Position Picker (nur bei Neuerststellung) -->
      <div v-if="!isEditing" class="position-picker">
        <h4><i class="fas fa-crosshairs"></i> Position festlegen</h4>
        <p class="instruction">
          <i class="fas fa-info-circle"></i>
          Nach dem Speichern auf die Karte klicken um die Position festzulegen.
        </p>
      </div>
    </form>

    <!-- Footer Buttons -->
    <template #footer>
      <button type="button" @click="cancel" class="btn btn-secondary">
        <i class="fas fa-times"></i>
        Abbrechen
      </button>
      <button type="submit" @click="submit" class="btn btn-primary" :disabled="!isFormValid">
        <i class="fas fa-save"></i>
        {{ isEditing ? 'Aktualisieren' : 'Erstellen' }}
      </button>
    </template>
  </BaseModal>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { usePOIStore } from '@/stores/pois'
import { useUIStore } from '@/stores/ui' // ✅ HINZUGEFÜGT
import BaseModal from './BaseModal.vue'

// 🎭 Props & Emits
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  poi: {
    type: Object,
    default: null,
  },
})

const emit = defineEmits(['update:modelValue', 'poi-saved'])

// 🏪 Stores
const poiStore = usePOIStore()
const uiStore = useUIStore() // ✅ HINZUGEFÜGT

// 📊 Reactive Data
const isOpen = ref(false)
const formData = ref({
  name: '',
  category: '',
  description: '',
  priority: 'normal',

  // Tankstelle
  openingHours: '',
  fuelTypes: '',
  hasShop: '',

  // Umspannwerk
  voltage: '',
  operator: '',
  accessRestricted: 'yes',

  // Windmühle
  capacity: '',
  turbineCount: '',

  // Ölpumpe
  dailyOutput: '',
  pumpStatus: 'active',

  // Tanks
  tankCount: '',
  totalCapacity: '',
  contentType: 'fuel',
})

// 🏭 POI Categories
const poiCategories = {
  gas_station: {
    name: 'Tankstelle',
    color: '#ff6b35',
    icon: 'fas fa-gas-pump',
  },
  windmill: {
    name: 'Windrad',
    color: '#74c0fc',
    icon: 'fas fa-wind',
  },
  power_plant: {
    name: 'Umspannwerk',
    color: '#ffd43b',
    icon: 'fas fa-bolt',
  },
  oil_pump: {
    name: 'Ölpumpe',
    color: '#495057',
    icon: 'fas fa-oil-well',
  },
  tanks: {
    name: 'Tanks',
    color: '#20c997',
    icon: 'fas fa-database',
  },
}

// 🧮 Computed
const isEditing = computed(() => !!props.poi)

const selectedCategoryColor = computed(() => {
  return poiCategories[formData.value.category]?.color || 'var(--accent-blue)'
})

// ✅ HINZUGEFÜGT: Form Validation
const isFormValid = computed(() => {
  return formData.value.name.trim() && formData.value.category
})

// 👀 Watchers
watch(
  () => props.modelValue,
  (value) => {
    isOpen.value = value
    if (value && props.poi) {
      // Edit Mode: Form mit POI-Daten füllen
      formData.value = {
        name: props.poi.name || '',
        category: props.poi.category || '',
        description: props.poi.description || '',
        priority: props.poi.priority || 'normal',

        // Alle spezifischen Felder
        openingHours: props.poi.openingHours || '',
        fuelTypes: props.poi.fuelTypes || '',
        hasShop: props.poi.hasShop || '',
        voltage: props.poi.voltage || '',
        operator: props.poi.operator || '',
        accessRestricted: props.poi.accessRestricted || 'yes',
        capacity: props.poi.capacity || '',
        turbineCount: props.poi.turbineCount || '',
        dailyOutput: props.poi.dailyOutput || '',
        pumpStatus: props.poi.pumpStatus || 'active',
        tankCount: props.poi.tankCount || '',
        totalCapacity: props.poi.totalCapacity || '',
        contentType: props.poi.contentType || 'fuel',
      }
    } else if (value) {
      // Create Mode: Form zurücksetzen
      resetForm()
    }
  },
)

watch(isOpen, (value) => {
  emit('update:modelValue', value)
})

// 🎮 Methods
const resetForm = () => {
  formData.value = {
    name: '',
    category: '',
    description: '',
    priority: 'normal',

    // Alle spezifischen Felder zurücksetzen
    openingHours: '',
    fuelTypes: '',
    hasShop: '',
    voltage: '',
    operator: '',
    accessRestricted: 'yes',
    capacity: '',
    turbineCount: '',
    dailyOutput: '',
    pumpStatus: 'active',
    tankCount: '',
    totalCapacity: '',
    contentType: 'fuel',
  }
}

const getCategoryName = (category) => {
  return poiCategories[category]?.name || category
}

const getCategoryIcon = (category) => {
  return poiCategories[category]?.icon || 'fas fa-map-marker-alt'
}

const onCategoryChange = () => {
  // Kategorie-spezifische Standardwerte setzen
  switch (formData.value.category) {
    case 'gas_station':
      if (!formData.value.openingHours) formData.value.openingHours = '24/7'
      if (!formData.value.fuelTypes) formData.value.fuelTypes = 'Benzin, Diesel'
      break

    case 'power_plant':
      if (!formData.value.voltage) formData.value.voltage = '110'
      if (!formData.value.accessRestricted) formData.value.accessRestricted = 'yes'
      break

    case 'windmill':
      if (!formData.value.capacity) formData.value.capacity = '2.5'
      if (!formData.value.turbineCount) formData.value.turbineCount = '1'
      break

    case 'oil_pump':
      if (!formData.value.pumpStatus) formData.value.pumpStatus = 'active'
      break

    case 'tanks':
      if (!formData.value.contentType) formData.value.contentType = 'fuel'
      if (!formData.value.tankCount) formData.value.tankCount = '2'
      break
  }
}

// ✅ KORRIGIERT: Bessere Position Picking Integration
const submit = () => {
  // Validation
  if (!formData.value.name.trim()) {
    window.showToast?.('Bitte gib einen Namen ein', 'warning')
    return
  }

  if (!formData.value.category) {
    window.showToast?.('Bitte wähle eine Kategorie', 'warning')
    return
  }

  // ✅ HINZUGEFÜGT: Kategorie-spezifische Validation
  if (!validateCategorySpecificFields()) {
    return
  }

  if (isEditing.value) {
    // ✅ Update existing POI
    const updatedData = cleanFormData()
    poiStore.updatePOI(props.poi.id, updatedData)

    if (window.showToast) {
      window.showToast(`POI "${formData.value.name}" aktualisiert`, 'success')
    }

    console.log(`✅ POI #${props.poi.id} aktualisiert`)
    close()
  } else {
    // ✅ KORRIGIERT: UI Store für Position Picking verwenden
    try {
      const cleanedData = cleanFormData()
      uiStore.startPOIPicking(cleanedData)

      if (window.showToast) {
        window.showToast('Klicke jetzt auf die Karte um die Position festzulegen', 'info', 4000)
      }

      console.log('🎯 POI Position Picking gestartet:', cleanedData)
      close()
    } catch (error) {
      console.error('❌ Fehler beim Starten des Position Picking:', error)

      if (window.showToast) {
        window.showToast('Fehler beim Starten des Position Picking', 'error')
      }
    }
  }

  emit('poi-saved', {
    ...cleanFormData(),
    isEditing: isEditing.value,
    id: isEditing.value ? props.poi.id : null,
  })
}

// ✅ HINZUGEFÜGT: Form Data Cleaning
const cleanFormData = () => {
  const cleaned = { ...formData.value }

  // Entferne leere Felder die nicht zur aktuellen Kategorie gehören
  const categoryFields = {
    gas_station: ['openingHours', 'fuelTypes', 'hasShop'],
    power_plant: ['voltage', 'operator', 'accessRestricted'],
    windmill: ['capacity', 'turbineCount'],
    oil_pump: ['dailyOutput', 'pumpStatus'],
    tanks: ['tankCount', 'totalCapacity', 'contentType'],
  }

  // Alle anderen kategorie-spezifischen Felder entfernen
  Object.keys(categoryFields).forEach((category) => {
    if (category !== cleaned.category) {
      categoryFields[category].forEach((field) => {
        delete cleaned[field]
      })
    }
  })

  return cleaned
}

// ✅ HINZUGEFÜGT: Kategorie-spezifische Validation
const validateCategorySpecificFields = () => {
  switch (formData.value.category) {
    case 'power_plant':
      if (formData.value.voltage && (formData.value.voltage < 1 || formData.value.voltage > 1000)) {
        window.showToast?.('Spannung muss zwischen 1 und 1000 kV liegen', 'warning')
        return false
      }
      break

    case 'windmill':
      if (formData.value.capacity && formData.value.capacity < 0) {
        window.showToast?.('Leistung kann nicht negativ sein', 'warning')
        return false
      }
      if (formData.value.turbineCount && formData.value.turbineCount < 1) {
        window.showToast?.('Mindestens 1 Turbine erforderlich', 'warning')
        return false
      }
      break

    case 'oil_pump':
      if (formData.value.dailyOutput && formData.value.dailyOutput < 1) {
        window.showToast?.('Tagesförderung muss größer als 0 sein', 'warning')
        return false
      }
      break

    case 'tanks':
      if (formData.value.tankCount && formData.value.tankCount < 1) {
        window.showToast?.('Mindestens 1 Tank erforderlich', 'warning')
        return false
      }
      if (formData.value.totalCapacity && formData.value.totalCapacity < 1) {
        window.showToast?.('Kapazität muss größer als 0 sein', 'warning')
        return false
      }
      break
  }

  return true
}

const cancel = () => {
  // ✅ HINZUGEFÜGT: Position Picking abbrechen falls aktiv
  if (uiStore.isAddingPOI) {
    uiStore.resetPositionPicking()
    console.log('🚫 POI Position Picking abgebrochen')
  }

  close()
}

const close = () => {
  isOpen.value = false
  resetForm()
}
</script>

<style scoped>
.poi-form {
  min-height: 500px;
}

.poi-preview {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  margin-bottom: 24px;
  border: 1px solid var(--border-color);
  transition: all 0.2s ease;
}

.poi-preview:hover {
  background: rgba(255, 255, 255, 0.08);
}

.preview-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 20px;
  transition: transform 0.2s ease;
}

.poi-preview:hover .preview-icon {
  transform: scale(1.05);
}

.preview-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.preview-info strong {
  color: var(--text-primary);
  font-size: 16px;
  font-weight: 600;
}

.preview-info span {
  color: var(--text-secondary);
  font-size: 14px;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-group.full-width {
  grid-column: 1 / -1;
}

.form-group label {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.form-group label[for$='name']::after,
.form-group label[for$='category']::after {
  content: '*';
  color: var(--danger);
  margin-left: 2px;
}

.form-input {
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  color: var(--text-primary);
  font-size: 14px;
  transition: all 0.2s ease;
  font-family: inherit;
}

.form-input:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(255, 68, 68, 0.1);
  background: rgba(255, 255, 255, 0.12);
}

.form-input:invalid {
  border-color: var(--danger);
}

.form-input::placeholder {
  color: var(--text-secondary);
  opacity: 0.7;
}

/* ✅ HINZUGEFÜGT: Number Input Styling */
input[type='number'].form-input {
  -moz-appearance: textfield;
}

input[type='number'].form-input::-webkit-outer-spin-button,
input[type='number'].form-input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.position-info {
  background: rgba(255, 255, 255, 0.05);
  padding: 16px;
  border-radius: 8px;
  margin-top: 24px;
  border: 1px solid var(--border-color);
}

.position-info h4 {
  margin-bottom: 12px;
  color: var(--text-primary);
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.position-details {
  display: flex;
  gap: 20px;
  font-size: 13px;
  color: var(--text-secondary);
}

.position-picker {
  margin-top: 24px;
  padding: 16px;
  background: rgba(255, 165, 2, 0.1);
  border: 1px solid var(--warning);
  border-radius: 8px;
  transition: all 0.2s ease;
}

.position-picker:hover {
  background: rgba(255, 165, 2, 0.15);
}

.position-picker h4 {
  color: var(--warning);
  margin-bottom: 8px;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
}

.instruction {
  font-size: 13px;
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
}

.btn {
  padding: 12px 20px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s ease;
  min-width: 120px;
  justify-content: center;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none !important;
}

.btn-primary {
  background: var(--primary-color);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: var(--primary-dark);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(255, 68, 68, 0.3);
}

.btn-secondary {
  background: var(--surface-hover);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
}

.btn-secondary:hover:not(:disabled) {
  background: var(--border-color);
}

/* Responsive */
@media (max-width: 768px) {
  .form-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .position-details {
    flex-direction: column;
    gap: 8px;
  }

  .poi-preview {
    flex-direction: column;
    text-align: center;
    gap: 12px;
  }
}

/* ✅ HINZUGEFÜGT: Category-specific Field Styling */
.form-group[data-category] {
  border-left: 3px solid transparent;
  padding-left: 12px;
  margin-left: -15px;
  transition: border-color 0.2s ease;
}

.form-group[data-category='gas_station'] {
  border-left-color: #ff6b35;
}

.form-group[data-category='power_plant'] {
  border-left-color: #ffd43b;
}

.form-group[data-category='windmill'] {
  border-left-color: #74c0fc;
}

.form-group[data-category='oil_pump'] {
  border-left-color: #495057;
}

.form-group[data-category='tanks'] {
  border-left-color: #20c997;
}
</style>
