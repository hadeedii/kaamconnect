import { Tabs } from 'expo-router';
import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Image } from 'expo-image';
import { ActivityIndicator, View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, { LinearTransition, FadeIn, FadeOut } from 'react-native-reanimated';

const homeIcon = require('../../assets/icons/home.png');
const chatIcon = require('../../assets/icons/chat.png');
const bookingIcon = require('../../assets/icons/booking.png');
const profileIcon = require('../../assets/icons/profile.png');


function CustomTabBar({ state, descriptors, navigation, isCustomer, isProvider }: any) {
  if (!isCustomer && !isProvider) {
    return null;
  }

  // Filter routes to show only active role tabs and exclude hidden ones
  const visibleRoutes = state.routes.filter((route: any) => {
    const descriptor = descriptors[route.key];
    if (descriptor.options.href === null) return false;
    if (isCustomer && !route.name.startsWith('customer/')) return false;
    if (isProvider && !route.name.startsWith('provider/')) return false;
    return true;
  });

  if (visibleRoutes.length === 0) return null;

  return (
    <View style={styles.tabBarContainer}>
      {visibleRoutes.map((route: any) => {
        const descriptor = descriptors[route.key];
        const isFocused = state.routes.indexOf(route) === state.index;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        // Determine icon source asset and display label
        let iconSource = homeIcon;
        let displayLabel = 'Home';

        if (route.name.includes('home') || route.name.includes('Dashboard')) {
          iconSource = homeIcon;
          displayLabel = isCustomer ? 'Home' : 'Dashboard';
        } else if (route.name.includes('chat') || route.name.includes('Chats')) {
          iconSource = chatIcon;
          displayLabel = 'Chats';
        } else if (route.name.includes('bookings') || route.name.includes('Bookings')) {
          iconSource = bookingIcon;
          displayLabel = isCustomer ? 'Bookings' : 'Jobs';
        } else if (route.name.includes('profile') || route.name.includes('Profile')) {
          iconSource = profileIcon;
          displayLabel = 'Profile';
        }

        return (
          <Animated.View
            key={route.key}
            layout={LinearTransition.springify().damping(16).stiffness(120)}
            style={isFocused ? styles.activeTabWrapper : styles.inactiveTabWrapper}
          >
            <Pressable
              onPress={onPress}
              style={styles.tabButton}
            >
              <Image 
                source={iconSource} 
                style={{ width: 18, height: 18, tintColor: isFocused ? '#000000' : '#94A3B8' }} 
              />
              {isFocused && (
                <Animated.Text
                  entering={FadeIn.duration(200)}
                  exiting={FadeOut.duration(200)}
                  style={styles.activeTabText}
                  numberOfLines={1}
                >
                  {displayLabel}
                </Animated.Text>
              )}
            </Pressable>
          </Animated.View>
        );
      })}
    </View>
  );
}

export default function TabLayout() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" color="#5271FF" />
      </View>
    );
  }

  const isCustomer = user?.role === 'customer';
  const isProvider = user?.role === 'provider';

  return (
    <Tabs
      tabBar={(props) => (
        <CustomTabBar 
          {...props} 
          isCustomer={isCustomer} 
          isProvider={isProvider} 
        />
      )}
      screenOptions={{
        headerShown: false,
      }}
    >
      {/* Index redirect route - hidden */}
      <Tabs.Screen
        name="index"
        options={{
          href: null,
        }}
      />

      {/* Explore route - hidden */}
      <Tabs.Screen
        name="explore"
        options={{
          href: null,
        }}
      />

      {/* CUSTOMER TABS */}
      <Tabs.Screen
        name="customer/home"
        options={{
          title: 'Home',
          href: isCustomer ? '/customer/home' : null,
        }}
      />

      <Tabs.Screen
        name="customer/chat"
        options={{
          title: 'Chats',
          href: isCustomer ? '/customer/chat' : null,
        }}
      />

      <Tabs.Screen
        name="customer/bookings"
        options={{
          title: 'Bookings',
          href: isCustomer ? '/customer/bookings' : null,
        }}
      />

      <Tabs.Screen
        name="customer/profile"
        options={{
          title: 'Profile',
          href: isCustomer ? '/customer/profile' : null,
        }}
      />

      {/* PROVIDER TABS */}
      <Tabs.Screen
        name="provider/Dashboard"
        options={{
          title: 'Dashboard',
          href: isProvider ? '/provider/Dashboard' : null,
        }}
      />

      <Tabs.Screen
        name="provider/Bookings"
        options={{
          title: 'Jobs',
          href: isProvider ? '/provider/Bookings' : null,
        }}
      />

      <Tabs.Screen
        name="provider/Chats"
        options={{
          title: 'Inbox',
          href: isProvider ? '/provider/Chats' : null,
        }}
      />

      <Tabs.Screen
        name="provider/Profile"
        options={{
          title: 'Profile',
          href: isProvider ? '/provider/Profile' : null,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBarContainer: {
    position: 'absolute',
    bottom: 24,
    left: 20,
    right: 20,
    backgroundColor: '#E5E7EB', // light gray background matching the screenshot
    borderRadius: 40,
    height: 68,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 5,
  },
  activeTabWrapper: {
    flex: 1.8,
    height: 48,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    marginHorizontal: 4,
    // Add subtle shadow to the active pill
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  inactiveTabWrapper: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    marginHorizontal: 4,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: '100%',
    width: '100%',
    paddingHorizontal: 8,
  },
  activeTabText: {
    color: '#000000',
    fontWeight: '700',
    fontSize: 14,
  },
});
