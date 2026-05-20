import { GoogleGenerativeAI } from '@google/generative-ai';
import { AgentContext, AgentLog } from './types';

// Simple heuristic fallback if Gemini fails or is not configured
const runHeuristicFallback = (query: string): { serviceType: string; urgency: 'low' | 'medium' | 'high' | 'immediate' } => {
  const q = query.toLowerCase();
  let serviceType = 'Home Cleaner'; // default fallback
  let urgency: 'low' | 'medium' | 'high' | 'immediate' = 'medium';

  // Service matching (Urdu, Roman Urdu, English)
  if (q.includes('electrician') || q.includes('bijli') || q.includes('shat') || q.includes('fan') || q.includes('pankha') || q.includes('light') || q.includes('switch')) {
    serviceType = 'Electrician';
  } else if (q.includes('plumber') || q.includes('pipe') || q.includes('leak') || q.includes('paani') || q.includes('toti') || q.includes('nal') || q.includes('sink')) {
    serviceType = 'Plumber';
  } else if (q.includes('ac') || q.includes('fridge') || q.includes('air conditioner') || q.includes('cooling') || q.includes('thanda')) {
    serviceType = 'AC Technician';
  } else if (q.includes('beautician') || q.includes('parlor') || q.includes('makeup') || q.includes('facial') || q.includes('haircut') || q.includes('dulhan')) {
    serviceType = 'Beautician';
  } else if (q.includes('tutor') || q.includes('teacher') || q.includes('parhana') || q.includes('ustad') || q.includes('class') || q.includes('maths') || q.includes('english')) {
    serviceType = 'Tutor';
  } else if (q.includes('clean') || q.includes('safai') || q.includes('poocha') || q.includes('jhadu') || q.includes('dusting') || q.includes('washroom')) {
    serviceType = 'Home Cleaner';
  }

  // Urgency matching
  if (q.includes('foran') || q.includes('jaldi') || q.includes('urgent') || q.includes('emergency') || q.includes('immediate') || q.includes('right now') || q.includes('abbi')) {
    urgency = 'immediate';
  } else if (q.includes('aaj') || q.includes('today') || q.includes('tonight') || q.includes('sham')) {
    urgency = 'high';
  } else if (q.includes('kal') || q.includes('tomorrow') || q.includes('subah') || q.includes('morning')) {
    urgency = 'medium';
  } else {
    urgency = 'low';
  }

  return { serviceType, urgency };
};

export const runIntentAgent = async (context: AgentContext): Promise<AgentContext> => {
  const timestamp = new Date().toISOString();
  const log: AgentLog = {
    agentName: 'IntentAgent',
    status: 'pending',
    message: 'Starting intent and service extraction...',
    timestamp
  };
  
  const updatedLogs = [...context.logs, log];
  const query = context.originalQuery;

  try {
    const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
    
    if (!apiKey || apiKey === 'mock-key') {
      // Use fallback heuristics
      const fallback = runHeuristicFallback(query);
      
      const successLog: AgentLog = {
        agentName: 'IntentAgent',
        status: 'success',
        message: `Extracted intent using Heuristic Engine. Detected service: ${fallback.serviceType}, Urgency: ${fallback.urgency}`,
        details: JSON.stringify(fallback, null, 2),
        timestamp: new Date().toISOString()
      };
      
      return {
        ...context,
        serviceType: fallback.serviceType,
        urgency: fallback.urgency,
        logs: [...context.logs, successLog]
      };
    }

    // Call Gemini API
    const genAI = new GoogleGenerativeAI(apiKey);
    // Use gemini-2.5-flash which is the standard model in v54.0.0 docs or equivalent
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-1.5-flash', // Fallback to widely available flash model
      generationConfig: { responseMimeType: "application/json" }
    });

    const prompt = `
      You are the Intent Extraction Agent for KaamConnect.
      Analyze the user's natural language request (written in English, Urdu, or Roman Urdu).
      Extract the requested service type and urgency level.
      
      Valid Service Types: "Electrician", "Plumber", "AC Technician", "Beautician", "Tutor", "Home Cleaner".
      Valid Urgencies: "low", "medium", "high", "immediate".

      Query: "${query}"

      Return only a JSON object matching this schema:
      {
        "serviceType": string,
        "urgency": string
      }
    `;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const parsed = JSON.parse(text.trim());

    const successLog: AgentLog = {
      agentName: 'IntentAgent',
      status: 'success',
      message: `Extracted intent using Gemini AI. Service: ${parsed.serviceType}, Urgency: ${parsed.urgency}`,
      details: JSON.stringify(parsed, null, 2),
      timestamp: new Date().toISOString()
    };

    return {
      ...context,
      serviceType: parsed.serviceType,
      urgency: parsed.urgency,
      logs: [...context.logs, successLog]
    };

  } catch (error: any) {
    console.error("IntentAgent Error: ", error);
    // Graceful fallback to heuristics if Gemini throws an error
    const fallback = runHeuristicFallback(query);
    const errorLog: AgentLog = {
      agentName: 'IntentAgent',
      status: 'success', // marked as success because we successfully resolved via fallback
      message: `Gemini API failed. Recovered via Heuristic Engine. Detected service: ${fallback.serviceType}`,
      details: `Gemini Error: ${error.message || error}\nFallback Data: ${JSON.stringify(fallback)}`,
      timestamp: new Date().toISOString()
    };

    return {
      ...context,
      serviceType: fallback.serviceType,
      urgency: fallback.urgency,
      logs: [...context.logs, errorLog]
    };
  }
};
