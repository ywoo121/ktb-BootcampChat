import React from 'react';
import styles from '../styles/EmojiRain.module.css';


const DEFAULT_EMOJIS = ['🎉', '🎊', '💥', '💣', '🔥'];

const EmojiRain = ({ emojis = DEFAULT_EMOJIS }) => {
    console.log('💧 EmojiRain 렌더링됨 - 이모지:', emojis);
    const elements = Array.from({ length: 30 }).map((_, i) => {
    const emoji = emojis[Math.floor(Math.random() * emojis.length)];
    const left = Math.random() * 100;
    const delay = Math.random() * 2;

    return (
      <span
        key={i}
        className={styles.emoji}
        style={{ left: `${left}%`, animationDelay: `${delay}s` }}
      >
        {emoji}
      </span>
    );
  });

  return <div className={styles.emojiRain}>{elements}</div>;
};

export default EmojiRain;