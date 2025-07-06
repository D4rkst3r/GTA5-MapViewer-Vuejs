<!-- src/components/MarkerForm.vue -->
<template>
  <BaseModal
    v-model="isOpen"
    :title="isEditing ? `Marker bearbeiten: ${marker?.name}` : 'Neuen Marker hinzufügen'"
    icon="fas fa-map-marker-alt"
    size="medium"
    :header-color="selectedCategoryColor"
    @close="cancel"
  >
    <form @submit.prevent="submit" class="marker-form">
      <!-- Preview -->
      <div v-if="formData.category" class="marker-preview">
        <div class="preview-icon" :style="{ backgroundColor: selectedCategoryColor }">
          <i :class="getCategoryIcon(formData.category)"></i>
        </div>
        <div class="preview-info">
          <strong>{{ formData.name || 'Neuer Marker' }}</strong>
          <span>{{ getCategoryName(formData.category) }}</span>
        </div>
      </div>

      <!-- Form Fields -->
      <div class="form-grid">
        <div class="form-group full-width">
          <label for="marker-name">Name *</label>
          <input
            id="marker-name"
            v-model="formData.name"
            type="text"
            class="form-input"
            placeholder="z.B. Hauptroute Nord oder Sammelplatz A"
            required
          />
        </div>

        <div class="form-group">
          <label for="marker-category">Kategorie *</label>
          <select
            id="marker-category"
            v-model="formData.category"
            class="form-input"
            required
            @change="onCategoryChange"
          >
            <option value="">– Kategorie wählen –</option>
            <option v-for="(categoryData, key) in markerCategories" :key="key" :value="key">
              {{ categoryData.name }}
            </option>
          </select>
        </div>

        <div class="form-group">
          <label for="marker-priority">Priorität</label>
          <select id="marker-priority" v-model="formData.priority" class="form-input">
            <option value="low">Niedrig</option>
            <option value="normal">Normal</option>
            <option value="high">Hoch</option>
            <option value="critical">Kritisch</option>
          </select>
        </div>

        <div class="form-group full-width">
          <label for="marker-description">Beschreibung</label>
          <textarea
            id="marker-description"
            v-model="formData.description"
            class="form-input"
            rows="4"
            placeholder="Zusätzliche Informationen, Nutzungshinweise, Kontaktdaten..."
          ></textarea>
        </div>

        <!-- Kategorie-spezifische Felder -->
        <div v-if="formData.category === 'route'" class="form-group">
          <label for="route-type">Anfahrtstyp</label>
          <select id="route-type" v-model="formData.routeType" class="form-input">
            <option value="primary">Hauptanfahrt</option>
            <option value="secondary">Nebenroute</option>
            <option value="emergency">Notfallroute</option>
            <option value="evacuation">Evakuierungsweg</option>
          </select>
        </div>

        <div v-if="formData.category === 'assembly'" class="form-group">
          <label for="capacity">Max. Kapazität</label>
          <input
            id="capacity"
            v-model="formData.capacity"
            type="number"
            class="form-input"
            placeholder="z.B. 100"
          />
        </div>

        <div v-if="formData.category === 'warning'" class="form-group">
          <label for="warning-type">Warnungstyp</label>
          <select id="warning-type" v-model="formData.warningType" class="form-input">
            <option value="danger">Gefahr</option>
            <option value="restricted">Sperrbereich</option>
            <option value="hazmat">Gefahrstoff</option>
            <option value="radiation">Strahlung</option>
          </select>
        </div>

        <div v-if="formData.category === 'star'" class="form-group">
          <label for="star-type">Markierungstyp</label>
          <select id="star-type" v-model="formData.starType" class="form-input">
            <option value="poi">Wichtiger Ort</option>
            <option value="landmark">Orientierungspunkt</option>
            <option value="meeting">Treffpunkt</option>
            <option value="staging">Bereitstellungsraum</option>
          </select>
        </div>
      </div>

      <!-- Position Info -->
      <div v-if="isEditing && marker" class="position-info">
        <h4><i class="fas fa-crosshairs"></i> Position</h4>
        <div class="position-details">
          <span><strong>Longitude:</strong> {{ marker.lng?.toFixed(6) }}</span>
          <span><strong>Latitude:</strong> {{ marker.lat?.toFixed(6) }}</span>
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
      <button type="submit" @click="submit" class="btn btn-primary">
        <i class="fas fa-save"></i>
        {{ isEditing ? 'Aktualisieren' : 'Erstellen' }}
      </button>
    </template>
  </BaseModal>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import BaseModal from './BaseModal.vue'

// 🎭 Props & Emits
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  marker: {
    type: Object,
    default: null,
  },
})

const emit = defineEmits(['update:modelValue', 'marker-saved'])

// 📊 Reactive Data
const isOpen = ref(false)
const formData = ref({
  name: '',
  category: '',
  description: '',
  priority: 'normal',
  routeType: '',
  capacity: '',
  warningType: '',
  starType: '',
})

// 📍 Marker Categories
const markerCategories = {
  route: {
    name: 'Anfahrtsweg',
    color: '#4287f5',
    icon: 'fas fa-route',
  },
  assembly: {
    name: 'Sammelplatz',
    color: '#ff8800',
    icon: 'fas fa-users',
  },
  warning: {
    name: 'Warnung',
    color: '#ff4757',
    icon: 'fas fa-exclamation-triangle',
  },
  star: {
    name: 'Markierung',
    color: '#9d4edd',
    icon: 'fas fa-star',
  },
  staging: {
    name: 'Bereitstellung',
    color: '#2ed573',
    icon: 'fas fa-truck',
  },
  command: {
    name: 'Führungsstelle',
    color: '#ff6b35',
    icon: 'fas fa-flag',
  },
}

// 🧮 Computed
const isEditing = computed(() => !!props.marker)

const selectedCategoryColor = computed(() => {
  return markerCategories[formData.value.category]?.color || 'var(--accent-blue)'
})

// 👀 Watchers
watch(
  () => props.modelValue,
  (value) => {
    isOpen.value = value
    if (value && props.marker) {
      // Edit Mode: Form mit Marker-Daten füllen
      formData.value = {
        name: props.marker.name || '',
        category: props.marker.category || '',
        description: props.marker.description || '',
        priority: props.marker.priority || 'normal',
        routeType: props.marker.routeType || '',
        capacity: props.marker.capacity || '',
        warningType: props.marker.warningType || '',
        starType: props.marker.starType || '',
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
    routeType: '',
    capacity: '',
    warningType: '',
    starType: '',
  }
}

const getCategoryName = (category) => {
  return markerCategories[category]?.name || category
}

const getCategoryIcon = (category) => {
  return markerCategories[category]?.icon || 'fas fa-map-marker-alt'
}

const onCategoryChange = () => {
  // Kategorie-spezifische Standardwerte setzen
  if (formData.value.category === 'route' && !formData.value.routeType) {
    formData.value.routeType = 'primary'
  }
  if (formData.value.category === 'warning' && !formData.value.warningType) {
    formData.value.warningType = 'danger'
  }
  if (formData.value.category === 'star' && !formData.value.starType) {
    formData.value.starType = 'poi'
  }
}

const submit = () => {
  if (!formData.value.name.trim()) {
    window.showToast?.('Bitte gib einen Namen ein', 'warning')
    return
  }

  if (!formData.value.category) {
    window.showToast?.('Bitte wähle eine Kategorie', 'warning')
    return
  }

  const markerData = {
    ...formData.value,
    isEditing: isEditing.value,
  }

  if (isEditing.value) {
    markerData.id = props.marker.id
    window.showToast?.(`Marker "${formData.value.name}" aktualisiert`, 'success')
  } else {
    window.showToast?.('Klicke auf die Karte um die Position festzulegen', 'info', 4000)
  }

  emit('marker-saved', markerData)
  close()
}

const cancel = () => {
  close()
}

const close = () => {
  isOpen.value = false
  resetForm()
}
</script>

<style scoped>
.marker-form {
  min-height: 500px;
}

.marker-preview {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  margin-bottom: 24px;
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
}

.preview-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.preview-info strong {
  color: var(--text-primary);
  font-size: 16px;
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
}

.form-input {
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  color: var(--text-primary);
  font-size: 14px;
  transition: all 0.2s ease;
}

.form-input:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(255, 68, 68, 0.1);
}

.position-info {
  background: rgba(255, 255, 255, 0.05);
  padding: 16px;
  border-radius: 8px;
  margin-top: 24px;
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
  background: rgba(157, 78, 221, 0.1);
  border: 1px solid var(--accent-purple);
  border-radius: 8px;
}

.position-picker h4 {
  color: var(--accent-purple);
  margin-bottom: 8px;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 8px;
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
}

.btn-primary {
  background: var(--primary-color);
  color: white;
}

.btn-primary:hover {
  background: var(--primary-dark);
  transform: translateY(-1px);
}

.btn-secondary {
  background: var(--surface-hover);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
}

.btn-secondary:hover {
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

  .marker-preview {
    flex-direction: column;
    text-align: center;
    gap: 12px;
  }
}
</style>
