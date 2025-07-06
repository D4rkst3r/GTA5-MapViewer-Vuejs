<!-- src/components/LoadingScreen.vue -->
<template>
  <div class="loading-screen">
    <div class="loading-content">
      <!-- 🔥 SAFD Logo/Icon -->
      <div class="loading-icon">
        <i class="fas fa-fire-flame-curved"></i>
      </div>

      <!-- 📝 Title -->
      <h1 class="loading-title">SAFD Command Center</h1>
      <p class="loading-subtitle">Hydranten Management System</p>

      <!-- 🌀 Spinner -->
      <div class="spinner-container">
        <div class="spinner"></div>
        <p class="loading-text">{{ loadingText }}</p>
      </div>

      <!-- 📊 Progress -->
      <div class="progress-bar">
        <div class="progress-fill" :style="{ width: progress + '%' }"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

// 📊 Reactive Data
const progress = ref(0)
const loadingText = ref('Initialisiere...')

// 📝 Loading Steps
const loadingSteps = [
  { text: 'Initialisiere...', duration: 300 },
  { text: 'Lade Karten-System...', duration: 500 },
  { text: 'Verbinde zu Server...', duration: 400 },
  { text: 'Lade Hydranten-Daten...', duration: 600 },
  { text: 'Initialisiere Zeichentools...', duration: 400 },
  { text: 'Fertig!', duration: 200 },
]

// 🎬 Simulate Loading Progress
const simulateLoading = async () => {
  let currentProgress = 0
  const stepProgress = 100 / loadingSteps.length

  for (let i = 0; i < loadingSteps.length; i++) {
    const step = loadingSteps[i]
    loadingText.value = step.text

    // Smooth progress animation
    const targetProgress = (i + 1) * stepProgress
    while (currentProgress < targetProgress) {
      currentProgress += 2
      progress.value = Math.min(currentProgress, targetProgress)
      await new Promise((resolve) => setTimeout(resolve, 20))
    }

    // Wait for step duration
    await new Promise((resolve) => setTimeout(resolve, step.duration))
  }
}

// 🎬 Lifecycle
onMounted(() => {
  simulateLoading()
})
</script>

<style scoped>
.loading-screen {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: linear-gradient(135deg, var(--background-darker) 0%, var(--background-dark) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.loading-content {
  text-align: center;
  max-width: 400px;
  padding: 40px;
}

.loading-icon {
  font-size: 64px;
  color: var(--primary-color);
  margin-bottom: 24px;
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%,
  100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.8;
  }
}

.loading-title {
  font-size: 32px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 8px;
  letter-spacing: -0.5px;
}

.loading-subtitle {
  font-size: 16px;
  color: var(--text-secondary);
  margin-bottom: 40px;
  font-weight: 400;
}

.spinner-container {
  margin-bottom: 30px;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid var(--border-color);
  border-top: 4px solid var(--primary-color);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 16px;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.loading-text {
  font-size: 14px;
  color: var(--text-secondary);
  font-weight: 500;
}

.progress-bar {
  width: 100%;
  height: 4px;
  background: var(--border-color);
  border-radius: 2px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--primary-color), var(--accent-blue));
  border-radius: 2px;
  transition: width 0.3s ease;
}

/* 📱 Responsive */
@media (max-width: 768px) {
  .loading-content {
    padding: 20px;
    max-width: 300px;
  }

  .loading-title {
    font-size: 24px;
  }

  .loading-icon {
    font-size: 48px;
  }
}
</style>
