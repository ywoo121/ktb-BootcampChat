import React from 'react';
import styles from '../styles/EmojiRain.module.css';

const EMOJIS = ['🎉', '🎊', '💥', '💣', '🔥'];

const EmojiRain = () => {
  const emojis = Array.from({ length: 30 }).map((_, i) => {
    const emoji = EMOJIS[Math.floor(Math.random() * EMOJIS.length)];
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

  return <div className={styles.emojiRain}>{emojis}</div>;
};

export default EmojiRain;