// hooks/useRealtimeMicrophone.ts
import { useState, useEffect, useRef } from 'react';

interface UseRealtimeMicrophoneReturn {
  isListening: boolean;
  micLevel: number;
  transcript: string;
  startListening: () => void;
  stopListening: () => void;
  error: string | null;
}

export const useRealtimeMicrophone = (): UseRealtimeMicrophoneReturn => {
  const [isListening, setIsListening] = useState(false);
  const [micLevel, setMicLevel] = useState(0);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number | null>(null);
  const recognitionRef = useRef<any>(null);
  
  const startListening = async () => {
    try {
      setIsListening(true);
      setError(null);
      
      // Get microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Set up audio context for real-time analysis
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;
      
      // Create analyser
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;
      
      // Connect microphone to analyser
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);
      
      // Set up real-time volume analysis
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      
      const analyzeVolume = () => {
        if (!analyserRef.current) return;
        
        analyserRef.current.getByteFrequencyData(dataArray);
        
        // Calculate average volume
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const average = sum / bufferLength;
        const normalizedLevel = Math.min(100, (average / 128) * 100);
        
        setMicLevel(normalizedLevel);
        
        if (isListening) {
          animationRef.current = requestAnimationFrame(analyzeVolume);
        }
      };
      
      animationRef.current = requestAnimationFrame(analyzeVolume);
      
      // Set up speech recognition
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';
        
        recognition.onresult = (event: any) => {
          let interimTranscript = '';
          
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const result = event.results[i];
            if (!result.isFinal) {
              interimTranscript += result[0].transcript;
            }
          }
          
          setTranscript(interimTranscript);
        };
        
        recognition.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error);
          setError(`Speech recognition error: ${event.error}`);
        };
        
        recognitionRef.current = recognition;
        recognition.start();
      }
      
    } catch (err) {
      console.error('Error starting microphone:', err);
      setError(`Error: ${(err as Error).message}`);
      setIsListening(false);
    }
  };
  
  const stopListening = () => {
    setIsListening(false);
    
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
  };
  
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);
  
  return {
    isListening,
    micLevel,
    transcript,
    startListening,
    stopListening,
    error
  };
};