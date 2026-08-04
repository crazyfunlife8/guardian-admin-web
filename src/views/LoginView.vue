<template>
  <div class="login-wrap">
    <div class="card">
      <div class="brand">
        <span class="brand-icon">⬡</span>
        <h1>守護者後台</h1>
      </div>

      <form @submit.prevent="submit">
        <div class="field">
          <label>帳號</label>
          <input
            v-model="username"
            type="text"
            autocomplete="username"
            placeholder="username"
            :disabled="loading"
          />
        </div>
        <div class="field">
          <label>密碼</label>
          <input
            v-model="password"
            type="password"
            autocomplete="current-password"
            placeholder="••••••••••"
            :disabled="loading"
          />
        </div>

        <p v-if="error" class="err">{{ error }}</p>

        <button type="submit" :disabled="loading || !username || !password">
          <span v-if="loading" class="spin">◌</span>
          <span v-else>登入</span>
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router   = useRouter()
const auth     = useAuthStore()
const username = ref('')
const password = ref('')
const loading  = ref(false)
const error    = ref('')

async function submit() {
  error.value   = ''
  loading.value = true
  try {
    await auth.login(username.value, password.value)
    router.replace('/')
  } catch (e) {
    const code = e.response?.data?.errorCode
    error.value = code === 'BackendLoginFail' ? '帳號或密碼錯誤' : '登入失敗，請稍後再試'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-wrap {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-base);
}

.card {
  width: 360px;
  background: var(--bg-panel);
  border: 1px solid var(--line);
  border-radius: 14px;
  padding: 40px 36px 36px;
}

.brand {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 32px;
}
.brand-icon {
  font-size: 28px;
  color: var(--accent);
  line-height: 1;
}
.brand h1 {
  font-size: 20px;
  font-weight: 600;
  color: var(--text-primary);
}

form { display: flex; flex-direction: column; gap: 20px; }

.field { display: flex; flex-direction: column; gap: 6px; }
.field label {
  font-size: 13px;
  color: var(--text-secondary);
  font-weight: 500;
}
.field input {
  background: var(--bg-base);
  border: 1px solid var(--line);
  border-radius: 8px;
  padding: 10px 14px;
  font-size: 15px;
  font-family: var(--sans);
  color: var(--text-primary);
  outline: none;
  transition: border-color .15s;
}
.field input:focus { border-color: var(--accent); }
.field input:disabled { opacity: .5; cursor: not-allowed; }
.field input::placeholder { color: var(--mask); }

.err {
  font-size: 13px;
  color: var(--danger);
  margin-top: -8px;
}

button[type="submit"] {
  background: var(--accent);
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 11px;
  font-size: 15px;
  font-weight: 600;
  font-family: var(--sans);
  cursor: pointer;
  transition: opacity .15s;
  margin-top: 4px;
}
button[type="submit"]:disabled { opacity: .45; cursor: not-allowed; }
button[type="submit"]:not(:disabled):hover { opacity: .85; }

.spin {
  display: inline-block;
  animation: spin .8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
</style>
