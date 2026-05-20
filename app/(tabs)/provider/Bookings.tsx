import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../../context/AuthContext';
import { Booking } from '../../../agents/types';
import { db } from '../../../firebase';
import { collection, query, where, onSnapshot, updateDoc, doc } from 'firebase/firestore';

export default function ProviderBookingsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [jobs, setJobs] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pending' | 'active' | 'history'>('pending');

  useEffect(() => {
    if (!user) return;
    
    const bookingsRef = collection(db, 'bookings');
    const q = query(bookingsRef, where('providerId', '==', user.uid));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: Booking[] = [];
      snapshot.forEach(d => {
        const data = d.data() as Booking;
        list.push({ ...data, bookingId: data.bookingId || d.id });
      });
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setJobs(list);
      setLoading(false);
    }, (error) => {
      console.error(error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleUpdateStatus = async (bookingId: string, newStatus: Booking['status']) => {
    let title = "Update Status";
    let message = `Are you sure you want to mark this booking as ${newStatus}?`;
    
    if (newStatus === 'accepted') {
      title = "Accept Booking";
      message = "You are about to accept this booking request. Are you sure?";
    } else if (newStatus === 'cancelled') {
      title = "Decline Booking";
      message = "Are you sure you want to decline this booking request?";
    } else if (newStatus === 'completed') {
      title = "Mark Completed";
      message = "Are you sure you have completed this job?";
    }

    Alert.alert(title, message, [
      { text: "No", style: "cancel" },
      { text: "Yes", style: newStatus === 'cancelled' ? "destructive" : "default", onPress: async () => {
        try {
          const ref = doc(db, 'bookings', bookingId);
          const statusToSave = newStatus === 'accepted' ? 'assigned' : newStatus;
          await updateDoc(ref, { status: statusToSave });
        } catch (e) {
          console.error(e);
        }
      }}
    ]);
  };

  const getStatusColor = (status: Booking['status']) => {
    switch (status) {
      case 'completed': return '#10B981';
      case 'accepted':
      case 'assigned': return '#10B981';
      case 'cancelled': return '#EF4444';
      default: return '#F59E0B'; // pending
    }
  };

  const getStatusText = (status: Booking['status']) => {
    switch (status) {
      case 'accepted': return 'Accepted';
      case 'assigned': return 'Active';
      case 'completed': return 'Completed';
      case 'cancelled': return 'Cancelled';
      default: return 'Pending';
    }
  };

  const pendingJobs = useMemo(() => jobs.filter(b => b.status === 'pending'), [jobs]);
  const activeJobs = useMemo(() => jobs.filter(b => b.status === 'accepted' || b.status === 'assigned'), [jobs]);
  const historyJobs = useMemo(() => jobs.filter(b => b.status === 'cancelled' || b.status === 'completed'), [jobs]);

  const activeData = activeTab === 'pending' ? pendingJobs : activeTab === 'active' ? activeJobs : historyJobs;

  const renderJobItem = ({ item }: { item: Booking }) => {
    const isPending = item.status === 'pending';
    const isActive = item.status === 'accepted' || item.status === 'assigned';
    const isCompletedOrCancelled = item.status === 'completed' || item.status === 'cancelled';

    // Format Date & Time with grace fallbacks
    let displayDate = (item as any).date || '';
    let displayTime = (item as any).time || '';
    if (item.scheduledTime) {
      const d = new Date(item.scheduledTime);
      if (!isNaN(d.getTime())) {
        displayDate = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
        displayTime = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }
    }

    // Format Price with grace fallbacks
    const displayPrice = item.price ? `Rs. ${item.price}` : ((item as any).providerRate ? `Rs. ${(item as any).providerRate}` : 'Negotiable');

    // Get location
    const displayLocation = item.location || (item as any).address || 'No location set';

    return (
      <View style={[styles.card, isCompletedOrCancelled && { opacity: 0.85 }]}>
        {/* Card Header: Service Type & Price */}
        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.serviceType}>{item.serviceType || (item as any).providerCategory || 'General Service'}</Text>
            <Text style={styles.bookingId}>ID: {item.bookingId}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.price}>{displayPrice}</Text>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '15' }]}>
              <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>{getStatusText(item.status).toUpperCase()}</Text>
            </View>
          </View>
        </View>

        {/* Customer Details Block */}
        <View style={styles.detailsBlock}>
          {/* Customer Name */}
          <View style={styles.detailRow}>
            <Ionicons name="person-outline" size={16} color="#64748B" style={styles.detailIcon} />
            <View>
              <Text style={styles.detailLabel}>Customer</Text>
              <Text style={styles.detailValue}>{item.customerName || 'Client'}</Text>
            </View>
          </View>

          {/* Customer Phone (Only show if present/accessible) */}
          {(item as any).customerPhone ? (
            <View style={styles.detailRow}>
              <Ionicons name="call-outline" size={16} color="#64748B" style={styles.detailIcon} />
              <View>
                <Text style={styles.detailLabel}>Contact Phone</Text>
                <Text style={styles.detailValue}>{(item as any).customerPhone}</Text>
              </View>
            </View>
          ) : null}

          {/* Date & Time */}
          <View style={styles.detailRow}>
            <Ionicons name="calendar-outline" size={16} color="#64748B" style={styles.detailIcon} />
            <View>
              <Text style={styles.detailLabel}>Schedule</Text>
              <Text style={styles.detailValue}>{displayDate} {displayTime ? `at ${displayTime}` : ''}</Text>
            </View>
          </View>

          {/* Address/Location */}
          <View style={styles.detailRow}>
            <Ionicons name="location-outline" size={16} color="#64748B" style={styles.detailIcon} />
            <View style={{ flex: 1 }}>
              <Text style={styles.detailLabel}>Address</Text>
              <Text style={styles.detailValue} numberOfLines={2}>{displayLocation}</Text>
            </View>
          </View>
        </View>

        {/* Job Description (If available) */}
        {(item as any).description ? (
          <View style={styles.descriptionContainer}>
            <Text style={styles.descriptionLabel}>Task Details:</Text>
            <Text style={styles.descriptionText}>"{(item as any).description}"</Text>
          </View>
        ) : null}

        {/* Action Buttons */}
        <View style={styles.cardFooter}>
          {isPending && (
            <>
              <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#FEE2E2' }]} onPress={() => handleUpdateStatus(item.bookingId, 'cancelled')}>
                <Text style={[styles.actionBtnText, { color: '#EF4444' }]}>Decline</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.primaryBtn} onPress={() => handleUpdateStatus(item.bookingId, 'accepted')}>
                <Text style={styles.primaryBtnText}>Accept Job</Text>
              </TouchableOpacity>
            </>
          )}

          {isActive && (
            <View style={{ width: '100%', gap: 10 }}>
              <TouchableOpacity 
                style={[styles.actionBtn, { backgroundColor: '#EEF2FF', width: '100%', flexDirection: 'row' }]} 
                onPress={() => router.push('/(tabs)/provider/Chats')}
              >
                <Ionicons name="chatbubble-outline" size={18} color="#5271FF" style={{ marginRight: 8 }} />
                <Text style={[styles.actionBtnText, { color: '#5271FF' }]}>Chat with Customer</Text>
              </TouchableOpacity>
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#F1F5F9' }]} onPress={() => handleUpdateStatus(item.bookingId, 'cancelled')}>
                  <Text style={[styles.actionBtnText, { color: '#0F172A' }]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: '#10B981' }]} onPress={() => handleUpdateStatus(item.bookingId, 'completed')}>
                  <Text style={styles.primaryBtnText}>Mark Completed</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {isCompletedOrCancelled && (
            <View style={[styles.completedBanner, { backgroundColor: item.status === 'completed' ? '#ECFDF5' : '#FEF2F2' }]}>
              <Ionicons 
                name={item.status === 'completed' ? "checkmark-circle-outline" : "close-circle-outline"} 
                size={16} 
                color={item.status === 'completed' ? '#10B981' : '#EF4444'} 
              />
              <Text style={[styles.completedBannerText, { color: item.status === 'completed' ? '#047857' : '#B91C1C' }]}>
                {item.status === 'completed' ? 'This job has been completed successfully.' : 'This job was cancelled.'}
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <TouchableOpacity style={styles.circularBtn} onPress={() => router.replace('/(tabs)/provider/Dashboard')}>
          <Ionicons name="chevron-back" size={20} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Jobs</Text>
        <View style={{ width: 42 }} />
      </View>

      <View style={styles.tabsRow}>
        <TouchableOpacity onPress={() => setActiveTab('pending')} style={styles.tabButton}>
          <Text style={[styles.tabText, activeTab === 'pending' && styles.tabActiveText]}>Requests</Text>
          {activeTab === 'pending' && <View style={styles.tabIndicator} />}
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setActiveTab('active')} style={styles.tabButton}>
          <Text style={[styles.tabText, activeTab === 'active' && styles.tabActiveText]}>Active</Text>
          {activeTab === 'active' && <View style={styles.tabIndicator} />}
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setActiveTab('history')} style={styles.tabButton}>
          <Text style={[styles.tabText, activeTab === 'history' && styles.tabActiveText]}>History</Text>
          {activeTab === 'history' && <View style={styles.tabIndicator} />}
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#5271FF" />
        </View>
      ) : (
        <FlatList
          data={activeData}
          renderItem={renderJobItem}
          keyExtractor={(item, index) => item.bookingId ? item.bookingId.toString() : String(index)}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="hammer-outline" size={48} color="#94A3B8" />
              <Text style={styles.emptyText}>No jobs in this section.</Text>
            </View>
          }
        />
      )}
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
  },
  circularBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  tabsRow: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingHorizontal: 16,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  tabActiveText: {
    color: '#5271FF',
    fontWeight: '700',
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    width: '60%',
    height: 3,
    backgroundColor: '#5271FF',
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 12,
    marginBottom: 14,
  },
  serviceType: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E293B',
  },
  bookingId: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  price: {
    fontSize: 17,
    fontWeight: '800',
    color: '#10B981',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 4,
  },
  statusText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  detailsBlock: {
    gap: 12,
    marginBottom: 14,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailIcon: {
    marginRight: 12,
    width: 20,
  },
  detailLabel: {
    fontSize: 11,
    color: '#94A3B8',
    textTransform: 'uppercase',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
    marginTop: 1,
  },
  descriptionContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    marginBottom: 16,
  },
  descriptionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 4,
  },
  descriptionText: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 18,
    fontStyle: 'italic',
  },
  cardFooter: {
    flexDirection: 'row',
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 14,
  },
  actionBtn: {
    flex: 1,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnText: {
    fontWeight: '700',
    fontSize: 14,
  },
  primaryBtn: {
    flex: 1,
    height: 46,
    borderRadius: 14,
    backgroundColor: '#5271FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  completedBanner: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    gap: 6,
  },
  completedBannerText: {
    fontSize: 12,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 40,
  },
  emptyText: {
    color: '#64748B',
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 20,
  },
});
