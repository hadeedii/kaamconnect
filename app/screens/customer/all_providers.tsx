import React, { useState, useEffect, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  FlatList, 
  TextInput, 
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { db } from '../../../firebase';
import { collection, getDocs } from 'firebase/firestore';
import { UserProfile } from '../../../context/AuthContext';

export default function AllProvidersScreen() {
  const router = useRouter();
  
  const [providers, setProviders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState<'rating' | 'experience' | 'price' | 'jobs'>('rating');
  const [showFiltersModal, setShowFiltersModal] = useState(false);
  const [minExperience, setMinExperience] = useState<number>(0);
  const [onlyCompanyAffiliated, setOnlyCompanyAffiliated] = useState(false);

  const categories = [
    "All",
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
    "Appliance Repair"
  ];

  useEffect(() => {
    const fetchProviders = async () => {
      try {
        const providersRef = collection(db, 'providers');
        const querySnapshot = await getDocs(providersRef);
        const fetchedList: any[] = [];
        querySnapshot.forEach((doc) => {
          fetchedList.push({ uid: doc.id, ...doc.data() });
        });
        setProviders(fetchedList);
      } catch (error) {
        console.error("Error fetching all providers:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProviders();
  }, []);

  // Filter & Sort computation
  const filteredProviders = useMemo(() => {
    return providers
      .filter((provider) => {
        // Search query check (name or category or description)
        const matchesSearch = 
          provider.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (provider.category && provider.category.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (provider.description && provider.description.toLowerCase().includes(searchQuery.toLowerCase()));

        // Category filter check
        const matchesCategory = selectedCategory === 'All' || provider.category === selectedCategory;

        // Experience filter check
        const matchesExperience = (provider.experience || 0) >= minExperience;

        // Company affiliation filter check
        const matchesCompany = !onlyCompanyAffiliated || provider.isCompanyAffiliated;

        return matchesSearch && matchesCategory && matchesExperience && matchesCompany;
      })
      .sort((a, b) => {
        if (sortBy === 'rating') {
          return (b.rating || 0) - (a.rating || 0);
        } else if (sortBy === 'experience') {
          return (b.experience || 0) - (a.experience || 0);
        } else if (sortBy === 'price') {
          // Sort lowest price first. Treat null pricing as very high so it goes last
          const priceA = a.hourlyRate ?? 999999;
          const priceB = b.hourlyRate ?? 999999;
          return priceA - priceB;
        } else if (sortBy === 'jobs') {
          return (b.completedJobs || 0) - (a.completedJobs || 0);
        }
        return 0;
      });
  }, [providers, searchQuery, selectedCategory, sortBy, minExperience, onlyCompanyAffiliated]);

  const resetFilters = () => {
    setMinExperience(0);
    setOnlyCompanyAffiliated(false);
    setSortBy('rating');
  };

  const renderProviderCard = ({ item }: { item: any }) => {
    return (
      <TouchableOpacity 
        style={styles.providerCard}
        activeOpacity={0.95}
        onPress={() => {
          router.push({
            pathname: '/screens/customer/provider_details' as any,
            params: { uid: item.uid }
          });
        }}
      >
        {/* Top Info row */}
        <View style={styles.cardHeaderRow}>
          <View style={styles.avatarContainer}>
            {item.profilePicture ? (
              <Image 
                source={{ uri: item.profilePicture }} 
                style={styles.avatarImage} 
              />
            ) : (
              <View style={styles.initialsAvatar}>
                <Text style={styles.initialsText}>
                  {item.name.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
            {item.isCompanyAffiliated && (
              <View style={styles.badgeCompany}>
                <Ionicons name="business" size={10} color="#FFFFFF" />
              </View>
            )}
          </View>

          <View style={styles.headerInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.providerName} numberOfLines={1}>{item.name}</Text>
              {item.isCompanyAffiliated && (
                <Text style={styles.companyNameText} numberOfLines={1}>
                  • {item.companyName}
                </Text>
              )}
            </View>
            
            <Text style={styles.providerCategoryText}>
              {item.category || 'General Service Partner'}
            </Text>

            <View style={styles.statsRow}>
              <View style={styles.ratingBadge}>
                <Ionicons name="star" size={12} color="#FBBF24" style={{ marginRight: 2 }} />
                <Text style={styles.ratingText}>{item.rating?.toFixed(1) || '4.8'}</Text>
              </View>
              <Text style={styles.statsText}>
                {item.experience || 3} Years Exp • {item.completedJobs || 0} Jobs Done
              </Text>
            </View>
          </View>

          <View style={styles.priceContainer}>
            <Text style={styles.priceVal}>
              {item.hourlyRate ? `Rs.${item.hourlyRate}` : 'Negotiable'}
            </Text>
            <Text style={styles.priceUnit}>{item.hourlyRate ? '/ hr' : ''}</Text>
          </View>
        </View>

        {/* Short description */}
        {item.description ? (
          <Text style={styles.descriptionText} numberOfLines={2}>
            {item.description}
          </Text>
        ) : null}

        {/* Operating Schedule */}
        <View style={styles.scheduleRow}>
          <Ionicons name="time-outline" size={14} color="#64748B" style={{ marginRight: 4 }} />
          <Text style={styles.scheduleText} numberOfLines={1}>
            {item.serviceHours || '09:00 AM - 06:00 PM'} • {item.serviceDays?.join(', ') || 'Mon-Fri'}
          </Text>
        </View>

        {/* Actions row */}
        <View style={styles.actionsRow}>
          <TouchableOpacity 
            style={styles.detailsBtn}
            onPress={() => {
              // Direct navigation to nearby map to view provider location
              router.push({
                pathname: '/screens/customer/nearby' as any,
                params: { category: item.category }
              });
            }}
          >
            <Ionicons name="location-outline" size={16} color="#5271FF" style={{ marginRight: 4 }} />
            <Text style={styles.detailsBtnText}>View on Map</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.bookBtn}
            onPress={() => {
              // Navigate to AI Agent loading screen to route/book this partner
              router.push({
                pathname: '/screens/customer/processing' as any,
                params: { query: item.category || 'Electrician' }
              });
            }}
          >
            <Text style={styles.bookBtnText}>Book Instantly</Text>
            <Ionicons name="arrow-forward" size={14} color="#FFFFFF" style={{ marginLeft: 4 }} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar style="dark" />
      
      {/* Custom Premium Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.circularBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={20} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>All Verified Partners</Text>
        <View style={{ width: 42 }} />
      </View>

      {/* Dynamic Search Bar & Sort Toggle */}
      <View style={styles.searchSection}>
        <View style={styles.searchBarWrapper}>
          <Ionicons name="search-outline" size={20} color="#94A3B8" style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name, category or skills..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color="#94A3B8" />
            </TouchableOpacity>
          ) : null}
        </View>
        <TouchableOpacity 
          style={[styles.filtersBtn, showFiltersModal && styles.filtersBtnActive]} 
          onPress={() => setShowFiltersModal(!showFiltersModal)}
          activeOpacity={0.8}
        >
          <Ionicons name="options-outline" size={20} color={showFiltersModal ? '#FFFFFF' : '#1E293B'} />
        </TouchableOpacity>
      </View>

      {/* Categories Horizontal Slider */}
      <View style={styles.categoriesSection}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={categories}
          keyExtractor={(item) => item}
          contentContainerStyle={styles.categoriesContainer}
          renderItem={({ item }) => {
            const isActive = selectedCategory === item;
            return (
              <TouchableOpacity
                style={[styles.categoryPill, isActive && styles.categoryPillActive]}
                onPress={() => setSelectedCategory(item)}
                activeOpacity={0.7}
              >
                <Text style={[styles.categoryText, isActive && styles.categoryTextActive]}>
                  {item}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* Expandable Advanced Filters Sheet */}
      {showFiltersModal && (
        <View style={styles.filtersSheet}>
          <View style={styles.filtersSheetHeader}>
            <Text style={styles.filtersSheetTitle}>Refine & Sort Partners</Text>
            <TouchableOpacity onPress={resetFilters}>
              <Text style={styles.resetFiltersText}>Reset All</Text>
            </TouchableOpacity>
          </View>

          {/* Sort By Options */}
          <Text style={styles.filterSectionTitle}>Sort results by</Text>
          <View style={styles.sortOptionsRow}>
            {(['rating', 'experience', 'price', 'jobs'] as const).map((option) => (
              <TouchableOpacity
                key={option}
                style={[styles.sortChip, sortBy === option && styles.sortChipActive]}
                onPress={() => setSortBy(option)}
                activeOpacity={0.7}
              >
                <Text style={[styles.sortChipText, sortBy === option && styles.sortChipTextActive]}>
                  {option === 'rating' ? '⭐ Rating' : 
                   option === 'experience' ? '💼 Experience' : 
                   option === 'price' ? '💵 Lowest Price' : '🔥 Popularity'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Experience Filter */}
          <Text style={styles.filterSectionTitle}>Minimum Experience</Text>
          <View style={styles.sortOptionsRow}>
            {([0, 2, 5, 10] as const).map((years) => (
              <TouchableOpacity
                key={years}
                style={[styles.sortChip, minExperience === years && styles.sortChipActive]}
                onPress={() => setMinExperience(years)}
                activeOpacity={0.7}
              >
                <Text style={[styles.sortChipText, minExperience === years && styles.sortChipTextActive]}>
                  {years === 0 ? 'Any Experience' : `${years}+ Years`}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Verification / Affiliation Toggle */}
          <View style={styles.toggleRow}>
            <View>
              <Text style={styles.toggleTitle}>Agency / Company Affiliated</Text>
              <Text style={styles.toggleSubtitle}>Show only providers registered under companies</Text>
            </View>
            <TouchableOpacity 
              style={[styles.customToggle, onlyCompanyAffiliated && styles.customToggleActive]}
              onPress={() => setOnlyCompanyAffiliated(!onlyCompanyAffiliated)}
              activeOpacity={0.8}
            >
              <View style={[styles.customToggleHandle, onlyCompanyAffiliated && styles.customToggleHandleActive]} />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Main Providers FlatList */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#5271FF" />
          <Text style={styles.loadingText}>Fetching professional partners...</Text>
        </View>
      ) : filteredProviders.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="people-outline" size={64} color="#94A3B8" />
          <Text style={styles.emptyTitle}>No matching providers found</Text>
          <Text style={styles.emptySubtitle}>
            Try widening your search queries or resetting your active filter selections.
          </Text>
          <TouchableOpacity style={styles.resetBigBtn} onPress={() => { setSelectedCategory('All'); setSearchQuery(''); resetFilters(); }}>
            <Text style={styles.resetBigBtnText}>Reset All Filters</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredProviders}
          keyExtractor={(item) => item.uid}
          renderItem={renderProviderCard}
          contentContainerStyle={styles.providersListContainer}
          showsVerticalScrollIndicator={false}
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
  searchSection: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    gap: 12,
    alignItems: 'center',
  },
  searchBarWrapper: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#1E293B',
    padding: 0,
  },
  filtersBtn: {
    width: 46,
    height: 46,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  filtersBtnActive: {
    backgroundColor: '#5271FF',
  },
  categoriesSection: {
    backgroundColor: '#FFFFFF',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderColor: '#E2E8F0',
  },
  categoriesContainer: {
    paddingHorizontal: 20,
    gap: 8,
  },
  categoryPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  categoryPillActive: {
    backgroundColor: '#EEF2FF',
    borderColor: '#5271FF',
  },
  categoryText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  categoryTextActive: {
    color: '#5271FF',
    fontWeight: '700',
  },
  filtersSheet: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  filtersSheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  filtersSheetTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  resetFiltersText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#EF4444',
  },
  filterSectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 10,
    marginTop: 8,
  },
  sortOptionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  sortChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sortChipActive: {
    backgroundColor: '#5271FF',
    borderColor: '#5271FF',
  },
  sortChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  sortChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderColor: '#F1F5F9',
    marginTop: 4,
  },
  toggleTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  toggleSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  customToggle: {
    width: 48,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#E2E8F0',
    padding: 2,
    justifyContent: 'center',
  },
  customToggleActive: {
    backgroundColor: '#10B981',
  },
  customToggleHandle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  customToggleHandleActive: {
    transform: [{ translateX: 22 }],
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#64748B',
    fontSize: 14,
    fontWeight: '500',
    marginTop: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 80,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1E293B',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 24,
  },
  resetBigBtn: {
    backgroundColor: '#5271FF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 16,
  },
  resetBigBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  providersListContainer: {
    padding: 20,
    gap: 16,
    paddingBottom: 40,
  },
  providerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 14,
  },
  avatarImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  initialsAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  initialsText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#5271FF',
  },
  badgeCompany: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#10B981',
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  headerInfo: {
    flex: 1,
    marginRight: 8,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  providerName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    maxWidth: '65%',
  },
  companyNameText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#10B981',
    maxWidth: '30%',
  },
  providerCategoryText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginRight: 8,
  },
  ratingText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#D97706',
  },
  statsText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  priceContainer: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  priceVal: {
    fontSize: 15,
    fontWeight: '800',
    color: '#5271FF',
  },
  priceUnit: {
    fontSize: 9,
    color: '#64748B',
    fontWeight: '600',
    marginTop: 2,
  },
  descriptionText: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 18,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderColor: '#F1F5F9',
  },
  scheduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  scheduleText: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '600',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  detailsBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EEF2FF',
    borderRadius: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(82, 113, 255, 0.1)',
  },
  detailsBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#5271FF',
  },
  bookBtn: {
    flex: 1.3,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#5271FF',
    borderRadius: 16,
    paddingVertical: 12,
    elevation: 3,
    shadowColor: '#5271FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  bookBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
