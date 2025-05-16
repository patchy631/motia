'use client';

import React from 'react';
import { TypeScriptIcon, GitHubIcon, CodeSandboxIcon } from '../../../components/icons';

interface CodeSandboxProps {
  code?: string;
  language?: 'typescript' | 'javascript';
  title?: string;
  height?: string;
  repoPath?: string;
}

const CodeSandbox: React.FC<CodeSandboxProps> = ({
  height = '400px',
  repoPath = 'trello-flow',
}) => {

  return (
    <div className="relative" style={{ height }}>
      <div className="absolute rounded-t-lg top-0 left-0 right-0 z-10 p-1 px-3 flex items-center justify-between min-h-[40px] border border-[#310E7F] bg-linear-to-r from-[#160045] from-[57.54%] to-transparent to-[84.95%]">
        <div className="flex items-center">
          <TypeScriptIcon width={14} height={14} className="text-[#CDBCF0]" />
          <span className="ml-2 text-gray-300 text-sm">
            {repoPath} (CodeSandbox)
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <a 
            href="https://github.com/MotiaDev/motia-examples/tree/main/examples/trello-flow" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-gray-400 hover:text-white p-1 rounded-md hover:bg-[#1a1828] transition-colors"
          >
            <GitHubIcon width={14} height={14} />
          </a>
          <a 
            href="https://codesandbox.io/s/github/MotiaDev/motia-examples/tree/main/examples/trello-flow" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-gray-400 hover:text-white p-1 rounded-md hover:bg-[#1a1828] transition-colors"
          >
            <CodeSandboxIcon width={14} height={14} />
          </a>
        </div>
      </div>

      <div className="pt-[40px] h-full">
        <iframe
          src="https://codesandbox.io/embed/github/MotiaDev/motia-examples/tree/main/examples/trello-flow?fontsize=14&hidenavigation=0&theme=dark&view=preview&runonclick=1&forcerefresh"
          style={{
            width: '100%',
            height: `calc(${height} - 40px)`,
            border: 0,
            borderRadius: '4px',
            overflow: 'hidden',
          }}
          title="MotiaDev/motia-examples: trello-flow"
          allow="accelerometer; ambient-light-sensor; camera; encrypted-media; geolocation; gyroscope; hid; microphone; midi; payment; usb; vr; xr-spatial-tracking"
          sandbox="allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts"
        ></iframe>
      </div>
    </div>
  );
};

export default CodeSandbox; 