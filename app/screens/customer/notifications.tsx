import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../../context/AuthContext';
import { Booking } from '../../../agents/types';
import { db } from '../../../firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

type NotificationItem = {
  id: string;
  title: string;
  body: string;
  createdAt: number; // ms
  type: 'accepted' | 'cancelled' | 'pending' | 'completed' | 'info';
};

export default function NotificationsScreen() {
  const { user } = useAuth();
  const router = useRouter();

  const background = '#F8FAFC';
  const surface = '#FFFFFF';
  const border = '#E2E8F0';
  const text = '#0F172A';
  const textSecondary = '#64748B';
  const accent = '#5271FF';

  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unreadIds, setUnreadIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!user) return;
    
    const bookingsRef = collection(db, 'bookings');
    const q = query(bookingsRef, where('customerId', '==', user.uid));

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const bookingsList: Booking[] = [];
      snapshot.forEach(d => {
        const data = d.data() as Booking;
        bookingsList.push({ ...data, bookingId: data.bookingId || d.id });
      });

      const mapped = mapBookingsToNotifications(bookingsList);
      
      setItems(prevItems => {
        // Detect new items by id
        const prevIds = new Set(prevItems.map(i => i.id));
        const newOnes = mapped.filter(m => !prevIds.has(m.id));
        
        loadUnread(mapped.map(m => m.id));

        if (newOnes.length > 0 && prevItems.length > 0) {
          try {
            Notifications.scheduleNotificationAsync({ 
              content: { title: 'KaamConnect', body: 'You have a new booking update', sound: 'default' }, 
              trigger: null 
            });
          } catch { }
        }
        return mapped;
      });
    }, (error) => {
      console.error(error);
    });

    return () => unsubscribe();
  }, [user]);

  const loadUnread = async (ids: string[]) => {
    try {
      const raw = await AsyncStorage.getItem('notif_read_ids');
      const readIds: string[] = raw ? JSON.parse(raw) : [];
      const unread = new Set(ids.filter(id => !readIds.includes(id)));
      setUnreadIds(unread);
    } catch { }
  };

  const sections = useMemo(() => groupByDate(items), [items]);

  const colorForType = (type: NotificationItem['type']) => {
    switch (type) {
      case 'accepted':
      case 'completed':
        return '#10B981';
      case 'cancelled':
        return '#EF4444';
      case 'pending':
        return '#F59E0B';
      default:
        return textSecondary;
    }
  };

  const renderItem = ({ item }: { item: NotificationItem }) => {
    const isUnread = unreadIds.has(item.id);
    return (
      <View>
        <View style={styles.row}>
          <View style={[styles.iconWrap, { backgroundColor: '#F1F5F9' }]}>
            <Ionicons name={iconForType(item.type)} size={20} color={colorForType(item.type)} />
          </View>
          <View style={styles.rowBody}>
            <Text style={[styles.rowTitle, { color: text }]} numberOfLines={1}>{item.title}</Text>
            <Text style={[styles.rowDesc, { color: textSecondary }]} numberOfLines={2}>{item.body}</Text>
          </View>
          <View style={styles.meta}>
            <Text style={[styles.rowTime, { color: textSecondary }]}>{timeAgo(item.createdAt)}</Text>
            {isUnread ? <View style={[styles.unreadDot, { backgroundColor: accent }]} /> : null}
          </View>
        </View>
        <View style={[styles.separator, { backgroundColor: border }]} />
      </View>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: background }} edges={['top']}>
      <View style={styles.container}>
        <View style={[styles.header, { borderBottomColor: border, backgroundColor: surface }]}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={20} color={text} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={[styles.headerTitle, { color: text }]}>Notifications</Text>
          </View>
          <View style={{ width: 36 }} />
        </View>

        <FlatList
          data={sections}
          keyExtractor={(s) => s.title}
          renderItem={({ item: section }) => (
            <View>
              <View style={styles.sectionHeaderRow}>
                <Text style={[styles.sectionHeader, { color: textSecondary }]}>{section.title}</Text>
                {section.unreadCount > 0 ? (
                  <View style={[styles.badge, { backgroundColor: accent }]}>
                    <Text style={{ color: '#fff', fontSize: 10, fontWeight: '800' }}>{section.unreadCount} NEW</Text>
                  </View>
                ) : null}
              </View>
              {section.items.map((n) => (
                <View key={n.id}>{renderItem({ item: n })}</View>
              ))}
            </View>
          )}
          contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 8, paddingBottom: 16 }}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', marginTop: 100 }}>
              <Ionicons name="notifications-off-outline" size={64} color="#CBD5E1" />
              <Text style={{ marginTop: 16, color: textSecondary, fontSize: 16 }}>No notifications yet.</Text>
            </View>
          }
        />
      </View>
    </SafeAreaView>
  );
}

function iconForType(type: NotificationItem['type']) {
  switch (type) {
    case 'accepted':
    case 'completed':
      return 'checkmark-done-outline';
    case 'cancelled':
      return 'close-circle-outline';
    case 'pending':
      return 'time-outline';
    default:
      return 'notifications-outline';
  }
}

function timeAgo(ts: number) {
  const diff = Date.now() - ts;
  const h = Math.floor(diff / (1000 * 60 * 60));
  if (h < 1) return 'now';
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  return `${d}d`;
}

function mapBookingsToNotifications(res: Booking[]): NotificationItem[] {
  const list: NotificationItem[] = [];
  res.forEach(r => {
    const created = new Date(r.createdAt).getTime();
    if (r.status === 'accepted' || r.status === 'assigned') {
      list.push({
        id: `accepted-${r.bookingId}`,
        title: 'Booking Accepted!',
        body: `Your booking with ${r.providerName} for ${r.serviceType} has been accepted.`,
        createdAt: created,
        type: 'accepted'
      });
    } else if (r.status === 'cancelled') {
      list.push({
        id: `cancelled-${r.bookingId}`,
        title: 'Booking Cancelled',
        body: `Your booking with ${r.providerName} was cancelled.`,
        createdAt: created,
        type: 'cancelled'
      });
    } else if (r.status === 'pending') {
      list.push({
        id: `pending-${r.bookingId}`,
        title: 'Booking Pending',
        body: `Your request for ${r.serviceType} is pending provider acceptance.`,
        createdAt: created,
        type: 'pending'
      });
    } else if (r.status === 'completed') {
      list.push({
        id: `completed-${r.bookingId}`,
        title: 'Job Completed',
        body: `Your booking with ${r.providerName} is now marked as completed.`,
        createdAt: created,
        type: 'completed'
      });
    }
  });
  // Sort newest first
  return list.sort((a, b) => b.createdAt - a.createdAt);
}

function groupByDate(items: NotificationItem[]): { title: string; unreadCount: number; items: NotificationItem[] }[] {
  const today = new Date();
  const todayStr = today.toDateString();
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toDateString();
  const todayItems: NotificationItem[] = [];
  const yesterdayItems: NotificationItem[] = [];
  const olderItems: NotificationItem[] = [];
  
  items.forEach(i => {
    const s = new Date(i.createdAt).toDateString();
    if (s === todayStr) todayItems.push(i);
    else if (s === yesterday) yesterdayItems.push(i);
    else olderItems.push(i);
  });
  
  return [
    { title: 'TODAY', unreadCount: 0, items: todayItems },
    { title: 'YESTERDAY', unreadCount: 0, items: yesterdayItems },
    { title: 'EARLIER', unreadCount: 0, items: olderItems },
  ].filter(s => s.items.length > 0);
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 16, 
    paddingVertical: 12, 
    borderBottomWidth: 1 
  },
  backBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#EEF2FF', alignItems: 'center', justifyContent: 'center', zIndex: 1 },
  headerCenter: { position: 'absolute', left: 0, right: 0, alignItems: 'center', pointerEvents: 'none' },
  headerTitle: { fontSize: 16, fontWeight: '800' },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, marginTop: 8 },
  sectionHeader: { fontWeight: '700', fontSize: 12 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  row: { flexDirection: 'row', paddingVertical: 16, alignItems: 'center' },
  iconWrap: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  rowBody: { flex: 1 },
  rowTitle: { fontWeight: '700', fontSize: 15, marginBottom: 4 },
  rowTime: { fontSize: 12 },
  rowDesc: { fontSize: 13, lineHeight: 18 },
  meta: { alignItems: 'flex-end', width: 40 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, marginTop: 8 },
  separator: { height: 1, marginLeft: 62 },
});
