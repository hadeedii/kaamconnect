import React, { useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function BookingSchedule() {
  const params = useLocalSearchParams<any>();
  
  const [selectedDate, setSelectedDate] = useState(0);
  const [selectedTime, setSelectedTime] = useState('11:00 AM');

  const dateStr = useMemo(() => {
    const today = new Date();
    const d = new Date();
    d.setDate(today.getDate() + selectedDate);
    return d.toISOString().split('T')[0];
  }, [selectedDate]);

  const next = () => {
    router.push({
      pathname: '/bookings/review',
      params: {
        ...params,
        dateStr,
        timeStr: selectedTime,
      }
    });
  };

  const getDateLabel = (daysFromToday: number) => {
    const date = new Date();
    date.setDate(date.getDate() + daysFromToday);

    if (daysFromToday === 0) {
      return `Today, ${date.getDate()} ${date.toLocaleDateString('en-US', { month: 'short' })}`;
    }

    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dayName = dayNames[date.getDay()];
    return `${dayName}, ${date.getDate()} ${date.toLocaleDateString('en-US', { month: 'short' })}`;
  };

  const timeSlots = [
    '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
    '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM',
    '05:00 PM', '06:00 PM', '07:00 PM'
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={22} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Select Date & Time</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Date Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Select Appointment Date</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.dateScrollContainer}
          >
            {[0, 1, 2, 3, 4, 5, 6].map((dayOffset) => (
              <TouchableOpacity
                key={dayOffset}
                onPress={() => setSelectedDate(dayOffset)}
                style={[
                  styles.dateChip,
                  selectedDate === dayOffset && styles.dateChipActive
                ]}
              >
                <Text style={[
                  styles.dateChipText,
                  selectedDate === dayOffset && styles.dateChipTextActive
                ]}>
                  {getDateLabel(dayOffset)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Time Slots */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Select Preferred Time</Text>
          <View style={styles.timeGrid}>
            {timeSlots.map((time) => (
              <TouchableOpacity
                key={time}
                onPress={() => setSelectedTime(time)}
                style={[
                  styles.timeChip,
                  selectedTime === time && styles.timeChipActive
                ]}
              >
                <Text style={[
                  styles.timeChipText,
                  selectedTime === time && styles.timeChipTextActive
                ]}>
                  {time}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Continue Button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity onPress={next} style={styles.continueButton} activeOpacity={0.9}>
          <Text style={styles.continueButtonText}>Review Booking Details</Text>
          <Ionicons name="arrow-forward" size={16} color="#FFFFFF" style={{ marginLeft: 6 }} />
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginTop: 24,
  },
  sectionLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 14,
  },
  dateScrollContainer: {
    gap: 10,
    paddingBottom: 4,
  },
  dateChip: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  dateChipActive: {
    backgroundColor: '#5271FF',
    borderColor: '#5271FF',
  },
  dateChipText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#475569',
  },
  dateChipTextActive: {
    color: '#FFFFFF',
  },
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  timeChip: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    minWidth: '29%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  timeChipActive: {
    backgroundColor: '#5271FF',
    borderColor: '#5271FF',
  },
  timeChipText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
  timeChipTextActive: {
    color: '#FFFFFF',
  },
  buttonContainer: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    paddingTop: 12,
  },
  continueButton: {
    backgroundColor: '#5271FF',
    borderRadius: 18,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#5271FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
});
