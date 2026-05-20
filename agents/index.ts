import { AgentContext, AgentLog } from './types';
import { runIntentAgent } from './intentAgent';
import { runLocationAgent } from './locationAgent';
import { runProviderDiscoveryAgent } from './providerDiscoveryAgent';
import { runRankingAgent } from './rankingAgent';
import { runBookingAgent } from './bookingAgent';

export * from './types';
export { runIntentAgent, runLocationAgent, runProviderDiscoveryAgent, runRankingAgent, runBookingAgent };

// Initial empty context
export const createInitialContext = (query: string): AgentContext => ({
  originalQuery: query,
  logs: [],
});

// Runs the pipeline up to the ranking step. Returns intermediate steps.
// The UI can consume this generator or run individual steps to show the animation.
export const executeSearchPipeline = async (
  query: string, 
  onStepComplete?: (stepName: string, context: AgentContext) => void
): Promise<AgentContext> => {
  let context = createInitialContext(query);
  
  // Step 1: Intent
  context = await runIntentAgent(context);
  if (onStepComplete) onStepComplete('intent', context);

  // Step 2: Location
  context = await runLocationAgent(context);
  if (onStepComplete) onStepComplete('location', context);

  // Step 3: Discovery
  context = await runProviderDiscoveryAgent(context);
  if (onStepComplete) onStepComplete('discovery', context);

  // Step 4: Ranking
  context = await runRankingAgent(context);
  if (onStepComplete) onStepComplete('ranking', context);
  return context;
};
