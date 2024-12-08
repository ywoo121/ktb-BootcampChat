import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import authService from '../services/authService';

export const withAuth = (WrappedComponent) => {
  const WithAuthComponent = (props) => {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
      const checkAuth = () => {
        const user = authService.getCurrentUser();
        if (!user) {
          router.replace('/?redirect=' + router.asPath);
        } else {
          setIsLoading(false);
        }
      };

      checkAuth();
    }, [router]);

    if (isLoading) {
      return null;
    }

    return <WrappedComponent {...props} />;
  };

  // HOC에 displayName 설정
  const displayName = WrappedComponent.displayName || WrappedComponent.name || 'Component';
  WithAuthComponent.displayName = `WithAuth(${displayName})`;

  return WithAuthComponent;
};

export const withoutAuth = (WrappedComponent) => {
  const WithoutAuthComponent = (props) => {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
      const checkAuth = () => {
        const user = authService.getCurrentUser();
        if (user) {
          // 이미 로그인된 사용자가 로그인/회원가입 페이지 접근 시
          // chat-rooms로 리디렉션하되, '/'는 예외처리
          if (router.pathname !== '/') {
            router.replace('/chat-rooms');
          }
        } else {
          setIsLoading(false);
        }
      };

      checkAuth();
    }, [router]);

    if (isLoading) {
      return null;
    }

    return <WrappedComponent {...props} />;
  };

  const displayName = WrappedComponent.displayName || WrappedComponent.name || 'Component';
  WithoutAuthComponent.displayName = `WithoutAuth(${displayName})`;

  return WithoutAuthComponent;
};