<template>
  <div class="pw-wrap">
    <div class="card">
      <div class="brand">
        <span class="brand-icon">⬡</span>
        <h1>設定新密碼</h1>
      </div>
      <p class="notice">此帳號為初始密碼，請設定新密碼後才能使用系統。</p>

      <form @submit.prevent="submit">
        <div class="field">
          <label>目前密碼</label>
          <input
            v-model="currentPwd"
            type="password"
            autocomplete="current-password"
            placeholder="輸入目前密碼"
            :disabled="loading"
          />
        </div>
        <div class="field">
          <label>新密碼</label>
          <input
            v-model="newPwd"
            type="password"
            autocomplete="new-password"
            placeholder="至少 10 碼，含英文字母及數字"
            :disabled="loading"
          />
        </div>
        <div class="field">
          <label>確認新密碼</label>
          <input
            v-model="confirmPwd"
            type="password"
            autocomplete="new-password"
            placeholder="再次輸入新密碼"
            :disabled="loading"
          />
        </div>

        <p v-if="error" class="err">{{ error }}</p>

        <button type="submit" :disabled="loading || !currentPwd || !newPwd || !confirmPwd">
          <span v-if="loading" class="spin">◌</span>
          <span v-else>確認變更</span>
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const auth = useAuthStore()

const currentPwd = ref('')
const newPwd = ref('')
const confirmPwd = ref('')
const loading = ref(false)
const error = ref('')

async function submit() {
  error.value = ''

  if (newPwd.value.length < 10) {
    error.value = '新密碼至少需要 10 個字元'
    return
  }
  if (!/[a-zA-Z]/.test(newPwd.value) || !/[0-9]/.test(newPwd.value)) {
    error.value = '新密碼需同時包含英文字母與數字'
    return
  }
  if (newPwd.value === currentPwd.value) {
    error.value = '新密碼不可與目前密碼相同'
    return
  }
  if (newPwd.value !== confirmPwd.value) {
    error.value = '兩次輸入的密碼不一致'
    return
  }

  loading.value = true
  try {
    await auth.changePassword(currentPwd.value, newPwd.value)
    router.replace('/')
  } catch (e) {
    const code = e.response?.data?.errorCode
    if (code === 'PasswordSameAsOld') error.value = '新密碼不可與目前密碼相同'
    else if (e.response?.status === 401) error.value = '目前密碼錯誤'
    else if (e.response?.status === 400) error.value = e.response?.data?.message || '密碼格式不符規定'
    else error.value = '變更失敗，請稍後再試'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.pw-wrap {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-base);
}

.card {
  width: 400px;
  background: var(--bg-panel);
  border: 1px solid var(--line);
  border-radius: 14px;
  padding: 40px 36px 36px;
}

.brand {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
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

.notice {
  font-size: 13px;
  color: var(--text-secondary);
  margin-bottom: 24px;
  line-height: 1.5;
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
