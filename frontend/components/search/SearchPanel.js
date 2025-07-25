import React, { useState, useRef, useEffect } from 'react';
import { Button, Text, Card, Badge, Input, Select, Checkbox } from '@vapor-ui/core';
import { Flex, Box, HStack, VStack } from '../ui/Layout';
import { useSearch } from '../../hooks/useSearch';

const SearchPanel = ({ onClose, onRoomSelect, onUserSelect }) => {
  const {
    searchQuery,
    searchResults,
    loading,
    error,
    hasSearched,
    hasMoreResults,
    searchFilter,
    sortBy,
    suggestions,
    showSuggestions,
    recentTerms,
    popularTerms,
    advancedFilters,
    showAdvancedSearch,
    handleQueryChange,
    handleFilterChange,
    handleSortChange,
    loadMoreResults,
    selectSuggestion,
    selectRecentTerm,
    selectPopularTerm,
    applyAdvancedFilters,
    setShowAdvancedSearch,
    clearSearch,
    clearRecentTerms,
    clearError,
    searchFilters,
    sortOptions,
    highlightSearchTerm,
    formatSearchDate,
    getSearchTypeIcon,
    getFileTypeIcon
  } = useSearch();

  const inputRef = useRef(null);
  const [inputFocused, setInputFocused] = useState(false);

  useEffect(() => {
    // 패널이 열릴 때 입력창에 포커스
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleRoomClick = (room) => {
    if (onRoomSelect) {
      onRoomSelect(room);
    }
    onClose?.();
  };

  const handleUserClick = (user) => {
    if (onUserSelect) {
      onUserSelect(user);
    }
    onClose?.();
  };

  const renderSearchInput = () => (
    <VStack gap="200" style={{ position: 'relative' }}>
      <HStack gap="200" align="center">
        <div style={{ position: 'relative', flex: 1 }}>
          <Input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => handleQueryChange(e.target.value)}
            onFocus={() => setInputFocused(true)}
            onBlur={() => setTimeout(() => setInputFocused(false), 200)}
            placeholder="채팅방, 메시지, 사용자 검색..."
            style={{ width: '100%', paddingRight: '40px' }}
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearSearch}
              style={{
                position: 'absolute',
                right: '8px',
                top: '50%',
                transform: 'translateY(-50%)',
                minWidth: 'auto',
                padding: '4px'
              }}
            >
              ✕
            </Button>
          )}
          
          {/* 검색어 자동완성 */}
          {showSuggestions && inputFocused && suggestions.length > 0 && (
            <Card.Root style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              zIndex: 1000,
              marginTop: '4px'
            }}>
              <Card.Body style={{ padding: '8px' }}>
                {suggestions.map((suggestion, index) => (
                  <div
                    key={index}
                    onClick={() => selectSuggestion(suggestion)}
                    style={{
                      padding: '8px 12px',
                      cursor: 'pointer',
                      borderRadius: '4px',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#f5f5f5'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                  >
                    <Text typography="body2">🔍 {suggestion}</Text>
                  </div>
                ))}
              </Card.Body>
            </Card.Root>
          )}
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowAdvancedSearch(!showAdvancedSearch)}
          style={{ minWidth: 'auto' }}
        >
          {showAdvancedSearch ? '간단 검색' : '고급 검색'}
        </Button>
      </HStack>

      {/* 검색 필터 */}
      <HStack gap="200" align="center">
        <Select
          value={searchFilter}
          onChange={(e) => handleFilterChange(e.target.value)}
          style={{ width: '150px' }}
        >
          <option value={searchFilters.ALL}>전체</option>
          <option value={searchFilters.ROOMS}>채팅방</option>
          <option value={searchFilters.MESSAGES}>메시지</option>
          <option value={searchFilters.USERS}>사용자</option>
        </Select>
        
        <Select
          value={sortBy}
          onChange={(e) => handleSortChange(e.target.value)}
          style={{ width: '150px' }}
        >
          <option value={sortOptions.RELEVANCE}>관련도순</option>
          <option value={sortOptions.DATE}>최신순</option>
          <option value={sortOptions.POPULARITY}>인기순</option>
          <option value={sortOptions.ALPHABETICAL}>가나다순</option>
        </Select>
      </HStack>

      {/* 고급 검색 필터 */}
      {showAdvancedSearch && (
        <Card.Root style={{ width: '100%' }}>
          <Card.Header>
            <Text typography="heading6">고급 검색 옵션</Text>
          </Card.Header>
          <Card.Body>
            <VStack gap="200">
              {/* 방 타입 필터 */}
              <div>
                <Text typography="body2" style={{ marginBottom: '8px' }}>방 타입</Text>
                <HStack gap="200">
                  <Checkbox
                    checked={advancedFilters.roomTypes.includes('public')}
                    onChange={(e) => {
                      const types = e.target.checked 
                        ? [...advancedFilters.roomTypes, 'public']
                        : advancedFilters.roomTypes.filter(t => t !== 'public');
                      applyAdvancedFilters({ ...advancedFilters, roomTypes: types });
                    }}
                  >
                    공개방
                  </Checkbox>
                  <Checkbox
                    checked={advancedFilters.roomTypes.includes('private')}
                    onChange={(e) => {
                      const types = e.target.checked 
                        ? [...advancedFilters.roomTypes, 'private']
                        : advancedFilters.roomTypes.filter(t => t !== 'private');
                      applyAdvancedFilters({ ...advancedFilters, roomTypes: types });
                    }}
                  >
                    비공개방
                  </Checkbox>
                  <Checkbox
                    checked={advancedFilters.roomTypes.includes('anonymous')}
                    onChange={(e) => {
                      const types = e.target.checked 
                        ? [...advancedFilters.roomTypes, 'anonymous']
                        : advancedFilters.roomTypes.filter(t => t !== 'anonymous');
                      applyAdvancedFilters({ ...advancedFilters, roomTypes: types });
                    }}
                  >
                    익명방
                  </Checkbox>
                </HStack>
              </div>

              {/* 파일 타입 필터 */}
              <div>
                <Text typography="body2" style={{ marginBottom: '8px' }}>파일 타입</Text>
                <HStack gap="200">
                  <Checkbox
                    checked={advancedFilters.fileTypes.includes('image')}
                    onChange={(e) => {
                      const types = e.target.checked 
                        ? [...advancedFilters.fileTypes, 'image']
                        : advancedFilters.fileTypes.filter(t => t !== 'image');
                      applyAdvancedFilters({ ...advancedFilters, fileTypes: types });
                    }}
                  >
                    이미지
                  </Checkbox>
                  <Checkbox
                    checked={advancedFilters.fileTypes.includes('video')}
                    onChange={(e) => {
                      const types = e.target.checked 
                        ? [...advancedFilters.fileTypes, 'video']
                        : advancedFilters.fileTypes.filter(t => t !== 'video');
                      applyAdvancedFilters({ ...advancedFilters, fileTypes: types });
                    }}
                  >
                    동영상
                  </Checkbox>
                  <Checkbox
                    checked={advancedFilters.fileTypes.includes('audio')}
                    onChange={(e) => {
                      const types = e.target.checked 
                        ? [...advancedFilters.fileTypes, 'audio']
                        : advancedFilters.fileTypes.filter(t => t !== 'audio');
                      applyAdvancedFilters({ ...advancedFilters, fileTypes: types });
                    }}
                  >
                    오디오
                  </Checkbox>
                </HStack>
              </div>

              {/* 기타 필터 */}
              <HStack gap="200">
                <Checkbox
                  checked={advancedFilters.hasFiles === true}
                  onChange={(e) => {
                    applyAdvancedFilters({ 
                      ...advancedFilters, 
                      hasFiles: e.target.checked ? true : null 
                    });
                  }}
                >
                  파일 포함
                </Checkbox>
                <Checkbox
                  checked={advancedFilters.hasReactions === true}
                  onChange={(e) => {
                    applyAdvancedFilters({ 
                      ...advancedFilters, 
                      hasReactions: e.target.checked ? true : null 
                    });
                  }}
                >
                  리액션 포함
                </Checkbox>
              </HStack>
            </VStack>
          </Card.Body>
        </Card.Root>
      )}
    </VStack>
  );

  const renderRecentAndPopular = () => (
    !hasSearched && !searchQuery && (
      <VStack gap="300">
        {/* 최근 검색어 */}
        {recentTerms.length > 0 && (
          <Card.Root>
            <Card.Header>
              <Flex justify="space-between" align="center">
                <Text typography="heading6">최근 검색어</Text>
                <Button variant="ghost" size="sm" onClick={clearRecentTerms}>
                  지우기
                </Button>
              </Flex>
            </Card.Header>
            <Card.Body>
              <Flex wrap="wrap" gap="100">
                {recentTerms.map((term, index) => (
                  <Badge
                    key={index}
                    color="secondary"
                    style={{ cursor: 'pointer' }}
                    onClick={() => selectRecentTerm(term)}
                  >
                    {term}
                  </Badge>
                ))}
              </Flex>
            </Card.Body>
          </Card.Root>
        )}

        {/* 인기 검색어 */}
        {popularTerms.length > 0 && (
          <Card.Root>
            <Card.Header>
              <Text typography="heading6">인기 검색어</Text>
            </Card.Header>
            <Card.Body>
              <Flex wrap="wrap" gap="100">
                {popularTerms.map((term, index) => (
                  <Badge
                    key={index}
                    color="primary"
                    style={{ cursor: 'pointer' }}
                    onClick={() => selectPopularTerm(term)}
                  >
                    🔥 {term}
                  </Badge>
                ))}
              </Flex>
            </Card.Body>
          </Card.Root>
        )}
      </VStack>
    )
  );

  const renderSearchResults = () => {
    if (loading) {
      return (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <div className="spinner-border" role="status">
            <span className="visually-hidden">검색 중...</span>
          </div>
          <Text style={{ marginTop: '12px' }}>검색 중...</Text>
        </div>
      );
    }

    if (error) {
      return (
        <Card.Root style={{ backgroundColor: '#ffebee' }}>
          <Card.Body style={{ textAlign: 'center', padding: '20px' }}>
            <Text style={{ color: '#c62828', marginBottom: '12px' }}>
              {error}
            </Text>
            <Button size="sm" onClick={clearError}>
              다시 시도
            </Button>
          </Card.Body>
        </Card.Root>
      );
    }

    if (!hasSearched) {
      return renderRecentAndPopular();
    }

    if (searchResults.totalCount === 0) {
      return (
        <Card.Root>
          <Card.Body style={{ textAlign: 'center', padding: '40px' }}>
            <Text style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</Text>
            <Text typography="heading6" style={{ marginBottom: '8px' }}>
              검색 결과가 없습니다
            </Text>
            <Text typography="body2" style={{ color: '#666' }}>
              다른 키워드로 검색해보세요
            </Text>
          </Card.Body>
        </Card.Root>
      );
    }

    return (
      <VStack gap="300">
        {/* 검색 결과 요약 */}
        <Text typography="body2" style={{ color: '#666' }}>
          총 {searchResults.totalCount}개의 결과
        </Text>

        {/* 채팅방 결과 */}
        {searchResults.rooms.length > 0 && (
          <Card.Root>
            <Card.Header>
              <Text typography="heading6">
                🏠 채팅방 ({searchResults.rooms.length})
              </Text>
            </Card.Header>
            <Card.Body>
              <VStack gap="200">
                {searchResults.rooms.map((room) => (
                  <div
                    key={room.id}
                    onClick={() => handleRoomClick(room)}
                    style={{
                      padding: '12px',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = '#f9fafb';
                      e.target.style.borderColor = '#3b82f6';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = 'transparent';
                      e.target.style.borderColor = '#e5e7eb';
                    }}
                  >
                    <Flex justify="space-between" align="center">
                      <VStack gap="50">
                        <Text 
                          typography="body1" 
                          style={{ fontWeight: 'bold' }}
                          dangerouslySetInnerHTML={{
                            __html: highlightSearchTerm(room.name, searchQuery)
                          }}
                        />
                        {room.description && (
                          <Text 
                            typography="body2" 
                            style={{ color: '#666' }}
                            dangerouslySetInnerHTML={{
                              __html: highlightSearchTerm(room.description, searchQuery)
                            }}
                          />
                        )}
                        <HStack gap="100" align="center">
                          <Badge color="info" size="sm">
                            👥 {room.participantCount}명
                          </Badge>
                          {room.isPrivate && (
                            <Badge color="warning" size="sm">🔒 비공개</Badge>
                          )}
                          {room.isAnonymous && (
                            <Badge color="secondary" size="sm">👤 익명</Badge>
                          )}
                        </HStack>
                      </VStack>
                      {room.lastMessage && (
                        <VStack gap="50" align="end">
                          <Text typography="caption" style={{ color: '#999' }}>
                            {formatSearchDate(room.lastMessage.timestamp)}
                          </Text>
                          <Text typography="caption" style={{ color: '#666' }}>
                            {room.lastMessage.senderName}: {room.lastMessage.content?.slice(0, 30)}...
                          </Text>
                        </VStack>
                      )}
                    </Flex>
                  </div>
                ))}
              </VStack>
            </Card.Body>
          </Card.Root>
        )}

        {/* 메시지 결과 */}
        {searchResults.messages.length > 0 && (
          <Card.Root>
            <Card.Header>
              <Text typography="heading6">
                💬 메시지 ({searchResults.messages.length})
              </Text>
            </Card.Header>
            <Card.Body>
              <VStack gap="200">
                {searchResults.messages.map((message) => (
                  <div
                    key={message.id}
                    style={{
                      padding: '12px',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px'
                    }}
                  >
                    <VStack gap="100">
                      <HStack gap="200" align="center">
                        <Text typography="body2" style={{ fontWeight: 'bold' }}>
                          {message.senderName}
                        </Text>
                        <Text typography="caption" style={{ color: '#666' }}>
                          {message.roomName}
                        </Text>
                        <Text typography="caption" style={{ color: '#999' }}>
                          {formatSearchDate(message.timestamp)}
                        </Text>
                        {message.type === 'file' && message.file && (
                          <Badge color="info" size="sm">
                            {getFileTypeIcon(message.file.mimetype)} 파일
                          </Badge>
                        )}
                      </HStack>
                      <Text 
                        typography="body2"
                        dangerouslySetInnerHTML={{
                          __html: message.highlightedContent || highlightSearchTerm(message.content, searchQuery)
                        }}
                      />
                    </VStack>
                  </div>
                ))}
              </VStack>
            </Card.Body>
          </Card.Root>
        )}

        {/* 사용자 결과 */}
        {searchResults.users.length > 0 && (
          <Card.Root>
            <Card.Header>
              <Text typography="heading6">
                👤 사용자 ({searchResults.users.length})
              </Text>
            </Card.Header>
            <Card.Body>
              <VStack gap="200">
                {searchResults.users.map((user) => (
                  <div
                    key={user.id}
                    onClick={() => handleUserClick(user)}
                    style={{
                      padding: '12px',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = '#f9fafb';
                      e.target.style.borderColor = '#3b82f6';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = 'transparent';
                      e.target.style.borderColor = '#e5e7eb';
                    }}
                  >
                    <Flex justify="space-between" align="center">
                      <VStack gap="50">
                        <Text 
                          typography="body1" 
                          style={{ fontWeight: 'bold' }}
                          dangerouslySetInnerHTML={{
                            __html: highlightSearchTerm(user.name, searchQuery)
                          }}
                        />
                        <Text 
                          typography="body2" 
                          style={{ color: '#666' }}
                          dangerouslySetInnerHTML={{
                            __html: highlightSearchTerm(user.email, searchQuery)
                          }}
                        />
                        {user.commonRoomsCount > 0 && (
                          <Text typography="caption" style={{ color: '#999' }}>
                            공통 채팅방 {user.commonRoomsCount}개
                          </Text>
                        )}
                      </VStack>
                    </Flex>
                  </div>
                ))}
              </VStack>
            </Card.Body>
          </Card.Root>
        )}

        {/* 더 보기 버튼 */}
        {hasMoreResults && (
          <Button 
            variant="outline" 
            onClick={loadMoreResults}
            disabled={loading}
            style={{ width: '100%' }}
          >
            {loading ? '로딩 중...' : '더 보기'}
          </Button>
        )}
      </VStack>
    );
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '500px',
      height: '100vh',
      backgroundColor: 'white',
      boxShadow: '2px 0 10px rgba(0,0,0,0.1)',
      zIndex: 1000,
      overflowY: 'auto'
    }}>
      {/* 헤더 */}
      <div style={{
        padding: '16px',
        borderBottom: '1px solid #e5e7eb',
        backgroundColor: '#f9fafb',
        position: 'sticky',
        top: 0,
        zIndex: 1001
      }}>
        <Flex justify="space-between" align="center" style={{ marginBottom: '16px' }}>
          <Text typography="heading5" style={{ fontWeight: 'bold' }}>
            🔍 검색
          </Text>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            style={{ padding: '4px' }}
          >
            ✕
          </Button>
        </Flex>
        
        {renderSearchInput()}
      </div>

      {/* 내용 */}
      <div style={{ padding: '16px' }}>
        {renderSearchResults()}
      </div>
    </div>
  );
};

export default SearchPanel;