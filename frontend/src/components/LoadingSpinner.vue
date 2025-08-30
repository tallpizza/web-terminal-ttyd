<template>
  <div class="loading-spinner" v-if="visible">
    <v-overlay
      :model-value="overlay"
      class="align-center justify-center"
      :persistent="persistent"
      :scrim="scrim"
    >
      <div class="spinner-container">
        <v-progress-circular
          :size="size"
          :width="width"
          :color="color"
          :indeterminate="indeterminate"
          :model-value="progress"
        >
          <template v-if="showPercentage && !indeterminate">
            {{ Math.round(progress) }}%
          </template>
        </v-progress-circular>
        
        <div v-if="text" class="loading-text mt-4">
          {{ text }}
        </div>
        
        <div v-if="subtext" class="loading-subtext mt-2">
          {{ subtext }}
        </div>
        
        <v-btn
          v-if="cancellable"
          variant="text"
          color="error"
          class="mt-4"
          @click="$emit('cancel')"
        >
          Cancel
        </v-btn>
      </div>
    </v-overlay>
  </div>
  
  <!-- Inline spinner variant -->
  <div v-else-if="inline && visible" class="inline-spinner">
    <v-progress-circular
      :size="size"
      :width="width"
      :color="color"
      :indeterminate="indeterminate"
      :model-value="progress"
    />
    <span v-if="text" class="ml-3">{{ text }}</span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  visible?: boolean
  overlay?: boolean
  inline?: boolean
  size?: number | string
  width?: number | string
  color?: string
  text?: string
  subtext?: string
  progress?: number
  indeterminate?: boolean
  showPercentage?: boolean
  cancellable?: boolean
  persistent?: boolean
  scrim?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  visible: true,
  overlay: true,
  inline: false,
  size: 64,
  width: 7,
  color: 'primary',
  progress: 0,
  indeterminate: true,
  showPercentage: false,
  cancellable: false,
  persistent: false,
  scrim: true
})

const emit = defineEmits(['cancel'])
</script>

<style scoped>
.loading-spinner {
  z-index: 9999;
}

.spinner-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2rem;
  background: var(--v-theme-surface);
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.loading-text {
  font-size: 1rem;
  color: var(--v-theme-on-surface);
  text-align: center;
  max-width: 300px;
}

.loading-subtext {
  font-size: 0.875rem;
  color: var(--v-theme-on-surface);
  opacity: 0.7;
  text-align: center;
  max-width: 300px;
}

.inline-spinner {
  display: inline-flex;
  align-items: center;
}

/* Animation for smooth appearance */
.loading-spinner,
.inline-spinner {
  animation: fadeIn 0.3s ease-in-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
</style>