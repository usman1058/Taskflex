// hooks/useMicrophoneTest.ts
import { useState, useRef, useEffect } from 'react';

export const useMicrophoneTest = () => {
  const [isTesting, setIsTesting] = useState(false);
  const [micLevel, setMicLevel] = useState(0);
  const [micStatus, setMicStatus] = useState<'idle' | 'testing' | 'working' | 'not-working'>('idle');
  const [micMessage, setMicMessage] = useState('');
  const [audioUrl, setAudioUrl] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDevice, setSelectedDevice] = useState('');
  const [debugInfo, setDebugInfo] = useState('');
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  
  // Get available audio devices
  const getAudioDevices = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const audioDevices = devices.filter(device => device.kind === 'audioinput');
      setDevices(audioDevices);
      
      if (audioDevices.length > 0 && !selectedDevice) {
        setSelectedDevice(audioDevices[0].deviceId);
      }
    } catch (error) {
      console.error('Error getting audio devices:', error);
    }
  };
  
  const testMicrophone = async () => {
    setIsTesting(true);
    setMicStatus('testing');
    setMicMessage('Testing microphone...');
    setMicLevel(0);
    setAudioUrl('');
    audioChunksRef.current = [];
    setDebugInfo('');
    
    try {
      // Request microphone access
      const constraints: MediaStreamConstraints = {
        audio: selectedDevice 
          ? { deviceId: { exact: selectedDevice } }
          : true
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setDebugInfo('Microphone access granted');
      
      // Create a simple audio context to test
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const analyser = audioContext.createAnalyser();
      const microphone = audioContext.createMediaStreamSource(stream);
      microphone.connect(analyser);
      
      // Set up analyser
      analyser.fftSize = 256;
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      
      // Create media recorder for recording
      mediaRecorderRef.current = new MediaRecorder(stream);
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        const audioUrl = URL.createObjectURL(audioBlob);
        setAudioUrl(audioUrl);
        setIsRecording(false);
      };
      
      // Start recording
      mediaRecorderRef.current.start();
      setIsRecording(true);
      setDebugInfo('Recording started');
      
      // Check volume levels
      let maxVolume = 0;
      let detectedSound = false;
      const startTime = Date.now();
      
      const checkVolume = () => {
        analyser.getByteFrequencyData(dataArray);
        
        // Calculate average volume
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const average = sum / bufferLength;
        const normalizedLevel = Math.min(100, (average / 128) * 100);
        
        setMicLevel(normalizedLevel);
        
        // Track maximum volume
        if (normalizedLevel > maxVolume) {
          maxVolume = normalizedLevel;
        }
        
        // Check if sound is detected (lowered threshold)
        if (normalizedLevel > 1) {
          detectedSound = true;
        }
        
        // Stop after 5 seconds
        const elapsed = Date.now() - startTime;
        if (elapsed > 5000) {
          stopMicrophoneTest(detectedSound, maxVolume);
        } else {
          requestAnimationFrame(checkVolume);
        }
      };
      
      checkVolume();
      
    } catch (error) {
      console.error('Microphone test error:', error);
      const errorMessage = (error as Error).message;
      setMicStatus('not-working');
      setMicMessage(`Error: ${errorMessage}`);
      setDebugInfo(`Error: ${errorMessage}`);
      setIsTesting(false);
    }
  };
  
  const stopMicrophoneTest = (soundDetected: boolean, maxLevel: number) => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }
    
    setIsTesting(false);
    
    if (soundDetected) {
      setMicStatus('working');
      setMicMessage(`Microphone is working! Max level detected: ${maxLevel.toFixed(1)}%`);
      setDebugInfo(`Sound detected. Max level: ${maxLevel.toFixed(1)}%`);
    } else {
      setMicStatus('not-working');
      setMicMessage(`No sound detected. Max level: ${maxLevel.toFixed(1)}%. Try speaking louder or check your microphone.`);
      setDebugInfo(`No sound detected. Max level: ${maxLevel.toFixed(1)}%`);
    }
  };
  
  const playRecordedAudio = () => {
    if (audioUrl) {
      const audio = new Audio(audioUrl);
      audio.play();
    }
  };
  
  useEffect(() => {
    getAudioDevices();
    
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);
  
  return {
    isTesting,
    micLevel,
    micStatus,
    micMessage,
    audioUrl,
    isRecording,
    devices,
    selectedDevice,
    setSelectedDevice,
    debugInfo,
    testMicrophone,
    playRecordedAudio
  };
};