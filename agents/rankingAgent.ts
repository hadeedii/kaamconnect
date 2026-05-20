import { GoogleGenerativeAI } from '@google/generative-ai';
import { AgentContext, AgentLog, Provider } from './types';

const generateMockReasoning = (p: Provider): string => {
  const distanceStr = p.distance ? `${p.distance} km away` : 'nearby';
  const availStr = p.availability === 'available' ? 'instantly available' : 'busy but taking bookings';
  return `Ranked because of a premium rating of ${p.rating}/5, being ${distanceStr}, having ${p.experience} years of expertise, and currently ${availStr}.`;
};

export const runRankingAgent = async (context: AgentContext): Promise<AgentContext> => {
  const timestamp = new Date().toISOString();
  const log: AgentLog = {
    agentName: 'RankingAgent',
    status: 'pending',
    message: 'Ranking matching providers based on proximity, rating, and availability...',
    timestamp
  };
  
  const updatedLogs = [...context.logs, log];
  const providers = context.discoveredProviders || [];

  if (providers.length === 0) {
    const emptyLog: AgentLog = {
      agentName: 'RankingAgent',
      status: 'success',
      message: 'No providers to rank.',
      timestamp: new Date().toISOString()
    };
    return {
      ...context,
      rankedProviders: [],
      logs: [...context.logs, emptyLog]
    };
  }

  try {
    // 1. Calculate Score
    const scoredProviders = providers.map(p => {
      let score = 0;
      score += p.rating * 15; // Max 75
      score -= (p.distance || 0) * 4; // Penalize distance
      score += p.experience * 0.8; // Reward experience
      
      if (p.availability === 'available') {
        score += 30; // High reward for availability
      } else if (p.availability === 'busy') {
        score += 5; // Low reward
      }

      return {
        ...p,
        score
      };
    });

    // 2. Sort by score descending
    const sorted = scoredProviders.sort((a, b) => b.score - a.score);

    // 3. Generate reasoning traces (Gemini or heuristic fallback)
    const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
    let rankedWithReasoning: Provider[] = [];

    if (!apiKey || apiKey === 'mock-key') {
      rankedWithReasoning = sorted.map(p => ({
        ...p,
        reasoningForRanking: generateMockReasoning(p)
      }));
    } else {
      // Call Gemini for explanatory reasoning
      try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

        const providersListStr = sorted.map((p, index) => 
          `[#${index + 1}] Name: ${p.name}, Rating: ${p.rating}, Distance: ${p.distance}km, Experience: ${p.experience} years, Status: ${p.availability}`
        ).join('\n');

        const prompt = `
          You are the Provider Ranking Agent for KaamConnect.
          We have sorted our service providers based on distance, ratings, experience, and availability.
          Please write a short, highly professional 1-sentence reasoning statement for each of the top 3 providers in the list.
          This statement explains to the customer why this provider was chosen and ranked at their position. Keep it friendly and concise (max 15 words per provider).
          Use Roman Urdu or English.
          
          Providers List:
          ${providersListStr}

          Output format must be a JSON array of strings, in the exact same order as the providers list:
          ["reasoning for #1", "reasoning for #2", "reasoning for #3"]
        `;

        const result = await model.generateContent(prompt);
        const text = result.response.text();
        const reasoningArray = JSON.parse(text.trim());

        rankedWithReasoning = sorted.map((p, index) => ({
          ...p,
          reasoningForRanking: reasoningArray[index] || generateMockReasoning(p)
        }));
      } catch (geminiError) {
        console.warn("RankingAgent Gemini explanation failed, using local heuristics", geminiError);
        rankedWithReasoning = sorted.map(p => ({
          ...p,
          reasoningForRanking: generateMockReasoning(p)
        }));
      }
    }

    const successLog: AgentLog = {
      agentName: 'RankingAgent',
      status: 'success',
      message: `Completed ranking process. Top matches generated. Chosen best match: ${rankedWithReasoning[0]?.name}`,
      details: JSON.stringify(rankedWithReasoning.map(r => ({ name: r.name, score: (r as any).score, reason: r.reasoningForRanking })), null, 2),
      timestamp: new Date().toISOString()
    };

    return {
      ...context,
      rankedProviders: rankedWithReasoning,
      selectedProvider: rankedWithReasoning[0],
      logs: [...context.logs, successLog]
    };

  } catch (error: any) {
    console.error("RankingAgent Error: ", error);
    const errorLog: AgentLog = {
      agentName: 'RankingAgent',
      status: 'failed',
      message: `Ranking calculation failed: ${error.message || error}`,
      timestamp: new Date().toISOString()
    };

    return {
      ...context,
      rankedProviders: [],
      logs: [...context.logs, errorLog]
    };
  }
};
