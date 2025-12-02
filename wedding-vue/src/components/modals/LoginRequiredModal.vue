<script setup lang="ts">
const emit = defineEmits<{
  cancel: []
  login: []
}>()
</script>

<template>
  <div class="modal-overlay" @click.self="emit('cancel')">
    <div class="modal-card">
      <div class="icon">🔒</div>
      <h3>로그인이 필요합니다</h3>
      <p>
        이 기능을 사용하려면 로그인이 필요합니다.
        <br />
        지금 로그인하시겠습니까?
      </p>
      <div class="actions">
        <button class="btn" type="button" @click="emit('cancel')">나중에</button>
        <button class="btn primary" type="button" @click="emit('login')">로그인하기</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.65);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 110;
  padding: 20px;
}

.modal-card {
  width: min(360px, 100%);
  background: var(--card);
  border-radius: 20px;
  padding: 28px 24px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  text-align: center;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.45);
}

.icon {
  font-size: 32px;
  margin-bottom: 12px;
}

h3 {
  margin: 0;
  font-size: 20px;
}

p {
  margin: 12px 0 24px;
  color: var(--muted);
  line-height: 1.6;
}

.actions {
  display: flex;
  gap: 12px;
}

.btn {
  flex: 1;
}
</style>



