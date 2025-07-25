class SlashCommandService {
  constructor() {
    this.commands = {
      '/help': {
        name: 'help',
        description: '사용 가능한 명령어 목록을 표시합니다',
        usage: '/help [명령어]',
        category: 'general',
        handler: this.handleHelp.bind(this)
      },
      '/clear': {
        name: 'clear',
        description: '채팅 화면을 정리합니다',
        usage: '/clear',
        category: 'utility',
        handler: this.handleClear.bind(this)
      },
      '/emoji': {
        name: 'emoji',
        description: '이모지 레인 효과를 시작합니다',
        usage: '/emoji [이모지] [강도]',
        category: 'fun',
        handler: this.handleEmojiRain.bind(this)
      },
      '/rain': {
        name: 'rain',
        description: '이모지 레인 효과를 시작합니다 (emoji 명령어의 별칭)',
        usage: '/rain [이모지] [강도]',
        category: 'fun',
        handler: this.handleEmojiRain.bind(this)
      },
      '/weather': {
        name: 'weather',
        description: '날씨 정보를 표시합니다',
        usage: '/weather [도시명]',
        category: 'utility',
        handler: this.handleWeather.bind(this)
      },
      '/time': {
        name: 'time',
        description: '현재 시간을 표시합니다',
        usage: '/time [시간대]',
        category: 'utility',
        handler: this.handleTime.bind(this)
      },
      '/translate': {
        name: 'translate',
        description: '메시지를 번역합니다',
        usage: '/translate [언어코드] [텍스트]',
        category: 'utility',
        handler: this.handleTranslate.bind(this)
      },
      '/roll': {
        name: 'roll',
        description: '주사위를 굴립니다',
        usage: '/roll [면수]d[개수]',
        category: 'fun',
        handler: this.handleRoll.bind(this)
      },
      '/flip': {
        name: 'flip',
        description: '동전을 던집니다',
        usage: '/flip',
        category: 'fun',
        handler: this.handleFlip.bind(this)
      },
      '/me': {
        name: 'me',
        description: '액션 메시지를 보냅니다',
        usage: '/me [액션]',
        category: 'general',
        handler: this.handleMe.bind(this)
      }
    };

    this.emojiPresets = {
      'party': ['🎉', '🎊', '🥳', '🎈', '🎁'],
      'love': ['❤️', '💕', '💖', '💝', '💗'],
      'weather': ['🌧️', '☔', '⛈️', '🌦️', '💧'],
      'snow': ['❄️', '⛄', '🌨️', '☃️', '🏔️'],
      'flowers': ['🌸', '🌺', '🌻', '🌹', '🌷'],
      'stars': ['⭐', '🌟', '✨', '💫', '🌠'],
      'food': ['🍕', '🍔', '🍟', '🌮', '🍰'],
      'animals': ['🐶', '🐱', '🐼', '🦊', '🐻']
    };
  }

  // Get all available commands
  getAllCommands() {
    return Object.values(this.commands).map(cmd => ({
      name: cmd.name,
      description: cmd.description,
      usage: cmd.usage,
      category: cmd.category
    }));
  }

  // Get commands that match the search query
  searchCommands(query) {
    const searchTerm = query.toLowerCase().replace('/', '');
    
    return Object.values(this.commands)
      .filter(cmd => 
        cmd.name.toLowerCase().includes(searchTerm) ||
        cmd.description.toLowerCase().includes(searchTerm)
      )
      .map(cmd => ({
        name: cmd.name,
        description: cmd.description,
        usage: cmd.usage,
        category: cmd.category
      }))
      .sort((a, b) => {
        // Prioritize exact matches
        const aExact = a.name.toLowerCase() === searchTerm;
        const bExact = b.name.toLowerCase() === searchTerm;
        if (aExact && !bExact) return -1;
        if (!aExact && bExact) return 1;
        
        // Then by name length (shorter first)
        return a.name.length - b.name.length;
      });
  }

  // Execute a slash command
  async executeCommand(command, args, user, room, socketCallback) {
    const cmd = this.commands[command];
    if (!cmd) {
      return {
        success: false,
        error: `알 수 없는 명령어입니다: ${command}`
      };
    }

    try {
      const result = await cmd.handler(args, user, room, socketCallback);
      return {
        success: true,
        result
      };
    } catch (error) {
      console.error(`Slash command error (${command}):`, error);
      return {
        success: false,
        error: `명령어 실행 중 오류가 발생했습니다: ${error.message}`
      };
    }
  }

  // Command handlers
  async handleHelp(args, user, room) {
    if (args.length > 0) {
      const cmdName = args[0].replace('/', '');
      const cmd = this.commands[`/${cmdName}`];
      
      if (cmd) {
        return {
          type: 'help_detail',
          command: cmd
        };
      } else {
        return {
          type: 'error',
          message: `명령어를 찾을 수 없습니다: ${cmdName}`
        };
      }
    }

    const categories = {};
    Object.values(this.commands).forEach(cmd => {
      if (!categories[cmd.category]) {
        categories[cmd.category] = [];
      }
      categories[cmd.category].push(cmd);
    });

    return {
      type: 'help_list',
      categories
    };
  }

  async handleClear(args, user, room, socketCallback) {
    // Clear command is handled on the frontend
    return {
      type: 'clear_chat',
      message: '채팅 화면이 정리되었습니다.'
    };
  }

  async handleEmojiRain(args, user, room, socketCallback) {
    let emojis = ['🎉'];
    let intensity = 'medium';

    if (args.length > 0) {
      const firstArg = args[0];
      
      // Check if it's a preset
      if (this.emojiPresets[firstArg]) {
        emojis = this.emojiPresets[firstArg];
      } else {
        // Check if it's a single emoji or list of emojis
        const emojiRegex = /(\p{Emoji_Presentation}|\p{Emoji}\uFE0F)/gu;
        const foundEmojis = firstArg.match(emojiRegex);
        if (foundEmojis && foundEmojis.length > 0) {
          emojis = foundEmojis;
        }
      }
    }

    if (args.length > 1) {
      const intensityArg = args[1].toLowerCase();
      if (['light', 'medium', 'heavy', 'extreme'].includes(intensityArg)) {
        intensity = intensityArg;
      }
    }

    // Emit emoji rain event to all users in the room
    if (socketCallback) {
      socketCallback('emojiRain', {
        emojis,
        intensity,
        duration: this.getIntensityDuration(intensity),
        user: user.name
      });
    }

    return {
      type: 'emoji_rain',
      emojis,
      intensity,
      message: `${user.name}님이 이모지 레인을 시작했습니다! ${emojis.join('')}`
    };
  }

  async handleWeather(args, user, room) {
    const city = args.join(' ') || '서울';
    
    // Mock weather data (in real implementation, you'd call a weather API)
    const weatherData = {
      city,
      temperature: Math.floor(Math.random() * 30) + 5,
      condition: ['맑음', '흐림', '비', '눈', '구름'][Math.floor(Math.random() * 5)],
      humidity: Math.floor(Math.random() * 100),
      icon: this.getWeatherIcon()
    };

    return {
      type: 'weather',
      data: weatherData
    };
  }

  async handleTime(args, user, room) {
    const timezone = args[0] || 'Asia/Seoul';
    
    try {
      const now = new Date();
      const timeString = now.toLocaleString('ko-KR', {
        timeZone: timezone,
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });

      return {
        type: 'time',
        timezone,
        time: timeString
      };
    } catch (error) {
      return {
        type: 'error',
        message: `잘못된 시간대입니다: ${timezone}`
      };
    }
  }

  async handleTranslate(args, user, room) {
    if (args.length < 2) {
      return {
        type: 'error',
        message: '사용법: /translate [언어코드] [텍스트]'
      };
    }

    const targetLang = args[0];
    const text = args.slice(1).join(' ');

    return {
      type: 'translate_request',
      targetLang,
      text,
      message: `번역 요청: "${text}" → ${targetLang}`
    };
  }

  async handleRoll(args, user, room) {
    let sides = 6;
    let count = 1;

    if (args.length > 0) {
      const diceNotation = args[0];
      const match = diceNotation.match(/^(\d+)?d(\d+)$/i);
      
      if (match) {
        count = parseInt(match[1]) || 1;
        sides = parseInt(match[2]);
      } else {
        const num = parseInt(diceNotation);
        if (!isNaN(num) && num > 0) {
          sides = num;
        }
      }
    }

    // Limit for safety
    count = Math.min(count, 10);
    sides = Math.min(sides, 1000);

    const results = [];
    for (let i = 0; i < count; i++) {
      results.push(Math.floor(Math.random() * sides) + 1);
    }

    const total = results.reduce((sum, roll) => sum + roll, 0);

    return {
      type: 'dice_roll',
      results,
      total,
      sides,
      count,
      message: `🎲 ${user.name}님이 ${count}d${sides}를 굴렸습니다: ${results.join(', ')} (총합: ${total})`
    };
  }

  async handleFlip(args, user, room) {
    const result = Math.random() < 0.5 ? '앞면' : '뒷면';
    const emoji = result === '앞면' ? '🪙' : '🪙';

    return {
      type: 'coin_flip',
      result,
      message: `${emoji} ${user.name}님이 동전을 던졌습니다: ${result}`
    };
  }

  async handleMe(args, user, room) {
    const action = args.join(' ');
    if (!action) {
      return {
        type: 'error',
        message: '사용법: /me [액션]'
      };
    }

    return {
      type: 'action_message',
      action,
      message: `*${user.name} ${action}*`
    };
  }

  // Helper methods
  getIntensityDuration(intensity) {
    const durations = {
      light: 3000,
      medium: 5000,
      heavy: 8000,
      extreme: 12000
    };
    return durations[intensity] || durations.medium;
  }

  getWeatherIcon() {
    const icons = ['☀️', '⛅', '🌧️', '❄️', '☁️'];
    return icons[Math.floor(Math.random() * icons.length)];
  }

  // Get emoji presets
  getEmojiPresets() {
    return Object.keys(this.emojiPresets);
  }

  // Get preset emojis
  getPresetEmojis(preset) {
    return this.emojiPresets[preset] || [];
  }
}

module.exports = new SlashCommandService();