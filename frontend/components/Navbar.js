import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';
import { 
 Button, 
 Text,
 Dropdown, 
 DropdownToggle,
 DropdownMenu,
 DropdownItem
} from '@goorm-dev/vapor-components';
import PersistentAvatar from './common/PersistentAvatar';
import authService from '../services/authService';

const Navbar = () => {
 const [currentUser, setCurrentUser] = useState(null);
 const [dropdownOpen, setDropdownOpen] = useState(false);
 const router = useRouter();

 // 인증 상태 변경을 감지하는 효과
 useEffect(() => {
   const checkAuth = () => {
     const user = authService.getCurrentUser();
     setCurrentUser(user);
   };

   // 초기 인증 상태 확인
   checkAuth();

   // authStateChange 이벤트 리스너 등록
   const handleAuthChange = () => {
     checkAuth();
   };

   // userProfileUpdate 이벤트 리스너 등록
   const handleProfileUpdate = () => {
     checkAuth();
   };

   window.addEventListener('authStateChange', handleAuthChange);
   window.addEventListener('userProfileUpdate', handleProfileUpdate);

   // 정리 함수
   return () => {
     window.removeEventListener('authStateChange', handleAuthChange);
     window.removeEventListener('userProfileUpdate', handleProfileUpdate);
   };
 }, []);

 const handleNavigation = (path) => {
   setDropdownOpen(false);
   router.push(path);
 };

 const handleLogout = async () => {
   setDropdownOpen(false);
   await authService.logout();
   // 로그아웃 후 authStateChange 이벤트 발생
   window.dispatchEvent(new Event('authStateChange'));
 };

 const toggleDropdown = () => {
   setDropdownOpen(prev => !prev);
 };

 const isInChatRooms = router.pathname === '/chat-rooms';

 return (
   <nav className="global-nav">
     <div className="container-fluid px-4 sm:px-6 lg:px-8">
       <div className="nav-row">
         <div className="nav-logo">
           <div 
             onClick={() => handleNavigation(currentUser ? '/chat-rooms' : '/')}
             className="cursor-pointer"
             role="button"
             tabIndex={0}
             onKeyPress={(e) => {
               if (e.key === 'Enter') {
                 handleNavigation(currentUser ? '/chat-rooms' : '/');
               }
             }}
           >
             <Image
               src="/images/logo.png"
               alt="Chat App Logo"
               width={240}
               height={72}
               style={{ objectFit: 'contain' }}
               priority
             />
           </div>
         </div>

         <div className="nav-menu">
           {currentUser && (
             <div className="nav-buttons hidden md:flex space-x-4">
               <Button
                 variant={isInChatRooms ? "primary" : "text"}
                 onClick={() => handleNavigation('/chat-rooms')}
                 size="lg"
               >
                 채팅방 목록
               </Button>
               <Button
                 variant="secondary"
                 onClick={() => handleNavigation('/chat-rooms/new')}
                 size="lg"
               >
                 새 채팅방
               </Button>
             </div>
           )}
         </div>

         <div className="nav-user">
           {currentUser ? (
             <Dropdown
               isOpen={dropdownOpen}
               toggle={toggleDropdown}
               direction="down"
               size="lg"
             >
               <DropdownToggle caret className="flex items-center">
                 <PersistentAvatar
                   user={currentUser}
                   size="sm"
                   className="flex-shrink-0"
                   showInitials={true}
                 />
                 <Text className="ml-2">
                   {currentUser.name}
                 </Text>
               </DropdownToggle>
               <DropdownMenu>
                 <DropdownItem
                   onClick={() => handleNavigation('/profile')}
                 >
                   프로필
                 </DropdownItem>
                 <DropdownItem divider />
                 <DropdownItem
                   onClick={handleLogout}
                   className="text-danger"
                 >
                   로그아웃
                 </DropdownItem>
               </DropdownMenu>
             </Dropdown>
           ) : (
             <div className="nav-auth flex items-center space-x-4">
               <Button
                 variant="text"
                 onClick={() => handleNavigation('/login')}
                 size="lg"
               >
                 로그인
               </Button>
               <Button
                 variant="primary"
                 onClick={() => handleNavigation('/register')}
                 size="lg"
               >
                 회원가입
               </Button>
             </div>
           )}
         </div>
       </div>
     </div>
   </nav>
 );
};

export default Navbar;