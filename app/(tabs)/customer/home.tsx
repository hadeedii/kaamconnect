import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { collection, query as firestoreQuery, getDocs, limit } from 'firebase/firestore';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth, UserProfile } from '../../../context/AuthContext';
import { db } from '../../../firebase';

const HERO_IMAGE = require('../../../assets/onboarding/1.png');

const ANIMATED_PROMPTS = [
  "Mujhe F-11 mein AC technician chahiye shaam 5 baje...",
  "Home cleaner required in G-13 tomorrow morning...",
  "Urgently need electrician in I-8 right now...",
  "Plumber chahiye water leakage fix karne ke liye Monday ko...",
  "Beautician for wedding makeup at home this Friday...",
  "Physics tutor for grade 10 in DHA Phase 2...",
  "Need carpenter in E-11 to fix a door tomorrow afternoon..."
];

export default function CustomerHomeScreen() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [providers, setProviders] = useState<UserProfile[]>([]);
  const [fetchingProviders, setFetchingProviders] = useState(true);

  React.useEffect(() => {
    const fetchTopProviders = async () => {
      try {
        const providersRef = collection(db, 'providers');
        const q = firestoreQuery(providersRef, limit(10));
        const querySnapshot = await getDocs(q);
        const fetchedList: UserProfile[] = [];
        querySnapshot.forEach((doc) => {
          fetchedList.push(doc.data() as UserProfile);
        });
        // Sort by rating descending
        fetchedList.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        setProviders(fetchedList);
      } catch (error) {
        console.error("Error fetching providers on home screen:", error);
      } finally {
        setFetchingProviders(false);
      }
    };

    fetchTopProviders();
  }, []);
  const [query, setQuery] = useState('');

  const [placeholderText, setPlaceholderText] = useState('');
  const [isRecording, setIsRecording] = useState(false); // Controls Modal visibility
  const [isListening, setIsListening] = useState(false); // Controls active listening state and waveforms
  const [waveHeights, setWaveHeights] = useState([20, 30, 25, 40, 20]);
  const [transcribedText, setTranscribedText] = useState('');
  const [recognitionInstance, setRecognitionInstance] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState('');

  const transcribedTextRef = React.useRef('');
  const isCancelledRef = React.useRef(false);

  React.useEffect(() => {
    transcribedTextRef.current = transcribedText;
  }, [transcribedText]);

  // Initialize Speech Recognition for platforms that support Web Speech API
  React.useEffect(() => {
    if (Platform.OS === 'web') {
      const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognitionAPI) {
        const rec = new SpeechRecognitionAPI();
        rec.continuous = false;
        rec.interimResults = true;
        rec.lang = 'en-US';

        rec.onstart = () => {
          setIsListening(true);
          setTranscribedText('');
          setErrorMessage('');
        };

        rec.onresult = (event: any) => {
          const text = Array.from(event.results)
            .map((result: any) => result[0])
            .map((result: any) => result.transcript)
            .join('');
          setTranscribedText(text);
          setErrorMessage('');
        };

        rec.onend = () => {
          setIsListening(false);
        };

        rec.onerror = (e: any) => {
          console.warn("Speech recognition error:", e);
          setIsListening(false);
          if (e.error === 'not-allowed') {
            setErrorMessage("Mic blocked. Enable microphone permissions in browser.");
          } else if (e.error === 'service-not-allowed') {
            setErrorMessage("Mic blocked due to insecure HTTP connection. Use localhost or HTTPS.");
          } else if (e.error === 'no-speech') {
            setErrorMessage("No speech detected. Speak louder.");
          } else {
            setErrorMessage(`Mic error: ${e.error || 'Check browser permissions'}`);
          }
        };

        setRecognitionInstance(rec);
      }
    }
  }, []);

  React.useEffect(() => {
    let promptIdx = 0;
    let charIdx = 0;
    let isDeleting = false;
    let timer: any;

    const tick = () => {
      const currentPrompt = ANIMATED_PROMPTS[promptIdx];
      if (!isDeleting) {
        setPlaceholderText(currentPrompt.substring(0, charIdx + 1));
        charIdx++;
        if (charIdx === currentPrompt.length) {
          timer = setTimeout(() => {
            isDeleting = true;
            tick();
          }, 1200);
          return;
        }
      } else {
        setPlaceholderText(currentPrompt.substring(0, charIdx - 1));
        charIdx--;
        if (charIdx === 0) {
          isDeleting = false;
          promptIdx = (promptIdx + 1) % ANIMATED_PROMPTS.length;
        }
      }
      const delta = isDeleting ? 15 : 30;
      timer = setTimeout(tick, delta);
    };

    tick();
    return () => clearTimeout(timer);
  }, []);

  // Waveform animation loop
  React.useEffect(() => {
    let interval: any;
    if (isListening) {
      interval = setInterval(() => {
        setWaveHeights([
          Math.floor(Math.random() * 40) + 15,
          Math.floor(Math.random() * 50) + 20,
          Math.floor(Math.random() * 45) + 15,
          Math.floor(Math.random() * 55) + 20,
          Math.floor(Math.random() * 35) + 15,
        ]);
      }, 120);
    } else {
      setWaveHeights([20, 20, 20, 20, 20]); // Return to flat/idle bars
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isListening]);

  // Voice recording session triggers
  React.useEffect(() => {
    let timeout: any;

    if (isRecording) {
      setIsListening(true);
      if (recognitionInstance) {
        try {
          recognitionInstance.start();
        } catch (e) {
          console.error(e);
        }
      } else {
        // Fallback simulation: Auto-transcribe mock voice request after 2.2s
        timeout = setTimeout(() => {
          setIsListening(false);
          const randomPrompt = ANIMATED_PROMPTS[Math.floor(Math.random() * ANIMATED_PROMPTS.length)].replace('...', '');
          setTranscribedText(randomPrompt);
        }, 2200);
      }
    } else {
      setIsListening(false);
      if (recognitionInstance) {
        try {
          recognitionInstance.stop();
        } catch (e) {
          // Might already be stopped
        }
      }
    }

    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [isRecording, recognitionInstance]);

  const startVoiceRecording = () => {
    isCancelledRef.current = false;
    setTranscribedText('');
    setErrorMessage('');
    setIsRecording(true);
  };

  const cancelVoiceRecording = () => {
    isCancelledRef.current = true;
    setIsRecording(false);
    setIsListening(false);
    if (recognitionInstance) {
      try {
        recognitionInstance.abort();
      } catch (e) {
        console.error(e);
      }
    }
  };

  const submitVoiceRecording = () => {
    setIsRecording(false);
    setIsListening(false);
    if (recognitionInstance) {
      try {
        recognitionInstance.stop();
      } catch (e) {
        console.error(e);
      }
    }
    if (transcribedText.trim()) {
      handleStartSearch(transcribedText);
    }
  };

  const handleStartSearch = (searchQuery: string) => {
    if (!searchQuery.trim()) return;

    // Validation for supported services
    const q = searchQuery.toLowerCase();
    const plumberKeywords = ['plumber', 'pipe', 'leak', 'paani', 'toti', 'nal', 'sink', 'water', 'tap', 'flush', 'toilet', 'sewer'];
    const electricianKeywords = ['electrician', 'bijli', 'shat', 'fan', 'pankha', 'light', 'switch', 'wire', 'wiring', 'circuit', 'bulb'];
    const acKeywords = ['ac', 'fridge', 'air conditioner', 'cooling', 'thanda', 'refrigerator', 'compressor'];
    const beauticianKeywords = ['beautician', 'parlor', 'makeup', 'facial', 'haircut', 'dulhan', 'salon', 'wax', 'beauty', 'threading'];
    const tutorKeywords = ['tutor', 'teacher', 'parhana', 'ustad', 'class', 'maths', 'english', 'study', 'teaching', 'subject'];
    const cleaningKeywords = ['clean', 'safai', 'poocha', 'jhadu', 'dusting', 'washroom', 'maid', 'cleaning', 'cleaner', 'dust'];
    const chefKeywords = ['chef', 'cook', 'food', 'khana', 'kitchen', 'cooking'];

    const allKeywords = [
      ...plumberKeywords,
      ...electricianKeywords,
      ...acKeywords,
      ...beauticianKeywords,
      ...tutorKeywords,
      ...cleaningKeywords,
      ...chefKeywords
    ];

    const isValid = allKeywords.some(keyword => q.includes(keyword));

    if (!isValid) {
      Alert.alert(
        'Service Not Found',
        'KaamConnect currently matches with these specialist categories:\n\n• Plumber\n• Electrician\n• AC Technician\n• Beautician\n• Tutor\n• Home Cleaner / Chef\n\nPlease enter a search query mentioning one of these services.'
      );
      return;
    }

    // Navigate to processing screen, passing the query
    router.push({
      pathname: '/screens/customer/processing' as any,
      params: { query: searchQuery.trim() }
    });
    setQuery('');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        {/* Top Header */}
        <View style={styles.header}>
          <View style={styles.avatarWrapper}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>
                {(user?.name || 'Rakibul Islam').charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.headerTextContainer}>
              <Text style={styles.greeting}>Hello 👋</Text>
              <Text style={styles.userName}>{user?.name || 'Rakibul Islam'}</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.notificationButton}
            onPress={() => router.push('/screens/customer/notifications' as any)}
          >
            <Ionicons name="notifications-outline" size={22} color="#5271FF" />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Main Headline */}
          <Text style={styles.mainHeadline}>What service do you{"\n"}want to use?</Text>

          {/* Combined Search & AI Conversational Bar */}
          <View style={styles.searchSectionContainer}>
            <View style={styles.searchBarWrapper}>
              <Ionicons name="search-outline" size={20} color="#94A3B8" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder={placeholderText || "Search for your services"}
                placeholderTextColor="#94A3B8"
                value={query}
                onChangeText={setQuery}
                onSubmitEditing={() => query.trim() && handleStartSearch(query)}
              />
            </View>
            <TouchableOpacity
              style={[
                styles.sendSearchButton,
                !query.trim() && { backgroundColor: '#CBD5E1' }
              ]}
              onPress={() => query.trim() && handleStartSearch(query)}
              activeOpacity={0.8}
              disabled={!query.trim()}
            >
              <Ionicons name="arrow-up" size={22} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Promo Hero Card */}
          <View style={styles.promoCard}>
            <View style={styles.promoTextContainer}>
              <Text style={styles.promoTitle}>Get 15%</Text>
              <Text style={styles.promoSubtitle}>Discount for every{"\n"}cleaning order</Text>
              <TouchableOpacity
                style={styles.promoButton}
                onPress={() => handleStartSearch("cleaning")}
                activeOpacity={0.8}
              >
                <Text style={styles.promoButtonText}>Book Now</Text>
              </TouchableOpacity>
            </View>
            <Image
              source={HERO_IMAGE}
              style={styles.promoImage}
              resizeMode="cover"
            />
          </View>



          {/* Popular Services Section */}
          <View style={styles.popularSection}>
            <Text style={styles.sectionHeader}>Popular Services</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.popularContainer}
              style={styles.popularScrollView}
            >
              {/* Card 1: Home Cleaning */}
              <View style={[styles.popularCard, { backgroundColor: '#FFEBEA' }]}>
                <View style={styles.popularCardContent}>
                  <View style={styles.ratingRow}>
                    <Ionicons name="star" size={14} color="#F59E0B" />
                    <Text style={styles.ratingText}>4.5 (210review)</Text>
                  </View>
                  <Text style={styles.popularCardTitle}>Home Cleaning</Text>
                  <Text style={styles.popularCardPrice}>$125.00/day</Text>

                  <TouchableOpacity
                    style={styles.bookNowBadgeButton}
                    onPress={() => handleStartSearch("Home Cleaning")}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="calendar-outline" size={14} color="#FFFFFF" style={{ marginRight: 6 }} />
                    <Text style={styles.bookNowBadgeText}>Book Now</Text>
                  </TouchableOpacity>
                </View>
                <Image
                  source={require('../../../assets/home/homecleaning.png')}
                  style={styles.popularCardImage}
                  resizeMode="contain"
                />
              </View>

              {/* Card 2: AC Repair */}
              <View style={[styles.popularCard, { backgroundColor: '#E0F2FE' }]}>
                <View style={styles.popularCardContent}>
                  <View style={styles.ratingRow}>
                    <Ionicons name="star" size={14} color="#F59E0B" />
                    <Text style={styles.ratingText}>4.8 (145review)</Text>
                  </View>
                  <Text style={styles.popularCardTitle}>AC Technician</Text>
                  <Text style={styles.popularCardPrice}>$150.00/day</Text>

                  <TouchableOpacity
                    style={styles.bookNowBadgeButton}
                    onPress={() => handleStartSearch("AC Technician")}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="calendar-outline" size={14} color="#FFFFFF" style={{ marginRight: 6 }} />
                    <Text style={styles.bookNowBadgeText}>Book Now</Text>
                  </TouchableOpacity>
                </View>
                <Image
                  source={require('../../../assets/home/ac repair.png')}
                  style={styles.popularCardImage}
                  resizeMode="contain"
                />
              </View>

              {/* Card 3: Electrician */}
              <View style={[styles.popularCard, { backgroundColor: '#FEF9C3' }]}>
                <View style={styles.popularCardContent}>
                  <View style={styles.ratingRow}>
                    <Ionicons name="star" size={14} color="#F59E0B" />
                    <Text style={styles.ratingText}>4.7 (98review)</Text>
                  </View>
                  <Text style={styles.popularCardTitle}>Electrician</Text>
                  <Text style={styles.popularCardPrice}>$110.00/day</Text>

                  <TouchableOpacity
                    style={styles.bookNowBadgeButton}
                    onPress={() => handleStartSearch("Electrician")}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="calendar-outline" size={14} color="#FFFFFF" style={{ marginRight: 6 }} />
                    <Text style={styles.bookNowBadgeText}>Book Now</Text>
                  </TouchableOpacity>
                </View>
                <Image
                  source={require('../../../assets/home/electrician.png')}
                  style={styles.popularCardImage}
                  resizeMode="contain"
                />
              </View>

              {/* Card 4: Home Chef */}
              <View style={[styles.popularCard, { backgroundColor: '#DCFCE7' }]}>
                <View style={styles.popularCardContent}>
                  <View style={styles.ratingRow}>
                    <Ionicons name="star" size={14} color="#F59E0B" />
                    <Text style={styles.ratingText}>4.9 (320review)</Text>
                  </View>
                  <Text style={styles.popularCardTitle}>Home Chef</Text>
                  <Text style={styles.popularCardPrice}>$200.00/day</Text>

                  <TouchableOpacity
                    style={styles.bookNowBadgeButton}
                    onPress={() => handleStartSearch("Home Chef")}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="calendar-outline" size={14} color="#FFFFFF" style={{ marginRight: 6 }} />
                    <Text style={styles.bookNowBadgeText}>Book Now</Text>
                  </TouchableOpacity>
                </View>
                <Image
                  source={require('../../../assets/home/homechef.png')}
                  style={styles.popularCardImage}
                  resizeMode="contain"
                />
              </View>
            </ScrollView>
          </View>

          {/* Recommended Providers Section */}
          <View style={styles.providersSection}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionHeader}>Recommended Partners</Text>
              <TouchableOpacity onPress={() => router.push('/screens/customer/nearby' as any)}>
                <Text style={styles.seeAllText}>View Map</Text>
              </TouchableOpacity>
            </View>

            {fetchingProviders ? (
              <ActivityIndicator size="small" color="#5271FF" style={{ marginVertical: 20 }} />
            ) : providers.length === 0 ? (
              <View style={styles.emptyProviders}>
                <Ionicons name="people-outline" size={32} color="#94A3B8" />
                <Text style={styles.emptyProvidersText}>No providers available at this time.</Text>
              </View>
            ) : (
              <View style={styles.providersList}>
                {providers.slice(0, 3).map((provider) => (
                  <TouchableOpacity
                    key={provider.uid}
                    style={styles.providerCard}
                    activeOpacity={0.9}
                    onPress={() => {
                      router.push({
                        pathname: '/screens/customer/provider_details' as any,
                        params: { uid: provider.uid }
                      });
                    }}
                  >
                    <View style={styles.providerAvatarBg}>
                      {provider.profilePicture ? (
                        <Image
                          source={{ uri: provider.profilePicture }}
                          style={styles.providerAvatarImage}
                        />
                      ) : (
                        <Text style={styles.providerAvatarText}>
                          {provider.name.charAt(0).toUpperCase()}
                        </Text>
                      )}
                    </View>

                    <View style={styles.providerInfo}>
                      <Text style={styles.providerName}>{provider.name}</Text>
                      <Text style={styles.providerCategory}>
                        {provider.category || 'Partner'} • {provider.experience || 3} Yrs Exp
                      </Text>

                      <View style={styles.providerStatsRow}>
                        <View style={styles.ratingRow}>
                          <Ionicons name="star" size={14} color="#F59E0B" />
                          <Text style={styles.providerRatingVal}>
                            {provider.rating?.toFixed(1) || '4.8'}
                          </Text>
                          <Text style={styles.providerJobsVal}>
                            ({provider.completedJobs || 0} jobs)
                          </Text>
                        </View>
                      </View>
                    </View>

                    <View style={styles.providerRightCol}>
                      <Text style={styles.providerPrice}>
                        {provider.hourlyRate ? `Rs.${provider.hourlyRate}/hr` : 'Negotiable'}
                      </Text>
                      <View style={styles.bookBtn}>
                        <Text style={styles.bookBtnText}>Book</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}

                {providers.length > 3 && (
                  <TouchableOpacity
                    style={styles.seeMoreBtn}
                    onPress={() => router.push('/screens/customer/all_providers' as any)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.seeMoreBtnText}>See More Recommended Partners</Text>
                    <Ionicons name="arrow-forward-outline" size={16} color="#5271FF" />
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        </ScrollView>

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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: '#F8FAFC',
  },
  avatarWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
  headerTextContainer: {
    flexDirection: 'column',
  },
  greeting: {
    fontSize: 13,
    color: '#64748B',
  },
  userName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 100,
  },
  mainHeadline: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0F172A',
    lineHeight: 34,
    marginBottom: 20,
  },
  searchSectionContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
    alignItems: 'center',
  },
  searchBarWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    paddingHorizontal: 18,
    paddingVertical: 15,
    elevation: 2,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1E293B',
    padding: 0,
  },
  sendSearchButton: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#5271FF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  promoCard: {
    backgroundColor: '#5271FF',
    borderRadius: 24,
    height: 160,
    flexDirection: 'row',
    overflow: 'hidden',
    marginBottom: 24,
  },
  promoTextContainer: {
    flex: 1.2,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  promoTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  promoSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 18,
    marginBottom: 16,
  },
  promoButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
  },
  promoButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  promoImage: {
    flex: 0.8,
    width: '100%',
    height: '100%',
  },
  categoriesScrollView: {
    marginBottom: 24,
  },
  categoriesContainer: {
    gap: 10,
    paddingVertical: 4,
  },
  categoryPill: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  activeCategoryPill: {
    backgroundColor: '#EEF2FF',
    borderColor: '#5271FF',
  },
  categoryPillText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  activeCategoryPillText: {
    color: '#5271FF',
    fontWeight: '700',
  },
  popularSection: {
    marginBottom: 16,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 16,
  },
  popularScrollView: {
    overflow: 'visible',
  },
  popularContainer: {
    gap: 16,
    paddingBottom: 8,
  },
  popularCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    width: 280,
    height: 160,
    flexDirection: 'row',
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  popularCardContent: {
    flex: 1.2,
    padding: 16,
    justifyContent: 'space-between',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  popularCardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  popularCardPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: '#5271FF',
  },
  bookNowBadgeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#5271FF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  bookNowBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  popularCardImage: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 140,
    height: 140,
  },
  providersSection: {
    marginTop: 24,
    marginBottom: 20,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#5271FF',
  },
  emptyProviders: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyProvidersText: {
    color: '#64748B',
    fontSize: 13,
    marginTop: 8,
    textAlign: 'center',
  },
  providersList: {
    gap: 12,
  },
  providerCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 2,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
  },
  providerAvatarBg: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    overflow: 'hidden',
  },
  providerAvatarImage: {
    width: '100%',
    height: '100%',
  },
  providerAvatarText: {
    color: '#5271FF',
    fontSize: 16,
    fontWeight: '800',
  },
  providerInfo: {
    flex: 1,
  },
  providerName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 2,
  },
  providerCategory: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
    marginBottom: 4,
  },
  providerStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  providerRatingVal: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  providerJobsVal: {
    fontSize: 11,
    color: '#64748B',
  },
  providerRightCol: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    marginLeft: 8,
  },
  providerPrice: {
    fontSize: 13,
    fontWeight: '700',
    color: '#5271FF',
    marginBottom: 6,
  },
  bookBtn: {
    backgroundColor: '#5271FF',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
  },
  bookBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  seeMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    paddingVertical: 12,
    marginTop: 12,
    gap: 8,
  },
  seeMoreBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#5271FF',
  },
});
