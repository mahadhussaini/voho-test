/**
 * Ultravox API Integration Service
 * Handles communication with Ultravox API for call management
 */

const ULTRAVOX_API_KEY = process.env.ULTRAVOX_API_KEY;
const ULTRAVOX_API_URL = process.env.ULTRAVOX_API_URL || 'https://api.ultravox.ai';

/**
 * Create a new call via Ultravox API
 */
export const createCall = async (callParams) => {
  try {
    const response = await fetch(`${ULTRAVOX_API_URL}/calls`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': ULTRAVOX_API_KEY
      },
      body: JSON.stringify({
        systemPrompt: callParams.systemPrompt || 'You are a helpful AI assistant.',
        model: callParams.model || 'fixie-ai/ultravox',
        voice: callParams.voice || 'default',
        ...callParams
      })
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Unknown error' }));
      throw new Error(`Ultravox API error: ${error.message || response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Ultravox createCall error:', error);
    throw error;
  }
};

/**
 * Get call status from Ultravox API
 */
export const getCallStatus = async (callId) => {
  try {
    const response = await fetch(`${ULTRAVOX_API_URL}/calls/${callId}`, {
      headers: {
        'X-API-Key': ULTRAVOX_API_KEY
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to get call status: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Ultravox getCallStatus error:', error);
    throw error;
  }
};

/**
 * Get call transcript from Ultravox API
 */
export const getCallTranscript = async (callId) => {
  try {
    const response = await fetch(`${ULTRAVOX_API_URL}/calls/${callId}/transcript`, {
      headers: {
        'X-API-Key': ULTRAVOX_API_KEY
      }
    });

    if (!response.ok) {
      return null; // Transcript might not be available yet
    }

    return await response.json();
  } catch (error) {
    console.error('Ultravox getCallTranscript error:', error);
    return null;
  }
};

/**
 * Mock Ultravox API for development/testing
 * This simulates the Ultravox API behavior for demonstration
 */
export const mockCreateCall = async (callParams) => {
  const callId = `mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  return {
    callId,
    status: 'queued',
    joinUrl: `https://ultravox.ai/call/${callId}`,
    createdAt: new Date().toISOString()
  };
};

export const mockGetCallStatus = async (callId) => {
  // Simulate status progression
  const statuses = ['queued', 'ringing', 'in_progress', 'completed'];
  const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
  
  return {
    callId,
    status: randomStatus,
    duration: randomStatus === 'completed' ? Math.floor(Math.random() * 300) : null,
    recordingUrl: randomStatus === 'completed' 
      ? `https://recordings.ultravox.ai/${callId}.mp3` 
      : null
  };
};

export const mockGetCallTranscript = async (callId) => {
  return {
    callId,
    transcript: [
      { speaker: 'AI', text: 'Hello! How can I help you today?', timestamp: '00:00:01' },
      { speaker: 'User', text: 'I need help with my account.', timestamp: '00:00:05' },
      { speaker: 'AI', text: 'I\'d be happy to help with your account. What specific issue are you experiencing?', timestamp: '00:00:08' }
    ]
  };
};

