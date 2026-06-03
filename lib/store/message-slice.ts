/**
 * 消息管理 slice
 * 职责： 消息反馈（点赞 点踩）
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
            },false, 'message/setFeedback')
        },
    })