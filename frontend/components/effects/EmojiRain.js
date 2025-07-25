import React, { useEffect, useRef, useState } from 'react';

const EmojiRain = ({ 
  emojis = ['🎉'], 
  intensity = 'medium', 
  duration = 5000,
  onComplete 
}) => {
  const containerRef = useRef(null);
  const animationRef = useRef(null);
  const [isActive, setIsActive] = useState(true);
  const particlesRef = useRef([]);

  // Intensity configurations
  const intensityConfig = {
    light: {
      particleCount: 15,
      spawnRate: 2,
      speed: { min: 1, max: 3 },
      size: { min: 20, max: 30 }
    },
    medium: {
      particleCount: 30,
      spawnRate: 4,
      speed: { min: 2, max: 5 },
      size: { min: 24, max: 36 }
    },
    heavy: {
      particleCount: 50,
      spawnRate: 6,
      speed: { min: 3, max: 7 },
      size: { min: 28, max: 42 }
    },
    extreme: {
      particleCount: 80,
      spawnRate: 10,
      speed: { min: 4, max: 9 },
      size: { min: 32, max: 48 }
    }
  };

  const config = intensityConfig[intensity] || intensityConfig.medium;

  // Particle class
  class EmojiParticle {
    constructor(emoji, container) {
      this.emoji = emoji;
      this.container = container;
      this.element = this.createElement();
      this.reset();
      this.container.appendChild(this.element);
    }

    createElement() {
      const element = document.createElement('div');
      element.textContent = this.emoji;
      element.style.position = 'absolute';
      element.style.pointerEvents = 'none';
      element.style.userSelect = 'none';
      element.style.zIndex = '9999';
      element.style.fontSize = `${Math.random() * (config.size.max - config.size.min) + config.size.min}px`;
      element.style.opacity = '0.9';
      return element;
    }

    reset() {
      const containerRect = this.container.getBoundingClientRect();
      this.x = Math.random() * containerRect.width;
      this.y = -50;
      this.speed = Math.random() * (config.speed.max - config.speed.min) + config.speed.min;
      this.rotation = 0;
      this.rotationSpeed = (Math.random() - 0.5) * 4;
      this.sway = Math.random() * 2 - 1;
      this.swaySpeed = Math.random() * 0.02 + 0.01;
      
      this.element.style.left = `${this.x}px`;
      this.element.style.top = `${this.y}px`;
      this.element.style.transform = `rotate(${this.rotation}deg)`;
    }

    update(deltaTime) {
      this.y += this.speed * deltaTime * 0.1;
      this.x += Math.sin(this.y * this.swaySpeed) * this.sway * deltaTime * 0.05;
      this.rotation += this.rotationSpeed * deltaTime * 0.1;
      
      this.element.style.left = `${this.x}px`;
      this.element.style.top = `${this.y}px`;
      this.element.style.transform = `rotate(${this.rotation}deg)`;

      // Reset if particle is off screen
      const containerRect = this.container.getBoundingClientRect();
      if (this.y > containerRect.height + 50) {
        this.reset();
      }
    }

    destroy() {
      if (this.element && this.element.parentNode) {
        this.element.parentNode.removeChild(this.element);
      }
    }
  }

  // Initialize particles
  useEffect(() => {
    if (!containerRef.current || !isActive) return;

    const particles = [];
    const container = containerRef.current;

    // Create particles
    for (let i = 0; i < config.particleCount; i++) {
      const emoji = emojis[Math.floor(Math.random() * emojis.length)];
      const particle = new EmojiParticle(emoji, container);
      particles.push(particle);
    }

    particlesRef.current = particles;

    // Animation loop
    let lastTime = performance.now();
    let spawnTimer = 0;
    const spawnInterval = 1000 / config.spawnRate;

    const animate = (currentTime) => {
      if (!isActive) return;

      const deltaTime = currentTime - lastTime;
      lastTime = currentTime;

      // Update existing particles
      particles.forEach(particle => {
        particle.update(deltaTime);
      });

      // Spawn new particles if needed
      spawnTimer += deltaTime;
      if (spawnTimer >= spawnInterval && particles.length < config.particleCount) {
        const emoji = emojis[Math.floor(Math.random() * emojis.length)];
        const particle = new EmojiParticle(emoji, container);
        particles.push(particle);
        spawnTimer = 0;
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      particles.forEach(particle => particle.destroy());
      particlesRef.current = [];
    };
  }, [isActive, emojis, intensity]);

  // Duration timer
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsActive(false);
      if (onComplete) {
        onComplete();
      }
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onComplete]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      particlesRef.current.forEach(particle => particle.destroy());
    };
  }, []);

  if (!isActive) return null;

  return (
    <div
      ref={containerRef}
      className="emoji-rain-container"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: 9999,
        overflow: 'hidden'
      }}
    />
  );
};

// Hook for managing multiple emoji rain effects
export const useEmojiRain = () => {
  const [activeRains, setActiveRains] = useState([]);

  const triggerEmojiRain = (emojis, intensity = 'medium', duration = 5000) => {
    const id = Date.now() + Math.random();
    const rainEffect = {
      id,
      emojis,
      intensity,
      duration,
      onComplete: () => {
        setActiveRains(prev => prev.filter(rain => rain.id !== id));
      }
    };

    setActiveRains(prev => [...prev, rainEffect]);
    
    return id;
  };

  const stopEmojiRain = (id) => {
    setActiveRains(prev => prev.filter(rain => rain.id !== id));
  };

  const stopAllEmojiRains = () => {
    setActiveRains([]);
  };

  const EmojiRainRenderer = () => (
    <>
      {activeRains.map(rain => (
        <EmojiRain
          key={rain.id}
          emojis={rain.emojis}
          intensity={rain.intensity}
          duration={rain.duration}
          onComplete={rain.onComplete}
        />
      ))}
    </>
  );

  return {
    triggerEmojiRain,
    stopEmojiRain,
    stopAllEmojiRains,
    activeRains: activeRains.length,
    EmojiRainRenderer
  };
};

export default EmojiRain;