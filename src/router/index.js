import { createRouter, createWebHashHistory } from 'vue-router'
import OP1Monitor        from '../views/OP1Monitor.vue'
import OP2EventDetail    from '../views/OP2EventDetail.vue'
import OP3QualReview     from '../views/OP3QualReview.vue'
import OP4InformantFile  from '../views/OP4InformantFile.vue'
import OP5Appeals        from '../views/OP5Appeals.vue'
import OP6SystemParams   from '../views/OP6SystemParams.vue'
import OP7AbuseMonitor   from '../views/OP7AbuseMonitor.vue'
import OP8Redemption     from '../views/OP8Redemption.vue'
import OP9Ledger         from '../views/OP9Ledger.vue'
import OP10StaticData    from '../views/OP10StaticData.vue'
import OP11Reports       from '../views/OP11Reports.vue'
import OP12Accounts     from '../views/OP12Accounts.vue'
import OP13Tickets      from '../views/OP13Tickets.vue'

export default createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/',                    redirect: '/op1' },
    { path: '/op1',                 component: OP1Monitor },
    { path: '/op2/:eventId',        component: OP2EventDetail },
    { path: '/op3',                 component: OP3QualReview },
    { path: '/op4',                 component: OP4InformantFile },
    { path: '/op4/:informantId',    component: OP4InformantFile },
    { path: '/op5',                 component: OP5Appeals },
    { path: '/op6',                 component: OP6SystemParams },
    { path: '/op7',                 component: OP7AbuseMonitor },
    { path: '/op8',                 component: OP8Redemption },
    { path: '/op9',                 component: OP9Ledger },
    { path: '/op10',                component: OP10StaticData },
    { path: '/op11',                component: OP11Reports },
    { path: '/op12',                component: OP12Accounts },
    { path: '/op13',                component: OP13Tickets },
  ],
})
