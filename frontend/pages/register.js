import React, { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/router';
import { Card } from '@goorm-dev/vapor-core';
import { 
  Button, 
  Input, 
  Text,
  Alert,
  FormGroup,
  Label,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter
} from '@goorm-dev/vapor-components';
import { AlertCircle, PartyPopper } from 'lucide-react';
import ReactCanvasConfetti from 'react-canvas-confetti';
import authService from '../services/authService';

const canvasStyles = {
  position: 'fixed',
  pointerEvents: 'none',
  width: '100%',
  height: '100%',
  top: 0,
  left: 0,
  zIndex: 9999
};

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const router = useRouter();
  const refAnimationInstance = useRef(null);

  const getInstance = useCallback((instance) => {
    refAnimationInstance.current = instance;
  }, []);

  const makeShot = useCallback((particleRatio, opts) => {
    refAnimationInstance.current?.({
      ...opts,
      origin: { y: 0.7 },
      particleCount: Math.floor(200 * particleRatio)
    });
  }, []);

  const fireConfetti = useCallback(() => {
    makeShot(0.25, {
      spread: 26,
      startVelocity: 55
    });

    makeShot(0.2, {
      spread: 60
    });

    makeShot(0.35, {
      spread: 100,
      decay: 0.91,
      scalar: 0.8
    });

    makeShot(0.1, {
      spread: 120,
      startVelocity: 25,
      decay: 0.92,
      scalar: 1.2
    });

    makeShot(0.1, {
      spread: 120,
      startVelocity: 45
    });
  }, [makeShot]);

  const validateForm = () => {
    const newErrors = [];
    
    if (!formData.name.trim()) {
      newErrors.push({ field: 'name', message: '이름을 입력해주세요.' });
    }
    
    if (!formData.email.trim()) {
      newErrors.push({ field: 'email', message: '이메일을 입력해주세요.' });
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.push({ field: 'email', message: '올바른 이메일 형식이 아닙니다.' });
    }
    
    if (!formData.password) {
      newErrors.push({ field: 'password', message: '비밀번호를 입력해주세요.' });
    } else if (formData.password.length < 6) {
      newErrors.push({ field: 'password', message: '비밀번호는 6자 이상이어야 합니다.' });
    }
    
    if (formData.password !== formData.confirmPassword) {
      newErrors.push({ field: 'confirmPassword', message: '비밀번호가 일치하지 않습니다.' });
    }

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setErrors([]);

    try {
      const { name, email, password } = formData;
      // 회원가입
      await authService.register({ name, email, password });
      
      // 바로 로그인 처리
      await authService.login({ email, password });
      
      // 회원가입 성공 처리
      setShowSuccessModal(true);
      fireConfetti();
      
      // 10초 후 채팅방 목록 페이지로 이동
      setTimeout(() => {
        router.push('/chat-rooms');
      }, 10000);

    } catch (err) {
      console.error('Registration error:', err);
      
      if (err.response?.data?.errors) {
        setErrors(err.response.data.errors);
      } else if (err.response?.data?.message) {
        setErrors([{ message: err.response.data.message }]);
      } else {
        setErrors([{ message: '회원가입 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.' }]);
      }
    } finally {
      setLoading(false);
    }
  };

  const getFieldError = (fieldName) => {
    return errors.find(error => error.field === fieldName)?.message;
  };

  return (
    <div className="auth-container">
      <ReactCanvasConfetti refConfetti={getInstance} style={canvasStyles} />
      
      <Card className="auth-card">
        <Card.Body className="auth-card-body">
          <div className="auth-header">
            <img src="images/logo.png" className="w-50" alt="Logo" />
            <Text as="h3" typography="heading3">
              회원가입
            </Text>
          </div>

          {errors.length > 0 && (
            <Alert color="danger" className="mt-4">
              <div className="flex items-center gap-2 flex-row">
                <AlertCircle size="18" className="mr-2" />
                {errors.map((error, index) => (
                  <Text key={index} size="sm">
                    {error.message}
                  </Text>
                ))}
              </div>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <FormGroup>
              <Label htmlFor="name" required>이름</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  name: e.target.value
                }))}
                placeholder="이름을 입력하세요"
                disabled={loading}
                state={getFieldError('name') ? 'error' : undefined}
                required
              />
            </FormGroup>

            <FormGroup>
              <Label htmlFor="email" required>이메일</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  email: e.target.value
                }))}
                placeholder="이메일을 입력하세요"
                disabled={loading}
                state={getFieldError('email') ? 'error' : undefined}
                required
              />
            </FormGroup>

            <FormGroup>
              <Label htmlFor="password" required>비밀번호</Label>
              <Input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  password: e.target.value
                }))}
                placeholder="비밀번호를 입력하세요"
                disabled={loading}
                state={getFieldError('password') ? 'error' : undefined}
                required
              />
            </FormGroup>

            <FormGroup>
              <Label htmlFor="confirmPassword" required>비밀번호 확인</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  confirmPassword: e.target.value
                }))}
                placeholder="비밀번호를 다시 입력하세요"
                disabled={loading}
                state={getFieldError('confirmPassword') ? 'error' : undefined}
                required
              />
            </FormGroup>

            <div className="mt-4 text-center">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="auth-submit-button"
                loading={loading}
                disabled={loading}
              >
                {loading ? '회원가입 중...' : '회원가입'}
              </Button>
            </div>

            <div className="mt-4 text-center">
              <Text size="sm">
                이미 계정이 있으신가요?{' '}
              </Text>
            </div>
            <div className="mt-2 text-center">
              <Button
                size="sm"
                variant="text"
                onClick={() => router.push('/')}
                disabled={loading}
              >
                로그인
              </Button>
            </div>
          </form>
        </Card.Body>
      </Card>

      <Modal
        isOpen={showSuccessModal}
        toggle={() => setShowSuccessModal(false)}
        type="center"
        size="md"
        direction="vertical"
      >
        <ModalHeader toggle={() => setShowSuccessModal(false)}>
          <div className="flex items-center gap-3">
            <PartyPopper className="w-6 h-6 text-primary mr-3" />
            <Text as="span" typography="heading4">
              회원가입 성공
            </Text>
          </div>
        </ModalHeader>
        
        <ModalBody className="text-center py-6">
          <div className="flex flex-col items-center gap-4">
            <Text as="h4" typography="heading4" className="text-success">
              회원가입을 축하합니다!
            </Text>
            <br/>
            <Text size="md">
              10초 후 채팅방 목록으로 이동합니다.
            </Text>
          </div>
        </ModalBody>

        <ModalFooter>
          <Button 
            variant="primary" 
            size="lg" 
            onClick={() => router.push('/chat-rooms')}
            className="w-full"
          >
            채팅방 목록으로 이동
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
};

export default Register;