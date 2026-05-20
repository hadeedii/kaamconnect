import { AgentContext, AgentLog, Provider } from './types';
import { db } from '../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

// Helper to calculate distance in KM using Haversine formula
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // Radius of earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const d = R * c;
  return Math.round(d * 10) / 10; // round to 1 decimal place
};

export const runProviderDiscoveryAgent = async (context: AgentContext): Promise<AgentContext> => {
  const timestamp = new Date().toISOString();
  const log: AgentLog = {
    agentName: 'ProviderDiscoveryAgent',
    status: 'pending',
    message: `Searching for active ${context.serviceType} providers near ${context.location}...`,
    timestamp
  };
  
  const updatedLogs = [...context.logs, log];
  const userLat = context.latitude || 33.642;
  const userLng = context.longitude || 72.990;
  const targetService = context.serviceType || 'Home Cleaner';

  try {
    const providers: Provider[] = [];

    // Real Firestore query on providers collection
    const providersRef = collection(db, 'providers');
    const q = query(
      providersRef, 
      where('category', '==', targetService)
    );
    
    const querySnapshot = await getDocs(q);
    
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      providers.push({
        id: docSnap.id,
        name: data.name || 'Service Provider',
        image: data.profilePicture || 'https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=150',
        rating: data.rating || 4.8,
        experience: data.experience || 5,
        services: data.skills || [data.category || targetService],
        basePrice: data.hourlyRate || 1200,
        availability: 'available',
        latitude: data.location?.latitude || 33.640,
        longitude: data.location?.longitude || 72.985
      } as Provider);
    });

    // Calculate distance for all matched providers
    const mappedProviders = providers.map(p => ({
      ...p,
      distance: calculateDistance(userLat, userLng, p.latitude, p.longitude)
    }));

    const successLog: AgentLog = {
      agentName: 'ProviderDiscoveryAgent',
      status: 'success',
      message: `Discovered ${mappedProviders.length} matching ${targetService} providers in radius directly from Firestore.`,
      details: JSON.stringify(mappedProviders, null, 2),
      timestamp: new Date().toISOString()
    };

    return {
      ...context,
      discoveredProviders: mappedProviders,
      logs: [...context.logs, successLog]
    };

  } catch (error: any) {
    console.error("ProviderDiscoveryAgent Error: ", error);
    const errorLog: AgentLog = {
      agentName: 'ProviderDiscoveryAgent',
      status: 'failed',
      message: `Discovery execution failed: ${error.message || error}`,
      timestamp: new Date().toISOString()
    };

    return {
      ...context,
      discoveredProviders: [],
      logs: [...context.logs, errorLog]
    };
  }
};
