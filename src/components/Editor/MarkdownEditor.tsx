import React, { useState, useRef, useEffect } from 'react';
import SimpleMDE from 'react-simplemde-editor';
import 'easymde/dist/easymde.min.css';
import ReactMarkdown from 'react-markdown';
import rehypeKatex from 'rehype-katex';
import remarkMath from 'remark-math';
import 'katex/dist/katex.min.css';
import { renderToStaticMarkup } from 'react-dom/server';
import styled from 'styled-components';
import { FabricCanvasModal } from './FabricCanvasModal';

// Custom styles for the editor to match theme
const EditorWrapper = styled.div`
  .EasyMDEContainer {
    .editor-toolbar {
      background: ${({ theme }) => theme.colors.surface};
      border-color: ${({ theme }) => theme.colors.border};
      i {
        color: ${({ theme }) => theme.colors.text};
      }
      button:hover {
        background: ${({ theme }) => theme.colors.border};
      }
      button.active {
        background: ${({ theme }) => theme.colors.border};
      }
    }
    
    .CodeMirror {
      background: ${({ theme }) => theme.colors.background};
      color: ${({ theme }) => theme.colors.text};
      border-color: ${({ theme }) => theme.colors.border};
    }
    
    .CodeMirror-cursor {
      border-left: 1px solid #d1d5db !important; /* Light gray cursor */
    }
    
    .editor-preview {
      background: ${({ theme }) => theme.colors.background};
      color: ${({ theme }) => theme.colors.text};
      
      /* Markdown Styles */
      blockquote {
        border-left-color: ${({ theme }) => theme.colors.border};
        color: ${({ theme }) => theme.colors.textSecondary};
      }
      a {
        color: ${({ theme }) => theme.colors.primary};
      }
      pre {
        background: ${({ theme }) => theme.colors.surface};
      }
      code {
        background: ${({ theme }) => theme.colors.surface};
      }
    }
    
    .editor-statusbar {
      color: ${({ theme }) => theme.colors.textSecondary};
    }
  }
`;

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export const MarkdownEditor: React.FC<MarkdownEditorProps> = ({ value, onChange }) => {
  const [isDrawingOpen, setIsDrawingOpen] = useState(false);
  const [initialDrawingData, setInitialDrawingData] = useState<string | undefined>(undefined);
  const cmRef = useRef<any>(null); // CodeMirror instance

  // Stable reference to the handler for the toolbar
  const handleDrawingRef = useRef<() => void>(() => { });

  const handleDrawing = () => {
    if (!cmRef.current) return;
    const cm = cmRef.current;
    const cursor = cm.getCursor();

    // Check if we are inside a fabric block to edit it
    // Simple logic: iterate lines around cursor
    let startLine = -1;
    let endLine = -1;

    // Look up for start
    for (let i = cursor.line; i >= 0; i--) {
      const text = cm.getLine(i);
      if (text.trim().startsWith('```fabric')) {
        startLine = i;
        break;
      }
      if (text.trim().startsWith('```') && i !== cursor.line) { // Hit another block end?
        // Only if we didn't start inside one. Rough heuristic.
        // Better: EasyMDE doesn't give AST easily. 
        // We'll assume if we find ```fabric above without ``` in between.
      }
    }

    // Look down for end
    if (startLine !== -1) {
      for (let i = cursor.line; i < cm.lineCount(); i++) {
        const text = cm.getLine(i);
        if (text.trim() === '```') {
          endLine = i;
          break;
        }
      }
    }

    if (startLine !== -1 && endLine !== -1 && cursor.line >= startLine && cursor.line <= endLine) {
      // Editing existing
      const lines = [];
      for (let i = startLine + 1; i < endLine; i++) {
        lines.push(cm.getLine(i));
      }
      let jsonStr = lines.join('\n').trim();
      // Remove trailing commas or weird formatting if any? no, it should be valid JSON
      if (jsonStr) {
        setInitialDrawingData(jsonStr);
      } else {
        setInitialDrawingData(undefined);
      }
    } else {
      // New Drawing
      setInitialDrawingData(undefined);
    }

    setIsDrawingOpen(true);
  };

  handleDrawingRef.current = handleDrawing;

  const handleSaveDrawing = (json: string) => {
    if (!cmRef.current) return;
    const cm = cmRef.current;
    const cursor = cm.getCursor();

    // If we were editing, replace the block.
    // Reuse the detection logic or store 'editRange' state?
    // Re-detection is safer as cursor might have moved if we didn't lock? 
    // Modal blocks interaction so cursor shouldn't move.

    let startLine = -1;
    let endLine = -1;
    // Look up for start
    for (let i = cursor.line; i >= 0; i--) {
      if (cm.getLine(i).trim().startsWith('```fabric')) {
        startLine = i;
        break;
      }
    }
    if (startLine !== -1) {
      for (let i = startLine + 1; i < cm.lineCount(); i++) {
        if (cm.getLine(i).trim() === '```') {
          endLine = i;
          break;
        }
      }
    }

    const newBlock = `\`\`\`fabric\n${json}\n\`\`\``;

    if (startLine !== -1 && endLine !== -1 && cursor.line >= startLine && cursor.line <= endLine) {
      // Replace existing
      cm.replaceRange(newBlock, { line: startLine, ch: 0 }, { line: endLine, ch: 3 });
    } else {
      // Insert new
      cm.replaceRange(`\n${newBlock}\n`, cursor);
    }

    setIsDrawingOpen(false);
    onChange(cm.getValue()); // Ensure sync
  };

  const customRenderer = (plainText: string) => {
    // Basic Custom Render to show placeholders for Fabric
    // We can't render canvas here easily in static markup string.

    // Replace ```fabric ... ``` with <div class="fabric-placeholder">Drawing</div>
    const processedText = plainText.replace(/```fabric\s*([\s\S]*?)\s*```/g, () => {
      return `
          <div class="drawing-banner" style="
            background: linear-gradient(to right, #f8f9fa, #e9ecef); 
            border: 1px solid #dee2e6; 
            border-left: 4px solid #333;
            border-radius: 6px; 
            padding: 16px 20px; 
            margin: 16px 0; 
            display: flex; 
            align-items: center; 
            gap: 12px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            box-shadow: 0 2px 4px rgba(0,0,0,0.05);
            cursor: pointer;
          ">
            <div style="
              display: flex; 
              align-items: center; 
              justify-content: center; 
              width: 40px; 
              height: 40px; 
              background: #fff; 
              border-radius: 8px; 
              box-shadow: 0 1px 3px rgba(0,0,0,0.1);
              font-size: 20px;
            ">🎨</div>
            <div style="flex: 1;">
              <div style="font-weight: 600; color: #343a40; font-size: 14px;">Drawing Object</div>
              <div style="font-size: 12px; color: #868e96; margin-top: 2px;">
                Open "Side-by-Side" view or click the Pen icon to edit.
              </div>
            </div>
          </div>
        `;
    });

    return renderToStaticMarkup(
      <div style={{ padding: '10px' }}>
        <ReactMarkdown
          remarkPlugins={[remarkMath]}
          rehypePlugins={[rehypeKatex]}
        >
          {processedText}
        </ReactMarkdown>
      </div>
    );
  };

  const options = React.useMemo(() => ({
    spellChecker: false,
    placeholder: "Type here... (Markdown + Math supported)",
    previewRender: customRenderer,
    toolbar: [
      "bold", "italic", "heading", "|",
      "quote", "unordered-list", "ordered-list", "|",
      "link", "image", "|",
      // Custom Drawing Button
      {
        name: "drawing",
        action: () => handleDrawingRef.current(),
        className: "fa fa-pencil",
        title: "Insert/Edit Drawing",
      },
      "|",
      "preview", "side-by-side", "fullscreen", "|",
      "guide"
    ] as any,
    status: false,
    maxHeight: "500px",
  }), []);

  // Effect to update CodeMirror widgets safely without flickering
  useEffect(() => {
    const cm = cmRef.current;
    if (!cm) return;

    const updateWidgets = () => {
      // 1. Collect all existing fabric markers
      const existingMarks: any[] = [];
      cm.getAllMarks().forEach((m: any) => {
        if (m.className === 'fabric-replacement-mark') {
          existingMarks.push(m);
        }
      });

      // 2. Identify current fabric blocks in text
      const fabricBlocks: { start: any; end: any; }[] = [];
      const lineCount = cm.lineCount();
      let inBlock = false;
      let startLine = -1;

      for (let i = 0; i < lineCount; i++) {
        const lineText = cm.getLine(i);
        if (lineText.trim().startsWith('```fabric')) {
          inBlock = true;
          startLine = i;
        } else if (inBlock && lineText.trim().startsWith('```')) {
          inBlock = false;
          // Valid block found
          fabricBlocks.push({
            start: { line: startLine, ch: 0 },
            end: { line: i, ch: lineText.length }
          });
        }
      }

      // 3. Reconcile: Remove invalid marks
      existingMarks.forEach((mark) => {
        const pos = mark.find();
        if (!pos) return; // already cleared
        // Check if this mark matches any current block range roughly
        // Strictly, we can simply check if the text inside is still valid fabric block
        // But atomic markers usually handle deletions. 
        // We just need to check if existing marks align with current desired blocks.
        // Actually, simpler: 
        // If a mark exists, check if it's in our `fabricBlocks` list.
        // If it is, remove from list (don't re-add). If it's not in list, clear mark?
        // Note: pos.from.line might differ if lines moved. CodeMirror handles line tracking.

        // Let's rely on overlap detection.
        const isStillValid = fabricBlocks.some(block =>
          block.start.line === pos.from.line && block.end.line === pos.to.line
        );

        if (!isStillValid) {
          // Check if text inside is truly not fabric anymore? 
          // Or just clear and assume re-add if valid? 
          // Clearing leads to potential flash if we re-add immediately?
          // Let's simply clear all and re-add? No, flickering.

          // Optimization: Skip checking, just find UNMARKED blocks.
        }
      });

      // Simpler V2: Just find blocks, check if marked.
      fabricBlocks.forEach(block => {
        const marksAtStart = cm.findMarksAt(block.start);
        const hasFabricMark = marksAtStart.some((m: any) => m.className === 'fabric-replacement-mark');

        if (!hasFabricMark) {
          const el = document.createElement('div');
          el.className = 'drawing-widget-banner';
          el.style.cssText = `
                background: linear-gradient(to right, #f8f9fa, #e9ecef); 
                border: 1px solid #dee2e6; 
                border-left: 4px solid #333;
                border-radius: 6px; 
                padding: 12px 16px; 
                margin: 4px 0; 
                display: flex; 
                align-items: center; 
                gap: 12px;
                font-family: system-ui, sans-serif;
                box-shadow: 0 1px 2px rgba(0,0,0,0.05);
                cursor: pointer;
              `;
          el.innerHTML = `
                <div style="font-size: 20px;">🎨</div>
                <div style="flex: 1;">
                  <div style="font-weight: 600; color: #343a40; font-size: 14px;">Drawing Object</div>
                  <div style="font-size: 11px; color: #868e96;">Click to edit this drawing</div>
                </div>
              `;

          el.onclick = (e) => {
            e.stopPropagation();
            // Temporarily clear mark to allow 'handleDrawing' to read raw text?
            // No, handleDrawing reads cm.getLine() which returns raw text even if marked replaced!
            cm.setCursor(block.start);
            handleDrawingRef.current();
          };

          cm.markText(block.start, block.end, {
            replacedWith: el,
            atomic: true,
            className: 'fabric-replacement-mark',
            selectRight: true, // Allow cursor to coexist?
          });
        }
      });
    };

    // Run initially
    updateWidgets();

    // Hook into changes to update
    const changeHandler = () => updateWidgets();
    cm.on('change', changeHandler);

    return () => {
      cm.off('change', changeHandler);
    };
  }, [value]); // Dep on value ensures we get fresh ref if re-mounted, but cm.on handles live updates

  return (
    <>
      <EditorWrapper>
        <SimpleMDE
          value={value}
          onChange={onChange}
          options={options}
          getCodemirrorInstance={(cm) => {
            cmRef.current = cm;
            // Trigger explicit update on mount
            // setTimeout(() => updateFabricWidgets(cm), 100);
          }}
        />
      </EditorWrapper>
      {isDrawingOpen && (
        <FabricCanvasModal
          initialData={initialDrawingData}
          onSave={handleSaveDrawing}
          onClose={() => setIsDrawingOpen(false)}
        />
      )}
    </>
  );
};
