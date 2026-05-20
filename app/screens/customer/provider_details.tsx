import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  ActivityIndicator,
  Linking,
  Alert,
  Platform
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { db } from '../../../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { UserProfile } from '../../../context/AuthContext';

export default function ProviderDetailsScreen() {
  const router = useRouter();
  const { uid } = useLocalSearchParams<{ uid: string }>();
  
  const [provider, setProvider] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [readMore, setReadMore] = useState(false);

  useEffect(() => {
    if (!uid) {
      setLoading(false);
      return;
    }

    const fetchProviderDetails = async () => {
      try {
        const docRef = doc(db, 'providers', uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setProvider(docSnap.data() as UserProfile);
        } else {
          Alert.alert('Error', 'Provider details could not be found.');
          router.back();
        }
      } catch (error) {
        console.error("Error fetching provider details:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProviderDetails();
  }, [uid]);

  // Determine beautiful banner image based on service category
  const bannerImage = React.useMemo(() => {
    if (!provider?.category) {
      return 'https://images.unsplash.com/photo-1521791136368-1a46827d0505?q=80&w=800';
    }
    const cat = provider.category.toLowerCase();
    if (cat.includes('clean') || cat.includes('wash')) {
      return 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?q=80&w=800';
    }
    if (cat.includes('electr')) {
      return 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?q=80&w=800';
    }
    if (cat.includes('ac ') || cat.includes('repair') || cat.includes('appliance')) {
      return 'https://images.unsplash.com/photo-1621905252507-b354bc25edac?q=80&w=800';
    }
    if (cat.includes('plumb')) {
      return 'https://images.unsplash.com/photo-1504148455328-c376907d081c?q=80&w=800';
    }
    if (cat.includes('tutor') || cat.includes('teach')) {
      return 'https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?q=80&w=800';
    }
    if (cat.includes('beaut') || cat.includes('salon') || cat.includes('makeup')) {
      return 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?q=80&w=800';
    }
    return 'https://images.unsplash.com/photo-1521791136368-1a46827d0505?q=80&w=800';
  }, [provider?.category]);

  // Gallery images mockup
  const galleryImages = [
    'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?q=80&w=300',
    'https://images.unsplash.com/photo-1581578731548-c64695cc6952?q=80&w=300',
    'https://images.unsplash.com/photo-1504148455328-c376907d081c?q=80&w=300',
    'https://images.unsplash.com/photo-1621905252507-b354bc25edac?q=80&w=300'
  ];

  const handleCall = () => {
    if (provider?.phone) {
      Linking.openURL(`tel:${provider.phone}`);
    } else {
      Alert.alert('Unavailable', 'This provider has not specified a phone number.');
    }
  };

  const handleChat = () => {
    if (provider?.uid) {
      router.push({
        pathname: '/screens/customer/chat' as any,
        params: { providerId: provider.uid }
      });
    } else {
      Alert.alert('Unavailable', 'This provider profile is currently offline.');
    }
  };

  const handleBook = () => {
    if (provider?.uid) {
      router.push({
        pathname: '/bookings/info' as any,
        params: { 
          uid: provider.uid,
          providerName: provider.name,
          category: provider.category || 'Specialist',
          hourlyRate: provider.hourlyRate || ''
        }
      });
    } else {
      Alert.alert('Unavailable', 'This provider profile is currently offline.');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#5271FF" />
        <Text style={styles.loadingText}>Loading service profile...</Text>
      </View>
    );
  }

  if (!provider) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Error loading provider profile.</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar style="dark" />
      
      {/* Top Header Row */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.circularBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={20} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Service Information</Text>
        <TouchableOpacity 
          style={[styles.circularBtn, isFavorite && styles.circularBtnActive]} 
          onPress={() => setIsFavorite(!isFavorite)}
        >
          <Ionicons 
            name={isFavorite ? "bookmark" : "bookmark-outline"} 
            size={18} 
            color={isFavorite ? "#FFFFFF" : "#5271FF"} 
          />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Banner image */}
        <View style={styles.bannerContainer}>
          <Image source={{ uri: bannerImage }} style={styles.banner} />
        </View>

        {/* Title and stats section */}
        <View style={styles.detailsBlock}>
          <Text style={styles.serviceTitle}>{provider.category || 'Professional Service'}</Text>
          
          <View style={styles.infoRow}>
            <View style={styles.infoCol}>
              <Ionicons name="location" size={16} color="#475569" style={{ marginRight: 4 }} />
              <Text style={styles.infoText} numberOfLines={1}>
                {provider.location?.address || 'Islamabad, Pakistan'}
              </Text>
            </View>

            <View style={styles.infoCol}>
              <Ionicons name="star" size={16} color="#FBBF24" style={{ marginRight: 4 }} />
              <Text style={styles.ratingText}>
                {provider.rating?.toFixed(1) || '4.5'} ({provider.completedJobs || 12} reviews)
              </Text>
            </View>
          </View>

          <View style={styles.priceRow}>
            <Text style={styles.priceVal}>
              {provider.hourlyRate ? `Rs.${provider.hourlyRate}.00` : 'Negotiable'}
            </Text>
            <Text style={styles.priceUnit}>{provider.hourlyRate ? '/hr' : ''}</Text>
          </View>
        </View>

        {/* About service */}
        <View style={styles.sectionBlock}>
          <Text style={styles.sectionTitle}>About Service</Text>
          <Text style={styles.aboutDescription}>
            {readMore 
              ? (provider.description || 'Verified KaamConnect specialist offering high-quality professional support. All tools included, background-checked, and highly rated across the local community.')
              : `${(provider.description || 'Verified KaamConnect specialist offering high-quality professional support. All tools included, background-checked, and highly rated.').substring(0, 120)}...`
            }
            <Text style={styles.readMoreText} onPress={() => setReadMore(!readMore)}>
              {readMore ? ' Read Less' : ' Read More'}
            </Text>
          </Text>
        </View>

        {/* Gallery Section */}
        <View style={styles.galleryBlock}>
          <View style={styles.galleryHeader}>
            <Text style={styles.sectionTitle}>Gallery</Text>
            <TouchableOpacity>
              <Text style={styles.viewAllText}>View all</Text>
            </TouchableOpacity>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.galleryContainer}>
            {galleryImages.map((img, idx) => (
              <Image key={idx} source={{ uri: img }} style={styles.galleryImage} />
            ))}
          </ScrollView>
        </View>
      </ScrollView>

      {/* Sticky Bottom Actions Container */}
      <View style={styles.bottomBar}>
        <View style={styles.bottomBarInner}>
          {/* Provider Mini Profile */}
          <View style={styles.providerRow}>
            <View style={styles.avatarWrapper}>
              {provider.profilePicture ? (
                <Image source={{ uri: provider.profilePicture }} style={styles.providerAvatar} />
              ) : (
                <View style={styles.avatarInitials}>
                  <Text style={styles.avatarInitialsText}>
                    {provider.name.charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
            </View>
            <View style={styles.providerInfo}>
              <Text style={styles.providerNameText} numberOfLines={1}>{provider.name}</Text>
              <Text style={styles.providerSubtitleText}>Service Partner</Text>
            </View>
          </View>

          {/* Chat and Call actions */}
          <View style={styles.contactActions}>
            <TouchableOpacity style={styles.circularContactBtn} onPress={handleChat}>
              <Ionicons name="chatbubble-ellipses-outline" size={20} color="#5271FF" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.circularContactBtn} onPress={handleCall}>
              <Ionicons name="call-outline" size={20} color="#5271FF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Book Now Button */}
        <TouchableOpacity style={styles.bookNowBtn} onPress={handleBook} activeOpacity={0.9}>
          <Text style={styles.bookNowBtnText}>Book Now</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  loadingText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
    marginTop: 12,
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
  circularBtnActive: {
    backgroundColor: '#5271FF',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 160,
  },
  bannerContainer: {
    width: '100%',
    height: 220,
    borderRadius: 24,
    overflow: 'hidden',
    marginTop: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  banner: {
    width: '100%',
    height: '100%',
  },
  detailsBlock: {
    marginTop: 18,
    paddingBottom: 18,
    borderBottomWidth: 1,
    borderColor: '#F1F5F9',
  },
  serviceTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  infoCol: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  infoText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
    maxWidth: '85%',
  },
  ratingText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 12,
  },
  priceVal: {
    fontSize: 20,
    fontWeight: '800',
    color: '#5271FF',
  },
  priceUnit: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
    marginLeft: 2,
  },
  sectionBlock: {
    marginTop: 18,
    paddingBottom: 18,
    borderBottomWidth: 1,
    borderColor: '#F1F5F9',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 8,
  },
  aboutDescription: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 19,
    fontWeight: '500',
  },
  readMoreText: {
    color: '#5271FF',
    fontWeight: '700',
  },
  galleryBlock: {
    marginTop: 18,
  },
  galleryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  viewAllText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '700',
  },
  galleryContainer: {
    gap: 12,
  },
  galleryImage: {
    width: 100,
    height: 100,
    borderRadius: 16,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: Platform.OS === 'ios' ? 32 : 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 10,
  },
  bottomBarInner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  providerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarWrapper: {
    marginRight: 10,
  },
  providerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  avatarInitials: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitialsText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#5271FF',
  },
  providerInfo: {
    flex: 1,
  },
  providerNameText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  providerSubtitleText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
    marginTop: 2,
  },
  contactActions: {
    flexDirection: 'row',
    gap: 8,
  },
  circularContactBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(82, 113, 255, 0.1)',
  },
  bookNowBtn: {
    backgroundColor: '#5271FF',
    borderRadius: 20,
    paddingVertical: 14,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#5271FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  bookNowBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
});
