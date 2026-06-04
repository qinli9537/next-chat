'use client'

import React, { useState } from 'react'
import { User, Bot, Loader2, ChevronDown, ChevronRight, Brain } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible'
import { MarkdownRender } from './markdown-render'
import type { ChatMessage } from '@/lib/store/types'
import { MessageActions } from './message-actions'

interface MessageBubbleProps {
    message: ChatMessage
    isLastAssistant: boolean
    onGenerate: () => void
    onFeedback: (id: string, feedback: 'like' | 'dislike' | null) => void
}

/** 思考过程折叠面板 */
function ThinkingBlock({ thinking, isThinking }: { thinking: string, isThinking: boolean }) {
    return (
        <Collapsible defaultOpen className="mb-2">
            <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="group/trigger h-auto gap-1.5 px-1 py-1 text-xs text-muted-foreground hover:text-foreground">
                    {isThinking ?
                        (<Loader2 className="animate-spin h-3 w-3" />)
                        : (<Brain className="h-3 w-3" />)
                    }
                    <span>{isThinking ? '思考中...' : '思考过程'}</span>
                    <ChevronDown className="h-3 w-3 transition-transform duration-200 group-data-[state=closed]/trigger:hidden" />
                    <ChevronRight className="h-3 w-3 transition-transform duration-200 group-data-[state=open]/trigger:hidden" />
                </Button>
            </CollapsibleTrigger>
            <CollapsibleContent>
                <div className="border-l-2 border-muted-foreground/20 pl-3 mt-1">
                    <p className="text-xs text-muted-foreground leading-5 whitespace-pre-wrap">
                        {thinking}
                    </p>
                </div>
            </CollapsibleContent>
        </Collapsible>
    )
}

export function MessageBubble({ message, isLastAssistant = false, onGenerate, onFeedback }: MessageBubbleProps) {
    console.log('%c [ message ]-47', 'font-size:13px; background:pink; color:#bf2c9f;', message.thinking)
    const isUser = message.role === 'user'
    const hasThinking = !isUser && !!message.thinking

    return (
        <div
            className={cn('flex group gap-3 px-4 py-3',
                isUser ? 'flex-row-reverse' : 'flex-row'
            )}
        >
            {/* 头像 */}
            <Avatar className={cn('mt-0.5', isUser ? 'bg-primary' : 'bg-emerald-500')}>
                <AvatarFallback
                    className={cn(isUser ? 'bg-primary text-primary-foreground' : 'bg-emerald-500 text-white')}>
                    {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                </AvatarFallback>
            </Avatar>
            {/* 消息内容 */}
            <div className={cn('flex flex-col max-w-[75%]', isUser ? 'items-end' : 'items-start')}>
                <div
                    className={cn('rounded-2xl px-4 py-2.5',
                        isUser ? 'bg-primary text-primary-foreground rounded-tr-md' : 'bg-muted rounded-tl-md')}
                >
                    {
                        isUser ? (
                            <p className="text-sm leading-7 whitespace-pre-wrap">
                                {message.content}
                            </p>
                        ) : message.loading && !message.content && !hasThinking ? (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground py-1">
                                <Loader2 className="animate-spin h-4 w-4" />
                                等待响应...
                            </div>
                        ) : (
                            <>
                                {
                                    hasThinking && (
                                        <ThinkingBlock thinking={message.thinking!} isThinking={!!message.isThinking} />
                                    )
                                }
                                {message.content && <MarkdownRender content={message.content} />}
                            </>
                        )
                    }
                </div>
                {/* 操作按钮 */}
                {
                    !isUser && message.content && (
                        <MessageActions
                            message={message}
                            isLastAssistant={isLastAssistant}
                            onGenerate={onGenerate}
                            onFeedback={onFeedback}
                        />
                    )
                }
            </div>
        </div>
    )
}