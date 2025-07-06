// 🔧 FIX 2: src/services/mockApi.js - Erstelle diese neue Datei
// Mock-API für Development (ersetzt PHP temporär)

// 🗂️ Mock Data
const mockData = {
  hydrants: [
    {
      id: 1,
      lng: -11.8984,
      lat: -65.3817,
      area: 'Downtown',
      type: 'unterflur',
      status: 'ok',
      lastService: '2024-01-15',
      nextService: '2024-07-15',
    },
    {
      id: 2,
      lng: -6.9951,
      lat: -54.5798,
      area: 'Vinewood',
      type: 'oberflur',
      status: 'wartung',
      lastService: '2024-02-01',
      nextService: '2024-08-01',
    },
    {
      id: 3,
      lng: -46.6828,
      lat: -70.5564,
      area: 'Vespucci',
      type: 'wandhydrant',
      status: 'defekt',
      lastService: '2023-12-10',
      nextService: '2024-06-10',
    },
    {
      id: 4,
      lng: 20.76961,
      lat: -73.5976,
      area: 'East Los Santos',
      type: 'unterflur',
      status: 'ok',
      lastService: '2024-03-01',
      nextService: '2024-09-01',
    },
    {
      id: 5,
      lng: -51.4982,
      lat: -79.6361,
      area: 'LS Airport',
      type: 'oberflur',
      status: 'ok',
      lastService: '2024-01-20',
      nextService: '2024-07-20',
    },
  ],

  markers: [
    {
      id: 1,
      lng: -30.5178,
      lat: -75.5216,
      name: 'Hauptroute Nord',
      category: 'route',
      description: 'Hauptanfahrtsweg für nördliche Stadtteile',
      icon: 'route',
    },
    {
      id: 2,
      lng: -12.576,
      lat: -79.3652,
      name: 'Sammelplatz Hafen',
      category: 'assembly',
      description: 'Hauptsammelplatz im Hafenbereich',
      icon: 'assembly',
    },
  ],

  // ✅ POI-Daten hinzufügen:
  pois: [
    {
      id: 1,
      lng: 1.2,
      lat: 0.8,
      name: 'Shell Tankstelle Downtown',
      category: 'gas_station',
      description: '24h Tankstelle mit Notfallversorgung',
      priority: 'normal',
      openingHours: '24/7',
      fuelTypes: 'Benzin, Diesel, LPG',
    },
    {
      id: 2,
      lng: -1.1,
      lat: 1.2,
      name: 'Windpark South LS',
      category: 'windmill',
      description: 'Großer Windpark mit Wartungszugang',
      priority: 'high',
      capacity: 2.5,
    },
    {
      id: 3,
      lng: 0.8,
      lat: -0.9,
      name: 'Umspannwerk Central',
      category: 'power_plant',
      description: 'Hauptumspannwerk der Stadt',
      priority: 'critical',
      voltage: 110,
    },
  ],

  drawings: {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [
            [
              [-20, -60],
              [-10, -60],
              [-10, -50],
              [-20, -50],
              [-20, -60],
            ],
          ],
        },
        properties: {
          name: 'Sperrgebiet Downtown',
        },
      },
    ],
  },

  settings: {
    autoSaveEnabled: true,
    isAdmin: false,
  },
}

// 💾 Local Storage Key
const STORAGE_KEY = 'safd_mock_data'

// 🔄 Initialize Mock Data
const initializeMockData = () => {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (!stored) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(mockData))
    console.log('📦 Mock-Daten initialisiert')
  }
}

// 📡 Mock API Functions
export const mockApi = {
  // 📥 Load Data
  async load(type) {
    await new Promise((resolve) => setTimeout(resolve, 200)) // Simulate network delay

    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')

    return {
      success: true,
      data: data[type] || (type === 'drawings' ? { type: 'FeatureCollection', features: [] } : []),
      timestamp: Date.now(),
    }
  },

  // 💾 Save Data
  async save(type, newData) {
    await new Promise((resolve) => setTimeout(resolve, 100)) // Simulate network delay

    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
    data[type] = newData
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))

    const count = Array.isArray(newData)
      ? newData.length
      : newData.features
        ? newData.features.length
        : 0

    console.log(`💾 Mock API: ${type} gespeichert (${count} items)`)

    return {
      success: true,
      message: `${type} erfolgreich gespeichert`,
      timestamp: Date.now(),
      count: count,
    }
  },

  // 📊 Get Stats
  async getStats() {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')

    const stats = {}
    Object.keys(mockData).forEach((type) => {
      const items = data[type] || []
      stats[type] = {
        count: Array.isArray(items) ? items.length : items.features ? items.features.length : 0,
        last_modified: new Date().toISOString(),
        size: JSON.stringify(items).length,
      }
    })

    return {
      success: true,
      stats: stats,
    }
  },
}

// 🚀 Auto-Initialize
initializeMockData()

console.log('🔧 Mock API Service geladen - Development Mode aktiv')

// 🎯 Usage Example:
// import { mockApi } from '@/services/mockApi'
// const result = await mockApi.load('hydrants')
