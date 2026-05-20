import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { 
  StyleSheet, 
  TouchableOpacity, 
  Alert, 
  View, 
  TextInput, 
  Text, 
  FlatList, 
  Dimensions, 
  Platform, 
  ActivityIndicator,
  ScrollView,
  StatusBar
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import * as Location from 'expo-location';
import { db } from '../../../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { useAuth } from '../../../context/AuthContext';
import { AgentContext, Provider } from '../../../agents/types';
import { runBookingAgent } from '../../../agents/bookingAgent';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const GOOGLE_MAPS_API_KEY = 'AIzaSyCyFHITlAk9NZrq0Ck97_9irdNCwwBDLoQ';

// Helper to calculate distance in KM using Haversine formula
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // Radius of earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const d = R * c;
  return Math.round(d * 10) / 10; // round to 1 decimal place
};

export default function NearbyScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { contextJson } = useLocalSearchParams<{ contextJson: string }>();
  
  // Parse intermediate context from agent processing pipeline
  const context: AgentContext = contextJson ? JSON.parse(contextJson) : { logs: [], originalQuery: '' };
  
  const [providers, setProviders] = useState<Provider[]>(context.rankedProviders || []);
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState<string | null>(null);
  
  const [queryText, setQueryText] = useState('');
  const [userRegion, setUserRegion] = useState<Region | null>(null);
  const mapRef = useRef<MapView | null>(null);
  const watchRef = useRef<Location.LocationSubscription | null>(null);
  const isMountedRef = useRef(true);

  // Filter & sorting states
  const [filterTopRated, setFilterTopRated] = useState<boolean>(false);
  const [filterPopular, setFilterPopular] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');

  const [matchPopupVisible, setMatchPopupVisible] = useState(
    Boolean(context.rankedProviders && context.rankedProviders.length > 0)
  );

  useEffect(() => {
    if (matchPopupVisible) {
      const timer = setTimeout(() => {
        setMatchPopupVisible(false);
      }, 2000); // 2.0 seconds auto-fade out
      return () => clearTimeout(timer);
    }
  }, [matchPopupVisible]);

  // Load from Firestore and calculate distances
  const loadNearbyProviders = async (lat: number, lng: number) => {
    try {
      const targetService = context.serviceType || 'Electrician';
      const providersRef = collection(db, 'providers');
      const q = query(
        providersRef,
        where('category', '==', targetService)
      );
      
      const querySnapshot = await getDocs(q);
      const fetched: Provider[] = [];
      
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const provId = docSnap.id;
        
        // Check if there is reasoning in context for this provider to preserve agent decisions
        const matchedContextProv = (context.rankedProviders || []).find(p => p.id === provId);
        
        fetched.push({
          id: provId,
          name: data.name || 'Service Provider',
          image: data.profilePicture || 'https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=150',
          rating: data.rating || 4.8,
          experience: data.experience || 5,
          services: data.skills || [data.category || targetService],
          basePrice: data.hourlyRate || 1200,
          availability: 'available',
          latitude: data.location?.latitude || 33.640,
          longitude: data.location?.longitude || 72.985,
          distance: calculateDistance(lat, lng, data.location?.latitude || 33.640, data.location?.longitude || 72.985),
          reasoningForRanking: matchedContextProv?.reasoningForRanking || data.reasoningForRanking || 'Highly recommended professional matching your local request.'
        } as Provider);
      });

      // Filter to only show providers within a 20km radius as requested
      const withinRadius = fetched.filter(p => (p.distance || 0) <= 20);

      // Default sort by distance
      withinRadius.sort((a, b) => (a.distance || 0) - (b.distance || 0));
      
      if (isMountedRef.current) {
        setProviders(withinRadius);
      }
    } catch (e) {
      console.error("Failed to fetch service providers from Firestore", e);
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  };

  const requestLocationAndInit = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Location permission is required to show nearby providers.');
        setLoading(false);
        return;
      }
      
      // Fetch exact high-accuracy location first as requested
      const current: any = await Promise.race([
        Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Location request timed out')), 5000))
      ]).catch(() => {
        // Fallback to balanced accuracy coordinates if high accuracy blocks
        return Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }).catch(() => {
          // Safe default coordinates for Islamabad mock data sector
          return { coords: { latitude: 33.642, longitude: 72.990 } };
        });
      });

      const region: Region = {
        latitude: current.coords.latitude,
        longitude: current.coords.longitude,
        latitudeDelta: 0.03,
        longitudeDelta: 0.03,
      };
      
      setUserRegion(region);
      mapRef.current?.animateToRegion(region, 600);
      
      // Load providers from Firestore centered at this location
      await loadNearbyProviders(region.latitude, region.longitude);
      
      // Watch for changes in location in the background
      watchRef.current = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.Balanced, distanceInterval: 150, timeInterval: 15000 },
        (loc) => {
          const updated: Region = {
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
            latitudeDelta: region.latitudeDelta,
            longitudeDelta: region.longitudeDelta,
          };
          setUserRegion(updated);
          loadNearbyProviders(loc.coords.latitude, loc.coords.longitude);
        }
      ).catch(() => null);
    } catch (e) {
      console.warn('Silent location init error, fallback coordinates active:', e);
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  };

  useFocusEffect(
    useCallback(() => {
      requestLocationAndInit();
      return () => {
        try { watchRef.current?.remove(); } catch { }
      };
    }, [])
  );

  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

  const handleBookNow = async (provider: Provider) => {
    if (!user) {
      Alert.alert('Login Required', 'Please sign in to book a service provider.');
      return;
    }
    router.push({
      pathname: '/bookings/info' as any,
      params: { 
        uid: provider.id,
        providerName: provider.name,
        category: (provider as any).category || context.serviceType || 'Specialist',
        hourlyRate: provider.basePrice || ''
      }
    });
  };

  // Filtered and Sorted list calculation
  const visibleProviders = useMemo(() => {
    let list = providers.filter(p => {
      if (queryText.trim()) {
        const q = queryText.toLowerCase();
        const matchesName = p.name.toLowerCase().includes(q);
        const matchesSkill = (p.services || []).some(s => s.toLowerCase().includes(q));
        if (!matchesName && !matchesSkill) return false;
      }
      return true;
    });

    if (filterTopRated) {
      list = list.slice().sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else if (filterPopular) {
      // Sort by experience as a proxy for completed bookings
      list = list.slice().sort((a, b) => (b.experience || 0) - (a.experience || 0));
    }
    return list;
  }, [providers, queryText, filterTopRated, filterPopular]);

  const centerOnUser = () => {
    if (userRegion) {
      mapRef.current?.animateToRegion(userRegion, 500);
    }
  };

  const handleRefresh = () => {
    if (userRegion) {
      loadNearbyProviders(userRegion.latitude, userRegion.longitude);
    } else {
      requestLocationAndInit();
    }
  };

  const renderProviderCard = ({ item, index }: { item: Provider; index: number }) => {
    const isTop = index === 0;
    return (
      <View style={[styles.card, isTop && styles.topCard]}>
        {isTop && (
          <View style={styles.badgeTop}>
            <Ionicons name="sparkles" size={11} color="#fff" style={{ marginRight: 4 }} />
            <Text style={styles.badgeTopText}>AI RECOMMENDED MATCH</Text>
          </View>
        )}
        <TouchableOpacity 
          activeOpacity={0.9}
          onPress={() => {
            router.push({
              pathname: '/screens/customer/provider_details' as any,
              params: { uid: item.id }
            });
          }}
        >
          <View style={styles.cardHeader}>
            <View style={styles.avatarWrapper}>
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={24} color="#64748B" />
              </View>
            </View>
            <View style={styles.providerInfo}>
              <Text style={styles.providerName}>{item.name}</Text>
              <View style={styles.ratingRow}>
                <Ionicons name="star" size={13} color="#FBBF24" />
                <Text style={styles.ratingText}>{item.rating.toFixed(1)}</Text>
                <Text style={styles.expText}>• {item.experience} yrs exp</Text>
              </View>
              <Text style={styles.distanceText}>
                <Ionicons name="location-outline" size={12} color="#64748B" /> {item.distance} km away
              </Text>
            </View>
            <View style={styles.priceContainer}>
              <Text style={styles.priceLabel}>Hourly</Text>
              <Text style={styles.priceValue}>Rs.{item.basePrice}</Text>
            </View>
          </View>

          {item.reasoningForRanking && (
            <View style={styles.reasoningBox}>
              <Text style={styles.reasoningText}>
                <Text style={{ fontWeight: '800', color: '#000000' }}>Agent Insight: </Text>
                {item.reasoningForRanking}
              </Text>
            </View>
          )}
        </TouchableOpacity>

        <View style={styles.cardActions}>
          <View style={styles.statusRow}>
            <View style={[styles.statusDot, styles.dotGreen]} />
            <Text style={styles.statusText}>AVAILABLE</Text>
          </View>
          <TouchableOpacity 
            style={styles.bookBtn}
            disabled={bookingLoading !== null}
            onPress={() => handleBookNow(item)}
          >
            {bookingLoading === item.id ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.bookBtnText}>Book Now</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderRowItem = ({ item }: { item: Provider }) => {
    return (
      <TouchableOpacity 
        style={styles.listItem}
        activeOpacity={0.95}
        onPress={() => {
          router.push({
            pathname: '/screens/customer/provider_details' as any,
            params: { uid: item.id }
          });
        }}
      >
        <View style={styles.listMain}>
          <View style={styles.listAvatarPlaceholder}>
            <Ionicons name="person" size={20} color="#64748B" />
          </View>
          <View style={styles.listBody}>
            <Text style={styles.listName}>{item.name}</Text>
            <View style={styles.listMeta}>
              <Ionicons name="star" size={12} color="#FBBF24" />
              <Text style={styles.listMetaText}> {item.rating.toFixed(1)}</Text>
              <Text style={styles.listDot}>·</Text>
              <Text style={styles.listMetaText}>{item.experience} yrs exp</Text>
              <Text style={styles.listDot}>·</Text>
              <Text style={styles.listMetaText}>{item.distance} km</Text>
            </View>
          </View>
          <View style={styles.listPriceWrapper}>
            <Text style={styles.listPrice}>Rs.{item.basePrice}</Text>
            <Text style={styles.listPriceSub}>/ hr</Text>
          </View>
        </View>
        
        {item.reasoningForRanking && (
          <View style={styles.listReasoning}>
            <Text style={styles.listReasoningText} numberOfLines={1}>
              {item.reasoningForRanking}
            </Text>
          </View>
        )}

        <View style={styles.listActions}>
          <View style={styles.statusRow}>
            <View style={[styles.statusDot, styles.dotGreen]} />
            <Text style={styles.statusText}>READY</Text>
          </View>
          <TouchableOpacity 
            style={styles.listBookBtn}
            disabled={bookingLoading !== null}
            onPress={() => handleBookNow(item)}
          >
            {bookingLoading === item.id ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.listBookBtnText}>Book Now</Text>
            )}
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#000000" />
        <Text style={styles.loadingText}>Pinpointing active professionals...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" />

      {/* Top Header Row */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.circularBtn} onPress={() => router.replace('/(tabs)/customer/home')}>
          <Ionicons name="chevron-back" size={20} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Nearby Providers</Text>
        <TouchableOpacity 
          style={styles.circularBtn}
          onPress={() => router.push({
            pathname: '/screens/customer/agent_logs' as any,
            params: { logsJson: JSON.stringify(context.logs) }
          })}
        >
          <Ionicons name="terminal-outline" size={18} color="#5271FF" />
        </TouchableOpacity>
      </View>
      
      {/* Top Search bar overlay */}
      <View style={styles.topOverlay}>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={18} color="#94A3B8" style={{ marginRight: 6 }} />
          <TextInput
            value={queryText}
            onChangeText={setQueryText}
            placeholder={`Search ${context.serviceType || 'Provider'}s`}
            placeholderTextColor="#94A3B8"
            style={styles.searchInput}
          />
          {queryText.length > 0 && (
            <TouchableOpacity onPress={() => setQueryText('')}>
              <Ionicons name="close-circle" size={18} color="#64748B" />
            </TouchableOpacity>
          )}
        </View>

        {/* Dynamic Filter Chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          <TouchableOpacity 
            onPress={() => setFilterTopRated(t => !t)} 
            style={[styles.chip, filterTopRated && styles.chipActive]}
          >
            <Ionicons name="star" size={12} color={filterTopRated ? '#ffffff' : '#000000'} />
            <Text style={[styles.chipText, filterTopRated && styles.chipTextActive]}> Top Rated</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={() => setFilterPopular(p => !p)} 
            style={[styles.chip, filterPopular && styles.chipActive]}
          >
            <Ionicons name="ribbon" size={12} color={filterPopular ? '#ffffff' : '#000000'} />
            <Text style={[styles.chipText, filterPopular && styles.chipTextActive]}> Experienced</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={() => setViewMode(m => m === 'map' ? 'list' : 'map')} 
            style={[styles.chip, styles.chipViewMode]}
          >
            <Ionicons name={viewMode === 'map' ? 'list' : 'map'} size={12} color="#ffffff" />
            <Text style={[styles.chipText, { color: '#ffffff' }]}> {viewMode === 'map' ? 'List View' : 'Map View'}</Text>
          </TouchableOpacity>

          <View style={[styles.chip, { backgroundColor: '#F1F5F9', borderWidth: 0 }]}>
            <Ionicons name="compass" size={12} color="#64748B" />
            <Text style={[styles.chipText, { color: '#64748B' }]}> Live Discovery</Text>
          </View>
        </ScrollView>
      </View>

      {viewMode === 'map' ? (
        <View style={styles.mapWrapper}>
          <MapView
            ref={mapRef}
            style={StyleSheet.absoluteFill}
            provider={PROVIDER_GOOGLE}
            showsUserLocation
            showsMyLocationButton={false}
            toolbarEnabled={false}
            initialRegion={userRegion || {
              latitude: 33.642,
              longitude: 72.990,
              latitudeDelta: 0.03,
              longitudeDelta: 0.03
            }}
            customMapStyle={lightMapStyle}
          >
            {visibleProviders.map((p, idx) => (
              <Marker
                key={p.id}
                coordinate={{ latitude: p.latitude, longitude: p.longitude }}
                title={p.name}
                description={`${p.rating} Stars • Rs.${p.basePrice}`}
              >
                <View style={[styles.customPin, idx === 0 && styles.customPinTop]}>
                  <Ionicons name="construct" size={12} color="#ffffff" />
                </View>
              </Marker>
            ))}
          </MapView>

          {/* Floating Controls */}
          <View style={styles.fabColumn}>
            <TouchableOpacity onPress={centerOnUser} style={styles.circleBtn}>
              <Ionicons name="locate" size={18} color="#000000" />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleRefresh} style={styles.circleBtn}>
              <Ionicons name="refresh" size={18} color="#000000" />
            </TouchableOpacity>
          </View>

          {/* Horizontal Provider Carousel Overlay */}
          <View style={styles.carouselWrapper}>
            <FlatList
              horizontal
              data={visibleProviders}
              keyExtractor={(item) => item.id}
              showsHorizontalScrollIndicator={false}
              renderItem={renderProviderCard}
              snapToInterval={SCREEN_WIDTH * 0.82 + 16}
              decelerationRate="fast"
              contentContainerStyle={styles.carouselContent}
              ListEmptyComponent={
                <View style={styles.emptyCard}>
                  <Ionicons name="alert-circle" size={32} color="#94A3B8" />
                  <Text style={styles.emptyText}>No active {context.serviceType || 'provider'} found in this location sector.</Text>
                </View>
              }
            />
          </View>
        </View>
      ) : (
        /* List Mode Vertical Scrolling layout */
        <FlatList
          data={visibleProviders}
          keyExtractor={(item) => item.id}
          renderItem={renderRowItem}
          contentContainerStyle={styles.listContent}
          style={styles.listView}
          ListEmptyComponent={
            <View style={styles.emptyList}>
              <Ionicons name="people" size={48} color="#94A3B8" />
              <Text style={styles.emptyText}>No matching providers were discovered.</Text>
              <TouchableOpacity onPress={handleRefresh} style={styles.refreshBtn}>
                <Text style={styles.refreshBtnText}>Scan Again</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      {matchPopupVisible && context.rankedProviders && context.rankedProviders.length > 0 && (
        <TouchableOpacity 
          style={styles.matchPopupOverlay} 
          activeOpacity={1} 
          onPress={() => setMatchPopupVisible(false)}
        >
          <TouchableOpacity 
            activeOpacity={1} 
            style={styles.matchPopupCard}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.matchIconWrapper}>
              <Ionicons name="sparkles" size={24} color="#FFFFFF" />
            </View>
            
            <Text style={styles.matchTitle}>AI Match Discovered!</Text>
            <Text style={styles.matchSubtitle}>We matched the perfect professional for your local service task:</Text>
            
            <View style={styles.matchedProviderBlock}>
              <View style={styles.matchAvatarPlaceholder}>
                <Text style={styles.matchAvatarText}>
                  {context.rankedProviders[0].name.charAt(0).toUpperCase()}
                </Text>
              </View>
              <Text style={styles.matchedName}>{context.rankedProviders[0].name}</Text>
              <Text style={styles.matchedSpec}>
                {context.rankedProviders[0].services?.[0] || context.serviceType || 'Specialist'}
              </Text>
              <View style={styles.matchRatingRow}>
                <Ionicons name="star" size={14} color="#FBBF24" />
                <Text style={styles.matchRatingValue}>{context.rankedProviders[0].rating.toFixed(1)} Stars</Text>
                <Text style={styles.matchDot}>•</Text>
                <Text style={styles.matchDistanceValue}>{context.rankedProviders[0].distance || '1.2'} km away</Text>
              </View>
            </View>

            <TouchableOpacity 
              style={styles.matchCloseBtn} 
              activeOpacity={0.8}
              onPress={() => setMatchPopupVisible(false)}
            >
              <Text style={styles.matchCloseBtnText}>Reveal Map & Candidates</Text>
              <Ionicons name="map-outline" size={16} color="#FFFFFF" style={{ marginLeft: 6 }} />
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
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
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 16,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  topOverlay: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderColor: '#E2E8F0',
    zIndex: 10,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 48,
    borderWidth: 1.5,
    borderColor: '#000000',
    backgroundColor: '#FFFFFF',
  },
  backBtn: {
    padding: 6,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 15,
    fontWeight: '600',
    color: '#0F172A',
  },
  logsBtn: {
    padding: 6,
    marginLeft: 4,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  chipActive: {
    backgroundColor: '#000000',
    borderColor: '#000000',
  },
  chipViewMode: {
    backgroundColor: '#000000',
    borderColor: '#000000',
  },
  chipText: {
    color: '#000000',
    fontSize: 12,
    fontWeight: '700',
  },
  chipTextActive: {
    color: '#ffffff',
  },
  mapWrapper: {
    flex: 1,
    position: 'relative',
  },
  customPin: {
    backgroundColor: '#000000',
    padding: 8,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  customPinTop: {
    backgroundColor: '#A855F7', // Premium accent for AI match
    transform: [{ scale: 1.2 }],
  },
  fabColumn: {
    position: 'absolute',
    right: 16,
    top: 16,
    gap: 10,
    zIndex: 5,
  },
  circleBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  carouselWrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 16,
    zIndex: 5,
  },
  carouselContent: {
    paddingHorizontal: 16,
    gap: 12,
  },
  card: {
    width: SCREEN_WIDTH * 0.82,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    shadowColor: '#000000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  topCard: {
    borderColor: '#000000',
    borderWidth: 1.5,
  },
  badgeTop: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    backgroundColor: '#000000',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 12,
  },
  badgeTopText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarWrapper: {
    width: 52,
    height: 52,
    borderRadius: 26,
    overflow: 'hidden',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  providerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  providerName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
    marginLeft: 4,
  },
  expText: {
    fontSize: 11,
    color: '#64748B',
    marginLeft: 6,
  },
  distanceText: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 4,
    fontWeight: '600',
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  priceLabel: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '700',
  },
  priceValue: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 2,
  },
  reasoningBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 10,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  reasoningText: {
    fontSize: 12,
    color: '#334155',
    lineHeight: 16,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 10,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  dotGreen: {
    backgroundColor: '#10B981',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#475569',
    letterSpacing: 0.5,
  },
  bookBtn: {
    backgroundColor: '#000000',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    minWidth: 88,
    alignItems: 'center',
  },
  bookBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  emptyCard: {
    width: SCREEN_WIDTH * 0.82,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  listView: {
    flex: 1,
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
    gap: 12,
  },
  listItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  listMain: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  listAvatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  listBody: {
    flex: 1,
    marginLeft: 12,
  },
  listName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  listMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
  },
  listMetaText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  listDot: {
    color: '#CBD5E1',
    marginHorizontal: 4,
  },
  listPriceWrapper: {
    alignItems: 'flex-end',
  },
  listPrice: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  listPriceSub: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '700',
  },
  listReasoning: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 8,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  listReasoningText: {
    fontSize: 11,
    color: '#475569',
  },
  listActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 8,
  },
  listBookBtn: {
    backgroundColor: '#000000',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    minWidth: 74,
    alignItems: 'center',
  },
  listBookBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  emptyList: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 10,
    paddingHorizontal: 40,
  },
  refreshBtn: {
    marginTop: 16,
    backgroundColor: '#000000',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  refreshBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  matchPopupOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  matchPopupCard: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    borderRadius: 24,
    width: SCREEN_WIDTH * 0.85,
    alignItems: 'center',
    elevation: 10,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
  },
  matchIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#5271FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  matchTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 6,
    textAlign: 'center',
  },
  matchSubtitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 16,
    paddingHorizontal: 12,
    lineHeight: 18,
  },
  matchedProviderBlock: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  matchAvatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  matchAvatarText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
  matchedName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  matchedSpec: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 2,
  },
  matchRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  matchRatingValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    marginLeft: 4,
  },
  matchDot: {
    fontSize: 12,
    color: '#94A3B8',
    marginHorizontal: 6,
  },
  matchDistanceValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  matchCloseBtn: {
    backgroundColor: '#5271FF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  matchCloseBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
});

// Clean light-themed Google Maps custom style
const lightMapStyle = [
  {
    "featureType": "administrative",
    "elementType": "geometry",
    "stylers": [{ "visibility": "off" }]
  },
  {
    "featureType": "poi",
    "stylers": [{ "visibility": "off" }]
  },
  {
    "featureType": "road",
    "elementType": "labels.icon",
    "stylers": [{ "visibility": "off" }]
  },
  {
    "featureType": "transit",
    "stylers": [{ "visibility": "off" }]
  }
];
