import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';
import { Button, Avatar, Text } from '@vapor-ui/core';
import { Flex, HStack, Box, Container } from './ui/Layout';
import authService from '../services/authService';

const Navbar = ({ toggleMode, mode }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = () => {
      const user = authService.getCurrentUser();
      setCurrentUser(user);
    };

    checkAuth();

    const handleAuthChange = () => {
      checkAuth();
    };

    const handleProfileUpdate = () => {
      checkAuth();
    };

    window.addEventListener('authStateChange', handleAuthChange);
    window.addEventListener('userProfileUpdate', handleProfileUpdate);

    return () => {
      window.removeEventListener('authStateChange', handleAuthChange);
      window.removeEventListener('userProfileUpdate', handleProfileUpdate);
    };
  }, []);

  // mode가 변경될 때마다 콘솔에 출력
  useEffect(() => {
    console.log('Current theme mode:', mode);
  }, [mode]);

  const handleNavigation = (path) => {
    router.push(path);
  };

  const handleLogout = async () => {
    await authService.logout();
    window.dispatchEvent(new Event('authStateChange'));
  };

  // 토글 버튼 클릭 시 콘솔 로그와 함께 모드 변경
  const handleToggleMode = () => {
    const newMode = mode === 'light' ? 'dark' : 'light';
    console.log('Theme mode changing from', mode, 'to', newMode);
    toggleMode();
    // 토글 후 상태는 useEffect에서 확인됨
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', mode);
  }, [mode]);

  const isInChatRooms = router.pathname === '/chat-rooms';

  return (
    <nav>
      <Container>
        <Flex justify="space-between" align="center">
          {/* Logo */}
          <Box>
            <div 
              onClick={() => handleNavigation(currentUser ? '/chat-rooms' : '/')}
              style={{ cursor: 'pointer' }}
              role="button"
              tabIndex={0}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleNavigation(currentUser ? '/chat-rooms' : '/');
                }
              }}
            >
              <Image
                src={mode === 'light' ? '/images/logo_dark.png' : '/images/logo.png' }
                alt="Chat App Logo"
                width={240}
                height={81}
                style={{ objectFit: 'contain' }}
                priority
              />
            </div>
          </Box>

          {/* Navigation Menu */}
          <Box>
            {currentUser && (
              <HStack gap="150">
                <Button
                  color="primary"
                  size="md"
                  onClick={() => handleNavigation('/chat-rooms')}
                >
                  채팅방 목록
                </Button>
                <Button
                  color="primary"
                  size="md"
                  onClick={() => handleNavigation('/chat-rooms/new')}
                >
                  새 채팅방
                </Button>
              </HStack>
            )}
          </Box>

          {/* User Menu */}
          <Box>
            <HStack gap="150" align="center">
              {currentUser ? (
                <>
                  <Avatar.Root
                    size="md"
                    style={{ flexShrink: 0 }}
                    src={
                      currentUser.profileImage
                        ? `${process.env.NEXT_PUBLIC_API_URL}${currentUser.profileImage}`
                        : undefined
                    }
                  >
                    <Avatar.Image />
                    <Avatar.Fallback>{currentUser.name?.[0]?.toUpperCase()}</Avatar.Fallback>
                  </Avatar.Root>

                  <Text typography="body2" style={{ fontWeight: 500 }}>
                    {currentUser.name}
                  </Text>

                  <Button size="md" onClick={() => handleNavigation('/profile')}>
                    프로필
                  </Button>

                  <Button color="danger" size="md" onClick={handleLogout}>
                    로그아웃
                  </Button>
                </>
              ) : (
                <>
                  <Button size="md" onClick={() => handleNavigation('/')}>
                    로그인
                  </Button>
                  <Button size="md" onClick={() => handleNavigation('/register')}>
                    회원가입
                  </Button>
                </>
              )}

              {/* 🌗 모드 토글 버튼 */}
              <Button
                size="md"
                color="secondary"
                onClick={handleToggleMode}
                variant="soft"
              >
                {mode === 'dark' ? '🌙 다크모드' : '☀️ 라이트모드'}
              </Button>
            </HStack>
          </Box>
        </Flex>
      </Container>
    </nav>
  );
};

export default Navbar;