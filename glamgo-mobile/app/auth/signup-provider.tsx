import { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  TouchableOpacity,
  Image,
  Dimensions,
} from "react-native";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import Button from "../../src/components/ui/Button";
import Input from "../../src/components/ui/Input";
import TermsModal from "../../src/components/ui/TermsModal";
import BirthDatePicker from "../../src/components/ui/BirthDatePicker";
import AddressAutocomplete, { AddressData } from "../../src/components/features/AddressAutocomplete";
import CreditCardForm, { CardData } from "../../src/components/features/CreditCardForm";
import RibForm, { RibData } from "../../src/components/features/RibForm";
import WelcomePopupProvider from "../../src/components/ui/WelcomePopupProvider";
import { colors, spacing, typography, borderRadius } from "../../src/lib/constants/theme";
import { useAppDispatch, useAppSelector } from "../../src/lib/store/hooks";
import { setUser, setToken, clearError, selectAuth } from "../../src/lib/store/slices/authSlice";
import { registerProvider } from "../../src/lib/api";
import { setTokens } from "../../src/lib/api/client";
import { useLanguage } from "../../src/contexts/LanguageContext";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const CITIES = [
  "Marrakech", "Casablanca", "Rabat", "Fes", "Tanger", "Agadir",
  "Meknes", "Oujda", "Kenitra", "Tetouan", "Safi", "El Jadida"
];

const RADIUS_OPTIONS = [5, 10, 15, 20, 30, 50];

export default function SignupProviderScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { isAuthenticated, isLoading, error } = useAppSelector(selectAuth);
  const { t, isRTL } = useLanguage();

  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;

  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [birthDate, setBirthDate] = useState<Date | null>(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [experience, setExperience] = useState("");
  const [bio, setBio] = useState("");

  const [address, setAddress] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [interventionRadius, setInterventionRadius] = useState(15);

  const [cin, setCin] = useState("");
  const [cinFrontPhoto, setCinFrontPhoto] = useState<string | null>(null);
  const [cinBackPhoto, setCinBackPhoto] = useState<string | null>(null);
  const [acceptCharter, setAcceptCharter] = useState(false);

  const [cardData, setCardData] = useState<CardData>({
    cardNumber: "",
    expMonth: "",
    expYear: "",
    cvv: "",
  });

  // RIB pour recevoir les virements
  const [ribData, setRibData] = useState<RibData>({
    titulaire: "",
    banque: "",
    numero: "",
  });

  const [acceptTerms, setAcceptTerms] = useState(false);

  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showWelcomePopup, setShowWelcomePopup] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // NOTE: Pas de redirection automatique ici
  // La navigation est geree manuellement apres le popup de bienvenue

  useEffect(() => {
    if (error) {
      dispatch(clearError());
    }
  }, [firstName, lastName, email, phone, password]);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone: string) => {
    // Format marocain: 06XXXXXXXX ou 07XXXXXXXX (10 chiffres)
    const cleaned = phone.replace(/\s/g, "").replace(/[-.]/g, "");
    const phoneRegex = /^0[5-7]\d{8}$/;
    return phoneRegex.test(cleaned);
  };

  const validateCIN = (cin: string) => {
    const cinRegex = /^[A-Z]{1,2}\d{5,6}$/i;
    return cinRegex.test(cin);
  };

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert(t('signupProvider.permissionRequired'), t('signupProvider.allowGalleryAccess'));
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setProfilePhoto(result.assets[0].uri);
    }
  };

  const pickDocument = async (type: "front" | "back") => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert(t('signupProvider.permissionRequired'), t('signupProvider.allowGalleryAccess'));
      return;
    }

    Alert.alert(
      t('signupProvider.addPhoto'),
      t('signupProvider.howToAddPhoto'),
      [
        {
          text: t('signupProvider.camera'),
          onPress: async () => {
            const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
            if (!cameraPermission.granted) {
              Alert.alert(t('signupProvider.permissionRequired'), t('signupProvider.allowCameraAccess'));
              return;
            }
            const result = await ImagePicker.launchCameraAsync({
              allowsEditing: true,
              aspect: [4, 3],
              quality: 0.8,
            });
            if (!result.canceled) {
              if (type === "front") {
                setCinFrontPhoto(result.assets[0].uri);
              } else {
                setCinBackPhoto(result.assets[0].uri);
              }
              setErrors(prev => ({ ...prev, cinPhotos: "" }));
            }
          },
        },
        {
          text: t('signupProvider.gallery'),
          onPress: async () => {
            const result = await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              allowsEditing: true,
              aspect: [4, 3],
              quality: 0.8,
            });
            if (!result.canceled) {
              if (type === "front") {
                setCinFrontPhoto(result.assets[0].uri);
              } else {
                setCinBackPhoto(result.assets[0].uri);
              }
              setErrors(prev => ({ ...prev, cinPhotos: "" }));
            }
          },
        },
        { text: t('signupProvider.cancel'), style: "cancel" },
      ]
    );
  };

  const handleAddressSelect = (addressData: AddressData) => {
    if (addressData.coords) {
      setLatitude(addressData.coords.latitude);
      setLongitude(addressData.coords.longitude);
    }
    if (addressData.city) {
      setSelectedCity(addressData.city);
    }
    setErrors(prev => ({ ...prev, address: "", city: "" }));
  };

  const validateStep = (step: number): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (step === 1) {
      if (!firstName || firstName.length < 2) {
        newErrors.firstName = t('signupProvider.firstNameRequired');
      }
      if (!lastName || lastName.length < 2) {
        newErrors.lastName = t('signupProvider.lastNameRequired');
      }
      if (!email) {
        newErrors.email = t('signupProvider.emailRequired');
      } else if (!validateEmail(email)) {
        newErrors.email = t('signupProvider.emailInvalid');
      }
      if (!phone) {
        newErrors.phone = t('signupProvider.phoneRequired');
      } else if (!validatePhone(phone)) {
        newErrors.phone = t('signupProvider.phoneFormat');
      }
      if (!birthDate) {
        newErrors.birthDate = t('signupProvider.birthDateRequired');
      } else {
        const today = new Date();
        const age = today.getFullYear() - birthDate.getFullYear();
        if (age < 18) {
          newErrors.birthDate = t('signupProvider.mustBe18');
        }
      }
      if (!password || password.length < 6) {
        newErrors.password = t('signupProvider.passwordRequired');
      }
      if (password !== confirmPassword) {
        newErrors.confirmPassword = t('signupProvider.passwordMismatch');
      }
      if (!profilePhoto) {
        newErrors.photo = t('signupProvider.photoRequired');
      }
      if (!experience) {
        newErrors.experience = t('signupProvider.experienceRequired');
      }
      if (!acceptTerms) {
        newErrors.acceptTerms = t('signupProvider.mustAcceptTerms');
      }
    }

    if (step === 2) {
      if (!address) {
        newErrors.address = t('signupProvider.addressRequired');
      }
      if (!selectedCity) {
        newErrors.city = t('signupProvider.selectCity');
      }
    }

    if (step === 3) {
      if (!cin) {
        newErrors.cin = t('signupProvider.cinRequired');
      } else if (!validateCIN(cin)) {
        newErrors.cin = t('signupProvider.cinInvalid');
      }
      if (!cinFrontPhoto || !cinBackPhoto) {
        newErrors.cinPhotos = t('signupProvider.cinPhotosRequired');
      }
      if (!acceptCharter) {
        newErrors.charter = t('signupProvider.mustAcceptCharter');
      }
    }

    if (step === 4) {
      // Validation carte bancaire (pour prelever commissions)
      const cleanedCardNumber = cardData.cardNumber.replace(/\s/g, "");
      if (!cleanedCardNumber || cleanedCardNumber.length < 16) {
        newErrors.cardNumber = t('signupProvider.cardNumberInvalid');
      }
      if (!cardData.expMonth) {
        newErrors.expMonth = t('signupProvider.monthRequired');
      }
      if (!cardData.expYear) {
        newErrors.expYear = t('signupProvider.yearRequired');
      }
      if (!cardData.cvv || cardData.cvv.length < 3) {
        newErrors.cvv = t('signupProvider.cvvInvalid');
      }

      // Validation RIB (pour recevoir virements)
      if (!ribData.titulaire || ribData.titulaire.length < 3) {
        newErrors.ribTitulaire = t('signupProvider.ribHolderRequired');
      }
      if (!ribData.banque) {
        newErrors.ribBanque = t('signupProvider.selectBank');
      }
      const cleanedRib = ribData.numero.replace(/\s/g, "");
      if (!cleanedRib || cleanedRib.length !== 24) {
        newErrors.ribNumero = t('signupProvider.ribInvalid');
      }

      if (!acceptTerms) {
        newErrors.terms = t('signupProvider.mustAcceptCGU');
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const checkEmailAvailability = async (emailToCheck: string): Promise<boolean> => {
    try {
      const response = await fetch(`https://glamgo-api.fly.dev/api/auth/check-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: emailToCheck }),
      });
      const data = await response.json();
      // Si l'API retourne available: false, l'email est deja pris
      return data.available !== false;
    } catch (error) {
      // En cas d'erreur API, on laisse passer (l'erreur sera catchee a l'inscription)
      console.warn("Verification email non disponible:", error);
      return true;
    }
  };

  const handleNext = async () => {
    if (!validateStep(currentStep)) {
      return;
    }

    // Verification email a l'etape 1
    if (currentStep === 1) {
      setIsSubmitting(true);
      const isEmailAvailable = await checkEmailAvailability(email);
      setIsSubmitting(false);

      if (!isEmailAvailable) {
        setErrors(prev => ({ ...prev, email: t('signupProvider.emailAlreadyUsed') }));
        Alert.alert(
          t('signupProvider.emailAlreadyUsedTitle'),
          t('signupProvider.emailAlreadyUsedMessage')
        );
        return;
      }
    }

    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Etape 1: Valider et afficher le popup (AVANT inscription)
  const handleSignup = async () => {
    if (!validateStep(4)) return;

    // Afficher le popup de bienvenue AVANT l'inscription
    // L'inscription se fera quand l'utilisateur fermera le popup
    setShowWelcomePopup(true);
  };

  // Etape 2: Faire l'inscription quand on ferme le popup (comme le client)
  const handleWelcomeClose = async (goToDashboard: boolean = false) => {
    // Fermer le popup
    setShowWelcomePopup(false);
    setIsSubmitting(true);

    // Destination: onboarding pour selection des services
    const destination = goToDashboard
      ? "/(provider)"
      : "/(provider)/onboarding";

    try {
      // Recuperer les coordonnees (depuis AddressAutocomplete ou fallback ville)
      const coords = latitude && longitude
        ? { latitude, longitude }
        : getCityCoordinates(selectedCity);

      // Inscription du prestataire
      const response = await registerProvider({
        first_name: firstName,
        last_name: lastName,
        email,
        password,
        phone: phone.replace(/\s/g, ""),
        business_name: `${firstName} ${lastName}`,
        bio: bio || undefined,
        address,
        city: selectedCity,
        latitude: coords.latitude,
        longitude: coords.longitude,
        intervention_radius: interventionRadius,
        profile_photo: profilePhoto || undefined,
      });

      if (response.success) {
        console.log("=== INSCRIPTION REUSSIE ===");
        console.log("[Signup] Response data keys:", Object.keys(response.data));
        console.log("[Signup] Token present?", !!response.data.token);

        // IMPORTANT: Sauvegarder le token AVANT la navigation
        // pour que les appels API fonctionnent immediatement
        if (response.data.token) {
          const tokenPreview = response.data.token.substring(0, 30);
          console.log("[Signup] Sauvegarde du token:", tokenPreview + "...");

          // Sauvegarder dans AsyncStorage pour les appels API
          await setTokens(response.data.token, response.data.refresh_token);

          // Attendre un peu pour s'assurer que AsyncStorage est synchronise
          await new Promise(resolve => setTimeout(resolve, 300));

          // Verifier que le token a bien ete sauvegarde avec retry
          const { getToken } = await import("../../src/lib/api/client");
          let savedToken = await getToken();
          let retryCount = 0;

          // Retry jusqu'a 5 fois si le token n'est pas encore disponible
          while (!savedToken && retryCount < 5) {
            console.log(`[Signup] Token not found yet, retry ${retryCount + 1}/5...`);
            await new Promise(resolve => setTimeout(resolve, 200));
            savedToken = await getToken();
            retryCount++;
          }

          if (!savedToken) {
            console.error("[Signup] CRITICAL: Token still not available after retries!");
            Alert.alert(
              t('common.error'),
              t('signupProvider.tokenError'),
              [{ text: t('common.ok') }]
            );
            setIsSubmitting(false);
            return;
          }

          console.log("[Signup] Token verifie apres sauvegarde:", savedToken.substring(0, 30) + "...");

          // Aussi dans Redux pour l'etat de l'app
          dispatch(setToken({ token: response.data.token }));
          console.log("[Signup] Token sauvegarde avec succes");
        } else {
          console.error("[Signup] PAS DE TOKEN DANS LA REPONSE!");
          console.log("[Signup] Response.data:", JSON.stringify(response.data, null, 2));
          Alert.alert(
            t('common.error'),
            t('signupProvider.noTokenError'),
            [{ text: t('common.ok') }]
          );
          setIsSubmitting(false);
          return;
        }

        dispatch(setUser({
          id: response.data.provider.id,
          email: response.data.provider.email,
          first_name: response.data.provider.first_name,
          last_name: response.data.provider.last_name,
          phone: response.data.provider.phone,
          role: 'provider',
          is_provider: true,
          provider_id: response.data.provider.id,
        }));

        // Naviguer APRES avoir sauvegarde le token
        router.replace(destination as any);

        return;
      }
    } catch (err: any) {
      console.error("Registration API error:", err);
      // Gerer l'erreur 409 (email deja utilise)
      if (err?.response?.status === 409 || err?.message?.includes('409') || err?.message?.includes('deja utilise')) {
        Alert.alert(
          t('signupProvider.emailAlreadyUsedTitle'),
          t('signupProvider.emailAlreadyUsedMessage'),
          [{ text: t('common.ok') }]
        );
        setCurrentStep(1); // Retour a l'etape 1 pour changer l'email
        return;
      }
      // Autre erreur: afficher un message generique
      Alert.alert(
        t('signupProvider.registrationError'),
        t('signupProvider.registrationErrorMessage'),
        [{ text: t('common.ok') }]
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Coordonnees des villes marocaines
  const getCityCoordinates = (city: string) => {
    const coordinates: { [key: string]: { latitude: number; longitude: number } } = {
      "Marrakech": { latitude: 31.6295, longitude: -7.9811 },
      "Casablanca": { latitude: 33.5731, longitude: -7.5898 },
      "Rabat": { latitude: 34.0209, longitude: -6.8416 },
      "Fes": { latitude: 34.0181, longitude: -5.0078 },
      "Tanger": { latitude: 35.7595, longitude: -5.8340 },
      "Agadir": { latitude: 30.4278, longitude: -9.5981 },
      "Meknes": { latitude: 33.8730, longitude: -5.5407 },
      "Oujda": { latitude: 34.6805, longitude: -1.9076 },
      "Kenitra": { latitude: 34.2610, longitude: -6.5802 },
      "Tetouan": { latitude: 35.5784, longitude: -5.3684 },
      "Safi": { latitude: 32.2994, longitude: -9.2372 },
      "El Jadida": { latitude: 33.2316, longitude: -8.5007 },
    };
    return coordinates[city] || { latitude: 31.6295, longitude: -7.9811 }; // Default: Marrakech
  };

  const renderStepIndicator = () => (
    <View style={[styles.stepIndicator, isRTL && styles.stepIndicatorRTL]}>
      {[1, 2, 3, 4].map((step) => (
        <View key={step} style={styles.stepWrapper}>
          <View style={[
            styles.stepCircle,
            currentStep >= step && styles.stepCircleActive,
            currentStep > step && styles.stepCircleCompleted,
          ]}>
            {currentStep > step ? (
              <Text style={styles.stepCheckmark}>✓</Text>
            ) : (
              <Text style={[
                styles.stepNumber,
                currentStep >= step && styles.stepNumberActive,
              ]}>{step}</Text>
            )}
          </View>
          <Text style={[
            styles.stepLabel,
            currentStep >= step && styles.stepLabelActive,
            isRTL && styles.textRTL,
          ]}>
            {step === 1 && t('signupProvider.stepInfos')}
            {step === 2 && t('signupProvider.stepZone')}
            {step === 3 && t('signupProvider.stepDocuments')}
            {step === 4 && t('signupProvider.stepPayment')}
          </Text>
          {step < 4 && (
            <View style={[
              styles.stepLine,
              currentStep > step && styles.stepLineActive,
              isRTL && styles.stepLineRTL,
            ]} />
          )}
        </View>
      ))}
    </View>
  );

  const renderStep1 = () => (
    <View style={styles.stepContent}>
      {/* Header */}
      <View style={[styles.stepHeader, isRTL && styles.stepHeaderRTL]}>
        <Text style={[styles.stepHeaderTitle, isRTL && styles.textRTL]}>{t('signupProvider.personalInfoTitle')}</Text>
        <Text style={[styles.stepHeaderSubtitle, isRTL && styles.textRTL]}>{t('signupProvider.personalInfoSubtitle')}</Text>
      </View>

      {/* Section: Informations personnelles */}
      <Text style={[styles.sectionTitle, isRTL && styles.textRTL]}>{t('signupProvider.personalInfo')}</Text>

      <Input
        label={t('signupProvider.firstName')}
        placeholder={t('signupProvider.firstNamePlaceholder')}
        value={firstName}
        onChangeText={setFirstName}
        errorText={errors.firstName}
        error={!!errors.firstName}
        editable={!isLoading}
      />

      <Input
        label={t('signupProvider.lastName')}
        placeholder={t('signupProvider.lastNamePlaceholder')}
        value={lastName}
        onChangeText={setLastName}
        errorText={errors.lastName}
        error={!!errors.lastName}
        editable={!isLoading}
      />

      <Input
        label={t('signupProvider.email')}
        type="email"
        placeholder={t('signupProvider.emailPlaceholder')}
        value={email}
        onChangeText={setEmail}
        errorText={errors.email}
        error={!!errors.email}
        editable={!isLoading}
      />

      <Input
        label={t('signupProvider.phone')}
        type="phone"
        placeholder={t('signupProvider.phonePlaceholder')}
        value={phone}
        onChangeText={setPhone}
        errorText={errors.phone}
        error={!!errors.phone}
        helperText={t('signupProvider.phoneHelper')}
        editable={!isLoading}
      />

      <BirthDatePicker
        label={t('signupProvider.birthDate')}
        value={birthDate}
        onChange={setBirthDate}
        error={errors.birthDate}
        minAge={18}
        disabled={isLoading}
      />

      <Input
        label={t('signupProvider.password')}
        type="password"
        placeholder={t('signupProvider.passwordPlaceholder')}
        value={password}
        onChangeText={setPassword}
        errorText={errors.password}
        error={!!errors.password}
        helperText={t('signupProvider.passwordHelper')}
        editable={!isLoading}
      />

      <Input
        label={t('signupProvider.confirmPassword')}
        type="password"
        placeholder={t('signupProvider.confirmPasswordPlaceholder')}
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        errorText={errors.confirmPassword}
        error={!!errors.confirmPassword}
        editable={!isLoading}
      />

      {/* Section: Profil professionnel */}
      <Text style={[styles.sectionTitle, isRTL && styles.textRTL]}>{t('signupProvider.professionalProfile')}</Text>

      <View style={styles.photoSection}>
        <Text style={[styles.inputLabel, isRTL && styles.textRTL]}>{t('signupProvider.profilePhoto')}</Text>
        <View style={[styles.photoContainer, isRTL && styles.photoContainerRTL]}>
          <TouchableOpacity style={styles.photoUpload} onPress={pickImage}>
            {profilePhoto ? (
              <Image source={{ uri: profilePhoto }} style={styles.profilePhoto} />
            ) : (
              <View style={styles.photoPlaceholder}>
                <Text style={styles.photoIcon}>📷</Text>
                <Text style={[styles.photoText, isRTL && styles.textRTL]}>{t('signupProvider.yourPhoto')}</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity style={styles.photoButton} onPress={pickImage}>
            <Text style={[styles.photoButtonText, isRTL && styles.textRTL]}>{t('signupProvider.choosePhoto')}</Text>
          </TouchableOpacity>
        </View>
        <Text style={[styles.photoHelper, isRTL && styles.textRTL]}>
          {t('signupProvider.photoHelper')}
        </Text>
        {errors.photo && <Text style={[styles.errorText, isRTL && styles.textRTL]}>{errors.photo}</Text>}
      </View>

      <Input
        label={t('signupProvider.yearsExperience')}
        placeholder={t('signupProvider.yearsExperiencePlaceholder')}
        value={experience}
        onChangeText={setExperience}
        keyboardType="numeric"
        errorText={errors.experience}
        error={!!errors.experience}
        editable={!isLoading}
      />

      {/* CGU Section */}
      <View style={styles.termsSection}>
        <TouchableOpacity
          style={[styles.checkboxRow, isRTL && styles.checkboxRowRTL]}
          onPress={() => setAcceptTerms(!acceptTerms)}
          disabled={isLoading}
        >
          <View style={[styles.checkbox, acceptTerms && styles.checkboxChecked, isRTL && styles.checkboxRTL]}>
            {acceptTerms && <Text style={styles.checkmark}>✓</Text>}
          </View>
          <Text style={[styles.termsText, isRTL && styles.textRTL]}>{t('signupProvider.iAcceptThe')}</Text>
        </TouchableOpacity>
        <View style={[styles.termsLinks, isRTL && styles.termsLinksRTL]}>
          <TouchableOpacity onPress={() => setShowTermsModal(true)} disabled={isLoading}>
            <Text style={[styles.termsLink, isRTL && styles.textRTL]}>{t('signupProvider.termsAndConditions')}</Text>
          </TouchableOpacity>
          <Text style={[styles.termsText, isRTL && styles.textRTL]}>{t('signupProvider.and')}</Text>
          <TouchableOpacity onPress={() => setShowTermsModal(true)} disabled={isLoading}>
            <Text style={[styles.termsLink, isRTL && styles.textRTL]}>{t('signupProvider.privacyPolicy')}</Text>
          </TouchableOpacity>
          <Text style={styles.required}> *</Text>
        </View>
      </View>
      {errors.acceptTerms && (
        <Text style={[styles.errorText, isRTL && styles.textRTL]}>{errors.acceptTerms}</Text>
      )}
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContent}>
      {/* Header */}
      <View style={[styles.stepHeader, isRTL && styles.stepHeaderRTL]}>
        <Text style={[styles.stepHeaderTitle, isRTL && styles.textRTL]}>{t('signupProvider.interventionZoneTitle')}</Text>
        <Text style={[styles.stepHeaderSubtitle, isRTL && styles.textRTL]}>{t('signupProvider.interventionZoneSubtitle')}</Text>
      </View>

      {/* Adresse */}
      <Text style={[styles.sectionTitle, isRTL && styles.textRTL]}>{t('signupProvider.professionalAddress')}</Text>

      <AddressAutocomplete
        label={t('signupProvider.fullAddress')}
        placeholder={t('signupProvider.addressPlaceholder')}
        value={address}
        onChangeText={setAddress}
        onAddressSelect={handleAddressSelect}
        error={errors.address}
        disabled={isLoading}
      />

      <Text style={[styles.inputLabel, isRTL && styles.textRTL]}>{t('signupProvider.mainCity')}</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.citiesScroll}
        contentContainerStyle={isRTL && styles.citiesContentRTL}
      >
        {CITIES.map((city) => (
          <TouchableOpacity
            key={city}
            style={[
              styles.cityChip,
              selectedCity === city && styles.cityChipSelected,
              isRTL && styles.cityChipRTL,
            ]}
            onPress={() => {
              setSelectedCity(city);
              setErrors(prev => ({ ...prev, city: "" }));
            }}
          >
            <Text style={[
              styles.cityText,
              selectedCity === city && styles.cityTextSelected,
            ]}>
              {city}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      {errors.city && <Text style={[styles.errorText, isRTL && styles.textRTL]}>{errors.city}</Text>}

      <Text style={[styles.sectionTitle, isRTL && styles.textRTL]}>{t('signupProvider.interventionRadius')}</Text>
      <Text style={[styles.helperText, isRTL && styles.textRTL]}>{t('signupProvider.radiusHelper')}</Text>

      <View style={[styles.radiusOptions, isRTL && styles.radiusOptionsRTL]}>
        {RADIUS_OPTIONS.map((radius) => (
          <TouchableOpacity
            key={radius}
            style={[
              styles.radiusChip,
              interventionRadius === radius && styles.radiusChipSelected,
            ]}
            onPress={() => setInterventionRadius(radius)}
          >
            <Text style={[
              styles.radiusText,
              interventionRadius === radius && styles.radiusTextSelected,
            ]}>
              {radius} {t('common.km')}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Info disponibilite */}
      <View style={[styles.infoBox, isRTL && styles.infoBoxRTL]}>
        <Text style={styles.infoIcon}>💡</Text>
        <Text style={[styles.infoText, isRTL && styles.textRTL]}>
          {t('signupProvider.infoAvailability')}
        </Text>
      </View>
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.stepContent}>
      {/* Header */}
      <View style={[styles.stepHeader, isRTL && styles.stepHeaderRTL]}>
        <Text style={[styles.stepHeaderTitle, isRTL && styles.textRTL]}>{t('signupProvider.documentsTitle')}</Text>
        <Text style={[styles.stepHeaderSubtitle, isRTL && styles.textRTL]}>{t('signupProvider.documentsSubtitle')}</Text>
      </View>

      <Text style={[styles.sectionTitle, isRTL && styles.textRTL]}>{t('signupProvider.identityDocuments')}</Text>
      <Text style={[styles.helperText, isRTL && styles.textRTL]}>
        {t('signupProvider.identityHelper')}
      </Text>

      <Input
        label={t('signupProvider.cinNumber')}
        placeholder={t('signupProvider.cinPlaceholder')}
        value={cin}
        onChangeText={(text) => setCin(text.toUpperCase())}
        errorText={errors.cin}
        error={!!errors.cin}
        helperText={t('signupProvider.cinHelper')}
        autoCapitalize="characters"
        editable={!isLoading}
      />

      {/* Upload CIN Photos */}
      <Text style={[styles.inputLabel, isRTL && styles.textRTL]}>{t('signupProvider.cinPhotos')}</Text>
      <Text style={[styles.helperText, isRTL && styles.textRTL]}>
        {t('signupProvider.cinPhotosHelper')}
      </Text>

      <View style={[styles.documentsRow, isRTL && styles.documentsRowRTL]}>
        {/* CIN Front */}
        <TouchableOpacity
          style={styles.documentUpload}
          onPress={() => pickDocument("front")}
          disabled={isLoading}
        >
          {cinFrontPhoto ? (
            <Image source={{ uri: cinFrontPhoto }} style={styles.documentImage} />
          ) : (
            <View style={styles.documentPlaceholder}>
              <Text style={styles.documentIcon}>📄</Text>
              <Text style={[styles.documentText, isRTL && styles.textRTL]}>{t('signupProvider.recto')}</Text>
            </View>
          )}
          <View style={styles.documentLabel}>
            <Text style={[styles.documentLabelText, isRTL && styles.textRTL]}>
              {cinFrontPhoto ? `✓ ${t('signupProvider.recto')}` : t('signupProvider.rectoCIN')}
            </Text>
          </View>
        </TouchableOpacity>

        {/* CIN Back */}
        <TouchableOpacity
          style={styles.documentUpload}
          onPress={() => pickDocument("back")}
          disabled={isLoading}
        >
          {cinBackPhoto ? (
            <Image source={{ uri: cinBackPhoto }} style={styles.documentImage} />
          ) : (
            <View style={styles.documentPlaceholder}>
              <Text style={styles.documentIcon}>📄</Text>
              <Text style={[styles.documentText, isRTL && styles.textRTL]}>{t('signupProvider.verso')}</Text>
            </View>
          )}
          <View style={styles.documentLabel}>
            <Text style={[styles.documentLabelText, isRTL && styles.textRTL]}>
              {cinBackPhoto ? `✓ ${t('signupProvider.verso')}` : t('signupProvider.versoCIN')}
            </Text>
          </View>
        </TouchableOpacity>
      </View>
      {errors.cinPhotos && <Text style={[styles.errorText, isRTL && styles.textRTL]}>{errors.cinPhotos}</Text>}

      <View style={[styles.infoBox, isRTL && styles.infoBoxRTL]}>
        <Text style={styles.infoIcon}>🔒</Text>
        <Text style={[styles.infoText, isRTL && styles.textRTL]}>
          {t('signupProvider.documentsSecure')}
        </Text>
      </View>

      <Text style={[styles.sectionTitle, isRTL && styles.textRTL]}>{t('signupProvider.providerCharter')}</Text>

      <View style={styles.charterBox}>
        <Text style={[styles.charterTitle, isRTL && styles.textRTL]}>{t('signupProvider.charterIntro')}</Text>
        <Text style={[styles.charterItem, isRTL && styles.charterItemRTL]}>• {t('signupProvider.charterItem1')}</Text>
        <Text style={[styles.charterItem, isRTL && styles.charterItemRTL]}>• {t('signupProvider.charterItem2')}</Text>
        <Text style={[styles.charterItem, isRTL && styles.charterItemRTL]}>• {t('signupProvider.charterItem3')}</Text>
        <Text style={[styles.charterItem, isRTL && styles.charterItemRTL]}>• {t('signupProvider.charterItem4')}</Text>
        <Text style={[styles.charterItem, isRTL && styles.charterItemRTL]}>• {t('signupProvider.charterItem5')}</Text>
      </View>

      <TouchableOpacity
        style={[styles.checkboxRow, isRTL && styles.checkboxRowRTL]}
        onPress={() => {
          setAcceptCharter(!acceptCharter);
          setErrors(prev => ({ ...prev, charter: "" }));
        }}
      >
        <View style={[styles.checkbox, acceptCharter && styles.checkboxChecked, isRTL && styles.checkboxRTL]}>
          {acceptCharter && <Text style={styles.checkmark}>✓</Text>}
        </View>
        <Text style={[styles.checkboxLabel, isRTL && styles.textRTL]}>
          {t('signupProvider.iAcceptCharter')}
        </Text>
      </TouchableOpacity>
      {errors.charter && <Text style={[styles.errorText, isRTL && styles.textRTL]}>{errors.charter}</Text>}
    </View>
  );

  const renderStep4 = () => (
    <View style={styles.stepContent}>
      {/* Header */}
      <View style={[styles.stepHeader, isRTL && styles.stepHeaderRTL]}>
        <Text style={[styles.stepHeaderTitle, isRTL && styles.textRTL]}>{t('signupProvider.bankInfoTitle')}</Text>
        <Text style={[styles.stepHeaderSubtitle, isRTL && styles.textRTL]}>{t('signupProvider.bankInfoSubtitle')}</Text>
      </View>

      {/* Explication du systeme */}
      <View style={styles.commissionExplainer}>
        <Text style={[styles.commissionTitle, isRTL && styles.textRTL]}>{t('signupProvider.howItWorks')}</Text>

        <View style={[styles.commissionItem, isRTL && styles.commissionItemRTL]}>
          <Text style={[styles.commissionIcon, isRTL && styles.commissionIconRTL]}>💳</Text>
          <View style={styles.commissionContent}>
            <Text style={[styles.commissionLabel, isRTL && styles.textRTL]}>{t('signupProvider.clientPaysByCard')}</Text>
            <Text style={[styles.commissionDesc, isRTL && styles.textRTL]}>
              {t('signupProvider.clientPaysByCardDesc')}
            </Text>
          </View>
        </View>

        <View style={[styles.commissionItem, isRTL && styles.commissionItemRTL]}>
          <Text style={[styles.commissionIcon, isRTL && styles.commissionIconRTL]}>💵</Text>
          <View style={styles.commissionContent}>
            <Text style={[styles.commissionLabel, isRTL && styles.textRTL]}>{t('signupProvider.clientPaysCash')}</Text>
            <Text style={[styles.commissionDesc, isRTL && styles.textRTL]}>
              {t('signupProvider.clientPaysCashDesc')}
            </Text>
          </View>
        </View>
      </View>

      {/* Info Commission */}
      <View style={[styles.infoBox, isRTL && styles.infoBoxRTL]}>
        <Text style={styles.infoIcon}>💰</Text>
        <Text style={[styles.infoText, isRTL && styles.textRTL]}>
          {t('signupProvider.commissionInfo')}
        </Text>
      </View>

      <Text style={[styles.sectionTitle, isRTL && styles.textRTL]}>{t('signupProvider.yourCard')}</Text>
      <Text style={[styles.helperText, isRTL && styles.textRTL]}>
        {t('signupProvider.cardHelper')}
      </Text>

      {/* Credit Card Form */}
      <CreditCardForm
        cardData={cardData}
        onCardChange={setCardData}
        errors={errors}
        disabled={isLoading}
      />

      {/* Section RIB */}
      <Text style={[styles.sectionTitle, isRTL && styles.textRTL]}>{t('signupProvider.yourRIB')}</Text>
      <Text style={[styles.helperText, isRTL && styles.textRTL]}>
        {t('signupProvider.ribHelper')}
      </Text>

      {/* RIB Form */}
      <RibForm
        ribData={ribData}
        onRibChange={setRibData}
        errors={errors}
        disabled={isLoading}
      />

      <Text style={[styles.sectionTitle, isRTL && styles.textRTL]}>{t('signupProvider.summary')}</Text>

      <View style={styles.summaryBox}>
        <View style={[styles.summaryRow, isRTL && styles.summaryRowRTL]}>
          <Text style={[styles.summaryLabel, isRTL && styles.textRTL]}>{t('signupProvider.fullName')}</Text>
          <Text style={[styles.summaryValue, isRTL && styles.summaryValueRTL]}>{firstName} {lastName}</Text>
        </View>
        <View style={[styles.summaryRow, isRTL && styles.summaryRowRTL]}>
          <Text style={[styles.summaryLabel, isRTL && styles.textRTL]}>{t('signupProvider.email')}</Text>
          <Text style={[styles.summaryValue, isRTL && styles.summaryValueRTL]}>{email}</Text>
        </View>
        <View style={[styles.summaryRow, isRTL && styles.summaryRowRTL]}>
          <Text style={[styles.summaryLabel, isRTL && styles.textRTL]}>{t('signupProvider.phone')}</Text>
          <Text style={[styles.summaryValue, isRTL && styles.summaryValueRTL]}>{phone}</Text>
        </View>
        <View style={[styles.summaryRow, isRTL && styles.summaryRowRTL]}>
          <Text style={[styles.summaryLabel, isRTL && styles.textRTL]}>{t('signupProvider.city')}</Text>
          <Text style={[styles.summaryValue, isRTL && styles.summaryValueRTL]}>{selectedCity || t('signupProvider.notSelected')}</Text>
        </View>
        <View style={[styles.summaryRow, isRTL && styles.summaryRowRTL]}>
          <Text style={[styles.summaryLabel, isRTL && styles.textRTL]}>{t('signupProvider.radius')}</Text>
          <Text style={[styles.summaryValue, isRTL && styles.summaryValueRTL]}>{interventionRadius} {t('common.km')}</Text>
        </View>
        <View style={[styles.summaryRow, isRTL && styles.summaryRowRTL]}>
          <Text style={[styles.summaryLabel, isRTL && styles.textRTL]}>{t('signupProvider.card')}</Text>
          <Text style={[styles.summaryValue, isRTL && styles.summaryValueRTL]}>
            {cardData.cardNumber ? `**** ${cardData.cardNumber.slice(-4)}` : t('signupProvider.notProvided')}
          </Text>
        </View>
        <View style={[styles.summaryRow, isRTL && styles.summaryRowRTL]}>
          <Text style={[styles.summaryLabel, isRTL && styles.textRTL]}>{t('signupProvider.rib')}</Text>
          <Text style={[styles.summaryValue, isRTL && styles.summaryValueRTL]}>
            {ribData.numero ? `****${ribData.numero.replace(/\s/g, "").slice(-4)}` : t('signupProvider.ribNotProvided')}
          </Text>
        </View>
      </View>

      {/* Success message preview */}
      <View style={[styles.successPreview, isRTL && styles.successPreviewRTL]}>
        <Text style={styles.successIcon}>🎉</Text>
        <Text style={[styles.successText, isRTL && styles.textRTL]}>
          {t('signupProvider.successPreview')}
        </Text>
      </View>

    </View>
  );

  return (
    <>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.contentContainer}
          keyboardShouldPersistTaps="handled"
        >
        <View style={styles.header}>
          <TouchableOpacity
            style={[styles.backToHomeButton, isRTL && styles.backToHomeButtonRTL]}
            onPress={() => router.push("/")}
          >
            <Text style={[styles.backToHomeIcon, isRTL && styles.backToHomeIconRTL]}>{isRTL ? '→' : '←'}</Text>
            <Text style={[styles.backToHomeText, isRTL && styles.textRTL]}>{t('signupProvider.backToHome')}</Text>
          </TouchableOpacity>
        </View>

        {renderStepIndicator()}

        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
        {currentStep === 4 && renderStep4()}

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorTextGlobal}>{error}</Text>
          </View>
        )}

        <View style={[styles.navigationButtons, isRTL && styles.navigationButtonsRTL]}>
          {currentStep > 1 && (
            <Button
              variant="outline"
              size="sm"
              onPress={handlePrevious}
              disabled={isLoading}
              style={styles.navButton}
            >
              {t('signupProvider.previous')}
            </Button>
          )}

          {currentStep < totalSteps ? (
            <Button
              variant="primary"
              size="sm"
              onPress={handleNext}
              loading={isSubmitting}
              disabled={isLoading || isSubmitting}
              style={[styles.navButton, currentStep === 1 ? styles.fullWidthButton : null] as any}
            >
              {isSubmitting ? t('signupProvider.verifying') : t('signupProvider.continue')}
            </Button>
          ) : (
            <Button
              variant="primary"
              size="sm"
              onPress={handleSignup}
              loading={isSubmitting}
              disabled={isSubmitting}
              style={styles.navButton}
            >
              {isSubmitting ? t('signupProvider.registering') : t('signupProvider.createAccount')}
            </Button>
          )}
        </View>

        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.footerLink}
            onPress={() => router.push("/auth/login")}
            disabled={isLoading}
          >
            <Text style={[styles.footerText, isRTL && styles.textRTL]}>
              {t('signupProvider.alreadyHaveAccount')}{" "}
              <Text style={styles.footerLinkText}>{t('signupProvider.login')}</Text>
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.footerLink}
            onPress={() => router.push("/auth/signup-client")}
            disabled={isLoading}
          >
            <Text style={[styles.footerText, isRTL && styles.textRTL]}>
              {t('signupProvider.areYouClient')}{" "}
              <Text style={styles.footerLinkText}>{t('signupProvider.signupHere')}</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <TermsModal
        isOpen={showTermsModal}
        onClose={() => setShowTermsModal(false)}
        userType="provider"
      />
    </KeyboardAvoidingView>

    {/* Welcome Popup - En dehors du KeyboardAvoidingView pour eviter les problemes de z-index */}
    <WelcomePopupProvider
      visible={showWelcomePopup}
      onClose={() => handleWelcomeClose(false)}
      userName={firstName}
      onGoToDashboard={() => handleWelcomeClose(true)}
      onGoToOnboarding={() => handleWelcomeClose(false)}
    />
  </>
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
  },
  header: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    marginBottom: spacing.lg,
  },
  backToHomeButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  backToHomeIcon: {
    fontSize: 18,
    color: colors.gray[600],
  },
  backToHomeText: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[600],
  },
  stepIndicator: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "flex-start",
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  stepWrapper: {
    alignItems: "center",
    position: "relative",
  },
  stepCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.gray[200],
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: spacing.sm,
  },
  stepCircleActive: {
    backgroundColor: colors.primary,
  },
  stepCircleCompleted: {
    backgroundColor: colors.success,
  },
  stepNumber: {
    fontSize: typography.fontSize.sm,
    fontWeight: "600",
    color: colors.gray[500],
  },
  stepNumberActive: {
    color: colors.white,
  },
  stepCheckmark: {
    fontSize: 16,
    color: colors.white,
    fontWeight: "bold",
  },
  stepLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.gray[400],
    marginTop: spacing.xs,
  },
  stepLabelActive: {
    color: colors.primary,
    fontWeight: "600",
  },
  stepLine: {
    position: "absolute",
    top: 18,
    left: 54,
    width: 30,
    height: 2,
    backgroundColor: colors.gray[200],
  },
  stepLineActive: {
    backgroundColor: colors.success,
  },
  stepContent: {
    paddingHorizontal: spacing.xl,
  },
  stepHeader: {
    marginBottom: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  stepHeaderTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: "bold",
    color: colors.gray[900],
    marginBottom: spacing.xs,
  },
  stepHeaderSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[500],
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: "600",
    color: colors.gray[900],
    marginTop: spacing.lg,
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  inputLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: "600",
    color: colors.gray[700],
    marginBottom: spacing.xs,
  },
  helperText: {
    fontSize: typography.fontSize.xs,
    color: colors.gray[500],
    marginBottom: spacing.sm,
  },
  row: {
    flexDirection: "row",
    gap: spacing.md,
  },
  halfInput: {
    flex: 1,
  },
  photoUpload: {
    alignSelf: "center",
    marginBottom: spacing.lg,
  },
  profilePhoto: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: colors.primary,
  },
  photoPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.gray[100],
    borderWidth: 2,
    borderColor: colors.gray[300],
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
  },
  photoIcon: {
    fontSize: 32,
    marginBottom: spacing.xs,
  },
  photoText: {
    fontSize: typography.fontSize.xs,
    color: colors.gray[500],
  },
  photoSection: {
    marginBottom: spacing.md,
  },
  photoContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  photoButton: {
    backgroundColor: colors.primary + "15",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  photoButtonText: {
    color: colors.primary,
    fontSize: typography.fontSize.sm,
    fontWeight: "600",
  },
  photoHelper: {
    fontSize: typography.fontSize.xs,
    color: colors.gray[500],
    marginTop: spacing.sm,
    fontStyle: "italic",
  },
  // Document upload styles
  documentsRow: {
    flexDirection: "row",
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  documentUpload: {
    flex: 1,
    aspectRatio: 1.4,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: colors.gray[300],
    borderStyle: "dashed",
    overflow: "hidden",
    backgroundColor: colors.gray[50],
  },
  documentImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  documentPlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  documentIcon: {
    fontSize: 32,
    marginBottom: spacing.xs,
  },
  documentText: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[500],
  },
  documentLabel: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.primary + "E0",
    paddingVertical: spacing.xs,
    alignItems: "center",
  },
  documentLabelText: {
    fontSize: typography.fontSize.xs,
    color: colors.white,
    fontWeight: "600",
  },
  categoriesSection: {
    marginBottom: spacing.md,
  },
  categoriesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  categoryChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.gray[100],
    borderWidth: 2,
    borderColor: colors.gray[200],
  },
  categoryChipSelected: {
    backgroundColor: colors.primary + "15",
    borderColor: colors.primary,
  },
  categoryIcon: {
    fontSize: 16,
    marginRight: spacing.xs,
  },
  categoryName: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[700],
    fontWeight: "500",
  },
  categoryNameSelected: {
    color: colors.primary,
    fontWeight: "600",
  },
  citiesScroll: {
    marginBottom: spacing.md,
  },
  cityChip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.gray[100],
    marginRight: spacing.sm,
    borderWidth: 2,
    borderColor: colors.gray[200],
  },
  cityChipSelected: {
    backgroundColor: colors.primary + "15",
    borderColor: colors.primary,
  },
  cityText: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[700],
    fontWeight: "500",
  },
  cityTextSelected: {
    color: colors.primary,
    fontWeight: "600",
  },
  radiusOptions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  radiusChip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.gray[100],
    borderWidth: 2,
    borderColor: colors.gray[200],
  },
  radiusChipSelected: {
    backgroundColor: colors.primary + "15",
    borderColor: colors.primary,
  },
  radiusText: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[700],
    fontWeight: "500",
  },
  radiusTextSelected: {
    color: colors.primary,
    fontWeight: "600",
  },
  infoBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: colors.primary + "10",
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  infoIcon: {
    fontSize: 20,
  },
  infoText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    color: colors.gray[600],
    lineHeight: 20,
  },
  availabilityList: {
    marginBottom: spacing.lg,
  },
  availabilityRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  dayLabel: {
    flex: 1,
    fontSize: typography.fontSize.base,
    color: colors.gray[700],
  },
  availabilityTime: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[500],
    marginLeft: spacing.md,
  },
  charterBox: {
    backgroundColor: colors.gray[50],
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
  },
  charterTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: "600",
    color: colors.gray[900],
    marginBottom: spacing.sm,
  },
  charterItem: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[600],
    marginBottom: spacing.xs,
    paddingLeft: spacing.sm,
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: spacing.sm,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.gray[300],
    marginRight: spacing.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkmark: {
    color: colors.white,
    fontSize: 14,
    fontWeight: "bold",
  },
  checkboxLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[700],
  },
  paymentOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: colors.gray[200],
    marginBottom: spacing.sm,
  },
  paymentOptionSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + "08",
  },
  paymentIcon: {
    fontSize: 28,
    marginRight: spacing.md,
  },
  paymentInfo: {
    flex: 1,
  },
  paymentTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: "600",
    color: colors.gray[900],
  },
  paymentDesc: {
    fontSize: typography.fontSize.xs,
    color: colors.gray[500],
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.gray[300],
    alignItems: "center",
    justifyContent: "center",
  },
  radioOuterSelected: {
    borderColor: colors.primary,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary,
  },
  bankDetails: {
    marginTop: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.gray[50],
    borderRadius: borderRadius.lg,
  },
  summaryBox: {
    backgroundColor: colors.gray[50],
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.lg,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: spacing.xs,
  },
  summaryLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[500],
  },
  summaryValue: {
    fontSize: typography.fontSize.sm,
    fontWeight: "600",
    color: colors.gray[900],
    flex: 1,
    textAlign: "right",
  },
  successPreview: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.success + "15",
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: colors.success + "30",
  },
  // Commission Explainer
  commissionExplainer: {
    backgroundColor: colors.gray[50],
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  commissionTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: "600",
    color: colors.gray[900],
    marginBottom: spacing.md,
  },
  commissionItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: spacing.sm,
  },
  commissionIcon: {
    fontSize: 20,
    marginRight: spacing.sm,
    width: 28,
  },
  commissionContent: {
    flex: 1,
  },
  commissionLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: "600",
    color: colors.gray[800],
    marginBottom: 2,
  },
  commissionDesc: {
    fontSize: typography.fontSize.xs,
    color: colors.gray[600],
    lineHeight: 16,
  },
  successIcon: {
    fontSize: 24,
    marginRight: spacing.sm,
  },
  successText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    color: colors.success,
    fontWeight: "500",
    lineHeight: 20,
  },
  termsSection: {
    marginTop: spacing.md,
  },
  termsTextContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
  },
  termsLink: {
    color: colors.primary,
    fontWeight: "600",
    textDecorationLine: "underline",
  },
  termsText: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[600],
  },
  termsLinks: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    marginLeft: 32,
  },
  required: {
    color: colors.error,
    fontWeight: "600",
  },
  errorContainer: {
    marginHorizontal: spacing.xl,
    padding: spacing.md,
    backgroundColor: colors.error + "15",
    borderRadius: borderRadius.lg,
    marginVertical: spacing.md,
  },
  errorText: {
    color: colors.error,
    fontSize: typography.fontSize.xs,
    marginTop: spacing.xs,
  },
  errorTextGlobal: {
    color: colors.error,
    fontSize: typography.fontSize.sm,
    textAlign: "center",
  },
  navigationButtons: {
    flexDirection: "row",
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
    marginTop: spacing.xl,
  },
  navButton: {
    flex: 1,
  },
  fullWidthButton: {
    flex: 1,
  },
  footer: {
    paddingHorizontal: spacing.xl,
    marginTop: spacing.xl,
    gap: spacing.md,
    alignItems: "center",
  },
  footerLink: {
    paddingVertical: spacing.xs,
  },
  footerText: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[600],
    textAlign: "center",
  },
  footerLinkText: {
    color: colors.primary,
    fontWeight: "600",
  },

  // RTL Styles
  textRTL: {
    textAlign: "right",
    writingDirection: "rtl",
  },
  stepIndicatorRTL: {
    flexDirection: "row-reverse",
  },
  stepLineRTL: {
    left: undefined,
    right: 54,
  },
  stepHeaderRTL: {
    alignItems: "flex-end",
  },
  backToHomeButtonRTL: {
    flexDirection: "row-reverse",
  },
  backToHomeIconRTL: {
    marginRight: 0,
    marginLeft: spacing.xs,
  },
  photoContainerRTL: {
    flexDirection: "row-reverse",
  },
  checkboxRowRTL: {
    flexDirection: "row-reverse",
  },
  checkboxRTL: {
    marginRight: 0,
    marginLeft: spacing.sm,
  },
  termsLinksRTL: {
    flexDirection: "row-reverse",
    marginLeft: 0,
    marginRight: 32,
  },
  citiesContentRTL: {
    flexDirection: "row-reverse",
  },
  cityChipRTL: {
    marginRight: 0,
    marginLeft: spacing.sm,
  },
  radiusOptionsRTL: {
    flexDirection: "row-reverse",
    flexWrap: "wrap",
  },
  infoBoxRTL: {
    flexDirection: "row-reverse",
  },
  documentsRowRTL: {
    flexDirection: "row-reverse",
  },
  charterItemRTL: {
    textAlign: "right",
    paddingLeft: 0,
    paddingRight: spacing.sm,
  },
  commissionItemRTL: {
    flexDirection: "row-reverse",
  },
  commissionIconRTL: {
    marginRight: 0,
    marginLeft: spacing.sm,
  },
  summaryRowRTL: {
    flexDirection: "row-reverse",
  },
  summaryValueRTL: {
    textAlign: "left",
  },
  successPreviewRTL: {
    flexDirection: "row-reverse",
  },
  navigationButtonsRTL: {
    flexDirection: "row-reverse",
  },
});
