import { toast } from 'sonner'

export const showToast = {
  success: (message: string) => {
    toast.success(message, {
      duration: 3000,
      style: {
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        border: '1px solid rgba(34, 197, 94, 0.3)',
        color: '#22c55e',
        backdropFilter: 'blur(10px)',
      },
    })
  },

  error: (message: string) => {
    toast.error(message, {
      duration: 4000,
      style: {
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        border: '1px solid rgba(239, 68, 68, 0.3)',
        color: '#ef4444',
        backdropFilter: 'blur(10px)',
      },
    })
  },

  warning: (message: string) => {
    toast.warning(message, {
      duration: 3000,
      style: {
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        border: '1px solid rgba(245, 158, 11, 0.3)',
        color: '#f59e0b',
        backdropFilter: 'blur(10px)',
      },
    })
  },

  info: (message: string) => {
    toast.info(message, {
      duration: 3000,
      style: {
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        border: '1px solid rgba(59, 130, 246, 0.3)',
        color: '#3b82f6',
        backdropFilter: 'blur(10px)',
      },
    })
  },
}
