<!-- src/components/ToggleSwitch.vue -->
<template>
  <div class="toggle-switch">
    <div class="toggle-input" :class="{ checked: modelValue }" @click="toggle"></div>
    <span class="toggle-label">
      <i v-if="icon" :class="icon"></i>
      {{ label }}
    </span>
  </div>
</template>

<script setup>
// 🎭 Props & Emits
const props = defineProps({
  modelValue: { type: Boolean, default: false },
  label: { type: String, required: true },
  icon: { type: String, default: '' },
})

const emit = defineEmits(['update:modelValue'])

// 🎮 Methods
const toggle = () => {
  emit('update:modelValue', !props.modelValue)
}
</script>

<style scoped>
.toggle-switch {
  display: flex;
  align-items: center;
  margin: 12px 0;
  cursor: pointer;
}

.toggle-input {
  width: 48px;
  height: 24px;
  background: var(--border-color);
  border-radius: 12px;
  position: relative;
  margin-right: 12px;
  cursor: pointer;
  transition: background 0.2s ease;
}

.toggle-input::after {
  content: '';
  position: absolute;
  top: 2px;
  left: 2px;
  width: 20px;
  height: 20px;
  background: white;
  border-radius: 50%;
  transition: transform 0.2s ease;
}

.toggle-input.checked {
  background: var(--primary-color);
}

.toggle-input.checked::after {
  transform: translateX(24px);
}

.toggle-label {
  font-size: 14px;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  gap: 8px;
  user-select: none;
}

.toggle-switch:hover .toggle-input {
  box-shadow: 0 0 0 3px rgba(255, 68, 68, 0.1);
}
</style>

<!-- ========================================= -->
