'use client'

import React, { useRef, useEffect, useCallback, useState } from 'react'

interface MermaidDiagramProps {
    content: string
}

let mermaidCounter = 0

export function MermaidDiagram({ content }: MermaidDiagramProps) {
    const containerRef = useRef<HTMLDivElement>(null)
    const [error, setError] = useState<string | null>(null)
    const [loading, setLoading] = useState<boolean>(false)
    const idRef = useRef<string>(`mermaid-${mermaidCounter++}-${Date.now()}`)

    const renderDiagram = useCallback(async (code: string) => {
        if (!code || !containerRef.current) return

        try {
            setLoading(true)
            setError(null)
            const mermaid = (await import('mermaid')).default
            mermaid.initialize({ 
                startOnLoad: false,
                theme: 'default',
                securityLevel: 'loose',
                fontFamily: 'ui-sans-serif,system-ui, sans-serif',
            })

            const isValid = await mermaid.parse(code, { suppressErrors: true })
            if (!isValid) {
                throw new Error('无效的 Mermaid 代码')
            }

            // 清除末尾干扰字符,比如反引号、格子等
            const cleanCode = code.replace(/[`\s]+$/g, '')
            const { svg } = await mermaid.render(idRef.current, cleanCode, containerRef.current)
            if(containerRef.current) {
                containerRef.current.innerHTML = svg
            } 
            setLoading(false)
        } catch (err) {
            const errMsg = err instanceof Error ? err.message : '未知错误'
            console.warn(`渲染 Mermaid 图失败: ${errMsg}`)
            setError(errMsg)
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        if (!content) return
        renderDiagram(content)
    }, [content, renderDiagram])

    if(error) {
        return (
            <div className="my-3 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950">
                <p className="text-red-600 dark:text-red-400 text-xs mb-1">渲染 Mermaid 图失败: {error}</p>
                <pre className="text-red-500 text-xs whitespace-pre-wrap">{content}</pre>
            </div>
        )
    }

    return (
        <div className="my-3 overflow-x-auto rounded-lg border border-border bg-muted/30 p-4">
            {
                loading && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        <span>渲染图表中...</span>
                    </div>
                )
            }
            <div ref={containerRef} className={loading ? 'hidden' : ''} />
        </div>
    )
}