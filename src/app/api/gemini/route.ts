// app/api/gemini/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json();
    
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json({ error: 'Gemini API key is not configured' }, { status: 500 });
    }

    // Use the correct endpoint and model
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `You are a helpful assistant for a task management system. You can help with general conversation and also process commands for tasks, projects, teams, and organizations. 
            For general conversation, respond naturally and helpfully. 
            For commands, you can explain what the command does or help the user formulate the command properly.
            
            User message: ${message}`
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error response:', errorText);
      return NextResponse.json({ error: `Gemini API error: ${response.statusText}` }, { status: 500 });
    }

    const data = await response.json();
    
    if (data.candidates && data.candidates.length > 0 && 
        data.candidates[0].content && data.candidates[0].content.parts && 
        data.candidates[0].content.parts.length > 0) {
      return NextResponse.json({ text: data.candidates[0].content.parts[0].text });
    }
    
    return NextResponse.json({ error: 'Invalid response from Gemini API' }, { status: 500 });
  } catch (error) {
    console.error('Gemini API error:', error);
    return NextResponse.json({ error: 'Failed to process message' }, { status: 500 });
  }
}