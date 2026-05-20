import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, TextInput, Alert, ScrollView, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../../context/AuthContext';
import { useRouter } from 'expo-router';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, signOut } = useAuth();

  // Modal visibility states
  const [personalModalVisible, setPersonalModalVisible] = useState(false);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [notifModalVisible, setNotifModalVisible] = useState(false);
  const [securityModalVisible, setSecurityModalVisible] = useState(false);

  // Edit Personal Info State
  const [name, setName] = useState(user?.name || 'User Name');
  const [email, setEmail] = useState(user?.email || 'email@kaamconnect.com');
  const [phone, setPhone] = useState(user?.phone || '+92 300 1234567');

  // Payment Methods State
  const [cards, setCards] = useState([
    { id: '1', brand: 'Visa', last4: '4242', isDefault: true },
    { id: '2', brand: 'Mastercard', last4: '8888', isDefault: false }
  ]);
  const [newCardNumber, setNewCardNumber] = useState('');

  // Notification Preferences State
  const [pushEnabled, setPushEnabled] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [smsEnabled, setSmsEnabled] = useState(false);

  // Security States
  const [biometricEnabled, setBiometricEnabled] = useState(true);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);

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

  const handleSavePersonalInfo = () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Name cannot be empty.');
      return;
    }
    // Update Auth State if possible or simulate success
    Alert.alert('Success', 'Personal information updated successfully!');
    setPersonalModalVisible(false);
  };

  const handleAddCard = () => {
    if (newCardNumber.length < 16) {
      Alert.alert('Error', 'Please enter a valid 16-digit card number.');
      return;
    }
    const newCard = {
      id: String(Date.now()),
      brand: 'Visa',
      last4: newCardNumber.slice(-4),
      isDefault: cards.length === 0
    };
    setCards([...cards, newCard]);
    setNewCardNumber('');
    Alert.alert('Success', 'Payment method added!');
  };

  const handleSetDefaultCard = (id: string) => {
    setCards(cards.map(c => ({
      ...c,
      isDefault: c.id === id
    })));
  };

  const handleDeleteCard = (id: string) => {
    setCards(cards.filter(c => c.id !== id));
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar style="dark" />
      
      <View style={styles.header}>
        <TouchableOpacity style={styles.circularBtn} onPress={() => router.replace('/(tabs)/customer/home')}>
          <Ionicons name="chevron-back" size={20} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Profile</Text>
        <View style={{ width: 42 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarBg}>
            <Text style={styles.avatarInitials}>
              {name ? name.split(' ').map(n => n[0]).join('').toUpperCase() : 'KC'}
            </Text>
          </View>
          <Text style={styles.userName}>{name}</Text>
          <Text style={styles.userEmail}>{email}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>{user?.role?.toUpperCase() || 'CUSTOMER'}</Text>
          </View>
        </View>

        {/* Options */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.optionRow} onPress={() => setPersonalModalVisible(true)}>
            <Ionicons name="person-outline" size={20} color="#5271FF" style={styles.optionIcon} />
            <Text style={styles.optionText}>Edit Personal Info</Text>
            <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.optionRow} onPress={() => setPaymentModalVisible(true)}>
            <Ionicons name="card-outline" size={20} color="#5271FF" style={styles.optionIcon} />
            <Text style={styles.optionText}>Payment Methods</Text>
            <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.optionRow} onPress={() => setNotifModalVisible(true)}>
            <Ionicons name="notifications-outline" size={20} color="#5271FF" style={styles.optionIcon} />
            <Text style={styles.optionText}>Notification Preferences</Text>
            <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.optionRow} onPress={() => setSecurityModalVisible(true)}>
            <Ionicons name="shield-checkmark-outline" size={20} color="#5271FF" style={styles.optionIcon} />
            <Text style={styles.optionText}>Security & Privacy</Text>
            <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
          </TouchableOpacity>
        </View>

        {/* Sign Out */}
        <View style={[styles.section, { marginTop: 16, marginBottom: 40 }]}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleSignOut}>
            <Ionicons name="log-out-outline" size={20} color="#EF4444" style={styles.optionIcon} />
            <Text style={styles.logoutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* --- MODALS --- */}

      {/* Edit Personal Info Modal */}
      <Modal visible={personalModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Personal Information</Text>
              <TouchableOpacity onPress={() => setPersonalModalVisible(false)}>
                <Ionicons name="close" size={24} color="#1E293B" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.inputLabel}>Full Name</Text>
              <TextInput 
                style={styles.textInput} 
                value={name} 
                onChangeText={setName} 
                placeholder="Enter full name"
              />

              <Text style={styles.inputLabel}>Email Address</Text>
              <TextInput 
                style={styles.textInput} 
                value={email} 
                onChangeText={setEmail} 
                keyboardType="email-address"
                placeholder="Enter email address"
              />

              <Text style={styles.inputLabel}>Phone Number</Text>
              <TextInput 
                style={styles.textInput} 
                value={phone} 
                onChangeText={setPhone} 
                keyboardType="phone-pad"
                placeholder="Enter phone number"
              />

              <TouchableOpacity style={styles.saveBtn} onPress={handleSavePersonalInfo}>
                <Text style={styles.saveBtnText}>Save Changes</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Payment Methods Modal */}
      <Modal visible={paymentModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Payment Methods</Text>
              <TouchableOpacity onPress={() => setPaymentModalVisible(false)}>
                <Ionicons name="close" size={24} color="#1E293B" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {cards.map(c => (
                <View key={c.id} style={styles.cardItem}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Ionicons 
                      name={c.brand === 'Visa' ? 'logo-visa' : 'card-outline'} 
                      size={24} 
                      color={c.isDefault ? '#5271FF' : '#64748B'} 
                      style={{ marginRight: 12 }} 
                    />
                    <View>
                      <Text style={styles.cardLabel}>{c.brand} **** {c.last4}</Text>
                      {c.isDefault && <Text style={styles.defaultLabel}>Default Payment Method</Text>}
                    </View>
                  </View>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    {!c.isDefault && (
                      <TouchableOpacity onPress={() => handleSetDefaultCard(c.id)}>
                        <Text style={styles.cardActionText}>Set Default</Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity onPress={() => handleDeleteCard(c.id)}>
                      <Ionicons name="trash-outline" size={18} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}

              <Text style={styles.inputLabel}>Add New Card</Text>
              <TextInput 
                style={styles.textInput} 
                value={newCardNumber} 
                onChangeText={setNewCardNumber} 
                keyboardType="numeric"
                maxLength={16}
                placeholder="16-digit card number"
              />

              <TouchableOpacity style={styles.saveBtn} onPress={handleAddCard}>
                <Text style={styles.saveBtnText}>Add Card</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Notification Preferences Modal */}
      <Modal visible={notifModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Notification Rules</Text>
              <TouchableOpacity onPress={() => setNotifModalVisible(false)}>
                <Ionicons name="close" size={24} color="#1E293B" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.switchRow}>
                <View>
                  <Text style={styles.switchTitle}>Push Notifications</Text>
                  <Text style={styles.switchSubtitle}>Instant updates on job bookings & statuses</Text>
                </View>
                <Switch value={pushEnabled} onValueChange={setPushEnabled} trackColor={{ true: '#5271FF' }} />
              </View>

              <View style={styles.switchRow}>
                <View>
                  <Text style={styles.switchTitle}>Email Notifications</Text>
                  <Text style={styles.switchSubtitle}>Receipts, invoice details & summaries</Text>
                </View>
                <Switch value={emailEnabled} onValueChange={setEmailEnabled} trackColor={{ true: '#5271FF' }} />
              </View>

              <View style={styles.switchRow}>
                <View>
                  <Text style={styles.switchTitle}>SMS Alerts</Text>
                  <Text style={styles.switchSubtitle}>Critical alerts directly on mobile</Text>
                </View>
                <Switch value={smsEnabled} onValueChange={setSmsEnabled} trackColor={{ true: '#5271FF' }} />
              </View>

              <TouchableOpacity style={[styles.saveBtn, { marginTop: 20 }]} onPress={() => setNotifModalVisible(false)}>
                <Text style={styles.saveBtnText}>Save Preferences</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Security & Privacy Modal */}
      <Modal visible={securityModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Security & Privacy</Text>
              <TouchableOpacity onPress={() => setSecurityModalVisible(false)}>
                <Ionicons name="close" size={24} color="#1E293B" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.switchRow}>
                <View>
                  <Text style={styles.switchTitle}>Biometric Authentication</Text>
                  <Text style={styles.switchSubtitle}>Login with FaceID or Fingerprint</Text>
                </View>
                <Switch value={biometricEnabled} onValueChange={setBiometricEnabled} trackColor={{ true: '#5271FF' }} />
              </View>

              <View style={styles.switchRow}>
                <View>
                  <Text style={styles.switchTitle}>Two-Factor Authentication</Text>
                  <Text style={styles.switchSubtitle}>Secure account with OTP codes</Text>
                </View>
                <Switch value={twoFactorEnabled} onValueChange={setTwoFactorEnabled} trackColor={{ true: '#5271FF' }} />
              </View>

              <TouchableOpacity 
                style={[styles.saveBtn, { backgroundColor: '#FEE2E2', borderWidth: 0, marginTop: 24 }]} 
                onPress={() => {
                  Alert.alert('Danger Zone', 'Are you absolutely sure you want to permanently delete your account?', [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Delete', style: 'destructive', onPress: signOut }
                  ]);
                }}
              >
                <Text style={[styles.saveBtnText, { color: '#EF4444' }]}>Delete Account</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    backgroundColor: '#F8FAFC',
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
  profileCard: {
    backgroundColor: '#FFFFFF',
    margin: 24,
    padding: 24,
    borderRadius: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  avatarBg: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#5271FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarInitials: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  userName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 12,
  },
  roleBadge: {
    backgroundColor: 'rgba(82, 113, 255, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  roleText: {
    color: '#5271FF',
    fontSize: 11,
    fontWeight: '700',
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 20,
    marginHorizontal: 24,
    overflow: 'hidden',
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  optionIcon: {
    marginRight: 12,
  },
  optionText: {
    flex: 1,
    fontSize: 14,
    color: '#334155',
    fontWeight: '600',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  logoutText: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: '600',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 16,
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalBody: {
    paddingBottom: 24,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#64748B',
    textTransform: 'uppercase',
    marginBottom: 8,
    marginTop: 12,
    letterSpacing: 0.5,
  },
  textInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: '#1E293B',
    fontWeight: '600',
  },
  saveBtn: {
    backgroundColor: '#5271FF',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  cardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },
  cardLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  defaultLabel: {
    fontSize: 10,
    color: '#10B981',
    fontWeight: '700',
    marginTop: 2,
  },
  cardActionText: {
    fontSize: 12,
    color: '#5271FF',
    fontWeight: '700',
    marginRight: 8,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  switchTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  switchSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
    maxWidth: '85%',
  },
});
