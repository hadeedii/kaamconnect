import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, TextInput, Alert, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../../context/AuthContext';
import { useRouter } from 'expo-router';

export default function ProviderProfileScreen() {
  const router = useRouter();
  const { user, signOut } = useAuth();

  // Modal visibility states
  const [servicesModalVisible, setServicesModalVisible] = useState(false);
  const [payoutModalVisible, setPayoutModalVisible] = useState(false);
  const [documentsModalVisible, setDocumentsModalVisible] = useState(false);

  // Manage Services & Rates State
  const [category, setCategory] = useState(user?.category || 'Specialist Partner');
  const [hourlyRate, setHourlyRate] = useState('800');
  const [isAvailable, setIsAvailable] = useState(true);
  const [selectedSkills, setSelectedSkills] = useState([
    { name: 'Electrician', active: true },
    { name: 'AC Technician', active: true },
    { name: 'Appliance Repair', active: true },
    { name: 'Plumber', active: false },
    { name: 'Carpenter', active: false },
  ]);

  // Payout Settings State
  const [payoutMethod, setPayoutMethod] = useState('bank'); // bank | easypaisa | jazzcash
  const [bankName, setBankName] = useState('Habib Bank Limited (HBL)');
  const [accountNumber, setAccountNumber] = useState('PK89 HABB 0012 3456 7890 1234');
  const [walletNumber, setWalletNumber] = useState('+92 300 9876543');

  // Verification Documents State
  const [documents, setDocuments] = useState([
    { id: '1', name: 'CNIC / Identity Card Front', status: 'Approved', date: '2026-02-14' },
    { id: '2', name: 'CNIC / Identity Card Back', status: 'Approved', date: '2026-02-14' },
    { id: '3', name: 'Police Clearance Certificate', status: 'Pending Review', date: '2026-05-18' },
    { id: '4', name: 'Professional Certification License', status: 'Approved', date: '2026-03-01' }
  ]);

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

  const handleSaveServices = () => {
    if (!hourlyRate.trim() || isNaN(Number(hourlyRate))) {
      Alert.alert('Error', 'Please enter a valid hourly rate.');
      return;
    }
    Alert.alert('Success', 'Offered services & hourly rates updated successfully!');
    setServicesModalVisible(false);
  };

  const handleSavePayout = () => {
    if (payoutMethod === 'bank' && !accountNumber.trim()) {
      Alert.alert('Error', 'Account number / IBAN cannot be empty.');
      return;
    }
    if (payoutMethod !== 'bank' && !walletNumber.trim()) {
      Alert.alert('Error', 'Wallet phone number cannot be empty.');
      return;
    }
    Alert.alert('Success', 'Payout settings updated successfully!');
    setPayoutModalVisible(false);
  };

  const handleToggleSkill = (index: number) => {
    const updated = [...selectedSkills];
    updated[index].active = !updated[index].active;
    setSelectedSkills(updated);
  };

  const handleMockUpload = (id: string) => {
    Alert.alert('Upload Document', 'Select a file to upload from your device storage.', [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Upload Photo / PDF', 
        onPress: () => {
          setDocuments(documents.map(doc => 
            doc.id === id ? { ...doc, status: 'Pending Review', date: new Date().toISOString().split('T')[0] } : doc
          ));
          Alert.alert('Success', 'Document uploaded successfully! It is now pending verification review.');
        } 
      }
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <TouchableOpacity style={styles.circularBtn} onPress={() => router.replace('/(tabs)/provider/Dashboard')}>
          <Ionicons name="chevron-back" size={20} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Partner Profile</Text>
        <View style={{ width: 42 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarBg}>
            <Text style={styles.avatarInitials}>
              {user?.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase() : 'KP'}
            </Text>
          </View>
          <Text style={styles.userName}>{user?.name || 'Partner Name'}</Text>
          <Text style={styles.userEmail}>{user?.email || 'partner@kaamconnect.com'}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>KAAMCONNECT PARTNER</Text>
          </View>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Ionicons name="star" size={20} color="#FBBF24" />
            <Text style={styles.statVal}>4.9</Text>
            <Text style={styles.statLbl}>Rating</Text>
          </View>
          <View style={styles.statBox}>
            <Ionicons name="hammer-outline" size={20} color="#10B981" />
            <Text style={styles.statVal}>Rs. {hourlyRate}/hr</Text>
            <Text style={styles.statLbl}>Service Rate</Text>
          </View>
          <View style={styles.statBox}>
            <Ionicons name="shield-checkmark-outline" size={20} color="#5271FF" />
            <Text style={styles.statVal}>Verified</Text>
            <Text style={styles.statLbl}>Status</Text>
          </View>
        </View>

        {/* Skills Section */}
        <Text style={styles.sectionTitle}>Active Services</Text>
        <View style={styles.skillsContainer}>
          {selectedSkills.filter(s => s.active).map((skill, index) => (
            <View key={index} style={styles.skillChip}>
              <Text style={styles.skillText}>{skill.name}</Text>
            </View>
          ))}
          {selectedSkills.filter(s => s.active).length === 0 && (
            <Text style={{ fontSize: 13, color: '#94A3B8', fontStyle: 'italic', marginHorizontal: 24 }}>No active skills. Tap manage services below to select.</Text>
          )}
        </View>

        {/* Options */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.optionRow} onPress={() => setServicesModalVisible(true)}>
            <Ionicons name="construct-outline" size={20} color="#5271FF" style={styles.optionIcon} />
            <Text style={styles.optionText}>Manage Services & Rates</Text>
            <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.optionRow} onPress={() => setPayoutModalVisible(true)}>
            <Ionicons name="wallet-outline" size={20} color="#5271FF" style={styles.optionIcon} />
            <Text style={styles.optionText}>Payout Settings</Text>
            <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.optionRow} onPress={() => setDocumentsModalVisible(true)}>
            <Ionicons name="document-text-outline" size={20} color="#5271FF" style={styles.optionIcon} />
            <Text style={styles.optionText}>Verification Documents</Text>
            <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
          </TouchableOpacity>
        </View>

        <View style={[styles.section, { marginTop: 16 }]}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleSignOut}>
            <Ionicons name="log-out-outline" size={20} color="#EF4444" style={styles.optionIcon} />
            <Text style={styles.logoutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* --- MODALS --- */}

      {/* Services & Rates Modal */}
      <Modal visible={servicesModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Services & Rates</Text>
              <TouchableOpacity onPress={() => setServicesModalVisible(false)}>
                <Ionicons name="close" size={24} color="#1E293B" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <View style={styles.switchRow}>
                <View>
                  <Text style={styles.switchTitle}>Availability Status</Text>
                  <Text style={styles.switchSubtitle}>Toggle to go online and accept new jobs</Text>
                </View>
                <Switch value={isAvailable} onValueChange={setIsAvailable} trackColor={{ true: '#10B981' }} />
              </View>

              <Text style={styles.inputLabel}>Hourly Service Rate (Rs.)</Text>
              <TextInput 
                style={styles.textInput} 
                value={hourlyRate} 
                onChangeText={setHourlyRate} 
                keyboardType="numeric"
                placeholder="Rate in Rupees"
              />

              <Text style={styles.inputLabel}>Select Your Skills</Text>
              <View style={styles.skillsGrid}>
                {selectedSkills.map((s, idx) => (
                  <TouchableOpacity 
                    key={idx} 
                    style={[styles.skillCheckChip, s.active && styles.skillCheckChipActive]}
                    onPress={() => handleToggleSkill(idx)}
                  >
                    <Ionicons 
                      name={s.active ? "checkmark-circle" : "add-circle-outline"} 
                      size={16} 
                      color={s.active ? '#FFFFFF' : '#64748B'} 
                      style={{ marginRight: 6 }}
                    />
                    <Text style={[styles.skillCheckText, s.active && styles.skillCheckTextActive]}>{s.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity style={styles.saveBtn} onPress={handleSaveServices}>
                <Text style={styles.saveBtnText}>Save Services</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Payout Settings Modal */}
      <Modal visible={payoutModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Payout Settings</Text>
              <TouchableOpacity onPress={() => setPayoutModalVisible(false)}>
                <Ionicons name="close" size={24} color="#1E293B" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <Text style={styles.inputLabel}>Payout Channel</Text>
              <View style={styles.payoutTabs}>
                <TouchableOpacity 
                  style={[styles.payoutTabBtn, payoutMethod === 'bank' && styles.payoutTabBtnActive]} 
                  onPress={() => setPayoutMethod('bank')}
                >
                  <Text style={[styles.payoutTabText, payoutMethod === 'bank' && styles.payoutTabTextActive]}>Bank Transfer</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.payoutTabBtn, payoutMethod === 'easypaisa' && styles.payoutTabBtnActive]} 
                  onPress={() => setPayoutMethod('easypaisa')}
                >
                  <Text style={[styles.payoutTabText, payoutMethod === 'easypaisa' && styles.payoutTabTextActive]}>EasyPaisa</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.payoutTabBtn, payoutMethod === 'jazzcash' && styles.payoutTabBtnActive]} 
                  onPress={() => setPayoutMethod('jazzcash')}
                >
                  <Text style={[styles.payoutTabText, payoutMethod === 'jazzcash' && styles.payoutTabTextActive]}>JazzCash</Text>
                </TouchableOpacity>
              </View>

              {payoutMethod === 'bank' ? (
                <>
                  <Text style={styles.inputLabel}>Bank Name</Text>
                  <TextInput 
                    style={styles.textInput} 
                    value={bankName} 
                    onChangeText={setBankName} 
                    placeholder="E.g. Habib Bank Limited"
                  />

                  <Text style={styles.inputLabel}>IBAN / Account Number</Text>
                  <TextInput 
                    style={styles.textInput} 
                    value={accountNumber} 
                    onChangeText={setAccountNumber} 
                    placeholder="PK00 XXXX 0000..."
                  />
                </>
              ) : (
                <>
                  <Text style={styles.inputLabel}>Mobile Wallet Number</Text>
                  <TextInput 
                    style={styles.textInput} 
                    value={walletNumber} 
                    onChangeText={setWalletNumber} 
                    keyboardType="phone-pad"
                    placeholder="+92 300 0000000"
                  />
                </>
              )}

              <TouchableOpacity style={styles.saveBtn} onPress={handleSavePayout}>
                <Text style={styles.saveBtnText}>Save Payout Method</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Verification Documents Modal */}
      <Modal visible={documentsModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Verification Documents</Text>
              <TouchableOpacity onPress={() => setDocumentsModalVisible(false)}>
                <Ionicons name="close" size={24} color="#1E293B" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <Text style={{ fontSize: 13, color: '#64748B', lineHeight: 18, marginBottom: 16 }}>
                To comply with regional safety standards, partners are required to upload verifying documents. Keep your files updated to avoid job restrictions.
              </Text>

              {documents.map(doc => (
                <View key={doc.id} style={styles.documentCard}>
                  <View style={{ flex: 1, marginRight: 8 }}>
                    <Text style={styles.docName}>{doc.name}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                      <View style={[styles.docStatusBadge, { backgroundColor: doc.status === 'Approved' ? '#E6F4EA' : '#FEF7E0' }]}>
                        <Text style={[styles.docStatusText, { color: doc.status === 'Approved' ? '#137333' : '#B06000' }]}>
                          {doc.status}
                        </Text>
                      </View>
                      <Text style={{ fontSize: 11, color: '#94A3B8', marginLeft: 8 }}>Updated: {doc.date}</Text>
                    </View>
                  </View>
                  <TouchableOpacity style={styles.uploadDocBtn} onPress={() => handleMockUpload(doc.id)}>
                    <Ionicons name="cloud-upload-outline" size={20} color="#5271FF" />
                  </TouchableOpacity>
                </View>
              ))}

              <TouchableOpacity style={[styles.saveBtn, { marginTop: 12 }]} onPress={() => setDocumentsModalVisible(false)}>
                <Text style={styles.saveBtnText}>Done</Text>
              </TouchableOpacity>
            </ScrollView>
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
  scrollContent: {
    paddingBottom: 40,
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    margin: 24,
    padding: 24,
    borderRadius: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  avatarBg: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#1E293B',
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
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  roleText: {
    color: '#D97706',
    fontSize: 9,
    fontWeight: '800',
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 20,
    marginHorizontal: 24,
    padding: 16,
    marginBottom: 20,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statVal: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
    marginTop: 6,
  },
  statLbl: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#475569',
    marginHorizontal: 24,
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginHorizontal: 24,
    marginBottom: 24,
  },
  skillChip: {
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  skillText: {
    color: '#475569',
    fontSize: 12,
    fontWeight: '600',
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
  // Modal styles
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
  skillsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 6,
  },
  skillCheckChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  skillCheckChipActive: {
    backgroundColor: '#5271FF',
    borderColor: '#5271FF',
  },
  skillCheckText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  skillCheckTextActive: {
    color: '#FFFFFF',
  },
  payoutTabs: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 4,
    gap: 4,
  },
  payoutTabBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  payoutTabBtnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  payoutTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  payoutTabTextActive: {
    color: '#5271FF',
    fontWeight: '700',
  },
  documentCard: {
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
  docName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  docStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  docStatusText: {
    fontSize: 10,
    fontWeight: '800',
  },
  uploadDocBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
