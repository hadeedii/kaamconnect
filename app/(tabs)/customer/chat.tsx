import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { db } from '../../../firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { useAuth } from '../../../context/AuthContext';

interface LiveCustomerMessageThread {
  id: string;
  customerId: string;
  customerName: string;
  customerAvatar: string;
  providerId: string;
  providerName: string;
  providerAvatar: string;
  lastMessage: string;
  time: any;
  unreadByCustomer: boolean;
}

export default function CustomerInboxScreen() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth(); // Logged-in customer

  const [threads, setThreads] = useState<LiveCustomerMessageThread[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    const conversationsRef = collection(db, 'conversations');
    const q = query(
      conversationsRef,
      where('customerId', '==', user.uid)
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const fetched: LiveCustomerMessageThread[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as LiveCustomerMessageThread[];

      // Sort by time descending in JS to completely bypass Firestore composite index requirements!
      fetched.sort((a, b) => {
        const timeA = a.time?.toDate?.() ? a.time.toDate().getTime() : (a.time ? new Date(a.time).getTime() : 0);
        const timeB = b.time?.toDate?.() ? b.time.toDate().getTime() : (b.time ? new Date(b.time).getTime() : 0);
        return timeB - timeA;
      });

      setThreads(fetched);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching customer conversations:", error);
      setLoading(false);
    });

    return () => unsub();
  }, [user?.uid, authLoading]);

  const renderItem = ({ item }: { item: LiveCustomerMessageThread }) => {
    // Format timestamp
    const updatedDate = item.time?.toDate?.() || (item.time ? new Date(item.time) : null);
    const timeText = updatedDate 
      ? updatedDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
      : '';

    return (
      <TouchableOpacity 
        style={[styles.threadCard, item.unreadByCustomer && styles.threadCardUnread]} 
        activeOpacity={0.7}
        onPress={() => {
          router.push({
            pathname: '/screens/customer/chat' as any,
            params: { providerId: item.providerId }
          });
        }}
      >
        {item.providerAvatar ? (
          <Image source={{ uri: item.providerAvatar }} style={styles.avatar} />
        ) : (
          <View style={styles.initialsAvatar}>
            <Text style={styles.initialsText}>
              {item.providerName ? item.providerName.charAt(0).toUpperCase() : 'P'}
            </Text>
          </View>
        )}
        
        <View style={styles.content}>
          <View style={styles.headerRow}>
            <Text style={styles.name}>{item.providerName || 'KaamConnect Specialist'}</Text>
            <Text style={[styles.time, item.unreadByCustomer && styles.unreadText]}>{timeText}</Text>
          </View>
          <Text style={[styles.message, item.unreadByCustomer && styles.unreadMessage]} numberOfLines={1}>
            {item.lastMessage || 'Tap to start secure chat...'}
          </Text>
        </View>
        
        {item.unreadByCustomer && <View style={styles.unreadDot} />}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <TouchableOpacity style={styles.circularBtn} onPress={() => router.replace('/(tabs)/customer/home')}>
          <Ionicons name="chevron-back" size={20} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Conversations</Text>
        <View style={{ width: 42 }} />
      </View>

      {(loading || authLoading) ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#5271FF" />
          <Text style={styles.loadingText}>Loading inbox messages...</Text>
        </View>
      ) : (
        <FlatList
          data={threads}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="chatbubble-ellipses-outline" size={54} color="#94A3B8" />
              <Text style={styles.emptyTitle}>Your Inbox is empty</Text>
              <Text style={styles.emptySubtitle}>
                Initiate conversations directly from any verified professional service page to receive instant help!
              </Text>
              <TouchableOpacity 
                style={styles.findBtn} 
                onPress={() => router.push('/screens/customer/all_providers' as any)}
              >
                <Text style={styles.findBtnText}>Discover Verified Partners</Text>
                <Ionicons name="arrow-forward" size={16} color="#FFFFFF" style={{ marginLeft: 6 }} />
              </TouchableOpacity>
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
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
    marginTop: 10,
  },
  listContent: {
    padding: 16,
    paddingBottom: 100, // Safe padding for bottom custom tabbar
  },
  threadCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  threadCardUnread: {
    borderColor: '#5271FF',
    backgroundColor: '#FDFEFE',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F1F5F9',
  },
  initialsAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  initialsText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#5271FF',
  },
  content: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  name: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1E293B',
  },
  time: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500',
  },
  unreadText: {
    color: '#5271FF',
    fontWeight: '700',
  },
  message: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 4,
    fontWeight: '500',
  },
  unreadMessage: {
    color: '#1E293B',
    fontWeight: '700',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#5271FF',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 100,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1E293B',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 8,
    marginBottom: 24,
    fontWeight: '500',
  },
  findBtn: {
    backgroundColor: '#5271FF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#5271FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  findBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
});
