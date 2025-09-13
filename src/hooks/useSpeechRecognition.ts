// hooks/useSpeechRecognition.ts
import { useState, useRef, useEffect, useCallback } from 'react';

interface UseSpeechRecognitionReturn {
  transcript: string;
  isListening: boolean;
  error: string | null;
  startListening: () => void;
  stopListening: () => void;
  resetTranscript: () => void;
  browserSupport: boolean;
  microphoneAvailable: boolean;
  recognitionType: string;
  debugInfo: string;
}

export const useSpeechRecognition = (): UseSpeechRecognitionReturn => {
  const [transcript, setTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [browserSupport, setBrowserSupport] = useState(false);
  const [microphoneAvailable, setMicrophoneAvailable] = useState(false);
  const [recognitionType, setRecognitionType] = useState('none');
  const [debugInfo, setDebugInfo] = useState('');
  
  const recognitionRef = useRef<any>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      setBrowserSupport(false);
      setDebugInfo('Speech Recognition API not available in this browser');
      return;
    }
    
    setBrowserSupport(true);
    setDebugInfo('Speech Recognition API available');
    
    // Check microphone permissions
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then((stream) => {
        // Stop the stream immediately, we just needed to check permissions
        stream.getTracks().forEach(track => track.stop());
        
        setMicrophoneAvailable(true);
        setDebugInfo('Microphone permission granted');
        
        // Initialize speech recognition
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = 'en-US';
        recognitionRef.current.maxAlternatives = 1; // Improve accuracy
        
        // Determine recognition type
        if ((window as any).webkitSpeechRecognition) {
          setRecognitionType('webkit');
          setDebugInfo('Using WebKit Speech Recognition');
        } else {
          setRecognitionType('standard');
          setDebugInfo('Using Standard Speech Recognition');
        }
        
        // Set up event handlers
        recognitionRef.current.onstart = () => {
          console.log('Speech recognition started');
          setDebugInfo('Speech recognition started');
        };
        
        recognitionRef.current.onresult = (event: any) => {
          let finalTranscript = '';
          let interimTranscript = '';
          
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const result = event.results[i];
            const transcript = result[0].transcript;
            const confidence = result[0].confidence;
            
            // Only use results with good confidence
            if (confidence > 0.7) {
              if (result.isFinal) {
                finalTranscript += transcript + ' ';
              } else {
                interimTranscript += transcript;
              }
            }
          }
          
          if (finalTranscript) {
            setTranscript(prev => prev + finalTranscript);
            setDebugInfo(`Final transcript: ${finalTranscript}`);
          } else {
            setTranscript(prev => prev + interimTranscript);
            setDebugInfo(`Interim transcript: ${interimTranscript}`);
          }
        };
        
        recognitionRef.current.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error);
          setDebugInfo(`Speech recognition error: ${event.error}`);
          
          let errorMessage = 'Speech recognition error';
          switch (event.error) {
            case 'no-speech':
              errorMessage = 'No speech was detected. Please speak more clearly or check your microphone.';
              break;
            case 'audio-capture':
              errorMessage = 'No microphone was found. Ensure that a microphone is installed.';
              break;
            case 'not-allowed':
              errorMessage = 'Permission to use microphone was denied. Please allow microphone access.';
              break;
            case 'network':
              errorMessage = 'Network error occurred. Please check your connection.';
              break;
            default:
              errorMessage = `Error: ${event.error}`;
          }
          
          setError(errorMessage);
          setIsListening(false);
        };
        
        recognitionRef.current.onend = () => {
          console.log('Speech recognition ended');
          setDebugInfo('Speech recognition ended');
          
          if (isListening) {
            // Restart recognition if it ended unexpectedly
            try {
              recognitionRef.current.start();
              setDebugInfo('Speech recognition restarted');
            } catch (e) {
              console.error('Failed to restart speech recognition:', e);
              setDebugInfo(`Failed to restart speech recognition: ${(e as Error).message}`);
              setIsListening(false);
            }
          }
        };
      })
      .catch((err) => {
        console.error('Microphone permission error:', err);
        setMicrophoneAvailable(false);
        setError('Microphone access denied. Please check your browser permissions.');
        setDebugInfo(`Microphone permission denied: ${(err as Error).message}`);
      });
      
    return () => {
      if (recognitionRef.current && isListening) {
        recognitionRef.current.stop();
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isListening]);
  
  const startListening = useCallback(() => {
    if (!microphoneAvailable || !recognitionRef.current) return;
    
    try {
      setTranscript('');
      setError(null);
      setIsListening(true);
      setDebugInfo('Starting speech recognition...');
      
      recognitionRef.current.start();
    } catch (err) {
      console.error('Error starting speech recognition:', err);
      setError('Failed to start speech recognition');
      setDebugInfo(`Failed to start speech recognition: ${(err as Error).message}`);
      setIsListening(false);
    }
  }, [microphoneAvailable]);
  
  const stopListening = useCallback(() => {
    if (!isListening || !recognitionRef.current) return;
    
    try {
      recognitionRef.current.stop();
      setIsListening(false);
      setDebugInfo('Speech recognition stopped');
    } catch (err) {
      console.error('Error stopping speech recognition:', err);
      setError('Failed to stop speech recognition');
      setDebugInfo(`Failed to stop speech recognition: ${(err as Error).message}`);
    }
  }, [isListening]);
  
  const resetTranscript = useCallback(() => {
    setTranscript('');
  }, []);
  
  return {
    transcript,
    isListening,
    error,
    startListening,
    stopListening,
    resetTranscript,
    browserSupport,
    microphoneAvailable,
    recognitionType,
    debugInfo
  };
};