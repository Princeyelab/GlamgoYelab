'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from './page.module.scss';
import Button from '@/components/Button';
import apiClient from '@/lib/apiClient';
import TermsModal from '@/components/TermsModal';
import AddressAutocomplete from '@/components/AddressAutocomplete';
import PaymentMethodSetup from '@/components/PaymentMethodSetup/PaymentMethodSetup';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { useLanguage } from '@/contexts/LanguageContext';

const DAYS_OF_WEEK = [
  { key: 'monday', labelKey: 'providerRegister.monday' },
  { key: 'tuesday', labelKey: 'providerRegister.tuesday' },
  { key: 'wednesday', labelKey: 'providerRegister.wednesday' },
  { key: 'thursday', labelKey: 'providerRegister.thursday' },
  { key: 'friday', labelKey: 'providerRegister.friday' },
  { key: 'saturday', labelKey: 'providerRegister.saturday' },
  { key: 'sunday', labelKey: 'providerRegister.sunday' },
];

const DEFAULT_AVAILABILITY = {
  monday: { available: true, start: '09:00', end: '18:00' },
  tuesday: { available: true, start: '09:00', end: '18:00' },
  wednesday: { available: true, start: '09:00', end: '18:00' },
  thursday: { available: true, start: '09:00', end: '18:00' },
  friday: { available: true, start: '09:00', end: '18:00' },
  saturday: { available: true, start: '09:00', end: '18:00' },
  sunday: { available: false, start: '09:00', end: '18:00' },
};

export default function ProviderRegisterPage() {
  const router = useRouter();
  const { t, isRTL } = useLanguage();

  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Étape 1: Infos personnelles + Pro
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    password: '',
    password_confirmation: '',
    date_of_birth: '',
    bio: '',
    experience_years: '',
    profile_photo: null,
    profile_photo_preview: null,
    // Étape 2: Localisation + Zone
    address: '',
    city: '',
    latitude: null,
    longitude: null,
    intervention_radius: 15,
    availability_schedule: DEFAULT_AVAILABILITY,
    // Étape 3: Documents
    cin_number: '',
    cin_front: null,
    cin_back: null,
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirmation, setShowPasswordConfirmation] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedCharter, setAcceptedCharter] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [termsAcceptedAt, setTermsAcceptedAt] = useState(null);
  const [registeredSuccessfully, setRegisteredSuccessfully] = useState(false);

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    if (type === 'select-multiple') {
      const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
      setFormData((prev) => ({
        ...prev,
        [name]: selectedOptions,
      }));
    } else if (type === 'file') {
      const file = e.target.files[0];
      // Gestion speciale pour la photo de profil avec preview
      if (name === 'profile_photo' && file) {
        // Validation du fichier
        if (file.size > 5 * 1024 * 1024) {
          setErrors(prev => ({ ...prev, profile_photo: 'La photo ne doit pas depasser 5 MB' }));
          return;
        }
        if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type)) {
          setErrors(prev => ({ ...prev, profile_photo: 'Format accepte: JPG, PNG ou WEBP' }));
          return;
        }
        // Creer une preview
        const reader = new FileReader();
        reader.onloadend = () => {
          setFormData((prev) => ({
            ...prev,
            profile_photo: file,
            profile_photo_preview: reader.result,
          }));
        };
        reader.readAsDataURL(file);
      } else {
        setFormData((prev) => ({
          ...prev,
          [name]: file,
        }));
      }
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const handleAvailabilityChange = (day, field, value) => {
    setFormData((prev) => ({
      ...prev,
      availability_schedule: {
        ...prev.availability_schedule,
        [day]: {
          ...prev.availability_schedule[day],
          [field]: value,
        },
      },
    }));
  };

  const validateStep1 = () => {
    const newErrors = {};

    if (!formData.first_name.trim()) {
      newErrors.first_name = t('register.firstNameRequired');
    }

    if (!formData.last_name.trim()) {
      newErrors.last_name = t('register.lastNameRequired');
    }

    if (!formData.email.trim()) {
      newErrors.email = t('login.emailRequired');
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = t('login.emailInvalid');
    }

    if (!formData.phone.trim()) {
      newErrors.phone = t('register.phoneRequired');
    } else if (!/^(06|07)[0-9]{8}$/.test(formData.phone.replace(/[\s-]/g, ''))) {
      newErrors.phone = t('register.phoneInvalid');
    }

    if (!formData.date_of_birth) {
      newErrors.date_of_birth = t('register.birthDateRequired');
    } else {
      const birthDate = new Date(formData.date_of_birth);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      const dayDiff = today.getDate() - birthDate.getDate();

      if (age < 18 || (age === 18 && (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)))) {
        newErrors.date_of_birth = t('register.mustBe18');
      }
    }

    if (!formData.password) {
      newErrors.password = t('login.passwordRequired');
    } else if (formData.password.length < 6) {
      newErrors.password = t('register.passwordMinLength');
    }

    if (!formData.password_confirmation) {
      newErrors.password_confirmation = t('register.confirmPasswordRequired');
    } else if (formData.password !== formData.password_confirmation) {
      newErrors.password_confirmation = t('register.passwordsDontMatch');
    }

    if (!formData.bio.trim()) {
      newErrors.bio = t('providerRegister.bioRequired');
    } else if (formData.bio.length < 50) {
      newErrors.bio = t('providerRegister.bioMinLength');
    }

    if (!formData.experience_years) {
      newErrors.experience_years = t('providerRegister.experienceRequired');
    } else if (isNaN(formData.experience_years) || formData.experience_years < 0) {
      newErrors.experience_years = t('providerRegister.experienceInvalid');
    }

    if (!formData.profile_photo) {
      newErrors.profile_photo = t('providerRegister.photoRequired');
    }

    if (!acceptedTerms) {
      newErrors.terms = t('register.acceptTerms');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors = {};

    if (!formData.address.trim()) {
      newErrors.address = t('register.addressRequired');
    }

    if (!formData.latitude || !formData.longitude) {
      newErrors.address = t('register.selectAddressWithGeo');
    }

    if (!formData.city.trim()) {
      newErrors.city = t('register.cityRequired');
    }

    if (!formData.intervention_radius || formData.intervention_radius < 5) {
      newErrors.intervention_radius = t('providerRegister.radiusMinimum');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep3 = () => {
    const newErrors = {};

    if (!formData.cin_number.trim()) {
      newErrors.cin_number = t('providerRegister.cinRequired');
    } else if (!/^[A-Z]{1,2}[0-9]{6,7}$/.test(formData.cin_number.toUpperCase())) {
      newErrors.cin_number = t('providerRegister.cinInvalid');
    }

    // Photos CIN optionnelles en phase de test
    // if (!formData.cin_front) {
    //   newErrors.cin_front = 'La photo recto de la CIN est requise';
    // }

    // if (!formData.cin_back) {
    //   newErrors.cin_back = 'La photo verso de la CIN est requise';
    // }

    if (!acceptedCharter) {
      newErrors.charter = t('providerRegister.charterRequired');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleTermsChange = (e) => {
    const checked = e.target.checked;
    setAcceptedTerms(checked);
    if (checked) {
      setTermsAcceptedAt(new Date().toISOString());
    } else {
      setTermsAcceptedAt(null);
    }
    if (errors.terms) {
      setErrors((prev) => ({ ...prev, terms: '' }));
    }
  };

  const handlePlaceSelected = ({ address, latitude, longitude }) => {
    setFormData((prev) => ({
      ...prev,
      address,
      latitude,
      longitude,
    }));
    if (errors.address) {
      setErrors((prev) => ({ ...prev, address: '' }));
    }
  };

  const handleNextStep = () => {
    if (currentStep === 1 && validateStep1()) {
      setCurrentStep(2);
      window.scrollTo(0, 0);
    } else if (currentStep === 2 && validateStep2()) {
      handleSubmitRegistration();
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      window.scrollTo(0, 0);
    }
  };

  const handleSubmitRegistration = async () => {
    setServerError('');
    setLoading(true);

    try {
      // Utiliser FormData pour envoyer la photo
      const formDataToSend = new FormData();
      formDataToSend.append('first_name', formData.first_name);
      formDataToSend.append('last_name', formData.last_name);
      formDataToSend.append('email', formData.email);
      formDataToSend.append('phone', formData.phone);
      formDataToSend.append('password', formData.password);
      formDataToSend.append('password_confirmation', formData.password_confirmation);
      formDataToSend.append('date_of_birth', formData.date_of_birth);
      formDataToSend.append('bio', formData.bio);
      formDataToSend.append('experience_years', formData.experience_years);
      formDataToSend.append('address', formData.address);
      formDataToSend.append('city', formData.city);
      formDataToSend.append('latitude', formData.latitude);
      formDataToSend.append('longitude', formData.longitude);
      formDataToSend.append('intervention_radius', formData.intervention_radius);
      formDataToSend.append('availability_schedule', JSON.stringify(formData.availability_schedule));
      formDataToSend.append('terms_accepted', 'true');
      formDataToSend.append('terms_accepted_at', termsAcceptedAt || '');

      // Ajouter la photo de profil
      if (formData.profile_photo) {
        formDataToSend.append('profile_photo', formData.profile_photo);
      }

      const response = await apiClient.providerRegisterWithPhoto(formDataToSend);

      if (response.success) {
        try {
          const loginResponse = await apiClient.providerLogin(
            formData.email,
            formData.password,
            true
          );

          if (loginResponse.success && loginResponse.data?.provider) {
            localStorage.setItem('user', JSON.stringify(loginResponse.data.provider));
          }
        } catch (loginError) {
          console.error('Auto-login error:', loginError);
        }

        // Sauvegarder TOUTES les données pour le profil
        const providerTempData = {
          first_name: registrationData.first_name,
          last_name: registrationData.last_name,
          email: registrationData.email,
          phone: registrationData.phone,
          date_of_birth: registrationData.date_of_birth,
          address: registrationData.address,
          city: registrationData.city,
          latitude: registrationData.latitude,
          longitude: registrationData.longitude,
          bio: registrationData.bio,
          experience_years: registrationData.experience_years,
          intervention_radius: registrationData.intervention_radius,
          availability_schedule: registrationData.availability_schedule,
        };
        localStorage.setItem('provider_temp_data', JSON.stringify(providerTempData));

        setRegisteredSuccessfully(true);
        setSuccessMessage(t('providerRegister.registrationSuccess'));
        setTimeout(() => {
          setCurrentStep(3);
          setSuccessMessage('');
        }, 1500);
      } else {
        if (response.errors && typeof response.errors === 'object') {
          const backendErrors = {};
          Object.keys(response.errors).forEach(field => {
            backendErrors[field] = Array.isArray(response.errors[field])
              ? response.errors[field][0]
              : response.errors[field];
          });
          setErrors(backendErrors);
        }
        setServerError(response.error || response.message || t('message.genericError'));
      }
    } catch (error) {
      console.error('Provider registration error:', error);
      setServerError(error.message || t('message.genericError'));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitDocuments = async () => {
    if (!validateStep3()) {
      return;
    }

    setLoading(true);
    setServerError('');

    try {
      // Sauvegarder les infos CIN en localStorage pour plus tard
      const providerTempData = JSON.parse(localStorage.getItem('provider_temp_data') || '{}');
      providerTempData.cin_number = formData.cin_number.toUpperCase();
      providerTempData.charter_accepted = true;
      localStorage.setItem('provider_temp_data', JSON.stringify(providerTempData));

      // Essayer d'uploader les documents si l'endpoint existe
      if (formData.cin_front || formData.cin_back) {
        try {
          const documentsFormData = new FormData();
          documentsFormData.append('cin_number', formData.cin_number.toUpperCase());
          if (formData.cin_front) documentsFormData.append('cin_front', formData.cin_front);
          if (formData.cin_back) documentsFormData.append('cin_back', formData.cin_back);
          documentsFormData.append('charter_accepted', 'true');

          const token = apiClient.getToken();
          const uploadResponse = await fetch(`${apiClient.baseURL}/provider/documents`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
            },
            body: documentsFormData,
          });

          if (uploadResponse.ok) {
            const uploadData = await uploadResponse.json();
            console.log('Documents uploaded:', uploadData);
          }
        } catch (uploadError) {
          // Ignorer l'erreur d'upload en phase de test
          console.log('Documents upload skipped (endpoint not available)');
        }
      }

      // Passer à l'étape paiement
      setSuccessMessage(t('providerRegister.docsSuccess'));
      setTimeout(() => {
        setCurrentStep(4);
        setSuccessMessage('');
      }, 1000);
    } catch (error) {
      console.error('Documents error:', error);
      setServerError(t('common.errorOccurred'));
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = (data) => {
    // Aller à l'onboarding pour sélectionner les services
    setTimeout(() => {
      window.location.href = '/provider/onboarding';
    }, 1500);
  };

  const handleSkipPayment = () => {
    // Aller à l'onboarding pour sélectionner les services
    window.location.href = '/provider/onboarding';
  };

  const stepTitles = {
    1: t('providerRegister.personalInfo'),
    2: t('providerRegister.locationAvailability'),
    3: t('providerRegister.officialDocs'),
    4: t('providerRegister.paymentInfo')
  };

  const stepSubtitles = {
    1: t('providerRegister.createProfile'),
    2: t('providerRegister.defineZone'),
    3: t('providerRegister.identityVerification'),
    4: t('providerRegister.receivePayments')
  };

  return (
    <div className={styles.registerPage} dir={isRTL ? 'rtl' : 'ltr'}>
      <div className={styles.languageSwitcherContainer}>
        <LanguageSwitcher />
      </div>
      <div className={styles.container}>
        <div className={styles.formCard}>
          <div className={styles.backLink}>
            <Link href="/" className={styles.backButton}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
              {t('login.backToHome')}
            </Link>
          </div>

          {/* Indicateur d'étapes */}
          <div className={styles.stepsIndicator}>
            <div className={`${styles.step} ${currentStep >= 1 ? styles.stepActive : ''} ${currentStep > 1 ? styles.stepCompleted : ''}`}>
              <div className={styles.stepNumber}>{currentStep > 1 ? '✓' : '1'}</div>
              <span className={styles.stepLabel}>{t('providerRegister.stepInfo')}</span>
            </div>
            <div className={styles.stepLine}></div>
            <div className={`${styles.step} ${currentStep >= 2 ? styles.stepActive : ''} ${currentStep > 2 ? styles.stepCompleted : ''}`}>
              <div className={styles.stepNumber}>{currentStep > 2 ? '✓' : '2'}</div>
              <span className={styles.stepLabel}>{t('providerRegister.stepZone')}</span>
            </div>
            <div className={styles.stepLine}></div>
            <div className={`${styles.step} ${currentStep >= 3 ? styles.stepActive : ''} ${currentStep > 3 ? styles.stepCompleted : ''}`}>
              <div className={styles.stepNumber}>{currentStep > 3 ? '✓' : '3'}</div>
              <span className={styles.stepLabel}>{t('providerRegister.stepDocs')}</span>
            </div>
            <div className={styles.stepLine}></div>
            <div className={`${styles.step} ${currentStep >= 4 ? styles.stepActive : ''}`}>
              <div className={styles.stepNumber}>4</div>
              <span className={styles.stepLabel}>{t('providerRegister.stepPayment')}</span>
            </div>
          </div>

          <h1 className={styles.title}>{stepTitles[currentStep]}</h1>
          <p className={styles.subtitle}>{stepSubtitles[currentStep]}</p>

          {successMessage && (
            <div className={styles.successAlert}>{successMessage}</div>
          )}

          {serverError && (
            <div className={styles.errorAlert}>{serverError}</div>
          )}

          {/* ÉTAPE 1: Informations personnelles + Professionnel */}
          {currentStep === 1 && (
            <form onSubmit={(e) => { e.preventDefault(); handleNextStep(); }} className={styles.form}>
              <div className={styles.section}>
                <h3 className={styles.sectionTitle}>{t('providerRegister.personalInfo')}</h3>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label htmlFor="first_name" className={styles.label}>
                      {t('form.firstName')} <span className={styles.required}>*</span>
                    </label>
                    <input
                      type="text"
                      id="first_name"
                      name="first_name"
                      value={formData.first_name}
                      onChange={handleChange}
                      className={`${styles.input} ${errors.first_name ? styles.inputError : ''}`}
                      placeholder={t('register.yourFirstName')}
                    />
                    {errors.first_name && <span className={styles.error}>{errors.first_name}</span>}
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="last_name" className={styles.label}>
                      {t('form.lastName')} <span className={styles.required}>*</span>
                    </label>
                    <input
                      type="text"
                      id="last_name"
                      name="last_name"
                      value={formData.last_name}
                      onChange={handleChange}
                      className={`${styles.input} ${errors.last_name ? styles.inputError : ''}`}
                      placeholder={t('register.yourLastName')}
                    />
                    {errors.last_name && <span className={styles.error}>{errors.last_name}</span>}
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="email" className={styles.label}>
                    {t('form.email')} <span className={styles.required}>*</span>
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`${styles.input} ${errors.email ? styles.inputError : ''}`}
                    placeholder="votre.email@exemple.com"
                  />
                  {errors.email && <span className={styles.error}>{errors.email}</span>}
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label htmlFor="phone" className={styles.label}>
                      {t('form.phone')} <span className={styles.required}>*</span>
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className={`${styles.input} ${errors.phone ? styles.inputError : ''}`}
                      placeholder="0612345678"
                    />
                    {errors.phone && <span className={styles.error}>{errors.phone}</span>}
                    <small className={styles.hint}>{t('providerRegister.phoneHint')}</small>
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="date_of_birth" className={styles.label}>
                      {t('profile.birthDate')} <span className={styles.required}>*</span>
                    </label>
                    <input
                      type="date"
                      id="date_of_birth"
                      name="date_of_birth"
                      value={formData.date_of_birth}
                      onChange={handleChange}
                      className={`${styles.input} ${errors.date_of_birth ? styles.inputError : ''}`}
                      max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split('T')[0]}
                    />
                    {errors.date_of_birth && <span className={styles.error}>{errors.date_of_birth}</span>}
                  </div>
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label htmlFor="password" className={styles.label}>
                      {t('form.password')} <span className={styles.required}>*</span>
                    </label>
                    <div className={styles.passwordWrapper}>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        id="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        className={`${styles.input} ${errors.password ? styles.inputError : ''}`}
                        placeholder={t('register.minimum6Chars')}
                      />
                      <button
                        type="button"
                        className={styles.passwordToggle}
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? '🙈' : '👁️'}
                      </button>
                    </div>
                    {errors.password && <span className={styles.error}>{errors.password}</span>}
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="password_confirmation" className={styles.label}>
                      {t('form.confirmPassword')} <span className={styles.required}>*</span>
                    </label>
                    <div className={styles.passwordWrapper}>
                      <input
                        type={showPasswordConfirmation ? 'text' : 'password'}
                        id="password_confirmation"
                        name="password_confirmation"
                        value={formData.password_confirmation}
                        onChange={handleChange}
                        className={`${styles.input} ${errors.password_confirmation ? styles.inputError : ''}`}
                        placeholder={t('register.retypePassword')}
                      />
                      <button
                        type="button"
                        className={styles.passwordToggle}
                        onClick={() => setShowPasswordConfirmation(!showPasswordConfirmation)}
                      >
                        {showPasswordConfirmation ? '🙈' : '👁️'}
                      </button>
                    </div>
                    {errors.password_confirmation && <span className={styles.error}>{errors.password_confirmation}</span>}
                  </div>
                </div>
              </div>

              <div className={styles.section}>
                <h3 className={styles.sectionTitle}>{t('providerRegister.professionalProfile')}</h3>

                <div className={styles.formGroup}>
                  <label className={styles.label}>
                    {t('providerRegister.profilePhoto')} <span className={styles.required}>*</span>
                  </label>
                  <div className={styles.profilePhotoUpload}>
                    <div className={`${styles.photoPreview} ${errors.profile_photo ? styles.photoError : ''}`}>
                      {formData.profile_photo_preview ? (
                        <img src={formData.profile_photo_preview} alt="Preview" />
                      ) : (
                        <div className={styles.photoPlaceholder}>
                          <span className={styles.photoIcon}>📷</span>
                          <span>{t('providerRegister.yourPhoto')}</span>
                        </div>
                      )}
                    </div>
                    <div className={styles.photoUploadInfo}>
                      <label htmlFor="profile_photo" className={styles.photoUploadBtn}>
                        {formData.profile_photo ? t('providerRegister.changePhoto') : t('providerRegister.choosePhoto')}
                      </label>
                      <input
                        type="file"
                        id="profile_photo"
                        name="profile_photo"
                        onChange={handleChange}
                        accept="image/jpeg,image/jpg,image/png,image/webp"
                        style={{ display: 'none' }}
                      />
                      <p className={styles.photoHint}>
                        {t('providerRegister.photoHint')}
                      </p>
                      {errors.profile_photo && <span className={styles.error}>{errors.profile_photo}</span>}
                    </div>
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="bio" className={styles.label}>
                    {t('providerRegister.serviceDescription')} <span className={styles.required}>*</span>
                  </label>
                  <textarea
                    id="bio"
                    name="bio"
                    value={formData.bio}
                    onChange={handleChange}
                    className={`${styles.textarea} ${errors.bio ? styles.inputError : ''}`}
                    placeholder={t('providerRegister.descPlaceholder')}
                    rows={4}
                  />
                  {errors.bio && <span className={styles.error}>{errors.bio}</span>}
                  <small className={styles.hint}>{formData.bio.length}/50 {t('providerRegister.minChars')}</small>
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="experience_years" className={styles.label}>
                    {t('providerRegister.experienceYears')} <span className={styles.required}>*</span>
                  </label>
                  <input
                    type="number"
                    id="experience_years"
                    name="experience_years"
                    value={formData.experience_years}
                    onChange={handleChange}
                    className={`${styles.input} ${errors.experience_years ? styles.inputError : ''}`}
                    placeholder="Ex: 5"
                    min="0"
                  />
                  {errors.experience_years && <span className={styles.error}>{errors.experience_years}</span>}
                </div>
              </div>

              <div className={styles.termsSection}>
                <label className={styles.termsLabel}>
                  <input
                    type="checkbox"
                    checked={acceptedTerms}
                    onChange={handleTermsChange}
                    className={styles.termsCheckbox}
                  />
                  <span className={styles.termsText}>
                    {t('register.iAccept')}{' '}
                    <button type="button" onClick={() => setShowTermsModal(true)} className={styles.termsLink}>
                      {t('register.termsAndConditions')}
                    </button>
                    {' '}<span className={styles.required}>*</span>
                  </span>
                </label>
                {errors.terms && <span className={styles.error}>{errors.terms}</span>}
              </div>

              <Button type="submit" variant="primary" size="large" fullWidth disabled={loading}>
                {t('register.continue')}
              </Button>
            </form>
          )}

          {/* ÉTAPE 2: Localisation + Zone d'intervention */}
          {currentStep === 2 && (
            <div className={styles.form}>
              <div className={styles.section}>
                <h3 className={styles.sectionTitle}>{t('providerRegister.professionalAddress')}</h3>

                <div className={styles.formGroup}>
                  <label htmlFor="address" className={styles.label}>
                    {t('register.completeAddress')} <span className={styles.required}>*</span>
                  </label>
                  <AddressAutocomplete
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    onPlaceSelected={handlePlaceSelected}
                    placeholder={t('register.startTypingAddress')}
                    className={styles.input}
                    error={errors.address}
                    required
                  />
                  {errors.address && <span className={styles.error}>{errors.address}</span>}
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="city" className={styles.label}>
                    {t('form.city')} <span className={styles.required}>*</span>
                  </label>
                  <select
                    id="city"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    className={`${styles.input} ${errors.city ? styles.inputError : ''}`}
                  >
                    <option value="">{t('register.selectCity')}</option>
                    <option value="Casablanca">Casablanca</option>
                    <option value="Rabat">Rabat</option>
                    <option value="Marrakech">Marrakech</option>
                    <option value="Fès">Fès</option>
                    <option value="Tanger">Tanger</option>
                    <option value="Agadir">Agadir</option>
                    <option value="Meknès">Meknès</option>
                    <option value="Oujda">Oujda</option>
                    <option value="Kenitra">Kenitra</option>
                    <option value="Tétouan">Tétouan</option>
                    <option value="Safi">Safi</option>
                    <option value="Mohammédia">Mohammédia</option>
                    <option value="El Jadida">El Jadida</option>
                  </select>
                  {errors.city && <span className={styles.error}>{errors.city}</span>}
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="intervention_radius" className={styles.label}>
                    {t('providerRegister.interventionRadius')}: <strong>{formData.intervention_radius} km</strong>
                  </label>
                  <input
                    type="range"
                    id="intervention_radius"
                    name="intervention_radius"
                    value={formData.intervention_radius}
                    onChange={handleChange}
                    className={styles.rangeInput}
                    min="5"
                    max="50"
                    step="5"
                  />
                  <div className={styles.rangeLabels}>
                    <span>5 km</span>
                    <span>50 km</span>
                  </div>
                  {errors.intervention_radius && <span className={styles.error}>{errors.intervention_radius}</span>}
                </div>
              </div>

              <div className={styles.section}>
                <h3 className={styles.sectionTitle}>{t('providerRegister.availability')}</h3>
                <p className={styles.sectionHint}>{t('providerRegister.availabilityHint')}</p>

                <div className={styles.availabilityGrid}>
                  {DAYS_OF_WEEK.map(({ key, labelKey }) => (
                    <div key={key} className={styles.availabilityRow}>
                      <label className={styles.availabilityDay}>
                        <input
                          type="checkbox"
                          checked={formData.availability_schedule[key].available}
                          onChange={(e) => handleAvailabilityChange(key, 'available', e.target.checked)}
                        />
                        <span>{t(labelKey)}</span>
                      </label>
                      {formData.availability_schedule[key].available && (
                        <div className={styles.availabilityTimes}>
                          <input
                            type="time"
                            value={formData.availability_schedule[key].start}
                            onChange={(e) => handleAvailabilityChange(key, 'start', e.target.value)}
                            className={styles.timeInput}
                          />
                          <span>{t('providerRegister.to')}</span>
                          <input
                            type="time"
                            value={formData.availability_schedule[key].end}
                            onChange={(e) => handleAvailabilityChange(key, 'end', e.target.value)}
                            className={styles.timeInput}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className={styles.buttonRow}>
                <Button type="button" variant="outline" size="large" onClick={handlePrevStep}>
                  {t('register.back')}
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  size="large"
                  onClick={handleNextStep}
                  loading={loading}
                  disabled={loading}
                >
                  {loading ? t('register.registering') : t('register.continue')}
                </Button>
              </div>
            </div>
          )}

          {/* ÉTAPE 3: Documents */}
          {currentStep === 3 && (
            <div className={styles.form}>
              <div className={styles.section}>
                <h3 className={styles.sectionTitle}>{t('providerRegister.nationalId')}</h3>

                <div className={styles.formGroup}>
                  <label htmlFor="cin_number" className={styles.label}>
                    {t('providerRegister.cinNumber')} <span className={styles.required}>*</span>
                  </label>
                  <input
                    type="text"
                    id="cin_number"
                    name="cin_number"
                    value={formData.cin_number}
                    onChange={handleChange}
                    className={`${styles.input} ${errors.cin_number ? styles.inputError : ''}`}
                    placeholder="AB123456"
                  />
                  {errors.cin_number && <span className={styles.error}>{errors.cin_number}</span>}
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>
                      {t('providerRegister.cinFrontPhoto')} <span className={styles.optional}>({t('providerRegister.optional')})</span>
                    </label>
                    <div className={styles.fileInputWrapper}>
                      <label
                        htmlFor="cin_front"
                        className={`${styles.fileInputLabel} ${formData.cin_front ? styles.hasFile : ''} ${errors.cin_front ? styles.hasError : ''}`}
                      >
                        <div className={styles.fileInputContent}>
                          <span className={styles.fileInputIcon}>📄</span>
                          <div className={styles.fileInputText}>
                            <strong>{formData.cin_front ? formData.cin_front.name : t('providerRegister.frontCin')}</strong>
                            <span>JPG, PNG - max 5MB</span>
                          </div>
                        </div>
                      </label>
                      <input
                        type="file"
                        id="cin_front"
                        name="cin_front"
                        onChange={handleChange}
                        className={styles.fileInputHidden}
                        accept=".jpg,.jpeg,.png"
                      />
                    </div>
                    {errors.cin_front && <span className={styles.error}>{errors.cin_front}</span>}
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.label}>
                      {t('providerRegister.cinBackPhoto')} <span className={styles.optional}>({t('providerRegister.optional')})</span>
                    </label>
                    <div className={styles.fileInputWrapper}>
                      <label
                        htmlFor="cin_back"
                        className={`${styles.fileInputLabel} ${formData.cin_back ? styles.hasFile : ''} ${errors.cin_back ? styles.hasError : ''}`}
                      >
                        <div className={styles.fileInputContent}>
                          <span className={styles.fileInputIcon}>📄</span>
                          <div className={styles.fileInputText}>
                            <strong>{formData.cin_back ? formData.cin_back.name : t('providerRegister.backCin')}</strong>
                            <span>JPG, PNG - max 5MB</span>
                          </div>
                        </div>
                      </label>
                      <input
                        type="file"
                        id="cin_back"
                        name="cin_back"
                        onChange={handleChange}
                        className={styles.fileInputHidden}
                        accept=".jpg,.jpeg,.png"
                      />
                    </div>
                    {errors.cin_back && <span className={styles.error}>{errors.cin_back}</span>}
                  </div>
                </div>
              </div>

              <div className={styles.termsSection}>
                <label className={styles.termsLabel}>
                  <input
                    type="checkbox"
                    checked={acceptedCharter}
                    onChange={(e) => {
                      setAcceptedCharter(e.target.checked);
                      if (errors.charter) setErrors(prev => ({ ...prev, charter: '' }));
                    }}
                    className={styles.termsCheckbox}
                  />
                  <span className={styles.termsText}>
                    {t('providerRegister.charterAccept')}{' '}
                    <span className={styles.required}>*</span>
                  </span>
                </label>
                {errors.charter && <span className={styles.error}>{errors.charter}</span>}
              </div>

              <div className={styles.buttonRow}>
                <Button type="button" variant="outline" size="large" onClick={handlePrevStep}>
                  {t('register.back')}
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  size="large"
                  onClick={handleSubmitDocuments}
                  loading={loading}
                  disabled={loading}
                >
                  {loading ? t('common.sending') : t('register.continue')}
                </Button>
              </div>
            </div>
          )}

          {/* ÉTAPE 4: Paiement */}
          {currentStep === 4 && (
            <div className={styles.paymentStep}>
              <div className={styles.paymentInfo}>
                <p>
                  {t('providerRegister.paymentInfoText')}
                </p>
              </div>
              <PaymentMethodSetup
                onSuccess={handlePaymentSuccess}
                userType="provider"
                skipable={true}
                onSkip={handleSkipPayment}
              />
            </div>
          )}

          {currentStep === 1 && (
            <div className={styles.footer}>
              <p>
                {t('providerRegister.haveAccount')}{' '}
                <Link href="/provider/login" className={styles.link}>
                  {t('register.logIn')}
                </Link>
              </p>
              <p>
                {t('providerRegister.areClient')}{' '}
                <Link href="/register" className={styles.link}>
                  {t('providerRegister.registerHere')}
                </Link>
              </p>
            </div>
          )}
        </div>
      </div>

      <TermsModal
        isOpen={showTermsModal}
        onClose={() => setShowTermsModal(false)}
        userType="provider"
      />
    </div>
  );
}
