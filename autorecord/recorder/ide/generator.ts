import { existsSync, readFileSync } from 'node:fs';
import { basename, join } from 'node:path';

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function highlightSyntax(line: string, ext: string): string {
  const isPython = ext === 'py';
  const isJson = ext === 'json';
  const isTsx = ext === 'tsx' || ext === 'ts' || ext === 'js' || ext === 'jsx';

  if (!line.trim()) return '&nbsp;';

  // 1. Full line comments
  const trimmed = line.trimStart();
  if (trimmed.startsWith('//') || (isPython && trimmed.startsWith('#')) || trimmed.startsWith('/*')) {
    return `<span style="color:#6a9955;">${escapeHtml(line)}</span>`;
  }

  // 2. JSON highlighting
  if (isJson) {
    const jsonMatch = line.match(/^(\s*)(".*?")(\s*:\s*)(.*)$/);
    if (jsonMatch) {
      const [, indent, key, colon, val] = jsonMatch;
      let valHtml = escapeHtml(val);
      if (val.trim().startsWith('"')) {
        valHtml = `<span style="color:#ce9178;">${escapeHtml(val)}</span>`;
      } else if (/^-?\d+(\.\d+)?/.test(val.trim())) {
        valHtml = `<span style="color:#b5cea8;">${escapeHtml(val)}</span>`;
      } else if (/^(true|false|null)/.test(val.trim())) {
        valHtml = `<span style="color:#569cd6;">${escapeHtml(val)}</span>`;
      }
      return `${escapeHtml(indent)}<span style="color:#9cdcfe;">${escapeHtml(key)}</span>${escapeHtml(colon)}${valHtml}`;
    }
  }

  // 3. General tokenizer for TypeScript/JSX & Python
  let escaped = escapeHtml(line);

  // Strings (double, single, backtick)
  escaped = escaped.replace(/(["'`])((?:\\.|[^\\])*?)\1/g, '<span style="color:#ce9178;">$1$2$1</span>');

  // Inline comments
  if (isPython) {
    escaped = escaped.replace(/(#.*)$/g, '<span style="color:#6a9955;">$1</span>');
  } else {
    escaped = escaped.replace(/(\/\/.*)$/g, '<span style="color:#6a9955;">$1</span>');
  }

  if (isPython) {
    // Python Keywords
    const pyControl = /\b(import|from|return|if|elif|else|for|while|try|except|finally|with|as|yield|raise|pass|break|continue)\b/g;
    const pyDefs = /\b(def|class|async|await|lambda)\b/g;
    const pyConstants = /\b(True|False|None|self)\b/g;
    const pyDecorators = /(@[\w.]+)/g;

    escaped = escaped.replace(pyControl, '<span style="color:#c586c0;">$1</span>');
    escaped = escaped.replace(pyDefs, '<span style="color:#569cd6;">$1</span>');
    escaped = escaped.replace(pyConstants, '<span style="color:#569cd6;">$1</span>');
    escaped = escaped.replace(pyDecorators, '<span style="color:#dcdcaa;">$1</span>');
  } else if (isTsx) {
    // TS/JS Keywords
    const tsControl = /\b(import|export|from|return|if|else|for|while|switch|case|default|try|catch|finally|throw|break|continue)\b/g;
    const tsDefs = /\b(const|let|var|function|type|interface|class|enum|extends|implements|async|await|new)\b/g;
    const tsConstants = /\b(true|false|null|undefined|void|any|number|string|boolean|object)\b/g;
    const tsReact = /\b(useAgent|useCopilotKit|useComponent|useHumanInTheLoop|useRenderTool|useDefaultRenderTool|useFrontendTool|useAgentContext|CopilotChat|CopilotSidebar|CopilotPopup|CopilotKitProvider|CopilotKit)\b/g;

    escaped = escaped.replace(tsControl, '<span style="color:#c586c0;">$1</span>');
    escaped = escaped.replace(tsDefs, '<span style="color:#569cd6;">$1</span>');
    escaped = escaped.replace(tsConstants, '<span style="color:#4ec9b0;">$1</span>');
    escaped = escaped.replace(tsReact, '<span style="color:#4ec9b0;font-weight:600;">$1</span>');
  }

  return escaped;
}

export function generateIdeHtml(
  rootDir: string,
  relativeFilePath: string,
  startLine = 1,
  endLine = 30,
): string {
  const fullPath = join(rootDir, relativeFilePath);
  let code = '// File not found';
  if (existsSync(fullPath)) {
    code = readFileSync(fullPath, 'utf-8');
  }

  const fileName = basename(relativeFilePath);
  const ext = fileName.split('.').pop() ?? '';
  const isTsx = ext === 'tsx' || ext === 'ts' || ext === 'js' || ext === 'jsx';
  const isPython = ext === 'py';
  const isJson = ext === 'json';
  const isMd = ext === 'md';

  const fileIcon = isPython
    ? '🐍'
    : isTsx
      ? '⚛'
      : isJson
        ? '📦'
        : isMd
          ? '📝'
          : '📄';

  const langLabel = isPython
    ? 'Python'
    : isTsx
      ? 'TypeScript JSX'
      : isJson
        ? 'JSON'
        : isMd
          ? 'Markdown'
          : 'Plain Text';

  const normalizedPath = relativeFilePath.replace(/\\/g, '/');
  const pathParts = normalizedPath.split('/');
  const codeLines = code.split('\n');

  const linesHtml = codeLines
    .map((line, idx) => {
      const lineNum = idx + 1;
      const isHighlighted = lineNum >= startLine && lineNum <= endLine;
      const highlightedContent = highlightSyntax(line, ext);

      const lineClass = isHighlighted ? 'code-line highlighted' : 'code-line';
      const numClass = isHighlighted ? 'line-num highlighted' : 'line-num';
      const textClass = isHighlighted
        ? 'line-content highlighted'
        : 'line-content';

      return `
        <div class="${lineClass}">
          <div class="${numClass}">${lineNum}</div>
          <div class="${textClass}"><span>${highlightedContent}</span></div>
        </div>
      `;
    })
    .join('');

  const breadcrumbsHtml = pathParts
    .map((part, idx) => {
      const isLast = idx === pathParts.length - 1;
      return `<span class="breadcrumb-item ${isLast ? 'active' : ''}">${escapeHtml(part)}</span>${
        !isLast ? '<span class="breadcrumb-sep">&gt;</span>' : ''
      }`;
    })
    .join('');

  // Dynamic file tree generator based on the active relativeFilePath
  const treeNodes: string[] = [];
  for (let i = 0; i < pathParts.length; i++) {
    const isFile = i === pathParts.length - 1;
    const part = pathParts[i];
    const indentClass = i === 0 ? '' : `pl-${Math.min(i, 4)}`;

    if (isFile) {
      treeNodes.push(`
        <div class="tree-node ${indentClass} active-file">
          <span>${fileIcon}</span>
          <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escapeHtml(part)}</span>
        </div>
      `);
    } else {
      treeNodes.push(`
        <div class="tree-node ${indentClass}">
          <span style="color:#858585;">▾</span>
          <span class="folder-name">📁 ${escapeHtml(part)}</span>
        </div>
      `);
    }
  }

  // If active file is in frontend, show backend folder too
  if (normalizedPath.startsWith('frontend/')) {
    treeNodes.push(`
      <div class="tree-node">
        <span style="color:#858585;">▸</span>
        <span class="folder-name">📁 backend</span>
      </div>
    `);
  } else if (normalizedPath.startsWith('backend/')) {
    treeNodes.unshift(`
      <div class="tree-node">
        <span style="color:#858585;">▸</span>
        <span class="folder-name">📁 frontend</span>
      </div>
    `);
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>VS Code - ${escapeHtml(fileName)}</title>
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body, html {
      width: 100vw;
      height: 100vh;
      overflow: hidden;
      background-color: #1e1e1e;
      color: #cccccc;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      user-select: none;
      -webkit-user-select: none;
    }
    .vscode-container {
      display: flex;
      flex-direction: column;
      width: 100vw;
      height: 100vh;
      overflow: hidden;
    }
    /* Titlebar */
    .titlebar {
      height: 35px;
      background: #181818;
      border-bottom: 1px solid #2b2b2b;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 12px;
      font-size: 12px;
      color: #9d9d9d;
    }
    .titlebar-left {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .titlebar-path {
      color: #cccccc;
      display: flex;
      gap: 6px;
    }
    .titlebar-path span.sub {
      color: #858585;
    }
    .titlebar-controls {
      display: flex;
      gap: 14px;
      color: #858585;
      font-size: 13px;
    }
    /* Main Layout */
    .main-body {
      display: flex;
      flex: 1;
      overflow: hidden;
    }
    /* Activity Bar */
    .activity-bar {
      width: 48px;
      background: #181818;
      border-right: 1px solid #2b2b2b;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: space-between;
      padding: 10px 0;
      color: #858585;
    }
    .activity-group {
      display: flex;
      flex-direction: column;
      gap: 16px;
      align-items: center;
    }
    .activity-icon {
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      cursor: pointer;
    }
    .activity-icon.active {
      color: #ffffff;
    }
    .activity-icon.active::before {
      content: '';
      position: absolute;
      left: 0;
      top: 4px;
      bottom: 4px;
      width: 2px;
      background: #007acc;
    }
    /* Sidebar */
    .sidebar {
      width: 250px;
      background: #181818;
      border-right: 1px solid #2b2b2b;
      display: flex;
      flex-direction: column;
      font-size: 12px;
    }
    .sidebar-header {
      padding: 10px 16px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #bbbbbb;
      display: flex;
      justify-content: space-between;
    }
    .sidebar-project {
      padding: 4px 10px;
      font-weight: bold;
      color: #e1e1e1;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .file-tree {
      flex: 1;
      overflow-y: auto;
      padding: 4px 8px;
      font-family: Consolas, 'Courier New', monospace;
      font-size: 12px;
      line-height: 22px;
    }
    .tree-node {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 2px 4px;
      color: #cccccc;
    }
    .tree-node.pl-1 { padding-left: 14px; }
    .tree-node.pl-2 { padding-left: 26px; }
    .tree-node.pl-3 { padding-left: 38px; }
    .tree-node.pl-4 { padding-left: 50px; }
    .tree-node.active-file {
      background: rgba(4, 57, 94, 0.6);
      color: #ffffff;
      border-radius: 3px;
    }
    .folder-name { color: #dcb67a; }
    /* Editor Area */
    .editor-pane {
      display: flex;
      flex-direction: column;
      flex: 1;
      background: #1e1e1e;
      overflow: hidden;
    }
    .tabs-bar {
      height: 35px;
      background: #181818;
      border-bottom: 1px solid #2b2b2b;
      display: flex;
      align-items: center;
    }
    .tab {
      height: 100%;
      background: #1e1e1e;
      border-right: 1px solid #2b2b2b;
      padding: 0 16px;
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 12px;
      color: #ffffff;
    }
    .tab .close-btn {
      color: #858585;
      font-size: 12px;
      margin-left: 6px;
    }
    .breadcrumbs-bar {
      height: 24px;
      background: #1e1e1e;
      border-bottom: 1px solid #2b2b2b;
      padding: 0 16px;
      display: flex;
      align-items: center;
      gap: 6px;
      font-family: Consolas, 'Courier New', monospace;
      font-size: 11px;
      color: #858585;
    }
    .breadcrumb-item.active {
      color: #cccccc;
    }
    .breadcrumb-sep {
      color: #555555;
    }
    /* Code Viewer */
    .code-viewport {
      flex: 1;
      overflow-y: auto;
      padding: 10px 0 50px 0;
      font-family: Consolas, 'Courier New', monospace;
      font-size: 13px;
      line-height: 22px;
    }
    .code-line {
      display: flex;
      align-items: center;
      width: 100%;
    }
    .code-line.highlighted {
      background: rgba(38, 79, 120, 0.45);
      border-left: 3px solid #007acc;
    }
    .line-num {
      width: 58px;
      text-align: right;
      padding-right: 16px;
      color: #858585;
      flex-shrink: 0;
      user-select: none;
    }
    .line-num.highlighted {
      color: #e2e8f0;
      font-weight: 600;
    }
    .line-content {
      flex: 1;
      white-space: pre;
      color: #d4d4d4;
      padding-right: 24px;
    }
    .line-content.highlighted {
      color: #ffffff;
    }
    /* Status Bar */
    .statusbar {
      height: 22px;
      background: #007acc;
      color: #ffffff;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 12px;
      font-size: 11px;
      z-index: 10;
    }
    .statusbar-left, .statusbar-right {
      display: flex;
      align-items: center;
      gap: 14px;
    }
  </style>
</head>
<body>
  <div class="vscode-container">
    <!-- Title Bar -->
    <header class="titlebar">
      <div class="titlebar-left">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="#007acc">
          <path d="M18.5 2.5 12 8.5 7 4.5 3.5 6v12L7 19.5l5-4 6.5 6 3-1.5V4l-3-1.5z" />
        </svg>
        <div class="titlebar-path">
          <span class="sub">cpk-ms-agent-python</span>
          <span class="sub">/</span>
          <span>${escapeHtml(normalizedPath)}</span>
          <span class="sub">- Visual Studio Code</span>
        </div>
      </div>
      <div class="titlebar-controls">
        <span>&#x2500;</span>
        <span>&#x25A1;</span>
        <span>&#x2715;</span>
      </div>
    </header>

    <!-- Main Workspace -->
    <div class="main-body">
      <!-- Activity Bar -->
      <aside class="activity-bar">
        <div class="activity-group">
          <!-- Explorer (Active) -->
          <div class="activity-icon active">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
              <path d="M4 4h6l2 2h8a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" />
            </svg>
          </div>
          <!-- Search -->
          <div class="activity-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
          </div>
          <!-- Source Control -->
          <div class="activity-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
              <circle cx="18" cy="18" r="3" />
              <circle cx="6" cy="6" r="3" />
              <path d="M18 15V9a9 9 0 0 0-9-9" />
              <path d="M6 9v12" />
            </svg>
          </div>
          <!-- Run & Debug -->
          <div class="activity-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
              <path d="M5 3l14 9-14 9V3z" />
            </svg>
          </div>
          <!-- Extensions -->
          <div class="activity-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
            </svg>
          </div>
        </div>
        <div class="activity-group">
          <div class="activity-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </div>
        </div>
      </aside>

      <!-- Sidebar -->
      <div class="sidebar">
        <div class="sidebar-header">
          <span>Explorer</span>
          <span style="color:#858585;">&#x22EF;</span>
        </div>
        <div class="sidebar-project">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="m6 9 6 6 6-6" />
          </svg>
          <span>CPK-MS-AGENT</span>
        </div>
        <div class="file-tree">
          ${treeNodes.join('')}
        </div>
      </div>

      <!-- Editor Pane -->
      <main class="editor-pane">
        <div class="tabs-bar">
          <div class="tab">
            <span>${fileIcon}</span>
            <span>${escapeHtml(fileName)}</span>
            <span class="close-btn">&#x2715;</span>
          </div>
        </div>

        <div class="breadcrumbs-bar">
          ${breadcrumbsHtml}
        </div>

        <div class="code-viewport">
          ${linesHtml}
        </div>
      </main>
    </div>

    <!-- Status Bar -->
    <footer class="statusbar">
      <div class="statusbar-left">
        <span style="display:flex;align-items:center;gap:4px;">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="18" cy="18" r="3" />
            <circle cx="6" cy="6" r="3" />
            <path d="M18 15V9a9 9 0 0 0-9-9" />
            <path d="M6 9v12" />
          </svg>
          main*
        </span>
        <span>⊗ 0  ⚠ 0</span>
      </div>
      <div class="statusbar-right">
        <span>Ln ${startLine}, Col 1</span>
        <span>Spaces: 2</span>
        <span>UTF-8</span>
        <span>${langLabel}</span>
        <span>Prettier</span>
      </div>
    </footer>
  </div>
</body>
</html>`;
}

