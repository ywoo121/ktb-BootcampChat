import React, { useState, useEffect } from 'react';
import { Alert, Modal, ModalBody, ModalFooter, ModalHeader, Button, Text } from '@goorm-dev/vapor-components';
import { AlertTriangle, Timer, ExternalLink } from 'lucide-react';

const DuplicateLoginModal = ({ 
  isOpen, 
  onClose, 
  deviceInfo, 
  ipAddress,
  onTimeout 
}) => {
  const [timeLeft, setTimeLeft] = useState(10);

  useEffect(() => {
    if (!isOpen) return;

    // 10초 카운트다운
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          onTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(timer);
      setTimeLeft(10);
    };
  }, [isOpen, onTimeout]);

  return (
    <Modal 
      isOpen={isOpen} 
      toggle={onClose}
      type="center"
      size="md"
      direction="vertical"
      className="duplicate-login-modal"
    >
      <ModalHeader toggle={onClose}>
        중복 로그인 감지됨
      </ModalHeader>
      
      <ModalBody className="space-y-4">
        <Alert color="danger">
          <Text>다른 기기에서 로그인이 감지되었습니다.</Text>
          <div className="mt-5">
            <div className="flex items-center gap-2">
              <Text typography="body2">접속 위치: {ipAddress}</Text>
            </div>
            <div className="flex items-center gap-2">
              <Text typography="body2">디바이스: {deviceInfo}</Text>
            </div>
          </div>
        </Alert>

        <Text className="text-center">
          {timeLeft}초 후에 자동으로 로그아웃됩니다.
        </Text>

        <div className="relative w-full h-1 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className="absolute inset-0 bg-warning transition-all duration-1000 ease-linear"
            style={{ 
              width: `${(timeLeft / 10) * 100}%`,
            }}
          />
        </div>
      </ModalBody>

      <ModalFooter>
        <Button
          variant="primary"
          size="lg"
          onClick={onTimeout}
          className="w-full"
        >
          지금 로그아웃
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default DuplicateLoginModal;