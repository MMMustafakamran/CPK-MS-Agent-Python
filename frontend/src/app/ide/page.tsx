import { readFile } from "fs/promises";
import { join } from "path";

interface IdePageProps {
  searchParams: Promise<{
    file?: string;
    startLine?: string;
    endLine?: string;
  }>;
}

export default async function IdePage({ searchParams }: IdePageProps) {
  const params = await searchParams;
  const filePath = params.file || "frontend/src/app/quickstart/demo-chat/page.tsx";
  const startLine = params.startLine ? parseInt(params.startLine, 10) : 1;
  const endLine = params.endLine ? parseInt(params.endLine, 10) : 40;

  let fileContent = "";
  try {
    const fullPath = join(process.cwd(), "..", filePath);
    fileContent = await readFile(fullPath, "utf-8");
  } catch {
    try {
      const altPath = join(process.cwd(), filePath);
      fileContent = await readFile(altPath, "utf-8");
    } catch {
      fileContent = `// File: ${filePath}\n// Code snippet for lines ${startLine}-${endLine}\n\nexport default function Demo() {\n  return <div>Loaded content for ${filePath}</div>;\n}`;
    }
  }

  const lines = fileContent.split("\n");
  const fileName = filePath.split("/").pop() || filePath;

  // Extract folder path for active file
  const pathParts = filePath.split("/");
  const isBackend = filePath.startsWith("backend");

  return (
    <div className="fixed inset-0 z-[999999] flex flex-col bg-[#1e1e1e] text-[#cccccc] font-mono text-[13px] select-none">
      {/* Hide global CopilotKit floating dev console / inspector on the IDE screen */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            [class*="copilotKitDevConsole"],
            [class*="copilotKitInspector"],
            [aria-label*="Inspector"],
            [class*="devConsole"],
            .copilotKitDevConsole,
            .copilotkit-dev-console {
              display: none !important;
              opacity: 0 !important;
              pointer-events: none !important;
            }
          `,
        }}
      />

      {/* VS Code Title Bar */}
      <div className="h-8 bg-[#323233] border-b border-[#252526] flex items-center justify-between px-3 text-xs text-[#969696]">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5 mr-2">
            <span className="w-3 h-3 rounded-full bg-[#ff5f56]" />
            <span className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
            <span className="w-3 h-3 rounded-full bg-[#27c93f]" />
          </div>
          <span className="text-[#cccccc] font-medium">{fileName}</span>
          <span>—</span>
          <span>CPK-MS-Agent-Python</span>
          <span>—</span>
          <span>Visual Studio Code</span>
        </div>
        <div className="text-[11px] text-[#6e7681]">UTF-8 • {fileName.endsWith(".py") ? "Python" : "TypeScript React"}</div>
      </div>

      {/* Main VS Code Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Activity Bar */}
        <div className="w-12 bg-[#333333] flex flex-col items-center py-2 gap-4 border-r border-[#252526] text-[#858585]">
          <div className="w-8 h-8 rounded flex items-center justify-center text-white border-l-2 border-[#007acc] bg-[#252526]">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
          </div>
          <div className="w-8 h-8 rounded flex items-center justify-center hover:text-white cursor-pointer">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <div className="w-8 h-8 rounded flex items-center justify-center hover:text-white cursor-pointer">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
            </svg>
          </div>
        </div>

        {/* Explorer Sidebar */}
        <div className="w-64 bg-[#252526] border-r border-[#1e1e1e] flex flex-col text-xs">
          <div className="h-7 px-4 flex items-center text-[11px] font-semibold tracking-wider text-[#bbbbbb] uppercase">
            Explorer: CPK-MS-AGENT-PYTHON
          </div>
          <div className="flex-1 overflow-y-auto py-1 px-2 space-y-0.5 font-sans text-[12px]">
            {/* Backend Folder */}
            <div className="space-y-0.5">
              <div className="text-[#cccccc] font-medium text-[11px] flex items-center gap-1.5 px-1 py-0.5 hover:bg-[#2a2d2e] rounded cursor-pointer">
                <span className="text-[10px]">{isBackend ? "▾" : "▸"}</span>
                <span>📁 backend</span>
              </div>
              {isBackend && (
                <div className="pl-4 space-y-0.5">
                  {["agents.py", "chat_client.py", "main.py"].map((f) => (
                    <div
                      key={f}
                      className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] ${
                        filePath.endsWith(f)
                          ? "bg-[#37373d] text-white font-medium"
                          : "text-[#969696] hover:bg-[#2a2d2e] hover:text-[#cccccc]"
                      }`}
                    >
                      <span className="text-[#3572A5] text-[10px]">🐍</span>
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Frontend Folder */}
            <div className="space-y-0.5">
              <div className="text-[#cccccc] font-medium text-[11px] flex items-center gap-1.5 px-1 py-0.5 hover:bg-[#2a2d2e] rounded cursor-pointer">
                <span className="text-[10px]">{!isBackend ? "▾" : "▸"}</span>
                <span>📁 frontend</span>
              </div>
              {!isBackend && (
                <div className="pl-3 space-y-0.5">
                  {/* src */}
                  <div className="text-[#bbbbbb] text-[11px] flex items-center gap-1.5 px-1 py-0.5">
                    <span className="text-[10px]">▾</span>
                    <span>📁 src</span>
                  </div>
                  <div className="pl-3 space-y-0.5">
                    {/* app */}
                    <div className="text-[#bbbbbb] text-[11px] flex items-center gap-1.5 px-1 py-0.5">
                      <span className="text-[10px]">▾</span>
                      <span>📁 app</span>
                    </div>
                    {/* Expanded Active Route Folder */}
                    <div className="pl-3 space-y-0.5">
                      {/* Show current route directory path */}
                      {pathParts.length > 4 && (
                        <div className="space-y-0.5">
                          <div className="text-[#bbbbbb] text-[11px] flex items-center gap-1.5 px-1 py-0.5">
                            <span className="text-[10px]">▾</span>
                            <span>📁 {pathParts[3]}</span>
                          </div>
                          <div className="pl-3 space-y-0.5">
                            {pathParts.length > 5 && (
                              <div className="text-[#bbbbbb] text-[11px] flex items-center gap-1.5 px-1 py-0.5">
                                <span className="text-[10px]">▾</span>
                                <span>📁 {pathParts[4]}</span>
                              </div>
                            )}
                            <div className="pl-3 flex items-center gap-1.5 px-2 py-1 rounded text-[11px] bg-[#37373d] text-white font-medium border-l-2 border-[#007acc]">
                              <span className="text-[#3178c6] text-[10px]">⚛️</span>
                              <span>{fileName}</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Collapsed sibling route folders for authentic tree look */}
                      {pathParts[3] !== "quickstart" && (
                        <div className="text-[#858585] text-[11px] flex items-center gap-1.5 px-1 py-0.5 hover:text-[#cccccc]">
                          <span className="text-[9px]">▸</span>
                          <span>📁 quickstart</span>
                        </div>
                      )}
                      {pathParts[3] !== "generative-ui" && (
                        <div className="text-[#858585] text-[11px] flex items-center gap-1.5 px-1 py-0.5 hover:text-[#cccccc]">
                          <span className="text-[9px]">▸</span>
                          <span>📁 generative-ui</span>
                        </div>
                      )}
                      {pathParts[3] !== "shared-state" && (
                        <div className="text-[#858585] text-[11px] flex items-center gap-1.5 px-1 py-0.5 hover:text-[#cccccc]">
                          <span className="text-[9px]">▸</span>
                          <span>📁 shared-state</span>
                        </div>
                      )}
                      {pathParts[3] !== "auth" && (
                        <div className="text-[#858585] text-[11px] flex items-center gap-1.5 px-1 py-0.5 hover:text-[#cccccc]">
                          <span className="text-[9px]">▸</span>
                          <span>📁 auth</span>
                        </div>
                      )}
                      <div className="text-[#858585] text-[11px] flex items-center gap-1.5 px-2 py-0.5 hover:text-[#cccccc]">
                        <span className="text-[#3178c6] text-[10px]">⚛️</span>
                        <span>layout.tsx</span>
                      </div>
                    </div>

                    {/* components folder */}
                    <div className="text-[#858585] text-[11px] flex items-center gap-1.5 px-1 py-0.5 hover:text-[#cccccc]">
                      <span className="text-[9px]">▸</span>
                      <span>📁 components</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Editor Area */}
        <div className="flex-1 flex flex-col bg-[#1e1e1e] overflow-hidden">
          {/* Tab bar */}
          <div className="h-9 bg-[#252526] flex items-center border-b border-[#1e1e1e] px-2 gap-1">
            <div className="h-full bg-[#1e1e1e] text-white px-3 flex items-center gap-2 text-xs border-t-2 border-[#007acc]">
              <span className={fileName.endsWith(".py") ? "text-[#3572A5]" : "text-[#3178c6]"}>
                {fileName.endsWith(".py") ? "🐍" : "⚛️"}
              </span>
              <span className="font-medium">{fileName}</span>
              <span className="text-[#858585] text-[10px] ml-1">✕</span>
            </div>
          </div>

          {/* Breadcrumbs */}
          <div className="h-6 bg-[#1e1e1e] border-b border-[#252526] px-4 flex items-center text-[11px] text-[#858585] gap-1.5">
            <span>CPK-MS-Agent-Python</span>
            <span>›</span>
            <span>{filePath.replace(/\//g, " › ")}</span>
          </div>

          {/* Code Viewer with Snippet Highlighting */}
          <div
            id="code-scroll-container"
            className="flex-1 overflow-y-auto overflow-x-auto p-4 leading-6 font-mono text-[13px]"
          >
            <div className="min-w-max">
              {lines.map((line, idx) => {
                const lineNum = idx + 1;
                const isHighlighted = lineNum >= startLine && lineNum <= endLine;
                return (
                  <div
                    key={idx}
                    id={lineNum === startLine ? "snippet-start" : undefined}
                    className={`flex items-stretch transition-colors ${
                      isHighlighted
                        ? "bg-[#264f78]/40 border-l-4 border-[#007acc] pl-1 font-medium text-white"
                        : "border-l-4 border-transparent pl-1 text-[#abb2bf] hover:bg-[#2a2d2e]"
                    }`}
                  >
                    <span
                      className={`w-10 text-right pr-4 select-none text-xs shrink-0 pt-0.5 ${
                        isHighlighted ? "text-[#c5c5c5] font-bold" : "text-[#656565]"
                      }`}
                    >
                      {lineNum}
                    </span>
                    <span className="whitespace-pre">
                      {line || " "}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Auto-scroll script */}
      <script
        dangerouslySetInnerHTML={{
          __html: `
            setTimeout(function() {
              var el = document.getElementById('snippet-start');
              if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }
            }, 300);
          `,
        }}
      />
    </div>
  );
}
