'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from './page.module.scss';
import apiClient from '@/lib/apiClient';
import { useAuth } from '@/contexts/AuthContext';
import Button from '@/components/Button';
import { getToken } from '@/lib/api';
import { useLanguage } from '@/contexts/LanguageContext';

// Helper pour récupérer le token de n'importe où
const getAnyToken = () => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token') ||
         localStorage.getItem('auth_token') ||
         sessionStorage.getItem('auth_token') ||
         sessionStorage.getItem('token');
};

export default function BiddingTestPage() {
  const { t, language } = useLanguage();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [services, setServices] = useState([]);
  const [selectedService, setSelectedService] = useState(null);
  const [orders, setOrders] = useState([]);
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form states
  const [orderForm, setOrderForm] = useState({
    service_id: '',
    user_proposed_price: '',
    address: '',
    notes: '',
    bid_expiry_hours: 24,
    scheduled_at: ''
  });

  const [bidForm, setBidForm] = useState({
    order_id: '',
    proposed_price: '',
    estimated_arrival_minutes: 30,
    message: 'Je peux vous fournir un excellent service'
  });

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    try {
      // Utiliser fetch direct pour éviter les problèmes avec apiClient
      const response = await fetch('http://localhost:8080/api/services');
      const data = await response.json();

      if (data.success) {
        setServices(data.data);
        // Sélectionner automatiquement le premier service qui autorise le bidding
        const biddingService = data.data.find(s => s.allow_bidding);
        if (biddingService) {
          setSelectedService(biddingService);
          setOrderForm(prev => ({
            ...prev,
            service_id: biddingService.id
          }));
        }
      }
    } catch (err) {
      setError('Erreur lors du chargement des services: ' + err.message);
    }
  };

  // ===== CRÉER COMMANDE BIDDING =====
  const handleCreateBiddingOrder = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const token = getAnyToken();
      if (!token) {
        setError('❌ Vous devez être connecté. Veuillez vous connecter d\'abord.');
        setLoading(false);
        return;
      }

      const response = await fetch('http://localhost:8080/api/orders/bidding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...orderForm,
          service_id: parseInt(orderForm.service_id),
          user_proposed_price: parseFloat(orderForm.user_proposed_price),
          bid_expiry_hours: parseInt(orderForm.bid_expiry_hours)
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccess(`✅ Commande créée ! ID: ${data.data.id}`);
        setBidForm(prev => ({ ...prev, order_id: data.data.id }));
        // Recharger les commandes
        loadMyOrders();
      } else {
        setError(data.message || 'Erreur lors de la création');
      }
    } catch (err) {
      setError('Erreur réseau: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // ===== CHARGER MES COMMANDES =====
  const loadMyOrders = async () => {
    setLoading(true);
    try {
      const token = getAnyToken();
      const response = await fetch('http://localhost:8080/api/orders', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();

      if (data.success) {
        // Filtrer uniquement les commandes en mode bidding
        const biddingOrders = data.data.filter(o => o.pricing_mode === 'bidding');
        setOrders(biddingOrders);
      }
    } catch (err) {
      setError('Erreur lors du chargement des commandes: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // ===== CRÉER OFFRE (POUR PRESTATAIRE) =====
  const handleCreateBid = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await fetch('http://localhost:8080/api/bids', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAnyToken()}`
        },
        body: JSON.stringify({
          ...bidForm,
          order_id: parseInt(bidForm.order_id),
          proposed_price: parseFloat(bidForm.proposed_price),
          estimated_arrival_minutes: parseInt(bidForm.estimated_arrival_minutes)
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccess(`✅ Offre créée ! ID: ${data.data.id}`);
        // Recharger les offres de cette commande
        if (bidForm.order_id) {
          loadOrderBids(bidForm.order_id);
        }
      } else {
        setError(data.message || 'Erreur lors de la création de l\'offre');
      }
    } catch (err) {
      setError('Erreur réseau: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // ===== CHARGER OFFRES D'UNE COMMANDE =====
  const loadOrderBids = async (orderId) => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:8080/api/orders/${orderId}/bids`, {
        headers: {
          'Authorization': `Bearer ${getAnyToken()}`
        }
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setBids(data.data.bids || []);
      }
    } catch (err) {
      setError('Erreur lors du chargement des offres');
    } finally {
      setLoading(false);
    }
  };

  // ===== ACCEPTER OFFRE =====
  const handleAcceptBid = async (bidId) => {
    if (!confirm('Voulez-vous accepter cette offre ?')) return;

    setLoading(true);
    try {
      const response = await fetch(`http://localhost:8080/api/bids/${bidId}/accept`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${getAnyToken()}`
        }
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccess('✅ Offre acceptée avec succès !');
        // Recharger les offres
        const orderId = bids.find(b => b.id === bidId)?.order_id;
        if (orderId) {
          loadOrderBids(orderId);
        }
        loadMyOrders();
      } else {
        setError(data.message || 'Erreur lors de l\'acceptation');
      }
    } catch (err) {
      setError('Erreur réseau: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Chargement...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className={styles.container}>
        <div className={styles.auth}>
          <h2>🔐 Connexion Requise</h2>
          <p>Vous devez être connecté pour tester le système d\'enchères</p>
          <Button onClick={() => router.push('/login')}>Se connecter</Button>
          <Button onClick={() => router.push('/register')} variant="secondary">
            S\'inscrire
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>🎯 Test Système d'Enchères GlamGo</h1>
        <p className={styles.subtitle}>
          Mode InDrive - Testez la création de commandes et d'offres
        </p>
      </div>

      {error && (
        <div className={styles.alert + ' ' + styles.error}>
          ❌ {error}
        </div>
      )}

      {success && (
        <div className={styles.alert + ' ' + styles.success}>
          {success}
        </div>
      )}

      {/* ÉTAPE 1: CRÉER COMMANDE BIDDING */}
      <div className={styles.section}>
        <h2>📝 Étape 1: Créer une Commande en Mode Enchères</h2>
        <form onSubmit={handleCreateBiddingOrder} className={styles.form}>
          <div className={styles.formGroup}>
            <label>Service</label>
            <select
              value={orderForm.service_id}
              onChange={(e) => {
                const serviceId = e.target.value;
                setOrderForm(prev => ({ ...prev, service_id: serviceId }));
                const service = services.find(s => s.id === parseInt(serviceId));
                setSelectedService(service);
              }}
              required
            >
              <option value="">Sélectionner un service</option>
              {services
                .filter(s => s.allow_bidding)
                .map(service => (
                  <option key={service.id} value={service.id}>
                    {service.name}
                    {service.min_suggested_price && service.max_suggested_price &&
                      ` (${service.min_suggested_price}-${service.max_suggested_price} MAD)`
                    }
                  </option>
                ))}
            </select>
          </div>

          {selectedService && (
            <div className={styles.serviceInfo}>
              <p><strong>Fourchette de prix:</strong> {selectedService.min_suggested_price} - {selectedService.max_suggested_price} MAD</p>
            </div>
          )}

          <div className={styles.formGroup}>
            <label>Votre Prix Proposé (MAD) *</label>
            <input
              type="number"
              step="0.01"
              value={orderForm.user_proposed_price}
              onChange={(e) => setOrderForm(prev => ({ ...prev, user_proposed_price: e.target.value }))}
              placeholder="Ex: 100"
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label>Adresse *</label>
            <input
              type="text"
              value={orderForm.address}
              onChange={(e) => setOrderForm(prev => ({ ...prev, address: e.target.value }))}
              placeholder="Ex: 123 Avenue Mohammed V, Marrakech"
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label>Date et heure du service *</label>
            <input
              type="datetime-local"
              value={orderForm.scheduled_at}
              onChange={(e) => setOrderForm(prev => ({ ...prev, scheduled_at: e.target.value }))}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label>Notes (optionnel)</label>
            <textarea
              value={orderForm.notes}
              onChange={(e) => setOrderForm(prev => ({ ...prev, notes: e.target.value }))}
              rows={3}
              placeholder="Instructions particulières pour le prestataire..."
            />
          </div>

          <div className={styles.formGroup}>
            <label>Durée des enchères (heures)</label>
            <input
              type="number"
              value={orderForm.bid_expiry_hours}
              onChange={(e) => setOrderForm(prev => ({ ...prev, bid_expiry_hours: e.target.value }))}
            />
          </div>

          <Button type="submit" disabled={loading}>
            {loading ? 'Création...' : '🎯 Créer Commande Enchères'}
          </Button>
        </form>
      </div>

      {/* ÉTAPE 2: MES COMMANDES */}
      <div className={styles.section}>
        <h2>📋 Mes Commandes en Mode Enchères</h2>
        <Button onClick={loadMyOrders} variant="secondary" disabled={loading}>
          🔄 Recharger
        </Button>

        {orders.length === 0 ? (
          <p className={styles.empty}>Aucune commande en mode enchères</p>
        ) : (
          <div className={styles.ordersList}>
            {orders.map(order => (
              <div key={order.id} className={styles.orderCard}>
                <div className={styles.orderHeader}>
                  <h3>Commande #{order.id}</h3>
                  <span className={`${styles.badge} ${styles[order.status]}`}>
                    {order.status}
                  </span>
                </div>
                <p><strong>Service:</strong> {order.service_name}</p>
                <p><strong>Prix proposé:</strong> {order.user_proposed_price} MAD</p>
                <p><strong>Adresse:</strong> {order.address_line}</p>
                {order.pricing_mode && (
                  <p><strong>Mode:</strong> {order.pricing_mode}</p>
                )}
                <Button
                  onClick={() => {
                    setBidForm(prev => ({ ...prev, order_id: order.id }));
                    loadOrderBids(order.id);
                  }}
                  size="small"
                >
                  👀 Voir les offres
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ÉTAPE 3: CRÉER OFFRE (POUR PRESTATAIRES) */}
      <div className={styles.section}>
        <h2>💰 Créer une Offre (Mode Prestataire)</h2>
        <p className={styles.note}>
          Note: Cette section est pour les prestataires.
          Vous devez vous connecter avec un compte prestataire pour créer des offres.
        </p>

        <form onSubmit={handleCreateBid} className={styles.form}>
          <div className={styles.formGroup}>
            <label>Order ID *</label>
            <input
              type="number"
              value={bidForm.order_id}
              onChange={(e) => setBidForm(prev => ({ ...prev, order_id: e.target.value }))}
              placeholder="ID de la commande"
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label>Votre Prix (MAD) *</label>
            <input
              type="number"
              step="0.01"
              value={bidForm.proposed_price}
              onChange={(e) => setBidForm(prev => ({ ...prev, proposed_price: e.target.value }))}
              placeholder="Ex: 85"
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label>Temps d'arrivée (minutes)</label>
            <input
              type="number"
              value={bidForm.estimated_arrival_minutes}
              onChange={(e) => setBidForm(prev => ({ ...prev, estimated_arrival_minutes: e.target.value }))}
            />
          </div>

          <div className={styles.formGroup}>
            <label>Message (optionnel)</label>
            <textarea
              value={bidForm.message}
              onChange={(e) => setBidForm(prev => ({ ...prev, message: e.target.value }))}
              rows={3}
            />
          </div>

          <Button type="submit" disabled={loading}>
            {loading ? 'Création...' : '💰 Créer Offre'}
          </Button>
        </form>
      </div>

      {/* ÉTAPE 4: OFFRES REÇUES */}
      {bids.length > 0 && (
        <div className={styles.section}>
          <h2>✨ Offres Reçues</h2>

          <div className={styles.bidsList}>
            {bids.map(bid => (
              <div
                key={bid.id}
                className={`${styles.bidCard} ${styles[bid.status]}`}
              >
                <div className={styles.bidHeader}>
                  <div className={styles.bidPrice}>{bid.proposed_price} MAD</div>
                  <span className={`${styles.badge} ${styles[bid.status]}`}>
                    {bid.status}
                  </span>
                </div>

                <div className={styles.bidDetails}>
                  <p><strong>Prestataire:</strong> {bid.first_name} {bid.last_name}</p>
                  <p><strong>Téléphone:</strong> {bid.phone}</p>
                  <p><strong>ETA:</strong> {bid.estimated_arrival_minutes} minutes</p>
                  {bid.rating && <p><strong>Note:</strong> {bid.rating}/5 ⭐</p>}
                  {bid.message && <p><strong>Message:</strong> {bid.message}</p>}
                </div>

                {bid.status === 'pending' && (
                  <Button
                    onClick={() => handleAcceptBid(bid.id)}
                    size="small"
                  >
                    ✅ Accepter cette offre
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* INFORMATIONS */}
      <div className={styles.section + ' ' + styles.info}>
        <h3>ℹ️ Comment tester ?</h3>
        <ol>
          <li>Créez une commande en mode enchères (Étape 1)</li>
          <li>Connectez-vous avec un compte prestataire dans un autre onglet</li>
          <li>Le prestataire crée une offre (Étape 3)</li>
          <li>Revenez à ce compte et consultez les offres (Étape 2)</li>
          <li>Acceptez la meilleure offre (Étape 4)</li>
        </ol>
      </div>
    </div>
  );
}
