import { GoogleGenerativeAI } from '@google/generative-ai';
import { AgentContext, AgentLog } from './types';

// Map of common sectors/locations in Pakistan to coordinates
const locationCoordinatesMap: Record<string, { lat: number; lng: number }> = {
  'G-13': { lat: 33.642, lng: 72.990 },
  'F-10': { lat: 33.693, lng: 73.010 },
  'G-11': { lat: 33.666, lng: 73.018 },
  'I-8': { lat: 33.670, lng: 73.076 },
  'E-11': { lat: 33.699, lng: 72.977 },
  'Blue Area': { lat: 33.710, lng: 73.065 },
  'DHA': { lat: 33.528, lng: 73.148 },
  'Gulshan-e-Iqbal': { lat: 24.918, lng: 67.097 },
  'Clifton': { lat: 24.814, lng: 67.033 },
  'Johar Town': { lat: 31.469, lng: 74.272 },
  'Model Town': { lat: 31.482, lng: 74.323 },
};

const runHeuristicFallback = (query: string): { location: string; lat: number; lng: number } => {
  const q = query.toUpperCase();
  let detectedLocation = 'G-13, Islamabad'; // default fallback
  let lat = 33.642;
  let lng = 72.990;

  for (const [name, coords] of Object.entries(locationCoordinatesMap)) {
    if (q.includes(name.toUpperCase())) {
      detectedLocation = `${name}, Pakistan`;
      lat = coords.lat;
      lng = coords.lng;
      break;
    }
  }

  return { location: detectedLocation, lat, lng };
};

export const runLocationAgent = async (context: AgentContext): Promise<AgentContext> => {
  const timestamp = new Date().toISOString();
  const log: AgentLog = {
    agentName: 'LocationAgent',
    status: 'pending',
    message: 'Extracting location tags and mapping coordinates...',
    timestamp
  };
  
  const updatedLogs = [...context.logs, log];
  const query = context.originalQuery;

  try {
    const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;

    if (!apiKey || apiKey === 'mock-key') {
      const fallback = runHeuristicFallback(query);
      
      const successLog: AgentLog = {
        agentName: 'LocationAgent',
        status: 'success',
        message: `Extracted location using Heuristics. Resolved to: ${fallback.location} (${fallback.lat.toFixed(3)}, ${fallback.lng.toFixed(3)})`,
        details: JSON.stringify(fallback, null, 2),
        timestamp: new Date().toISOString()
      };

      return {
        ...context,
        location: fallback.location,
        latitude: fallback.lat,
        longitude: fallback.lng,
        logs: [...context.logs, successLog]
      };
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      generationConfig: { responseMimeType: "application/json" }
    });

    const prompt = `
      You are the Location Extraction Agent for KaamConnect.
      Analyze the user's service request: "${query}"
      Identify if any specific sector, neighborhood, or city is mentioned (e.g. "G-13", "F-10", "DHA", "Gulshan-e-Iqbal").
      
      Return ONLY a JSON object matching this schema:
      {
        "locationName": string, // E.g., "G-13, Islamabad" or "General Area"
        "hasLocation": boolean // Whether a specific location was found in the text
      }
    `;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const parsed = JSON.parse(text.trim());

    let lat = 33.642; // default G-13
    let lng = 72.990;
    let finalLocation = parsed.locationName;

    if (parsed.hasLocation) {
      const fallback = runHeuristicFallback(parsed.locationName || query);
      lat = fallback.lat;
      lng = fallback.lng;
      finalLocation = fallback.location;
    } else {
      finalLocation = 'User\'s Current Location (G-13)';
    }

    const successLog: AgentLog = {
      agentName: 'LocationAgent',
      status: 'success',
      message: `Extracted location using Gemini. Location: ${finalLocation}. Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`,
      details: JSON.stringify({ parsed, lat, lng }, null, 2),
      timestamp: new Date().toISOString()
    };

    return {
      ...context,
      location: finalLocation,
      latitude: lat,
      longitude: lng,
      logs: [...context.logs, successLog]
    };

  } catch (error: any) {
    console.error("LocationAgent Error: ", error);
    const fallback = runHeuristicFallback(query);
    const errorLog: AgentLog = {
      agentName: 'LocationAgent',
      status: 'success',
      message: `Failed to resolve location via Gemini. Fallback resolved to: ${fallback.location}`,
      details: `Error: ${error.message || error}\nFallback Data: ${JSON.stringify(fallback)}`,
      timestamp: new Date().toISOString()
    };

    return {
      ...context,
      location: fallback.location,
      latitude: fallback.lat,
      longitude: fallback.lng,
      logs: [...context.logs, errorLog]
    };
  }
};
