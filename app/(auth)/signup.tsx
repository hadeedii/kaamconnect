import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  ActivityIndicator, 
  KeyboardAvoidingView, 
  Platform, 
  ScrollView,
  Image,
  Modal
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth, UserRole } from '../../context/AuthContext';
import { CustomToggle } from '../../components/ui/custom-toggle';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';

export default function SignupScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const role = (params.role as UserRole) || 'customer';
  
  const { signUp, signInMock } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Customer Specific Security States
  const [phone, setPhone] = useState('');
  const [cnic, setCnic] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');

  // Provider Specific States
  const [providerPhone, setProviderPhone] = useState('');
  const [profileImageBase64, setProfileImageBase64] = useState<string | null>(null);
  const [experience, setExperience] = useState('');
  const [description, setDescription] = useState('');
  const [hourlyRate, setHourlyRate] = useState('');
  const [rateNotSpecified, setRateNotSpecified] = useState(false);
  const [category, setCategory] = useState('Electrician');
  const [showCategoryModal, setShowCategoryModal] = useState(false);

  // Days, Time picker, and Company Affiliate States
  const [selectedDays, setSelectedDays] = useState<string[]>(['Mon', 'Tue', 'Wed', 'Thu', 'Fri']);
  const [startTime, setStartTime] = useState({ hour: '09', minute: '00', period: 'AM' });
  const [endTime, setEndTime] = useState({ hour: '06', minute: '00', period: 'PM' });
  const [pickingTarget, setPickingTarget] = useState<'start' | 'end' | null>(null);
  const [showClockModal, setShowClockModal] = useState(false);
  const [modalHour, setModalHour] = useState('09');
  const [modalMinute, setModalMinute] = useState('00');
  const [modalPeriod, setModalPeriod] = useState('AM');
  const [hasCompany, setHasCompany] = useState(false);
  const [companyName, setCompanyName] = useState('');

  // Location States
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [address, setAddress] = useState('');
  const [fetchingLoc, setFetchingLoc] = useState(false);

  const categories = [
    "Electrician", 
    "Plumber", 
    "AC Technician", 
    "Beautician", 
    "Tutor", 
    "Home Cleaner",
    "Carpenter", 
    "Painter", 
    "Gardener", 
    "Car Washer", 
    "Appliance Repair", 
    "Sofa Cleaner", 
    "Tailor", 
    "Mover & Packer"
  ];

  const formatTimeObject = (t: { hour: string; minute: string; period: string }) => {
    return `${t.hour}:${t.minute} ${t.period}`;
  };

  const convertTimeToMinutes = (t: { hour: string; minute: string; period: string }) => {
    let h = parseInt(t.hour, 10);
    const m = parseInt(t.minute, 10);
    if (t.period === 'PM' && h !== 12) h += 12;
    if (t.period === 'AM' && h === 12) h = 0;
    return h * 60 + m;
  };

  const validateOperatingHours = () => {
    const startMins = convertTimeToMinutes(startTime);
    const endMins = convertTimeToMinutes(endTime);
    return endMins > startMins;
  };

  const openClockPicker = (target: 'start' | 'end') => {
    setPickingTarget(target);
    const current = target === 'start' ? startTime : endTime;
    setModalHour(current.hour);
    setModalMinute(current.minute);
    setModalPeriod(current.period);
    setShowClockModal(true);
  };

  const confirmClockTime = () => {
    const updatedTime = { hour: modalHour, minute: modalMinute, period: modalPeriod };
    if (pickingTarget === 'start') {
      setStartTime(updatedTime);
    } else {
      setEndTime(updatedTime);
    }
    setShowClockModal(false);
  };

  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const toggleDay = (day: string) => {
    if (selectedDays.includes(day)) {
      setSelectedDays(selectedDays.filter(d => d !== day));
    } else {
      setSelectedDays([...selectedDays, day]);
    }
  };

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        setError('Storage permissions are required to pick a profile photo.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
        base64: true
      });

      if (!result.canceled && result.assets && result.assets[0].base64) {
        setProfileImageBase64(`data:image/jpeg;base64,${result.assets[0].base64}`);
      }
    } catch (e) {
      console.error(e);
      setError('Error picking profile image.');
    }
  };

  const fetchCurrentLocation = async () => {
    setFetchingLoc(true);
    setError('');
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError('Location permission denied. Please set address manually.');
        setFetchingLoc(false);
        return;
      }
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced
      });
      
      const lat = loc.coords.latitude;
      const lon = loc.coords.longitude;
      setLatitude(lat);
      setLongitude(lon);
      
      const geocoded = await Location.reverseGeocodeAsync({
        latitude: lat,
        longitude: lon
      });
      
      if (geocoded && geocoded.length > 0) {
        const place = geocoded[0];
        const formattedAddress = [
          place.street,
          place.district || place.city || place.subregion,
          place.region || place.country
        ].filter(Boolean).join(', ');
        setAddress(formattedAddress || 'GPS Location');
      } else {
        setAddress(`GPS Location (${lat.toFixed(4)}, ${lon.toFixed(4)})`);
      }
    } catch (e: any) {
      setError('Could not fetch coordinates automatically. Please input manually.');
      setLatitude(33.6844);
      setLongitude(73.0479);
    } finally {
      setFetchingLoc(false);
    }
  };

  const handleSignup = async () => {
    if (!name || !email || !password || !confirmPassword) {
      setError('Please fill in all general fields');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (role === 'customer') {
      if (!phone) {
        setError('Phone number is required for customer security');
        return;
      }
    }

    if (role === 'provider') {
      if (!providerPhone) {
        setError('Phone number is required for providers');
        return;
      }
      if (!experience) {
        setError('Work experience is required for providers');
        return;
      }
      if (!description) {
        setError('Please enter a brief job / service description');
        return;
      }
      if (!rateNotSpecified && !hourlyRate) {
        setError('Please specify hourly rate or select Not Specified');
        return;
      }
      if (!address) {
        setError('Sector / Address location is required for providers');
        return;
      }
      if (selectedDays.length === 0) {
        setError('Please select at least one working day');
        return;
      }
      if (!validateOperatingHours()) {
        setError('Invalid operating hours: End Time must be later than Start Time.');
        return;
      }
      if (hasCompany && !companyName) {
        setError('Please enter your company / agency name');
        return;
      }
    }

    setError('');
    setLoading(true);
    try {
      let additionalData = {};
      if (role === 'provider') {
        const formattedHours = `${formatTimeObject(startTime)} - ${formatTimeObject(endTime)}`;
        additionalData = {
          phone: providerPhone,
          profilePicture: profileImageBase64 || undefined,
          category,
          hourlyRate: rateNotSpecified ? null : Number(hourlyRate),
          experience: Number(experience),
          description,
          location: {
            latitude: latitude || 33.6844,
            longitude: longitude || 73.0479,
            address: address
          },
          serviceDays: selectedDays,
          serviceHours: formattedHours,
          isCompanyAffiliated: hasCompany,
          companyName: hasCompany ? companyName : '',
          rating: 4.8,
          completedJobs: 0,
          skills: [category]
        };
      } else {
        additionalData = {
          phone,
          cnic,
          emergencyContact,
          profilePicture: profileImageBase64 || undefined
        };
      }

      await signUp(name, email, password, role, additionalData);
    } catch (e: any) {
      setError(e.message || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };



  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#1E293B" />
          </TouchableOpacity>

          <View style={styles.header}>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>
              Register as <Text style={styles.roleText}>{role.toUpperCase()}</Text>
            </Text>
          </View>

          <View style={styles.form}>
            {error ? (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={20} color="#EF4444" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {/* Profile Photo Picker */}
            <View style={styles.photoPickerContainer}>
              <TouchableOpacity onPress={pickImage} style={styles.photoFrame} activeOpacity={0.8}>
                {profileImageBase64 ? (
                  <Image source={{ uri: profileImageBase64 }} style={styles.avatarImage} />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Ionicons name="camera-outline" size={32} color="#94A3B8" />
                    <Text style={styles.avatarPlaceholderText}>Add Photo</Text>
                  </View>
                )}
              </TouchableOpacity>
              <Text style={styles.photoTip}>Upload profile picture (stored as base64 in Firestore)</Text>
            </View>

            {/* General Fields */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Full Name</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="person-outline" size={20} color="#94A3B8" style={styles.inputIcon} />
                <TextInput 
                  style={styles.input}
                  placeholder="Enter your full name"
                  placeholderTextColor="#94A3B8"
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email Address</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="mail-outline" size={20} color="#94A3B8" style={styles.inputIcon} />
                <TextInput 
                  style={styles.input}
                  placeholder="Enter your email"
                  placeholderTextColor="#94A3B8"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>
            </View>

            {/* General Password Field with eye visibility toggle */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="lock-closed-outline" size={20} color="#94A3B8" style={styles.inputIcon} />
                <TextInput 
                  style={styles.input}
                  placeholder="Create a password"
                  placeholderTextColor="#94A3B8"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon} activeOpacity={0.6}>
                  <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color="#94A3B8" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Confirm Password Field with eye visibility toggle */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Confirm Password</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="lock-closed-outline" size={20} color="#94A3B8" style={styles.inputIcon} />
                <TextInput 
                  style={styles.input}
                  placeholder="Confirm your password"
                  placeholderTextColor="#94A3B8"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.eyeIcon} activeOpacity={0.6}>
                  <Ionicons name={showConfirmPassword ? "eye-off-outline" : "eye-outline"} size={20} color="#94A3B8" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Customer Security Details (Conditional) */}
            {role === 'customer' && (
              <View style={styles.customerSection}>
                <View style={styles.divider} />
                <Text style={styles.sectionTitle}>Security & Verification</Text>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Mobile Phone Number</Text>
                  <View style={styles.inputContainer}>
                    <Ionicons name="call-outline" size={20} color="#94A3B8" style={styles.inputIcon} />
                    <TextInput 
                      style={styles.input}
                      placeholder="e.g. +92 300 1234567"
                      placeholderTextColor="#94A3B8"
                      value={phone}
                      onChangeText={setPhone}
                      keyboardType="phone-pad"
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>CNIC Number (Verification)</Text>
                  <View style={styles.inputContainer}>
                    <Ionicons name="card-outline" size={20} color="#94A3B8" style={styles.inputIcon} />
                    <TextInput 
                      style={styles.input}
                      placeholder="e.g. 37405-1234567-1"
                      placeholderTextColor="#94A3B8"
                      value={cnic}
                      onChangeText={setCnic}
                      keyboardType="number-pad"
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Emergency Contact Number</Text>
                  <View style={styles.inputContainer}>
                    <Ionicons name="shield-checkmark-outline" size={20} color="#94A3B8" style={styles.inputIcon} />
                    <TextInput 
                      style={styles.input}
                      placeholder="e.g. +92 321 9876543"
                      placeholderTextColor="#94A3B8"
                      value={emergencyContact}
                      onChangeText={setEmergencyContact}
                      keyboardType="phone-pad"
                    />
                  </View>
                </View>
              </View>
            )}

            {/* Provider Fields (Conditional) */}
            {role === 'provider' && (
              <View style={styles.providerSection}>
                <View style={styles.divider} />
                <Text style={styles.sectionTitle}>Provider details</Text>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Phone Number</Text>
                  <View style={styles.inputContainer}>
                    <Ionicons name="call-outline" size={20} color="#94A3B8" style={styles.inputIcon} />
                    <TextInput 
                      style={styles.input}
                      placeholder="e.g. +92 300 1234567"
                      placeholderTextColor="#94A3B8"
                      value={providerPhone}
                      onChangeText={setProviderPhone}
                      keyboardType="phone-pad"
                    />
                  </View>
                </View>

                {/* Job Description (max 300 characters) */}
                <View style={styles.inputGroup}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={styles.label}>Job / Service Description</Text>
                    <Text style={[styles.charCounter, description.length > 280 && styles.charCounterWarning]}>
                      {description.length}/300
                    </Text>
                  </View>
                  <View style={[styles.inputContainer, { height: 100, alignItems: 'flex-start', paddingVertical: 8 }]}>
                    <Ionicons name="document-text-outline" size={20} color="#94A3B8" style={[styles.inputIcon, { marginTop: 8 }]} />
                    <TextInput 
                      style={[styles.input, { height: '100%', textAlignVertical: 'top', paddingVertical: 4 }]}
                      placeholder="Describe your skills, what services you offer, etc..."
                      placeholderTextColor="#94A3B8"
                      value={description}
                      onChangeText={setDescription}
                      multiline
                      maxLength={300}
                    />
                  </View>
                </View>

                {/* Service Category Dropdown Menu */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Service Category</Text>
                  <TouchableOpacity 
                    style={styles.inputContainer} 
                    onPress={() => setShowCategoryModal(true)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="construct-outline" size={20} color="#94A3B8" style={styles.inputIcon} />
                    <Text style={[styles.input, { lineHeight: 52, color: '#1E293B' }]}>{category}</Text>
                    <Ionicons name="chevron-down-outline" size={20} color="#94A3B8" />
                  </TouchableOpacity>
                </View>

                <View style={styles.row}>
                  <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
                    <Text style={styles.label}>Experience (Years)</Text>
                    <View style={styles.inputContainer}>
                      <TextInput 
                        style={styles.input}
                        placeholder="e.g. 5"
                        placeholderTextColor="#94A3B8"
                        value={experience}
                        onChangeText={setExperience}
                        keyboardType="number-pad"
                      />
                    </View>
                  </View>

                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.label}>Hourly Rate (PKR)</Text>
                    <View style={[styles.inputContainer, rateNotSpecified && styles.disabledInput]}>
                      <TextInput 
                        style={styles.input}
                        placeholder={rateNotSpecified ? "Not Specified" : "e.g. 1500"}
                        placeholderTextColor="#94A3B8"
                        value={hourlyRate}
                        onChangeText={setHourlyRate}
                        keyboardType="number-pad"
                        editable={!rateNotSpecified}
                      />
                    </View>
                  </View>
                </View>

                {/* Hourly Rate Option "Not Specified" */}
                <TouchableOpacity 
                  style={styles.checkboxContainer} 
                  onPress={() => setRateNotSpecified(!rateNotSpecified)}
                  activeOpacity={0.8}
                >
                  <Ionicons 
                    name={rateNotSpecified ? "checkbox" : "square-outline"} 
                    size={22} 
                    color={rateNotSpecified ? "#5271FF" : "#94A3B8"} 
                  />
                  <Text style={styles.checkboxLabel}>Hourly rate is Negotiable / Not Specified</Text>
                </TouchableOpacity>

                {/* Service Days Selection */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Available Work Days</Text>
                  <View style={styles.daysContainer}>
                    {weekDays.map((day) => {
                      const isSelected = selectedDays.includes(day);
                      return (
                        <TouchableOpacity
                          key={day}
                          style={[styles.dayBadge, isSelected && styles.activeDayBadge]}
                          onPress={() => toggleDay(day)}
                          activeOpacity={0.7}
                        >
                          <Text style={[styles.dayText, isSelected && styles.activeDayText]}>{day}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {/* Operating Hours (Clock Picker Triggers) */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Operating Hours</Text>
                  <View style={styles.timePickersRow}>
                    <TouchableOpacity 
                      style={[styles.timeBox, { marginRight: 10 }]} 
                      onPress={() => openClockPicker('start')}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="time-outline" size={20} color="#5271FF" />
                      <View style={{ marginLeft: 8 }}>
                        <Text style={styles.timeBoxLabel}>Start Time</Text>
                        <Text style={styles.timeBoxValue}>{formatTimeObject(startTime)}</Text>
                      </View>
                    </TouchableOpacity>

                    <TouchableOpacity 
                      style={styles.timeBox} 
                      onPress={() => openClockPicker('end')}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="time-outline" size={20} color="#5271FF" />
                      <View style={{ marginLeft: 8 }}>
                        <Text style={styles.timeBoxLabel}>End Time</Text>
                        <Text style={styles.timeBoxValue}>{formatTimeObject(endTime)}</Text>
                      </View>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Company / Agency Affiliation Selection */}
                <View style={styles.companyToggleContainer}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.label}>Affiliated with a Company / Agency?</Text>
                    <Text style={styles.companySublabel}>Toggle if you work for an agency or registered company</Text>
                  </View>
                  <CustomToggle 
                    value={hasCompany}
                    onValueChange={setHasCompany}
                  />
                </View>

                {hasCompany && (
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Company Name</Text>
                    <View style={styles.inputContainer}>
                      <Ionicons name="business-outline" size={20} color="#94A3B8" style={styles.inputIcon} />
                      <TextInput 
                        style={styles.input}
                        placeholder="Enter registered company / agency name"
                        placeholderTextColor="#94A3B8"
                        value={companyName}
                        onChangeText={setCompanyName}
                      />
                    </View>
                  </View>
                )}

                {/* Location Picker Section */}
                <View style={styles.inputGroup}>
                  <View style={styles.locationHeader}>
                    <Text style={styles.label}>Sector / Address Location</Text>
                    <TouchableOpacity 
                      onPress={fetchCurrentLocation} 
                      style={styles.gpsButton}
                      disabled={fetchingLoc}
                      activeOpacity={0.7}
                    >
                      {fetchingLoc ? (
                        <ActivityIndicator size="small" color="#5271FF" />
                      ) : (
                        <>
                          <Ionicons name="location" size={14} color="#5271FF" />
                          <Text style={styles.gpsButtonText}>Fetch GPS</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                  <View style={styles.inputContainer}>
                    <Ionicons name="map-outline" size={20} color="#94A3B8" style={styles.inputIcon} />
                    <TextInput 
                      style={styles.input}
                      placeholder="e.g. G-11 Markaz, Islamabad"
                      placeholderTextColor="#94A3B8"
                      value={address}
                      onChangeText={setAddress}
                    />
                  </View>
                  {latitude && longitude ? (
                    <Text style={styles.coordsText}>
                      GPS Coordinates: Lat {latitude.toFixed(4)}, Lon {longitude.toFixed(4)}
                    </Text>
                  ) : null}
                </View>
              </View>
            )}

            <TouchableOpacity 
              style={[styles.button, styles.signupButton, { marginTop: 10 }]}
              onPress={handleSignup}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Register Now</Text>
              )}
            </TouchableOpacity>


          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity 
              onPress={() => router.replace({ pathname: '/(auth)/login', params: { role } })}
            >
              <Text style={styles.footerLink}>Login</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Category Dropdown Selection Modal */}
      <Modal visible={showCategoryModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Service Category</Text>
              <TouchableOpacity onPress={() => setShowCategoryModal(false)}>
                <Ionicons name="close-circle" size={28} color="#94A3B8" />
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={styles.modalScroll}>
              {categories.map((item) => (
                <TouchableOpacity 
                  key={item}
                  style={[styles.modalItem, category === item && styles.modalItemActive]}
                  onPress={() => {
                    setCategory(item);
                    setShowCategoryModal(false);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.modalItemText, category === item && styles.modalItemTextActive]}>
                    {item}
                  </Text>
                  {category === item && (
                    <Ionicons name="checkmark-circle" size={20} color="#5271FF" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Custom Clock Picker Modal */}
      <Modal visible={showClockModal} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.clockModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Select {pickingTarget === 'start' ? 'Start Time' : 'End Time'}
              </Text>
              <TouchableOpacity onPress={() => setShowClockModal(false)}>
                <Ionicons name="close-circle" size={28} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            <View style={styles.clockPickerContainer}>
              {/* Active Time Preview */}
              <View style={styles.clockPreviewContainer}>
                <Text style={styles.clockPreviewText}>
                  {modalHour}:{modalMinute} {modalPeriod}
                </Text>
              </View>

              {/* Select Hour Section */}
              <Text style={styles.pickerSectionTitle}>Hour</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
                {['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'].map((h) => (
                  <TouchableOpacity
                    key={h}
                    style={[styles.clockNumBadge, modalHour === h && styles.clockNumBadgeActive]}
                    onPress={() => setModalHour(h)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.clockNumText, modalHour === h && styles.clockNumTextActive]}>{h}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Select Minute Section */}
              <Text style={styles.pickerSectionTitle}>Minute</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
                {['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'].map((m) => (
                  <TouchableOpacity
                    key={m}
                    style={[styles.clockNumBadge, modalMinute === m && styles.clockNumBadgeActive]}
                    onPress={() => setModalMinute(m)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.clockNumText, modalMinute === m && styles.clockNumTextActive]}>{m}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Select AM/PM Section */}
              <Text style={styles.pickerSectionTitle}>AM / PM</Text>
              <View style={styles.periodContainer}>
                <TouchableOpacity
                  style={[styles.periodButton, modalPeriod === 'AM' && styles.periodButtonActive, { marginRight: 10 }]}
                  onPress={() => setModalPeriod('AM')}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.periodText, modalPeriod === 'AM' && styles.periodTextActive]}>AM</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.periodButton, modalPeriod === 'PM' && styles.periodButtonActive]}
                  onPress={() => setModalPeriod('PM')}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.periodText, modalPeriod === 'PM' && styles.periodTextActive]}>PM</Text>
                </TouchableOpacity>
              </View>

              {/* Confirm / Action Button */}
              <TouchableOpacity 
                style={styles.confirmClockButton}
                onPress={confirmClockTime}
                activeOpacity={0.8}
              >
                <Text style={styles.confirmClockButtonText}>Set Time</Text>
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
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748B',
  },
  roleText: {
    color: '#5271FF',
    fontWeight: '700',
  },
  form: {
    marginBottom: 24,
  },
  photoPickerContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  photoFrame: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#F8FAFC',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarPlaceholderText: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
    marginTop: 4,
  },
  photoTip: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 8,
    textAlign: 'center',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FEE2E2',
    padding: 12,
    borderRadius: 12,
    marginBottom: 20,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 13,
    marginLeft: 8,
    flex: 1,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingHorizontal: 14,
    backgroundColor: '#F8FAFC',
  },
  disabledInput: {
    backgroundColor: '#E2E8F0',
    opacity: 0.6,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 52,
    color: '#1E293B',
    fontSize: 15,
  },
  eyeIcon: {
    padding: 4,
  },
  customerSection: {
    marginTop: 10,
  },
  providerSection: {
    marginTop: 10,
  },
  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 8,
  },
  checkboxLabel: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
  },
  daysContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  dayBadge: {
    flex: 1,
    marginHorizontal: 2,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  activeDayBadge: {
    backgroundColor: '#5271FF',
    borderColor: '#5271FF',
  },
  dayText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '700',
  },
  activeDayText: {
    color: '#FFFFFF',
  },
  companyToggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  companySublabel: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  locationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  gpsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  gpsButtonText: {
    fontSize: 12,
    color: '#5271FF',
    fontWeight: '600',
  },
  coordsText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 6,
    fontStyle: 'italic',
  },
  button: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  signupButton: {
    backgroundColor: '#5271FF',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  footerText: {
    color: '#64748B',
    fontSize: 14,
  },
  footerLink: {
    color: '#5271FF',
    fontSize: 14,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '75%',
    paddingBottom: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E293B',
  },
  modalScroll: {
    paddingHorizontal: 24,
    paddingTop: 12,
  },
  modalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  modalItemActive: {
    borderBottomColor: '#EEF2FF',
  },
  modalItemText: {
    fontSize: 15,
    color: '#475569',
    fontWeight: '600',
  },
  modalItemTextActive: {
    color: '#5271FF',
    fontWeight: '700',
  },
  timePickersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timeBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#F8FAFC',
  },
  timeBoxLabel: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
  },
  timeBoxValue: {
    fontSize: 14,
    color: '#1E293B',
    fontWeight: '700',
    marginTop: 2,
  },
  clockModalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingBottom: 36,
  },
  clockPickerContainer: {
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  clockPreviewContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EEF2FF',
    borderRadius: 16,
    paddingVertical: 16,
    marginBottom: 20,
  },
  clockPreviewText: {
    fontSize: 32,
    fontWeight: '800',
    color: '#5271FF',
    letterSpacing: 1,
  },
  pickerSectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  horizontalScroll: {
    paddingBottom: 16,
    gap: 8,
  },
  clockNumBadge: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    minWidth: 50,
  },
  clockNumBadgeActive: {
    backgroundColor: '#5271FF',
    borderColor: '#5271FF',
  },
  clockNumText: {
    fontSize: 14,
    color: '#475569',
    fontWeight: '700',
  },
  clockNumTextActive: {
    color: '#FFFFFF',
  },
  periodContainer: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  periodButtonActive: {
    backgroundColor: '#5271FF',
    borderColor: '#5271FF',
  },
  periodText: {
    fontSize: 14,
    color: '#475569',
    fontWeight: '700',
  },
  periodTextActive: {
    color: '#FFFFFF',
  },
  confirmClockButton: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: '#5271FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmClockButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  charCounter: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '600',
  },
  charCounterWarning: {
    color: '#EF4444',
  },
});
