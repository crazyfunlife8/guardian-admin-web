import { createRouter, createWebHashHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const routes = [
  { path: '/login', component: () => import('../views/LoginView.vue'), meta: { public: true } },
  { path: '/',      redirect: '/op1' },
  { path: '/op1',                 component: () => import('../views/OP1Monitor.vue') },
  { path: '/op2/:eventId',        component: () => import('../views/OP2EventDetail.vue') },
  { path: '/op3',                 component: () => import('../views/OP3QualReview.vue') },
  { path: '/op4',                 component: () => import('../views/OP4InformantFile.vue') },
  { path: '/op4/:informantId',    component: () => import('../views/OP4InformantFile.vue') },
  { path: '/op5',                 component: () => import('../views/OP5Appeals.vue') },
  { path: '/op6',                 component: () => import('../views/OP6SystemParams.vue') },
  { path: '/op7',                 component: () => import('../views/OP7AbuseMonitor.vue') },
  { path: '/op8',                 component: () => import('../views/OP8Redemption.vue') },
  { path: '/op9',                 component: () => import('../views/OP9Ledger.vue') },
  { path: '/op10',                component: () => import('../views/OP10StaticData.vue') },
  { path: '/op11',                component: () => import('../views/OP11Reports.vue') },
  { path: '/op12',                component: () => import('../views/OP12Accounts.vue') },
  { path: '/op13',                component: () => import('../views/OP13Tickets.vue') },
]

const router = createRouter({ history: createWebHashHistory(), routes })

router.beforeEach((to) => {
  const auth = useAuthStore()
  if (to.meta.public) {
    if (auth.isLoggedIn) return '/'
    return true
  }
  // TODO: 上線前重新啟用
  // if (!auth.isLoggedIn) return '/login'
  return true
})

export default router
