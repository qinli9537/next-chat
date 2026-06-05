const MOCK_THINKING = '让我分析一下用户的问题，然后给出一个详细的回答...'

const MOCK_MERMAID_THINKING = '让我用流程图来展示这个流程...'

const MOCK_MERMAID_REPLAY =
    '## 流程图展示\n\n' +
    '下面是一个用户注册的流程图：\n\n' +
    '```mermaid\n' +
    'graph TD\n' +
    'A[用户访问注册页面] --> B{是否已有账号?}\n' +
    'B -->|是| C[跳转登录页]\n' +
    'B -->|否| D[填写注册信息]\n' +
    'D --> E[提交表单]\n' +
    'E --> F{信息校验}\n' +
    'F -->|通过| G[创建账号]\n' +
    'F -->|失败| H[显示错误提示]\n' +
    'H --> D\n' +
    'G --> I[发送验证邮件]\n' +
    'I --> J[注册完成]\n' +
    '```\n\n' +
    '再来看一个时序图的例子：\n\n' +
    '```mermaid\n' +
    'sequenceDiagram\n' +
    'participant U as 用户\n' +
    'participant F as 前端\n' +
    'participant B as 后端\n' +
    'participant D as 数据库\n' +
    'U->>F: 点击登录\n' +
    'F->>B: POST /api/login\n' +
    'B->>D: 查询用户信息\n' +
    'D-->>B: 返回用户数据\n' +
    'B-->>F: 返回 Token\n' +
    'F-->>U: 跳转首页\n' +
    '```\n\n' +
    '以上流程图展示了常见的用户注册和登录流程，如需调整请告诉我。\n\n'

const MOCK_MATH_THINKING = '让我用数学公式来推导一下...'

const MOCK_MATH_REPLAY =
    '## 数学公式推导\n\n' +
    '### 二次方程求根公式\n\n' +
    '对于一般的二次方程 $ax^2 + bx + c = 0$，其求根公式为：\n\n' +
    '$$x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$$\n\n' +
    '其中判别式 $\\Delta = b^2 - 4ac$ 决定了根的性质：\n\n' +
    '- 当 $\\Delta > 0$ 时，方程有两个不相等的实根\n' +
    '- 当 $\\Delta = 0$ 时，方程有两个相等的实根\n' +
    '- 当 $\\Delta < 0$ 时，方程无实根\n\n' +
    '### 欧拉公式\n\n' +
    '数学中最优美的公式之一是欧拉恒等式：\n\n' +
    '$$e^{i\\pi} + 1 = 0$$\n\n' +
    '它将五个最重要的数学常数 $e$、$i$、$\\pi$、$1$、$0$ 联系在了一起。\n\n' +
    '### 矩阵运算\n\n' +
    '矩阵乘法的定义如下：\n\n' +
    '$$\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix} \\begin{pmatrix} e \\\\ f \\end{pmatrix} = \\begin{pmatrix} ae + bf \\\\ ce + df \\end{pmatrix}$$\n\n' +
    '以上是一些常见的数学公式示例。\n\n'

const MOCK_TABLE_THINKING = '让我整理一个表格来展示...'

const MOCK_TABLE_REPLAY =
    '## 数据对比\n\n' +
    '### 主流前端框架对比\n\n' +
    '| 框架 | 语言 | 首次发布 | Star 数 | 学习曲线 | 特点 |\n' +
    '|------|------|----------|---------|----------|------|\n' +
    '| React | JavaScript/TSX | 2013 | 220k+ | 中等 | 虚拟 DOM、组件化 |\n' +
    '| Vue | JavaScript/SFC | 2014 | 210k+ | **较低** | 渐进式、双向绑定 |\n' +
    '| Angular | TypeScript | 2016 | 95k+ | 较高 | 全家桶、依赖注入 |\n' +
    '| Svelte | JavaScript | 2016 | 80k+ | 低 | 编译时、无虚拟 DOM |\n' +
    '| Solid | TypeScript/JSX | 2021 | 32k+ | 中等 | 细粒度响应式 |\n\n' +
    '### 性能基准测试（越低越好）\n\n' +
    '| 指标 | React 18 | Vue 3 | Svelte 4 | Solid |\n' +
    '|------|----------|-------|----------|-------|\n' +
    '| 创建 1000 行 | 45ms | 38ms | **22ms** | **18ms** |\n' +
    '| 更新所有行 | 52ms | 42ms | 28ms | 24ms |\n' +
    '| 部分更新 | 12ms | 10ms | 8ms | 6ms |\n' +
    '| 选中行高亮 | 4ms | 3ms | 2ms | 2ms |\n' +
    '| 包体积 (gzip) | 42KB | 33KB | **1.6KB** | 7KB |\n\n' +
    '> 以上数据仅供参考，实际性能取决于应用场景和实现方式。\n\n'

const MOCK_CODE_THINKING = '让我写一个代码示例来说明...'

const MOCK_CODE_REPLAY =
    '## 代码示例\n\n' +
    '### TypeScript - React 自定义 Hook\n\n' +
    '下面是一个常用的防抖 Hook 实现：\n\n' +
    '```typescript\n' +
    'import { useState, useEffect } from "react"\n\n' +
    'function useDebounce<T>(value: T, delayMs: number): T {\n' +
    '  const [debouncedValue, setDebouncedValue] = useState<T>(value)\n\n' +
    '  useEffect(() => {\n' +
    '    const timer = setTimeout(() => {\n' +
    '      setDebouncedValue(value)\n' +
    '    }, delayMs)\n\n' +
    '    return () => clearTimeout(timer)\n' +
    '  }, [value, delayMs])\n\n' +
    '  return debouncedValue\n' +
    '}\n' +
    '```\n\n' +
    '### Python - 装饰器模式\n\n' +
    '```python\n' +
    'import functools\n' +
    'import time\n\n' +
    'def retry(max_attempts: int = 3, delay_seconds: float = 1.0):\n' +
    '    """重试装饰器，支持配置最大重试次数和间隔"""\n' +
    '    def decorator(func):\n' +
    '        @functools.wraps(func)\n' +
    '        def wrapper(*args, **kwargs):\n' +
    '            for attempt in range(1, max_attempts + 1):\n' +
    '                try:\n' +
    '                    return func(*args, **kwargs)\n' +
    '                except Exception as error:\n' +
    '                    if attempt == max_attempts:\n' +
    '                        raise\n' +
    '                    print(f"第 {attempt} 次失败: {error}, 重试中...")\n' +
    '                    time.sleep(delay_seconds)\n' +
    '        return wrapper\n' +
    '    return decorator\n\n' +
    '@retry(max_attempts=3, delay_seconds=2.0)\n' +
    'def fetch_data(url: str) -> dict:\n' +
    '    import requests\n' +
    '    response = requests.get(url)\n' +
    '    response.raise_for_status()\n' +
    '    return response.json()\n' +
    '```\n\n' +
    '### SQL - 复杂查询\n\n' +
    '```sql\n' +
    'SELECT \n' +
    '    u.username,\n' +
    '    COUNT(o.id) AS order_count,\n' +
    '    SUM(o.total_amount) AS total_spent,\n' +
    '    RANK() OVER (ORDER BY SUM(o.total_amount) DESC) AS spending_rank\n' +
    'FROM users u\n' +
    'LEFT JOIN orders o ON u.id = o.user_id\n' +
    'WHERE o.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)\n' +
    'GROUP BY u.id, u.username\n' +
    'HAVING COUNT(o.id) >= 3\n' +
    'ORDER BY total_spent DESC\n' +
    'LIMIT 10;\n' +
    '```\n\n' +
    '以上展示了不同语言的代码高亮效果。如需其他语言的示例，请告诉我。\n\n'

const MOCK_CALORIE_THINKING = '好的，让我根据你的饮食记录来计算，然后给出一个详细的回答...'

const MOCK_CALORIE_REPLY =
    '## 摄入热量分析\n\n' +
    '根据你的饮食记录，为你生成分析报告\n\n' +
    '```card\n' +
    '{\n  "title": "摄入热量分析",\n  "badge": {\n    "text": "已超标",\n    "variant": "destructive"\n  },\n  "tabs": [\n    {\n      "label": "计算过程",\n      "value": "process",\n      "content": "根据以下逻辑，我计算得出你今日已摄入热量超标，总摄入为 2180 大卡。"\n    },\n    {\n      "label": "营养参数",\n      "value": "params",\n      "content": "基础代谢率(BMR): 1650 大卡\\n活动系数: 1.375（轻度运动）\\n目标热量: 1800 大卡/天\\n蛋白质目标: 90g | 碳水目标: 200g | 脂肪目标: 60g"\n    }\n  ],\n  "sections": [\n    {\n      "items": [\n        {\n          "label": "是否超标: 是",\n          "status": "success",\n          "detail": "实际摄入 2180 大卡 > 目标摄入 1800 大卡，超标 380 大卡"\n        },\n        {\n          "label": "建议减少量 380 大卡",\n          "status": "info",\n          "highlight": "推荐运动消耗 40分钟",\n          "detail": "慢跑 2400 大卡 - 早餐 520 大卡 - 午餐 860 大卡 - 晚餐 800 大卡 = 超标 380 大卡"\n        }\n      ]\n    },\n    {\n      "title": "总结",\n      "items": [\n        {\n          "label": "午餐摄入了高热量食物（炸鸡套餐），导致总热量偏高",\n          "status": "info"\n        },\n        {\n          "label": "按每日 1800 大卡目标，建议晚间增加 40 分钟有氧运动消耗多余热量",\n          "status": "info"\n        },\n        {\n          "label": "蛋白质摄入达标（95g/90g），但碳水超标 15%，建议减少精制碳水",\n          "status": "success"\n        }\n      ]\n    }\n  ],\n  "footer": {\n    "buttons": [\n      {\n        "text": "确认记录",\n        "variant": "default"\n      },\n      {\n        "text": "查看详情",\n        "variant": "outline"\n      }\n    ]\n  }\n}' +
    '\n```\n\n' +
    '---\n\n以上是根据你的饮食记录计算出的摄入热量分析报告，有任何问题，请随时问我。\n\n'

const MOCK_REPLY = [
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

export {
    MOCK_THINKING,
    MOCK_REPLY,
    MOCK_CALORIE_THINKING,
    MOCK_CALORIE_REPLY,
    MOCK_CODE_THINKING,
    MOCK_CODE_REPLAY,
    MOCK_TABLE_THINKING,
    MOCK_TABLE_REPLAY,
    MOCK_MERMAID_THINKING,
    MOCK_MERMAID_REPLAY,
    MOCK_MATH_THINKING,
    MOCK_MATH_REPLAY,
}