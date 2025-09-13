// hooks/useChatGPT.ts
import { useState } from 'react';

interface ChatGPTMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface UseChatGPTReturn {
  processMessage: (message: string, sessionId: string) => Promise<string>;
  isLoading: boolean;
  error: string | null;
}

export const useChatGPT = (): UseChatGPTReturn => {
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
        // Process as general conversation with ChatGPT
        return await processConversation(message);
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

  const processConversation = async (message: string): Promise<string> => {
    // For general conversation, we'll use a simple response
    // In a real implementation, you would call the OpenAI API here
    
    // This is a placeholder - replace with actual OpenAI API call
    const responses = [
      "Hello! How can I help you today?",
      "Hi there! I'm your voice assistant. What can I do for you?",
      "Hey! I'm here to help you with your tasks and answer any questions.",
      "Hello! I can help you manage your tasks or just chat. What would you like to do?",
      "Hi! Feel free to ask me anything or give me a command for your task management system."
    ];

    // Simple keyword-based responses
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
      return responses[Math.floor(Math.random() * responses.length)];
    } else if (lowerMessage.includes('how are you')) {
      return "I'm doing well, thank you for asking! I'm ready to help you with your tasks.";
    } else if (lowerMessage.includes('help')) {
      return "I can help you manage your tasks, projects, teams, and organizations. You can also just chat with me! Try saying 'create a task' or ask me anything.";
    } else if (lowerMessage.includes('thank')) {
      return "You're welcome! Is there anything else I can help you with?";
    } else if (lowerMessage.includes('bye')) {
      return "Goodbye! Feel free to come back anytime you need help with your tasks.";
    } else {
      return "I'm not sure how to respond to that. You can ask me about your tasks, projects, or just say hello! Try saying 'help' for more information.";
    }
  };

  return {
    processMessage,
    isLoading,
    error
  };
};