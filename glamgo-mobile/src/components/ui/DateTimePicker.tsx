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
import { useLanguage } from '../../contexts/LanguageContext';

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
  placeholder,
  error,
}: DateTimePickerProps) {
  const { t, isRTL, language } = useLanguage();
  const [showPicker, setShowPicker] = useState(false);
  const [tempDate, setTempDate] = useState<Date>(value);

  // Get locale based on language
  const locale = language === 'ar' ? 'ar-MA' : language === 'en' ? 'en-GB' : 'fr-FR';
  const displayPlaceholder = placeholder || t('calendar.select');

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

  // Generate time slots (8h-23h, avec heures de nuit 20h-8h)
  const generateTimeSlots = () => {
    const slots: string[] = [];
    // Heures normales: 8h-20h
    for (let hour = 8; hour < 20; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        slots.push(time);
      }
    }
    // Heures de nuit: 20h-23h (+25%)
    for (let hour = 20; hour <= 23; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        slots.push(time);
      }
    }
    return slots;
  };

  // Verifier si c'est une heure de nuit (20h-8h)
  const isNightHour = (timeString: string): boolean => {
    const hour = parseInt(timeString.split(':')[0], 10);
    return hour >= 20 || hour < 8;
  };

  const formatDate = (date: Date): string => {
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    };
    return date.toLocaleDateString(locale, options);
  };

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString(locale, {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDisplay = (): string => {
    if (!value || value.getTime() === 0) return displayPlaceholder;

    switch (mode) {
      case 'date':
        return formatDate(value);
      case 'time':
        return formatTime(value);
      case 'datetime':
        return `${formatDate(value)} ${t('calendar.at')} ${formatTime(value)}`;
      default:
        return displayPlaceholder;
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
    if (isToday(date)) return t('calendar.today');
    if (isTomorrow(date)) return t('calendar.tomorrow');
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
            <View style={[styles.modalHeader, isRTL && styles.modalHeaderRTL]}>
              <TouchableOpacity onPress={() => setShowPicker(false)}>
                <Text style={styles.modalCancel}>{t('calendar.cancel')}</Text>
              </TouchableOpacity>
              <Text style={[styles.modalTitle, isRTL && styles.textRTL]}>
                {mode === 'date' && t('calendar.chooseDate')}
                {mode === 'time' && t('calendar.chooseTime')}
                {mode === 'datetime' && t('calendar.chooseDateAndTime')}
              </Text>
              <TouchableOpacity onPress={handleConfirm}>
                <Text style={styles.modalConfirm}>{t('calendar.confirm')}</Text>
              </TouchableOpacity>
            </View>

            {/* Date Picker */}
            {(mode === 'date' || mode === 'datetime') && (
              <View style={styles.dateSection}>
                <Text style={[styles.sectionTitle, isRTL && styles.textRTL]}>{t('calendar.date')}</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={[styles.datesScroll, isRTL && styles.datesScrollRTL]}
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
                          {date.toLocaleDateString(locale, { weekday: 'short' })}
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
                          {date.toLocaleDateString(locale, { month: 'short' })}
                        </Text>
                        {(isToday(date) || isTomorrow(date)) && (
                          <Text style={[
                            styles.dateLabel,
                            isSelected && styles.dateLabelSelected,
                          ]}>
                            {isToday(date) ? t('calendar.todayShort') : t('calendar.tomorrowShort')}
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
                <Text style={[styles.sectionTitle, isRTL && styles.textRTL]}>{t('calendar.time')}</Text>
                <ScrollView
                  style={styles.timesScroll}
                  showsVerticalScrollIndicator={false}
                >
                  <View style={[styles.timesGrid, isRTL && styles.timesGridRTL]}>
                    {generateTimeSlots().map((time, index) => {
                      const isSelected = formatTime(tempDate) === time;
                      const isNight = isNightHour(time);
                      return (
                        <TouchableOpacity
                          key={index}
                          style={[
                            styles.timeOption,
                            isNight && styles.timeOptionNight,
                            isSelected && styles.timeOptionSelected,
                          ]}
                          onPress={() => handleTimeSelect(time)}
                        >
                          <Text style={[
                            styles.timeText,
                            isNight && styles.timeTextNight,
                            isSelected && styles.timeTextSelected,
                          ]}>
                            {isNight ? `🌙 ${time}` : time}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                  {/* Legende */}
                  <View style={styles.timeLegend}>
                    <Text style={[styles.timeLegendText, isRTL && styles.textRTL]}>🌙 = {t('calendar.nightHour')}</Text>
                  </View>
                </ScrollView>
              </View>
            )}

            {/* Preview */}
            <View style={[styles.preview, isRTL && styles.previewRTL]}>
              <Text style={[styles.previewLabel, isRTL && styles.textRTL]}>{t('calendar.selection')}</Text>
              <Text style={[styles.previewValue, isRTL && styles.textRTL]}>
                {mode === 'datetime' && `${getDayLabel(tempDate)} ${t('calendar.at')} ${formatTime(tempDate)}`}
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
  timeOptionNight: {
    backgroundColor: '#1e1b4b', // Violet fonce pour la nuit
  },
  timeTextNight: {
    color: colors.white,
    fontSize: typography.fontSize.xs,
  },
  timeLegend: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
  },
  timeLegendText: {
    fontSize: typography.fontSize.xs,
    color: colors.gray[500],
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

  // RTL Styles
  modalHeaderRTL: {
    flexDirection: 'row-reverse',
  },
  textRTL: {
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  datesScrollRTL: {
    flexDirection: 'row-reverse',
  },
  timesGridRTL: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
  },
  previewRTL: {
    flexDirection: 'row-reverse',
  },
});
