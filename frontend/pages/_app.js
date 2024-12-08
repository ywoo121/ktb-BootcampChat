import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import authService from '../services/authService';
import '../styles/globals.css';
import Navbar from '../components/Navbar';
import { Alert } from '@goorm-dev/vapor-components';
import ToastContainer, { Toast } from '../components/Toast';
import DuplicateLoginModal from '../components/DuplicateLoginModal';

function MyApp({ Component, pageProps }) {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const [duplicateLoginInfo, setDuplicateLoginInfo] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    const checkAuth = () => {
      try {
        const protectedRoutes = ['/chat-rooms', '/chat', '/profile'];
        const publicOnlyRoutes = ['/register'];
        const path = router.pathname;
        const user = authService.getCurrentUser();
        
        if (protectedRoutes.includes(path) && !user) {
          router.replace(`/?redirect=${encodeURIComponent(router.asPath)}`);
          return;
        }
        
        if (path !== '/' && publicOnlyRoutes.includes(path) && user) {
          router.replace('/chat-rooms');
          return;
        }
        
        setAuthChecked(true);
      } catch (error) {
        console.error('Auth check error:', error);
        setAuthError(error.message);
      }
    };

    const handleDuplicateLogin = (event) => {
      const { detail } = event;
      if (!detail?.deviceInfo || !detail?.ipAddress) {
        console.error('Invalid duplicate login event data:', detail);
        return;
      }

      // 이전 토스트가 있다면 제거
      if (Toast.isActive('duplicate-login')) {
        Toast.dismiss('duplicate-login');
      }

      Toast.warning('다른 기기에서 로그인이 감지되었습니다.', {
        toastId: 'duplicate-login',
        autoClose: 10000
      });

      setDuplicateLoginInfo({
        deviceInfo: detail.deviceInfo,
        ipAddress: detail.ipAddress,
        timestamp: detail.timestamp
      });
      setIsModalOpen(true);
    };

    const handleSessionExpired = () => {
      // 이전 토스트가 있다면 제거
      if (Toast.isActive('session-expired')) {
        Toast.dismiss('session-expired');
      }

      Toast.warning('세션이 만료되었습니다. 다시 로그인해주세요.', {
        toastId: 'session-expired',
        autoClose: 3000,
        onClose: () => {
          router.replace('/?error=session_expired');
        }
      });

      if (isModalOpen) {
        setIsModalOpen(false);
        setDuplicateLoginInfo(null);
      }
    };

    const handleSocketDisconnect = () => {
      // 이전 토스트가 있다면 제거
      if (Toast.isActive('socket-disconnect')) {
        Toast.dismiss('socket-disconnect');
      }

      Toast.error('채팅 서버와 연결이 끊어졌습니다.', {
        toastId: 'socket-disconnect',
        autoClose: 3000
      });
    };

    checkAuth();
    window.addEventListener('duplicateLogin', handleDuplicateLogin);
    window.addEventListener('sessionExpired', handleSessionExpired);
    window.addEventListener('socketDisconnect', handleSocketDisconnect);

    return () => {
      window.removeEventListener('duplicateLogin', handleDuplicateLogin);
      window.removeEventListener('sessionExpired', handleSessionExpired);
      window.removeEventListener('socketDisconnect', handleSocketDisconnect);
    };
  }, [router, isModalOpen]);

  const handleDuplicateLoginTimeout = async () => {
    try {
      if (Toast.isActive('duplicate-login')) {
        Toast.dismiss('duplicate-login');
      }

      await authService.logout();
      setDuplicateLoginInfo(null);
      setIsModalOpen(false);

      Toast.info('다른 기기에서 로그인하여 로그아웃되었습니다.', {
        toastId: 'logout-info',
        autoClose: 3000,
        onClose: () => {
          router.replace('/?error=duplicate_login');
        }
      });

    } catch (error) {
      console.error('Duplicate login logout error:', error);
      Toast.error('로그아웃 처리 중 오류가 발생했습니다.', {
        toastId: 'logout-error',
        autoClose: 3000,
        onClose: () => {
          router.replace('/');
        }
      });
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    handleDuplicateLoginTimeout();
  };

  if (!authChecked) {
    return null;
  }

  return (
    <div className="app-container">
      <ToastContainer />
      <Navbar />
      
      {authError && (
        <Alert 
          color="danger" 
          className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50"
          onClose={() => setAuthError(null)}
        >
          {authError}
        </Alert>
      )}

      <main className="main-content">
        <Component {...pageProps} />
      </main>

      <DuplicateLoginModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        deviceInfo={duplicateLoginInfo?.deviceInfo}
        ipAddress={duplicateLoginInfo?.ipAddress}
        onTimeout={handleDuplicateLoginTimeout}
      />
    </div>
  );
}

export default MyApp;