class MarkdownCardApp {
    constructor() {
        this.editor = null;
        this.styles = [];
        this.currentPreview = null;
        this.selectedStyleId = 'warm-soft';
        this.debounceTimer = null;
        
        this.init();
    }

    async init() {
        this.setupEditor();
        this.setupEventListeners();
        await this.loadStyles();
        this.loadExample();
        this.loadHistory();
    }

    setupEditor() {
        const textarea = document.getElementById('markdownEditor');
        this.editor = CodeMirror.fromTextArea(textarea, {
            mode: 'markdown',
            theme: 'monokai',
            lineNumbers: true,
            lineWrapping: true,
            autoCloseBrackets: true,
            matchBrackets: true,
            placeholder: '在这里输入 Markdown 内容...'
        });

        // 监听编辑器变化
        this.editor.on('change', () => {
            this.debouncePreview();
        });
    }

    setupEventListeners() {
        // 质量滑块
        const qualitySlider = document.getElementById('quality');
        const qualityValue = document.getElementById('qualityValue');
        qualitySlider.addEventListener('input', (e) => {
            qualityValue.textContent = e.target.value;
        });

        // 预设尺寸按钮
        document.querySelectorAll('.preset-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const [width, height] = e.target.dataset.size.split(',');
                document.getElementById('width').value = width;
                document.getElementById('height').value = height;
                // 如果设置了预设尺寸，取消自动高度
                document.getElementById('autoHeight').checked = false;
                this.toggleHeightControls();
            });
        });

        // 自动高度复选框
        document.getElementById('autoHeight').addEventListener('change', () => {
            this.toggleHeightControls();
            this.debouncePreview();
        });

        // 按钮事件
        document.getElementById('clearBtn').addEventListener('click', () => {
            this.editor.setValue('');
        });

        document.getElementById('exampleBtn').addEventListener('click', () => {
            this.loadExample();
        });

        document.getElementById('previewBtn').addEventListener('click', () => {
            this.generatePreview();
        });

        document.getElementById('generateBtn').addEventListener('click', () => {
            this.generateAndDownload();
        });

        document.getElementById('downloadBtn').addEventListener('click', () => {
            this.downloadCurrentPreview();
        });

        document.getElementById('fullscreenBtn').addEventListener('click', () => {
            this.showFullscreen();
        });

        document.getElementById('refreshHistoryBtn').addEventListener('click', () => {
            this.loadHistory();
        });

        // 模态框关闭
        document.getElementById('closeModal').addEventListener('click', () => {
            document.getElementById('fullscreenModal').style.display = 'none';
        });

        // 点击模态框外部关闭
        document.getElementById('fullscreenModal').addEventListener('click', (e) => {
            if (e.target.id === 'fullscreenModal') {
                document.getElementById('fullscreenModal').style.display = 'none';
            }
        });

        // 配置项变化时重新预览
        ['title', 'watermark', 'width', 'height', 'format', 'quality', 'minHeight', 'maxHeight'].forEach(id => {
            document.getElementById(id).addEventListener('change', () => {
                this.debouncePreview();
            });
        });
        
        // 初始化界面状态
        this.toggleHeightControls();
    }

    async loadStyles() {
        try {
            const response = await fetch('/api/styles');
            const result = await response.json();
            
            if (result.success) {
                this.styles = result.data;
                this.renderStyles();
            } else {
                console.error('加载样式失败:', result.error);
            }
        } catch (error) {
            console.error('加载样式出错:', error);
        }
    }

    renderStyles() {
        const styleGrid = document.getElementById('styleGrid');
        styleGrid.innerHTML = '';

        this.styles.forEach(style => {
            const styleItem = document.createElement('div');
            styleItem.className = 'style-item';
            styleItem.dataset.styleId = style.id;
            
            if (style.id === this.selectedStyleId) {
                styleItem.classList.add('selected');
            }

            const preview = document.createElement('div');
            preview.className = 'style-preview';
            preview.style.background = style.preview.backgroundColor;
            preview.style.color = style.preview.textColor;
            preview.textContent = 'Aa';

            const name = document.createElement('div');
            name.className = 'style-name';
            name.textContent = style.name;

            styleItem.appendChild(preview);
            styleItem.appendChild(name);

            styleItem.addEventListener('click', () => {
                this.selectStyle(style.id);
            });

            styleGrid.appendChild(styleItem);
        });
    }

    selectStyle(styleId) {
        this.selectedStyleId = styleId;
        
        // 更新选中状态
        document.querySelectorAll('.style-item').forEach(item => {
            item.classList.remove('selected');
        });
        
        const selectedItem = document.querySelector(`[data-style-id="${styleId}"]`);
        if (selectedItem) {
            selectedItem.classList.add('selected');
        }

        this.debouncePreview();
    }

    loadExample() {
        const exampleMarkdown = `# JavaScript 学习笔记

## 变量声明

JavaScript 有三种声明变量的方式：

\`\`\`javascript
// 使用 const 声明常量
const PI = 3.14159;

// 使用 let 声明变量
let userName = "张三";

// 使用 var 声明变量（不推荐）
var age = 25;
\`\`\`

## 数据类型

### 基本数据类型
- **String**: 字符串
- **Number**: 数字
- **Boolean**: 布尔值
- **Undefined**: 未定义
- **Null**: 空值

### 引用数据类型
- **Object**: 对象
- **Array**: 数组
- **Function**: 函数

## 条件语句

\`\`\`javascript
if (age >= 18) {
    console.log("成年人");
} else {
    console.log("未成年人");
}
\`\`\`

## 循环语句

\`\`\`javascript
// for 循环
for (let i = 0; i < 5; i++) {
    console.log(i);
}

// while 循环
let count = 0;
while (count < 3) {
    console.log(count);
    count++;
}
\`\`\`

> 💡 **提示**: 优先使用 \`const\` 和 \`let\`，避免使用 \`var\`

---

**学习重点**：
1. 理解变量声明的区别
2. 掌握基本数据类型
3. 熟练使用条件和循环语句`;

        this.editor.setValue(exampleMarkdown);
    }

    debouncePreview() {
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
        }
        
        this.debounceTimer = setTimeout(() => {
            this.generatePreview();
        }, 500);
    }

    async generatePreview() {
        const markdown = this.editor.getValue();
        if (!markdown.trim()) {
            this.showPreviewPlaceholder();
            return;
        }

        const config = this.getConfig();
        this.showLoading();

        try {
            const response = await fetch('/api/preview', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    markdown,
                    styleId: this.selectedStyleId,
                    ...config
                })
            });

            const result = await response.json();
            
            if (result.success) {
                this.showPreview(result.data.image, result.data);
                this.currentPreview = result.data.image;
                document.getElementById('downloadBtn').disabled = false;
            } else {
                console.error('预览失败:', result.error);
                this.showPreviewError(result.error);
            }
        } catch (error) {
            console.error('预览出错:', error);
            this.showPreviewError('网络错误');
        } finally {
            this.hideLoading();
        }
    }

    async generateAndDownload() {
        const markdown = this.editor.getValue();
        if (!markdown.trim()) {
            alert('请先输入 Markdown 内容');
            return;
        }

        const config = this.getConfig();
        this.showLoading();

        try {
            const response = await fetch('/api/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    markdown,
                    styleId: this.selectedStyleId,
                    ...config
                })
            });

            const result = await response.json();
            
            if (result.success) {
                // 直接下载文件
                const link = document.createElement('a');
                link.href = result.imageUrl;
                link.download = result.data.filename;
                link.click();
                
                // 刷新历史记录
                this.loadHistory();
            } else {
                console.error('生成失败:', result.error);
                alert('生成失败: ' + result.error);
            }
        } catch (error) {
            console.error('生成出错:', error);
            alert('生成出错: ' + error.message);
        } finally {
            this.hideLoading();
        }
    }

    getConfig() {
        const autoHeight = document.getElementById('autoHeight').checked;
        return {
            title: document.getElementById('title').value,
            watermark: document.getElementById('watermark').value,
            width: parseInt(document.getElementById('width').value),
            height: parseInt(document.getElementById('height').value),
            format: document.getElementById('format').value,
            quality: parseInt(document.getElementById('quality').value),
            autoHeight: autoHeight,
            minHeight: parseInt(document.getElementById('minHeight').value),
            maxHeight: parseInt(document.getElementById('maxHeight').value)
        };
    }

    toggleHeightControls() {
        const autoHeight = document.getElementById('autoHeight').checked;
        const heightInput = document.getElementById('height');
        const heightLimits = document.getElementById('heightLimits');
        
        if (autoHeight) {
            heightInput.disabled = true;
            heightInput.style.opacity = '0.5';
            heightLimits.classList.remove('disabled');
        } else {
            heightInput.disabled = false;
            heightInput.style.opacity = '1';
            heightLimits.classList.add('disabled');
        }
    }

    showPreview(imageData, metadata) {
        const container = document.getElementById('previewContainer');
        let sizeInfo = '';
        
        if (metadata) {
            sizeInfo = `<div class="size-info">尺寸: ${metadata.width} × ${metadata.height} px`;
            if (metadata.autoHeight) {
                sizeInfo += ' (自动高度)';
            }
            sizeInfo += `</div>`;
        }
        
        container.innerHTML = `
            ${sizeInfo}
            <img src="${imageData}" alt="预览图片" class="preview-image">
        `;
    }

    showPreviewPlaceholder() {
        const container = document.getElementById('previewContainer');
        container.innerHTML = `
            <div class="preview-placeholder">
                <div class="placeholder-icon">🖼️</div>
                <p>点击"实时预览"查看效果</p>
            </div>
        `;
        document.getElementById('downloadBtn').disabled = true;
    }

    showPreviewError(error) {
        const container = document.getElementById('previewContainer');
        container.innerHTML = `
            <div class="preview-placeholder">
                <div class="placeholder-icon">❌</div>
                <p>预览失败: ${error}</p>
            </div>
        `;
        document.getElementById('downloadBtn').disabled = true;
    }

    downloadCurrentPreview() {
        if (!this.currentPreview) {
            alert('没有可下载的预览图片');
            return;
        }

        const link = document.createElement('a');
        link.href = this.currentPreview;
        link.download = `markdown-card-preview.${document.getElementById('format').value}`;
        link.click();
    }

    showFullscreen() {
        if (!this.currentPreview) {
            alert('没有可查看的预览图片');
            return;
        }

        const modal = document.getElementById('fullscreenModal');
        const image = document.getElementById('fullscreenImage');
        
        image.src = this.currentPreview;
        modal.style.display = 'block';
    }

    async loadHistory() {
        try {
            const response = await fetch('/api/images');
            const result = await response.json();
            
            if (result.success) {
                this.renderHistory(result.data);
            } else {
                console.error('加载历史记录失败:', result.error);
            }
        } catch (error) {
            console.error('加载历史记录出错:', error);
        }
    }

    renderHistory(images) {
        const historyGrid = document.getElementById('historyGrid');
        
        if (images.length === 0) {
            historyGrid.innerHTML = '<p style="text-align: center; color: #999;">暂无生成记录</p>';
            return;
        }

        historyGrid.innerHTML = '';

        images.forEach(image => {
            const historyItem = document.createElement('div');
            historyItem.className = 'history-item';

            const img = document.createElement('img');
            img.src = image.url;
            img.alt = image.filename;
            img.className = 'history-image';

            const info = document.createElement('div');
            info.className = 'history-info';

            const filename = document.createElement('div');
            filename.className = 'history-filename';
            filename.textContent = image.filename;

            const meta = document.createElement('div');
            meta.className = 'history-meta';
            meta.innerHTML = `
                <span>${this.formatFileSize(image.size)}</span>
                <span>${this.formatDate(image.created)}</span>
            `;

            info.appendChild(filename);
            info.appendChild(meta);
            historyItem.appendChild(img);
            historyItem.appendChild(info);

            // 点击下载
            historyItem.addEventListener('click', () => {
                const link = document.createElement('a');
                link.href = image.url;
                link.download = image.filename;
                link.click();
            });

            historyGrid.appendChild(historyItem);
        });
    }

    formatFileSize(bytes) {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('zh-CN') + ' ' + date.toLocaleTimeString('zh-CN', {
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    showLoading() {
        document.getElementById('loadingOverlay').style.display = 'block';
    }

    hideLoading() {
        document.getElementById('loadingOverlay').style.display = 'none';
    }
}

// 页面加载完成后初始化应用
document.addEventListener('DOMContentLoaded', () => {
    new MarkdownCardApp();
});