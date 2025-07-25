import React, { useState, useEffect, useRef, useCallback } from 'react';
import slashCommandService from '../../services/slashCommandService';

const SlashCommandDropdown = ({
  isOpen,
  onClose,
  onSelect,
  searchQuery = '',
  position = { top: 0, left: 0 }
}) => {
  const [commands, setCommands] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);
  const itemRefs = useRef([]);

  // Search commands when query changes
  useEffect(() => {
    if (!isOpen || !searchQuery) {
      setCommands([]);
      return;
    }

    const searchCommands = async () => {
      setLoading(true);
      try {
        const result = await slashCommandService.searchCommands(searchQuery);
        if (result.success) {
          setCommands(result.commands.slice(0, 8)); // Limit to 8 results
          setSelectedIndex(0);
        }
      } catch (error) {
        console.error('Failed to search commands:', error);
        setCommands([]);
      } finally {
        setLoading(false);
      }
    };

    searchCommands();
  }, [searchQuery, isOpen]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e) => {
    if (!isOpen || commands.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < commands.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : commands.length - 1
        );
        break;
      case 'Enter':
      case 'Tab':
        e.preventDefault();
        if (commands[selectedIndex]) {
          onSelect(commands[selectedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        onClose();
        break;
    }
  }, [isOpen, commands, selectedIndex, onSelect, onClose]);

  // Set up keyboard event listeners
  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isOpen, handleKeyDown]);

  // Scroll selected item into view
  useEffect(() => {
    if (selectedIndex >= 0 && itemRefs.current[selectedIndex]) {
      itemRefs.current[selectedIndex].scrollIntoView({
        block: 'nearest',
        behavior: 'smooth'
      });
    }
  }, [selectedIndex]);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isOpen, onClose]);

  const handleItemClick = (command) => {
    onSelect(command);
  };

  const handleItemMouseEnter = (index) => {
    setSelectedIndex(index);
  };

  const getCategoryIcon = (category) => {
    const icons = {
      general: '⚡',
      utility: '🔧',
      fun: '🎮',
      admin: '⚙️'
    };
    return icons[category] || '📝';
  };

  const getCategoryColor = (category) => {
    const colors = {
      general: '#3b82f6',
      utility: '#10b981',
      fun: '#f59e0b',
      admin: '#ef4444'
    };
    return colors[category] || '#6b7280';
  };

  if (!isOpen) return null;

  return (
    <div
      ref={dropdownRef}
      className="slash-command-dropdown"
      style={{
        position: 'fixed',
        top: position.top,
        left: position.left,
        zIndex: 9999
      }}
    >
      <div className="dropdown-container">
        {loading ? (
          <div className="loading-item">
            <div className="loading-spinner"></div>
            <span>명령어 검색 중...</span>
          </div>
        ) : commands.length > 0 ? (
          <>
            <div className="dropdown-header">
              <span className="header-icon">⚡</span>
              <span className="header-text">슬래시 명령어</span>
              <span className="command-count">{commands.length}</span>
            </div>
            <div className="commands-list">
              {commands.map((command, index) => (
                <div
                  key={command.name}
                  ref={el => itemRefs.current[index] = el}
                  className={`command-item ${index === selectedIndex ? 'selected' : ''}`}
                  onClick={() => handleItemClick(command)}
                  onMouseEnter={() => handleItemMouseEnter(index)}
                >
                  <div className="command-main">
                    <div className="command-header">
                      <span 
                        className="category-icon"
                        style={{ color: getCategoryColor(command.category) }}
                      >
                        {getCategoryIcon(command.category)}
                      </span>
                      <span className="command-name">/{command.name}</span>
                      <span 
                        className="category-badge"
                        style={{ backgroundColor: getCategoryColor(command.category) }}
                      >
                        {command.category}
                      </span>
                    </div>
                    <div className="command-description">
                      {command.description}
                    </div>
                    <div className="command-usage">
                      {command.usage}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="dropdown-footer">
              <span className="footer-hint">
                ↑↓ 탐색 • ↵ 선택 • Esc 닫기
              </span>
            </div>
          </>
        ) : searchQuery ? (
          <div className="no-results">
            <span className="no-results-icon">🔍</span>
            <span className="no-results-text">
              "{searchQuery}"에 대한 명령어를 찾을 수 없습니다
            </span>
          </div>
        ) : null}
      </div>

      <style jsx>{`
        .slash-command-dropdown {
          font-family: inherit;
          font-size: 14px;
        }

        .dropdown-container {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
          max-width: 400px;
          min-width: 320px;
          max-height: 400px;
          overflow: hidden;
          backdrop-filter: blur(10px);
        }

        .dropdown-header {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 16px;
          background: #f8fafc;
          border-bottom: 1px solid #e5e7eb;
          font-weight: 600;
          color: #374151;
        }

        .header-icon {
          font-size: 16px;
        }

        .header-text {
          flex: 1;
        }

        .command-count {
          background: #3b82f6;
          color: white;
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 500;
        }

        .commands-list {
          max-height: 280px;
          overflow-y: auto;
        }

        .command-item {
          padding: 12px 16px;
          cursor: pointer;
          border-bottom: 1px solid #f3f4f6;
          transition: background-color 0.15s ease;
        }

        .command-item:hover,
        .command-item.selected {
          background: #f0f9ff;
        }

        .command-item.selected {
          border-left: 3px solid #3b82f6;
        }

        .command-item:last-child {
          border-bottom: none;
        }

        .command-main {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .command-header {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .category-icon {
          font-size: 14px;
        }

        .command-name {
          font-weight: 600;
          color: #1f2937;
          font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
        }

        .category-badge {
          color: white;
          padding: 2px 6px;
          border-radius: 8px;
          font-size: 10px;
          font-weight: 500;
          text-transform: uppercase;
          margin-left: auto;
        }

        .command-description {
          color: #6b7280;
          font-size: 13px;
          line-height: 1.4;
        }

        .command-usage {
          color: #9ca3af;
          font-size: 12px;
          font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
          background: #f9fafb;
          padding: 4px 8px;
          border-radius: 6px;
          border: 1px solid #e5e7eb;
        }

        .dropdown-footer {
          padding: 8px 16px;
          background: #f8fafc;
          border-top: 1px solid #e5e7eb;
          text-align: center;
        }

        .footer-hint {
          color: #9ca3af;
          font-size: 11px;
        }

        .loading-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 20px 16px;
          color: #6b7280;
        }

        .loading-spinner {
          width: 16px;
          height: 16px;
          border: 2px solid #e5e7eb;
          border-top: 2px solid #3b82f6;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        .no-results {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          padding: 24px 16px;
          color: #6b7280;
          text-align: center;
        }

        .no-results-icon {
          font-size: 24px;
          opacity: 0.5;
        }

        .no-results-text {
          font-size: 13px;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        /* Scrollbar styles */
        .commands-list::-webkit-scrollbar {
          width: 6px;
        }

        .commands-list::-webkit-scrollbar-track {
          background: #f1f5f9;
        }

        .commands-list::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 3px;
        }

        .commands-list::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
    </div>
  );
};

export default SlashCommandDropdown;