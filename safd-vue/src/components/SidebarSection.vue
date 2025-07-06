<!-- 🔧 FIX 1: src/components/SidebarSection.vue (KORRIGIERT) -->
<template>
  <div class="section" :class="{ expanded: isExpanded }">
    <!-- Section Header -->
    <div class="section-header" @click="toggle">
      <div class="section-title">
        <i :class="icon"></i>
        {{ title }}
      </div>
      <i class="fas fa-chevron-down section-toggle" :class="{ rotated: isExpanded }"></i>
    </div>

    <!-- Section Content -->
    <div class="section-content" ref="content">
      <div class="section-inner">
        <slot></slot>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

// 🎭 Props
const props = defineProps({
  title: {
    type: String,
    required: true,
  },
  icon: {
    type: String,
    default: 'fas fa-folder',
  },
  expanded: {
    type: Boolean,
    default: false,
  },
})

// 📊 Reactive Data
const isExpanded = ref(props.expanded)
const content = ref(null)

// 🎮 Methods - KORRIGIERT: Kein emit needed!
const toggle = () => {
  isExpanded.value = !isExpanded.value
}

// 🎬 Lifecycle
onMounted(() => {
  console.log(`📦 Section "${props.title}" geladen - Expanded: ${isExpanded.value}`)
})
</script>

<style scoped>
.section {
  border-bottom: 1px solid var(--border-color);
  overflow: hidden;
}

.section:last-of-type {
  border-bottom: none;
}

.section-header {
  padding: 16px 20px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
  transition: background 0.2s ease;
}

.section-header:hover {
  background: rgba(255, 255, 255, 0.04);
}

.section-title {
  font-size: 15px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--text-primary);
}

.section-toggle {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  color: var(--text-secondary);
}

.section-toggle.rotated {
  transform: rotate(180deg);
}

.section-content {
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  background: rgba(0, 0, 0, 0.2);
}

.section.expanded .section-content {
  max-height: 1000px;
}

.section-inner {
  padding: 20px;
}
</style>
