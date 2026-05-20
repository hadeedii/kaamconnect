import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { db } from '../../firebase';
import { collection, addDoc, doc, getDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import { Image } from 'expo-image';

export default function BookingReview() {
  const { user } = useAuth();
  const params = useLocalSearchParams<any>();
  const [submitting, setSubmitting] = useState(false);
  const [provider, setProvider] = useState<any>(null);
  const [loadingProvider, setLoadingProvider] = useState(true);

  useEffect(() => {
    if (params.uid) {
      loadProvider();
    } else {
      setLoadingProvider(false);
    }
  }, [params.uid]);

  const loadProvider = async () => {
    try {
      setLoadingProvider(true);
      const providerDoc = await getDoc(doc(db, 'providers', params.uid));
      if (providerDoc.exists()) {
        setProvider({ uid: providerDoc.id, ...providerDoc.data() });
      }
    } catch (error) {
      console.error('Error loading provider:', error);
    } finally {
      setLoadingProvider(false);
    }
  };

  const confirm = async () => {
    try {
      setSubmitting(true);
      if (!user) {
        Alert.alert('Login required', 'Please login to confirm booking');
        return;
      }

      // Create booking document in Firestore
      const rateNum = provider?.hourlyRate ? Number(provider.hourlyRate) : 0;

      // Build a proper scheduledTime ISO string from date + time params
      let scheduledTime = '';
      if (params.dateStr) {
        const base = new Date(params.dateStr);
        if (params.timeStr) {
          // timeStr like "10:00 AM" or "14:30"
          const timeParts = String(params.timeStr).match(/(\d+):(\d+)\s*(AM|PM)?/i);
          if (timeParts) {
            let hours = parseInt(timeParts[1], 10);
            const minutes = parseInt(timeParts[2], 10);
            const period = timeParts[3]?.toUpperCase();
            if (period === 'PM' && hours !== 12) hours += 12;
            if (period === 'AM' && hours === 12) hours = 0;
            base.setHours(hours, minutes, 0, 0);
          }
        }
        scheduledTime = base.toISOString();
      }

      const bookingData = {
        customerId: user.uid,
        customerName: params.name || user.name || '',
        customerPhone: params.phone || user.phone || '',
        customerEmail: params.email || user.email || '',
        providerId: params.uid || '',
        providerName: provider?.name || params.providerName || '',
        providerImage: provider?.profilePicture || '',
        providerCategory: provider?.category || params.category || 'General Service',
        // Fields for provider Bookings screen
        serviceType: provider?.category || params.category || 'General Service',
        location: params.address || '',
        scheduledTime,
        price: rateNum,
        // Keep raw date/time strings as well
        date: params.dateStr || '',
        time: params.timeStr || '',
        address: params.address || '',
        description: params.description || '',
        status: 'pending',
        createdAt: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, 'bookings'), bookingData);

      router.replace({ 
        pathname: '/bookings/success', 
        params: { 
          ...params,
          bookingId: docRef.id,
          providerName: provider?.name || params.providerName || '',
          providerCategory: provider?.category || params.category || 'General Service'
        } 
      });
    } catch (e) {
      console.error('Booking confirmation error:', e);
      Alert.alert('Failed', 'Could not confirm booking. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={22} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Review & Confirm</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Provider Details Block */}
        <Text style={styles.sectionTitle}>Service Specialist</Text>
        {loadingProvider ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="small" color="#5271FF" />
          </View>
        ) : provider ? (
          <View style={styles.providerCard}>
            {provider.profilePicture ? (
              <Image source={{ uri: provider.profilePicture }} style={styles.avatar} />
            ) : (
              <View style={styles.initialsAvatar}>
                <Text style={styles.initialsText}>{provider.name.charAt(0).toUpperCase()}</Text>
              </View>
            )}
            <View style={styles.providerInfo}>
              <Text style={styles.providerName}>{provider.name}</Text>
              <Text style={styles.providerCategory}>{provider.category || 'Specialist'}</Text>
              <View style={styles.ratingRow}>
                <Ionicons name="star" size={14} color="#FBBF24" />
                <Text style={styles.ratingVal}>{provider.rating?.toFixed(1) || '4.8'}</Text>
                <Text style={styles.dot}>•</Text>
                <Text style={styles.jobsText}>{provider.completedJobs || 0} jobs completed</Text>
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.providerCard}>
            <View style={styles.initialsAvatar}>
              <Text style={styles.initialsText}>P</Text>
            </View>
            <View style={styles.providerInfo}>
              <Text style={styles.providerName}>{params.providerName || 'KaamConnect Specialist'}</Text>
              <Text style={styles.providerCategory}>{params.category || 'General Service Partner'}</Text>
            </View>
          </View>
        )}

        {/* Appointment Details */}
        <Text style={styles.sectionTitle}>Appointment Details</Text>
        <View style={styles.detailsBlock}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Scheduled Date</Text>
            <Text style={styles.detailValue}>{formatDate(params.dateStr)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Arrival Time Slot</Text>
            <Text style={styles.detailValue}>{params.timeStr}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Hourly Service Rate</Text>
            <Text style={[styles.detailValue, styles.priceText]}>
              {provider?.hourlyRate ? `Rs.${provider.hourlyRate}/hr` : 'Negotiable'}
            </Text>
          </View>
        </View>

        {/* Customer Details */}
        <Text style={styles.sectionTitle}>Contact & Location</Text>
        <View style={styles.detailsBlock}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Name</Text>
            <Text style={styles.detailValue}>{params.name}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Phone Number</Text>
            <Text style={styles.detailValue}>{params.phone}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Service Address</Text>
            <Text style={styles.detailValue}>{params.address}</Text>
          </View>
        </View>

        {/* Job details */}
        <Text style={styles.sectionTitle}>Task Summary</Text>
        <View style={styles.descriptionBlock}>
          <Text style={styles.descriptionText}>{params.description}</Text>
        </View>
      </ScrollView>

      {/* Confirm Button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          onPress={confirm}
          disabled={submitting}
          style={styles.confirmButton}
          activeOpacity={0.9}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Text style={styles.confirmButtonText}>Confirm Appointment</Text>
              <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" style={{ marginLeft: 6 }} />
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 22,
    marginBottom: 12,
  },
  loaderContainer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  providerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  initialsAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#5271FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  initialsText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
  },
  providerInfo: {
    flex: 1,
    marginLeft: 14,
  },
  providerName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  providerCategory: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 2,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  ratingVal: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    marginLeft: 4,
  },
  dot: {
    fontSize: 12,
    color: '#94A3B8',
    marginHorizontal: 6,
  },
  jobsText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  detailsBlock: {
    borderRadius: 20,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    gap: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  detailLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
    flex: 1,
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1E293B',
    flex: 2,
    textAlign: 'right',
  },
  priceText: {
    color: '#10B981',
  },
  descriptionBlock: {
    borderRadius: 20,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    marginBottom: 24,
  },
  descriptionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
    lineHeight: 18,
  },
  buttonContainer: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    paddingTop: 12,
  },
  confirmButton: {
    backgroundColor: '#10B981',
    borderRadius: 18,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
});
