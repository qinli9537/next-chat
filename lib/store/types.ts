/**
 *  chat store 公共类型定义
 */

import type { CRequestOptions } from "../request"

/** 消息类型 */
export interface ChatMessage {
    id: string
    role: 'user' | 'assistant'
    content: string
    /** 消息创建时间 */
    timestamp: number
    loading?: boolean
    feedback?: 'like' | 'dislike' | null
}

/** 会话类型 */
export interface Conversation {
    id: string
    title: string
    messages: ChatMessage[]
    /** 会话创建时间 */
    createdAt: number
}

/** 会话管理 slice状态 + 操作函数 */
export interface ConversationSlice {
    conversations: Conversation[]
    activeConversationId?: string | null

    /** 获取当前激活的会话 */
    getActiveConversation: () => Conversation | undefined
    /** 创建新会话 */
    createConversation: () => string
    /** 切换到指定会话 */
    setActiveConversation: (id: string) => void
    /** 删除会话 */
    deleteConversation: (id: string) => void
}

/** 消息管理 slice状态 + 操作函数 */
export interface MessageSlice {
    /** 设置消息反馈 */
    setMessageFeedback: (id: string, feedback: 'like' | 'dislike' | null) => void
}

/** 流式请求管理 slice状态 + 操作函数 */
export interface StreamSlice {
    isStreaming: boolean

    /** 发送消息（触发流式请求） */
    sendMessage: (content: string, requestOptions: CRequestOptions) => void
    /** 中止当前流式请求 */
    abortStream: () => void
    /** 重新生成最后一条回复 */
    regenerateLastMessage: (requestOptions: CRequestOptions) => void
}

/** 完整的ChatStore 类型 = Slice聚合 */
export type ChatStore = ConversationSlice & MessageSlice & StreamSlice
