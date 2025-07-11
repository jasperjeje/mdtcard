# Markdown to Card - MCP工具

一个强大的MCP工具，用于将Markdown文档转换为精美的知识卡片图像，支持多种卡片风格，适用于博客、社交媒体分享。

## 功能特性

### 🎨 多种卡片风格
支持20+种精美卡片风格：
- 温暖柔和 - 适合生活分享
- 简约高级灰 - 专业商务风格
- 梦幻渐变 - 创意设计风格
- 清新自然 - 绿色环保主题
- 科技蓝 - 技术内容专用
- 优雅紫 - 高端典雅风格
- 活力橙 - 充满活力的设计
- 更多风格...

### 📝 完整的Markdown支持
- ✅ 标题（H1-H6）
- ✅ 段落和文本样式
- ✅ 有序和无序列表
- ✅ 代码块（支持语法高亮）
- ✅ 引用块
- ✅ 表格
- ✅ 分割线
- ✅ 数学公式（计划支持）
- ✅ 流程图和时序图（计划支持）

### 🚀 多种使用方式
- **MCP服务器** - 与Claude、Cursor等AI工具集成
- **API服务** - HTTP接口，可集成到任何应用
- **命令行工具** - 直接在终端使用

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 构建项目

```bash
npm run build
```

### 3. 运行服务

#### 作为MCP服务器运行
```bash
npm run dev -- --mcp
```

#### 作为API服务器运行
```bash
npm run dev -- --api
```

## 使用方法

### MCP服务器模式

MCP服务器提供以下工具：

#### 1. 列出所有可用样式
```typescript
// 工具名称: list_styles
// 参数: 无
// 返回: 所有可用样式的列表
```

#### 2. 获取特定样式详情
```typescript
// 工具名称: get_style
// 参数: { styleId: string }
// 返回: 样式的详细配置
```

#### 3. 预览卡片
```typescript
// 工具名称: preview_card
// 参数: {
//   markdown: string,
//   styleId: string,
//   width?: number,
//   height?: number,
//   title?: string,
//   watermark?: string
// }
// 返回: base64格式的图片数据
```

#### 4. 生成并保存卡片
```typescript
// 工具名称: generate_card
// 参数: {
//   markdown: string,
//   styleId: string,
//   width?: number,
//   height?: number,
//   title?: string,
//   watermark?: string,
//   filename?: string
// }
// 返回: 保存的文件信息
```

#### 5. 列出生成的图片
```typescript
// 工具名称: list_generated_images
// 参数: 无
// 返回: 所有生成图片的列表
```

#### 6. 删除图片
```typescript
// 工具名称: delete_image
// 参数: { filename: string }
// 返回: 删除结果
```

### API服务器模式

API服务器提供REST接口：

#### 获取所有样式
```http
GET /api/styles
```

#### 获取特定样式
```http
GET /api/styles/:id
```

#### 预览卡片
```http
POST /api/preview
Content-Type: application/json

{
  "markdown": "# 标题\n\n这是一个示例",
  "styleId": "warm-soft",
  "width": 800,
  "height": 1000,
  "title": "我的卡片",
  "watermark": "Created by MD-Card"
}
```

#### 生成卡片
```http
POST /api/generate
Content-Type: application/json

{
  "markdown": "# 标题\n\n这是一个示例",
  "styleId": "warm-soft",
  "width": 800,
  "height": 1000,
  "title": "我的卡片",
  "watermark": "Created by MD-Card",
  "filename": "my-card"
}
```

#### 获取生成的图片
```http
GET /api/images/:filename
```

#### 列出所有图片
```http
GET /api/images
```

#### 删除图片
```http
DELETE /api/images/:filename
```

## 样式配置

每个样式包含以下配置：

```typescript
interface CardStyle {
  name: string;           // 样式名称
  id: string;             // 样式ID
  backgroundColor: string; // 背景色
  textColor: string;      // 文本颜色
  headerColor: string;    // 标题颜色
  accentColor: string;    // 强调色
  borderRadius: number;   // 圆角大小
  padding: number;        // 内边距
  fontFamily: string;     // 字体
  fontSize: number;       // 字体大小
  lineHeight: number;     // 行高
  gradient?: {            // 渐变背景（可选）
    start: string;
    end: string;
    direction: 'horizontal' | 'vertical' | 'diagonal';
  };
  shadow?: {              // 阴影效果（可选）
    offsetX: number;
    offsetY: number;
    blur: number;
    color: string;
  };
}
```

## 与MCP客户端集成

### 在Claude Desktop中配置

在Claude Desktop的配置文件中添加：

```json
{
  "mcpServers": {
    "markdown-to-card": {
      "command": "node",
      "args": ["path/to/mdtcard/dist/index.js", "--mcp"]
    }
  }
}
```

### 在Cursor中使用

1. 安装MCP扩展
2. 配置服务器地址
3. 开始使用卡片生成功能

## 开发

### 项目结构
```
src/
├── api/           # API服务器
├── styles/        # 卡片样式定义
├── types/         # TypeScript类型定义
├── utils/         # 工具函数
├── mcp-server.ts  # MCP服务器实现
└── index.ts       # 主入口文件
```

### 添加新样式

1. 在 `src/styles/cardStyles.ts` 中添加新样式
2. 确保样式ID唯一
3. 测试样式效果
4. 提交更改

### 扩展功能

- 添加新的Markdown语法支持
- 实现更多图片格式输出
- 添加动画效果
- 支持自定义字体

## 常见问题

### Q: 如何自定义样式？
A: 修改 `src/styles/cardStyles.ts` 文件，添加新的样式配置。

### Q: 支持哪些图片格式？
A: 目前支持PNG格式，计划添加JPEG、WebP等格式。

### Q: 如何处理中文字体？
A: 在样式配置中指定中文字体，如 "PingFang SC, Microsoft YaHei"。

### Q: 图片生成速度慢怎么办？
A: 可以降低图片尺寸或者使用更简单的样式来提高生成速度。

## 许可证

MIT License

## 贡献

欢迎提交Issue和Pull Request来改进这个工具！

## 更新日志

### v1.0.0
- 初始版本发布
- 支持20+种卡片样式
- 完整的Markdown语法支持
- MCP和API双模式支持
- 实时预览和图片生成功能