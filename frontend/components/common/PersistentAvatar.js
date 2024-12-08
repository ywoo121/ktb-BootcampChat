import React, { useState, useEffect, useCallback, forwardRef } from 'react';
import { Avatar } from '@goorm-dev/vapor-core';
import { getConsistentAvatarStyles } from '../../utils/colorUtils';

const PersistentAvatar = forwardRef(({
  user,
  size = "md",
  className = "",
  onClick,
  showInitials = true,
  ...props
}, ref) => {
  const [currentImage, setCurrentImage] = useState('');
  const [imageError, setImageError] = useState(false);

  // getProfileImageUrl 함수 memoization
  const getProfileImageUrl = useCallback((imagePath) => {
    if (!imagePath) return null;
    return imagePath.startsWith('http') ? 
      imagePath : 
      `${process.env.NEXT_PUBLIC_API_URL}${imagePath}`;
  }, []);

  // 프로필 이미지 URL 처리
  useEffect(() => {
    const imageUrl = getProfileImageUrl(user?.profileImage);
    if (imageUrl && imageUrl !== currentImage) {
      setImageError(false);
      setCurrentImage(imageUrl);
    } else if (!imageUrl) {
      setCurrentImage('');
    }
  }, [user?.profileImage, getProfileImageUrl, currentImage]);

  // 전역 프로필 업데이트 리스너
  useEffect(() => {
    const handleProfileUpdate = () => {
      try {
        const updatedUser = JSON.parse(localStorage.getItem('user') || '{}');
        // 현재 사용자의 프로필이 업데이트된 경우에만 이미지 업데이트
        if (user?.id === updatedUser.id && updatedUser.profileImage !== user.profileImage) {
          const newImageUrl = getProfileImageUrl(updatedUser.profileImage);
          setImageError(false);
          setCurrentImage(newImageUrl);
        }
      } catch (error) {
        console.error('Profile update handling error:', error);
      }
    };
    
    window.addEventListener('userProfileUpdate', handleProfileUpdate);
    return () => {
      window.removeEventListener('userProfileUpdate', handleProfileUpdate);
    };
  }, [getProfileImageUrl, user?.id, user?.profileImage]);

  // 이메일 기반의 일관된 스타일 가져오기
  const avatarStyles = getConsistentAvatarStyles(user?.email);

  const combinedStyles = {
    ...avatarStyles,
    position: 'relative',
    overflow: 'hidden'
  };

  const imageOverlayStyle = {
    backgroundColor: avatarStyles.backgroundColor,
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    borderRadius: 'inherit'
  };

  const handleImageError = (e) => {
    e.preventDefault();
    e.target.style.display = 'none';
    setImageError(true);

    // 이미지 로드 실패 시 이니셜 표시
    if (e.target.parentElement && showInitials) {
      e.target.parentElement.textContent = user?.name?.[0]?.toUpperCase() || '';
      Object.assign(e.target.parentElement.style, avatarStyles);
    }

    // 콘솔에 디버그 정보 출력
    console.debug('Avatar image load failed:', {
      user: user?.name,
      email: user?.email,
      imageUrl: currentImage
    });
  };

  return (
    <Avatar
      ref={ref}
      size={size}
      className={`persistent-avatar ${className}`}
      onClick={onClick}
      style={combinedStyles}
      {...props}
    >
      {currentImage && !imageError ? (
        <Avatar.Image
          src={currentImage}
          alt={`${user?.name}'s profile`}
          style={imageOverlayStyle}
          onError={handleImageError}
          loading="lazy"
        />
      ) : showInitials ? (
        <span 
          style={{ 
            position: 'relative', 
            zIndex: 1,
            fontSize: size === 'sm' ? '0.875rem' : size === 'lg' ? '1.25rem' : '1rem',
            fontWeight: '500'
          }}
          title={user?.name}
        >
          {user?.name?.[0]?.toUpperCase()}
        </span>
      ) : null}
    </Avatar>
  );
});

PersistentAvatar.displayName = 'PersistentAvatar';

export default PersistentAvatar;