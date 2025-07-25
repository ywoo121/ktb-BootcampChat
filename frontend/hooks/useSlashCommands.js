import { useState, useEffect, useCallback, useRef } from 'react';
import slashCommandService from '../services/slashCommandService';

export const useSlashCommands = (socketRef, currentRoom) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const [suggestions, setSuggestions] = useState([]);
  const [lastExecutedCommand, setLastExecutedCommand] = useState(null);
  const inputRef = useRef(null);

  // Initialize commands on mount
  useEffect(() => {
    slashCommandService.preloadCommands();
  }, []);

  // Socket event listeners for slash commands
  useEffect(() => {
    if (!socketRef?.current) return;

    const socket = socketRef.current;

    const handleSlashCommandSearchResults = (data) => {
      setSuggestions(data.commands || []);
    };

    const handleSlashCommandResult = (data) => {
      setLastExecutedCommand(data);
      console.log('Slash command executed:', data);
    };

    const handleSlashCommandError = (data) => {
      console.error('Slash command error:', data.error);
      // You could show a toast notification here
    };

    socket.on('slashCommandSearchResults', handleSlashCommandSearchResults);
    socket.on('slashCommandResult', handleSlashCommandResult);
    socket.on('slashCommandError', handleSlashCommandError);

    return () => {
      socket.off('slashCommandSearchResults', handleSlashCommandSearchResults);
      socket.off('slashCommandResult', handleSlashCommandResult);
      socket.off('slashCommandError', handleSlashCommandError);
    };
  }, [socketRef]);

  // Parse and handle slash command input
  const handleInputChange = useCallback((value, inputElement) => {
    if (!value.startsWith('/')) {
      if (isDropdownOpen) {
        setIsDropdownOpen(false);
        setSearchQuery('');
      }
      return false;
    }

    const parts = value.slice(1).split(' ');
    const command = parts[0];
    
    if (command.length === 0) {
      setIsDropdownOpen(false);
      setSearchQuery('');
      return true;
    }

    // Update search query and position
    setSearchQuery(command);
    
    if (inputElement) {
      const rect = inputElement.getBoundingClientRect();
      setDropdownPosition({
        top: rect.top - 10,
        left: rect.left
      });
    }

    // Search commands via socket for real-time suggestions
    if (socketRef?.current) {
      socketRef.current.emit('slashCommandSearch', { query: command });
    }

    setIsDropdownOpen(true);
    return true;
  }, [isDropdownOpen, socketRef]);

  // Execute slash command
  const executeSlashCommand = useCallback((commandText) => {
    if (!socketRef?.current || !currentRoom) return false;

    const parsed = slashCommandService.parseSlashCommand(commandText);
    if (!parsed) return false;

    // Handle special commands locally first
    if (parsed.command === '/clear') {
      // Clear command is handled by the parent component
      return { type: 'clear_local' };
    }

    // Send command to server for execution
    socketRef.current.emit('executeSlashCommand', {
      command: parsed.command,
      args: parsed.args,
      roomId: currentRoom.id
    });

    setIsDropdownOpen(false);
    setSearchQuery('');
    
    return { type: 'executed', command: parsed };
  }, [socketRef, currentRoom]);

  // Handle command selection from dropdown
  const handleCommandSelect = useCallback((command) => {
    setIsDropdownOpen(false);
    setSearchQuery('');
    
    return `/${command.name} `;
  }, []);

  // Close dropdown
  const closeDropdown = useCallback(() => {
    setIsDropdownOpen(false);
    setSearchQuery('');
  }, []);

  // Check if text is a slash command
  const isSlashCommand = useCallback((text) => {
    return slashCommandService.isSlashCommand(text);
  }, []);

  // Get command info for a given text
  const getCommandInfo = useCallback((text) => {
    return slashCommandService.parseSlashCommand(text);
  }, []);

  // Format command result for display
  const formatCommandResult = useCallback((result) => {
    if (!result) return null;

    switch (result.type) {
      case 'help_list':
        return {
          type: 'help',
          content: formatHelpList(result.categories)
        };
      case 'help_detail':
        return {
          type: 'help',
          content: formatHelpDetail(result.command)
        };
      case 'emoji_rain':
        return {
          type: 'system',
          content: result.message
        };
      case 'weather':
        return {
          type: 'weather',
          content: formatWeatherResult(result.data)
        };
      case 'time':
        return {
          type: 'time',
          content: `🕐 ${result.timezone}: ${result.time}`
        };
      case 'dice_roll':
        return {
          type: 'game',
          content: result.message
        };
      case 'coin_flip':
        return {
          type: 'game',
          content: result.message
        };
      case 'action_message':
        return {
          type: 'action',
          content: result.message
        };
      case 'translate_request':
        return {
          type: 'system',
          content: result.message
        };
      case 'error':
        return {
          type: 'error',
          content: `❌ ${result.message}`
        };
      default:
        return {
          type: 'system',
          content: result.message || JSON.stringify(result)
        };
    }
  }, []);

  // Helper functions for formatting
  const formatHelpList = (categories) => {
    let content = '**사용 가능한 명령어:**\n\n';
    
    Object.entries(categories).forEach(([category, commands]) => {
      const categoryName = {
        general: '일반',
        utility: '유틸리티',
        fun: '재미',
        admin: '관리'
      }[category] || category;
      
      content += `**${categoryName}:**\n`;
      commands.forEach(cmd => {
        content += `• \`/${cmd.name}\` - ${cmd.description}\n`;
      });
      content += '\n';
    });
    
    content += '자세한 정보를 보려면 `/help [명령어]`를 사용하세요.';
    return content;
  };

  const formatHelpDetail = (command) => {
    return `**/${command.name}** - ${command.description}\n\n` +
           `**사용법:** \`${command.usage}\`\n` +
           `**카테고리:** ${command.category}`;
  };

  const formatWeatherResult = (data) => {
    return `🌤️ **${data.city}의 날씨**\n` +
           `온도: ${data.temperature}°C\n` +
           `상태: ${data.condition}\n` +
           `습도: ${data.humidity}%`;
  };

  return {
    // State
    isDropdownOpen,
    searchQuery,
    dropdownPosition,
    suggestions,
    lastExecutedCommand,
    
    // Methods
    handleInputChange,
    executeSlashCommand,
    handleCommandSelect,
    closeDropdown,
    isSlashCommand,
    getCommandInfo,
    formatCommandResult,
    
    // Refs
    inputRef
  };
};