export interface AgentLog {
  agentName: string;
  status: 'pending' | 'success' | 'failed';
  message: string;
  details?: string;
  timestamp: string;
}

export interface AgentContext {
  originalQuery: string;
  serviceType?: string;
  location?: string;
  time?: string;
  urgency?: 'low' | 'medium' | 'high' | 'immediate';
  latitude?: number;
  longitude?: number;
  discoveredProviders?: Provider[];
  rankedProviders?: Provider[];
  selectedProvider?: Provider;
  bookingId?: string;
  logs: AgentLog[];
}

export interface Provider {
  id: string;
  name: string;
  image: string;
  rating: number;
  experience: number; // in years
  services: string[];
  basePrice: number;
  availability: 'available' | 'busy' | 'offline';
  latitude: number;
  longitude: number;
  distance?: number; // calculated relative to user
  reasoningForRanking?: string;
}

export interface Booking {
  bookingId: string;
  customerId: string;
  providerId: string;
  providerName: string;
  providerImage: string;
  serviceType: string;
  location: string;
  scheduledTime: string;
  status: 'pending' | 'accepted' | 'assigned' | 'completed' | 'cancelled';
  createdAt: string;
  price: number;
  customerName?: string;
  customerPhone?: string;
  description?: string; // details of the request
  notifyToken?: string; // push token of the customer
  providerToken?: string; // push token of the provider
}
