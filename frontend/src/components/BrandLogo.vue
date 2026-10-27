<template>
  <span class="brand-logo" role="img" aria-label="HelmsKB">
    <svg class="brand-logo__mark" viewBox="0 0 96 128" aria-hidden="true" focusable="false">
      <path d="M0 14 26 0v81l29 17-30 16L0 100Z" fill="currentColor" />
      <path d="m41 36 32-19 21 12v85l-27 14V52Z" fill="currentColor" />
      <path d="m32 39 28 16v36L32 75Z" fill="var(--brand-logo-accent, #2563eb)" />
    </svg>
    <span class="brand-logo__copy">
      <span class="brand-logo__wordmark">Helms<span class="brand-logo__accent">KB</span></span>
      <span v-if="props.tagline" class="brand-logo__tagline">Enterprise Knowledge Base</span>
    </span>
  </span>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{ tagline?: boolean }>(), { tagline: false })
</script>

<style scoped>
.brand-logo {
  display: inline-flex;
  align-items: center;
  gap: 0.34em;
  width: max-content;
  max-width: 100%;
  color: var(--brand-logo-color, #0f172a);
  font-family: Inter, "Segoe UI", Arial, sans-serif;
  font-size: var(--brand-logo-font-size, 22px);
  line-height: 1;
  vertical-align: middle;
  white-space: nowrap;
}

.brand-logo__mark {
  display: block;
  width: 1.0875em;
  height: 1.45em;
  flex: 0 0 auto;
}

.brand-logo__copy {
  display: flex;
  flex-direction: column;
  gap: 0.19em;
}

.brand-logo__wordmark {
  font-weight: 800;
  letter-spacing: -0.055em;
}

.brand-logo__accent {
  color: var(--brand-logo-accent, #2563eb);
}

.brand-logo__tagline {
  color: var(--brand-logo-tagline-color, var(--brand-logo-color, #0f172a));
  font-size: 0.28em;
  font-weight: 400;
  letter-spacing: 0.15em;
  line-height: 1.3;
}

@media (max-width: 480px) {
  .brand-logo__tagline {
    display: none;
  }
}
</style>
