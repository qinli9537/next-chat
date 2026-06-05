/**
 * LLM API Route -多provider代理层
 * 
 *  支持的协议格式：
 * - mock （默认）
 * - openai openai 兼容格式
 * - ollama ollama 协议 NDJSON 格式
 */

type ProviderType = 'mock' | 'openai' | 'ollama'

interface ParsedChunk {
    content: string
    event: 'message' | 'thinking'
}

/** 流结束信号事件 */
const DONE_SIGNAL = '[DONE]' as const

const DEFAULT_PROVIDER: ProviderType = 'mock'

const PROVIDER_CONFIG = {
    mock: {},
    openai: {
        baseUrl: process.env.OPENAI_BASE_URL || 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
        apiKey: process.env.OPENAI_API_KEY || '',
        model: process.env.OPENAI_MODEL || 'qwen-max',
    },
    ollama: {
        baseUrl: process.env.OLLAMA_BASE_URL || 'https://mlvoca.com/api/generate',
        model: process.env.OLLAMA_MODEL || 'deepseek-r1:1.5b',
    },
} as const

const MOCK_THINKING = '让我分析一下用户的问题，然后给出一个详细的回答...'

const MOCK_CALORIE_THINKING = '好的，让我根据你的饮食记录来计算，然后给出一个详细的回答...'

const MOCK_CALORIE_REPLY = 
'## 摄入热量分析\n\n' +
'根据你的饮食记录，为你生成分析报告\n\n'+
'```card\n' +
'{\n  "title": "摄入热量分析",\n  "badge": {\n    "text": "已超标",\n    "variant": "destructive"\n  },\n  "tabs": [\n    {\n      "label": "计算过程",\n      "value": "process",\n      "content": "根据以下逻辑，我计算得出你今日已摄入热量超标，总摄入为 2180 大卡。"\n    },\n    {\n      "label": "营养参数",\n      "value": "params",\n      "content": "基础代谢率(BMR): 1650 大卡\\n活动系数: 1.375（轻度运动）\\n目标热量: 1800 大卡/天\\n蛋白质目标: 90g | 碳水目标: 200g | 脂肪目标: 60g"\n    }\n  ],\n  "sections": [\n    {\n      "items": [\n        {\n          "label": "是否超标: 是",\n          "status": "success",\n          "detail": "实际摄入 2180 大卡 > 目标摄入 1800 大卡，超标 380 大卡"\n        },\n        {\n          "label": "建议减少量 380 大卡",\n          "status": "info",\n          "highlight": "推荐运动消耗 40分钟",\n          "detail": "慢跑 2400 大卡 - 早餐 520 大卡 - 午餐 860 大卡 - 晚餐 800 大卡 = 超标 380 大卡"\n        }\n      ]\n    },\n    {\n      "title": "总结",\n      "items": [\n        {\n          "label": "午餐摄入了高热量食物（炸鸡套餐），导致总热量偏高",\n          "status": "info"\n        },\n        {\n          "label": "按每日 1800 大卡目标，建议晚间增加 40 分钟有氧运动消耗多余热量",\n          "status": "info"\n        },\n        {\n          "label": "蛋白质摄入达标（95g/90g），但碳水超标 15%，建议减少精制碳水",\n          "status": "success"\n        }\n      ]\n    }\n  ],\n  "footer": {\n    "buttons": [\n      {\n        "text": "确认记录",\n        "variant": "default"\n      },\n      {\n        "text": "查看详情",\n        "variant": "outline"\n      }\n    ]\n  }\n}'+
'\n```\n\n'+
'---\n\n以上是根据你的饮食记录计算出的摄入热量分析报告，有任何问题，请随时问我。\n\n'

const MOCK_REPLY =[
    '你好！我是一个智能助手。\n\n' +
    '我可以帮你完成以下任务：\n\n' +
    '1. **代码编写** - 支持多种编程语言\n' +
    '2. **文档编写** - 生成专业文档\n' +
    '3. **数据可视化** - 帮助分析数据\n' +
    '4. **问题解决** - 提供问题解决建议\n' +
    '5. **其他任务** - 其他类型的任务，如数据处理、文本分析等\n\n' +
    '```typescript\n' +
    'console.log("hello world")\n' +
    '``` \n\n', 
    '这是一个很好的问题！让我从以下几个角度来分析\n\n' +
    '1. **问题的背景**: 这是一个关于数据处理的问题\n' +
    '2. **问题的类型**: 数据处理问题\n\n' +
    '3. **问题的解决方法**: 1. 收集数据\n' +
    '4. **问题的解决方法**: 2. 处理数据\n' +
    '5. **问题的解决方法**: 3. 分析数据\n' +
    '6. **问题的解决方法**: 4. 可视化数据\n' +
    '7. **问题的解决方法**: 5. 解决问题\n\n',
]

function enqueueSSE(
    controller: ReadableStreamDefaultController<Uint8Array>, 
    encoder: TextEncoder, 
    content: string,
    event: 'message' | 'thinking' | 'error' | 'done' = 'message'
) {
    const sseData = JSON.stringify({ content })
    controller.enqueue(encoder.encode(`event: ${event}\ndata: ${sseData}\n\n`))
}

function sseResponse(stream: ReadableStream) {
    return new Response(stream, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
        }
    })
}

export async function POST(req: Request) {
    const { searchParams } = new URL(req.url)
    const provider = searchParams.get('provider') || DEFAULT_PROVIDER
    if (!provider) {
        return errorResponse('provider 不能为空')
    }
    const body = await req.json()
    const messages: Array<{ role: string, content: string }> = body.messages || []

    switch (provider) {
        case 'mock':
            return handleMock(messages)
        case 'openai':
            return handleOpenAI(messages)
        case 'ollama':
            return handleOllama(messages)
        default:
            return handleMock(messages)
    }
}

async function handleMock(messages: Array<{ role: string, content: string }>) {
    const userMessage = messages[messages.length - 1]?.content || ''

    // 匹配'热量'等关键词 返回mock数据
    const isCalorieQuery = /热量|摄入|卡路里|饮食/.test(userMessage)
    const thinking = isCalorieQuery ? MOCK_CALORIE_THINKING : MOCK_THINKING

    const randomReply = MOCK_REPLY[Math.floor(Math.random() * MOCK_REPLY.length)]
    const replyText = isCalorieQuery ? MOCK_CALORIE_REPLY : `你说的是「 ${userMessage} 」对吧？\n\n${randomReply}`

    const encoder = new TextEncoder()
    const thinkingChunks = splitIntoChunks(thinking, 3)
    const messageChunks = splitIntoChunks(replyText, isCalorieQuery ? 20 : 4)

    const stream = new ReadableStream<Uint8Array>({
        async start(controller) {
            // 阶段1 发送思考过程（reasoning token）事件
            for (const chunk of thinkingChunks) {
                await delay(40 + Math.random() * 60)
                enqueueSSE(controller, encoder, chunk, 'thinking')
            }
            // 阶段2 发送正常文本输出事件
            for (const chunk of messageChunks) {
                await delay(30 + Math.random() * 50)
                enqueueSSE(controller, encoder, chunk, 'message')
            }
            // 阶段3 发送流结束信号
            enqueueSSE(controller, encoder, '', 'done')
            controller.close()
        }
    })
    return sseResponse(stream)
}

/**
 * 处理OpenAI请求
 */
async function handleOpenAI(messages: Array<{ role: string, content: string }>) {
    const config = PROVIDER_CONFIG.openai

    if (!config.apiKey) {
        return errorResponse('OpenAI API Key 为空')
    }

    return proxyStream(config.baseUrl, {
        headers: {
            'Authorization': `Bearer ${config.apiKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            model: config.model,
            messages,
            stream: true,
        }),
    }, parseOpenAILine)
}

/**
 * 处理Ollama请求
 */
async function handleOllama(messages: Array<{ role: string, content: string }>) {
    const config = PROVIDER_CONFIG.ollama

    // Ollama 协议只支持单prompt，将多轮消息拼接
    const prompt = messages.map((msg) => (msg.role === 'user' ? `User: ${msg.content}` : `Assistant: ${msg.content}`))
        .join('\n') + `\nAssistant:` // 最后添加Assistant： 告诉model，到你回复了

    return proxyStream(config.baseUrl, {
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            model: config.model,
            prompt,
            stream: true,
        }),
    }, parseOllamaLine)
}

/**
 * 代理流式响应
 */
async function proxyStream(
    url: string,
    init: { headers: Record<string, string>; body: string },
    parseLine: (line: string) => ParsedChunk | typeof DONE_SIGNAL | null,
) {
    const encoder = new TextEncoder()

    const stream = new ReadableStream({
        async start(controller) {
            try {
                const response = await fetch(url, {
                    method: 'POST',
                    ...init,
                })

                if (!response.ok) {
                    const errorText = await response.text()
                    enqueueSSE(controller, encoder, `API错误： ${response.status}: ${errorText}`, 'error')
                    controller.close()
                    return
                }

                const reader = response.body!.getReader()
                const decoder = new TextDecoder()
                let buffer = ''
                while (true) {
                    const { done, value } = await reader.read()
                    if (done) break
                    buffer += decoder.decode(value, { stream: true })
                    const lines = buffer.split('\n')
                    buffer = lines.pop() || ''

                    for (const line of lines) {
                        const result = parseLine(line)
                        if (result === DONE_SIGNAL) break
                        if (result) {
                            enqueueSSE(controller, encoder, result.content, result.event)
                        }
                    }
                }
                if (buffer.trim()) {
                    const result = parseLine(buffer)
                    if (result && result !== DONE_SIGNAL) {
                        enqueueSSE(controller, encoder, result.content, result.event)
                    }
                }
                // 发送流结束信号
                enqueueSSE(controller, encoder, '', 'done')
                controller.close()
            } catch (error) {
                const message = error instanceof Error ? error.message : '未知错误'
                enqueueSSE(controller, encoder, `请求失败： ${message}`, 'error')
                controller.close()
            }
        }
    })
    return sseResponse(stream)
}

/**
 * 解析OpenAI流式响应
 */
function parseOpenAILine(line: string): ParsedChunk | typeof DONE_SIGNAL | null {
    const trimmedLine = line.trim()
    if (!trimmedLine || !trimmedLine.startsWith('data:')) {
        return null
    }
    const data = trimmedLine.slice(5).trim()
    if (data === DONE_SIGNAL) return DONE_SIGNAL

    try {
        const delta = JSON.parse(data).choices[0]?.delta
        if (!delta) return null
        
        if(delta.reasoning_content)  {
            return { content: delta.reasoning_content, event: 'thinking' }
        }
        if(delta.content) {
            return { content: delta.content, event: 'message' }
        }

        return null
    } catch {
        return null
    }
}

/**
 * 解析Ollama流式响应
 */
function parseOllamaLine(line: string): ParsedChunk | typeof DONE_SIGNAL | null {
    if (!line.trim()) return null
    try {
        const response = JSON.parse(line).response
        if (!response) return null
        
        return { content: response, event: 'message' }
    } catch {
        return null
    }
}

/**
 * 将文本分割成指定大小的块
 * 用于模拟流式响应
 */
function splitIntoChunks(text: string, chunkSize: number): string[] {
    const result: string[] = []
    for (let i = 0; i < text.length; i += chunkSize) {
        result.push(text.substring(i, i + chunkSize))
    }
    return result
}

/**
 * 模拟异步延迟
 */
function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
}

function errorResponse(message: string) {
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
        start(controller) {
            enqueueSSE(controller, encoder, `⚠️ ${message}`, 'error')
            controller.close()
        }
    })
    return sseResponse(stream)
}