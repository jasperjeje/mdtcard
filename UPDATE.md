# 更新说明

## ✅ 完成的改进

### 1. 支持 JPG 格式输出

现在API接口支持生成JPG格式的图片：

```json
{
  "markdown": "# 标题\n内容",
  "styleId": "warm-soft",
  "format": "jpg",    // 新增：支持 "png" 或 "jpg"
  "quality": 90       // 新增：JPG质量 1-100
}
```

### 2. Web 可视化页面

创建了完整的Web界面，包含：

#### 功能特性
- 📝 **实时Markdown编辑器**：基于CodeMirror，支持语法高亮
- 👀 **实时预览**：输入500ms后自动预览，可手动触发
- 🎨 **22种样式选择**：可视化样式选择器，预览每种风格
- ⚙️ **完整配置选项**：
  - 基本设置：标题、水印
  - 尺寸设置：自定义宽高，预设尺寸
  - 格式设置：PNG/JPG，JPG质量调节
- 💾 **一键下载**：生成并直接下载
- 📚 **生成历史**：查看所有生成的图片
- 🖼️ **全屏预览**：模态框查看大图

#### 界面布局
- **左侧**：Markdown编辑器
- **中间**：配置面板
- **右侧**：实时预览
- **底部**：生成历史

## 🚀 使用方法

### 启动Web界面

```bash
# 启动API服务器（包含Web界面）
PORT=3001 npm run dev -- --api

# 访问Web界面
open http://localhost:3001
```

### 新的API参数

```bash
# 生成JPG格式
curl -X POST http://localhost:3001/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "markdown": "# 测试",
    "styleId": "warm-soft",
    "format": "jpg",
    "quality": 85,
    "title": "我的卡片"
  }'

# 预览功能
curl -X POST http://localhost:3001/api/preview \
  -H "Content-Type: application/json" \
  -d '{
    "markdown": "# 测试",
    "styleId": "warm-soft"
  }'
```

## 🛠️ 技术实现

### 前端技术栈
- **HTML5 + CSS3**：响应式设计
- **Vanilla JavaScript**：无框架依赖
- **CodeMirror 5**：代码编辑器
- **CSS Grid + Flexbox**：现代布局
- **渐变背景**：视觉美化

### 后端改进
- **图片格式支持**：PNG/JPG输出
- **静态文件服务**：Express静态文件中间件
- **CORS支持**：跨域请求
- **错误处理**：完善的错误信息

### 文件结构
```
public/
├── index.html      # 主页面
├── css/
│   └── style.css   # 样式文件
└── js/
    └── app.js      # 前端逻辑
```

## 🎯 下一步计划

- [ ] 添加更多Markdown语法支持（数学公式、流程图）
- [ ] 支持自定义字体上传
- [ ] 添加模板库
- [ ] 支持批量生成
- [ ] 添加图片压缩选项
- [ ] 支持WebP格式

## 📝 使用示例

1. **打开Web界面**：访问 http://localhost:3001
2. **输入内容**：在左侧编辑器输入Markdown
3. **选择样式**：从22种风格中选择喜欢的
4. **配置选项**：设置标题、水印、尺寸等
5. **实时预览**：右侧查看效果
6. **生成下载**：点击"生成并下载"按钮

现在你拥有了一个功能完整的Markdown转卡片工具！🎉