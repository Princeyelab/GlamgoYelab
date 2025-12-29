import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Modal,
  Keyboard,
} from 'react-native';
import { useRouter } from 'expo-router';
import Button from '../../src/components/ui/Button';
import Input from '../../src/components/ui/Input';
import TermsModal from '../../src/components/ui/TermsModal';
import BirthDatePicker from '../../src/components/ui/BirthDatePicker';
import WelcomePopup from '../../src/components/ui/WelcomePopup';
import AddressAutocomplete, { AddressData } from '../../src/components/features/AddressAutocomplete';
import PaymentMethodSelector, { PaymentMethod } from '../../src/components/features/PaymentMethodSelector';
import CreditCardForm, { CardData } from '../../src/components/features/CreditCardForm';
import { colors, spacing, typography, borderRadius, shadows } from '../../src/lib/constants/theme';
import { useAppDispatch, useAppSelector } from '../../src/lib/store/hooks';
import { registerUser, clearError, selectAuth } from '../../src/lib/store/slices/authSlice';
import { toggleFavorite } from '../../src/lib/store/slices/servicesSlice';
import { getCategories, getCategoriesWithServices } from '../../src/lib/api/servicesAPI';
import { Category, Service } from '../../src/types/service';

type Step = 1 | 2 | 3 | 4;

const STEPS = [
  { number: 1, label: 'Infos' },
  { number: 2, label: 'Adresse' },
  { number: 3, label: 'Paiement' },
  { number: 4, label: 'Preferences' },
];

const CITIES = [
  { value: '', label: 'Selectionnez une ville' },
  { value: 'Casablanca', label: 'Casablanca' },
  { value: 'Rabat', label: 'Rabat' },
  { value: 'Marrakech', label: 'Marrakech' },
  { value: 'Fes', label: 'Fes' },
  { value: 'Tanger', label: 'Tanger' },
  { value: 'Agadir', label: 'Agadir' },
  { value: 'Meknes', label: 'Meknes' },
  { value: 'Oujda', label: 'Oujda' },
  { value: 'Kenitra', label: 'Kenitra' },
  { value: 'Tetouan', label: 'Tetouan' },
  { value: 'Safi', label: 'Safi' },
  { value: 'Mohammedia', label: 'Mohammedia' },
  { value: 'El Jadida', label: 'El Jadida' },
  { value: 'Khouribga', label: 'Khouribga' },
  { value: 'Beni Mellal', label: 'Beni Mellal' },
  { value: 'Nador', label: 'Nador' },
];

export default function SignupClientScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { isAuthenticated, isLoading, error } = useAppSelector(selectAuth);

  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [showWelcomePopup, setShowWelcomePopup] = useState(false);

  // Step 1: Personal Info
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [birthDate, setBirthDate] = useState<Date | null>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [termsAcceptedAt, setTermsAcceptedAt] = useState<string | null>(null);

  // Step 2: Address
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [showCityPicker, setShowCityPicker] = useState(false);
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);

  // Step 3: Payment
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');
  const [cardData, setCardData] = useState<CardData>({
    cardNumber: '',
    expMonth: '',
    expYear: '',
    cvv: '',
  });

  // Step 4: Preferences (Services from API)
  const [selectedServices, setSelectedServices] = useState<number[]>([]);
  const [categoriesWithServices, setCategoriesWithServices] = useState<(Category & { services: Service[] })[]>([]);
  const [loadingServices, setLoadingServices] = useState(false);

  // Error states
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load services from API when reaching step 4
  useEffect(() => {
    if (currentStep === 4 && categoriesWithServices.length === 0) {
      loadServicesFromAPI();
    }
  }, [currentStep]);

  // Services identiques a la web app (28 services)
  const MOCK_SERVICES = [
    {
      id: 1,
      name: 'Beaute',
      color: '#E91E63',
      services: [
        { id: 1, title: 'Coiffure Classique' },
        { id: 2, title: 'Coiffure Express' },
        { id: 3, title: 'Coiffure Homme Premium' },
        { id: 4, title: 'Coiffure Homme Simple' },
        { id: 5, title: 'Coiffure Mariage & Evenement' },
        { id: 6, title: 'Pack Coiffure + Barbe' },
        { id: 7, title: 'Taille de Barbe' },
      ],
    },
    {
      id: 2,
      name: 'Maison',
      color: '#4CAF50',
      services: [
        { id: 8, title: 'Chef a Domicile - 2 Personnes' },
        { id: 9, title: 'Chef a Domicile - 4 Personnes' },
        { id: 10, title: 'Chef a Domicile - 8 Personnes' },
        { id: 11, title: 'Jardinage' },
        { id: 12, title: 'Menage' },
        { id: 13, title: 'Petits Bricolages' },
      ],
    },
    {
      id: 3,
      name: 'Voiture',
      color: '#2196F3',
      services: [
        { id: 14, title: 'Nettoyage Auto Complet' },
        { id: 15, title: 'Nettoyage Auto Externe' },
        { id: 16, title: 'Nettoyage Auto Interne' },
      ],
    },
    {
      id: 4,
      name: 'Animaux',
      color: '#FF9800',
      services: [
        { id: 17, title: 'Gardiennage d\'Animaux' },
        { id: 18, title: 'Promenade d\'Animaux' },
      ],
    },
    {
      id: 5,
      name: 'Bien-etre',
      color: '#9C27B0',
      services: [
        { id: 19, title: 'Coach Sportif' },
        { id: 20, title: 'Danse Orientale' },
        { id: 21, title: 'Hammam & Gommage' },
        { id: 22, title: 'Massage Relaxant' },
        { id: 23, title: 'Soin Premium Argan' },
        { id: 24, title: 'Yoga' },
      ],
    },
    {
      id: 6,
      name: 'Epilation Femme',
      color: '#F06292',
      services: [
        { id: 25, title: 'Full Smooth Femme' },
        { id: 26, title: 'Smooth Femme' },
      ],
    },
    {
      id: 7,
      name: 'Epilation Homme',
      color: '#7986CB',
      services: [
        { id: 27, title: 'Full Smooth Homme' },
        { id: 28, title: 'Smooth Homme' },
      ],
    },
  ];

  const loadServicesFromAPI = async () => {
    setLoadingServices(true);
    try {
      const data = await getCategoriesWithServices();
      console.log('API categories with services:', JSON.stringify(data, null, 2));

      // Verifier si on a des categories avec des services
      const hasServices = data && data.length > 0 && data.some(cat => cat.services && cat.services.length > 0);

      if (hasServices) {
        setCategoriesWithServices(data);
      } else {
        console.log('No services from API, using mock data');
        setCategoriesWithServices(MOCK_SERVICES as any);
      }
    } catch (err) {
      console.error('API error - using mock services:', err);
      setCategoriesWithServices(MOCK_SERVICES as any);
    } finally {
      setLoadingServices(false);
    }
  };

  // Note: La redirection se fait maintenant dans handleWelcomeClose apres le popup

  useEffect(() => {
    if (error) {
      dispatch(clearError());
    }
  }, [firstName, lastName, email, phone, password, confirmPassword]);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone: string) => {
    const cleanPhone = phone.replace(/[\s-]/g, '');
    return /^(06|07)[0-9]{8}$/.test(cleanPhone);
  };

  const validateAge = (date: Date | null) => {
    if (!date) return false;
    const today = new Date();
    const age = today.getFullYear() - date.getFullYear();
    const monthDiff = today.getMonth() - date.getMonth();
    const dayDiff = today.getDate() - date.getDate();
    return age > 18 || (age === 18 && (monthDiff > 0 || (monthDiff === 0 && dayDiff >= 0)));
  };

  const validateStep1 = () => {
    const newErrors: Record<string, string> = {};

    if (!firstName.trim() || firstName.length < 2) {
      newErrors.firstName = 'Prenom requis (min 2 caracteres)';
    }
    if (!lastName.trim() || lastName.length < 2) {
      newErrors.lastName = 'Nom requis (min 2 caracteres)';
    }
    if (!email.trim()) {
      newErrors.email = 'Email requis';
    } else if (!validateEmail(email)) {
      newErrors.email = 'Email invalide';
    }
    if (!phone.trim()) {
      newErrors.phone = 'Telephone requis';
    } else if (!validatePhone(phone)) {
      newErrors.phone = 'Format: 06/07 suivi de 8 chiffres';
    }
    if (!birthDate) {
      newErrors.birthDate = 'Date de naissance requise';
    } else if (!validateAge(birthDate)) {
      newErrors.birthDate = 'Vous devez avoir au moins 18 ans';
    }
    if (!password || password.length < 6) {
      newErrors.password = 'Mot de passe requis (min 6 caracteres)';
    }
    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Les mots de passe ne correspondent pas';
    }
    if (!acceptTerms) {
      newErrors.acceptTerms = 'Vous devez accepter les conditions';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors: Record<string, string> = {};

    if (!address.trim()) {
      newErrors.address = 'Adresse requise';
    }
    // Si pas de geolocalisation, utiliser position Marrakech par defaut (mode dev)
    if (!latitude || !longitude) {
      // Position simulee Marrakech pour le developpement
      setLatitude(31.6295);
      setLongitude(-7.9811);
    }
    if (!city) {
      newErrors.city = 'Ville requise';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (currentStep === 1 && !validateStep1()) return;
    if (currentStep === 2 && !validateStep2()) return;

    // Passer simplement a l'etape suivante (pas d'inscription ici)
    if (currentStep < 4) {
      setCurrentStep((currentStep + 1) as Step);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((currentStep - 1) as Step);
    } else {
      router.push('/');
    }
  };

  const handleTermsChange = (checked: boolean) => {
    setAcceptTerms(checked);
    if (checked) {
      setTermsAcceptedAt(new Date().toISOString());
    } else {
      setTermsAcceptedAt(null);
    }
    if (errors.acceptTerms) {
      setErrors(prev => ({ ...prev, acceptTerms: '' }));
    }
  };

  const handleAddressSelect = (addressData: AddressData) => {
    setAddress(addressData.formatted);
    if (addressData.coords) {
      setLatitude(addressData.coords.latitude);
      setLongitude(addressData.coords.longitude);
    }
    if (addressData.city) {
      setCity(addressData.city);
    }
    if (errors.address) {
      setErrors(prev => ({ ...prev, address: '' }));
    }
  };

  const handleFinalizeRegistration = async () => {
    // Validate at least one service is selected
    if (selectedServices.length === 0) {
      setErrors(prev => ({ ...prev, services: 'Veuillez selectionner au moins un service' }));
      return;
    }

    // Clear any service errors
    setErrors(prev => ({ ...prev, services: '' }));

    // Afficher popup de bienvenue SANS faire l'API call maintenant
    // L'inscription se fera quand l'utilisateur fermera le popup
    setShowWelcomePopup(true);
  };

  const handleWelcomeClose = async () => {
    // Fermer le popup
    setShowWelcomePopup(false);

    // Maintenant faire l'inscription
    try {
      const result = await dispatch(registerUser({
        first_name: firstName,
        last_name: lastName,
        email,
        phone,
        password,
        role: 'client',
        date_of_birth: birthDate?.toISOString().split('T')[0],
        address,
        city,
        latitude: latitude || 31.6295,
        longitude: longitude || -7.9811,
        preferred_payment_method: paymentMethod,
        preferred_services: selectedServices,
        terms_accepted_at: termsAcceptedAt,
      })).unwrap();

      // Ajouter les services selectionnes aux favoris
      selectedServices.forEach(serviceId => {
        dispatch(toggleFavorite(serviceId));
      });

      // Inscription reussie - naviguer vers l'accueil client
      router.replace('/(client)' as any);
    } catch (err: any) {
      console.error('Registration API error:', err);
      Alert.alert(
        'Erreur d\'inscription',
        err?.message || 'Une erreur est survenue lors de l\'inscription. Veuillez reessayer.'
      );
    }
  };

  const toggleServiceSelection = (serviceId: number | string) => {
    const numId = typeof serviceId === 'string' ? parseInt(serviceId, 10) : serviceId;
    setSelectedServices(prev => {
      if (prev.includes(numId)) {
        return prev.filter(id => id !== numId);
      }
      return [...prev, numId];
    });
  };

  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      {STEPS.map((step, index) => (
        <View key={step.number} style={styles.stepItem}>
          <View style={[
            styles.stepCircle,
            currentStep >= step.number && styles.stepCircleActive,
            currentStep > step.number && styles.stepCircleCompleted,
          ]}>
            <Text style={[
              styles.stepNumber,
              currentStep >= step.number && styles.stepNumberActive,
            ]}>
              {currentStep > step.number ? '✓' : step.number}
            </Text>
          </View>
          <Text style={[
            styles.stepLabel,
            currentStep >= step.number && styles.stepLabelActive,
          ]}>
            {step.label}
          </Text>
          {index < STEPS.length - 1 && (
            <View style={[
              styles.stepLine,
              currentStep > step.number && styles.stepLineActive,
            ]} />
          )}
        </View>
      ))}
    </View>
  );

  const renderStep1 = () => (
    <View style={styles.stepContent}>
      {/* Row: First Name + Last Name */}
      <View style={styles.formRow}>
        <View style={styles.formRowItem}>
          <Input
            label="Prenom *"
            placeholder="Votre prenom"
            value={firstName}
            onChangeText={setFirstName}
            errorText={errors.firstName}
            error={!!errors.firstName}
            editable={!isLoading}
          />
        </View>
        <View style={styles.formRowItem}>
          <Input
            label="Nom *"
            placeholder="Votre nom"
            value={lastName}
            onChangeText={setLastName}
            errorText={errors.lastName}
            error={!!errors.lastName}
            editable={!isLoading}
          />
        </View>
      </View>

      <Input
        label="Email *"
        type="email"
        placeholder="votre.email@exemple.com"
        value={email}
        onChangeText={setEmail}
        errorText={errors.email}
        error={!!errors.email}
        editable={!isLoading}
      />

      <Input
        label="Telephone *"
        type="phone"
        placeholder="0612345678"
        value={phone}
        onChangeText={setPhone}
        errorText={errors.phone}
        error={!!errors.phone}
        editable={!isLoading}
      />

      {/* Birth Date Picker */}
      <BirthDatePicker
        label="Date de naissance *"
        value={birthDate}
        onChange={(date) => {
          setBirthDate(date);
          if (errors.birthDate) {
            setErrors(prev => ({ ...prev, birthDate: '' }));
          }
        }}
        placeholder="Selectionnez votre date"
        error={errors.birthDate}
        minAge={18}
        disabled={isLoading}
      />

      {/* Password with toggle */}
      <View style={styles.formGroup}>
        <Text style={styles.inputLabel}>Mot de passe *</Text>
        <View style={[styles.passwordWrapper, errors.password && styles.inputError]}>
          <TextInput
            style={styles.passwordInput}
            placeholder="Minimum 6 caracteres"
            placeholderTextColor={colors.gray[400]}
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            editable={!isLoading}
          />
          <TouchableOpacity
            style={styles.passwordToggle}
            onPress={() => setShowPassword(!showPassword)}
          >
            <Text style={styles.passwordToggleIcon}>{showPassword ? '👁️' : '👁️‍🗨️'}</Text>
          </TouchableOpacity>
        </View>
        {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
      </View>

      {/* Confirm Password with toggle */}
      <View style={styles.formGroup}>
        <Text style={styles.inputLabel}>Confirmer le mot de passe *</Text>
        <View style={[styles.passwordWrapper, errors.confirmPassword && styles.inputError]}>
          <TextInput
            style={styles.passwordInput}
            placeholder="Retapez votre mot de passe"
            placeholderTextColor={colors.gray[400]}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={!showConfirmPassword}
            editable={!isLoading}
          />
          <TouchableOpacity
            style={styles.passwordToggle}
            onPress={() => setShowConfirmPassword(!showConfirmPassword)}
          >
            <Text style={styles.passwordToggleIcon}>{showConfirmPassword ? '👁️' : '👁️‍🗨️'}</Text>
          </TouchableOpacity>
        </View>
        {errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword}</Text>}
      </View>

      {/* Terms Section */}
      <View style={styles.termsSection}>
        <TouchableOpacity
          style={styles.checkboxRow}
          onPress={() => handleTermsChange(!acceptTerms)}
          disabled={isLoading}
        >
          <View style={[styles.checkbox, acceptTerms && styles.checkboxChecked]}>
            {acceptTerms && <Text style={styles.checkmark}>✓</Text>}
          </View>
          <Text style={styles.termsText}>J'accepte les </Text>
        </TouchableOpacity>
        <View style={styles.termsLinks}>
          <TouchableOpacity onPress={() => setShowTermsModal(true)} disabled={isLoading}>
            <Text style={styles.termsLink}>conditions generales</Text>
          </TouchableOpacity>
          <Text style={styles.termsText}> et la </Text>
          <TouchableOpacity onPress={() => setShowTermsModal(true)} disabled={isLoading}>
            <Text style={styles.termsLink}>politique de confidentialite</Text>
          </TouchableOpacity>
          <Text style={styles.required}> *</Text>
        </View>
      </View>
      {errors.acceptTerms && (
        <Text style={styles.errorText}>{errors.acceptTerms}</Text>
      )}
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContent}>
      {/* Address Autocomplete */}
      <AddressAutocomplete
        label="Adresse complete *"
        value={address}
        onChangeText={setAddress}
        onAddressSelect={handleAddressSelect}
        placeholder="Commencez a taper votre adresse..."
        error={errors.address}
        disabled={isLoading}
      />

      {/* City Dropdown */}
      <View style={styles.formGroup}>
        <Text style={styles.inputLabel}>Ville *</Text>
        <TouchableOpacity
          style={[styles.cityDropdown, errors.city && styles.inputError]}
          onPress={() => {
            Keyboard.dismiss();
            setShowCityPicker(true);
          }}
          disabled={isLoading}
          activeOpacity={0.7}
        >
          <Text style={[styles.cityDropdownText, !city && styles.cityDropdownPlaceholder]}>
            {city || 'Selectionnez une ville'}
          </Text>
          <Text style={styles.cityDropdownIcon}>▼</Text>
        </TouchableOpacity>
        {errors.city && <Text style={styles.errorText}>{errors.city}</Text>}
      </View>

      {/* City Picker Modal */}
      <Modal
        visible={showCityPicker}
        animationType="slide"
        transparent
        onRequestClose={() => setShowCityPicker(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowCityPicker(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowCityPicker(false)}>
                <Text style={styles.modalCancel}>Annuler</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Choisir une ville</Text>
              <View style={{ width: 60 }} />
            </View>
            <ScrollView style={styles.cityList}>
              {CITIES.filter(c => c.value !== '').map((c) => (
                <TouchableOpacity
                  key={c.value}
                  style={[styles.cityOption, city === c.value && styles.cityOptionSelected]}
                  onPress={() => {
                    setCity(c.value);
                    setShowCityPicker(false);
                    if (errors.city) {
                      setErrors(prev => ({ ...prev, city: '' }));
                    }
                  }}
                >
                  <Text style={[styles.cityOptionText, city === c.value && styles.cityOptionTextSelected]}>
                    {c.label}
                  </Text>
                  {city === c.value && <Text style={styles.cityOptionCheck}>✓</Text>}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );

  const validateStep3 = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (paymentMethod === 'card') {
      const cardNum = cardData.cardNumber.replace(/\s/g, '');
      if (!cardNum || cardNum.length !== 16) {
        newErrors.cardNumber = 'Numero de carte invalide (16 chiffres)';
      }
      if (!cardData.expMonth) {
        newErrors.expMonth = 'Requis';
      }
      if (!cardData.expYear) {
        newErrors.expYear = 'Requis';
      } else {
        const currentYear = new Date().getFullYear();
        const currentMonth = new Date().getMonth() + 1;
        const expYear = parseInt(cardData.expYear);
        const expMonth = parseInt(cardData.expMonth);
        if (expYear < currentYear || (expYear === currentYear && expMonth < currentMonth)) {
          newErrors.expYear = 'Carte expiree';
        }
      }
      if (!cardData.cvv || cardData.cvv.length !== 3) {
        newErrors.cvv = 'CVV invalide';
      }
    }

    setErrors(prev => ({ ...prev, ...newErrors }));
    return Object.keys(newErrors).length === 0;
  };

  const handleStep3Continue = () => {
    if (validateStep3()) {
      setCurrentStep(4);
    }
  };

  const renderStep3 = () => (
    <View style={styles.stepContent}>
      <View style={styles.paymentInfo}>
        <Text style={styles.paymentInfoIcon}>💳</Text>
        <Text style={styles.paymentInfoText}>
          Configurez votre mode de paiement. La carte bancaire permet un paiement securise.
        </Text>
      </View>

      <PaymentMethodSelector
        selectedMethod={paymentMethod}
        onSelect={(method) => {
          setPaymentMethod(method);
          // Clear card errors when switching to cash
          if (method === 'cash') {
            setErrors(prev => ({
              ...prev,
              cardNumber: '',
              expMonth: '',
              expYear: '',
              cvv: '',
            }));
          }
        }}
        disabled={isLoading}
      />

      {/* Credit Card Form - shown when card is selected */}
      {paymentMethod === 'card' && (
        <CreditCardForm
          cardData={cardData}
          onCardChange={setCardData}
          errors={errors}
          disabled={isLoading}
        />
      )}

      <View style={styles.buttonRow}>
        <Button
          variant="outline"
          size="sm"
          onPress={() => setCurrentStep(2)}
          disabled={isLoading}
          style={styles.backButton}
        >
          Precedent
        </Button>
        <Button
          variant="primary"
          size="sm"
          onPress={handleStep3Continue}
          disabled={isLoading}
          style={styles.nextButton}
        >
          Continuer
        </Button>
      </View>
    </View>
  );

  const renderStep4 = () => (
    <View style={styles.stepContent}>
      <View style={styles.preferencesIntro}>
        <Text style={styles.preferencesIntroText}>
          Selectionnez les services qui vous interessent pour des recommandations personnalisees.
        </Text>
      </View>

      {loadingServices ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Chargement des services...</Text>
        </View>
      ) : categoriesWithServices.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Aucun service disponible pour le moment.</Text>
        </View>
      ) : (
        categoriesWithServices.map((category) => {
          if (!category.services || category.services.length === 0) return null;

          return (
            <View key={category.id} style={styles.categorySection}>
              <Text style={[styles.categoryTitle, { color: category.color || colors.primary }]}>
                {category.name}
              </Text>
              <View style={styles.servicesGrid}>
                {category.services.map((service) => {
                  const serviceId = typeof service.id === 'string' ? parseInt(service.id, 10) : service.id;
                  const isSelected = selectedServices.includes(serviceId);
                  const serviceName = service.title || service.name || 'Service';
                  return (
                    <TouchableOpacity
                      key={service.id}
                      style={[
                        styles.serviceChip,
                        isSelected && styles.serviceChipSelected,
                      ]}
                      onPress={() => toggleServiceSelection(serviceId)}
                      disabled={isLoading}
                    >
                      <Text style={[
                        styles.serviceChipText,
                        isSelected && styles.serviceChipTextSelected,
                      ]}>
                        {serviceName}
                      </Text>
                      {isSelected && <Text style={styles.serviceChipCheck}>✓</Text>}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          );
        })
      )}

      {/* Validation message */}
      {errors.services && (
        <Text style={[styles.errorText, { marginBottom: spacing.md }]}>{errors.services}</Text>
      )}

      <View style={styles.buttonRow}>
        <Button
          variant="outline"
          size="sm"
          onPress={() => setCurrentStep(3)}
          disabled={isLoading}
          style={styles.backButton}
        >
          Precedent
        </Button>
        <Button
          variant="primary"
          size="sm"
          onPress={handleFinalizeRegistration}
          loading={isLoading}
          disabled={isLoading || selectedServices.length === 0}
          style={styles.finishButton}
        >
          Terminer l'inscription
        </Button>
      </View>

      {selectedServices.length === 0 && (
        <Text style={styles.hintText}>
          Selectionnez au moins un service pour continuer
        </Text>
      )}
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.keyboardView}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
      >
        {/* Back Link */}
        <TouchableOpacity
          style={styles.backLink}
          onPress={() => router.push('/')}
          disabled={isLoading}
        >
          <Text style={styles.backLinkIcon}>←</Text>
          <Text style={styles.backLinkText}>Retour a l'accueil</Text>
        </TouchableOpacity>

        {renderStepIndicator()}

        <Text style={styles.title}>
          {currentStep === 1 && 'Informations personnelles'}
          {currentStep === 2 && 'Votre adresse'}
          {currentStep === 3 && 'Mode de paiement'}
          {currentStep === 4 && 'Vos preferences'}
        </Text>
        <Text style={styles.subtitle}>
          {currentStep === 1 && 'Creez votre compte GlamGo'}
          {currentStep === 2 && 'Ou souhaitez-vous recevoir vos prestations ?'}
          {currentStep === 3 && 'Selectionnez votre mode de paiement'}
          {currentStep === 4 && 'Personnalisez votre experience'}
        </Text>

        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
        {currentStep === 4 && renderStep4()}

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorTextGlobal}>{error}</Text>
          </View>
        )}

        {/* Navigation Buttons (Steps 1-2 only) */}
        {(currentStep === 1 || currentStep === 2) && (
          <View style={styles.buttons}>
            <Button
              variant="outline"
              size="sm"
              onPress={handleBack}
              disabled={isLoading}
              style={styles.backButton}
            >
              {currentStep === 1 ? 'Retour' : 'Precedent'}
            </Button>

            <Button
              variant="primary"
              size="sm"
              onPress={handleNext}
              loading={isLoading && currentStep === 2}
              disabled={isLoading}
              style={styles.nextButton}
            >
              Continuer
            </Button>
          </View>
        )}

        {/* Footer Link (Step 1 only) */}
        {currentStep === 1 && (
          <TouchableOpacity
            style={styles.loginLink}
            onPress={() => router.push('/auth/login')}
            disabled={isLoading}
          >
            <Text style={styles.loginLinkText}>
              Vous avez deja un compte ? <Text style={styles.loginLinkBold}>Connectez-vous</Text>
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      <TermsModal
        isOpen={showTermsModal}
        onClose={() => setShowTermsModal(false)}
        userType="client"
      />

      <WelcomePopup
        visible={showWelcomePopup}
        onClose={handleWelcomeClose}
        userName={firstName}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  contentContainer: {
    paddingTop: 50,
    paddingBottom: 40,
    paddingHorizontal: spacing.lg,
  },

  // Back Link
  backLink: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  backLinkIcon: {
    fontSize: 20,
    color: colors.gray[600],
    marginRight: spacing.xs,
  },
  backLinkText: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[600],
  },

  // Title
  title: {
    fontSize: typography.fontSize.xl,
    fontWeight: '700',
    color: colors.gray[900],
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[500],
    marginBottom: spacing.lg,
    textAlign: 'center',
  },

  // Step Indicator
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-start',
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.sm,
  },
  stepItem: {
    alignItems: 'center',
    flex: 1,
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.gray[200],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  stepCircleActive: {
    backgroundColor: colors.primary,
  },
  stepCircleCompleted: {
    backgroundColor: colors.success,
  },
  stepNumber: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    color: colors.gray[500],
  },
  stepNumberActive: {
    color: colors.white,
  },
  stepLabel: {
    fontSize: 10,
    color: colors.gray[400],
    textAlign: 'center',
  },
  stepLabelActive: {
    color: colors.gray[700],
    fontWeight: '500',
  },
  stepLine: {
    position: 'absolute',
    top: 16,
    left: '60%',
    right: '-40%',
    height: 2,
    backgroundColor: colors.gray[200],
    zIndex: -1,
  },
  stepLineActive: {
    backgroundColor: colors.success,
  },

  // Step Content
  stepContent: {
    marginBottom: spacing.lg,
  },

  // Form Row (2 columns)
  formRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  formRowItem: {
    flex: 1,
  },

  // Form Group
  formGroup: {
    marginBottom: spacing.md,
  },
  inputLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    color: colors.gray[700],
    marginBottom: spacing.xs,
  },
  inputError: {
    borderColor: colors.error,
  },

  // Password Wrapper
  passwordWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.gray[300],
    borderRadius: borderRadius.md,
    backgroundColor: colors.white,
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: typography.fontSize.base,
    color: colors.gray[900],
    minHeight: 48,
  },
  passwordToggle: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  passwordToggleIcon: {
    fontSize: 18,
  },

  // Errors
  errorText: {
    fontSize: typography.fontSize.xs,
    color: colors.error,
    marginTop: spacing.xs,
  },
  hintText: {
    fontSize: typography.fontSize.xs,
    color: colors.gray[500],
    marginTop: spacing.md,
    textAlign: 'center',
    fontStyle: 'italic',
  },

  // Checkbox / Terms
  termsSection: {
    marginTop: spacing.md,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: colors.gray[300],
    marginRight: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkmark: {
    color: colors.white,
    fontSize: 14,
    fontWeight: 'bold',
  },
  termsLinks: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginLeft: 30,
    marginTop: 4,
  },
  termsText: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[600],
  },
  termsLink: {
    fontSize: typography.fontSize.sm,
    color: colors.primary,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  required: {
    color: colors.error,
    fontWeight: '600',
  },

  // City Dropdown
  cityDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 2,
    borderColor: colors.gray[300],
    borderRadius: borderRadius.md,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    minHeight: 48,
  },
  cityDropdownText: {
    fontSize: typography.fontSize.base,
    color: colors.gray[900],
  },
  cityDropdownPlaceholder: {
    color: colors.gray[400],
  },
  cityDropdownIcon: {
    fontSize: 12,
    color: colors.gray[500],
  },

  // City Modal
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
    maxHeight: '70%',
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
  cityList: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  cityOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.xs,
  },
  cityOptionSelected: {
    backgroundColor: colors.primary + '15',
  },
  cityOptionText: {
    fontSize: typography.fontSize.base,
    color: colors.gray[700],
  },
  cityOptionTextSelected: {
    color: colors.primary,
    fontWeight: '600',
  },
  cityOptionCheck: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '600',
  },

  // Payment Info
  paymentInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: spacing.md,
    backgroundColor: colors.gray[50],
    borderRadius: borderRadius.md,
    marginBottom: spacing.lg,
  },
  paymentInfoIcon: {
    fontSize: 16,
    marginRight: spacing.sm,
  },
  paymentInfoText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    color: colors.gray[600],
    lineHeight: 20,
  },

  // Preferences
  preferencesIntro: {
    padding: spacing.md,
    backgroundColor: colors.gray[50],
    borderRadius: borderRadius.md,
    marginBottom: spacing.lg,
  },
  preferencesIntroText: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[600],
    lineHeight: 20,
  },

  // Loading / Empty
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: typography.fontSize.sm,
    color: colors.gray[500],
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  emptyText: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[500],
  },

  // Category Section
  categorySection: {
    marginBottom: spacing.lg,
  },
  categoryTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },

  // Service Chip
  serviceChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: colors.gray[100],
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  serviceChipSelected: {
    backgroundColor: colors.primary + '15',
    borderColor: colors.primary,
  },
  serviceChipText: {
    fontSize: typography.fontSize.xs,
    color: colors.gray[700],
  },
  serviceChipTextSelected: {
    color: colors.primary,
    fontWeight: '600',
  },
  serviceChipCheck: {
    marginLeft: spacing.xs,
    fontSize: 12,
    color: colors.primary,
  },

  // Buttons
  buttons: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  backButton: {
    flex: 1,
  },
  nextButton: {
    flex: 2,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  skipButton: {
    flex: 1,
  },
  finishButton: {
    flex: 2,
  },
  continueButton: {
    flex: 1,
  },

  // Error Container
  errorContainer: {
    padding: spacing.md,
    backgroundColor: colors.error + '15',
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
  },
  errorTextGlobal: {
    color: colors.error,
    fontSize: typography.fontSize.sm,
    textAlign: 'center',
  },

  // Login Link
  loginLink: {
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  loginLinkText: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[500],
  },
  loginLinkBold: {
    color: colors.primary,
    fontWeight: '600',
  },
});
