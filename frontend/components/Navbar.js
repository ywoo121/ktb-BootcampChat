import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Image from "next/image";
import { Button, Avatar, Text } from "@vapor-ui/core";
import { Flex, HStack, Box, Container } from "./ui/Layout";
import authService from "../services/authService";
import PersistentAvatar from "./common/PersistentAvatar";

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

    window.addEventListener("authStateChange", handleAuthChange);

    return () => {
      window.removeEventListener("authStateChange", handleAuthChange);
    };
  }, []);

  useEffect(() => {
    // console.log(
    //   "[Navbar] Received new mode from App:",
    //   mode,
    //   "at",
    //   new Date().toISOString()
    // );
  }, [mode]);

  const handleNavigation = (path) => {
    router.push(path);
  };

  const handleLogout = async () => {
    await authService.logout();
    window.dispatchEvent(new Event("authStateChange"));
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

  const isInChatRooms = router.pathname === "/chat-rooms";

  return (
    <nav>
      <Container>
        <Flex justify="space-between" align="center">
          {/* Logo */}
          <Box>
            <Image
              src="/images/logo-h.png"
              alt="Chat App Logo"
              width={180}
              height={40}
              priority
              style={{ cursor: "pointer" }}
              onClick={() => handleNavigation("/")}
            />
          </Box>

          {/* Navigation Links */}
          <Box>
            {currentUser && !isInChatRooms && (
              <HStack gap="200">
                <Button
                  color="primary"
                  size="md"
                  onClick={() => handleNavigation("/chat-rooms")}
                >
                  채팅방 목록
                </Button>
                <Button
                  color="primary"
                  size="md"
                  onClick={() => handleNavigation("/chat-rooms/new")}
                >
                  새 채팅방
                </Button>
                <Button
                  color="primary"
                  size="md"
                  onClick={() => handleNavigation("/whiteboards")}
                >
                  화이트보드
                </Button>
              </HStack>
            )}
          </Box>

          {/* User Menu */}
          <Box>
            <HStack gap="150" align="center">
              {currentUser ? (
                <>
                  {/* Profile Image */}
                  <PersistentAvatar
                    size="md"
                    style={{ flexShrink: 0 }}
                    user={currentUser}
                  />

                  {/* Member Name */}
                  <Text typography="body2" style={{ fontWeight: 500 }}>
                    {currentUser.name}
                  </Text>

                  {/* Profile Button */}
                  <Button size="md" onClick={() => handleNavigation("/profile")}>
                    프로필
                  </Button>

                  {/* Logout Button */}
                  <Button color="danger" size="md" onClick={handleLogout}>
                    로그아웃
                  </Button>
                </>
              ) : (
                <>
                  <Button size="md" onClick={() => handleNavigation("/")}>
                    로그인
                  </Button>
                  <Button size="md" onClick={() => handleNavigation("/register")}>
                    회원가입
                  </Button>
                </>
              )}
              
              {/* Theme Toggle Button */}
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