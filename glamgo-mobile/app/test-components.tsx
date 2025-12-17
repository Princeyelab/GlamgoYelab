import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { Link } from 'expo-router';
import Button from '../src/components/ui/Button';
import Input from '../src/components/ui/Input';
import { colors, spacing, typography } from '../src/lib/constants/theme';

export default function TestComponentsScreen() {
  const [textValue, setTextValue] = useState('');
  const [emailValue, setEmailValue] = useState('');
  const [passwordValue, setPasswordValue] = useState('');
  const [phoneValue, setPhoneValue] = useState('');
  const [errorValue, setErrorValue] = useState('test@error');

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Test Composants UI</Text>
        <Link href="/">
          <Text style={styles.backText}>← Retour</Text>
        </Link>
      </View>

      {/* BUTTON SECTION */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Button - Variants</Text>

        <Button variant="primary" onPress={() => Alert.alert('Primary!')}>
          Primary Button
        </Button>

        <View style={styles.spacer} />

        <Button variant="secondary" onPress={() => Alert.alert('Secondary!')}>
          Secondary Button
        </Button>

        <View style={styles.spacer} />

        <Button variant="outline" onPress={() => Alert.alert('Outline!')}>
          Outline Button
        </Button>

        <View style={styles.spacer} />

        <Button variant="ghost" onPress={() => Alert.alert('Ghost!')}>
          Ghost Button
        </Button>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Button - Sizes</Text>

        <Button size="sm" onPress={() => Alert.alert('Small')}>
          Small Button
        </Button>

        <View style={styles.spacer} />

        <Button size="md" onPress={() => Alert.alert('Medium')}>
          Medium Button
        </Button>

        <View style={styles.spacer} />

        <Button size="lg" onPress={() => Alert.alert('Large')}>
          Large Button
        </Button>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Button - States</Text>

        <Button disabled onPress={() => {}}>
          Disabled Button
        </Button>

        <View style={styles.spacer} />

        <Button loading onPress={() => {}}>
          Loading Button
        </Button>

        <View style={styles.spacer} />

        <Button fullWidth onPress={() => Alert.alert('Full Width')}>
          Full Width Button
        </Button>
      </View>

      {/* INPUT SECTION */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Input - Types</Text>

        <Input
          label="Text Input"
          placeholder="Entrez votre texte"
          value={textValue}
          onChangeText={setTextValue}
          helperText="Texte d'aide sous l'input"
        />

        <Input
          label="Email"
          type="email"
          placeholder="exemple@email.com"
          value={emailValue}
          onChangeText={setEmailValue}
        />

        <Input
          label="Mot de passe"
          type="password"
          placeholder="••••••••"
          value={passwordValue}
          onChangeText={setPasswordValue}
          helperText="Minimum 8 caractères"
        />

        <Input
          label="Téléphone"
          type="phone"
          placeholder="+212 6XX XXX XXX"
          value={phoneValue}
          onChangeText={setPhoneValue}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Input - States</Text>

        <Input
          label="Input avec erreur"
          placeholder="Email invalide"
          value={errorValue}
          onChangeText={setErrorValue}
          error
          errorText="Format d'email invalide"
        />

        <Input
          label="Input succès"
          placeholder="Email valide"
          value="valide@email.com"
          onChangeText={() => {}}
          success
        />

        <Input
          label="Input disabled"
          placeholder="Désactivé"
          value="Non modifiable"
          onChangeText={() => {}}
          disabled
        />
      </View>

      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  header: {
    padding: spacing.xl,
    paddingTop: 60,
    backgroundColor: colors.gray[50],
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  title: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: 'bold',
    color: colors.gray[900],
    marginBottom: spacing.md,
  },
  backText: {
    fontSize: typography.fontSize.base,
    color: colors.primary,
    fontWeight: '600',
  },
  section: {
    padding: spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: 'bold',
    color: colors.gray[900],
    marginBottom: spacing.lg,
  },
  spacer: {
    height: spacing.md,
  },
  bottomSpacer: {
    height: 40,
  },
});
