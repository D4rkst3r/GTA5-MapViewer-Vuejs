<!-- src/components/HydrantForm.vue -->
<template>
  <BaseModal
    v-model="isOpen"
    :title="isEditing ? `Hydrant #${hydrant?.id} bearbeiten` : 'Neuen Hydranten hinzufügen'"
    icon="fas fa-fire-hydrant"
    size="medium"
    :header-color="'var(--primary-color)'"
    @close="cancel"
  >
    <form @submit.prevent="submit" class="hydrant-form">
      <!-- Position Info (nur bei Edit) -->
      <div v-if="isEditing && hydrant" class="position-info">
        <h4><i class="fas fa-map-marker-alt"></i> Position</h4>
        <div class="position-details">
          <span><strong>Longitude:</strong> {{ hydrant.lng?.toFixed(6) }}</span>
          <span><strong>Latitude:</strong> {{ hydrant.lat?.toFixed(6) }}</span>
        </div>
      </div>

      <!-- Form Fields -->
      <div class="form-grid">
        <div class="form-group">
          <label for="hydrant-area">Gebiet *</label>
          <select id="hydrant-area" v-model="formData.area" class="form-input" required>
            <option value="">– Gebiet wählen –</option>
            <option v-for="district in districts" :key="district" :value="district">
              {{ district }}
            </option>
          </select>
        </div>

        <div class="form-group">
          <label for="hydrant-type">Typ *</label>
          <select id="hydrant-type" v-model="formData.type" class="form-input" required>
            <option value="unterflur">Unterflur</option>
            <option value="oberflur">Oberflur</option>
            <option value="wandhydrant">Wandhydrant</option>
          </select>
        </div>

        <div class="form-group">
          <label for="hydrant-status">Status *</label>
          <select id="hydrant-status" v-model="formData.status" class="form-input" required>
            <option value="ok">OK</option>
            <option value="wartung">Wartung</option>
            <option value="defekt">Defekt</option>
          </select>
        </div>

        <div class="form-group">
          <label for="last-service">Letzter Service</label>
          <input id="last-service" v-model="formData.lastService" type="date" class="form-input" />
        </div>

        <div class="form-group">
          <label for="next-service">Nächster Service</label>
          <input id="next-service" v-model="formData.nextService" type="date" class="form-input" />
        </div>

        <div class="form-group full-width">
          <label for="hydrant-notes">Notizen</label>
          <textarea
            id="hydrant-notes"
            v-model="formData.notes"
            class="form-input"
            rows="3"
            placeholder="Zusätzliche Notizen oder Bemerkungen..."
          ></textarea>
        </div>
      </div>

      <!-- Position Picker (nur bei Neuerststellung) -->
      <div v-if="!isEditing" class="position-picker">
        <h4><i class="fas fa-crosshairs"></i> Position festlegen</h4>
        <p class="instruction">
          <i class="fas fa-info-circle"></i>
          Klicke nach dem Speichern auf die Karte, um die Position festzulegen.
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
import { useHydrantsStore } from '@/stores/hydrants'
import BaseModal from './BaseModal.vue'
import { useUIStore } from '@/stores/ui'

const uiStore = useUIStore()

// 🎭 Props & Emits
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  hydrant: {
    type: Object,
    default: null,
  },
})

const emit = defineEmits(['update:modelValue', 'hydrant-saved'])

// 🏪 Store
const hydrantsStore = useHydrantsStore()

// 📊 Reactive Data
const isOpen = ref(false)
const formData = ref({
  area: '',
  type: 'unterflur',
  status: 'ok',
  lastService: '',
  nextService: '',
  notes: '',
})

// 🧮 Computed
const isEditing = computed(() => !!props.hydrant)

const districts = computed(() => {
  // Alle verfügbaren Gebiete aus den Hydranten + Standard-Gebiete
  const hydrantAreas = hydrantsStore.hydrants.map((h) => h.area).filter(Boolean)
  const standardAreas = [
    'Downtown',
    'Vinewood',
    'Vespucci',
    'East Los Santos',
    'LS Airport',
    'La Puerta',
    'Rockford Hills',
    'South Los Santos',
    'Little Seoul',
  ]
  const allAreas = [...new Set([...standardAreas, ...hydrantAreas])]
  return allAreas.sort()
})

// 👀 Watchers
watch(
  () => props.modelValue,
  (value) => {
    isOpen.value = value
    if (value && props.hydrant) {
      // Edit Mode: Form mit Hydrant-Daten füllen
      formData.value = {
        area: props.hydrant.area || '',
        type: props.hydrant.type || 'unterflur',
        status: props.hydrant.status || 'ok',
        lastService: props.hydrant.lastService || '',
        nextService: props.hydrant.nextService || '',
        notes: props.hydrant.notes || '',
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
    area: '',
    type: 'unterflur',
    status: 'ok',
    lastService: '',
    nextService: '',
    notes: '',
  }
}

const submit = () => {
  if (!formData.value.area) {
    window.showToast?.('Bitte wähle ein Gebiet aus', 'warning')
    return
  }

  if (isEditing.value) {
    hydrantsStore.updateHydrant(props.hydrant.id, formData.value)
    window.showToast?.(`Hydrant #${props.hydrant.id} aktualisiert`, 'success')
    close()
  } else {
    // KORRIGIERT: UI Store verwenden
    uiStore.startHydrantPicking(formData.value)
    window.showToast?.('Klicke jetzt auf die Karte um die Position festzulegen', 'info', 4000)
    close()
  }

  emit('hydrant-saved', { ...formData.value, isEditing: isEditing.value })
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
.hydrant-form {
  min-height: 400px;
}

.position-info {
  background: rgba(255, 255, 255, 0.05);
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 24px;
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

.position-picker {
  margin-top: 24px;
  padding: 16px;
  background: rgba(255, 165, 2, 0.1);
  border: 1px solid var(--warning);
  border-radius: 8px;
}

.position-picker h4 {
  color: var(--warning);
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
}
</style>
