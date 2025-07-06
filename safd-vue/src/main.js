// src/main.js
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'

// 🎨 Styles
import './assets/style.css' // Deine bestehende CSS
import 'maplibre-gl/dist/maplibre-gl.css' // MapLibre Styles

// 🔥 Font Awesome (Icons)
import '@fortawesome/fontawesome-free/css/all.css'

// 🏪 State Management
const pinia = createPinia()

// 🚀 App erstellen
const app = createApp(App)

// 🔌 Plugins
app.use(pinia)

// 🎬 App mounten
app.mount('#app')

console.log('🔥 SAFD Command Center Vue.js App gestartet!')
console.log('Version: Vue 3 + Pinia + MapLibre GL')
