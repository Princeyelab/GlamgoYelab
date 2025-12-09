'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from './page.module.scss';
import Button from '@/components/Button';
import apiClient from '@/lib/apiClient';
import { api } from '@/lib/api';
import TermsModal from '@/components/TermsModal';
import AddressAutocomplete from '@/components/AddressAutocomplete';
import PaymentMethodSetup from '@/components/PaymentMethodSetup/PaymentMethodSetup';
import ServiceSelector from '@/components/ServiceSelector/ServiceSelector';
import { saveClientTempData } from '@/lib/clientDataHelper';
import { useLanguage } from '@/contexts/LanguageContext';

export default function RegisterPage() {
  const router = useRouter();
  const { t } = useLanguage();

  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    date_of_birth: '',
    password: '',
    password_confirmation: '',
    address: '',
    city: '',
    latitude: null,
    longitude: null,
    preferred_services: [],
    preferred_payment_method: 'card',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirmation, setShowPasswordConfirmation] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [termsAcceptedAt, setTermsAcceptedAt] = useState(null);
  const [registeredUserId, setRegisteredUserId] = useState(null);
  const [services, setServices] = useState([]);

  // Charger les services disponibles
  useEffect(() => {
    const loadServices = async () => {
      try {
        const response = await api.getServices();
        setServices(response.data || []);
      } catch (error) {
        console.error('Erreur chargement services:', error);
      }
    };
    loadServices();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
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

  const handleNextStep = async () => {
    if (currentStep === 1) {
      if (validateStep1()) {
        setCurrentStep(2);
      }
    } else if (currentStep === 2) {
      if (validateStep2()) {
        await handleSubmitRegistration();
      }
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmitRegistration = async () => {
    setServerError('');
    setLoading(true);

    try {
      const registrationData = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        phone: formData.phone,
        date_of_birth: formData.date_of_birth,
        address: formData.address,
        city: formData.city,
        latitude: formData.latitude,
        longitude: formData.longitude,
        password: formData.password,
        password_confirmation: formData.password_confirmation,
        terms_accepted: true,
        privacy_accepted: true,
        terms_accepted_at: termsAcceptedAt,
      };

      const response = await apiClient.register(registrationData);

      if (response.success) {
        try {
          const loginResponse = await apiClient.login(
            formData.email,
            formData.password,
            true
          );

          if (loginResponse.success && loginResponse.data?.token) {
            const token = loginResponse.data.token;
            localStorage.setItem('token', token);
            localStorage.setItem('auth_token', token);

            if (loginResponse.data.user) {
              localStorage.setItem('user', JSON.stringify(loginResponse.data.user));
              setRegisteredUserId(loginResponse.data.user.id);
            }

            // Sauvegarder les données client en localStorage pour les afficher sur la page profil
            // (le backend ne retourne pas toujours ces champs)
            saveClientTempData({
              date_of_birth: formData.date_of_birth,
              address: formData.address,
              city: formData.city,
              latitude: formData.latitude,
              longitude: formData.longitude,
              phone: formData.phone,
            });

            setSuccessMessage(t('register.successRegistration'));
            setTimeout(() => {
              setCurrentStep(3);
              setSuccessMessage('');
            }, 1500);
          } else {
            setServerError(t('register.connectionError'));
          }
        } catch (loginError) {
          console.error('Auto-login error:', loginError);
          setServerError(t('register.connectionError'));
        }
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
        setServerError(response.error || response.message || "Une erreur s'est produite");
      }
    } catch (error) {
      console.error('Registration error:', error);
      setServerError(error.message || "Une erreur s'est produite lors de l'inscription");
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = async (data) => {
    console.log('Carte validée avec succès:', data);
    setSuccessMessage(t('register.cardSaved'));
    setTimeout(() => {
      setCurrentStep(4);
      setSuccessMessage('');
    }, 1500);
  };

  const handleSkipPreferences = async () => {
    await finalizeRegistration();
  };

  const handleSavePreferences = async () => {
    await finalizeRegistration();
  };

  const finalizeRegistration = async () => {
    setLoading(true);
    try {
      // Sauvegarder les préférences si des services sont sélectionnés
      if (formData.preferred_services.length > 0) {
        await api.submitClientOnboarding({
          preferred_services: formData.preferred_services,
          preferred_payment_method: formData.preferred_payment_method,
        });
      }

      localStorage.setItem('showWelcomePopup', 'true');
      window.location.href = '/';
    } catch (error) {
      console.error('Erreur finalisation:', error);
      // Rediriger quand même vers l'accueil
      localStorage.setItem('showWelcomePopup', 'true');
      window.location.href = '/';
    } finally {
      setLoading(false);
    }
  };

  const stepTitles = {
    1: t('register.personalInfo'),
    2: t('register.yourAddress'),
    3: t('register.paymentMethod'),
    4: t('register.yourPreferences')
  };

  const stepSubtitles = {
    1: t('register.createAccount'),
    2: t('register.whereService'),
    3: t('register.registerCard'),
    4: t('register.customizeExperience')
  };

  return (
    <div className={styles.registerPage}>
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
              <span className={styles.stepLabel}>{t('register.stepInfo')}</span>
            </div>
            <div className={styles.stepLine}></div>
            <div className={`${styles.step} ${currentStep >= 2 ? styles.stepActive : ''} ${currentStep > 2 ? styles.stepCompleted : ''}`}>
              <div className={styles.stepNumber}>{currentStep > 2 ? '✓' : '2'}</div>
              <span className={styles.stepLabel}>{t('register.stepAddress')}</span>
            </div>
            <div className={styles.stepLine}></div>
            <div className={`${styles.step} ${currentStep >= 3 ? styles.stepActive : ''} ${currentStep > 3 ? styles.stepCompleted : ''}`}>
              <div className={styles.stepNumber}>{currentStep > 3 ? '✓' : '3'}</div>
              <span className={styles.stepLabel}>{t('register.stepPayment')}</span>
            </div>
            <div className={styles.stepLine}></div>
            <div className={`${styles.step} ${currentStep >= 4 ? styles.stepActive : ''}`}>
              <div className={styles.stepNumber}>4</div>
              <span className={styles.stepLabel}>{t('register.stepPreferences')}</span>
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

          {/* ÉTAPE 1: Informations personnelles */}
          {currentStep === 1 && (
            <form onSubmit={(e) => { e.preventDefault(); handleNextStep(); }} className={styles.form}>
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
                <small className={styles.hint}>{t('register.mustBe18')}</small>
              </div>

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
                    {showPassword ? (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
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
                    {showPasswordConfirmation ? (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
                {errors.password_confirmation && <span className={styles.error}>{errors.password_confirmation}</span>}
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
                    {' '}{t('register.and')}{' '}
                    <button type="button" onClick={() => setShowTermsModal(true)} className={styles.termsLink}>
                      {t('register.privacyPolicy')}
                    </button>
                    {' '}<span className={styles.required}>*</span>
                  </span>
                </label>
                {errors.terms && <span className={styles.error}>{errors.terms}</span>}
              </div>

              <Button type="submit" variant="primary" size="large" fullWidth loading={loading} disabled={loading}>
                {t('register.continue')}
              </Button>
            </form>
          )}

          {/* ÉTAPE 2: Adresse */}
          {currentStep === 2 && (
            <div className={styles.form}>
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
                <small className={styles.hint}>
                  {t('register.selectSuggestedAddress')}
                </small>
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
                  <option value="Khouribga">Khouribga</option>
                  <option value="Béni Mellal">Béni Mellal</option>
                  <option value="Nador">Nador</option>
                </select>
                {errors.city && <span className={styles.error}>{errors.city}</span>}
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

          {/* ÉTAPE 3: Paiement */}
          {currentStep === 3 && (
            <div className={styles.paymentStep}>
              <div className={styles.paymentInfo}>
                <p>
                  {t('register.paymentInfo')}
                </p>
              </div>
              <PaymentMethodSetup
                onSuccess={handlePaymentSuccess}
                userType="client"
                skipable={false}
                demoMode={true}
              />
            </div>
          )}

          {/* ÉTAPE 4: Préférences (optionnel) */}
          {currentStep === 4 && (
            <div className={styles.form}>
              <div className={styles.preferencesIntro}>
                <p>{t('register.selectServices')}</p>
              </div>

              <ServiceSelector
                services={services}
                selectedServices={formData.preferred_services}
                onSelectionChange={(selected) => setFormData(prev => ({ ...prev, preferred_services: selected }))}
              />

              <div className={styles.buttonRow}>
                <Button
                  type="button"
                  variant="outline"
                  size="large"
                  onClick={handleSkipPreferences}
                  disabled={loading}
                >
                  {t('register.skip')}
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  size="large"
                  onClick={handleSavePreferences}
                  loading={loading}
                  disabled={loading}
                >
                  {loading ? t('register.finalizing') : t('register.finish')}
                </Button>
              </div>
            </div>
          )}

          {currentStep === 1 && (
            <div className={styles.footer}>
              <p>
                {t('register.haveAccount')}{' '}
                <Link href="/login" className={styles.link}>
                  {t('register.logIn')}
                </Link>
              </p>
            </div>
          )}
        </div>
      </div>

      <TermsModal
        isOpen={showTermsModal}
        onClose={() => setShowTermsModal(false)}
        userType="client"
      />
    </div>
  );
}
