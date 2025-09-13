// components/VoiceAssistant.tsx
'use client'
// components/VoiceAssistant.tsx
import { useState, useRef, useEffect } from 'react';
import { useTextToSpeech } from '@/hooks/useTextToSpeech';
import { useRealtimeMicrophone } from '@/hooks/useRealtimeMicrophone';
import { useGeminiAI } from '@/hooks/useGeminiAI';
import { VoiceIndicator } from './VoiceIndicator';

const VoiceAssistant = () => {
  const [response, setResponse] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversation, setConversation] = useState<Array<{role: string, text: string}>>([]);
  const [showMicTest, setShowMicTest] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [manualText, setManualText] = useState('');
  
  const {
    speak,
    cancel,
    speaking,
    supported: ttsSupported,
    voices,
    selectedVoice,
    setSelectedVoice,
    rate,
    setRate,
    pitch,
    setPitch,
    volume,
    setVolume
  } = useTextToSpeech();
  
  const {
    isListening,
    micLevel,
    transcript: realtimeTranscript,
    startListening,
    stopListening,
    error: micError
  } = useRealtimeMicrophone();
  
  // Replace with your actual Gemini API key
  const { processMessage, isLoading: isGeminiLoading } = useGeminiAI('YOUR_GEMINI_API_KEY');
  
  const conversationEndRef = useRef<HTMLDivElement>(null);
  
  const handleStartListening = () => {
    startListening();
    
    // Add user speaking indicator
    setConversation(prev => [...prev, { role: 'user', text: '...' }]);
  };
  
  const handleStopListening = () => {
    stopListening();
    
    // Update the last user message with the actual transcript
    if (realtimeTranscript.trim()) {
      setConversation(prev => {
        const newConv = [...prev];
        if (newConv.length > 0 && newConv[newConv.length - 1].role === 'user') {
          newConv[newConv.length - 1] = { role: 'user', text: realtimeTranscript };
        }
        return newConv;
      });
      
      // Automatically process the command
      processVoiceCommand(realtimeTranscript);
    }
  };
  
  const processVoiceCommand = async (command: string) => {
    if (!command.trim()) {
      setConversation(prev => [...prev, { 
        role: 'assistant', 
        text: 'I didn\'t hear anything. Please try again.' 
      }]);
      return;
    }
    
    setIsLoading(true);
    
    // Add assistant thinking indicator
    setConversation(prev => [...prev, { role: 'assistant', text: '...' }]);
    
    try {
      const response = await processMessage(command, sessionId || Date.now().toString());
      
      setResponse(response);
      
      // Update the assistant message with the actual response
      setConversation(prev => {
        const newConv = [...prev];
        if (newConv.length > 0 && newConv[newConv.length - 1].role === 'assistant') {
          newConv[newConv.length - 1] = { role: 'assistant', text: response };
        }
        return newConv;
      });
      
      if (response && ttsSupported && !speaking) {
        speak(response);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      
      // Update the assistant message with the error
      setConversation(prev => {
        const newConv = [...prev];
        if (newConv.length > 0 && newConv[newConv.length - 1].role === 'assistant') {
          newConv[newConv.length - 1] = { role: 'assistant', text: errorMessage };
        }
        return newConv;
      });
      
      if (ttsSupported && !speaking) {
        speak(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleTextSubmit = () => {
    if (manualText.trim()) {
      setConversation(prev => [...prev, { role: 'user', text: manualText }]);
      processVoiceCommand(manualText);
      setManualText('');
    }
  };
  
  const resetConversation = () => {
    setConversation([]);
    setResponse('');
    setManualText('');
  };
  
  useEffect(() => {
    setSessionId(Date.now().toString());
  }, []);
  
  useEffect(() => {
    // Scroll to bottom of conversation
    conversationEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation]);
  
  useEffect(() => {
    // Update the conversation with interim transcript
    if (isListening && realtimeTranscript) {
      setConversation(prev => {
        const newConv = [...prev];
        if (newConv.length > 0 && newConv[newConv.length - 1].role === 'user') {
          newConv[newConv.length - 1] = { role: 'user', text: realtimeTranscript };
        }
        return newConv;
      });
    }
  }, [realtimeTranscript, isListening]);
  
  return (
    <div className="voice-assistant bg-white rounded-xl shadow-lg overflow-hidden w-full max-w-md max-h-[90vh] flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-4 text-white flex-shrink-0">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold">Voice Assistant</h2>
          <button 
            onClick={resetConversation}
            className="text-white hover:text-gray-200 transition-colors"
            aria-label="Reset conversation"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
        <p className="text-blue-100 text-sm mt-1">Press the microphone and speak your command</p>
      </div>
      
      {/* Conversation Area - Scrollable */}
      <div className="flex-grow overflow-y-auto p-4 bg-gray-50">
        {conversation.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-500">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
            <p className="text-center">Start a conversation by pressing the microphone button</p>
          </div>
        ) : (
          <div className="space-y-4">
            {conversation.map((msg, index) => (
              <div 
                key={index} 
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div 
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                    msg.role === 'user' 
                      ? 'bg-blue-500 text-white rounded-tr-none' 
                      : 'bg-white border border-gray-200 rounded-tl-none'
                  }`}
                >
                  {msg.text === '...' ? (
                    <div className="flex items-center space-x-1">
                      <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce delay-75"></div>
                      <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce delay-150"></div>
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap">{msg.text}</p>
                  )}
                </div>
              </div>
            ))}
            <div ref={conversationEndRef} />
          </div>
        )}
      </div>
      
      {/* Controls - Fixed at bottom */}
      <div className="p-4 border-t border-gray-200 flex-shrink-0">
        {/* Error display */}
        {(micError || error) && (
          <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="text-red-700 text-sm flex items-start">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span>{micError || error}</span>
            </div>
          </div>
        )}
        
        {/* Real-time transcript display */}
        {isListening && (
          <div className="mb-3">
            <div className="text-sm text-gray-600 mb-1">Speaking:</div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-gray-800 min-h-12">
              {realtimeTranscript || 'Listening...'}
            </div>
          </div>
        )}
        
        {/* Voice Indicator */}
        {isListening && (
          <VoiceIndicator isListening={isListening} micLevel={micLevel} />
        )}
        
        {/* Microphone button */}
        <div className="flex justify-center mb-3">
          <button
            onClick={isListening ? handleStopListening : handleStartListening}
            disabled={isLoading}
            className={`flex items-center justify-center w-16 h-16 rounded-full transition-all duration-300 transform ${
              isListening 
                ? 'bg-red-500 scale-110 animate-pulse' 
                : 'bg-blue-500 hover:bg-blue-600 hover:scale-105'
            } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            aria-label={isListening ? "Stop listening" : "Start speaking"}
          >
            {isListening ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
              </svg>
            )}
          </button>
        </div>
        
        {/* Text input fallback */}
        <div className="mb-3">
          <div className="text-sm text-gray-600 mb-1">Or type your command:</div>
          <div className="flex">
            <input
              type="text"
              value={manualText}
              onChange={(e) => setManualText(e.target.value)}
              placeholder="Type your command here..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              onKeyPress={(e) => e.key === 'Enter' && handleTextSubmit()}
            />
            <button
              onClick={handleTextSubmit}
              disabled={isLoading || !manualText.trim()}
              className="px-4 py-2 bg-blue-500 text-white rounded-r-lg hover:bg-blue-600 disabled:opacity-50"
            >
              Send
            </button>
          </div>
        </div>
        
        {/* Status indicator */}
        <div className="text-center text-sm text-gray-600">
          {isLoading || isGeminiLoading ? (
            <div className="flex items-center justify-center space-x-1">
              <div className="h-2 w-2 bg-blue-500 rounded-full animate-bounce"></div>
              <div className="h-2 w-2 bg-blue-500 rounded-full animate-bounce delay-75"></div>
              <div className="h-2 w-2 bg-blue-500 rounded-full animate-bounce delay-150"></div>
              <span className="ml-2">Processing your request...</span>
            </div>
          ) : isListening ? (
            <div className="flex items-center justify-center space-x-1">
              <div className="h-3 w-3 rounded-full bg-red-500 animate-pulse"></div>
              <span>Listening... Speak now</span>
            </div>
          ) : (
            <div className="flex items-center justify-center space-x-1">
              <div className="h-3 w-3 rounded-full bg-gray-400"></div>
              <span>Ready</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VoiceAssistant;