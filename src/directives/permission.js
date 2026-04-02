import { pinia } from '@/stores'
import { useAuthStore } from '@/stores/auth'

function hasElementPermission(value) {
  const authStore = useAuthStore(pinia)

  if (!value) {
    return true
  }

  if (typeof value === 'string') {
    return authStore.hasPermission(value)
  }

  if (Array.isArray(value)) {
    return value.every(item => authStore.hasPermission(item))
  }

  if (typeof value === 'object') {
    if (Array.isArray(value.all)) {
      return value.all.every(item => authStore.hasPermission(item))
    }

    if (Array.isArray(value.any)) {
      return authStore.hasAnyPermission(value.any)
    }
  }

  return true
}

function updateVisibility(el, binding) {
  if (typeof el.__originDisplay === 'undefined') {
    el.__originDisplay = el.style.display
  }

  if (hasElementPermission(binding.value)) {
    el.style.display = el.__originDisplay
  } else {
    el.style.display = 'none'
  }
}

export default {
  mounted(el, binding) {
    updateVisibility(el, binding)
  },
  updated(el, binding) {
    updateVisibility(el, binding)
  }
}
