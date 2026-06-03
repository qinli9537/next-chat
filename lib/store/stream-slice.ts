/**
 * 流式请求管理 slice
 * 职责： 发送流式请求、处理流式响应、中止流式请求、重新发送流式请求
 */
import type { StateCreator } from "zustand"
import type { StreamSlice, ChatStore, ChatMessage } from "./types"
import type { SSEOutput } from "../stream"
import type { CRequestParams, CRequestOptions, CRequestCallbacks } from "../request"
import { CRequestClass, CRequest } from "../request"
import { generateId } from "./utils"

// 这里使用模块级变量，而不使用store是因为遵循zustand 最佳实践： store放状态，模块变量放副作用引用
let currentRequest: CRequestClass | null = null

/**
 * 创建流式请求回调函数
 */
function createStreamCallBacks(
    set: Parameters<StateCreator<ChatStore, [['zustand/immer', never], ['zustand/devtools', never]], [], StreamSlice>>[0],
    conversationId: string,
    targetMessageId: string,
): CRequestCallbacks<SSEOutput> {
    let accumulated = ''
    return {
        onUpdate: (chunk: SSEOutput) => {
            if (!chunk.data) return
            try {
                const parsed = JSON.parse(chunk.data)
                accumulated += parsed.content || ''
            } catch {
                accumulated += chunk.data
            }
            // Immer 写法：直接修改状态
            set((state) => {
                const conversation = state.conversations.find(c => c.id === conversationId)
                if (conversation) {
                    const message = conversation.messages.find(msg => msg.id === targetMessageId)
                    if (message) {
                        message.content = accumulated
                    }
                }
            }, false, 'stream/onUpdate')
        },

        onSuccess: () => {
            // Immer 写法：直接修改状态
            set((state) => {
                state.isStreaming = false
                const conversation = state.conversations.find(c => c.id === conversationId)
                if (conversation) {
                    const message = conversation.messages.find(msg => msg.id === targetMessageId)
                    if (message) {
                        message.content = accumulated
                        message.loading = false
                    }
                }
            }, false, 'stream/onSuccess')
            currentRequest = null
        },

        onError: (error: Error) => {
            const errorContent =
                error.name === 'AbortError'
                    ? accumulated || '已取消'
                    : `请求失败：${error.message}`

            // Immer 写法：直接修改状态
            set((state) => {
                state.isStreaming = false
                const conversation = state.conversations.find(c => c.id === conversationId)
                if (conversation) {
                    const message = conversation.messages.find(msg => msg.id === targetMessageId)
                    if (message) {
                        message.content = errorContent
                        message.loading = false
                    }
                }
            }, false, 'stream/onError')
            currentRequest = null
        }
    }
}

export const createStreamSlice: StateCreator<
    ChatStore,
    [['zustand/immer', never], ['zustand/devtools', never]],
    [],
    StreamSlice
>
    = (set, get) => ({
        isStreaming: false,
        sendMessage: (content: string, requestOptions: CRequestOptions) => {
            const state = get()
            let conversationId = state.activeConversationId

            // 如果没有激活会话，创建一个
            if (!conversationId) {
                conversationId = state.createConversation()
            }

            const userMessage: ChatMessage = {
                id: generateId(),
                role: 'user',
                content,
                timestamp: Date.now(),
            }

            const assistantMessage: ChatMessage = {
                id: generateId(),
                role: 'assistant',
                content: '',
                timestamp: Date.now(),
                loading: true,
            }

            // 添加用户消息 + 占位AI消息
            // Immer 写法：直接修改状态
            set((state) => {
                const conversation = state.conversations.find(c => c.id === conversationId)
                if (!conversation) return
                // 用首条用户消息作为会话标题
                if (conversation.messages.length === 0) {
                    conversation.title = content.slice(0, 20) + (content.length > 20 ? '...' : '')
                }
                conversation.messages.push(userMessage, assistantMessage)
                state.isStreaming = true
            }, false, 'stream/sendMessage')

            // 构建请求
            const request = CRequest(requestOptions)
            currentRequest = request

            // 这里使用get()获取最新的消息列表，因为set新增了新的消息
            const allMessage = get()
                .conversations.find(c => c.id === conversationId)
                ?.messages.filter(msg => !msg.loading)
                .map(msg => ({ role: msg.role, content: msg.content }))

            const params: CRequestParams = {
                messages: allMessage,
                stream: true,
            }

            const callbacks = createStreamCallBacks(set, conversationId, assistantMessage.id)

            request.send(params, callbacks)
        },

        abortStream: () => {
            currentRequest?.abort()
            currentRequest = null
        },

        regenerateLastMessage: (requestOptions: CRequestOptions) => {
            const state = get()
            const conversation = state.getActiveConversation()
            if (!conversation || state.isStreaming) return

            const conversationId = conversation.id

            // 找到最后一条assistant消息
            const lastAssistant = [...conversation.messages].reverse().find(msg => msg.role === 'assistant')
            if (!lastAssistant) return

            // 重置该 assistant 消息为loading状态
            // Immer 写法：直接修改状态
            set((state) => {
                const conv = state.conversations.find(c => c.id === conversationId)
                if (conv) {
                    const msg = conv.messages.find(m => m.id === lastAssistant.id)
                    if (msg) {
                        msg.content = ''
                        msg.loading = true
                        msg.feedback = null
                    }
                }
                state.isStreaming = true
            }, false, 'stream/regenerateLastMessage')

            // 收集 assistant 消息之前的所有非loading消息作为上下文
            const allMessages = conversation.messages.filter(msg => !msg.loading && msg.id !== lastAssistant.id)
                .map(msg => ({ role: msg.role, content: msg.content }))

            const request = CRequest(requestOptions)
            currentRequest = request
            const callbacks = createStreamCallBacks(set, conversationId, lastAssistant.id)
            request.send({ messages: allMessages, stream: true }, callbacks)
        }
    })
