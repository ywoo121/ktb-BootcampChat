const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

class SearchService {
  constructor() {
    this.searchFilters = {
      ALL: 'all',
      ROOMS: 'rooms', 
      MESSAGES: 'messages',
      USERS: 'users'
    };

    this.sortOptions = {
      RELEVANCE: 'relevance',
      DATE: 'date',
      POPULARITY: 'popularity',
      ALPHABETICAL: 'alphabetical'
    };
  }

  // 통합 검색
  async searchAll(query, options = {}) {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('로그인이 필요합니다.');
      }

      const {
        filter = this.searchFilters.ALL,
        sort = this.sortOptions.RELEVANCE,
        limit = 50,
        offset = 0,
        dateFrom = null,
        dateTo = null
      } = options;

      const params = new URLSearchParams({
        q: query,
        filter,
        sort,
        limit: limit.toString(),
        offset: offset.toString()
      });

      if (dateFrom) params.append('dateFrom', dateFrom);
      if (dateTo) params.append('dateTo', dateTo);

      const response = await fetch(`${API_URL}/api/search?${params}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || '검색에 실패했습니다.');
      }

      return data;
    } catch (error) {
      console.error('Search all error:', error);
      throw error;
    }
  }

  // 채팅방 검색
  async searchRooms(query, options = {}) {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('로그인이 필요합니다.');
      }

      const {
        sort = this.sortOptions.RELEVANCE,
        limit = 20,
        offset = 0
      } = options;

      const params = new URLSearchParams({
        q: query,
        sort,
        limit: limit.toString(),
        offset: offset.toString()
      });

      const response = await fetch(`${API_URL}/api/search/rooms?${params}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || '채팅방 검색에 실패했습니다.');
      }

      return data;
    } catch (error) {
      console.error('Search rooms error:', error);
      throw error;
    }
  }

  // 메시지 검색
  async searchMessages(query, options = {}) {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('로그인이 필요합니다.');
      }

      const {
        sort = this.sortOptions.DATE,
        limit = 30,
        offset = 0,
        dateFrom = null,
        dateTo = null,
        roomId = null
      } = options;

      const params = new URLSearchParams({
        q: query,
        sort,
        limit: limit.toString(),
        offset: offset.toString()
      });

      if (dateFrom) params.append('dateFrom', dateFrom);
      if (dateTo) params.append('dateTo', dateTo);
      if (roomId) params.append('roomId', roomId);

      const response = await fetch(`${API_URL}/api/search/messages?${params}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || '메시지 검색에 실패했습니다.');
      }

      return data;
    } catch (error) {
      console.error('Search messages error:', error);
      throw error;
    }
  }

  // 사용자 검색
  async searchUsers(query, options = {}) {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('로그인이 필요합니다.');
      }

      const {
        sort = this.sortOptions.RELEVANCE,
        limit = 20,
        offset = 0
      } = options;

      const params = new URLSearchParams({
        q: query,
        sort,
        limit: limit.toString(),
        offset: offset.toString()
      });

      const response = await fetch(`${API_URL}/api/search/users?${params}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || '사용자 검색에 실패했습니다.');
      }

      return data;
    } catch (error) {
      console.error('Search users error:', error);
      throw error;
    }
  }

  // 고급 검색
  async advancedSearch(query, filters = {}) {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('로그인이 필요합니다.');
      }

      const {
        sort = this.sortOptions.RELEVANCE,
        limit = 30,
        offset = 0
      } = filters;

      const requestBody = {
        query,
        filters,
        sort,
        limit,
        offset
      };

      const response = await fetch(`${API_URL}/api/search/advanced`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || '고급 검색에 실패했습니다.');
      }

      return data;
    } catch (error) {
      console.error('Advanced search error:', error);
      throw error;
    }
  }

  // 검색어 자동완성
  async getSearchSuggestions(query, limit = 10) {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('로그인이 필요합니다.');
      }

      if (!query || query.length < 1) {
        return { success: true, suggestions: [] };
      }

      const params = new URLSearchParams({
        q: query,
        limit: limit.toString()
      });

      const response = await fetch(`${API_URL}/api/search/suggestions?${params}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || '자동완성 조회에 실패했습니다.');
      }

      return data;
    } catch (error) {
      console.error('Search suggestions error:', error);
      return { success: true, suggestions: [] };
    }
  }

  // 인기 검색어
  async getPopularSearchTerms(limit = 10) {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('로그인이 필요합니다.');
      }

      const params = new URLSearchParams({
        limit: limit.toString()
      });

      const response = await fetch(`${API_URL}/api/search/popular?${params}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || '인기 검색어 조회에 실패했습니다.');
      }

      return data;
    } catch (error) {
      console.error('Popular search terms error:', error);
      return { success: true, popularTerms: [] };
    }
  }

  // 최근 검색어 관리 (로컬스토리지)
  getRecentSearchTerms() {
    try {
      const recent = localStorage.getItem('recentSearchTerms');
      return recent ? JSON.parse(recent) : [];
    } catch (error) {
      console.error('Get recent search terms error:', error);
      return [];
    }
  }

  addRecentSearchTerm(term) {
    try {
      if (!term || term.trim().length < 2) return;

      const recent = this.getRecentSearchTerms();
      const trimmedTerm = term.trim();
      
      // 중복 제거
      const filtered = recent.filter(t => t.toLowerCase() !== trimmedTerm.toLowerCase());
      
      // 최대 10개까지 저장
      const updated = [trimmedTerm, ...filtered].slice(0, 10);
      
      localStorage.setItem('recentSearchTerms', JSON.stringify(updated));
    } catch (error) {
      console.error('Add recent search term error:', error);
    }
  }

  clearRecentSearchTerms() {
    try {
      localStorage.removeItem('recentSearchTerms');
    } catch (error) {
      console.error('Clear recent search terms error:', error);
    }
  }

  // 검색 설정 관리
  getSearchSettings() {
    try {
      const settings = localStorage.getItem('searchSettings');
      return settings ? JSON.parse(settings) : {
        defaultFilter: this.searchFilters.ALL,
        defaultSort: this.sortOptions.RELEVANCE,
        enableAutoComplete: true,
        enableRecentTerms: true,
        maxResults: 50
      };
    } catch (error) {
      console.error('Get search settings error:', error);
      return {
        defaultFilter: this.searchFilters.ALL,
        defaultSort: this.sortOptions.RELEVANCE,
        enableAutoComplete: true,
        enableRecentTerms: true,
        maxResults: 50
      };
    }
  }

  updateSearchSettings(settings) {
    try {
      const current = this.getSearchSettings();
      const updated = { ...current, ...settings };
      localStorage.setItem('searchSettings', JSON.stringify(updated));
    } catch (error) {
      console.error('Update search settings error:', error);
    }
  }

  // 유틸리티 메서드들
  highlightSearchTerm(text, query) {
    if (!text || !query) return text;
    
    const regex = new RegExp(`(${this.escapeRegExp(query)})`, 'gi');
    return text.replace(regex, '<mark class="search-highlight">$1</mark>');
  }

  escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  formatSearchDate(date) {
    if (!date) return '';
    
    const now = new Date();
    const searchDate = new Date(date);
    const diffInMs = now - searchDate;
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) {
      return '오늘';
    } else if (diffInDays === 1) {
      return '어제';
    } else if (diffInDays < 7) {
      return `${diffInDays}일 전`;
    } else if (diffInDays < 30) {
      const weeks = Math.floor(diffInDays / 7);
      return `${weeks}주 전`;
    } else if (diffInDays < 365) {
      const months = Math.floor(diffInDays / 30);
      return `${months}개월 전`;
    } else {
      return searchDate.toLocaleDateString('ko-KR');
    }
  }

  getSearchTypeIcon(type) {
    const icons = {
      room: '🏠',
      message: '💬',
      user: '👤',
      file: '📎'
    };
    return icons[type] || '🔍';
  }

  getFileTypeIcon(mimeType) {
    if (!mimeType) return '📄';
    
    if (mimeType.startsWith('image/')) return '🖼️';
    if (mimeType.startsWith('video/')) return '🎥';
    if (mimeType.startsWith('audio/')) return '🎵';
    if (mimeType.includes('pdf')) return '📕';
    if (mimeType.includes('document') || mimeType.includes('word')) return '📝';
    if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return '📊';
    if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return '📋';
    
    return '📄';
  }

  // 검색 결과 캐싱 (옵션)
  getCachedResults(query, filter) {
    try {
      const cacheKey = `search_${query}_${filter}`;
      const cached = sessionStorage.getItem(cacheKey);
      
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        const now = Date.now();
        
        // 5분간 캐시 유지
        if (now - timestamp < 5 * 60 * 1000) {
          return data;
        } else {
          sessionStorage.removeItem(cacheKey);
        }
      }
      
      return null;
    } catch (error) {
      console.error('Get cached results error:', error);
      return null;
    }
  }

  setCachedResults(query, filter, data) {
    try {
      const cacheKey = `search_${query}_${filter}`;
      const cacheData = {
        data,
        timestamp: Date.now()
      };
      
      sessionStorage.setItem(cacheKey, JSON.stringify(cacheData));
    } catch (error) {
      console.error('Set cached results error:', error);
    }
  }

  clearSearchCache() {
    try {
      const keys = Object.keys(sessionStorage);
      keys.forEach(key => {
        if (key.startsWith('search_')) {
          sessionStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.error('Clear search cache error:', error);
    }
  }
}

export default new SearchService();