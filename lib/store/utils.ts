import { ChatMessage, MessageContent } from "./types"

/** 生成唯一ID： 时间戳+随机数 格式类似 '1780022111215-0nd72u' */
export function generateId(): string {
    // 生成唯一ID：时间戳+随机数 格式类似 '1780022111215-0nd72u'
    return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

/** 获取消息正在展示的子内容 */
export function getActiveContent(message: ChatMessage): MessageContent {
    return message.children?.[message.currentIndex] ?? message.children?.[0]
}
