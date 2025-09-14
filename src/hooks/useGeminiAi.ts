// hooks/useGeminiAI.ts
import { useState } from 'react';
interface UseGeminiAIReturn {
  processMessage: (message: string, sessionId: string) => Promise<string>;
  isLoading: boolean;
  error: string | null;
}

export const useGeminiAI = (): UseGeminiAIReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const processMessage = async (message: string, sessionId: string): Promise<string> => {
    setIsLoading(true);
    setError(null);

    try {
      // Check if the message is a command or general conversation
      const isCommand = detectCommand(message);
      
      if (isCommand) {
        // Process as a command for your task management system
        return await processCommand(message, sessionId);
      } else {
        // Process as general conversation with Gemini
        return await processGeminiConversation(message);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      return `I'm sorry, I encountered an error: ${errorMessage}`;
    } finally {
      setIsLoading(false);
    }
  };

  const detectCommand = (message: string): boolean => {
    // Keywords that indicate a command for the task management system
    const commandKeywords = [
      'create', 'add', 'make', 'new', 'task', 'project', 'team', 'organization',
      'show', 'get', 'list', 'view', 'find', 'search',
      'update', 'change', 'modify', 'edit',
      'delete', 'remove', 'cancel',
      'assign', 'delegate', 'give',
      'complete', 'finish', 'done', 'mark',
      'analytics', 'report', 'stats', 'performance',
      'notification', 'alert', 'message'
    ];

    const lowerMessage = message.toLowerCase();
    return commandKeywords.some(keyword => lowerMessage.includes(keyword));
  };

  const processCommand = async (command: string, sessionId: string): Promise<string> => {
    // Send the command to your existing API
    const res = await fetch('/api/voice-agent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        query: command, 
        sessionId 
      }),
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || 'Command processing failed');
    }

    const data = await res.json();
    return data.text;
  };

  const processGeminiConversation = async (message: string): Promise<string> => {
    const response = await fetch('/api/gemini', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to process message');
    }

    const data = await response.json();
    return data.text;
  };

  return {
    processMessage,
    isLoading,
    error
  };
};