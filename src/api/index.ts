import request from './http'

/**
 * 占位接口：保留 Axios 接入点。
 * 当前前端不依赖后端，但保留请求封装便于后续扩展（如同步云端账单）。
 */
export const api = {
  /** 示例：拉取远端 banner / 公告 */
  async getBanners() {
    return request.get('/banners')
  },
  /** 示例：同步历史账单到云端 */
  async syncHistory(payload: unknown) {
    return request.post('/history/sync', payload)
  }
}