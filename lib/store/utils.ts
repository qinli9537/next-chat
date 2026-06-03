/** 生成唯一ID： 时间戳+随机数 格式类似 '1780022111215-0nd72u' */
export function generateId(): string {
    // 生成唯一ID：时间戳+随机数 格式类似 '1780022111215-0nd72u'
    return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}