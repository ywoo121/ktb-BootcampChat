import { useState, useEffect, useCallback, useRef } from 'react';
import searchService from '../services/searchService';

export const useSearch = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState({
    rooms: [],
    messages: [],
    users: [],
    totalCount: 0
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);
  
  // 검색 옵션
  const [searchFilter, setSearchFilter] = useState(searchService.searchFilters.ALL);
  const [sortBy, setSortBy] = useState(searchService.sortOptions.RELEVANCE);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMoreResults, setHasMoreResults] = useState(false);
  
  // 자동완성
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  // 최근 검색어와 인기 검색어
  const [recentTerms, setRecentTerms] = useState([]);
  const [popularTerms, setPopularTerms] = useState([]);
  
  // 고급 검색
  const [advancedFilters, setAdvancedFilters] = useState({
    roomTypes: [],
    dateRange: { from: null, to: null },
    senders: [],
    fileTypes: [],
    hasFiles: null,
    hasReactions: null
  });
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  
  const searchTimeoutRef = useRef(null);
  const suggestionsTimeoutRef = useRef(null);
  const resultsPerPage = 20;

  // 검색 설정 로드
  useEffect(() => {
    const settings = searchService.getSearchSettings();
    setSearchFilter(settings.defaultFilter);
    setSortBy(settings.defaultSort);
    
    loadRecentTerms();
    loadPopularTerms();
  }, []);

  // 최근 검색어 로드
  const loadRecentTerms = useCallback(() => {
    const recent = searchService.getRecentSearchTerms();
    setRecentTerms(recent);
  }, []);

  // 인기 검색어 로드
  const loadPopularTerms = useCallback(async () => {
    try {
      const result = await searchService.getPopularSearchTerms();
      if (result.success) {
        setPopularTerms(result.popularTerms);
      }
    } catch (error) {
      console.error('Failed to load popular terms:', error);
    }
  }, []);

  // 디바운스된 검색
  const performSearch = useCallback(async (
    query, 
    filter = searchFilter, 
    sort = sortBy, 
    page = 1, 
    append = false
  ) => {
    if (!query || query.trim().length < 2) {
      setSearchResults({ rooms: [], messages: [], users: [], totalCount: 0 });
      setHasSearched(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const offset = (page - 1) * resultsPerPage;
      const options = {
        filter,
        sort,
        limit: resultsPerPage,
        offset
      };

      let result;
      if (showAdvancedSearch && Object.values(advancedFilters).some(v => 
        v !== null && v !== undefined && 
        (Array.isArray(v) ? v.length > 0 : true)
      )) {
        // 고급 검색
        result = await searchService.advancedSearch(query.trim(), {
          ...advancedFilters,
          ...options
        });
      } else {
        // 일반 검색
        result = await searchService.searchAll(query.trim(), options);
      }

      if (result.success) {
        if (append && page > 1) {
          // 페이지네이션: 기존 결과에 추가
          setSearchResults(prev => ({
            rooms: [...prev.rooms, ...result.results.rooms],
            messages: [...prev.messages, ...result.results.messages],
            users: [...prev.users, ...result.results.users],
            totalCount: result.totalCount
          }));
        } else {
          // 새 검색 결과
          setSearchResults(result.results);
        }
        
        setHasMoreResults(result.results.rooms.length === resultsPerPage || 
                          result.results.messages.length === resultsPerPage || 
                          result.results.users.length === resultsPerPage);
        setHasSearched(true);
        
        // 최근 검색어에 추가
        searchService.addRecentSearchTerm(query.trim());
        loadRecentTerms();
        
        // 캐시에 저장
        searchService.setCachedResults(query.trim(), filter, result);
      } else {
        setError(result.message || '검색 중 오류가 발생했습니다.');
      }
    } catch (error) {
      console.error('Search error:', error);
      setError(error.message || '검색 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }, [searchFilter, sortBy, showAdvancedSearch, advancedFilters, loadRecentTerms]);

  // 검색 실행 (디바운스 적용)
  const handleSearch = useCallback((query, immediate = false) => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    const delay = immediate ? 0 : 500;
    
    searchTimeoutRef.current = setTimeout(() => {
      setCurrentPage(1);
      performSearch(query);
    }, delay);
  }, [performSearch]);

  // 자동완성 검색
  const handleSuggestions = useCallback(async (query) => {
    if (!query || query.length < 1) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    if (suggestionsTimeoutRef.current) {
      clearTimeout(suggestionsTimeoutRef.current);
    }

    suggestionsTimeoutRef.current = setTimeout(async () => {
      try {
        const result = await searchService.getSearchSuggestions(query);
        if (result.success) {
          setSuggestions(result.suggestions);
          setShowSuggestions(result.suggestions.length > 0);
        }
      } catch (error) {
        console.error('Suggestions error:', error);
      }
    }, 300);
  }, []);

  // 검색어 입력 처리
  const handleQueryChange = useCallback((query) => {
    setSearchQuery(query);
    
    const settings = searchService.getSearchSettings();
    if (settings.enableAutoComplete) {
      handleSuggestions(query);
    }
    
    if (query.trim().length >= 2) {
      handleSearch(query);
    } else {
      setSearchResults({ rooms: [], messages: [], users: [], totalCount: 0 });
      setHasSearched(false);
      setShowSuggestions(false);
    }
  }, [handleSearch, handleSuggestions]);

  // 필터 변경
  const handleFilterChange = useCallback((newFilter) => {
    setSearchFilter(newFilter);
    setCurrentPage(1);
    
    if (searchQuery.trim().length >= 2) {
      performSearch(searchQuery, newFilter, sortBy);
    }
    
    // 설정 저장
    searchService.updateSearchSettings({ defaultFilter: newFilter });
  }, [searchQuery, sortBy, performSearch]);

  // 정렬 변경
  const handleSortChange = useCallback((newSort) => {
    setSortBy(newSort);
    setCurrentPage(1);
    
    if (searchQuery.trim().length >= 2) {
      performSearch(searchQuery, searchFilter, newSort);
    }
    
    // 설정 저장
    searchService.updateSearchSettings({ defaultSort: newSort });
  }, [searchQuery, searchFilter, performSearch]);

  // 더 많은 결과 로드
  const loadMoreResults = useCallback(() => {
    if (!loading && hasMoreResults && searchQuery.trim().length >= 2) {
      const nextPage = currentPage + 1;
      setCurrentPage(nextPage);
      performSearch(searchQuery, searchFilter, sortBy, nextPage, true);
    }
  }, [loading, hasMoreResults, searchQuery, currentPage, searchFilter, sortBy, performSearch]);

  // 고급 필터 적용
  const applyAdvancedFilters = useCallback((filters) => {
    setAdvancedFilters(filters);
    setCurrentPage(1);
    
    if (searchQuery.trim().length >= 2) {
      performSearch(searchQuery);
    }
  }, [searchQuery, performSearch]);

  // 검색어 제안 선택
  const selectSuggestion = useCallback((suggestion) => {
    setSearchQuery(suggestion);
    setShowSuggestions(false);
    handleSearch(suggestion, true);
  }, [handleSearch]);

  // 최근 검색어 선택
  const selectRecentTerm = useCallback((term) => {
    setSearchQuery(term);
    handleSearch(term, true);
  }, [handleSearch]);

  // 인기 검색어 선택
  const selectPopularTerm = useCallback((term) => {
    setSearchQuery(term);
    handleSearch(term, true);
  }, [handleSearch]);

  // 검색 초기화
  const clearSearch = useCallback(() => {
    setSearchQuery('');
    setSearchResults({ rooms: [], messages: [], users: [], totalCount: 0 });
    setHasSearched(false);
    setError(null);
    setCurrentPage(1);
    setShowSuggestions(false);
    setSuggestions([]);
  }, []);

  // 최근 검색어 삭제
  const clearRecentTerms = useCallback(() => {
    searchService.clearRecentSearchTerms();
    setRecentTerms([]);
  }, []);

  // 검색 캐시 삭제
  const clearSearchCache = useCallback(() => {
    searchService.clearSearchCache();
  }, []);

  // 에러 클리어
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // cleanup
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      if (suggestionsTimeoutRef.current) {
        clearTimeout(suggestionsTimeoutRef.current);
      }
    };
  }, []);

  return {
    // 상태
    searchQuery,
    searchResults,
    loading,
    error,
    hasSearched,
    hasMoreResults,
    
    // 검색 옵션
    searchFilter,
    sortBy,
    currentPage,
    
    // 자동완성 및 제안
    suggestions,
    showSuggestions,
    recentTerms,
    popularTerms,
    
    // 고급 검색
    advancedFilters,
    showAdvancedSearch,
    
    // 액션
    handleQueryChange,
    handleFilterChange,
    handleSortChange,
    handleSearch,
    loadMoreResults,
    selectSuggestion,
    selectRecentTerm,
    selectPopularTerm,
    applyAdvancedFilters,
    setShowAdvancedSearch,
    clearSearch,
    clearRecentTerms,
    clearSearchCache,
    clearError,
    
    // 유틸리티
    searchFilters: searchService.searchFilters,
    sortOptions: searchService.sortOptions,
    highlightSearchTerm: searchService.highlightSearchTerm.bind(searchService),
    formatSearchDate: searchService.formatSearchDate.bind(searchService),
    getSearchTypeIcon: searchService.getSearchTypeIcon.bind(searchService),
    getFileTypeIcon: searchService.getFileTypeIcon.bind(searchService)
  };
};