import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { colors, spacing, typography } from '../../src/lib/constants/theme';

export default function ServicesScreen() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Services</Text>
        <Text style={styles.subtitle}>
          Explorez nos services disponibles
        </Text>

        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>
            Liste des services a venir...
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  content: {
    padding: spacing.xl,
    paddingTop: 60,
  },
  title: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: 'bold',
    color: colors.gray[900],
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.fontSize.base,
    color: colors.gray[500],
    marginBottom: spacing['2xl'],
  },
  placeholder: {
    padding: spacing['2xl'],
    backgroundColor: colors.gray[50],
    borderRadius: 12,
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: typography.fontSize.base,
    color: colors.gray[400],
  },
});
