import { defineStore } from 'pinia'
import { ref } from 'vue'
import client from '../api/client'

export const useDashboardStore = defineStore('dashboard', () => {
  const todo = ref({
    qualificationReview:     0,
    openTickets:             0,
    redemptionPendingReview: 0,
    expiredUnacceptedTasks:  0,
    suspiciousObservations:  0,
    staleVerifiedEvents:     0,
    abnormalPairings:        0,
    pipelineAlerts:          0,
  })

  const monitor = ref({
    activeEvents:      0,
    onlineInformants:  0,
    tasks:             { broadcasting: 0, locked: 0 },
  })

  let pollTimer = null

  async function fetchTodo() {
    try {
      const { data } = await client.get('/api/backend/dashboard/todo')
      todo.value = data
    } catch {}
  }

  async function fetchMonitor() {
    try {
      const { data } = await client.get('/api/backend/dashboard/monitor')
      // MonitorSummary 回傳扁平欄位 tasksBroadcasting/tasksLocked（非巢狀 tasks 物件）
      monitor.value = {
        activeEvents:     data.activeEvents     ?? 0,
        onlineInformants: data.onlineInformants ?? 0,
        tasks: {
          broadcasting: data.tasksBroadcasting ?? 0,
          locked:       data.tasksLocked       ?? 0,
        },
      }
    } catch {}
  }

  function startPoll() {
    fetchTodo()
    fetchMonitor()
    pollTimer = setInterval(() => {
      fetchTodo()
      fetchMonitor()
    }, 30000)
  }

  function stopPoll() {
    clearInterval(pollTimer)
    pollTimer = null
  }

  return { todo, monitor, startPoll, stopPoll, fetchTodo, fetchMonitor }
})
