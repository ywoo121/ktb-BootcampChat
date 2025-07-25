const express = require('express');
const router = express.Router();
const searchService = require('../services/searchService');
const { authMiddleware } = require('../middleware/auth');

// 통합 검색
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { 
      q: query, 
      filter = 'all', 
      sort = 'relevance', 
      limit = 50, 
      offset = 0,
      dateFrom,
      dateTo
    } = req.query;

    if (!query || query.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: '검색어는 최소 2글자 이상이어야 합니다.'
      });
    }

    const dateRange = (dateFrom || dateTo) ? {
      from: dateFrom ? new Date(dateFrom) : null,
      to: dateTo ? new Date(dateTo) : null
    } : null;

    const options = {
      filter,
      sortBy: sort,
      limit: parseInt(limit),
      offset: parseInt(offset),
      dateRange
    };

    const results = await searchService.searchAll(
      query.trim(),
      req.user.id,
      options
    );

    res.json(results);
  } catch (error) {
    console.error('Search API error:', error);
    res.status(500).json({
      success: false,
      message: '검색 중 오류가 발생했습니다.'
    });
  }
});

// 채팅방 검색
router.get('/rooms', authMiddleware, async (req, res) => {
  try {
    const { 
      q: query, 
      sort = 'relevance', 
      limit = 20, 
      offset = 0 
    } = req.query;

    if (!query || query.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: '검색어는 최소 2글자 이상이어야 합니다.'
      });
    }

    const options = {
      sortBy: sort,
      limit: parseInt(limit),
      offset: parseInt(offset)
    };

    const results = await searchService.searchRooms(
      query.trim(),
      req.user.id,
      options
    );

    res.json(results);
  } catch (error) {
    console.error('Room search API error:', error);
    res.status(500).json({
      success: false,
      message: '채팅방 검색 중 오류가 발생했습니다.'
    });
  }
});

// 메시지 검색
router.get('/messages', authMiddleware, async (req, res) => {
  try {
    const { 
      q: query, 
      sort = 'date', 
      limit = 30, 
      offset = 0,
      dateFrom,
      dateTo,
      roomId
    } = req.query;

    if (!query || query.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: '검색어는 최소 2글자 이상이어야 합니다.'
      });
    }

    const dateRange = (dateFrom || dateTo) ? {
      from: dateFrom ? new Date(dateFrom) : null,
      to: dateTo ? new Date(dateTo) : null
    } : null;

    const options = {
      sortBy: sort,
      limit: parseInt(limit),
      offset: parseInt(offset),
      dateRange,
      roomId
    };

    const results = await searchService.searchMessages(
      query.trim(),
      req.user.id,
      options
    );

    res.json(results);
  } catch (error) {
    console.error('Message search API error:', error);
    res.status(500).json({
      success: false,
      message: '메시지 검색 중 오류가 발생했습니다.'
    });
  }
});

// 사용자 검색
router.get('/users', authMiddleware, async (req, res) => {
  try {
    const { 
      q: query, 
      sort = 'relevance', 
      limit = 20, 
      offset = 0 
    } = req.query;

    if (!query || query.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: '검색어는 최소 2글자 이상이어야 합니다.'
      });
    }

    const options = {
      sortBy: sort,
      limit: parseInt(limit),
      offset: parseInt(offset)
    };

    const results = await searchService.searchUsers(
      query.trim(),
      req.user.id,
      options
    );

    res.json(results);
  } catch (error) {
    console.error('User search API error:', error);
    res.status(500).json({
      success: false,
      message: '사용자 검색 중 오류가 발생했습니다.'
    });
  }
});

// 고급 검색
router.post('/advanced', authMiddleware, async (req, res) => {
  try {
    const { 
      query, 
      filters = {},
      sort = 'relevance',
      limit = 30,
      offset = 0
    } = req.body;

    if (!query || query.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: '검색어는 최소 2글자 이상이어야 합니다.'
      });
    }

    const searchFilters = {
      ...filters,
      sortBy: sort,
      limit: parseInt(limit),
      offset: parseInt(offset)
    };

    const results = await searchService.advancedSearch(
      query.trim(),
      req.user.id,
      searchFilters
    );

    res.json(results);
  } catch (error) {
    console.error('Advanced search API error:', error);
    res.status(500).json({
      success: false,
      message: '고급 검색 중 오류가 발생했습니다.'
    });
  }
});

// 검색어 자동완성
router.get('/suggestions', authMiddleware, async (req, res) => {
  try {
    const { q: query, limit = 10 } = req.query;

    if (!query || query.trim().length < 1) {
      return res.json({
        success: true,
        suggestions: []
      });
    }

    const suggestions = await searchService.getSearchSuggestions(
      query.trim(),
      req.user.id,
      parseInt(limit)
    );

    res.json({
      success: true,
      suggestions
    });
  } catch (error) {
    console.error('Search suggestions API error:', error);
    res.status(500).json({
      success: false,
      message: '검색어 자동완성 중 오류가 발생했습니다.'
    });
  }
});

// 인기 검색어
router.get('/popular', authMiddleware, async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const popularTerms = await searchService.getPopularSearchTerms(
      req.user.id,
      parseInt(limit)
    );

    res.json({
      success: true,
      popularTerms
    });
  } catch (error) {
    console.error('Popular search terms API error:', error);
    res.status(500).json({
      success: false,
      message: '인기 검색어 조회 중 오류가 발생했습니다.'
    });
  }
});

// 검색 통계 (관리자용)
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    // 실제로는 검색 로그를 분석해서 통계를 제공
    // 여기서는 기본적인 정보만 제공
    const stats = {
      totalSearches: 0, // 구현 필요
      popularQueries: [],
      searchTrends: [],
      userSearchActivity: {
        daily: 0,
        weekly: 0,
        monthly: 0
      }
    };

    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Search stats API error:', error);
    res.status(500).json({
      success: false,
      message: '검색 통계 조회 중 오류가 발생했습니다.'
    });
  }
});

module.exports = router;