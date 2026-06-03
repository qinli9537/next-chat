/**
 *  ChatStore主入口
 * 使用zustand + immer + devtools
 */
import { create } from "zustand"
import { immer } from "zustand/middleware/immer"
import { devtools } from "zustand/middleware"
import type { ChatStore } from "./types"
import { createConversationSlice } from "./conversation-slice"
import { createMessageSlice } from "./message-slice"
import { createStreamSlice } from "./stream-slice"

export const useChatStore = create<ChatStore>()(
    devtools(
        immer((...args) => ({
            ...createConversationSlice(...args),
            ...createMessageSlice(...args),
            ...createStreamSlice(...args),
        })),
        {
            name: 'chat-store',
        }
    ),
)
