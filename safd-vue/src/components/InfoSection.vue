<!-- src/components/InfoSection.vue -->
<template>
  <div class="info-section">
    <h4 class="section-title">
      <i v-if="icon" :class="icon"></i>
      {{ title }}
    </h4>
    <div class="section-content">
      <slot></slot>
    </div>
  </div>
</template>

<script setup>
defineProps({
  title: {
    type: String,
    required: true,
  },
  icon: {
    type: String,
    default: '',
  },
})
</script>

<!-- src/components/InfoSection.vue - CSS FIX -->
<style scoped>
.info-section {
  background: rgba(255, 255, 255, 0.05);
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 15px;
}

.section-title {
  margin-bottom: 10px !important;
  font-size: 14px !important;
  font-weight: 600 !important;
  color: var(--text-primary) !important;
  display: flex !important;
  align-items: center !important;
  gap: 8px !important;
}

.section-content {
  font-size: 14px !important; /* ← War 13px */
  line-height: 1.6 !important;
  display: block !important; /* ← NEU */
  visibility: visible !important; /* ← NEU */
}
</style>
