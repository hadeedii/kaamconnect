import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { collection, doc, onSnapshot, query, updateDoc, where } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { Alert, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Booking } from '../../../agents/types';
import { CustomToggle } from '../../../components/ui/custom-toggle';
import { useAuth } from '../../../context/AuthContext';
import { db } from '../../../firebase';

export default function ProviderDashboard() {
  const { user, signOut } = useAuth();

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out of KaamConnect?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: signOut
        }
      ]
    );
  };
  const [isAvailable, setIsAvailable] = useState(true);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!user) return;
    setLoading(true);

    const bookingsRef = collection(db, 'bookings');
    const q = query(bookingsRef, where('providerId', '==', user.uid));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: Booking[] = [];
      snapshot.forEach(d => {
        const data = d.data() as Booking;
        list.push({ ...data, bookingId: data.bookingId || d.id });
      });
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setBookings(list);
      setLoading(false);
      setRefreshing(false);
    }, (error) => {
      console.error(error);
      setLoading(false);
      setRefreshing(false);
    });

    return () => unsubscribe();
  }, [user]);

  const onRefresh = () => {
    // onSnapshot automatically updates, but we can keep the refreshing state for the UI spinner briefly
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  const handleAcceptJob = async (bookingId: string) => {
    try {
      const ref = doc(db, 'bookings', bookingId);
      await updateDoc(ref, { status: 'assigned' });
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeclineJob = async (bookingId: string) => {
    try {
      const ref = doc(db, 'bookings', bookingId);
      await updateDoc(ref, { status: 'cancelled' });
    } catch (e) {
      console.error(e);
    }
  };

  // Calculate earnings metrics
  const completedJobs = bookings.filter(b => b.status === 'completed');
  const activeJobs = bookings.filter(b => b.status === 'assigned');
  const incomingRequests = bookings.filter(b => b.status === 'pending');
  const totalEarnings = completedJobs.reduce((sum, b) => {
    const val = Number(b.price) || Number((b as any).providerRate) || 0;
    return sum + val;
  }, 0);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />



      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Availability Card */}
        <View style={styles.statusCard}>
          <View style={styles.statusRow}>
            <View>
              <Text style={styles.statusTitle}>Duty Status</Text>
              <Text style={[styles.statusSubtitle, { color: isAvailable ? '#10B981' : '#94A3B8' }]}>
                {isAvailable ? 'Online & accepting requests' : 'Offline'}
              </Text>
            </View>
            <CustomToggle
              value={isAvailable}
              onValueChange={setIsAvailable}
            />
          </View>
        </View>

        {/* Earnings & Stats Panel */}
        <View style={styles.statsPanel}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>MONTHLY EARNINGS</Text>
            <Text style={styles.earningsValue}>Rs. {totalEarnings.toLocaleString()}</Text>
          </View>
          <View style={styles.statsDivider} />
          <View style={styles.statusRow}>
            <View style={styles.miniStat}>
              <Text style={styles.miniStatVal}>{completedJobs.length}</Text>
              <Text style={styles.miniStatLabel}>Completed</Text>
            </View>
            <View style={styles.miniStat}>
              <Text style={styles.miniStatVal}>{activeJobs.length}</Text>
              <Text style={styles.miniStatLabel}>Active Jobs</Text>
            </View>
          </View>
        </View>

        {/* Incoming Requests Section */}
        <Text style={styles.sectionTitle}>Incoming Job Requests ({incomingRequests.length})</Text>
        {incomingRequests.length === 0 ? (
          <View style={styles.emptyRequests}>
            <Ionicons name="notifications-off-outline" size={32} color="#94A3B8" />
            <Text style={styles.emptyRequestsText}>No pending requests right now.</Text>
          </View>
        ) : (
          incomingRequests.map((job) => (
            <View key={job.bookingId} style={styles.jobCard}>
              <View style={styles.jobHeader}>
                <Ionicons name="flash-outline" size={24} color="#5271FF" style={styles.jobIconBg} />
                <View style={styles.jobMeta}>
                  <Text style={styles.jobService}>{job.serviceType}</Text>
                  <Text style={styles.jobLocation}>
                    <Ionicons name="location-outline" size={12} /> {job.location}
                  </Text>
                </View>
                <Text style={styles.jobPrice}>Rs. {job.price || (job as any).providerRate || '0'}</Text>
              </View>

              <Text style={styles.jobTime}>
                Scheduled: {new Date(job.scheduledTime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
              </Text>

              <View style={styles.jobActions}>
                <TouchableOpacity
                  style={[styles.jobBtn, styles.declineBtn]}
                  onPress={() => handleDeclineJob(job.bookingId)}
                >
                  <Text style={styles.declineText}>Decline</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.jobBtn, styles.acceptBtn]}
                  onPress={() => handleAcceptJob(job.bookingId)}
                >
                  <Text style={styles.acceptText}>Accept Job</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}

        {/* Active Jobs Section */}
        <Text style={styles.sectionTitle}>Active Jobs ({activeJobs.length})</Text>
        {activeJobs.length === 0 ? (
          <View style={styles.emptyRequests}>
            <Ionicons name="construct-outline" size={32} color="#94A3B8" />
            <Text style={styles.emptyRequestsText}>No active jobs currently assigned.</Text>
          </View>
        ) : (
          activeJobs.map((job) => (
            <View key={job.bookingId} style={[styles.jobCard, styles.activeJobCard]}>
              <View style={styles.jobHeader}>
                <Ionicons name="hammer-outline" size={24} color="#10B981" style={styles.jobIconBg} />
                <View style={styles.jobMeta}>
                  <Text style={styles.jobService}>{job.serviceType}</Text>
                  <Text style={styles.jobLocation}>
                    <Ionicons name="location-outline" size={12} /> {job.location}
                  </Text>
                </View>
                <Text style={styles.jobPrice}>Rs. {job.price || (job as any).providerRate || '0'}</Text>
              </View>
              <Text style={styles.jobTime}>
                Scheduled: {new Date(job.scheduledTime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
              </Text>
              <View style={styles.jobStatusLabel}>
                <Text style={styles.jobStatusText}>Status: EN-ROUTE / DISPATCHED</Text>
              </View>
            </View>
          ))
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderColor: '#F1F5F9',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
  },
  welcomeText: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  logoutButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 40,
  },
  statusCard: {
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
  },
  statusSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  statsPanel: {
    backgroundColor: '#1E293B', // Dark theme dashboard summary
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
    elevation: 4,
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  statBox: {
    alignItems: 'center',
    marginBottom: 16,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 1,
  },
  earningsValue: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 4,
  },
  statsDivider: {
    height: 1,
    backgroundColor: '#334155',
    marginBottom: 16,
  },
  miniStat: {
    flex: 1,
    alignItems: 'center',
  },
  miniStatVal: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  miniStatLabel: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 14,
    marginTop: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  emptyRequests: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyRequestsText: {
    color: '#94A3B8',
    fontSize: 13,
    marginTop: 8,
  },
  jobCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  activeJobCard: {
    borderColor: '#10B981',
  },
  jobHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  jobIconBg: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    textAlign: 'center',
    lineHeight: 44,
  },
  jobMeta: {
    flex: 1,
    marginLeft: 12,
  },
  jobService: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
  },
  jobLocation: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  jobPrice: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E293B',
  },
  jobTime: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 12,
    backgroundColor: '#F8FAFC',
    padding: 8,
    borderRadius: 8,
    overflow: 'hidden',
  },
  jobActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  jobBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  declineBtn: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  acceptBtn: {
    backgroundColor: '#5271FF',
  },
  declineText: {
    color: '#64748B',
    fontWeight: '700',
    fontSize: 13,
  },
  acceptText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  jobStatusLabel: {
    marginTop: 12,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  jobStatusText: {
    color: '#10B981',
    fontWeight: '700',
    fontSize: 11,
  },
});
