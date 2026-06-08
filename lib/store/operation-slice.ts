/** 
 * 全局操作注册表
 * 用于解耦组件间的回调透传，通过注册-调用的方式替代 props drilling
 */
import type { StateCreator } from "zustand"
import type { ChatStore } from "./types"

// 操作处理器类型
export type OperationHandler = (...args: unknown[]) => void | Promise<void>

export interface OperationSlice {
    /** 操作注册表 */
    operationsMap: Record<string, OperationHandler>
    /** 注册操作 */
    registerOperation: (name: string, handler: OperationHandler) => void
    /** 注销操作 */
    unregisterOperation: (name: string) => void
    /** 获取已注册的操作处理函数 */
    getOperation: (name: string) => OperationHandler | undefined
    /** 批量注册操作 */
    registerOperations: (operations: Record<string, OperationHandler>) => void
    /** 清空所有操作 */
    clearOperations: () => void
}

// 操作名称常量
export const OPERATION_NAMES = {
    /** 发送消息 */
    SEND_MESSAGE: 'sendMessage',
    /** 重新生成最后一条回复 */
    REGENERATE: 'regenerate',
    /** 提交反馈 */
    FEEDBACK: 'feedback',
    /** 切换模型版本 */
    SWITCH_VERSION: 'switchVersion',
    /** 选择问题 */
    QUESTION_SELECT: 'questionSelect',
    /** 选择建议 */
    SUGGESTION_SELECT: 'suggestionSelect',
} as const

export const createOperationSlice: StateCreator<
    ChatStore,
    [['zustand/immer', never], ['zustand/devtools', never]],
    [],
    OperationSlice
> = (set, get) => ({
    operationsMap: {},

    registerOperation: (name, handler) => {
        set((state) => {
            state.operationsMap[name] = handler
        }, false, 'operation/register')
    },

    unregisterOperation: (name) => {
        set((state) => {
            delete state.operationsMap[name]
        }, false, 'operation/unregister')
    },

    getOperation: (name) => {
        return get().operationsMap[name]
    },

    registerOperations: (operations) => {
        set((state) => {
            Object.assign(state.operationsMap, operations)
        }, false, 'operation/registerBatch')
    },

    clearOperations: () => {
        set((state) => {
            state.operationsMap = {}
        }, false, 'operation/clear')
    },
})

// 操作执行器 - 提供便捷的操作调用方式
export const callOperation = (
    operationsMap: Record<string, OperationHandler>,
    name: string,
    ...args: unknown[]
) => {
    const handler = operationsMap[name]
    if (handler) {
        return handler(...args)
    }
    console.warn(`Operation "${name}" not found`)
}
