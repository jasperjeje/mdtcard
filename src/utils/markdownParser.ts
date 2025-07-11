import MarkdownIt from 'markdown-it';
import { MarkdownContent } from '../types/index.js';

const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
  breaks: true
});

export class MarkdownParser {
  private md: MarkdownIt;

  constructor() {
    this.md = md;
  }

  parse(markdown: string): MarkdownContent[] {
    const tokens = this.md.parse(markdown, {});
    const content: MarkdownContent[] = [];
    
    let i = 0;
    while (i < tokens.length) {
      const token = tokens[i];
      
      switch (token.type) {
        case 'heading_open':
          const level = parseInt(token.tag.substring(1));
          const headingContent = this.extractTextFromTokens(tokens, i + 1, i + 2);
          content.push({
            type: 'heading',
            content: headingContent,
            level: level
          });
          i += 3;
          break;
          
        case 'paragraph_open':
          const paragraphContent = this.extractTextFromTokens(tokens, i + 1, this.findClosingToken(tokens, i));
          content.push({
            type: 'paragraph',
            content: paragraphContent
          });
          i = this.findClosingToken(tokens, i) + 1;
          break;
          
        case 'bullet_list_open':
          const listItems = this.extractListItems(tokens, i);
          content.push({
            type: 'list',
            content: '',
            items: listItems.items
          });
          i = listItems.endIndex;
          break;
          
        case 'ordered_list_open':
          const orderedListItems = this.extractListItems(tokens, i);
          content.push({
            type: 'ordered_list',
            content: '',
            items: orderedListItems.items
          });
          i = orderedListItems.endIndex;
          break;
          
        case 'code_block':
          content.push({
            type: 'code',
            content: token.content,
            language: token.info || 'text'
          });
          i++;
          break;
          
        case 'fence':
          content.push({
            type: 'code',
            content: token.content,
            language: token.info || 'text'
          });
          i++;
          break;
          
        case 'blockquote_open':
          const quoteContent = this.extractBlockquoteContent(tokens, i);
          content.push({
            type: 'blockquote',
            content: quoteContent.content
          });
          i = quoteContent.endIndex;
          break;
          
        case 'table_open':
          const tableData = this.extractTableData(tokens, i);
          content.push({
            type: 'table',
            content: '',
            headers: tableData.headers,
            rows: tableData.rows
          });
          i = tableData.endIndex;
          break;
          
        case 'hr':
          content.push({
            type: 'hr',
            content: ''
          });
          i++;
          break;
          
        default:
          i++;
          break;
      }
    }
    
    return content;
  }

  private extractTextFromTokens(tokens: any[], start: number, end: number): string {
    let text = '';
    for (let i = start; i < end && i < tokens.length; i++) {
      if (tokens[i].type === 'inline') {
        text += tokens[i].content;
      } else if (tokens[i].content) {
        text += tokens[i].content;
      }
    }
    return text;
  }

  private findClosingToken(tokens: any[], openIndex: number): number {
    const openType = tokens[openIndex].type;
    const closeType = openType.replace('_open', '_close');
    
    for (let i = openIndex + 1; i < tokens.length; i++) {
      if (tokens[i].type === closeType) {
        return i;
      }
    }
    return tokens.length - 1;
  }

  private extractListItems(tokens: any[], startIndex: number): { items: string[], endIndex: number } {
    const items: string[] = [];
    let i = startIndex + 1;
    
    while (i < tokens.length && tokens[i].type !== 'bullet_list_close' && tokens[i].type !== 'ordered_list_close') {
      if (tokens[i].type === 'list_item_open') {
        const itemContent = this.extractListItemContent(tokens, i);
        items.push(itemContent.content);
        i = itemContent.endIndex;
      } else {
        i++;
      }
    }
    
    return { items, endIndex: i + 1 };
  }

  private extractListItemContent(tokens: any[], startIndex: number): { content: string, endIndex: number } {
    let content = '';
    let i = startIndex + 1;
    
    while (i < tokens.length && tokens[i].type !== 'list_item_close') {
      if (tokens[i].type === 'paragraph_open') {
        const paragraphEnd = this.findClosingToken(tokens, i);
        content += this.extractTextFromTokens(tokens, i + 1, paragraphEnd);
        i = paragraphEnd + 1;
      } else if (tokens[i].type === 'inline') {
        content += tokens[i].content;
        i++;
      } else {
        i++;
      }
    }
    
    return { content, endIndex: i + 1 };
  }

  private extractBlockquoteContent(tokens: any[], startIndex: number): { content: string, endIndex: number } {
    let content = '';
    let i = startIndex + 1;
    
    while (i < tokens.length && tokens[i].type !== 'blockquote_close') {
      if (tokens[i].type === 'paragraph_open') {
        const paragraphEnd = this.findClosingToken(tokens, i);
        content += this.extractTextFromTokens(tokens, i + 1, paragraphEnd);
        i = paragraphEnd + 1;
      } else if (tokens[i].type === 'inline') {
        content += tokens[i].content;
        i++;
      } else {
        i++;
      }
    }
    
    return { content, endIndex: i + 1 };
  }

  private extractTableData(tokens: any[], startIndex: number): { headers: string[], rows: string[][], endIndex: number } {
    const headers: string[] = [];
    const rows: string[][] = [];
    let i = startIndex + 1;
    
    while (i < tokens.length && tokens[i].type !== 'table_close') {
      if (tokens[i].type === 'thead_open') {
        i++;
        while (i < tokens.length && tokens[i].type !== 'thead_close') {
          if (tokens[i].type === 'tr_open') {
            i++;
            while (i < tokens.length && tokens[i].type !== 'tr_close') {
              if (tokens[i].type === 'th_open') {
                const cellEnd = this.findClosingToken(tokens, i);
                headers.push(this.extractTextFromTokens(tokens, i + 1, cellEnd));
                i = cellEnd + 1;
              } else {
                i++;
              }
            }
          } else {
            i++;
          }
        }
      } else if (tokens[i].type === 'tbody_open') {
        i++;
        while (i < tokens.length && tokens[i].type !== 'tbody_close') {
          if (tokens[i].type === 'tr_open') {
            const row: string[] = [];
            i++;
            while (i < tokens.length && tokens[i].type !== 'tr_close') {
              if (tokens[i].type === 'td_open') {
                const cellEnd = this.findClosingToken(tokens, i);
                row.push(this.extractTextFromTokens(tokens, i + 1, cellEnd));
                i = cellEnd + 1;
              } else {
                i++;
              }
            }
            rows.push(row);
          } else {
            i++;
          }
        }
      } else {
        i++;
      }
    }
    
    return { headers, rows, endIndex: i + 1 };
  }
}