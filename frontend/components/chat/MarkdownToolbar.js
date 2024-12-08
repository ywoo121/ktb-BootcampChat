import React, { useCallback } from 'react';
import { Button, ButtonGroup } from '@goorm-dev/vapor-components';
import {
  Bold,
  Italic,
  Code,
  FileCode2,
  List,
  ListOrdered,
  Quote,
  Heading2,
  Link2
} from 'lucide-react';

const MarkdownToolbar = ({ onAction, className = '', size = 'xs' }) => {
  // OS 확인
  const isMac = typeof window !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const modifierKey = isMac ? '⌘' : 'Ctrl';
  
  const toolbarActions = [
    { 
      id: 'bold',
      icon: Bold, 
      markdown: '**',
      tooltip: '굵게',
      shortcut: `${modifierKey}+B`,
      keyBinding: { key: 'b', modifier: true }
    },
    { 
      id: 'italic',
      icon: Italic, 
      markdown: '_',
      tooltip: '기울임',
      shortcut: `${modifierKey}+I`,
      keyBinding: { key: 'i', modifier: true }
    },
    { 
      id: 'inline-code',
      icon: Code, 
      markdown: '`',
      tooltip: '인라인 코드',
      shortcut: `${modifierKey}+\``,
      keyBinding: { key: '`', modifier: true }
    },
    { 
      id: 'code-block',
      icon: FileCode2, 
      markdown: '```\n\n```',
      tooltip: '코드 블록',
      shortcut: `${modifierKey}+Shift+C`,
      keyBinding: { key: 'c', modifier: true, shift: true }
    },
    { 
      id: 'bullet-list',
      icon: List, 
      markdown: '- ',
      tooltip: '글머리 기호',
      shortcut: `${modifierKey}+U`,
      keyBinding: { key: 'u', modifier: true }
    },
    { 
      id: 'numbered-list',
      icon: ListOrdered, 
      markdown: '1. ',
      tooltip: '번호 매기기',
      shortcut: `${modifierKey}+O`,
      keyBinding: { key: 'o', modifier: true }
    },
    { 
      id: 'quote',
      icon: Quote, 
      markdown: '> ',
      tooltip: '인용',
      shortcut: `${modifierKey}+Q`,
      keyBinding: { key: 'q', modifier: true }
    },
    { 
      id: 'heading',
      icon: Heading2, 
      markdown: '## ',
      tooltip: '제목',
      shortcut: `${modifierKey}+H`,
      keyBinding: { key: 'h', modifier: true }
    },
    { 
      id: 'link',
      icon: Link2, 
      markdown: '[](url)',
      tooltip: '링크',
      shortcut: `${modifierKey}+K`,
      keyBinding: { key: 'k', modifier: true }
    }
  ];

  const handleKeyDown = useCallback((e) => {
    const isModifierPressed = isMac ? e.metaKey : e.ctrlKey;
    
    const action = toolbarActions.find(action => {
      const kb = action.keyBinding;
      return kb.key === e.key.toLowerCase() &&
        kb.modifier === isModifierPressed &&
        (!kb.shift || kb.shift === e.shiftKey);
    });

    if (action) {
      e.preventDefault();
      onAction(action.markdown);
    }
  }, [onAction, isMac, toolbarActions]);

  React.useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  const ToolbarButton = ({ action }) => {
    const Icon = action.icon;
    return (
      <Button
        variant="ghost"
        onClick={() => onAction(action.markdown)}
        type="button"
        className="toolbar-button"
        title={`${action.tooltip} (${action.shortcut})`}
      >
        <Icon className="w-4 h-4" />
      </Button>
    );
  };

  return (
    <div className={`markdown-toolbar ${className}`}>
      <ButtonGroup size={size}>
        {toolbarActions.map((action) => (
          <ToolbarButton key={action.id} action={action} />
        ))}
      </ButtonGroup>
    </div>
  );
};

export default MarkdownToolbar;