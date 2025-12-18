/**
 * DateTimePicker Component - GlamGo Mobile
 * Selecteur de date et heure natif avec modal
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Platform,
} from 'react-native';
import { colors, spacing, typography, borderRadius, shadows } from '../../lib/constants/theme';

interface DateTimePickerProps {
  mode: 'date' | 'time' | 'datetime';
  value: Date;
  onChange: (date: Date) => void;
  minDate?: Date;
  maxDate?: Date;
  label?: string;
  placeholder?: string;
  error?: string;
}

export default function DateTimePicker({
  mode,
  value,
  onChange,
  minDate,
  maxDate,
  label,
  placeholder = 'Selectionner',
  error,
}: DateTimePickerProps) {
  const [showPicker, setShowPicker] = useState(false);
  const [tempDate, setTempDate] = useState<Date>(value);

  // Generate date options
  const generateDates = () => {
    const dates: Date[] = [];
    const start = minDate || new Date();
    const end = maxDate || new Date(start.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days

    const current = new Date(start);
    current.setHours(0, 0, 0, 0);

    while (current <= end) {
      dates.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }

    return dates;
  };

  // Generate time slots
  const generateTimeSlots = () => {
    const slots: string[] = [];
    for (let hour = 8; hour < 20; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        slots.push(time);
      }
    }
    return slots;
  };

  const formatDate = (date: Date): string => {
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    };
    return date.toLocaleDateString('fr-FR', options);
  };

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDisplay = (): string => {
    if (!value || value.getTime() === 0) return placeholder;

    switch (mode) {
      case 'date':
        return formatDate(value);
      case 'time':
        return formatTime(value);
      case 'datetime':
        return `${formatDate(value)} a ${formatTime(value)}`;
      default:
        return placeholder;
    }
  };

  const handleDateSelect = (date: Date) => {
    const newDate = new Date(tempDate);
    newDate.setFullYear(date.getFullYear());
    newDate.setMonth(date.getMonth());
    newDate.setDate(date.getDate());
    setTempDate(newDate);
  };

  const handleTimeSelect = (timeString: string) => {
    const [hours, minutes] = timeString.split(':').map(Number);
    const newDate = new Date(tempDate);
    newDate.setHours(hours);
    newDate.setMinutes(minutes);
    setTempDate(newDate);
  };

  const handleConfirm = () => {
    onChange(tempDate);
    setShowPicker(false);
  };

  const isToday = (date: Date): boolean => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const isTomorrow = (date: Date): boolean => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return (
      date.getDate() === tomorrow.getDate() &&
      date.getMonth() === tomorrow.getMonth() &&
      date.getFullYear() === tomorrow.getFullYear()
    );
  };

  const getDayLabel = (date: Date): string => {
    if (isToday(date)) return "Aujourd'hui";
    if (isTomorrow(date)) return 'Demain';
    return formatDate(date);
  };

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}

      <TouchableOpacity
        style={[styles.input, error && styles.inputError]}
        onPress={() => {
          setTempDate(value || new Date());
          setShowPicker(true);
        }}
        activeOpacity={0.7}
      >
        <Text style={[
          styles.inputText,
          !value && styles.inputPlaceholder,
        ]}>
          {formatDisplay()}
        </Text>
        <Text style={styles.inputIcon}>
          {mode === 'time' ? '🕐' : '📅'}
        </Text>
      </TouchableOpacity>

      {error && <Text style={styles.errorText}>{error}</Text>}

      {/* Picker Modal */}
      <Modal
        visible={showPicker}
        animationType="slide"
        transparent
        onRequestClose={() => setShowPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowPicker(false)}>
                <Text style={styles.modalCancel}>Annuler</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>
                {mode === 'date' && 'Choisir une date'}
                {mode === 'time' && 'Choisir une heure'}
                {mode === 'datetime' && 'Choisir date et heure'}
              </Text>
              <TouchableOpacity onPress={handleConfirm}>
                <Text style={styles.modalConfirm}>OK</Text>
              </TouchableOpacity>
            </View>

            {/* Date Picker */}
            {(mode === 'date' || mode === 'datetime') && (
              <View style={styles.dateSection}>
                <Text style={styles.sectionTitle}>Date</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.datesScroll}
                >
                  {generateDates().map((date, index) => {
                    const isSelected =
                      tempDate.toDateString() === date.toDateString();
                    return (
                      <TouchableOpacity
                        key={index}
                        style={[
                          styles.dateOption,
                          isSelected && styles.dateOptionSelected,
                        ]}
                        onPress={() => handleDateSelect(date)}
                      >
                        <Text style={[
                          styles.dateDay,
                          isSelected && styles.dateDaySelected,
                        ]}>
                          {date.toLocaleDateString('fr-FR', { weekday: 'short' })}
                        </Text>
                        <Text style={[
                          styles.dateNumber,
                          isSelected && styles.dateNumberSelected,
                        ]}>
                          {date.getDate()}
                        </Text>
                        <Text style={[
                          styles.dateMonth,
                          isSelected && styles.dateMonthSelected,
                        ]}>
                          {date.toLocaleDateString('fr-FR', { month: 'short' })}
                        </Text>
                        {(isToday(date) || isTomorrow(date)) && (
                          <Text style={[
                            styles.dateLabel,
                            isSelected && styles.dateLabelSelected,
                          ]}>
                            {isToday(date) ? "Auj." : "Dem."}
                          </Text>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            )}

            {/* Time Picker */}
            {(mode === 'time' || mode === 'datetime') && (
              <View style={styles.timeSection}>
                <Text style={styles.sectionTitle}>Heure</Text>
                <ScrollView
                  style={styles.timesScroll}
                  showsVerticalScrollIndicator={false}
                >
                  <View style={styles.timesGrid}>
                    {generateTimeSlots().map((time, index) => {
                      const isSelected = formatTime(tempDate) === time;
                      return (
                        <TouchableOpacity
                          key={index}
                          style={[
                            styles.timeOption,
                            isSelected && styles.timeOptionSelected,
                          ]}
                          onPress={() => handleTimeSelect(time)}
                        >
                          <Text style={[
                            styles.timeText,
                            isSelected && styles.timeTextSelected,
                          ]}>
                            {time}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </ScrollView>
              </View>
            )}

            {/* Preview */}
            <View style={styles.preview}>
              <Text style={styles.previewLabel}>Selection:</Text>
              <Text style={styles.previewValue}>
                {mode === 'datetime' && `${getDayLabel(tempDate)} a ${formatTime(tempDate)}`}
                {mode === 'date' && getDayLabel(tempDate)}
                {mode === 'time' && formatTime(tempDate)}
              </Text>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    color: colors.gray[700],
    marginBottom: spacing.xs,
  },
  input: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.gray[300],
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    minHeight: 48,
  },
  inputError: {
    borderColor: colors.error,
  },
  inputText: {
    fontSize: typography.fontSize.base,
    color: colors.gray[900],
  },
  inputPlaceholder: {
    color: colors.gray[400],
  },
  inputIcon: {
    fontSize: 18,
  },
  errorText: {
    fontSize: typography.fontSize.xs,
    color: colors.error,
    marginTop: spacing.xs,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    paddingBottom: spacing['2xl'],
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  modalTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
    color: colors.gray[900],
  },
  modalCancel: {
    fontSize: typography.fontSize.base,
    color: colors.gray[600],
  },
  modalConfirm: {
    fontSize: typography.fontSize.base,
    color: colors.primary,
    fontWeight: '600',
  },

  // Date Section
  dateSection: {
    paddingVertical: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    color: colors.gray[600],
    marginBottom: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  datesScroll: {
    paddingHorizontal: spacing.md,
  },
  dateOption: {
    width: 70,
    paddingVertical: spacing.md,
    marginHorizontal: spacing.xs,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.gray[100],
    alignItems: 'center',
  },
  dateOptionSelected: {
    backgroundColor: colors.primary,
  },
  dateDay: {
    fontSize: typography.fontSize.xs,
    color: colors.gray[600],
    textTransform: 'capitalize',
    marginBottom: 4,
  },
  dateDaySelected: {
    color: colors.white,
  },
  dateNumber: {
    fontSize: typography.fontSize.xl,
    fontWeight: 'bold',
    color: colors.gray[900],
    marginBottom: 2,
  },
  dateNumberSelected: {
    color: colors.white,
  },
  dateMonth: {
    fontSize: typography.fontSize.xs,
    color: colors.gray[600],
    textTransform: 'capitalize',
  },
  dateMonthSelected: {
    color: colors.white,
  },
  dateLabel: {
    fontSize: 9,
    color: colors.primary,
    fontWeight: '600',
    marginTop: 4,
  },
  dateLabelSelected: {
    color: colors.white,
  },

  // Time Section
  timeSection: {
    paddingVertical: spacing.lg,
    maxHeight: 200,
  },
  timesScroll: {
    paddingHorizontal: spacing.lg,
  },
  timesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  timeOption: {
    width: '23%',
    paddingVertical: spacing.sm,
    marginHorizontal: '1%',
    marginBottom: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.gray[100],
    alignItems: 'center',
  },
  timeOptionSelected: {
    backgroundColor: colors.primary,
  },
  timeText: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[900],
    fontWeight: '500',
  },
  timeTextSelected: {
    color: colors.white,
  },

  // Preview
  preview: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    marginHorizontal: spacing.lg,
    backgroundColor: colors.gray[50],
    borderRadius: borderRadius.md,
  },
  previewLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[600],
    marginRight: spacing.sm,
  },
  previewValue: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    color: colors.gray[900],
  },
});
