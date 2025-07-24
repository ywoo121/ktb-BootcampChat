import React from 'react';

const SystemMessage = ({ msg, fightblockMode }) => {
  const formattedTime = new Date(msg.timestamp).toLocaleString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).replace(/\./g, '년').replace(/\s/g, ' ').replace('일 ', '일 ');

  console.log(formattedTime);
  
  return (
    <div
      className="message-system"
      style={fightblockMode ? {
        color: '#7a2250',
        background: '#ffe4ef',
        padding: '10px 18px',
        borderRadius: '12px',
        fontWeight: 'bold',
        margin: '8px 0',
        textAlign: 'center',
        fontSize: '15px',
        boxShadow: '0 1px 4px 0 #ffd6e7'
      } : { textAlign: 'center', margin: '8px 0', fontSize: '15px' }}
    >
      {msg.content}
      {formattedTime && (
        <div className="message-time" style={fightblockMode ? { color: '#c97ca6', fontWeight: 'normal', fontSize: '12px', marginTop: '2px' } : { fontSize: '12px', marginTop: '2px' }}>
          {formattedTime}
        </div>
      )}
    </div>
  );
};

export default React.memo(SystemMessage);