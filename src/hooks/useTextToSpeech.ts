// hooks/useTextToSpeech.ts
import { useState, useRef, useEffect } from 'react';

interface UseTextToSpeechReturn {
  speak: (text: string) => void;
  cancel: () => void;
  speaking: boolean;
  supported: boolean;
  voices: SpeechSynthesisVoice[];
  selectedVoice: SpeechSynthesisVoice | null;
  setSelectedVoice: (voice: SpeechSynthesisVoice) => void;
  rate: number;
  setRate: (rate: number) => void;
  pitch: number;
  setPitch: (pitch: number) => void;
  volume: number;
  setVolume: (volume: number) => void;
}

export const useTextToSpeech = (): UseTextToSpeechReturn => {
  const [speaking, setSpeaking] = useState(false);
  const [supported, setSupported] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [rate, setRate] = useState(1);
  const [pitch, setPitch] = useState(1);
  const [volume, setVolume] = useState(1);
  
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  
  useEffect(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      setSupported(true);
      
      // Load voices
      const loadVoices = () => {
        const availableVoices = window.speechSynthesis.getVoices();
        setVoices(availableVoices);
        
        // Set default voice to first English voice
        const englishVoice = availableVoices.find(voice => 
          voice.lang.includes('en') || voice.name.includes('English')
        );
        
        if (englishVoice) {
          setSelectedVoice(englishVoice);
        }
      };
      
      // Chrome loads voices asynchronously
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = loadVoices;
      } else {
        loadVoices();
      }
    } else {
      setSupported(false);
    }
    
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);
  
  const speak = (text: string) => {
    if (!supported || !text.trim()) return;
    
    // Cancel any ongoing speech
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
    }
    
    // Create utterance
    utteranceRef.current = new SpeechSynthesisUtterance(text);
    
    // Set voice
    if (selectedVoice) {
      utteranceRef.current.voice = selectedVoice;
    }
    
    // Set parameters
    utteranceRef.current.rate = rate;
    utteranceRef.current.pitch = pitch;
    utteranceRef.current.volume = volume;
    
    // Set event handlers
    utteranceRef.current.onstart = () => {
      setSpeaking(true);
    };
    
    utteranceRef.current.onend = () => {
      setSpeaking(false);
    };
    
    utteranceRef.current.onerror = (event) => {
      console.error('Speech synthesis error:', event.error);
      setSpeaking(false);
    };
    
    // Speak
    window.speechSynthesis.speak(utteranceRef.current);
  };
  
  const cancel = () => {
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
    }
  };
  
  return {
    speak,
    cancel,
    speaking,
    supported,
    voices,
    selectedVoice,
    setSelectedVoice,
    rate,
    setRate,
    pitch,
    setPitch,
    volume,
    setVolume
  };
};