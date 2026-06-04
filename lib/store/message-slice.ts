/**
 * 消息管理 slice
 * 职责： 消息反馈（点赞 点踩）、多版本切换
 */
import type { StateCreator } from "zustand"
import type { MessageSlice, ChatStore } from "./types"

export const createMessageSlice: StateCreator<
    ChatStore,
    [['zustand/immer', never], ['zustand/devtools', never]],
    [],
    MessageSlice
>
    = (set) => ({
        setMessageFeedback: (id: string, feedback: 'like' | 'dislike' | null) => {
            set((state) => {
                for (const c of state.conversations) {
                    const message = c.messages.find(msg => msg.id === id)
                    if (message) {
                        message.feedback = message.feedback === feedback ? null : feedback
                        break
                    }
                }
            }, false, 'message/setFeedback')
        },
        switchMessageVersion: (id: string, direction: 'prev' | 'next') => {
            set((state) => {
                for (const c of state.conversations) {
                    const message = c.messages.find(msg => msg.id === id)
                    if (message) {
                        const totalVersions = message.children?.length ?? 0
                        if (totalVersions <= 1) break

                        if (direction === 'prev') {
                            // 用 Math.max 确保索引不小于 0，避免越界
                            message.currentIndex = Math.max(0, message.currentIndex - 1)
                        } else {
                            // 用 Math.min 确保索引不大于 totalVersions - 1，避免越界
                            message.currentIndex = Math.min(totalVersions - 1, message.currentIndex + 1)
                        }
                        break
                    }
                }
            }, false, 'message/switchVersion')
        },
    })