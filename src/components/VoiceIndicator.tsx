// components/VoiceIndicator.tsx
import { useEffect, useRef, useState } from 'react';

interface VoiceIndicatorProps {
  isListening: boolean;
  micLevel: number;
}

export const VoiceIndicator = ({ isListening, micLevel }: VoiceIndicatorProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const [particles, setParticles] = useState<any[]>([]);

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
    const newParticles = Array.from({ length: 20 }, (_, i) => ({
      x: canvas.width / 2,
      y: canvas.height / 2,
      radius: Math.random() * 3 + 1,
      color: `hsl(${Math.random() * 360}, 70%, 60%)`,
      angle: (Math.PI * 2 * i) / 20,
      speed: Math.random() * 2 + 1,
      distance: 0
    }));

    setParticles(newParticles);

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw center blob
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const baseRadius = 20 + (micLevel / 100) * 30; // Size based on microphone level
      
      // Create gradient
      const gradient = ctx.createRadialGradient(
        centerX, centerY, 0,
        centerX, centerY, baseRadius
      );
      gradient.addColorStop(0, 'rgba(59, 130, 246, 0.8)');
      gradient.addColorStop(1, 'rgba(59, 130, 246, 0.2)');
      
      ctx.beginPath();
      ctx.arc(centerX, centerY, baseRadius, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();

      // Draw particles
      const updatedParticles = particles.map(particle => {
        // Move particle based on mic level
        const distance = particle.distance + (micLevel / 100) * particle.speed;
        const x = centerX + Math.cos(particle.angle) * distance;
        const y = centerY + Math.sin(particle.angle) * distance;
        
        // Draw particle
        ctx.beginPath();
        ctx.arc(x, y, particle.radius, 0, Math.PI * 2);
        ctx.fillStyle = particle.color;
        ctx.fill();
        
        // Reset particle if it goes too far
        if (distance > 100) {
          return {
            ...particle,
            distance: 0
          };
        }
        
        return {
          ...particle,
          distance
        };
      });

      setParticles(updatedParticles);
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