'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import ServiceSelector from '@/components/ServiceSelector/ServiceSelector';
import './onboarding-client.scss';

/**
 * Page d'onboarding client simplifiée
 * - L'inscription gère déjà: infos personnelles, adresse, paiement
 * - Cette page permet uniquement de choisir les services préférés si non fait à l'inscription
 */
export default function ClientOnboardingPage() {
  const router = useRouter();
  const { user, refreshUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [services, setServices] = useState([]);
  const [selectedServices, setSelectedServices] = useState([]);

  useEffect(() => {
    // Vérifier si l'utilisateur est connecté
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    // Vérifier si l'onboarding est déjà complété
    if (user?.onboarding_completed) {
      router.push('/');
      return;
    }

    loadServices();
  }, [user, router]);

  const loadServices = async () => {
    try {
      const response = await api.getServices();
      setServices(response.data || []);
    } catch (error) {
      console.error('Erreur chargement services:', error);
    }
  };

  const handleSkip = async () => {
    await finalizeOnboarding();
  };

  const handleSubmit = async () => {
    await finalizeOnboarding();
  };

  const finalizeOnboarding = async () => {
    setLoading(true);
    try {
      // Sauvegarder les préférences
      await api.submitClientOnboarding({
        preferred_services: selectedServices,
        preferred_payment_method: 'card',
      });

      // Actualiser les données utilisateur
      await refreshUser();

      // Stocker le flag pour afficher le message de bienvenue
      localStorage.setItem('showWelcomePopup', 'true');

      // Rediriger vers l'accueil
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

  return (
    <div className="onboarding-client">
      <div className="onboarding-container">
        <h1>Bienvenue sur GlamGo !</h1>
        <p className="subtitle">Une dernière étape pour personnaliser votre expérience</p>

        <div className="step-content">
          <h2>Quels services vous intéressent ?</h2>
          <p>Sélectionnez vos services préférés pour des recommandations personnalisées</p>

          <ServiceSelector
            services={services}
            selectedServices={selectedServices}
            onSelectionChange={setSelectedServices}
          />

          <div className="step-actions">
            <button
              className="btn-skip"
              onClick={handleSkip}
              disabled={loading}
            >
              Passer cette étape
            </button>
            <button
              className="btn-submit"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? 'Finalisation...' : 'Terminer'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
