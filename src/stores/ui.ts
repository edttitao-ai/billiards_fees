import { defineStore } from 'pinia'

interface Toast {
  id: number
  text: string
  type: 'info' | 'success' | 'warn' | 'error'
}

export type ConfirmTone = 'danger' | 'primary'

export interface ConfirmRequest {
  id: number
  title: string
  message?: string
  confirmText?: string
  cancelText?: string
  tone?: ConfirmTone
  resolve: (v: boolean) => void
}

export const useUIStore = defineStore('ui', {
  state: () => ({
    editingSetting: false,
    toast: null as Toast | null,
    _toastSeq: 0,
    confirmReq: null as ConfirmRequest | null,
    _confirmSeq: 0
  }),
  actions: {
    setEditingSetting(v: boolean) {
      this.editingSetting = v
    },
    showToast(text: string, type: Toast['type'] = 'info', duration = 1800) {
      this._toastSeq += 1
      const id = this._toastSeq
      this.toast = { id, text, type }
      window.setTimeout(() => {
        if (this.toast?.id === id) this.toast = null
      }, duration)
    },

    /**
     * 弹一个确认框，返回 Promise<boolean>。
     * 用法： if (!await ui.confirm('删除这条？')) return;
     */
    confirm(opts: {
      title: string
      message?: string
      confirmText?: string
      cancelText?: string
      tone?: ConfirmTone
    }): Promise<boolean> {
      this._confirmSeq += 1
      const id = this._confirmSeq
      return new Promise((resolve) => {
        this.confirmReq = {
          id,
          title: opts.title,
          message: opts.message,
          confirmText: opts.confirmText ?? '确定',
          cancelText: opts.cancelText ?? '取消',
          tone: opts.tone ?? 'primary',
          resolve
        }
      })
    },

    resolveConfirm(v: boolean) {
      const cur = this.confirmReq
      if (!cur) return
      this.confirmReq = null
      cur.resolve(v)
    }
  }
})