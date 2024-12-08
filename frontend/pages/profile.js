import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/router';
import { Card } from '@goorm-dev/vapor-core';
import { 
  Button, 
  Input, 
  Text,
  Alert,
  Label,
  FormGroup
} from '@goorm-dev/vapor-components';
import { AlertCircle } from 'lucide-react';
import authService from '../services/authService';
import { withAuth } from '../middleware/withAuth';
import ProfileImageUpload from '../components/ProfileImageUpload';
import { generateColorFromEmail, getContrastTextColor } from '../utils/colorUtils';

const Profile = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [profileImage, setProfileImage] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const avatarStyleRef = useRef(null);

  // 프로필 이미지 URL 생성
  const getProfileImageUrl = useCallback((imagePath) => {
    if (!imagePath) return null;
    return imagePath.startsWith('http') ? 
      imagePath : 
      `${process.env.NEXT_PUBLIC_API_URL}${imagePath}`;
  }, []);

  useEffect(() => {
    const user = authService.getCurrentUser();
    if (!user) {
      router.push('/');
      return;
    }

    // 아바타 스타일과 함께 사용자 정보 설정
    if (!avatarStyleRef.current && user.email) {
      const backgroundColor = generateColorFromEmail(user.email);
      const color = getContrastTextColor(backgroundColor);
      avatarStyleRef.current = { backgroundColor, color };
    }

    setCurrentUser(user);
    setFormData(prev => ({ ...prev, name: user.name }));
    setProfileImage(user.profileImage || '');
  }, [router, getProfileImageUrl]);

  // 전역 이벤트 리스너 설정
  useEffect(() => {
    const handleProfileUpdate = () => {
      const user = authService.getCurrentUser();
      if (user) {
        setCurrentUser(user);
        setProfileImage(user.profileImage || '');
      }
    };

    window.addEventListener('userProfileUpdate', handleProfileUpdate);
    return () => {
      window.removeEventListener('userProfileUpdate', handleProfileUpdate);
    };
  }, []);

  const handleImageChange = useCallback(async (imageUrl) => {
    try {
      // 이미지 URL 업데이트
      const fullImageUrl = getProfileImageUrl(imageUrl);
      setProfileImage(imageUrl);

      // 현재 사용자 정보 가져오기
      const user = authService.getCurrentUser();
      if (!user) throw new Error('사용자 정보를 찾을 수 없습니다.');

      // 기존 상태 유지하면서 사용자 정보 업데이트
      const updatedUser = {
        ...user,
        profileImage: imageUrl
      };
      
      // localStorage 업데이트
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setCurrentUser(updatedUser);

      // 성공 메시지 표시
      setSuccess('프로필 이미지가 업데이트되었습니다.');
      
      // 3초 후 성공 메시지 제거
      setTimeout(() => {
        setSuccess('');
      }, 3000);

      // 전역 이벤트 발생
      window.dispatchEvent(new Event('userProfileUpdate'));

    } catch (error) {
      console.error('Image update error:', error);
      setError('프로필 이미지 업데이트에 실패했습니다.');
      
      setTimeout(() => {
        setError('');
      }, 3000);
    }
  }, [getProfileImageUrl]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (formData.newPassword !== formData.confirmPassword) {
      setError('새 비밀번호가 일치하지 않습니다.');
      return;
    }

    setLoading(true);

    try {
      // 비밀번호 변경 처리
      if (formData.currentPassword) {
        if (!formData.newPassword) {
          throw new Error('새 비밀번호를 입력해주세요.');
        }
        await authService.changePassword(formData.currentPassword, formData.newPassword);
      }

      // 이름 변경 처리
      if (formData.name !== currentUser.name) {
        const updatedUser = await authService.updateProfile({ name: formData.name });
        setCurrentUser(updatedUser);
      }

      // 성공 메시지 설정
      setSuccess('프로필이 성공적으로 업데이트되었습니다.');

      // 비밀번호 필드 초기화
      setFormData(prev => ({ 
        ...prev, 
        currentPassword: '', 
        newPassword: '', 
        confirmPassword: '' 
      }));

      // 전역 이벤트 발생
      window.dispatchEvent(new Event('userProfileUpdate'));

    } catch (err) {
      console.error('Profile update error:', err);
      setError(err.response?.data?.message || err.message || '프로필 업데이트 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  if (!currentUser) return null;

  return (
    <div className="profile-container">
      <Card className="profile-card">
        <Card.Header>
          <Text as="h5" typography="heading5">프로필 설정</Text>
        </Card.Header>
        
        <Card.Body className="auth-card-body">
          <div className="profile-header mb-4 text-center">
            <ProfileImageUpload 
              currentImage={profileImage}
              onImageChange={handleImageChange}
            />
          </div>

          {error && (
            <Alert color="danger" className="mt-4">
              <AlertCircle className="w-4 h-4" />
              <span>{error}</span>
            </Alert>
          )}

          {success && (
            <Alert color="success" className="mt-4">
              <span>{success}</span>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="profile-form">
            <FormGroup>
              <Label htmlFor="name">
                이메일
              </Label>
              <Input
                id="email"
                value={currentUser.email}
                disabled
                required
                className="mt-1"
              />
            </FormGroup>
            
            <FormGroup>              
              <Label htmlFor="name">
                이름
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="이름을 입력하세요"
                disabled={loading}
                required
                className="mt-1"
              />
            </FormGroup>
            
            <FormGroup>   
              <Label htmlFor="currentPassword">
                현재 비밀번호
              </Label>
              <Input
                id="currentPassword"
                type="password"
                value={formData.currentPassword}
                onChange={(e) => setFormData(prev => ({ ...prev, currentPassword: e.target.value }))}
                placeholder="현재 비밀번호를 입력하세요"
                disabled={loading}
                className="mt-1"
              />
            </FormGroup>
            
            <FormGroup>   
              <Label htmlFor="newPassword">
                새 비밀번호
              </Label>
              <Input
                id="newPassword"
                type="password"
                value={formData.newPassword}
                onChange={(e) => setFormData(prev => ({ ...prev, newPassword: e.target.value }))}
                placeholder="새 비밀번호를 입력하세요"
                disabled={loading}
                className="mt-1"
              />
            </FormGroup>
            
            <FormGroup>   
              <Label htmlFor="confirmPassword">
                새 비밀번호 확인
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                placeholder="새 비밀번호를 다시 입력하세요"
                disabled={loading}
                className="mt-1"
              />
            </FormGroup>

            <div className="profile-actions mt-4 text-center">
              <Button
                type="submit"
                variant="primary"
                className="w-full"
                loading={loading}
              >
                {loading ? '저장 중...' : '저장'}
              </Button>
              &nbsp;&nbsp;
              <Button
                variant="text"
                className="w-full"
                onClick={() => router.back()}
                disabled={loading}
              >
                취소
              </Button>
            </div>
          </form>
        </Card.Body>
      </Card>
    </div>
  );
};

export default withAuth(Profile);