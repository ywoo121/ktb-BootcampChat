import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Image from "next/image";
import { Button, Avatar, Text } from "@vapor-ui/core";
import { Flex, HStack, Box, Container } from "./ui/Layout";
import authService from "../services/authService";
import PersistentAvatar from "./common/PersistentAvatar";

const Navbar = () => {
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

    window.addEventListener("authStateChange", handleAuthChange);
    window.addEventListener("userProfileUpdate", handleProfileUpdate);

    return () => {
      window.removeEventListener("authStateChange", handleAuthChange);
      window.removeEventListener("userProfileUpdate", handleProfileUpdate);
    };
  }, []);

  const handleNavigation = (path) => {
    router.push(path);
  };

  const handleLogout = async () => {
    await authService.logout();
    window.dispatchEvent(new Event("authStateChange"));
  };

  const isInChatRooms = router.pathname === "/chat-rooms";

  return (
    <nav>
      <Container>
        <Flex justify="space-between" align="center">
          {/* Logo */}
          <Box>
            <div
              onClick={() =>
                handleNavigation(currentUser ? "/chat-rooms" : "/")
              }
              style={{ cursor: "pointer" }}
              role="button"
              tabIndex={0}
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  handleNavigation(currentUser ? "/chat-rooms" : "/");
                }
              }}
            >
              <Image
                src="/images/logo.png"
                alt="Chat App Logo"
                width={240}
                height={81}
                style={{ objectFit: "contain" }}
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
              </HStack>
            )}
          </Box>

          {/* User Menu */}
          <Box>
            {currentUser ? (
              <HStack gap="150" align="center">
                {/* Profile Image */}
                <PersistentAvatar
                  size="md"
                  style={{ flexShrink: 0 }}
                  user={currentUser}
                >
                  <Avatar.Image
                    src={
                      currentUser.profileImage
                        ? `${process.env.NEXT_PUBLIC_API_URL}${currentUser.profileImage}`
                        : undefined
                    }
                  />
                  <Avatar.Fallback>
                    {currentUser.name?.[0]?.toUpperCase() || "U"}
                  </Avatar.Fallback>
                </PersistentAvatar>

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
              </HStack>
            ) : (
              <HStack gap="150">
                <Button size="md" onClick={() => handleNavigation("/")}>
                  로그인
                </Button>
                <Button size="md" onClick={() => handleNavigation("/register")}>
                  회원가입
                </Button>
              </HStack>
            )}
          </Box>
        </Flex>
      </Container>
    </nav>
  );
};

export default Navbar;
