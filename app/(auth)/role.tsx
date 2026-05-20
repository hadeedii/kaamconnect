import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

export default function RoleScreen() {
  const router = useRouter();

  const handleRoleSelect = (role: 'customer' | 'provider') => {
    router.push({
      pathname: '/(auth)/login',
      params: { role }
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Background Image (Top 60%) */}
      <Image 
        source={require('../../assets/onboarding/1.png')} 
        style={styles.image} 
        resizeMode="cover" 
      />

      {/* Butter-smooth transition stripes simulating a native gradient fade */}
      <View style={[styles.fadeStripe, { top: height * 0.46, opacity: 0.15 }]} />
      <View style={[styles.fadeStripe, { top: height * 0.48, opacity: 0.40 }]} />
      <View style={[styles.fadeStripe, { top: height * 0.50, opacity: 0.70 }]} />
      <View style={[styles.fadeStripe, { top: height * 0.52, opacity: 0.95 }]} />

      {/* Bottom Content Card */}
      <View style={styles.contentCard}>
        <View style={styles.textContainer}>
          <Text style={styles.appName}>KaamConnect</Text>
          <Text style={styles.tagline}>Har Kaam, Sahi Banda.</Text>
          <Text style={styles.description}>
            Autonomous service orchestration for the informal economy. Select your role below.
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.footer}>
          <TouchableOpacity 
            style={[styles.button, styles.customerButton]} 
            onPress={() => handleRoleSelect('customer')}
            activeOpacity={0.85}
          >
            <Ionicons name="person-outline" size={20} color="#fff" style={styles.buttonIcon} />
            <Text style={styles.buttonText}>Continue as Customer</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.button, styles.providerButton]} 
            onPress={() => handleRoleSelect('provider')}
            activeOpacity={0.85}
          >
            <Ionicons name="briefcase-outline" size={20} color="#5271FF" style={styles.buttonIcon} />
            <Text style={[styles.buttonText, styles.providerButtonText]}>Continue as Provider</Text>
          </TouchableOpacity>

          <Text style={styles.termsText}>
            By continuing, you agree to our Terms of Service & Privacy Policy
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  image: {
    width: width,
    height: height * 0.54,
    position: 'absolute',
    top: 0,
  },
  fadeStripe: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: height * 0.02,
    backgroundColor: '#FFFFFF',
    zIndex: 2,
  },
  contentCard: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: height * 0.48,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 36,
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 3,
  },
  textContainer: {
    alignItems: 'center',
    width: '100%',
  },
  appName: {
    fontSize: 28,
    fontWeight: '900',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 4,
  },
  tagline: {
    fontSize: 16,
    fontWeight: '700',
    color: '#5271FF',
    textAlign: 'center',
    marginBottom: 10,
  },
  description: {
    fontSize: 14,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 16,
  },
  footer: {
    width: '100%',
    gap: 12,
    alignItems: 'center',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingVertical: 16,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  customerButton: {
    backgroundColor: '#5271FF',
  },
  providerButton: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  providerButtonText: {
    color: '#5271FF',
  },
  termsText: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 6,
  },
});
