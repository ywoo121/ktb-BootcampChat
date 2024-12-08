import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Card } from '@goorm-dev/vapor-core';
import { 
  Button, 
  Input, 
  Text,
  Alert,
  Label
} from '@goorm-dev/vapor-components';
import { AlertCircle, Info, Clock, LockKeyhole, Mail, WifiOff } from 'lucide-react';
import authService from '../services/authService';
import { withoutAuth } from '../middleware/withAuth';

const Login = () => {
  const [formData, setFormData] = useState({ 
    email: '', 
    password: '' 
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [serverStatus, setServerStatus] = useState({ checking: true, connected: false });
  const router = useRouter();
  const { redirect } = router.query;

  // 서버 연결 상태 확인
  useEffect(() => {
    const checkServerConnection = async () => {
      try {
        await authService.checkServerConnection();
        setServerStatus({ checking: false, connected: true });
      } catch (error) {
        console.error('Server connection check failed:', error);
        setServerStatus({ checking: false, connected: false });
        setError({
          type: 'error',
          title: '서버 연결 실패',
          message: '서버와 연결할 수 없습니다.',
          suggestion: '인터넷 연결을 확인하고 잠시 후 다시 시도해주세요.',
          Icon: WifiOff
        });
      }
    };

    checkServerConnection();
  }, []);

  const validateForm = () => {
    // 이메일 검증
    if (!formData.email?.trim()) {
      setError({
        type: 'warning',
        title: '입력 오류',
        message: '이메일을 입력해주세요.',
        field: 'email'
      });
      return false;
    }

    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email.trim())) {
      setError({
        type: 'warning',
        title: '입력 오류',
        message: '올바른 이메일 형식이 아닙니다.',
        field: 'email'
      });
      return false;
    }

    // 비밀번호 검증
    if (!formData.password) {
      setError({
        type: 'warning',
        title: '입력 오류',
        message: '비밀번호를 입력해주세요.',
        field: 'password'
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // 서버 연결 상태 확인
    if (!serverStatus.connected) {
      setError({
        type: 'error',
        title: '서버 연결 실패',
        message: '서버와 연결할 수 없습니다.',
        suggestion: '인터넷 연결을 확인하고 잠시 후 다시 시도해주세요.',
        Icon: WifiOff
      });
      return;
    }

    // 폼 유효성 검사
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);

      // 로그인 요청 데이터 준비
      const loginCredentials = {
        email: formData.email.trim(),
        password: formData.password
      };

      // 디버그 로깅
      console.log('Submitting login request:', {
        email: loginCredentials.email,
        hasPassword: !!loginCredentials.password,
        timestamp: new Date().toISOString()
      });

      // 로그인 요청
      await authService.login(loginCredentials);
      const redirectUrl = router.query.redirect || '/chat-rooms';
      router.push(redirectUrl);

    } catch (err) {
      console.error('Login error:', err);

      if (err.isAxiosError && err.response?.status === 500) {
        setError({
          type: 'error',
          title: '서버 오류',
          message: '서버에서 오류가 발생했습니다.',
          suggestion: '잠시 후 다시 시도해주세요.',
          Icon: AlertCircle
        });
      } else {
        setError({
          type: 'error',
          title: '로그인 실패',
          message: err.message || '로그인 처리 중 오류가 발생했습니다.',
          suggestion: '입력하신 정보를 다시 확인해주세요.',
          Icon: AlertCircle
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (error?.field === name) setError(null);
  };

  if (serverStatus.checking) {
    return (
      <div className="auth-container">
        <Card className="auth-card">
          <Card.Body className="auth-card-body">
            <div className="text-center">
              <Text size="lg">서버 연결 확인 중...</Text>
            </div>
          </Card.Body>
        </Card>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <Card className="auth-card">
        <Card.Body className="auth-card-body">
          <div className="auth-header">
            <img src="images/logo-h.png" className="w-50" />
          </div>

          {error && (
            <Alert variant={error.type} className="auth-alert">
              <div className="alert-wrapper">
                {error.Icon && <error.Icon className="w-5 h-5" />}
                <div>
                  <div>{error.title}</div>
                  <div>
                    {error.message}
                    {error.suggestion && (
                      <p className="alert-suggestion">{error.suggestion}</p>
                    )}
                  </div>
                </div>
              </div>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="auth-form" noValidate>
            <div className="form-item">
              <Label htmlFor="email" weight="medium">
                이메일
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="이메일을 입력하세요"
                disabled={loading}
                state={error?.field === 'email' ? 'error' : undefined}
                autoComplete="email"
                required
                aria-required="true"
              />
            </div>

            <div className="form-item">
              <Label htmlFor="password" weight="medium">
                비밀번호
              </Label>
              <Input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="비밀번호를 입력하세요"
                disabled={loading}
                state={error?.field === 'password' ? 'error' : undefined}
                autoComplete="current-password"
                required
                aria-required="true"
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              disabled={loading || !serverStatus.connected}
              className="auth-submit-button"
            >
              {loading ? '로그인 중...' : '로그인'}
            </Button>

            <div className="auth-footer">
              <Text size="sm">
                계정이 없으신가요?
              </Text>
              <br/><br/>
              <Button
                variant="text"
                size="sm"
                onClick={() => router.push('/register')}
                disabled={loading || !serverStatus.connected}
              >
                회원가입
              </Button>
            </div>
          </form>
        </Card.Body>
      </Card>
    </div>
  );
};

export default withoutAuth(Login);