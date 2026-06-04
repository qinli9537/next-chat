/**
 * 流式请求管理 slice
 * 职责： 发送流式请求、处理流式响应、中止流式请求、重新发送流式请求
 */
import type { StateCreator } from "zustand"
import type { StreamSlice, ChatStore, ChatMessage, SSEEventType } from "./types"
import type { SSEOutput } from "../stream"
import type { CRequestParams, CRequestOptions, CRequestCallbacks } from "../request"
import { CRequest } from "../request"
import { generateId } from "./utils"

type ImmerSet = Parameters<StateCreator<ChatStore, [['zustand/immer', never], ['zustand/devtools', never]], [], StreamSlice>>[0]

function jsonSafeParse<T = Record<string, any>>(raw: string, fallback: T): T {
    try {
        return JSON.parse(raw)
    } catch {
        return fallback
    }
}

/** 查找目标消息的Immer helper */
function findTargetMessage(state: ChatStore, conversationId: string, targetMessageId: string) {
    const conversation = state.conversations.find(c => c.id === conversationId)
    const message = conversation?.messages.find(msg => msg.id === targetMessageId)
    return { conversation, message }
}

/** 创建多事件路由的流式请求回调函数*/
function createStreamCallBacks(
    set: ImmerSet,
    conversationId: string,
    targetMessageId: string,
): CRequestCallbacks<SSEOutput> {
    let accumulatedContent = ''
    let accumulatedThinking = ''

    // 按event类型分发处理
    const eventHandlers: Record<SSEEventType, (data: Record<string, any>) => void> = {
        // 正常消息
        message: (data) => {
            accumulatedContent += data.content || ''
            set((state) => {
                const { message } = findTargetMessage(state, conversationId, targetMessageId)
                if (message) {
                    message.content = accumulatedContent
                    message.isThinking = false
                }

            }, false, 'stream/onUpdate/message')
        },
        // 思考中
        thinking: (data) => {
            accumulatedThinking += data.content || ''
            set((state) => {
                const { message } = findTargetMessage(state, conversationId, targetMessageId)
                if (message) {
                    message.thinking = accumulatedThinking
                    message.isThinking = true
                }
            }, false, 'stream/onUpdate/thinking')
        },
        // 服务端错误
        error: (data) => {
            const errorText = data.message || data.content || '服务端错误'
            accumulatedContent = errorText
            set((state) => {
                const { message } = findTargetMessage(state, conversationId, targetMessageId)
                if (message) {
                    message.content = accumulatedContent
                    message.isThinking = false
                    message.loading = false
                }
                state.isStreaming = false
                state.streamAbortController = null
            }, false, 'stream/onUpdate/error')
        },
        // 流结束
        done: () => {
            set((state) => {
                const { message } = findTargetMessage(state, conversationId, targetMessageId)
                if (message) {
                    message.content = accumulatedContent
                    message.isThinking = false
                    message.loading = false
                }
                state.isStreaming = false
                state.streamAbortController = null
            }, false, 'stream/onUpdate/done')
        },
    }

    return {
        onUpdate: (chunk: SSEOutput) => {
            if (!chunk.data) return
            const eventType = (chunk.event || 'message').trim() as SSEEventType
            const data = jsonSafeParse(chunk.data, { content: chunk.data })
            const handler = eventHandlers[eventType]
            if (handler) {
                handler(data)
            } else {
                console.debug(`stream未处理的事件类型: ${eventType}`, data)
            }
        },

        onSuccess: () => {
            // Immer 写法：直接修改状态
            set((state) => {
                state.isStreaming = false
                state.streamAbortController = null
                const { message } = findTargetMessage(state, conversationId, targetMessageId)
                if (message) {
                    message.content = accumulatedContent
                    message.isThinking = false
                    message.loading = false
                }
            }, false, 'stream/onSuccess')
        },

        onError: (error: Error) => {
            const errorContent =
                error.name === 'AbortError'
                    ? accumulatedContent || '已取消'
                    : `请求失败：${error.message}`

            // Immer 写法：直接修改状态
            set((state) => {
                state.isStreaming = false
                state.streamAbortController = null
                const { message } = findTargetMessage(state, conversationId, targetMessageId)
                if (message) {
                    message.content = errorContent
                    message.isThinking = false
                    message.loading = false
                }
            }, false, 'stream/onError')
        }
    }
}

/** 发起流式请求 并将AbortController存储到store中*/
function startStreamRequest(
    set: ImmerSet,
    get: () => ChatStore,
    message: Array<{ role: 'user' | 'assistant', content: string }>,
    conversationId: string,
    targetMessageId: string,
    requestOptions: CRequestOptions,
) {
    const request = CRequest(requestOptions)

    // 将AbortController存储到store中
    const callbacks = createStreamCallBacks(set, conversationId, targetMessageId)
    const wrappedCallbacks: CRequestCallbacks<SSEOutput> = {
        ...callbacks,
        onStream: (abortController) => {
            set((state) => {
                state.streamAbortController = abortController
            }, false, 'stream/setAbortController')
        },
    }

    const params: CRequestParams = {
        messages: message,
        stream: true,
    }
    request.send(params, wrappedCallbacks)
}


export const createStreamSlice: StateCreator<
    ChatStore,
    [['zustand/immer', never], ['zustand/devtools', never]],
    [],
    StreamSlice
>
    = (set, get) => ({
        isStreaming: false,
        streamAbortController: null,
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

            // 这里使用get()获取最新的消息列表，因为set新增了新的消息
            const allMessages = get()
                .conversations.find(c => c.id === conversationId)
                ?.messages.filter(msg => !msg.loading)
                .map(msg => ({ role: msg.role, content: msg.content })) ?? []

            startStreamRequest(set, get, allMessages, conversationId, assistantMessage.id, requestOptions)
        },

        abortStream: () => {
            const { streamAbortController } = get()
            streamAbortController?.abort()
            set((state) => {
                state.streamAbortController = null
            }, false, 'stream/abortStream')
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
                        msg.thinking = ''
                        msg.isThinking = false
                        msg.loading = true
                        msg.feedback = null
                    }
                }
                state.isStreaming = true
            }, false, 'stream/regenerateLastMessage')

            // 收集 assistant 消息之前的所有非loading消息作为上下文
            const allMessages = conversation.messages.filter(msg => !msg.loading && msg.id !== lastAssistant.id)
                .map(msg => ({ role: msg.role, content: msg.content }))

            startStreamRequest(set, get, allMessages, conversationId, lastAssistant.id, requestOptions)
        }
    })
