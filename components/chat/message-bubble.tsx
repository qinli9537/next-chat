'use client'

import React from 'react'
import { User, Bot, Loader2, ChevronDown, ChevronRight, ChevronLeft, Brain } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible'
import { MarkdownRender } from './markdown-render'
import type { ChatMessage } from '@/lib/store/types'
import { MessageActions } from './message-actions'
import { getActiveContent } from '@/lib/store/utils'


interface MessageBubbleProps {
    message: ChatMessage
    isLastAssistant: boolean
    isStreaming?: boolean
    onGenerate: () => void
    onFeedback: (id: string, feedback: 'like' | 'dislike' | null) => void
    onSwitchVersion: (id: string, direction: 'prev' | 'next') => void
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

/** 多版本切换器 */
function VerisonSwitcher({ message, disabled, onSwitchVersion }: {
    message: ChatMessage,
    disabled: boolean,
    onSwitchVersion: (id: string, direction: 'prev' | 'next') => void
}) {
    const totalVersions = message.children?.length ?? 0
    if (totalVersions <= 1) return null

    const currentIndex = message.currentIndex
    return (
        <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
            <Button
                variant="ghost"
                size="sm"
                className="h-5 w-5"
                disabled={disabled || currentIndex === 0}
                onClick={() => onSwitchVersion(message.id, 'prev')}>
                <ChevronLeft className="h-3 w-3" />
            </Button>
            <span className="min-w-[3rem] text-center tabular-nums">
                {currentIndex + 1}/{totalVersions}
                </span>
            <Button 
                variant="ghost"
                size="sm"
                className="h-5 w-5"
                disabled={disabled || currentIndex === totalVersions - 1}
                onClick={() => onSwitchVersion(message.id, 'next')}>
                <ChevronRight className="h-3 w-3" />
            </Button>
        </div>
    )
}

export function MessageBubble({ message, isLastAssistant = false, isStreaming = false, onSwitchVersion, onGenerate, onFeedback }: MessageBubbleProps) {
    const isUser = message.role === 'user'
    const activeChild = getActiveContent(message)
    const hasThinking = !isUser && !!activeChild.thinking

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
            <div className={cn('flex flex-col max-w-[65%]', isUser ? 'items-end' : 'items-start')}>
                <div
                    className={cn('rounded-2xl px-4 py-2.5',
                        isUser ? 'bg-primary text-primary-foreground rounded-tr-md' : 'bg-muted rounded-tl-md')}
                >
                    {
                        isUser ? (
                            <p className="text-sm leading-7 whitespace-pre-wrap">
                                {activeChild.content}
                            </p>
                        ) : activeChild.loading && !activeChild.content && !hasThinking ? (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground py-1">
                                <Loader2 className="animate-spin h-4 w-4" />
                                等待响应...
                            </div>
                        ) : (
                            <>
                                {
                                    hasThinking && (
                                        <ThinkingBlock thinking={activeChild.thinking!} isThinking={!!activeChild.isThinking} />
                                    )
                                }
                                {activeChild.content && <MarkdownRender content={activeChild.content} />}
                            </>
                        )
                    }
                </div>
                {/* 多版本切换器 */}
                { !isUser && <VerisonSwitcher message={message} disabled={isStreaming} onSwitchVersion={onSwitchVersion} />}
                {
                    !isUser && activeChild.content && (
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