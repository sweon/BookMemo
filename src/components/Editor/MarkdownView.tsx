import React from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeKatex from 'rehype-katex';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import 'katex/dist/katex.min.css';
import styled from 'styled-components';
import { fabric } from 'fabric';

const MarkdownContainer = styled.div<{ $tableHeaderBg?: string }>`
  line-height: 1.6;
  color: ${({ theme }) => theme.colors.text};

  h1, h2, h3, h4, h5, h6 {
    margin-top: 1.5em;
    margin-bottom: 0.5em;
    font-weight: 600;
  }

  p {
    margin-bottom: 1em;
  }

  a {
    color: ${({ theme }) => theme.colors.primary};
    text-decoration: none;
    &:hover {
      text-decoration: underline;
    }
  }

  blockquote {
    border-left: 4px solid ${({ theme }) => theme.colors.border};
    padding-left: 1rem;
    margin-left: 0;
    color: ${({ theme }) => theme.colors.textSecondary};
  }

  code {
    background: ${({ theme }) => theme.colors.surface};
    padding: 0.2em 0.4em;
    border-radius: 3px;
    font-family: 'Menlo', 'Monaco', 'Courier New', monospace;
    font-size: 0.9em;
  }

  pre {
    background: ${({ theme }) => theme.colors.surface};
    padding: 1rem;
    border-radius: 6px;
    overflow-x: auto;
    
    code {
      background: transparent;
      padding: 0;
      color: inherit;
      font-size: 1em;
    }
  }

  ul, ol {
    padding-left: 1.5em;
  }

  img {
    max-width: 100%;
    border-radius: 6px;
  }

  table {
    border-collapse: collapse;
    width: 100%;
    margin-bottom: 1em;
    
    th, td {
      border: 1px solid ${({ theme }) => theme.colors.border};
      padding: 0.5rem;
      text-align: left;
    }

    th {
      background: ${({ theme, $tableHeaderBg }) => $tableHeaderBg || theme.colors.surface};
      font-weight: 600;
    }
  }

  /* Katex adjustments if needed */
  }
`;


const FabricPreview = ({ json }: { json: string }) => {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const fabricCanvasRef = React.useRef<fabric.StaticCanvas | null>(null);

  React.useLayoutEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const canvas = new fabric.StaticCanvas(canvasRef.current);
    fabricCanvasRef.current = canvas;

    try {
      const data = JSON.parse(json);
      canvas.loadFromJSON(data, () => {
        // Determine original dimensions
        // If data.width/height is missing (old data), calculate from objects
        let originalWidth = data.width;
        let originalHeight = data.height;

        if (!originalWidth || !originalHeight) {
          const objects = canvas.getObjects();
          if (objects.length > 0) {
            let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
            objects.forEach(obj => {
              const bounds = obj.getBoundingRect();
              minX = Math.min(minX, bounds.left);
              minY = Math.min(minY, bounds.top);
              maxX = Math.max(maxX, bounds.left + bounds.width);
              maxY = Math.max(maxY, bounds.top + bounds.height);
            });
            // Add some padding
            originalWidth = Math.max(800, maxX + 20);
            originalHeight = Math.max(600, maxY + 20);
          } else {
            originalWidth = 800;
            originalHeight = 600;
          }
        }

        const resizeCanvas = () => {
          if (!containerRef.current || !fabricCanvasRef.current) return;

          const containerWidth = containerRef.current.clientWidth;
          if (containerWidth === 0) return;

          // Scale down if container is smaller than content
          const scale = containerWidth < originalWidth ? containerWidth / originalWidth : 1;

          fabricCanvasRef.current.setDimensions({
            width: originalWidth * scale,
            height: originalHeight * scale
          });

          fabricCanvasRef.current.setZoom(scale);
          fabricCanvasRef.current.renderAll();
        };

        // Initial resize
        resizeCanvas();

        // Observe container size changes
        const resizeObserver = new ResizeObserver(() => {
          resizeCanvas();
        });
        if (containerRef.current) {
          resizeObserver.observe(containerRef.current);
        }

        return () => {
          resizeObserver.disconnect();
        };
      });
    } catch (e) {
      console.error('Fabric load error:', e);
    }

    return () => {
      canvas.dispose();
      fabricCanvasRef.current = null;
    };
  }, [json]);

  return (
    <div
      ref={containerRef}
      style={{
        width: 'auto',
        margin: '1.5rem -24px',
        overflow: 'hidden',
        background: '#fff',
        border: '1px solid #eee',
        borderLeft: 'none',
        borderRight: 'none',
        display: 'flex',
        justifyContent: 'center'
      }}
    >
      <canvas ref={canvasRef} />
    </div>
  );
};

export const MarkdownView: React.FC<{ content: string; tableHeaderBg?: string }> = ({ content, tableHeaderBg }) => {
  return (
    <MarkdownContainer $tableHeaderBg={tableHeaderBg}>
      <ReactMarkdown
        remarkPlugins={[remarkMath, remarkGfm, remarkBreaks]}
        rehypePlugins={[rehypeKatex]}
        components={{
          code({ node, className, children, ...props }: any) {
            const match = /language-(\w+)/.exec(className || '');
            // Check if it's a fabric block
            if (!props.inline && match && match[1] === 'fabric') {
              return <FabricPreview json={String(children).replace(/\n$/, '')} />;
            }
            return <code className={className} {...props}>{children}</code>;
          }
        }}
      >
        {content}
      </ReactMarkdown>
    </MarkdownContainer>
  );
};
