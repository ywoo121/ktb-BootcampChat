import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { ThemeProvider, createThemeConfig } from '@vapor-ui/core';
import '@vapor-ui/core/styles.css';
import '../styles/globals.css';
import Navbar from '../components/Navbar';

// 모드별 색상 테마 정의
const getThemeConfig = (mode) => {
  return createThemeConfig({
    appearance: mode, // 'dark' 또는 'light'
    radius: 'md',
    scaling: 1.0,
    colors: mode === 'dark'
      ? {
          primary: '#3b82f6',
          secondary: '#64748b',
          success: '#10b981',
          warning: '#f59e0b',
          danger: '#ef4444',
          info: '#06b6d4',
          background: '#0f172a',
          foreground: '#f8fafc',
        }
      : {
          primary: '#2563eb',
          secondary: '#94a3b8',
          success: '#22c55e',
          warning: '#fbbf24',
          danger: '#ef4444',
          info: '#0ea5e9',
          background: '#ffffff',
          foreground: '#1e293b',
        },
  });
};

function MyApp({ Component, pageProps }) {
  const router = useRouter();
  const [mode, setMode] = useState('light'); // 기본 라이트 모드
  const [mounted, setMounted] = useState(false);

  // 다크모드 설정 유지 및 시스템 선호도 감지
  useEffect(() => {
    // localStorage에서 저장된 설정 확인
    const savedMode = localStorage.getItem('themeMode');
    
    if (savedMode === 'dark' || savedMode === 'light') {
      setMode(savedMode);
    } else {
      // 저장된 설정이 없으면 시스템 선호도 확인
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const systemMode = prefersDark ? 'dark' : 'light';
      setMode(systemMode);
      localStorage.setItem('themeMode', systemMode);
    }
    
    setMounted(true);
  }, []);

  // 시스템 다크모드 변경 감지 (옵션)
  useEffect(() => {
    if (!mounted) return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e) => {
      // 사용자가 수동으로 설정하지 않은 경우에만 시스템 설정 따르기
      const savedMode = localStorage.getItem('themeMode');
      if (!savedMode) {
        const newMode = e.matches ? 'dark' : 'light';
        setMode(newMode);
        localStorage.setItem('themeMode', newMode);
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [mounted]);

  // 모드 토글 핸들러
  const toggleMode = () => {
    const newMode = mode === 'light' ? 'dark' : 'light';
    setMode(newMode);
    localStorage.setItem('themeMode', newMode);
  };

  // 하이드레이션 이슈 방지
  if (!mounted) {
    return null;
  }

  const showNavbar = !['/', '/register'].includes(router.pathname);

  return (
    <ThemeProvider config={getThemeConfig(mode)}>
      {showNavbar && <Navbar toggleMode={toggleMode} mode={mode} />}
      <Component {...pageProps} />
    </ThemeProvider>
  );
}

export default MyApp;