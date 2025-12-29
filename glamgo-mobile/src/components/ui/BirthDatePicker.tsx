/**
 * BirthDatePicker Component - GlamGo Mobile
 * Selecteur de date de naissance avec roues jour/mois/annee
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
} from 'react-native';
import { colors, spacing, typography, borderRadius } from '../../lib/constants/theme';

interface BirthDatePickerProps {
  value: Date | null;
  onChange: (date: Date) => void;
  label?: string;
  placeholder?: string;
  error?: string;
  minAge?: number;
  disabled?: boolean;
}

const MONTHS = [
  'Janvier', 'Fevrier', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Aout', 'Septembre', 'Octobre', 'Novembre', 'Decembre'
];

export default function BirthDatePicker({
  value,
  onChange,
  label,
  placeholder = 'Entrer votre date de naissance',
  error,
  minAge = 18,
  disabled = false,
}: BirthDatePickerProps) {
  const [showPicker, setShowPicker] = useState(false);

  // Calculate max year (minAge years ago)
  const currentYear = new Date().getFullYear();
  const maxYear = currentYear - minAge;
  const minYear = currentYear - 100;

  // Temporary selection state
  const [selectedDay, setSelectedDay] = useState(value?.getDate() || 1);
  const [selectedMonth, setSelectedMonth] = useState(value?.getMonth() || 0);
  const [selectedYear, setSelectedYear] = useState(value?.getFullYear() || maxYear);

  // Generate arrays
  const years = useMemo(() => {
    const arr = [];
    for (let y = maxYear; y >= minYear; y--) {
      arr.push(y);
    }
    return arr;
  }, [maxYear, minYear]);

  const days = useMemo(() => {
    const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
    const arr = [];
    for (let d = 1; d <= daysInMonth; d++) {
      arr.push(d);
    }
    return arr;
  }, [selectedYear, selectedMonth]);

  const formatDisplay = (): string => {
    if (!value) return placeholder;
    return value.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const handleOpen = () => {
    if (disabled) return;
    if (value) {
      setSelectedDay(value.getDate());
      setSelectedMonth(value.getMonth());
      setSelectedYear(value.getFullYear());
    } else {
      setSelectedDay(1);
      setSelectedMonth(0);
      setSelectedYear(maxYear);
    }
    setShowPicker(true);
  };

  const handleConfirm = () => {
    // Ensure day is valid for the selected month
    const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
    const validDay = Math.min(selectedDay, daysInMonth);

    const newDate = new Date(selectedYear, selectedMonth, validDay);
    onChange(newDate);
    setShowPicker(false);
  };

  return (
    <View style={styles.container}>
      {label && <Text style={[styles.label, error && styles.labelError]}>{label}</Text>}

      <TouchableOpacity
        style={[styles.input, error && styles.inputError, disabled && styles.inputDisabled]}
        onPress={handleOpen}
        activeOpacity={0.7}
        disabled={disabled}
      >
        <Text style={[styles.inputText, !value && styles.inputPlaceholder]}>
          {formatDisplay()}
        </Text>
        <Text style={styles.inputIcon}>📅</Text>
      </TouchableOpacity>

      {error && <Text style={styles.errorText}>{error}</Text>}

      <Text style={styles.hintText}>Vous devez avoir au moins {minAge} ans</Text>

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
              <Text style={styles.modalTitle}>Date de naissance</Text>
              <TouchableOpacity onPress={handleConfirm}>
                <Text style={styles.modalConfirm}>OK</Text>
              </TouchableOpacity>
            </View>

            {/* Picker Wheels */}
            <View style={styles.pickersContainer}>
              {/* Day Picker */}
              <View style={styles.pickerColumn}>
                <Text style={styles.pickerLabel}>Jour</Text>
                <ScrollView
                  style={styles.pickerScroll}
                  showsVerticalScrollIndicator={false}
                >
                  {days.map((day) => (
                    <TouchableOpacity
                      key={day}
                      style={[
                        styles.pickerItem,
                        selectedDay === day && styles.pickerItemSelected,
                      ]}
                      onPress={() => setSelectedDay(day)}
                    >
                      <Text style={[
                        styles.pickerItemText,
                        selectedDay === day && styles.pickerItemTextSelected,
                      ]}>
                        {day}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Month Picker */}
              <View style={[styles.pickerColumn, styles.pickerColumnLarge]}>
                <Text style={styles.pickerLabel}>Mois</Text>
                <ScrollView
                  style={styles.pickerScroll}
                  showsVerticalScrollIndicator={false}
                >
                  {MONTHS.map((month, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.pickerItem,
                        selectedMonth === index && styles.pickerItemSelected,
                      ]}
                      onPress={() => setSelectedMonth(index)}
                    >
                      <Text style={[
                        styles.pickerItemText,
                        selectedMonth === index && styles.pickerItemTextSelected,
                      ]}>
                        {month}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Year Picker */}
              <View style={styles.pickerColumn}>
                <Text style={styles.pickerLabel}>Annee</Text>
                <ScrollView
                  style={styles.pickerScroll}
                  showsVerticalScrollIndicator={false}
                >
                  {years.map((year) => (
                    <TouchableOpacity
                      key={year}
                      style={[
                        styles.pickerItem,
                        selectedYear === year && styles.pickerItemSelected,
                      ]}
                      onPress={() => setSelectedYear(year)}
                    >
                      <Text style={[
                        styles.pickerItemText,
                        selectedYear === year && styles.pickerItemTextSelected,
                      ]}>
                        {year}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>

            {/* Preview */}
            <View style={styles.preview}>
              <Text style={styles.previewLabel}>Date selectionnee:</Text>
              <Text style={styles.previewValue}>
                {selectedDay} {MONTHS[selectedMonth]} {selectedYear}
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
  labelError: {
    color: colors.error,
  },
  input: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.gray[300],
    borderRadius: borderRadius.md,
    paddingLeft: spacing.sm,
    paddingRight: spacing.sm,
    paddingVertical: spacing.sm,
    minHeight: 44,
  },
  inputError: {
    borderColor: colors.error,
  },
  inputDisabled: {
    backgroundColor: colors.gray[50],
    borderColor: colors.gray[200],
  },
  inputText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    color: colors.gray[900],
    marginRight: spacing.sm,
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
  hintText: {
    fontSize: typography.fontSize.xs,
    color: colors.gray[500],
    marginTop: spacing.xs,
    fontStyle: 'italic',
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

  // Pickers
  pickersContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.lg,
  },
  pickerColumn: {
    flex: 1,
    marginHorizontal: spacing.xs,
  },
  pickerColumnLarge: {
    flex: 1.5,
  },
  pickerLabel: {
    fontSize: typography.fontSize.xs,
    fontWeight: '600',
    color: colors.gray[500],
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  pickerScroll: {
    maxHeight: 200,
  },
  pickerItem: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.md,
    marginBottom: spacing.xs,
    alignItems: 'center',
  },
  pickerItemSelected: {
    backgroundColor: colors.primary,
  },
  pickerItemText: {
    fontSize: typography.fontSize.base,
    color: colors.gray[700],
  },
  pickerItemTextSelected: {
    color: colors.white,
    fontWeight: '600',
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
