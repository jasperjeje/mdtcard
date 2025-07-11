import { createCanvas, CanvasRenderingContext2D, registerFont } from 'canvas';
import { CardConfig, CardStyle, MarkdownContent } from '../types/index.js';
import fs from 'fs';
import path from 'path';

export class ImageGenerator {
  private canvas: any;
  private ctx: CanvasRenderingContext2D;
  private config: CardConfig;

  constructor(config: CardConfig) {
    this.config = config;
    
    // 如果启用自动高度，先计算内容高度
    if (config.autoHeight) {
      const calculatedHeight = this.calculateRequiredHeight();
      this.config.height = calculatedHeight;
    }
    
    this.canvas = createCanvas(this.config.width, this.config.height);
    this.ctx = this.canvas.getContext('2d');
    this.setupCanvas();
  }

  private setupCanvas(): void {
    const { style } = this.config;
    
    // 设置背景
    if (style.gradient) {
      this.applyGradient(style.gradient);
    } else {
      this.ctx.fillStyle = style.backgroundColor;
      this.ctx.fillRect(0, 0, this.config.width, this.config.height);
    }

    // 设置圆角
    if (style.borderRadius > 0) {
      this.ctx.beginPath();
      this.roundRect(0, 0, this.config.width, this.config.height, style.borderRadius);
      this.ctx.clip();
    }
  }

  private applyGradient(gradient: CardStyle['gradient']): void {
    if (!gradient) return;

    let gradientObj;
    const { start, end, direction } = gradient;

    switch (direction) {
      case 'horizontal':
        gradientObj = this.ctx.createLinearGradient(0, 0, this.config.width, 0);
        break;
      case 'vertical':
        gradientObj = this.ctx.createLinearGradient(0, 0, 0, this.config.height);
        break;
      case 'diagonal':
        gradientObj = this.ctx.createLinearGradient(0, 0, this.config.width, this.config.height);
        break;
      default:
        gradientObj = this.ctx.createLinearGradient(0, 0, 0, this.config.height);
    }

    gradientObj.addColorStop(0, start);
    gradientObj.addColorStop(1, end);
    this.ctx.fillStyle = gradientObj;
    this.ctx.fillRect(0, 0, this.config.width, this.config.height);
  }

  private roundRect(x: number, y: number, width: number, height: number, radius: number): void {
    this.ctx.beginPath();
    this.ctx.moveTo(x + radius, y);
    this.ctx.arcTo(x + width, y, x + width, y + height, radius);
    this.ctx.arcTo(x + width, y + height, x, y + height, radius);
    this.ctx.arcTo(x, y + height, x, y, radius);
    this.ctx.arcTo(x, y, x + width, y, radius);
    this.ctx.closePath();
  }

  public async generateImage(): Promise<Buffer> {
    const { style, content, format = 'png', quality = 90 } = this.config;
    let currentY = style.padding;

    // 绘制标题
    if (this.config.title) {
      this.drawTitle(this.config.title, currentY);
      currentY += style.fontSize * 2.5;
    }

    // 绘制内容
    for (const item of content) {
      const height = this.drawContent(item, currentY);
      currentY += height + style.fontSize * 0.5;
    }

    // 绘制水印
    if (this.config.watermark) {
      this.drawWatermark(this.config.watermark);
    }

    // 根据格式返回不同的Buffer
    if (format === 'jpg' || format === 'jpeg') {
      return this.canvas.toBuffer('image/jpeg', { quality: quality / 100 });
    } else {
      return this.canvas.toBuffer('image/png');
    }
  }

  private drawTitle(title: string, y: number): void {
    const { style } = this.config;
    this.ctx.font = `bold ${style.fontSize * 1.5}px ${style.fontFamily}`;
    this.ctx.fillStyle = style.headerColor;
    this.ctx.textAlign = 'center';
    this.ctx.fillText(title, this.config.width / 2, y + style.fontSize * 1.5);
  }

  private drawContent(content: MarkdownContent, y: number): number {
    const { style } = this.config;
    const maxWidth = this.config.width - style.padding * 2;
    
    switch (content.type) {
      case 'heading':
        return this.drawHeading(content, y, maxWidth);
      case 'paragraph':
        return this.drawParagraph(content, y, maxWidth);
      case 'list':
      case 'ordered_list':
        return this.drawList(content, y, maxWidth);
      case 'code':
        return this.drawCode(content, y, maxWidth);
      case 'blockquote':
        return this.drawBlockquote(content, y, maxWidth);
      case 'table':
        return this.drawTable(content, y, maxWidth);
      case 'hr':
        return this.drawHorizontalRule(y, maxWidth);
      default:
        return 0;
    }
  }

  private drawHeading(content: MarkdownContent, y: number, maxWidth: number): number {
    const { style } = this.config;
    const level = content.level || 1;
    const fontSize = style.fontSize * (2 - level * 0.2);
    
    this.ctx.font = `bold ${fontSize}px ${style.fontFamily}`;
    this.ctx.fillStyle = style.headerColor;
    this.ctx.textAlign = 'left';
    
    const lines = this.wrapText(content.content, maxWidth, fontSize);
    let currentY = y + fontSize;
    
    for (const line of lines) {
      this.ctx.fillText(line, style.padding, currentY);
      currentY += fontSize * style.lineHeight;
    }
    
    return lines.length * fontSize * style.lineHeight;
  }

  private drawParagraph(content: MarkdownContent, y: number, maxWidth: number): number {
    const { style } = this.config;
    
    this.ctx.font = `${style.fontSize}px ${style.fontFamily}`;
    this.ctx.fillStyle = style.textColor;
    this.ctx.textAlign = 'left';
    
    const lines = this.wrapText(content.content, maxWidth, style.fontSize);
    let currentY = y + style.fontSize;
    
    for (const line of lines) {
      this.ctx.fillText(line, style.padding, currentY);
      currentY += style.fontSize * style.lineHeight;
    }
    
    return lines.length * style.fontSize * style.lineHeight;
  }

  private drawList(content: MarkdownContent, y: number, maxWidth: number): number {
    const { style } = this.config;
    const isOrdered = content.type === 'ordered_list';
    
    this.ctx.font = `${style.fontSize}px ${style.fontFamily}`;
    this.ctx.fillStyle = style.textColor;
    this.ctx.textAlign = 'left';
    
    let currentY = y + style.fontSize;
    const bulletWidth = 20;
    
    content.items?.forEach((item, index) => {
      const bullet = isOrdered ? `${index + 1}.` : '•';
      
      // 绘制项目符号
      this.ctx.fillText(bullet, style.padding, currentY);
      
      // 绘制项目内容
      const itemMaxWidth = maxWidth - bulletWidth;
      const lines = this.wrapText(item, itemMaxWidth, style.fontSize);
      
      for (const line of lines) {
        this.ctx.fillText(line, style.padding + bulletWidth, currentY);
        currentY += style.fontSize * style.lineHeight;
      }
    });
    
    return currentY - y;
  }

  private drawCode(content: MarkdownContent, y: number, maxWidth: number): number {
    const { style } = this.config;
    
    // 绘制代码块背景
    const codeHeight = this.estimateCodeHeight(content.content, maxWidth);
    this.ctx.fillStyle = this.adjustColorOpacity(style.accentColor, 0.1);
    this.ctx.fillRect(style.padding, y, maxWidth, codeHeight);
    
    // 绘制代码内容
    this.ctx.font = `${style.fontSize * 0.9}px Monaco, monospace`;
    this.ctx.fillStyle = style.textColor;
    this.ctx.textAlign = 'left';
    
    const lines = content.content.split('\n');
    let currentY = y + style.fontSize;
    
    for (const line of lines) {
      this.ctx.fillText(line, style.padding + 10, currentY);
      currentY += style.fontSize * style.lineHeight;
    }
    
    return codeHeight;
  }

  private drawBlockquote(content: MarkdownContent, y: number, maxWidth: number): number {
    const { style } = this.config;
    
    // 绘制左侧边框
    this.ctx.fillStyle = style.accentColor;
    this.ctx.fillRect(style.padding, y, 4, this.estimateTextHeight(content.content, maxWidth - 20));
    
    // 绘制引用内容
    this.ctx.font = `italic ${style.fontSize}px ${style.fontFamily}`;
    this.ctx.fillStyle = style.textColor;
    this.ctx.textAlign = 'left';
    
    const lines = this.wrapText(content.content, maxWidth - 20, style.fontSize);
    let currentY = y + style.fontSize;
    
    for (const line of lines) {
      this.ctx.fillText(line, style.padding + 15, currentY);
      currentY += style.fontSize * style.lineHeight;
    }
    
    return lines.length * style.fontSize * style.lineHeight;
  }

  private drawTable(content: MarkdownContent, y: number, maxWidth: number): number {
    const { style } = this.config;
    const { headers, rows } = content;
    
    if (!headers || !rows) return 0;
    
    const colWidth = maxWidth / headers.length;
    let currentY = y;
    
    // 绘制表头
    this.ctx.font = `bold ${style.fontSize}px ${style.fontFamily}`;
    this.ctx.fillStyle = style.headerColor;
    this.ctx.textAlign = 'center';
    
    headers.forEach((header, index) => {
      const x = style.padding + index * colWidth + colWidth / 2;
      this.ctx.fillText(header, x, currentY + style.fontSize);
    });
    
    currentY += style.fontSize * style.lineHeight;
    
    // 绘制表格内容
    this.ctx.font = `${style.fontSize}px ${style.fontFamily}`;
    this.ctx.fillStyle = style.textColor;
    
    rows.forEach((row, rowIndex) => {
      // 交替行背景
      if (rowIndex % 2 === 0) {
        this.ctx.fillStyle = this.adjustColorOpacity(style.accentColor, 0.05);
        this.ctx.fillRect(style.padding, currentY, maxWidth, style.fontSize * style.lineHeight);
      }
      
      this.ctx.fillStyle = style.textColor;
      row.forEach((cell, colIndex) => {
        const x = style.padding + colIndex * colWidth + colWidth / 2;
        this.ctx.fillText(cell, x, currentY + style.fontSize);
      });
      
      currentY += style.fontSize * style.lineHeight;
    });
    
    return currentY - y;
  }

  private drawHorizontalRule(y: number, maxWidth: number): number {
    const { style } = this.config;
    
    this.ctx.strokeStyle = style.accentColor;
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.moveTo(style.padding, y + 10);
    this.ctx.lineTo(style.padding + maxWidth, y + 10);
    this.ctx.stroke();
    
    return 20;
  }

  private drawWatermark(watermark: string): void {
    const { style } = this.config;
    
    this.ctx.font = `${style.fontSize * 0.7}px ${style.fontFamily}`;
    this.ctx.fillStyle = this.adjustColorOpacity(style.textColor, 0.3);
    this.ctx.textAlign = 'right';
    this.ctx.fillText(watermark, this.config.width - style.padding, this.config.height - style.padding);
  }

  private wrapText(text: string, maxWidth: number, fontSize: number): string[] {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';
    
    this.ctx.font = `${fontSize}px ${this.config.style.fontFamily}`;
    
    for (const word of words) {
      const testLine = currentLine + (currentLine ? ' ' : '') + word;
      const metrics = this.ctx.measureText(testLine);
      
      if (metrics.width > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    
    if (currentLine) {
      lines.push(currentLine);
    }
    
    return lines;
  }

  private estimateTextHeight(text: string, maxWidth: number): number {
    const lines = this.wrapText(text, maxWidth, this.config.style.fontSize);
    return lines.length * this.config.style.fontSize * this.config.style.lineHeight;
  }

  private estimateCodeHeight(code: string, maxWidth: number): number {
    const lines = code.split('\n');
    return lines.length * this.config.style.fontSize * this.config.style.lineHeight + 20;
  }

  private adjustColorOpacity(color: string, opacity: number): string {
    if (color.startsWith('#')) {
      const r = parseInt(color.slice(1, 3), 16);
      const g = parseInt(color.slice(3, 5), 16);
      const b = parseInt(color.slice(5, 7), 16);
      return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    }
    return color;
  }

  private calculateRequiredHeight(): number {
    const { style, content, title, watermark, minHeight = 400, maxHeight = 5000 } = this.config;
    const maxWidth = this.config.width - style.padding * 2;
    
    // 创建临时canvas用于测量
    const tempCanvas = createCanvas(this.config.width, 100);
    const tempCtx = tempCanvas.getContext('2d');
    
    let totalHeight = style.padding; // 顶部padding
    
    // 标题高度
    if (title) {
      tempCtx.font = `bold ${style.fontSize * 1.5}px ${style.fontFamily}`;
      const titleLines = this.wrapTextWithContext(title, maxWidth, style.fontSize * 1.5, tempCtx);
      totalHeight += titleLines.length * style.fontSize * 1.5 * style.lineHeight;
      totalHeight += style.fontSize * 1; // 标题下方间距
    }
    
    // 内容高度
    for (const item of content) {
      const itemHeight = this.calculateContentHeight(item, maxWidth, tempCtx);
      totalHeight += itemHeight;
      totalHeight += style.fontSize * 0.5; // 项目间距
    }
    
    // 水印高度
    if (watermark) {
      totalHeight += style.fontSize * 1.5;
    }
    
    totalHeight += style.padding; // 底部padding
    
    // 应用最小和最大高度限制
    return Math.max(minHeight, Math.min(maxHeight, Math.ceil(totalHeight)));
  }

  private calculateContentHeight(content: MarkdownContent, maxWidth: number, ctx: CanvasRenderingContext2D): number {
    const { style } = this.config;
    
    switch (content.type) {
      case 'heading':
        const level = content.level || 1;
        const fontSize = style.fontSize * (2 - level * 0.2);
        ctx.font = `bold ${fontSize}px ${style.fontFamily}`;
        const lines = this.wrapTextWithContext(content.content, maxWidth, fontSize, ctx);
        return lines.length * fontSize * style.lineHeight;
        
      case 'paragraph':
        ctx.font = `${style.fontSize}px ${style.fontFamily}`;
        const pLines = this.wrapTextWithContext(content.content, maxWidth, style.fontSize, ctx);
        return pLines.length * style.fontSize * style.lineHeight;
        
      case 'list':
      case 'ordered_list':
        let listHeight = 0;
        const bulletWidth = 20;
        const itemMaxWidth = maxWidth - bulletWidth;
        
        content.items?.forEach(item => {
          ctx.font = `${style.fontSize}px ${style.fontFamily}`;
          const lines = this.wrapTextWithContext(item, itemMaxWidth, style.fontSize, ctx);
          listHeight += lines.length * style.fontSize * style.lineHeight;
        });
        return listHeight;
        
      case 'code':
        const codeLines = content.content.split('\n');
        return codeLines.length * style.fontSize * style.lineHeight + 40; // 代码块额外padding
        
      case 'blockquote':
        ctx.font = `italic ${style.fontSize}px ${style.fontFamily}`;
        const qLines = this.wrapTextWithContext(content.content, maxWidth - 20, style.fontSize, ctx);
        return qLines.length * style.fontSize * style.lineHeight;
        
      case 'table':
        const { headers, rows } = content;
        if (!headers || !rows) return 0;
        
        let tableHeight = style.fontSize * style.lineHeight; // 表头
        tableHeight += rows.length * style.fontSize * style.lineHeight; // 行
        return tableHeight;
        
      case 'hr':
        return 20;
        
      default:
        return 0;
    }
  }

  private wrapTextWithContext(text: string, maxWidth: number, fontSize: number, ctx: CanvasRenderingContext2D): string[] {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';
    
    ctx.font = `${fontSize}px ${this.config.style.fontFamily}`;
    
    for (const word of words) {
      const testLine = currentLine + (currentLine ? ' ' : '') + word;
      const metrics = ctx.measureText(testLine);
      
      if (metrics.width > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    
    if (currentLine) {
      lines.push(currentLine);
    }
    
    return lines;
  }
}