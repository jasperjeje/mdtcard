import express from 'express';
import cors from 'cors';
import { MarkdownParser } from '../utils/markdownParser.js';
import { ImageGenerator } from '../utils/imageGenerator.js';
import { cardStyles, getStyleById } from '../styles/cardStyles.js';
import { CardConfig, ApiResponse } from '../types/index.js';
import fs from 'fs';
import path from 'path';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// 静态文件服务
const publicDir = path.join(process.cwd(), 'public');
app.use(express.static(publicDir));

// 创建输出目录
const outputDir = path.join(process.cwd(), 'output');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// 获取所有可用的卡片样式
app.get('/api/styles', (req, res) => {
  const response: ApiResponse = {
    success: true,
    data: cardStyles.map(style => ({
      id: style.id,
      name: style.name,
      preview: {
        backgroundColor: style.backgroundColor,
        textColor: style.textColor,
        headerColor: style.headerColor,
        accentColor: style.accentColor
      }
    }))
  };
  res.json(response);
});

// 获取特定样式的详细信息
app.get('/api/styles/:id', (req, res) => {
  const style = getStyleById(req.params.id);
  if (!style) {
    const response: ApiResponse = {
      success: false,
      error: 'Style not found'
    };
    return res.status(404).json(response);
  }
  
  const response: ApiResponse = {
    success: true,
    data: style
  };
  res.json(response);
});

// 预览卡片（返回base64图片）
app.post('/api/preview', async (req, res) => {
  try {
    const { 
      markdown, 
      styleId, 
      width = 800, 
      height = 1000, 
      title, 
      watermark, 
      format = 'png', 
      quality = 90,
      autoHeight = false,
      minHeight = 400,
      maxHeight = 5000
    } = req.body;
    
    if (!markdown || !styleId) {
      const response: ApiResponse = {
        success: false,
        error: 'Missing required parameters: markdown and styleId'
      };
      return res.status(400).json(response);
    }
    
    const style = getStyleById(styleId);
    if (!style) {
      const response: ApiResponse = {
        success: false,
        error: 'Style not found'
      };
      return res.status(404).json(response);
    }
    
    const parser = new MarkdownParser();
    const content = parser.parse(markdown);
    
    const config: CardConfig = {
      width,
      height,
      style,
      content,
      title,
      watermark,
      format,
      quality,
      autoHeight,
      minHeight,
      maxHeight
    };
    
    const generator = new ImageGenerator(config);
    const imageBuffer = await generator.generateImage();
    const base64Image = imageBuffer.toString('base64');
    
    const mimeType = format === 'jpg' || format === 'jpeg' ? 'image/jpeg' : 'image/png';
    
    const response: ApiResponse = {
      success: true,
      data: {
        image: `data:${mimeType};base64,${base64Image}`,
        width,
        height: config.height, // 返回实际高度（可能是自动计算的）
        format,
        autoHeight
      }
    };
    
    res.json(response);
  } catch (error) {
    console.error('Preview error:', error);
    const response: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
    res.status(500).json(response);
  }
});

// 生成并保存卡片图片
app.post('/api/generate', async (req, res) => {
  try {
    const { 
      markdown, 
      styleId, 
      width = 800, 
      height = 1000, 
      title, 
      watermark, 
      filename, 
      format = 'png', 
      quality = 90,
      autoHeight = false,
      minHeight = 400,
      maxHeight = 5000
    } = req.body;
    
    if (!markdown || !styleId) {
      const response: ApiResponse = {
        success: false,
        error: 'Missing required parameters: markdown and styleId'
      };
      return res.status(400).json(response);
    }
    
    const style = getStyleById(styleId);
    if (!style) {
      const response: ApiResponse = {
        success: false,
        error: 'Style not found'
      };
      return res.status(404).json(response);
    }
    
    const parser = new MarkdownParser();
    const content = parser.parse(markdown);
    
    const config: CardConfig = {
      width,
      height,
      style,
      content,
      title,
      watermark,
      format,
      quality,
      autoHeight,
      minHeight,
      maxHeight
    };
    
    const generator = new ImageGenerator(config);
    const imageBuffer = await generator.generateImage();
    
    // 生成文件名
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileExtension = format === 'jpg' || format === 'jpeg' ? 'jpg' : 'png';
    const outputFilename = filename 
      ? `${filename}.${fileExtension}` 
      : `card-${style.id}-${timestamp}.${fileExtension}`;
    const outputPath = path.join(outputDir, outputFilename);
    
    // 保存图片
    fs.writeFileSync(outputPath, imageBuffer);
    
    const response: ApiResponse = {
      success: true,
      data: {
        filename: outputFilename,
        path: outputPath,
        size: imageBuffer.length,
        format,
        width: config.width,
        height: config.height, // 返回实际高度（可能是自动计算的）
        autoHeight
      },
      imageUrl: `/api/images/${outputFilename}`
    };
    
    res.json(response);
  } catch (error) {
    console.error('Generate error:', error);
    const response: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
    res.status(500).json(response);
  }
});

// 获取生成的图片
app.get('/api/images/:filename', (req, res) => {
  const filename = req.params.filename;
  const imagePath = path.join(outputDir, filename);
  
  if (!fs.existsSync(imagePath)) {
    return res.status(404).json({
      success: false,
      error: 'Image not found'
    });
  }
  
  // 设置正确的Content-Type
  const ext = path.extname(filename).toLowerCase();
  const contentType = ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' : 'image/png';
  res.setHeader('Content-Type', contentType);
  
  res.sendFile(imagePath);
});

// 列出所有生成的图片
app.get('/api/images', (req, res) => {
  try {
    const files = fs.readdirSync(outputDir)
      .filter(file => file.endsWith('.png') || file.endsWith('.jpg') || file.endsWith('.jpeg'))
      .map(file => {
        const filePath = path.join(outputDir, file);
        const stats = fs.statSync(filePath);
        return {
          filename: file,
          size: stats.size,
          created: stats.birthtime,
          url: `/api/images/${file}`
        };
      })
      .sort((a, b) => b.created.getTime() - a.created.getTime());
    
    const response: ApiResponse = {
      success: true,
      data: files
    };
    
    res.json(response);
  } catch (error) {
    console.error('List images error:', error);
    const response: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
    res.status(500).json(response);
  }
});

// 删除图片
app.delete('/api/images/:filename', (req, res) => {
  try {
    const filename = req.params.filename;
    const imagePath = path.join(outputDir, filename);
    
    if (!fs.existsSync(imagePath)) {
      return res.status(404).json({
        success: false,
        error: 'Image not found'
      });
    }
    
    fs.unlinkSync(imagePath);
    
    const response: ApiResponse = {
      success: true,
      data: { message: 'Image deleted successfully' }
    };
    
    res.json(response);
  } catch (error) {
    console.error('Delete image error:', error);
    const response: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
    res.status(500).json(response);
  }
});

// 健康检查
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// 错误处理中间件
app.use((error: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', error);
  const response: ApiResponse = {
    success: false,
    error: 'Internal server error'
  };
  res.status(500).json(response);
});

// 404 处理
app.use((req, res) => {
  const response: ApiResponse = {
    success: false,
    error: 'Not found'
  };
  res.status(404).json(response);
});

export function startServer() {
  app.listen(PORT, () => {
    console.log(`🚀 Markdown to Card API Server running on port ${PORT}`);
    console.log(`🌐 Web Interface: http://localhost:${PORT}`);
    console.log(`📖 API Documentation:`);
    console.log(`   GET  /api/styles - Get all available styles`);
    console.log(`   GET  /api/styles/:id - Get specific style details`);
    console.log(`   POST /api/preview - Preview card (returns base64 image)`);
    console.log(`   POST /api/generate - Generate and save card image`);
    console.log(`   GET  /api/images - List all generated images`);
    console.log(`   GET  /api/images/:filename - Get specific image`);
    console.log(`   DELETE /api/images/:filename - Delete specific image`);
    console.log(`   GET  /health - Health check`);
  });
}

export default app;