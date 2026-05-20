import { AgentContext, AgentLog, Booking } from './types';
import { db } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';

export const runBookingAgent = async (
  context: AgentContext, 
  customerId: string,
  scheduledTime?: string
): Promise<AgentContext> => {
  const timestamp = new Date().toISOString();
  const provider = context.selectedProvider;

  const log: AgentLog = {
    agentName: 'BookingAgent',
    status: 'pending',
    message: provider 
      ? `Initiating autonomous booking workflow for ${provider.name}...` 
      : 'No provider selected for booking.',
    timestamp
  };
  
  const updatedLogs = [...context.logs, log];

  if (!provider) {
    const failedLog: AgentLog = {
      agentName: 'BookingAgent',
      status: 'failed',
      message: 'Booking aborted because no provider was selected.',
      timestamp: new Date().toISOString()
    };
    return {
      ...context,
      logs: [...context.logs, failedLog]
    };
  }

  try {
    const bookingId = 'bk-' + Math.random().toString(36).substr(2, 9);
    const bookingData: Booking = {
      bookingId,
      customerId,
      providerId: provider.id,
      providerName: provider.name,
      providerImage: provider.image,
      serviceType: context.serviceType || 'Home Service',
      location: context.location || 'Default Location',
      scheduledTime: scheduledTime || context.time || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // tomorrow by default
      status: 'pending',
      createdAt: new Date().toISOString(),
      price: provider.basePrice
    };

    // Save to Firestore
    await setDoc(doc(db, 'bookings', bookingId), bookingData);

    const successLog: AgentLog = {
      agentName: 'BookingAgent',
      status: 'success',
      message: `Booking successfully created in Firestore! Assigned Booking ID: ${bookingId}. Service scheduled.`,
      details: JSON.stringify(bookingData, null, 2),
      timestamp: new Date().toISOString()
    };

    return {
      ...context,
      bookingId,
      logs: [...context.logs, successLog]
    };

  } catch (error: any) {
    console.error("BookingAgent Error: ", error);
    const errorLog: AgentLog = {
      agentName: 'BookingAgent',
      status: 'failed',
      message: `Booking processing failed: ${error.message || error}`,
      timestamp: new Date().toISOString()
    };

    return {
      ...context,
      logs: [...context.logs, errorLog]
    };
  }
};
