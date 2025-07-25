import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

class SlashCommandService {
  constructor() {
    this.apiClient = axios.create({
      baseURL: `${API_BASE_URL}/api/slash-commands`,
      timeout: 30000,
    });

    // Request interceptor to add auth token
    this.apiClient.interceptors.request.use((config) => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Response interceptor for error handling
    this.apiClient.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Token expired, redirect to login
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/?error=session_expired';
        }
        return Promise.reject(error);
      }
    );

    // Command cache
    this.commandCache = null;
    this.cacheTimestamp = null;
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  // Get all available commands
  async getAllCommands() {
    try {
      // Check cache first
      if (this.commandCache && this.cacheTimestamp && 
          Date.now() - this.cacheTimestamp < this.cacheTimeout) {
        return {
          success: true,
          commands: this.commandCache
        };
      }

      const response = await this.apiClient.get('/');
      
      // Update cache
      this.commandCache = response.data.commands;
      this.cacheTimestamp = Date.now();

      return {
        success: true,
        commands: response.data.commands
      };
    } catch (error) {
      console.error('Get commands error:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to get commands'
      };
    }
  }

  // Search commands by query
  async searchCommands(query) {
    try {
      if (!query || query.trim().length === 0) {
        return {
          success: true,
          commands: [],
          query: ''
        };
      }

      const response = await this.apiClient.get('/search', {
        params: { q: query }
      });

      return {
        success: true,
        commands: response.data.commands,
        query: response.data.query
      };
    } catch (error) {
      console.error('Search commands error:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to search commands'
      };
    }
  }

  // Execute a slash command (via API)
  async executeCommand(command, args = [], roomId) {
    try {
      if (!command) {
        return {
          success: false,
          error: 'Command is required'
        };
      }

      const response = await this.apiClient.post('/execute', {
        command,
        args,
        roomId
      });

      return {
        success: true,
        result: response.data.result
      };
    } catch (error) {
      console.error('Execute command error:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to execute command'
      };
    }
  }

  // Get emoji presets
  async getEmojiPresets() {
    try {
      const response = await this.apiClient.get('/emoji-presets');
      return {
        success: true,
        presets: response.data.presets
      };
    } catch (error) {
      console.error('Get emoji presets error:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to get emoji presets'
      };
    }
  }

  // Parse slash command from text
  parseSlashCommand(text) {
    if (!text || !text.startsWith('/')) {
      return null;
    }

    const parts = text.slice(1).split(' ');
    const command = `/${parts[0]}`;
    const args = parts.slice(1);

    return {
      command,
      args,
      originalText: text
    };
  }

  // Check if text is a slash command
  isSlashCommand(text) {
    return text && text.startsWith('/') && text.length > 1;
  }

  // Get command suggestions for autocomplete
  getCommandSuggestions(text) {
    if (!this.isSlashCommand(text)) {
      return [];
    }

    const query = text.slice(1); // Remove the '/' prefix
    
    if (!this.commandCache) {
      return [];
    }

    return this.commandCache
      .filter(cmd => 
        cmd.name.toLowerCase().includes(query.toLowerCase()) ||
        cmd.description.toLowerCase().includes(query.toLowerCase())
      )
      .sort((a, b) => {
        // Prioritize exact matches
        const aExact = a.name.toLowerCase() === query.toLowerCase();
        const bExact = b.name.toLowerCase() === query.toLowerCase();
        if (aExact && !bExact) return -1;
        if (!aExact && bExact) return 1;
        
        // Then by name length (shorter first)
        return a.name.length - b.name.length;
      })
      .slice(0, 8); // Limit to 8 suggestions
  }

  // Format command for display
  formatCommandDisplay(command) {
    return {
      name: `/${command.name}`,
      description: command.description,
      usage: command.usage,
      category: command.category
    };
  }

  // Clear command cache
  clearCache() {
    this.commandCache = null;
    this.cacheTimestamp = null;
  }

  // Preload commands (call this when app starts)
  async preloadCommands() {
    try {
      await this.getAllCommands();
      return true;
    } catch (error) {
      console.error('Failed to preload commands:', error);
      return false;
    }
  }
}

export default new SlashCommandService();