const express = require('express');
const router = express.Router();
const slashCommandService = require('../services/slashCommandService');
const { authenticateToken } = require('../middleware/auth');

// GET /api/slash-commands - Get all available commands
router.get('/', authenticateToken, (req, res) => {
  try {
    const commands = slashCommandService.getAllCommands();
    res.json({
      success: true,
      commands
    });
  } catch (error) {
    console.error('Get commands error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get commands'
    });
  }
});

// GET /api/slash-commands/search - Search commands by query
router.get('/search', authenticateToken, (req, res) => {
  try {
    const { q: query } = req.query;
    
    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'Query parameter is required'
      });
    }

    const commands = slashCommandService.searchCommands(query);
    res.json({
      success: true,
      commands,
      query
    });
  } catch (error) {
    console.error('Search commands error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search commands'
    });
  }
});

// POST /api/slash-commands/execute - Execute a slash command
router.post('/execute', authenticateToken, async (req, res) => {
  try {
    const { command, args = [], roomId } = req.body;
    const user = req.user;

    if (!command) {
      return res.status(400).json({
        success: false,
        message: 'Command is required'
      });
    }

    // Mock room data (in real implementation, fetch from database)
    const room = { _id: roomId, name: 'Chat Room' };

    const result = await slashCommandService.executeCommand(
      command,
      args,
      user,
      room,
      null // Socket callback will be handled differently in real implementation
    );

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('Execute command error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to execute command'
    });
  }
});

// GET /api/slash-commands/emoji-presets - Get available emoji presets
router.get('/emoji-presets', authenticateToken, (req, res) => {
  try {
    const presets = slashCommandService.getEmojiPresets();
    const presetsWithEmojis = {};
    
    presets.forEach(preset => {
      presetsWithEmojis[preset] = slashCommandService.getPresetEmojis(preset);
    });

    res.json({
      success: true,
      presets: presetsWithEmojis
    });
  } catch (error) {
    console.error('Get emoji presets error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get emoji presets'
    });
  }
});

module.exports = router;