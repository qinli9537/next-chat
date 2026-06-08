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
import { createFileSlice } from "./file-slice"
import { createOperationSlice } from "./operation-slice"



export const useChatStore = create<ChatStore>()(
    devtools(
        immer((...args) => ({
            ...createConversationSlice(...args),
            ...createMessageSlice(...args),
            ...createStreamSlice(...args),
            ...createFileSlice(...args),
            ...createOperationSlice(...args),
        })),
        {
            name: 'chat-store',
        }
    ),
)
