# API使用示例

## 基本使用

```bash
# 启动API服务器
npm run dev -- --api

# 获取所有样式
curl http://localhost:3000/api/styles

# 预览卡片
curl -X POST http://localhost:3000/api/preview \
  -H "Content-Type: application/json" \
  -d '{
    "markdown": "# 我的第一张卡片\n\n这是一个**测试**卡片，包含：\n\n- 标题\n- 粗体文本\n- 列表项\n\n```javascript\nconsole.log(\"Hello World\");\n```",
    "styleId": "warm-soft",
    "title": "学习笔记",
    "watermark": "Created by MD-Card"
  }'

# 生成并保存卡片
curl -X POST http://localhost:3000/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "markdown": "# JavaScript 基础\n\n## 变量声明\n\n```javascript\nconst name = \"张三\";\nlet age = 25;\nvar isStudent = true;\n```\n\n## 数据类型\n\n1. **基本类型**\n   - String\n   - Number\n   - Boolean\n   - Undefined\n   - Null\n\n2. **引用类型**\n   - Object\n   - Array\n   - Function\n\n> 💡 **提示**: 优先使用 `const` 和 `let`，避免使用 `var`",
    "styleId": "tech-blue",
    "title": "JavaScript 学习笔记",
    "watermark": "学习笔记 - 2024"
  }'
```

## Python 示例

```python
import requests
import json
import base64
from io import BytesIO
from PIL import Image

class MarkdownCardGenerator:
    def __init__(self, base_url="http://localhost:3000"):
        self.base_url = base_url
    
    def get_styles(self):
        """获取所有可用样式"""
        response = requests.get(f"{self.base_url}/api/styles")
        return response.json()
    
    def preview_card(self, markdown, style_id, **kwargs):
        """预览卡片"""
        data = {
            "markdown": markdown,
            "styleId": style_id,
            **kwargs
        }
        response = requests.post(f"{self.base_url}/api/preview", json=data)
        return response.json()
    
    def generate_card(self, markdown, style_id, **kwargs):
        """生成并保存卡片"""
        data = {
            "markdown": markdown,
            "styleId": style_id,
            **kwargs
        }
        response = requests.post(f"{self.base_url}/api/generate", json=data)
        return response.json()
    
    def save_preview_image(self, markdown, style_id, filename, **kwargs):
        """预览并保存图片到本地"""
        result = self.preview_card(markdown, style_id, **kwargs)
        if result['success']:
            # 解码base64图片
            image_data = result['data']['image']
            image_data = image_data.split(',')[1]  # 移除data:image/png;base64,前缀
            
            # 保存图片
            image_bytes = base64.b64decode(image_data)
            with open(filename, 'wb') as f:
                f.write(image_bytes)
            
            print(f"图片已保存到: {filename}")
        else:
            print(f"生成失败: {result['error']}")

# 使用示例
generator = MarkdownCardGenerator()

# 获取所有样式
styles = generator.get_styles()
print("可用样式:")
for style in styles['data']:
    print(f"- {style['name']} (ID: {style['id']})")

# 生成卡片
markdown_content = """
# Python 数据结构

## 列表 (List)
```python
fruits = ['apple', 'banana', 'orange']
fruits.append('grape')
print(fruits[0])  # apple
```

## 字典 (Dictionary)
```python
person = {
    'name': '张三',
    'age': 30,
    'city': '北京'
}
print(person['name'])  # 张三
```

## 集合 (Set)
```python
numbers = {1, 2, 3, 4, 5}
numbers.add(6)
print(len(numbers))  # 6
```

> **重要**: 选择合适的数据结构可以提高程序效率
"""

# 预览并保存
generator.save_preview_image(
    markdown_content,
    "tech-blue",
    "python-data-structures.png",
    title="Python 数据结构指南",
    watermark="Python 学习笔记"
)
```

## Node.js 示例

```javascript
const axios = require('axios');
const fs = require('fs');

class MarkdownCardGenerator {
    constructor(baseUrl = 'http://localhost:3000') {
        this.baseUrl = baseUrl;
    }

    async getStyles() {
        const response = await axios.get(`${this.baseUrl}/api/styles`);
        return response.data;
    }

    async previewCard(markdown, styleId, options = {}) {
        const data = {
            markdown,
            styleId,
            ...options
        };
        const response = await axios.post(`${this.baseUrl}/api/preview`, data);
        return response.data;
    }

    async generateCard(markdown, styleId, options = {}) {
        const data = {
            markdown,
            styleId,
            ...options
        };
        const response = await axios.post(`${this.baseUrl}/api/generate`, data);
        return response.data;
    }

    async savePreviewImage(markdown, styleId, filename, options = {}) {
        const result = await this.previewCard(markdown, styleId, options);
        if (result.success) {
            const base64Data = result.data.image.replace(/^data:image\/png;base64,/, '');
            fs.writeFileSync(filename, base64Data, 'base64');
            console.log(`图片已保存到: ${filename}`);
        } else {
            console.error(`生成失败: ${result.error}`);
        }
    }
}

// 使用示例
async function main() {
    const generator = new MarkdownCardGenerator();

    // 获取所有样式
    const styles = await generator.getStyles();
    console.log('可用样式:');
    styles.data.forEach(style => {
        console.log(`- ${style.name} (ID: ${style.id})`);
    });

    // 生成学习笔记卡片
    const markdownContent = `
# React Hooks 指南

## useState Hook
\`\`\`jsx
import { useState } from 'react';

function Counter() {
    const [count, setCount] = useState(0);
    
    return (
        <div>
            <p>Count: {count}</p>
            <button onClick={() => setCount(count + 1)}>
                Increment
            </button>
        </div>
    );
}
\`\`\`

## useEffect Hook
\`\`\`jsx
import { useEffect, useState } from 'react';

function UserProfile({ userId }) {
    const [user, setUser] = useState(null);
    
    useEffect(() => {
        fetchUser(userId).then(setUser);
    }, [userId]);
    
    return <div>{user?.name}</div>;
}
\`\`\`

## 最佳实践

1. **总是使用依赖数组**
2. **避免在循环中使用 Hooks**
3. **使用自定义 Hooks 复用逻辑**

> 💡 **提示**: Hooks 让函数组件拥有状态管理能力
`;

    // 生成多种风格的卡片
    const styles_to_generate = ['tech-blue', 'minimal-gray', 'warm-soft'];
    
    for (const styleId of styles_to_generate) {
        await generator.savePreviewImage(
            markdownContent,
            styleId,
            `react-hooks-${styleId}.png`,
            {
                title: 'React Hooks 学习指南',
                watermark: 'React 学习笔记',
                width: 800,
                height: 1200
            }
        );
    }
}

main().catch(console.error);
```

## 批量生成示例

```javascript
// 批量生成不同主题的学习卡片
const topics = [
    {
        title: 'JavaScript 异步编程',
        content: `
# JavaScript 异步编程

## Promise
\`\`\`javascript
const fetchData = () => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            resolve('Data loaded');
        }, 1000);
    });
};

fetchData()
    .then(data => console.log(data))
    .catch(error => console.error(error));
\`\`\`

## Async/Await
\`\`\`javascript
async function loadData() {
    try {
        const data = await fetchData();
        console.log(data);
    } catch (error) {
        console.error(error);
    }
}
\`\`\`
`,
        style: 'tech-blue'
    },
    {
        title: 'CSS 布局技巧',
        content: `
# CSS 布局技巧

## Flexbox
\`\`\`css
.container {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100vh;
}

.item {
    flex: 1;
    margin: 10px;
}
\`\`\`

## Grid
\`\`\`css
.grid-container {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 20px;
}
\`\`\`
`,
        style: 'dreamy-gradient'
    },
    {
        title: '数据库设计原则',
        content: `
# 数据库设计原则

## 第一范式 (1NF)
- 每个字段都是原子性的
- 不可再分割

## 第二范式 (2NF)
- 满足1NF
- 非主属性完全依赖于主键

## 第三范式 (3NF)
- 满足2NF
- 非主属性不依赖于其他非主属性

> **重要**: 良好的数据库设计可以提高查询效率
`,
        style: 'minimal-gray'
    }
];

async function generateBatchCards() {
    const generator = new MarkdownCardGenerator();
    
    for (const topic of topics) {
        await generator.savePreviewImage(
            topic.content,
            topic.style,
            `${topic.title.replace(/\s+/g, '-').toLowerCase()}.png`,
            {
                title: topic.title,
                watermark: '技术学习笔记',
                width: 800,
                height: 1000
            }
        );
        
        // 避免请求过快
        await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.log('所有卡片生成完成！');
}

generateBatchCards().catch(console.error);
```