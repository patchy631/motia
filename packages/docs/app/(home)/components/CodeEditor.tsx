'use client';

import React, { useEffect, useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import { SiRuby as RubyIcon } from "react-icons/si";
import { FaJava as JavaIcon, FaCheck, FaClipboard } from "react-icons/fa";

import { codeExamples, CodeLanguage } from './codeExamples';
import { 
  JavaScriptIcon, 
  TypeScriptIcon, 
  PythonIcon, 
} from '../../../components/icons';

// Custom dark theme for syntax highlighting
const customStyle = {
  ...atomDark,
  'pre[class*="language-"]': {
    ...atomDark['pre[class*="language-"]'],
    margin: 0,
    borderRadius: 0,
    background: '#0f0d19',
  },
  'code[class*="language-"]': {
    ...atomDark['code[class*="language-"]'],
    background: '#0f0d19',
    fontFamily: '"JetBrains Mono", "Fira Mono", "SF Mono", Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
    fontSize: '13px',
    lineHeight: '16px',
  },
  comment: {
    ...atomDark.comment,
    color: '#6c7d9c',
  },
  keyword: {
    ...atomDark.keyword,
    color: '#c678dd',
  },
  string: {
    ...atomDark.string,
    color: '#98c379',
  },
  function: {
    ...atomDark.function,
    color: '#4bbee3',
  },
  punctuation: {
    ...atomDark.punctuation,
    color: '#d4d2dc',
  },
};

interface CodeEditorProps {
  code?: string;
  language?: CodeLanguage;
  title?: string;
  height?: string;
  onLanguageChange?: (language: CodeLanguage) => void;
}

// Map our language keys to react-syntax-highlighter language keys
const languageMap: Record<CodeLanguage, string> = {
  typescript: 'typescript',
  javascript: 'javascript',
  python: 'python',
  ruby: 'ruby',
  java: 'java',
};

const CodeEditor: React.FC<CodeEditorProps> = ({
  code,
  language = 'typescript',
  onLanguageChange
}) => {
  const [selectedLanguage, setSelectedLanguage] = useState<CodeLanguage>(language);
  const [exampleCode, setExampleCode] = useState<string>(code || '');
  const [copySuccess, setCopySuccess] = useState<boolean>(false);

  useEffect(() => {
    // Set the code based on the selected language
    if (!code) {
      setExampleCode(codeExamples[selectedLanguage] || codeExamples.typescript);
    } else {
      setExampleCode(code);
    }
  }, [selectedLanguage, code]);

  const handleLanguageChange = (lang: CodeLanguage) => {
    setSelectedLanguage(lang);
    if (onLanguageChange) {
      onLanguageChange(lang);
    }
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(exampleCode);
      setCopySuccess(true);
      
      // Reset copy success state after 2 seconds
      setTimeout(() => {
        setCopySuccess(false);
      }, 2000);
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };

  return (
    <div className="w-full h-full rounded-md rounded-t-[16px] overflow-hidden bg-[#0f0d19]">
      <div className="w-full h-full overflow-hidden">
        <div className="p-1 px-3 flex items-center justify-between min-h-[75px] rounded-t-[16px] border border-[#310E7F] bg-linear-to-r from-[#160045] from-[57.54%] to-transparent to-[84.95%]">
          <div className="flex gap-1">
            <button 
              onClick={() => handleLanguageChange('javascript')}
              className={`flex items-center gap-1 text-xs px-3 py-1.5 transition-colors ${selectedLanguage === 'javascript' ? 'rounded-[4px] bg-[#3B1296] shadow-[0px_71px_20px_0px_rgba(18,0,61,0.02),0px_46px_18px_0px_rgba(18,0,61,0.15),0px_26px_15px_0px_rgba(18,0,61,0.50),0px_11px_11px_0px_rgba(18,0,61,0.85),0px_3px_6px_0px_rgba(18,0,61,0.98)] text-white' : 'text-gray-400 hover:text-white'}`}
            >
              <JavaScriptIcon width={14} height={14} className="text-[#CDBCF0]" />
              <span className="ml-1">JavaScript</span>
            </button>
            <button 
              onClick={() => handleLanguageChange('typescript')}
              className={`flex items-center gap-1 text-xs px-3 py-1.5 transition-colors ${selectedLanguage === 'typescript' ? 'rounded-[4px] bg-[#3B1296] shadow-[0px_71px_20px_0px_rgba(18,0,61,0.02),0px_46px_18px_0px_rgba(18,0,61,0.15),0px_26px_15px_0px_rgba(18,0,61,0.50),0px_11px_11px_0px_rgba(18,0,61,0.85),0px_3px_6px_0px_rgba(18,0,61,0.98)] text-white' : 'text-gray-400 hover:text-white'}`}
            >
              <TypeScriptIcon width={14} height={14} className="text-[#CDBCF0]" />
              <span className="ml-1">TypeScript</span>
            </button>
            <button 
              onClick={() => handleLanguageChange('python')}
              className={`flex items-center gap-1 text-xs px-3 py-1.5 transition-colors ${selectedLanguage === 'python' ? 'rounded-[4px] bg-[#3B1296] shadow-[0px_71px_20px_0px_rgba(18,0,61,0.02),0px_46px_18px_0px_rgba(18,0,61,0.15),0px_26px_15px_0px_rgba(18,0,61,0.50),0px_11px_11px_0px_rgba(18,0,61,0.85),0px_3px_6px_0px_rgba(18,0,61,0.98)] text-white' : 'text-gray-400 hover:text-white'}`}
            >
              <PythonIcon width={14} height={14} className="text-[#CDBCF0]" />
              <span className="ml-1">Python</span>
            </button>
            <button 
              onClick={() => handleLanguageChange('ruby')}
              className={`flex items-center gap-1 text-xs px-3 py-1.5 transition-colors ${selectedLanguage === 'ruby' ? 'rounded-[4px] bg-[#3B1296] shadow-[0px_71px_20px_0px_rgba(18,0,61,0.02),0px_46px_18px_0px_rgba(18,0,61,0.15),0px_26px_15px_0px_rgba(18,0,61,0.50),0px_11px_11px_0px_rgba(18,0,61,0.85),0px_3px_6px_0px_rgba(18,0,61,0.98)] text-white' : 'text-gray-400 hover:text-white'}`}
            >
              <RubyIcon width={14} height={14} className="text-[#CDBCF0]" />
              <span className="ml-1">Ruby</span>
            </button>
            <button 
              onClick={() => handleLanguageChange('java')}
              className={`flex items-center gap-1 text-xs px-3 py-1.5 transition-colors ${selectedLanguage === 'java' ? 'rounded-[4px] bg-[#3B1296] shadow-[0px_71px_20px_0px_rgba(18,0,61,0.02),0px_46px_18px_0px_rgba(18,0,61,0.15),0px_26px_15px_0px_rgba(18,0,61,0.50),0px_11px_11px_0px_rgba(18,0,61,0.85),0px_3px_6px_0px_rgba(18,0,61,0.98)] text-white' : 'text-gray-400 hover:text-white'}`}
              disabled
            >
              <JavaIcon width={13} height={14} className="text-[#CDBCF0]" />
              <span className="ml-1">Java (coming soon)</span>
            </button>
          </div>
          <button 
            onClick={handleCopyCode}
            className="text-gray-400 hover:text-white p-1.5 rounded-md hover:bg-[#1a1828] transition-colors flex items-center gap-1.5"
            title="Copy code"
          >
            {copySuccess ? (
                <FaCheck className="w-3.5 h-3.5" />
            ) : (
                <FaClipboard className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
        <div 
          style={{ position: 'relative' }}
          className="overflow-auto"
        >
          <SyntaxHighlighter
            language={languageMap[selectedLanguage]}
            style={customStyle}
            showLineNumbers={true}
            wrapLines={true}
            wrapLongLines
            customStyle={{
              margin: 0,
              height: '100%',
              width: '100%',
              overflow: 'auto',
              background: '#0f0d19',
              scrollbarWidth: 'none',
            }}
            lineNumberStyle={{
              color: '#6f6c81',
              opacity: 0.5,
              paddingRight: '1em',
              textAlign: 'right',
              userSelect: 'none',
            }}
          >
            {exampleCode}
          </SyntaxHighlighter>
        </div>
      </div>
    </div>
  );
};

export default CodeEditor;
