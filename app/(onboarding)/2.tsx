import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import {
    Dimensions,
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

const { width, height } = Dimensions.get('window');

export default function OnboardingScreen2() {
    const router = useRouter();

    const handleNext = () => {
        router.push('/(onboarding)/3' as any);
    };

    const handleSkip = () => {
        router.replace('/(auth)/role' as any);
    };

    return (
        <View style={styles.container}>
            <StatusBar style="dark" />

            {/* Background Image (Top 60%) */}
            <Image
                source={require('../../assets/onboarding/2.png')}
                style={styles.image}
                resizeMode="cover"
            />

            {/* Butter-smooth transition stripes simulating a native gradient fade */}
            <View style={[styles.fadeStripe, { top: height * 0.50, opacity: 0.15 }]} />
            <View style={[styles.fadeStripe, { top: height * 0.52, opacity: 0.40 }]} />
            <View style={[styles.fadeStripe, { top: height * 0.54, opacity: 0.70 }]} />
            <View style={[styles.fadeStripe, { top: height * 0.56, opacity: 0.95 }]} />

            {/* Top Segmented Progress Bar */}
            <View style={styles.progressBarContainer}>
                <View style={styles.progressSegment} />
                <View style={[styles.progressSegment, styles.activeSegment]} />
                <View style={styles.progressSegment} />
            </View>

            {/* Bottom Content Card */}
            <View style={styles.contentCard}>
                <View style={styles.textContainer}>
                    <Text style={styles.title}>Expert Services at{"\n"}Your Fingertips</Text>
                    <Text style={styles.description}>
                        Book highly rated service providers for any task with just a few taps.
                    </Text>
                </View>

                {/* Footer Buttons */}
                <View style={styles.footer}>
                    <TouchableOpacity
                        style={styles.button}
                        onPress={handleNext}
                        activeOpacity={0.85}
                    >
                        <Text style={styles.buttonText}>Next</Text>
                    </TouchableOpacity>

                    <View style={styles.loginContainer}>
                        <Text style={styles.loginText}>Already have an account? </Text>
                        <TouchableOpacity onPress={handleSkip} activeOpacity={0.6}>
                            <Text style={styles.loginLink}>Login</Text>
                        </TouchableOpacity>
                    </View>
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
        height: height * 0.58,
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
    progressBarContainer: {
        position: 'absolute',
        top: 50,
        left: 20,
        right: 20,
        flexDirection: 'row',
        gap: 6,
        zIndex: 10,
    },
    progressSegment: {
        flex: 1,
        height: 3,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        borderRadius: 2,
    },
    activeSegment: {
        backgroundColor: '#5271FF',
    },
    contentCard: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: height * 0.42,
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
    title: {
        fontSize: 26,
        fontWeight: '800',
        color: '#0F172A',
        textAlign: 'center',
        lineHeight: 34,
        marginBottom: 12,
    },
    description: {
        fontSize: 15,
        color: '#475569',
        textAlign: 'center',
        lineHeight: 22,
        paddingHorizontal: 16,
    },
    footer: {
        width: '100%',
        alignItems: 'center',
        gap: 16,
    },
    button: {
        backgroundColor: '#5271FF',
        width: '100%',
        paddingVertical: 16,
        borderRadius: 30,
        alignItems: 'center',
        shadowColor: '#5271FF',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 4,
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },
    loginContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    loginText: {
        color: '#64748B',
        fontSize: 14,
    },
    loginLink: {
        color: '#5271FF',
        fontSize: 14,
        fontWeight: '700',
    },
});
