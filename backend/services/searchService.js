const Room = require('../models/Room');
const Message = require('../models/Message');
const User = require('../models/User');

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

  // 통합 검색 - 채팅방, 메시지, 사용자 모두 검색
  async searchAll(query, userId, options = {}) {
    const {
      filter = this.searchFilters.ALL,
      sortBy = this.sortOptions.RELEVANCE,
      limit = 50,
      offset = 0,
      dateRange = null
    } = options;

    if (!query || query.trim().length < 2) {
      return {
        success: false,
        message: '검색어는 최소 2글자 이상이어야 합니다.'
      };
    }

    const searchTerm = query.trim();
    const results = {
      rooms: [],
      messages: [],
      users: [],
      totalCount: 0
    };

    try {
      // 병렬로 검색 실행
      const searchPromises = [];

      if (filter === this.searchFilters.ALL || filter === this.searchFilters.ROOMS) {
        searchPromises.push(this.searchRooms(searchTerm, userId, { limit, offset, sortBy }));
      }

      if (filter === this.searchFilters.ALL || filter === this.searchFilters.MESSAGES) {
        searchPromises.push(this.searchMessages(searchTerm, userId, { limit, offset, sortBy, dateRange }));
      }

      if (filter === this.searchFilters.ALL || filter === this.searchFilters.USERS) {
        searchPromises.push(this.searchUsers(searchTerm, userId, { limit, offset, sortBy }));
      }

      const searchResults = await Promise.all(searchPromises);

      // 결과 매핑
      if (filter === this.searchFilters.ALL) {
        results.rooms = searchResults[0]?.results || [];
        results.messages = searchResults[1]?.results || [];
        results.users = searchResults[2]?.results || [];
      } else if (filter === this.searchFilters.ROOMS) {
        results.rooms = searchResults[0]?.results || [];
      } else if (filter === this.searchFilters.MESSAGES) {
        results.messages = searchResults[0]?.results || [];
      } else if (filter === this.searchFilters.USERS) {
        results.users = searchResults[0]?.results || [];
      }

      results.totalCount = results.rooms.length + results.messages.length + results.users.length;

      return {
        success: true,
        results,
        query: searchTerm,
        filter,
        totalCount: results.totalCount
      };

    } catch (error) {
      console.error('Search error:', error);
      return {
        success: false,
        message: '검색 중 오류가 발생했습니다.'
      };
    }
  }

  // 채팅방 검색
  async searchRooms(query, userId, options = {}) {
    const { limit = 20, offset = 0, sortBy = this.sortOptions.RELEVANCE } = options;

    try {
      // 텍스트 검색 인덱스 활용
      const searchQuery = {
        $and: [
          {
            $or: [
              { participants: userId }, // 사용자가 참가한 방
              { isPrivate: false } // 또는 공개방
            ]
          },
          {
            $or: [
              { name: { $regex: query, $options: 'i' } },
              { description: { $regex: query, $options: 'i' } }
            ]
          }
        ]
      };

      let roomQuery = Room.find(searchQuery)
        .populate('participants', 'name email profileImage')
        .populate('createdBy', 'name email profileImage')
        .select('name description participants createdBy createdAt isPrivate isAnonymous')
        .skip(offset)
        .limit(limit);

      // 정렬 옵션 적용
      switch (sortBy) {
        case this.sortOptions.DATE:
          roomQuery = roomQuery.sort({ createdAt: -1 });
          break;
        case this.sortOptions.POPULARITY:
          roomQuery = roomQuery.sort({ 'participants.length': -1, createdAt: -1 });
          break;
        case this.sortOptions.ALPHABETICAL:
          roomQuery = roomQuery.sort({ name: 1 });
          break;
        default: // RELEVANCE
          // 제목에서 매치가 우선, 그 다음 설명에서 매치
          roomQuery = roomQuery.sort({
            $meta: 'textScore',
            createdAt: -1
          });
          break;
      }

      const rooms = await roomQuery.lean();

      // 각 방의 최근 메시지와 참가자 수 추가
      const enrichedRooms = await Promise.all(
        rooms.map(async (room) => {
          const lastMessage = await Message.findOne({ room: room._id })
            .sort({ timestamp: -1 })
            .populate('sender', 'name')
            .select('content timestamp sender type')
            .lean();

          return {
            ...room,
            participantCount: room.participants.length,
            lastMessage: lastMessage ? {
              content: lastMessage.content,
              timestamp: lastMessage.timestamp,
              senderName: lastMessage.sender?.name || 'Unknown'
            } : null,
            searchScore: this.calculateRoomRelevance(room, query)
          };
        })
      );

      return {
        success: true,
        results: enrichedRooms,
        totalCount: enrichedRooms.length
      };

    } catch (error) {
      console.error('Room search error:', error);
      return {
        success: false,
        results: [],
        message: '채팅방 검색 중 오류가 발생했습니다.'
      };
    }
  }

  // 메시지 검색
  async searchMessages(query, userId, options = {}) {
    const { limit = 30, offset = 0, sortBy = this.sortOptions.DATE, dateRange = null } = options;

    try {
      // 사용자가 접근 가능한 방 목록 먼저 조회
      const accessibleRooms = await Room.find({
        $or: [
          { participants: userId },
          { isPrivate: false }
        ]
      }).select('_id').lean();

      const roomIds = accessibleRooms.map(room => room._id);

      // 메시지 검색 쿼리 구성
      const searchQuery = {
        room: { $in: roomIds },
        content: { $regex: query, $options: 'i' },
        type: { $in: ['text', 'file'] } // 시스템 메시지 제외
      };

      // 날짜 범위 필터 적용
      if (dateRange) {
        searchQuery.timestamp = {};
        if (dateRange.from) {
          searchQuery.timestamp.$gte = new Date(dateRange.from);
        }
        if (dateRange.to) {
          searchQuery.timestamp.$lte = new Date(dateRange.to);
        }
      }

      let messageQuery = Message.find(searchQuery)
        .populate('sender', 'name email profileImage')
        .populate('room', 'name isPrivate isAnonymous')
        .populate('file', 'filename originalname mimetype')
        .select('content timestamp sender room type file reactions')
        .skip(offset)
        .limit(limit);

      // 정렬 옵션 적용
      switch (sortBy) {
        case this.sortOptions.RELEVANCE:
          // 검색어 위치와 빈도 기반 정렬
          messageQuery = messageQuery.sort({ timestamp: -1 });
          break;
        default: // DATE
          messageQuery = messageQuery.sort({ timestamp: -1 });
          break;
      }

      const messages = await messageQuery.lean();

      // 메시지 컨텍스트와 하이라이트 추가
      const enrichedMessages = messages.map(message => {
        const highlightedContent = this.highlightSearchTerm(message.content, query);
        const searchScore = this.calculateMessageRelevance(message.content, query);
        
        return {
          ...message,
          highlightedContent,
          searchScore,
          roomName: message.room?.name || 'Unknown Room',
          senderName: message.sender?.name || 'Unknown User'
        };
      });

      return {
        success: true,
        results: enrichedMessages,
        totalCount: enrichedMessages.length
      };

    } catch (error) {
      console.error('Message search error:', error);
      return {
        success: false,
        results: [],
        message: '메시지 검색 중 오류가 발생했습니다.'
      };
    }
  }

  // 사용자 검색
  async searchUsers(query, userId, options = {}) {
    const { limit = 20, offset = 0, sortBy = this.sortOptions.RELEVANCE } = options;

    try {
      const searchQuery = {
        _id: { $ne: userId }, // 자기 자신 제외
        $or: [
          { name: { $regex: query, $options: 'i' } },
          { email: { $regex: query, $options: 'i' } }
        ]
      };

      let userQuery = User.find(searchQuery)
        .select('name email profileImage createdAt')
        .skip(offset)
        .limit(limit);

      // 정렬 옵션 적용
      switch (sortBy) {
        case this.sortOptions.DATE:
          userQuery = userQuery.sort({ createdAt: -1 });
          break;
        case this.sortOptions.ALPHABETICAL:
          userQuery = userQuery.sort({ name: 1 });
          break;
        default: // RELEVANCE
          userQuery = userQuery.sort({ name: 1 });
          break;
      }

      const users = await userQuery.lean();

      // 각 사용자의 공통 채팅방 정보 추가
      const enrichedUsers = await Promise.all(
        users.map(async (user) => {
          const commonRooms = await Room.find({
            participants: { $all: [userId, user._id] }
          }).select('name').lean();

          return {
            ...user,
            commonRoomsCount: commonRooms.length,
            commonRooms: commonRooms.slice(0, 3), // 최대 3개까지만
            searchScore: this.calculateUserRelevance(user, query)
          };
        })
      );

      return {
        success: true,
        results: enrichedUsers,
        totalCount: enrichedUsers.length
      };

    } catch (error) {
      console.error('User search error:', error);
      return {
        success: false,
        results: [],
        message: '사용자 검색 중 오류가 발생했습니다.'
      };
    }
  }

  // 검색어 자동완성
  async getSearchSuggestions(query, userId, limit = 10) {
    if (!query || query.length < 1) {
      return [];
    }

    try {
      const suggestions = new Set();

      // 채팅방 이름에서 자동완성
      const rooms = await Room.find({
        $and: [
          {
            $or: [
              { participants: userId },
              { isPrivate: false }
            ]
          },
          { name: { $regex: `^${query}`, $options: 'i' } }
        ]
      }).select('name').limit(limit).lean();

      rooms.forEach(room => suggestions.add(room.name));

      // 사용자 이름에서 자동완성
      const users = await User.find({
        _id: { $ne: userId },
        name: { $regex: `^${query}`, $options: 'i' }
      }).select('name').limit(limit).lean();

      users.forEach(user => suggestions.add(user.name));

      return Array.from(suggestions).slice(0, limit);

    } catch (error) {
      console.error('Search suggestions error:', error);
      return [];
    }
  }

  // 인기 검색어 조회
  async getPopularSearchTerms(userId, limit = 10) {
    try {
      // 실제로는 검색 로그를 저장하고 분석해야 하지만,
      // 여기서는 채팅방 이름과 사용자 이름 기반으로 반환
      const popularRooms = await Room.find({
        $or: [
          { participants: userId },
          { isPrivate: false }
        ]
      })
      .sort({ 'participants.length': -1 })
      .select('name')
      .limit(limit)
      .lean();

      return popularRooms.map(room => room.name);

    } catch (error) {
      console.error('Popular search terms error:', error);
      return [];
    }
  }

  // 최근 검색어 (클라이언트에서 관리)
  getRecentSearchTerms() {
    // 클라이언트 localStorage에서 관리
    return [];
  }

  // 검색 관련성 계산 헬퍼 메서드들
  calculateRoomRelevance(room, query) {
    let score = 0;
    const lowerQuery = query.toLowerCase();
    const lowerName = room.name.toLowerCase();
    const lowerDesc = (room.description || '').toLowerCase();

    // 정확한 매치
    if (lowerName === lowerQuery) score += 100;
    else if (lowerName.includes(lowerQuery)) score += 50;
    
    // 설명에서 매치
    if (lowerDesc.includes(lowerQuery)) score += 20;
    
    // 시작 부분 매치
    if (lowerName.startsWith(lowerQuery)) score += 30;
    
    // 참가자 수 보너스
    score += Math.min(room.participants.length * 2, 20);

    return score;
  }

  calculateMessageRelevance(content, query) {
    let score = 0;
    const lowerContent = content.toLowerCase();
    const lowerQuery = query.toLowerCase();

    // 검색어 출현 빈도
    const matches = (lowerContent.match(new RegExp(lowerQuery, 'g')) || []).length;
    score += matches * 10;

    // 정확한 단어 매치
    const wordMatches = (lowerContent.match(new RegExp(`\\b${lowerQuery}\\b`, 'g')) || []).length;
    score += wordMatches * 20;

    return score;
  }

  calculateUserRelevance(user, query) {
    let score = 0;
    const lowerQuery = query.toLowerCase();
    const lowerName = user.name.toLowerCase();
    const lowerEmail = user.email.toLowerCase();

    // 이름에서 정확한 매치
    if (lowerName === lowerQuery) score += 100;
    else if (lowerName.includes(lowerQuery)) score += 50;
    
    // 이메일에서 매치
    if (lowerEmail.includes(lowerQuery)) score += 30;
    
    // 시작 부분 매치
    if (lowerName.startsWith(lowerQuery)) score += 40;

    return score;
  }

  highlightSearchTerm(text, query) {
    if (!text || !query) return text;
    
    const regex = new RegExp(`(${query})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  }

  // 고급 검색 필터
  async advancedSearch(query, userId, filters = {}) {
    const {
      roomTypes = [], // ['public', 'private', 'anonymous']
      dateRange = null,
      senders = [], // 특정 발신자
      fileTypes = [], // ['image', 'video', 'audio', 'pdf']
      hasFiles = null, // true/false
      hasReactions = null, // true/false
      sortBy = this.sortOptions.DATE,
      limit = 30,
      offset = 0
    } = filters;

    try {
      // 기본 검색 수행
      const basicResults = await this.searchAll(query, userId, {
        filter: this.searchFilters.ALL,
        sortBy,
        limit: limit * 2, // 필터링 후 줄어들 수 있으므로 더 많이 가져옴
        offset
      });

      if (!basicResults.success) {
        return basicResults;
      }

      // 고급 필터 적용
      let filteredResults = { ...basicResults.results };

      // 방 타입 필터
      if (roomTypes.length > 0) {
        filteredResults.rooms = filteredResults.rooms.filter(room => {
          if (roomTypes.includes('public') && !room.isPrivate) return true;
          if (roomTypes.includes('private') && room.isPrivate) return true;
          if (roomTypes.includes('anonymous') && room.isAnonymous) return true;
          return false;
        });
      }

      // 발신자 필터
      if (senders.length > 0) {
        filteredResults.messages = filteredResults.messages.filter(message =>
          senders.includes(message.sender._id.toString())
        );
      }

      // 파일 타입 필터
      if (fileTypes.length > 0) {
        filteredResults.messages = filteredResults.messages.filter(message => {
          if (!message.file) return false;
          return fileTypes.some(type => message.file.mimetype.startsWith(type));
        });
      }

      // 파일 존재 여부 필터
      if (hasFiles !== null) {
        filteredResults.messages = filteredResults.messages.filter(message =>
          hasFiles ? !!message.file : !message.file
        );
      }

      // 리액션 존재 여부 필터
      if (hasReactions !== null) {
        filteredResults.messages = filteredResults.messages.filter(message => {
          const hasReactionData = message.reactions && Object.keys(message.reactions).length > 0;
          return hasReactions ? hasReactionData : !hasReactionData;
        });
      }

      // 결과 제한
      filteredResults.rooms = filteredResults.rooms.slice(0, limit);
      filteredResults.messages = filteredResults.messages.slice(0, limit);
      filteredResults.users = filteredResults.users.slice(0, limit);

      const totalCount = filteredResults.rooms.length + 
                        filteredResults.messages.length + 
                        filteredResults.users.length;

      return {
        success: true,
        results: filteredResults,
        query,
        filters,
        totalCount
      };

    } catch (error) {
      console.error('Advanced search error:', error);
      return {
        success: false,
        message: '고급 검색 중 오류가 발생했습니다.'
      };
    }
  }
}

module.exports = new SearchService();