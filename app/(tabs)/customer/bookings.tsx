import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, RefreshControl, ActivityIndicator, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../../context/AuthContext';
import { Booking } from '../../../agents/types';
import { db } from '../../../firebase';
import { collection, query, where, onSnapshot, updateDoc, doc } from 'firebase/firestore';

export default function BookingsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pending' | 'accepted' | 'cancelled'>('pending');

  useEffect(() => {
    if (!user) return;
    
    const bookingsRef = collection(db, 'bookings');
    const q = query(bookingsRef, where('customerId', '==', user.uid));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: Booking[] = [];
      snapshot.forEach(d => {
        const data = d.data() as Booking;
        list.push({ ...data, bookingId: data.bookingId || d.id });
      });
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setBookings(list);
      setLoading(false);
    }, (error) => {
      console.error(error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleSimulateComplete = async (bookingId: string) => {
    try {
      const ref = doc(db, 'bookings', bookingId);
      await updateDoc(ref, { status: 'completed' });
    } catch (e) {
      console.error(e);
    }
  };

  const handleSimulateAccept = async (bookingId: string) => {
    try {
      const ref = doc(db, 'bookings', bookingId);
      await updateDoc(ref, { status: 'accepted' });
    } catch (e) {
      console.error(e);
    }
  };

  const handleCancel = async (bookingId: string) => {
    Alert.alert("Cancel Booking", "Are you sure you want to cancel this booking?", [
      { text: "No", style: "cancel" },
      { text: "Yes", style: "destructive", onPress: async () => {
        try {
          const ref = doc(db, 'bookings', bookingId);
          await updateDoc(ref, { status: 'cancelled' });
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
      case 'assigned': return 'Assigned';
      case 'completed': return 'Completed';
      case 'cancelled': return 'Cancelled';
      default: return 'Pending';
    }
  };

  const pendingBookings = useMemo(() => bookings.filter(b => b.status === 'pending'), [bookings]);
  const acceptedBookings = useMemo(() => bookings.filter(b => b.status === 'accepted' || b.status === 'assigned'), [bookings]);
  const cancelledBookings = useMemo(() => bookings.filter(b => b.status === 'cancelled' || b.status === 'completed'), [bookings]);

  const activeData = activeTab === 'pending' ? pendingBookings : activeTab === 'accepted' ? acceptedBookings : cancelledBookings;

  const renderBookingItem = ({ item }: { item: Booking }) => {
    const isCompleted = item.status === 'completed';
    const isCancelled = item.status === 'cancelled';
    const isPending = item.status === 'pending';
    const isAccepted = item.status === 'accepted' || item.status === 'assigned';

    return (
      <View style={[styles.card, (isCancelled || isCompleted) && { opacity: 0.8 }]}>
        <View style={styles.cardHeader}>
          <Image source={{ uri: item.providerImage }} style={styles.avatar} />
          <View style={styles.info}>
            <Text style={styles.providerName}>{item.providerName}</Text>
            <Text style={styles.serviceType}>{item.serviceType}</Text>
            <Text style={styles.scheduledTime}>
              <Ionicons name="calendar-outline" size={12} /> {new Date(item.scheduledTime).toLocaleDateString()} at {new Date(item.scheduledTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
          <View style={styles.priceCol}>
            <Text style={styles.price}>Rs. {item.price}</Text>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '15' }]}>
              <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>{getStatusText(item.status)}</Text>
            </View>
          </View>
        </View>

        <View style={styles.cardFooter}>
          {isPending && (
            <>
              <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#F1F5F9' }]} onPress={() => handleCancel(item.bookingId)}>
                <Text style={[styles.actionBtnText, { color: '#0F172A' }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.primaryBtn} onPress={() => handleSimulateAccept(item.bookingId)}>
                <Text style={styles.primaryBtnText}>Simulate Accept</Text>
              </TouchableOpacity>
            </>
          )}

          {isAccepted && (
            <>
              <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#F1F5F9' }]} onPress={() => handleCancel(item.bookingId)}>
                <Text style={[styles.actionBtnText, { color: '#0F172A' }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: '#10B981' }]} onPress={() => handleSimulateComplete(item.bookingId)}>
                <Text style={styles.primaryBtnText}>Simulate Job Done</Text>
              </TouchableOpacity>
            </>
          )}

          {(isCompleted || isCancelled) && (
            <TouchableOpacity style={[styles.actionBtn, { flex: 1, backgroundColor: '#F1F5F9' }]} onPress={() => router.push(`/(tabs)/customer/home`)}>
              <Text style={[styles.actionBtnText, { color: '#0F172A' }]}>View Provider Again</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <TouchableOpacity style={styles.circularBtn} onPress={() => router.replace('/(tabs)/customer/home')}>
          <Ionicons name="chevron-back" size={20} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Bookings</Text>
        <View style={{ width: 42 }} />
      </View>

      <View style={styles.tabsRow}>
        <TouchableOpacity onPress={() => setActiveTab('pending')} style={styles.tabButton}>
          <Text style={[styles.tabText, activeTab === 'pending' && styles.tabActiveText]}>Pending</Text>
          {activeTab === 'pending' && <View style={styles.tabIndicator} />}
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setActiveTab('accepted')} style={styles.tabButton}>
          <Text style={[styles.tabText, activeTab === 'accepted' && styles.tabActiveText]}>Accepted</Text>
          {activeTab === 'accepted' && <View style={styles.tabIndicator} />}
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setActiveTab('cancelled')} style={styles.tabButton}>
          <Text style={[styles.tabText, activeTab === 'cancelled' && styles.tabActiveText]}>History</Text>
          {activeTab === 'cancelled' && <View style={styles.tabIndicator} />}
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#5271FF" />
        </View>
      ) : (
        <FlatList
          data={activeData}
          renderItem={renderBookingItem}
          keyExtractor={(item, index) => item.bookingId ? item.bookingId.toString() : String(index)}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="receipt-outline" size={48} color="#94A3B8" />
              <Text style={styles.emptyText}>No bookings in this section.</Text>
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
    paddingBottom: 100, // Account for bottom tab bar
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F1F5F9',
  },
  info: {
    flex: 1,
    marginLeft: 12,
  },
  providerName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
  },
  serviceType: {
    fontSize: 13,
    color: '#5271FF',
    fontWeight: '600',
    marginTop: 2,
  },
  scheduledTime: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 4,
  },
  priceCol: {
    alignItems: 'flex-end',
  },
  price: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 6,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
  },
  cardFooter: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 12,
  },
  actionBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnText: {
    fontWeight: '700',
    fontSize: 14,
  },
  primaryBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#5271FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
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
