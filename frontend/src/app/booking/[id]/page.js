'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import styles from './page.module.scss';
import Button from '@/components/Button';
import apiClient from '@/lib/apiClient';
import { useAuth } from '@/contexts/AuthContext';
import { getServiceImageUrl } from '@/lib/serviceImages';
import { fixEncoding } from '@/lib/textUtils';
import Price from '@/components/Price';
import LocationPicker from '@/components/LocationPicker';
import FormulaSelector from '@/components/FormulaSelector';
import PriceBreakdown from '@/components/PriceBreakdown';
import NearbyProvidersList from '@/components/NearbyProvidersList';
import { usePriceCalculation } from '@/hooks/usePriceCalculation';
import { useClientLocation } from '@/hooks/useNearbyProviders';
import NightShiftWarning from '@/components/NightShiftWarning';
import { useNightShiftDetection } from '@/hooks/useNightShiftDetection';

export default function BookingPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Mode bidding désactivé - Toujours en mode classique
  const isBiddingMode = false;

  const [formData, setFormData] = useState({
    date: '',
    time: '',
    address: '',
    latitude: null,
    longitude: null,
    notes: '',
    payment_method: 'card',
    formula_type: 'standard',
  });
const [selectedFormula, setSelectedFormula] = useState(null);
  const [priceBreakdown, setPriceBreakdown] = useState(null);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [showProviders, setShowProviders] = useState(false);

  // Géolocalisation du client
  const {
    location: clientLocation,
    loading: geoLoading,
    requestLocation
  } = useClientLocation({ autoRequest: false });

  // Calcul du datetime programmé pour les hooks
  // Utilise la date du jour si non sélectionnée pour permettre le calcul du supplément nuit
  const scheduledDateTime = useMemo(() => {
    if (formData.time) {
      const dateToUse = formData.date || new Date().toISOString().split('T')[0];
      return dateToUse + 'T' + formData.time + ':00';
    }
    return null;
  }, [formData.date, formData.time]);

  // Détection simple si l'heure sélectionnée est de nuit (22h-6h)
  const isSelectedTimeNight = useMemo(() => {
    if (!formData.time) return false;
    const hour = parseInt(formData.time.split(':')[0], 10);
    return hour >= 22 || hour < 6;
  }, [formData.time]);

  // Détection intervention de nuit
  const {
    isNightShift,
    nightFee,
    nightDetails,
    nightType,
    nightsCount,
    loading: nightLoading
  } = useNightShiftDetection(scheduledDateTime, service?.duration_minutes ? Math.ceil(service.duration_minutes / 60) : 2);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push(`/login?redirect=/booking/${params.id}`);
    }
  }, [user, authLoading, router, params.id]);

  useEffect(() => {
    if (params.id) {
      fetchService();
    }
  }, [params.id]);

  const fetchService = async () => {
    try {
      const response = await apiClient.getService(params.id);
      if (response.success) {
        setService(response.data);
      } else {
        setError('Service non trouvé');
      }
    } catch (err) {
      setError(err.message || 'Erreur lors du chargement du service');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFormulaChange = (formulaType, formulaData) => {
    setFormData((prev) => ({ ...prev, formula_type: formulaType }));
    setSelectedFormula(formulaData);
  };

  const handlePriceCalculated = (breakdown) => {
    setPriceBreakdown(breakdown ? { ...breakdown } : null);
  };

  const handleProviderSelect = (provider) => {
    setSelectedProvider(provider);
    // Mettre à jour le prix avec les frais du prestataire sélectionné
    if (provider?.price_breakdown) {
      setPriceBreakdown(provider.price_breakdown);
    }
  };

  const toggleProvidersView = async () => {
    if (!showProviders && !clientLocation) {
      // Demander la géolocalisation avant d'afficher les prestataires
      await requestLocation();
    }
    setShowProviders(!showProviders);
  };

  const getScheduledDateTime = () => scheduledDateTime;

  const handleLocationChange = (locationData) => {
    console.log('📍 LocationPicker callback appelée:', locationData);
    setFormData((prev) => ({
      ...prev,
      address: locationData.address,
      latitude: locationData.latitude,
      longitude: locationData.longitude,
    }));
    console.log('📍 FormData mis à jour avec adresse:', locationData.address);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Debug: Afficher les données du formulaire
    console.log('📝 Données du formulaire:', formData);
    console.log('📅 Date:', formData.date, 'Type:', typeof formData.date);
    console.log('⏰ Time:', formData.time, 'Type:', typeof formData.time);
    console.log('📍 Address:', formData.address, 'Type:', typeof formData.address);

    // Validation
    if (!formData.date || !formData.time || !formData.address) {
      console.error('❌ Validation échouée:', {
        date: !formData.date ? 'MANQUANT' : 'OK',
        time: !formData.time ? 'MANQUANT' : 'OK',
        address: !formData.address ? 'MANQUANT' : 'OK'
      });
      setError('Veuillez remplir tous les champs obligatoires');
      return;
    }

    setSubmitting(true);

    try {
      // Mode réservation classique uniquement
      const scheduledAt = `${formData.date} ${formData.time}:00`;
      const response = await apiClient.createOrder({
        service_id: parseInt(params.id),
        address: formData.address,
        latitude: formData.latitude,
        longitude: formData.longitude,
        scheduled_at: scheduledAt,
        notes: formData.notes,
        payment_method: formData.payment_method,
        formula_type: formData.formula_type,
      });

      if (response.success) {
        setSuccess(true);
        setTimeout(() => {
          router.push('/orders');
        }, 3000);
      } else {
        setError(response.message || 'Erreur lors de la création de la commande');
      }
    } catch (err) {
      setError(err.message || 'Erreur lors de la création de la commande');
    } finally {
      setSubmitting(false);
    }
  };

  // Obtenir la date minimum (aujourd'hui)
  const getMinDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  // Obtenir la date maximum (30 jours)
  const getMaxDate = () => {
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 30);
    return maxDate.toISOString().split('T')[0];
  };

  if (authLoading || loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>Chargement...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (!service) {
    return (
      <div className={styles.error}>
        <h2>Service non trouvé</h2>
        <Link href="/services">
          <Button variant="primary">Retour aux services</Button>
        </Link>
      </div>
    );
  }

  if (success) {
    return (
      <div className={styles.success}>
        <div className={styles.successIcon}>✓</div>
        <h2>{isBiddingMode ? 'Demande d\'offres créée !' : 'Réservation confirmée !'}</h2>
        <p>
          {isBiddingMode
            ? 'Votre demande d\'offres a été créée. Les prestataires vont commencer à vous envoyer leurs propositions.'
            : 'Votre réservation a été enregistrée avec succès.'}
        </p>
        <p>Vous allez être redirigé vers vos commandes...</p>
      </div>
    );
  }

  const imageUrl = getServiceImageUrl(service, '600x400');
  const displayPrice = priceBreakdown?.total || selectedFormula?.calculated_price || service.price || service.base_price;
  const displayDuration = service.estimated_duration || (service.duration_minutes ? `${service.duration_minutes} min` : null);

  return (
    <div className={styles.bookingPage}>
      <div className="container">
        <Link href={`/services/${params.id}`} className={styles.backLink}>
          ← Retour au service
        </Link>

        <div className={styles.bookingContainer}>
          {/* Image service en haut */}
          <img
            src={imageUrl}
            alt={fixEncoding(service.name)}
            className={styles.serviceImage}
          />

          {/* Infos service */}
          <div className={styles.serviceDetails}>
            <h1 className={styles.serviceTitle}>{fixEncoding(service.name)}</h1>
            <p className={styles.serviceDescription}>{fixEncoding(service.description)}</p>
            <div className={styles.serviceMeta}>
              <span className={styles.servicePrice}>
                <Price amount={displayPrice} />
              </span>
              {displayDuration && (
                <span className={styles.serviceDuration}>⏱ {displayDuration}</span>
              )}
            </div>
          </div>

          {/* Calcul du prix (caché) */}
          <div style={{ display: 'none' }}>
            <PriceBreakdown
              serviceId={parseInt(params.id)}
              formulaType={formData.formula_type}
              scheduledTime={getScheduledDateTime()}
              onPriceChange={handlePriceCalculated}
            />
          </div>

          {/* Formulaire */}
          <div className={styles.bookingForm}>
            <h2 className={styles.title}>
              {isBiddingMode ? '💰 Demander des offres' : 'Finaliser la réservation'}
            </h2>

            {isBiddingMode && (
              <div className={styles.biddingNotice}>
                <strong>🎯 Mode enchères</strong>
                <p>Proposez votre prix et recevez des offres de plusieurs prestataires. Vous pourrez ensuite choisir la meilleure offre.</p>
              </div>
            )}

            {error && <div className={styles.errorAlert}>{error}</div>}

            <form onSubmit={handleSubmit}>
              {isBiddingMode ? (
                // Formulaire mode enchères
                <>
                  <div className={styles.formGroup}>
                    <label htmlFor="user_proposed_price" className={styles.label}>
                      Votre prix proposé (MAD) <span className={styles.required}>*</span>
                    </label>
                    <p className={styles.hint}>
                      Prix minimum: {service.price} MAD (sans limite maximale)
                    </p>
                    <input
                      type="number"
                      id="user_proposed_price"
                      name="user_proposed_price"
                      value={formData.user_proposed_price}
                      onChange={handleChange}
                      className={styles.input}
                      placeholder={`Minimum ${service.price} MAD`}
                      step="0.01"
                      min={service.price}
                      required
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="date" className={styles.label}>
                      Date du service <span className={styles.required}>*</span>
                    </label>
                    <input
                      type="date"
                      id="date"
                      name="date"
                      value={formData.date}
                      onChange={handleChange}
                      min={getMinDate()}
                      max={getMaxDate()}
                      className={styles.input}
                      required
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="time" className={styles.label}>
                      Heure du service <span className={styles.required}>*</span>
                    </label>
                    <select
                      id="time"
                      name="time"
                      value={formData.time}
                      onChange={handleChange}
                      className={styles.input}
                      required
                    >
                      <option value="">Sélectionnez une heure</option>
                      <optgroup label="Journée">
                        <option value="08:00">08:00</option>
                        <option value="09:00">09:00</option>
                        <option value="10:00">10:00</option>
                        <option value="11:00">11:00</option>
                        <option value="12:00">12:00</option>
                        <option value="14:00">14:00</option>
                        <option value="15:00">15:00</option>
                        <option value="16:00">16:00</option>
                        <option value="17:00">17:00</option>
                        <option value="18:00">18:00</option>
                        <option value="19:00">19:00</option>
                        <option value="20:00">20:00</option>
                        <option value="21:00">21:00</option>
                      </optgroup>
                      <optgroup label="🌙 Nuit (supplément)">
                        <option value="22:00">22:00 🌙</option>
                        <option value="23:00">23:00 🌙</option>
                        <option value="00:00">00:00 🌙</option>
                        <option value="01:00">01:00 🌙</option>
                        <option value="02:00">02:00 🌙</option>
                        <option value="03:00">03:00 🌙</option>
                        <option value="04:00">04:00 🌙</option>
                        <option value="05:00">05:00 🌙</option>
                      </optgroup>
                    </select>
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="bid_expiry_hours" className={styles.label}>
                      Durée des enchères (heures)
                    </label>
                    <select
                      id="bid_expiry_hours"
                      name="bid_expiry_hours"
                      value={formData.bid_expiry_hours}
                      onChange={handleChange}
                      className={styles.input}
                    >
                      <option value="12">12 heures</option>
                      <option value="24">24 heures (recommandé)</option>
                      <option value="48">48 heures</option>
                      <option value="72">72 heures</option>
                    </select>
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="address" className={styles.label}>
                      Adresse <span className={styles.required}>*</span>
                    </label>
                    <input
                      type="text"
                      id="address"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      className={styles.input}
                      placeholder="Ex: 123 Avenue Mohammed V, Guéliz, Marrakech"
                      required
                    />
                  </div>
                </>
              ) : (
                // Formulaire mode réservation classique
                <>
                  {/* Sélecteur de formule */}
                  <div className={styles.formGroup}>
                    <FormulaSelector
                      serviceId={parseInt(params.id)}
                      selectedFormula={formData.formula_type}
                      onFormulaChange={handleFormulaChange}
                      scheduledTime={getScheduledDateTime()}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="date" className={styles.label}>
                      Date <span className={styles.required}>*</span>
                    </label>
                    <input
                      type="date"
                      id="date"
                      name="date"
                      value={formData.date}
                      onChange={handleChange}
                      min={getMinDate()}
                      max={getMaxDate()}
                      className={styles.input}
                      required
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="time" className={styles.label}>
                      Heure <span className={styles.required}>*</span>
                    </label>
                    <select
                      id="time"
                      name="time"
                      value={formData.time}
                      onChange={handleChange}
                      className={styles.input}
                      required
                    >
                      <option value="">Sélectionnez une heure</option>
                      <optgroup label="Journée">
                        <option value="08:00">08:00</option>
                        <option value="09:00">09:00</option>
                        <option value="10:00">10:00</option>
                        <option value="11:00">11:00</option>
                        <option value="12:00">12:00</option>
                        <option value="14:00">14:00</option>
                        <option value="15:00">15:00</option>
                        <option value="16:00">16:00</option>
                        <option value="17:00">17:00</option>
                        <option value="18:00">18:00</option>
                        <option value="19:00">19:00</option>
                        <option value="20:00">20:00</option>
                        <option value="21:00">21:00</option>
                      </optgroup>
                      <optgroup label="🌙 Nuit (supplément)">
                        <option value="22:00">22:00 🌙</option>
                        <option value="23:00">23:00 🌙</option>
                        <option value="00:00">00:00 🌙</option>
                        <option value="01:00">01:00 🌙</option>
                        <option value="02:00">02:00 🌙</option>
                        <option value="03:00">03:00 🌙</option>
                        <option value="04:00">04:00 🌙</option>
                        <option value="05:00">05:00 🌙</option>
                      </optgroup>
                    </select>

                    {/* Avertissement intervention de nuit - seulement si PAS formule nuit */}
                    {isSelectedTimeNight && formData.formula_type !== 'night' && (
                      <div style={{
                        marginTop: '0.75rem',
                        padding: '0.75rem',
                        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
                        border: '1px solid #0f3460',
                        borderRadius: '12px',
                        fontSize: '0.85rem'
                      }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.375rem',
                          color: '#ffd700',
                          marginBottom: '0.5rem'
                        }}>
                          <span>🌙</span>
                          <span style={{ fontWeight: 600 }}>
                            Supplément nuit : +{nightFee > 0 ? nightFee : 30} MAD
                          </span>
                          {nightsCount > 1 && (
                            <span style={{
                              background: 'rgba(233, 69, 96, 0.3)',
                              borderRadius: '10px',
                              padding: '0.125rem 0.375rem',
                              fontSize: '0.7rem',
                              color: '#ff6b8a',
                              marginLeft: '0.25rem'
                            }}>
                              {nightsCount} nuits
                            </span>
                          )}
                        </div>
                        <div style={{
                          fontSize: '0.75rem',
                          color: '#94a3b8',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.25rem'
                        }}>
                          <span>💡</span>
                          <span>Sélectionnez la formule <strong style={{ color: '#ffd700' }}>Nuit</strong> pour inclure ce supplément</span>
                        </div>
                      </div>
                    )}

                    {/* Info si formule nuit sélectionnée */}
                    {formData.formula_type === 'night' && (
                      <div style={{
                        marginTop: '0.75rem',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.375rem',
                        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
                        border: '1px solid #22c55e',
                        borderRadius: '20px',
                        padding: '0.5rem 0.875rem',
                        fontSize: '0.85rem',
                        color: '#22c55e'
                      }}>
                        <span>🌙</span>
                        <span style={{ fontWeight: 500 }}>
                          Formule nuit - supplément inclus
                        </span>
                      </div>
                    )}
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="address" className={styles.label}>
                      Adresse <span className={styles.required}>*</span>
                    </label>
                    <input
                      type="text"
                      id="address"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      className={styles.input}
                      placeholder="Ex: 123 Avenue Mohammed V, Guéliz, Marrakech"
                      required
                    />
                  </div>

                  {/* Section prestataires à proximité */}
                  <div className={styles.formGroup}>
                    <button
                      type="button"
                      className={styles.toggleProvidersBtn}
                      onClick={toggleProvidersView}
                    >
                      <span className={styles.btnIcon}>📍</span>
                      {showProviders ? 'Masquer les prestataires' : 'Voir les prestataires à proximité'}
                      <span className={`${styles.chevron} ${showProviders ? styles.open : ''}`}>▼</span>
                    </button>

                    {showProviders && (
                      <div className={styles.providersSection}>
                        <NearbyProvidersList
                          serviceId={parseInt(params.id)}
                          clientLocation={formData.latitude && formData.longitude ? {
                            lat: formData.latitude,
                            lng: formData.longitude
                          } : clientLocation}
                          formula={formData.formula_type}
                          onProviderSelect={handleProviderSelect}
                          selectedProviderId={selectedProvider?.id}
                          scheduledTime={getScheduledDateTime()}
                        />
                      </div>
                    )}

                    {selectedProvider && (
                      <div className={styles.selectedProviderBanner}>
                        <span className={styles.checkIcon}>✓</span>
                        <div className={styles.providerInfo}>
                          <strong>{selectedProvider.name}</strong>
                          <span>À {selectedProvider.distance_formatted || `${selectedProvider.distance?.toFixed(1)} km`}</span>
                        </div>
                        <button
                          type="button"
                          className={styles.changeBtn}
                          onClick={() => setShowProviders(true)}
                        >
                          Changer
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Sélection du mode de paiement */}
              <div className={styles.formGroup}>
                <label className={styles.label}>
                  Mode de paiement <span className={styles.required}>*</span>
                </label>
                <div className={styles.paymentOptions}>
                  <div
                    className={`${styles.paymentOption} ${formData.payment_method === 'card' ? styles.selected : ''}`}
                    onClick={() => setFormData(prev => ({ ...prev, payment_method: 'card' }))}
                  >
                    <input
                      type="radio"
                      id="payment_card"
                      name="payment_method"
                      value="card"
                      checked={formData.payment_method === 'card'}
                      onChange={handleChange}
                      className={styles.radio}
                    />
                    <div className={styles.paymentContent}>
                      <div className={styles.paymentHeader}>
                        <span className={styles.paymentIcon}>💳</span>
                        <strong>Carte bancaire</strong>
                      </div>
                      <p className={styles.paymentDescription}>
                        Le paiement sera automatiquement effectué à la fin du service. Commission GlamGo : 20%
                      </p>
                    </div>
                  </div>

                  <div
                    className={`${styles.paymentOption} ${formData.payment_method === 'cash' ? styles.selected : ''}`}
                    onClick={() => setFormData(prev => ({ ...prev, payment_method: 'cash' }))}
                  >
                    <input
                      type="radio"
                      id="payment_cash"
                      name="payment_method"
                      value="cash"
                      checked={formData.payment_method === 'cash'}
                      onChange={handleChange}
                      className={styles.radio}
                    />
                    <div className={styles.paymentContent}>
                      <div className={styles.paymentHeader}>
                        <span className={styles.paymentIcon}>💵</span>
                        <strong>Espèces</strong>
                      </div>
                      <p className={styles.paymentDescription}>
                        Payez en espèces au prestataire. La commission GlamGo (20%) sera prélevée sur sa carte
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="notes" className={styles.label}>
                  Notes supplémentaires
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  className={styles.textarea}
                  placeholder="Instructions spéciales, accès, etc."
                  rows={3}
                />
              </div>

              <div className={styles.summary}>
                <h3>Récapitulatif</h3>
                <div className={styles.summaryItem}>
                  <span>Service</span>
                  <span>{fixEncoding(service.name)}</span>
                </div>

                {isBiddingMode ? (
                  <>
                    {formData.user_proposed_price && (
                      <div className={styles.summaryItem}>
                        <span>Votre prix proposé</span>
                        <span><Price amount={parseFloat(formData.user_proposed_price)} /></span>
                      </div>
                    )}
                    {formData.date && (
                      <div className={styles.summaryItem}>
                        <span>Date du service</span>
                        <span>{new Date(formData.date).toLocaleDateString('fr-FR')}</span>
                      </div>
                    )}
                    {formData.time && (
                      <div className={styles.summaryItem}>
                        <span>Heure</span>
                        <span>{formData.time}</span>
                      </div>
                    )}
                    <div className={styles.summaryItem}>
                      <span>Durée des enchères</span>
                      <span>{formData.bid_expiry_hours} heures</span>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Date et heure */}
                    {formData.date && (
                      <div className={styles.summaryItem}>
                        <span>Date</span>
                        <span>{new Date(formData.date).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                      </div>
                    )}
                    {formData.time && (
                      <div className={styles.summaryItem}>
                        <span>Heure</span>
                        <span>{formData.time}</span>
                      </div>
                    )}

                    {/* Adresse */}
                    {formData.address && (
                      <div className={styles.summaryItem}>
                        <span>Adresse</span>
                        <span className={styles.addressText}>{formData.address}</span>
                      </div>
                    )}

                    {/* Prestataire sélectionné */}
                    {selectedProvider && (
                      <div className={styles.summaryItem}>
                        <span>Prestataire</span>
                        <span>{selectedProvider.name} ({selectedProvider.distance_formatted || `${selectedProvider.distance?.toFixed(1)} km`})</span>
                      </div>
                    )}

                    {/* Durée estimée */}
                    {displayDuration && (
                      <div className={styles.summaryItem}>
                        <span>Durée estimée</span>
                        <span>{displayDuration}</span>
                      </div>
                    )}

                    {/* Mode de paiement */}
                    <div className={styles.summaryItem}>
                      <span>Paiement</span>
                      <span>{formData.payment_method === 'card' ? '💳 Carte bancaire' : '💵 Espèces'}</span>
                    </div>

                    {/* Formule choisie */}
                    <div className={styles.summaryItem}>
                      <span>Formule</span>
                      <span className={styles.formulaTag}>
                        {formData.formula_type === 'standard' && '⚡ Standard'}
                        {formData.formula_type === 'recurring' && '🔄 Récurrent'}
                        {formData.formula_type === 'premium' && '⭐ Premium'}
                        {formData.formula_type === 'urgent' && '🚨 Urgence'}
                        {formData.formula_type === 'night' && '🌙 Nuit'}
                      </span>
                    </div>

                    {/* Détail du prix */}
                    <div className={styles.summaryDivider}></div>

                    {/* Prix de base */}
                    <div className={styles.summaryItem}>
                      <span>Prix de base</span>
                      <span><Price amount={priceBreakdown?.base_price || service.price || service.base_price} /></span>
                    </div>

                    {/* Modificateur formule */}
                    {(priceBreakdown?.formula_modifier && parseFloat(priceBreakdown.formula_modifier) !== 0) ||
                     (selectedFormula?.price_modifier_value && selectedFormula.price_modifier_value !== 0) ? (
                      <div className={styles.summaryItem}>
                        <span>
                          {formData.formula_type === 'recurring' && '🔄 Réduction récurrent'}
                          {formData.formula_type === 'premium' && '⭐ Supplément premium'}
                          {formData.formula_type === 'urgent' && '🚨 Supplément urgence'}
                          {formData.formula_type === 'night' && '🌙 Supplément nuit'}
                          {formData.formula_type === 'standard' && 'Formule standard'}
                        </span>
                        <span className={
                          (priceBreakdown?.formula_modifier > 0 || selectedFormula?.price_modifier_value > 0)
                            ? styles.positive
                            : styles.negative
                        }>
                          {priceBreakdown?.formula_modifier
                            ? <>{parseFloat(priceBreakdown.formula_modifier) > 0 ? '+' : ''}<Price amount={priceBreakdown.formula_modifier} /></>
                            : selectedFormula?.price_modifier_type === 'percentage'
                              ? `${selectedFormula.price_modifier_value > 0 ? '+' : ''}${selectedFormula.price_modifier_value}%`
                              : <>{selectedFormula?.price_modifier_value > 0 ? '+' : ''}<Price amount={selectedFormula?.price_modifier_value || 0} /></>
                          }
                        </span>
                      </div>
                    ) : null}

                    {/* Frais de distance */}
                    {priceBreakdown?.distance_fee > 0 && (
                      <div className={styles.summaryItem}>
                        <span>🚗 Frais de distance</span>
                        <span className={styles.positive}>+<Price amount={priceBreakdown.distance_fee} /></span>
                      </div>
                    )}

                    {/* Supplément nuit (si heure de nuit et formule NON nuit) */}
                    {(priceBreakdown?.night_fee > 0 || (isSelectedTimeNight && formData.formula_type !== 'night')) && (
                      <div className={styles.summaryItem}>
                        <span>🌙 Supplément nuit</span>
                        <span className={styles.positive}>
                          +<Price amount={priceBreakdown?.night_fee || nightFee || 30} />
                        </span>
                      </div>
                    )}

                    {/* Sous-total */}
                    <div className={styles.summaryDivider}></div>
                    <div className={styles.summaryItem}>
                      <span>Sous-total</span>
                      <span><Price amount={priceBreakdown?.subtotal || selectedFormula?.calculated_price || displayPrice} /></span>
                    </div>

                    {/* Commission GlamGo */}
                    <div className={styles.summaryItem}>
                      <span>🏷️ Commission GlamGo (20%)</span>
                      <span className={styles.commissionText}>
                        <Price amount={priceBreakdown?.commission_glamgo || (displayPrice * 0.2)} />
                      </span>
                    </div>

                    {/* Total */}
                    <div className={styles.summaryDivider}></div>
                    <div className={`${styles.summaryItem} ${styles.summaryTotal}`}>
                      <span>Total à payer</span>
                      <span><Price amount={priceBreakdown?.total || selectedFormula?.calculated_price || displayPrice} /></span>
                    </div>
                  </>
                )}
              </div>

              <Button
                type="submit"
                variant="primary"
                size="large"
                fullWidth
                loading={submitting}
                disabled={submitting}
              >
                {submitting
                  ? (isBiddingMode ? 'Création en cours...' : 'Réservation en cours...')
                  : (isBiddingMode ? '💰 Créer la demande d\'offres' : 'Confirmer la réservation')}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
