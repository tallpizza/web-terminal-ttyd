<template>
  <v-app>
    <v-app-bar v-if="!isSessionView" elevation="1">
      <v-app-bar-title>
        <router-link to="/" class="logo">
          <v-icon color="primary">mdi-lightning-bolt</v-icon>
          <span class="logo-text">Web Terminal</span>
        </router-link>
      </v-app-bar-title>
      
      <v-spacer></v-spacer>
      
      <v-btn variant="text" to="/sessions">Sessions</v-btn>
      <v-btn variant="text" to="/keyboard">Keyboard</v-btn>
      <v-btn variant="text" to="/settings">Settings</v-btn>
      
      <v-btn icon @click="toggleTheme">
        <v-icon>{{ theme.global.current.value.dark ? 'mdi-weather-sunny' : 'mdi-weather-night' }}</v-icon>
      </v-btn>
    </v-app-bar>
    
    <v-main>
      <router-view />
    </v-main>
  </v-app>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useTheme } from 'vuetify'

const route = useRoute()
const theme = useTheme()

const isSessionView = computed(() => {
  return route.name === 'session'
})

function toggleTheme() {
  theme.global.name.value = theme.global.current.value.dark ? 'light' : 'dark'
}
</script>

<style>
.logo {
  display: flex;
  align-items: center;
  text-decoration: none;
  color: inherit;
  gap: 0.5rem;
}

.logo-text {
  font-weight: 600;
  margin-left: 0.5rem;
}

@media (max-width: 768px) {
  .logo-text {
    display: none;
  }
}
</style>