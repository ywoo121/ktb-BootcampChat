'use client';
import { useEffect, useState } from 'react';
import socket from '../../services/socket';

export default function TypingIndicator() {
  const [typingUsers, setTypingUsers] = useState([]);

  useEffect(() => {
    const handleTyping = ({ username }) => {
        console.log('>>> Typing 수신: ', username);
      setTypingUsers((prev) => {
        if (!prev.includes(username)) {
          return [...prev, username];
        }
        return prev;
      });
    };

    const handleStopTyping = ({ username }) => {
      setTypingUsers((prev) => prev.filter((name) => name !== username));
    };

    socket.on('typing', handleTyping);
    socket.on('stopTyping', handleStopTyping);

    return () => {
      socket.off('typing', handleTyping);
      socket.off('stopTyping', handleStopTyping);
    };
  }, []);


  if (typingUsers.length === 0) return null;


   const displayText =
    typingUsers.length === 1
      ? `${typingUsers[0]}님이 입력 중입니다...`
      : `${typingUsers[0]}님 외 ${typingUsers.length - 1}명 입력 중입니다...`;

  return <p className="text-sm text-gray-500 mt-1">{displayText}</p>;
}
