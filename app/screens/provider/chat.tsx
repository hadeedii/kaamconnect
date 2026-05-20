import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  TextInput, 
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Linking
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { db } from '../../../firebase';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  doc, 
  getDoc, 
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { useAuth } from '../../../context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface ChatMessageItem {
  id: string;
  senderId: string;
  senderType: 'customer' | 'provider';
  text: string;
  createdAt?: any;
  seen?: boolean;
}

export default function ProviderChatScreen() {
  const router = useRouter();
  const { user } = useAuth(); // Logged-in provider
  const { customerId } = useLocalSearchParams<{ customerId: string }>();

  const [customerProfile, setCustomerProfile] = useState<any>(null);
  const [messages, setMessages] = useState<ChatMessageItem[]>([]);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  
  const scrollRef = useRef<ScrollView>(null);

  // Generate a unique, predictable conversationId between this customer & provider
  const conversationId = useMemo(() => {
    if (!user || !customerId) return null;
    return `${customerId}_${user.uid}`;
  }, [user?.uid, customerId]);

  // 1. Fetch customer details
  useEffect(() => {
    if (!customerId) return;
    const fetchCustomer = async () => {
      try {
        const docRef = doc(db, 'users', customerId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setCustomerProfile(docSnap.data());
        }
      } catch (error) {
        console.error("Error fetching customer profile for chat:", error);
      }
    };
    fetchCustomer();
  }, [customerId]);

  // 2. Subscribe to messages real-time
  useEffect(() => {
    if (!conversationId) return;
    // Load cached messages first for instant UI
    (async () => {
      try {
        const cached = await AsyncStorage.getItem(`messages:${conversationId}`);
        if (cached) setMessages(JSON.parse(cached));
      } catch {}
      setLoading(false);
    })();

    const messagesRef = collection(db, 'conversations', conversationId, 'messages');
    const q = query(messagesRef, orderBy('createdAt', 'asc'));
    
    const unsub = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ChatMessageItem[];
      
      setMessages(msgs);
      setLoading(false);

      // Mark messages as read by provider
      const convRef = doc(db, 'conversations', conversationId);
      updateDoc(convRef, { unreadByProvider: false }).catch(() => {});
      
      // Persist to cache
      (async () => { 
        try { 
          await AsyncStorage.setItem(`messages:${conversationId}`, JSON.stringify(msgs)); 
        } catch {} 
      })();
    }, (error) => {
      console.error("Error subscribing to messages:", error);
      setLoading(false);
    });

    return () => unsub();
  }, [conversationId]);

  // 3. Auto scroll to bottom
  useEffect(() => {
    setTimeout(() => {
      try { scrollRef.current?.scrollToEnd({ animated: true }); } catch {}
    }, 100);
  }, [messages]);

  // 4. Send a new message
  const handleSend = async () => {
    const text = messageText.trim();
    if (!text || !conversationId || !user || !customerId || !customerProfile) return;

    setMessageText('');

    // Optimistic UI update
    const localId = `local-${Date.now()}`;
    const optimisticMessage: ChatMessageItem = {
      id: localId,
      senderId: user.uid,
      senderType: 'provider',
      text,
      createdAt: { toDate: () => new Date() } // Simulate firestore timestamp
    };
    
    setMessages(prev => [...prev, optimisticMessage]);

    try {
      // Ensure conversation metadata exists or gets updated
      const convRef = doc(db, 'conversations', conversationId);
      await setDoc(convRef, {
        id: conversationId,
        customerId: customerId,
        customerName: customerProfile.name,
        customerAvatar: customerProfile.profilePicture || '',
        providerId: user.uid,
        providerName: user.name,
        providerAvatar: user.profilePicture || '',
        lastMessage: text,
        time: serverTimestamp(),
        unreadByCustomer: true,
        unreadByProvider: false
      }, { merge: true });

      // Add actual message document to subcollection
      const messagesRef = collection(db, 'conversations', conversationId, 'messages');
      await addDoc(messagesRef, {
        senderId: user.uid,
        senderType: 'provider',
        text,
        createdAt: serverTimestamp(),
        seen: false
      });
    } catch (error) {
      console.error("Error sending message:", error);
      Alert.alert('Send Failed', 'Could not transmit message. Please verify network connection.');
    }
  };

  // Edit/Delete features as specified in user reference code
  const [optionsFor, setOptionsFor] = useState<string | null>(null);
  const [editMessageId, setEditMessageId] = useState<string | null>(null);
  const [editText, setEditText] = useState<string>('');

  const onLongPressMessage = (m: ChatMessageItem) => {
    if (m.senderType !== 'provider') return; // Only allow own provider messages
    setOptionsFor(m.id);
    setEditMessageId(null);
    setEditText('');
  };

  const startEdit = (m: ChatMessageItem) => {
    setEditMessageId(m.id);
    setEditText(m.text);
    setOptionsFor(null);
  };

  const confirmEdit = async () => {
    if (!conversationId || !editMessageId) return;
    const newTxt = editText.trim();
    if (!newTxt) return;

    // Optimistic state update
    setMessages(prev => prev.map(m => m.id === editMessageId ? { ...m, text: newTxt } : m));
    setEditMessageId(null);
    setEditText('');

    try {
      const msgRef = doc(db, 'conversations', conversationId, 'messages', editMessageId);
      await updateDoc(msgRef, { text: newTxt });
      
      // Update parent lastMessage if this was the last message
      if (messages[messages.length - 1]?.id === editMessageId) {
        await updateDoc(doc(db, 'conversations', conversationId), {
          lastMessage: newTxt
        });
      }
    } catch (error) {
      console.error("Error editing message:", error);
    }
  };

  const deleteMessage = async (m: ChatMessageItem) => {
    if (!conversationId) return;
    setOptionsFor(null);

    // Optimistic delete
    setMessages(prev => prev.filter(msg => msg.id !== m.id));

    try {
      const msgRef = doc(db, 'conversations', conversationId, 'messages', m.id);
      await deleteDoc(msgRef);

      // Recalculate parent lastMessage if this was the deleted message
      if (messages[messages.length - 1]?.id === m.id) {
        const remaining = messages.filter(msg => msg.id !== m.id);
        const newLast = remaining[remaining.length - 1]?.text || 'Message deleted';
        await updateDoc(doc(db, 'conversations', conversationId), {
          lastMessage: newLast
        });
      }
    } catch (error) {
      console.error("Error deleting message:", error);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar style="dark" />

      {/* Top Profile Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        
        <View style={styles.headerProfile}>
          {customerProfile?.profilePicture ? (
            <Image source={{ uri: customerProfile.profilePicture }} style={styles.avatar} />
          ) : (
            <View style={styles.initialsAvatar}>
              <Text style={styles.initialsText}>
                {customerProfile?.name ? customerProfile.name.charAt(0).toUpperCase() : 'C'}
              </Text>
            </View>
          )}
          <View style={styles.headerText}>
            <Text style={styles.providerName} numberOfLines={1}>
              {customerProfile?.name || 'Loading Customer...'}
            </Text>
            <Text style={styles.providerCategory}>
              Service Client
            </Text>
          </View>
        </View>

        <TouchableOpacity 
          style={styles.headerActionBtn} 
          onPress={() => customerProfile?.phone && Linking.openURL(`tel:${customerProfile.phone}`)}
        >
          <Ionicons name="call-outline" size={20} color="#5271FF" />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Messages Body */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#5271FF" />
            <Text style={styles.loadingText}>Initializing secure chat thread...</Text>
          </View>
        ) : (
          <TouchableOpacity 
            style={{ flex: 1 }} 
            activeOpacity={1} 
            onPress={() => setOptionsFor(null)}
          >
            <ScrollView 
              ref={scrollRef} 
              contentContainerStyle={styles.scrollContent} 
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {messages.map((m, idx) => {
                const isOwn = m.senderType === 'provider';
                
                // Get timestamp format
                const createdDate = m.createdAt?.toDate?.() || (m.createdAt ? new Date(m.createdAt) : null);
                const timeString = createdDate ? createdDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

                return (
                  <View 
                    key={m.id} 
                    style={[
                      styles.messageRow, 
                      isOwn ? styles.messageRowOwn : styles.messageRowOther
                    ]}
                  >
                    <View style={styles.bubbleWrapper}>
                      <TouchableOpacity 
                        onLongPress={() => onLongPressMessage(m)} 
                        delayLongPress={250} 
                        activeOpacity={0.9}
                      >
                        <View 
                          style={[
                            styles.bubble, 
                            isOwn ? styles.bubbleOwn : styles.bubbleOther
                          ]}
                        >
                          <Text style={[styles.messageText, isOwn ? styles.textOwn : styles.textOther]}>
                            {m.text}
                          </Text>
                        </View>
                      </TouchableOpacity>

                      {/* Edit/Delete overlay */}
                      {optionsFor === m.id && (
                        <View style={[styles.optionsMenu, isOwn ? styles.optionsMenuOwn : styles.optionsMenuOther]}>
                          <TouchableOpacity style={styles.optionBtn} onPress={() => startEdit(m)}>
                            <Text style={styles.optionBtnText}>Edit</Text>
                          </TouchableOpacity>
                          <TouchableOpacity style={[styles.optionBtn, styles.optionBtnDel]} onPress={() => deleteMessage(m)}>
                            <Text style={styles.optionBtnTextDel}>Delete</Text>
                          </TouchableOpacity>
                        </View>
                      )}

                      <Text style={[styles.timeText, isOwn ? styles.timeOwn : styles.timeOther]}>
                        {timeString}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </ScrollView>
          </TouchableOpacity>
        )}

        {/* Composer / Input Area */}
        {editMessageId ? (
          <View style={styles.editBar}>
            <TextInput 
              value={editText} 
              onChangeText={setEditText} 
              style={styles.editInput} 
            />
            <TouchableOpacity onPress={confirmEdit} style={styles.saveEditBtn}>
              <Text style={styles.saveEditText}>Save</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { setEditMessageId(null); setEditText(''); }} style={styles.cancelEditBtn}>
              <Text style={styles.cancelEditText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        <View style={styles.composer}>
          <TextInput
            value={messageText}
            onChangeText={setMessageText}
            placeholder="Type a message..."
            placeholderTextColor="#94A3B8"
            style={styles.input}
            multiline
          />
          <TouchableOpacity 
            style={[styles.sendBtn, !messageText.trim() && styles.sendBtnDisabled]} 
            onPress={handleSend}
            disabled={!messageText.trim()}
          >
            <Ionicons name="paper-plane" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderColor: '#E2E8F0',
  },
  backBtn: {
    padding: 4,
    marginRight: 8,
  },
  headerProfile: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  initialsAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  initialsText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#5271FF',
  },
  headerText: {
    flex: 1,
  },
  providerName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  providerCategory: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
    marginTop: 2,
  },
  headerActionBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
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
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 16,
  },
  messageRow: {
    flexDirection: 'row',
    width: '100%',
  },
  messageRowOwn: {
    justifyContent: 'flex-end',
  },
  messageRowOther: {
    justifyContent: 'flex-start',
  },
  bubbleWrapper: {
    maxWidth: '80%',
    position: 'relative',
  },
  bubble: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    elevation: 1,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 2,
  },
  bubbleOwn: {
    backgroundColor: '#5271FF',
    borderTopRightRadius: 4,
  },
  bubbleOther: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderTopLeftRadius: 4,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },
  textOwn: {
    color: '#FFFFFF',
  },
  textOther: {
    color: '#1E293B',
  },
  timeText: {
    fontSize: 9,
    color: '#94A3B8',
    marginTop: 4,
    fontWeight: '600',
  },
  timeOwn: {
    textAlign: 'right',
    marginRight: 4,
  },
  timeOther: {
    textAlign: 'left',
    marginLeft: 4,
  },
  composer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderColor: '#E2E8F0',
    gap: 10,
  },
  input: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    color: '#1E293B',
    maxHeight: 100,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#5271FF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#5271FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  sendBtnDisabled: {
    backgroundColor: '#94A3B8',
    shadowOpacity: 0,
    elevation: 0,
  },
  optionsMenu: {
    position: 'absolute',
    top: -45,
    flexDirection: 'row',
    gap: 6,
    backgroundColor: '#FFFFFF',
    padding: 4,
    borderRadius: 10,
    elevation: 4,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    zIndex: 99,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  optionsMenuOwn: {
    right: 0,
  },
  optionsMenuOther: {
    left: 0,
  },
  optionBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#F8FAFC',
  },
  optionBtnDel: {
    backgroundColor: '#FEE2E2',
  },
  optionBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  optionBtnTextDel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#EF4444',
  },
  editBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFBEB',
    alignItems: 'center',
    gap: 8,
  },
  editInput: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FCD34D',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: '#1E293B',
  },
  saveEditBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#5271FF',
    borderRadius: 10,
  },
  saveEditText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  cancelEditBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
  },
  cancelEditText: {
    color: '#475569',
    fontSize: 12,
    fontWeight: '600',
  },
});
