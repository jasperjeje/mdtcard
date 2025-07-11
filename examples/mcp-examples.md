# MCP 客户端配置示例

## Claude Desktop 配置

### 1. 找到配置文件

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%/Claude/claude_desktop_config.json`

### 2. 添加服务器配置

```json
{
  "mcpServers": {
    "markdown-to-card": {
      "command": "node",
      "args": ["path/to/mdtcard/dist/index.js", "--mcp"],
      "env": {
        "NODE_ENV": "production"
      }
    }
  }
}
```

### 3. 在Claude中使用

```
请帮我用markdown-to-card工具生成一张学习卡片：

标题：Python 基础语法
内容：
# Python 基础语法

## 变量和数据类型
```python
# 数字
age = 25
price = 99.99

# 字符串
name = "张三"
message = '你好，世界！'

# 布尔值
is_student = True
is_working = False

# 列表
fruits = ['苹果', '香蕉', '橙子']
numbers = [1, 2, 3, 4, 5]
```

## 控制结构
```python
# 条件语句
if age >= 18:
    print("成年人")
else:
    print("未成年人")

# 循环
for fruit in fruits:
    print(f"我喜欢{fruit}")

# while循环
count = 0
while count < 5:
    print(count)
    count += 1
```

请使用"温暖柔和"风格生成，标题设为"Python 学习笔记"，添加水印"学习笔记 - 2024"
```

## Cursor 配置

### 1. 安装 MCP 扩展

在 Cursor 中搜索并安装 MCP 相关扩展。

### 2. 配置 MCP 服务器

在工作区设置中添加：

```json
{
  "mcp.servers": [
    {
      "name": "markdown-to-card",
      "command": "node",
      "args": ["path/to/mdtcard/dist/index.js", "--mcp"],
      "cwd": "path/to/mdtcard"
    }
  ]
}
```

### 3. 使用示例

```typescript
// 在 Cursor 中使用 MCP 工具
// 通过命令面板或者代码补全功能调用

// 1. 列出所有样式
@mcp markdown-to-card list_styles

// 2. 生成代码学习卡片
@mcp markdown-to-card generate_card {
  "markdown": "# JavaScript 闭包\\n\\n闭包是指函数可以访问其外部作用域的变量...",
  "styleId": "tech-blue",
  "title": "JavaScript 进阶",
  "watermark": "编程学习"
}
```

## 其他 MCP 客户端

### 1. MCP CLI 客户端

```bash
# 安装 MCP CLI
npm install -g @modelcontextprotocol/cli

# 连接服务器
mcp connect "node path/to/mdtcard/dist/index.js --mcp"

# 使用工具
mcp call list_styles
mcp call generate_card '{"markdown": "# 测试", "styleId": "warm-soft"}'
```

### 2. 自定义 MCP 客户端

```javascript
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

class CardGeneratorClient {
    constructor() {
        this.client = new Client({
            name: "card-generator-client",
            version: "1.0.0"
        }, {
            capabilities: {}
        });
    }

    async connect() {
        const transport = new StdioClientTransport({
            command: 'node',
            args: ['path/to/mdtcard/dist/index.js', '--mcp']
        });
        
        await this.client.connect(transport);
    }

    async listStyles() {
        const result = await this.client.request({
            method: 'tools/call',
            params: {
                name: 'list_styles',
                arguments: {}
            }
        });
        return result;
    }

    async generateCard(markdown, styleId, options = {}) {
        const result = await this.client.request({
            method: 'tools/call',
            params: {
                name: 'generate_card',
                arguments: {
                    markdown,
                    styleId,
                    ...options
                }
            }
        });
        return result;
    }
}

// 使用示例
async function main() {
    const client = new CardGeneratorClient();
    await client.connect();
    
    const styles = await client.listStyles();
    console.log('可用样式:', styles);
    
    const card = await client.generateCard(
        '# 我的第一张卡片\\n\\n这是一个测试卡片',
        'warm-soft',
        {
            title: '测试卡片',
            watermark: 'MCP Demo'
        }
    );
    console.log('生成结果:', card);
}

main().catch(console.error);
```

## 与 Coze 集成

### 1. 创建 Coze 插件

```javascript
// coze-plugin.js
const axios = require('axios');

class MarkdownCardPlugin {
    constructor(apiUrl = 'http://localhost:3000') {
        this.apiUrl = apiUrl;
    }

    async generateCard(params) {
        try {
            const response = await axios.post(`${this.apiUrl}/api/generate`, params);
            return {
                success: true,
                data: response.data
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }
}

// Coze 插件接口
module.exports = {
    name: 'markdown-to-card',
    description: '将Markdown转换为精美卡片',
    version: '1.0.0',
    
    actions: {
        generate_card: {
            description: '生成Markdown卡片',
            parameters: {
                markdown: { type: 'string', required: true },
                styleId: { type: 'string', required: true },
                title: { type: 'string', required: false },
                watermark: { type: 'string', required: false }
            },
            handler: async (params) => {
                const plugin = new MarkdownCardPlugin();
                return await plugin.generateCard(params);
            }
        }
    }
};
```

### 2. 在 Coze 中使用

```yaml
# coze-workflow.yml
name: 学习卡片生成器
description: 自动将学习笔记转换为分享卡片

triggers:
  - type: text_input
    name: 笔记内容

steps:
  - name: 解析笔记
    type: text_processing
    config:
      extract_title: true
      format_content: true

  - name: 生成卡片
    type: plugin
    plugin: markdown-to-card
    action: generate_card
    parameters:
      markdown: "{{ steps.parse_notes.content }}"
      styleId: "{{ user.preferred_style | default('warm-soft') }}"
      title: "{{ steps.parse_notes.title }}"
      watermark: "{{ user.name }}的学习笔记"

  - name: 返回结果
    type: response
    config:
      message: "卡片生成完成！"
      attachments:
        - type: image
          url: "{{ steps.generate_card.imageUrl }}"
```

## 环境变量配置

```bash
# .env 文件
NODE_ENV=production
PORT=3000
OUTPUT_DIR=./output
MAX_IMAGE_SIZE=5000000
DEFAULT_STYLE=warm-soft
ENABLE_WATERMARK=true
```

## 故障排除

### 常见问题

1. **MCP 服务器无法启动**
   ```bash
   # 检查依赖
   npm install
   
   # 检查构建
   npm run build
   
   # 检查权限
   chmod +x dist/index.js
   ```

2. **Claude Desktop 无法连接**
   ```json
   // 检查配置文件路径和语法
   {
     "mcpServers": {
       "markdown-to-card": {
         "command": "node",
         "args": ["完整的绝对路径/mdtcard/dist/index.js", "--mcp"]
       }
     }
   }
   ```

3. **图片生成失败**
   ```bash
   # 检查 canvas 依赖
   npm install canvas
   
   # 在 macOS 上可能需要
   brew install pkg-config cairo pango libpng jpeg giflib librsvg
   ```

### 调试模式

```bash
# 启用调试日志
DEBUG=* npm run dev -- --mcp

# 或者使用 API 模式进行测试
npm run dev -- --api
curl http://localhost:3000/health
```