import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { MarkdownParser } from './utils/markdownParser.js';
import { ImageGenerator } from './utils/imageGenerator.js';
import { cardStyles, getStyleById } from './styles/cardStyles.js';
import { CardConfig } from './types/index.js';
import fs from 'fs';
import path from 'path';

class MarkdownToCardServer {
  private server: Server;
  private outputDir: string;

  constructor() {
    this.server = new Server(
      {
        name: 'markdown-to-card',
        version: '1.0.0',
      }
    );

    this.outputDir = path.join(process.cwd(), 'output');
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }

    this.setupHandlers();
  }

  private setupHandlers() {
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => {
      const images = this.getGeneratedImages();
      return {
        resources: images.map(image => ({
          uri: `file://${image.path}`,
          mimeType: 'image/png',
          name: image.filename,
        })),
      };
    });

    this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      const uri = request.params.uri;
      if (!uri.startsWith('file://')) {
        throw new Error('Only file:// URIs are supported');
      }

      const filePath = uri.slice(7); // Remove 'file://' prefix
      if (!fs.existsSync(filePath)) {
        throw new Error(`File not found: ${filePath}`);
      }

      const content = fs.readFileSync(filePath, 'base64');
      return {
        contents: [
          {
            uri,
            mimeType: 'image/png',
            blob: content,
          },
        ],
      };
    });

    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'list_styles',
            description: 'List all available card styles',
            inputSchema: {
              type: 'object',
              properties: {},
            },
          },
          {
            name: 'get_style',
            description: 'Get details of a specific card style',
            inputSchema: {
              type: 'object',
              properties: {
                styleId: {
                  type: 'string',
                  description: 'The ID of the style to get details for',
                },
              },
              required: ['styleId'],
            },
          },
          {
            name: 'preview_card',
            description: 'Preview a markdown card with specified style (returns base64 image)',
            inputSchema: {
              type: 'object',
              properties: {
                markdown: {
                  type: 'string',
                  description: 'The markdown content to convert',
                },
                styleId: {
                  type: 'string',
                  description: 'The ID of the style to use',
                },
                width: {
                  type: 'number',
                  description: 'Card width in pixels (default: 800)',
                  default: 800,
                },
                height: {
                  type: 'number',
                  description: 'Card height in pixels (default: 1000)',
                  default: 1000,
                },
                title: {
                  type: 'string',
                  description: 'Optional title for the card',
                },
                watermark: {
                  type: 'string',
                  description: 'Optional watermark text',
                },
              },
              required: ['markdown', 'styleId'],
            },
          },
          {
            name: 'generate_card',
            description: 'Generate and save a markdown card as an image file',
            inputSchema: {
              type: 'object',
              properties: {
                markdown: {
                  type: 'string',
                  description: 'The markdown content to convert',
                },
                styleId: {
                  type: 'string',
                  description: 'The ID of the style to use',
                },
                width: {
                  type: 'number',
                  description: 'Card width in pixels (default: 800)',
                  default: 800,
                },
                height: {
                  type: 'number',
                  description: 'Card height in pixels (default: 1000)',
                  default: 1000,
                },
                title: {
                  type: 'string',
                  description: 'Optional title for the card',
                },
                watermark: {
                  type: 'string',
                  description: 'Optional watermark text',
                },
                filename: {
                  type: 'string',
                  description: 'Optional custom filename (without extension)',
                },
              },
              required: ['markdown', 'styleId'],
            },
          },
          {
            name: 'list_generated_images',
            description: 'List all generated card images',
            inputSchema: {
              type: 'object',
              properties: {},
            },
          },
          {
            name: 'delete_image',
            description: 'Delete a generated image file',
            inputSchema: {
              type: 'object',
              properties: {
                filename: {
                  type: 'string',
                  description: 'The filename of the image to delete',
                },
              },
              required: ['filename'],
            },
          },
        ],
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'list_styles':
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(
                    cardStyles.map(style => ({
                      id: style.id,
                      name: style.name,
                      preview: {
                        backgroundColor: style.backgroundColor,
                        textColor: style.textColor,
                        headerColor: style.headerColor,
                        accentColor: style.accentColor,
                      },
                    })),
                    null,
                    2
                  ),
                },
              ],
            };

          case 'get_style':
            const style = getStyleById((args as any)?.styleId);
            if (!style) {
              throw new Error(`Style not found: ${(args as any)?.styleId}`);
            }
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(style, null, 2),
                },
              ],
            };

          case 'preview_card':
            const previewResult = await this.generateCard(args as any, false);
            return {
              content: [
                {
                  type: 'text',
                  text: `Card preview generated successfully. Base64 image data: ${previewResult.base64Image.substring(0, 100)}...`,
                },
                {
                  type: 'image',
                  data: previewResult.base64Image,
                  mimeType: 'image/png',
                },
              ],
            };

          case 'generate_card':
            const generateResult = await this.generateCard(args as any, true);
            return {
              content: [
                {
                  type: 'text',
                  text: `Card generated successfully!\nFilename: ${generateResult.filename}\nPath: ${generateResult.path}\nSize: ${generateResult.size} bytes`,
                },
              ],
            };

          case 'list_generated_images':
            const images = this.getGeneratedImages();
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(images, null, 2),
                },
              ],
            };

          case 'delete_image':
            const deleted = this.deleteImage((args as any)?.filename);
            return {
              content: [
                {
                  type: 'text',
                  text: deleted ? `Image ${(args as any)?.filename} deleted successfully` : `Image ${(args as any)?.filename} not found`,
                },
              ],
            };

          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
            },
          ],
          isError: true,
        };
      }
    });
  }

  private async generateCard(args: any, saveFile: boolean): Promise<{
    base64Image: string;
    filename?: string;
    path?: string;
    size?: number;
  }> {
    const { markdown, styleId, width = 800, height = 1000, title, watermark, filename } = args;

    const style = getStyleById(styleId);
    if (!style) {
      throw new Error(`Style not found: ${styleId}`);
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
    };

    const generator = new ImageGenerator(config);
    const imageBuffer = await generator.generateImage();
    const base64Image = imageBuffer.toString('base64');

    if (saveFile) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const outputFilename = (filename || `card-${style.id}-${timestamp}`) + '.png';
      const outputPath = path.join(this.outputDir, outputFilename);

      fs.writeFileSync(outputPath, imageBuffer);

      return {
        base64Image,
        filename: outputFilename,
        path: outputPath,
        size: imageBuffer.length,
      };
    }

    return { base64Image };
  }

  private getGeneratedImages(): Array<{
    filename: string;
    path: string;
    size: number;
    created: string;
  }> {
    try {
      return fs.readdirSync(this.outputDir)
        .filter(file => file.endsWith('.png'))
        .map(file => {
          const filePath = path.join(this.outputDir, file);
          const stats = fs.statSync(filePath);
          return {
            filename: file,
            path: filePath,
            size: stats.size,
            created: stats.birthtime.toISOString(),
          };
        })
        .sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime());
    } catch (error) {
      return [];
    }
  }

  private deleteImage(filename: string): boolean {
    try {
      const imagePath = path.join(this.outputDir, filename);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
        return true;
      }
      return false;
    } catch (error) {
      return false;
    }
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Markdown to Card MCP server running on stdio');
  }
}

export default MarkdownToCardServer;