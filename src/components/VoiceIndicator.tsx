// components/VoiceIndicator.tsx
import { useEffect, useRef, useState } from 'react';

interface VoiceIndicatorProps {
  isListening: boolean;
  micLevel: number;
}

export const VoiceIndicator = ({ isListening, micLevel }: VoiceIndicatorProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const particlesRef = useRef<any[]>([]);
  
  useEffect(() => {
    if (!isListening || !canvasRef.current) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Initialize particles
    const particleCount = 30;
    const newParticles = Array.from({ length: particleCount }, (_, i) => ({
      x: canvas.width / 2,
      y: canvas.height / 2,
      radius: Math.random() * 2 + 1,
      color: `hsl(${200 + Math.random() * 60}, 70%, 60%)`,
      angle: (Math.PI * 2 * i) / particleCount,
      speed: Math.random() * 1.5 + 0.5,
      distance: Math.random() * 30,
      maxDistance: 50 + micLevel * 0.5, // Max distance based on mic level
      opacity: 1
    }));

    particlesRef.current = newParticles;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      
      // Draw central blob that pulses with mic level
      const baseRadius = 15 + (micLevel / 100) * 25; // Size based on microphone level
      
      // Create gradient for central blob
      const gradient = ctx.createRadialGradient(
        centerX, centerY, 0,
        centerX, centerY, baseRadius
      );
      gradient.addColorStop(0, 'rgba(59, 130, 246, 0.9)');
      gradient.addColorStop(1, 'rgba(59, 130, 246, 0.1)');
      
      ctx.beginPath();
      ctx.arc(centerX, centerY, baseRadius, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();

      // Draw particles
      const updatedParticles = particlesRef.current.map(particle => {
        // Move particle based on mic level
        const targetDistance = particle.maxDistance * (micLevel / 100);
        particle.distance += (targetDistance - particle.distance) * 0.1;
        
        const x = centerX + Math.cos(particle.angle) * particle.distance;
        const y = centerY + Math.sin(particle.angle) * particle.distance;
        
        // Draw particle
        ctx.beginPath();
        ctx.arc(x, y, particle.radius, 0, Math.PI * 2);
        ctx.fillStyle = particle.color;
        ctx.globalAlpha = particle.opacity;
        ctx.fill();
        ctx.globalAlpha = 1;
        
        // Update particle angle for rotation
        particle.angle += 0.01;
        
        return particle;
      });

      particlesRef.current = updatedParticles;
      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isListening, micLevel]);

  if (!isListening) {
    return null;
  }

  return (
    <div className="voice-indicator flex justify-center my-4">
      <canvas
        ref={canvasRef}
        width={200}
        height={200}
        className="border border-gray-200 rounded-full"
      />
    </div>
  );
};