<script setup lang="ts">
const currentYear = new Date().getFullYear()
const appVersion = import.meta.env.VITE_APP_VERSION ?? '1.0.0'
</script>

<template>
  <footer class="footer">
    <div class="container">
      <div class="footer-meta">
        <span>© {{ currentYear }} AI Wedding Planner OS</span>
        <span class="dot" aria-hidden="true">•</span>
        <span>Version {{ appVersion }}</span>
      </div>
      <div class="footer-links">
        <a href="mailto:support@wedding-os.com" aria-label="문의 메일">
          문의: support@wedding-os.com
        </a>
        <span class="dot" aria-hidden="true">•</span>
        <span>Made with ❤️ for couples</span>
      </div>
    </div>
  </footer>
</template>

<style scoped>
.footer {
  margin-top: 60px;
  padding: 32px 0 40px;
  border-top: 1px solid rgba(var(--text-rgb, 232, 236, 243), 0.08);
  background: linear-gradient(
    180deg,
    rgba(var(--text-rgb, 232, 236, 243), 0.04) 0%,
    rgba(0, 0, 0, 0) 100%
  );
}

.container {
  display: flex;
  flex-direction: column;
  gap: 8px;
  text-align: center;
  font-size: 14px;
  color: var(--muted);
}

.footer-meta,
.footer-links {
  display: inline-flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.footer-links a {
  color: var(--text);
  text-decoration: none;
  transition: color 0.2s ease;
}

.footer-links a:hover {
  color: var(--accent);
}

.dot {
  opacity: 0.45;
}

@media (max-width: 640px) {
  .footer {
    padding: 28px 16px 36px;
  }

  .container {
    font-size: 13px;
  }
}
</style>

