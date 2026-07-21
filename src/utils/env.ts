/**
 * 运行环境检测工具。
 * 仅做客户端判断，统一在一处维护 UA 解析逻辑，方便扩展（QQ、企业微信等）。
 */

/** 是否在微信内置浏览器（含微信小程序 WebView）。 */
export function isWeChatBrowser(): boolean {
  if (typeof navigator === 'undefined') return false
  return /MicroMessenger/i.test(navigator.userAgent || '')
}
