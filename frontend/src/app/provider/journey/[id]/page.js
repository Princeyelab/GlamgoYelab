'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function JourneyModePage() {
  const params = useParams();
  const router = useRouter();
  const bookingId = params.id;

  // États
  const [booking, setBooking] = useState(null);
  const [providerLocation, setProviderLocation] = useState(null);
  const [status, setStatus] = useState('on_way');
  const [distance, setDistance] = useState(0);
  const [eta, setEta] = useState(0);
  const [timer, setTimer] = useState(0); // secondes
  const [isLoading, setIsLoading] = useState(true);

  // Refs
  const watchIdRef = useRef(null);
  const lastPositionRef = useRef(null);
  const timerIntervalRef = useRef(null);

  // 1. Charger booking initial
  useEffect(() => {
    fetchBooking();
  }, [bookingId]);

  // 2. Démarrer géolocalisation continue
  useEffect(() => {
    if (status === 'on_way' || status === 'arrived') {
      startLocationTracking();
    } else {
      stopLocationTracking();
    }

    return () => stopLocationTracking();
  }, [status]);

  // 3. Polling status toutes les 5s
  useEffect(() => {
    const interval = setInterval(() => {
      fetchBooking();
    }, 5000);

    return () => clearInterval(interval);
  }, [bookingId]);

  // 4. Timer prestation
  useEffect(() => {
    if (status === 'in_progress') {
      timerIntervalRef.current = setInterval(() => {
        setTimer(prev => prev + 1);
      }, 1000);
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
      setTimer(0);
    }

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [status]);

  const fetchBooking = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/provider/orders/${bookingId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error('Failed to fetch booking');

      const response = await res.json();
      const data = response.data;

      setBooking(data);
      setStatus(data.status);

      setIsLoading(false);

      // Si completed ou cancelled, rediriger
      if (data.status === 'completed' || data.status === 'cancelled') {
        setTimeout(() => {
          router.push('/provider/dashboard');
        }, 2000);
      }
    } catch (error) {
      console.error('Error fetching booking:', error);
      setIsLoading(false);
    }
  };

  const startLocationTracking = () => {
    if (!navigator.geolocation) {
      console.error('Geolocation not supported');
      alert('La géolocalisation n\'est pas supportée par votre navigateur');
      return;
    }

    // Position initiale
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const newLocation = { lat: latitude, lng: longitude };
        setProviderLocation(newLocation);
        lastPositionRef.current = newLocation;

        // Calculer distance et ETA initial
        if (booking?.address_latitude && booking?.address_longitude) {
          const dist = calculateDistance(
            latitude, longitude,
            parseFloat(booking.address_latitude),
            parseFloat(booking.address_longitude)
          );
          setDistance(dist.toFixed(1));
          setEta(Math.ceil(dist / 0.5)); // 30 km/h = 0.5 km/min
        }
      },
      (error) => console.error('Geolocation error:', error)
    );

    // Suivi continu
    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;

        // Vérifier seuil 10m
        if (lastPositionRef.current) {
          const dist = calculateDistance(
            lastPositionRef.current.lat,
            lastPositionRef.current.lng,
            latitude,
            longitude
          );

          if (dist < 0.01) { // 10 mètres = 0.01 km
            return;
          }
        }

        // Mettre à jour position
        const newLocation = { lat: latitude, lng: longitude };
        setProviderLocation(newLocation);
        lastPositionRef.current = newLocation;

        // Envoyer au backend
        updateLocationBackend(latitude, longitude);

        // Calculer distance et ETA
        if (booking?.address_latitude && booking?.address_longitude) {
          const dist = calculateDistance(
            latitude, longitude,
            parseFloat(booking.address_latitude),
            parseFloat(booking.address_longitude)
          );
          setDistance(dist.toFixed(1));
          setEta(Math.ceil(dist / 0.5));
        }
      },
      (error) => console.error('Geolocation error:', error),
      {
        enableHighAccuracy: true,
        maximumAge: 5000,
        timeout: 10000,
      }
    );
  };

  const stopLocationTracking = () => {
    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  };

  const updateLocationBackend = async (latitude, longitude) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/provider/orders/${bookingId}/location`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ latitude, longitude }),
      });
    } catch (error) {
      console.error('Error updating location:', error);
    }
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const handleStatusChange = async (newStatus) => {
    try {
      const token = localStorage.getItem('token');
      let endpoint = '';

      if (newStatus === 'arrived') {
        endpoint = `${process.env.NEXT_PUBLIC_API_URL}/provider/orders/${bookingId}/arrive`;
      } else if (newStatus === 'in_progress') {
        endpoint = `${process.env.NEXT_PUBLIC_API_URL}/provider/orders/${bookingId}/start`;
      } else if (newStatus === 'completed') {
        endpoint = `${process.env.NEXT_PUBLIC_API_URL}/provider/orders/${bookingId}/complete`;
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to update status');
      }

      setStatus(newStatus);

      if (newStatus === 'completed') {
        stopLocationTracking();
        setTimeout(() => {
          router.push('/provider/dashboard');
        }, 1500);
      }

    } catch (error) {
      console.error('Error updating status:', error);
      alert(`Erreur: ${error.message}`);
    }
  };

  const formatTimer = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (isLoading || !booking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <div className="text-xl text-gray-700">Chargement...</div>
        </div>
      </div>
    );
  }

  // Si completed ou cancelled
  if (status === 'completed') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-green-50">
        <div className="text-center">
          <div className="text-6xl mb-4">✅</div>
          <div className="text-2xl font-bold text-green-700 mb-2">Prestation terminée!</div>
          <div className="text-gray-600">Redirection vers le tableau de bord...</div>
        </div>
      </div>
    );
  }

  if (status === 'cancelled') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-50">
        <div className="text-center">
          <div className="text-6xl mb-4">❌</div>
          <div className="text-2xl font-bold text-red-700 mb-2">Commande annulée</div>
          <div className="text-gray-600">Redirection vers le tableau de bord...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Header avec statut */}
      <div className="bg-white shadow-md border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => {
                if (confirm('Voulez-vous vraiment quitter le mode trajet ?')) {
                  stopLocationTracking();
                  router.push('/provider/dashboard');
                }
              }}
              className="text-gray-600 hover:text-gray-900"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="text-center flex-1">
              <div className="text-sm text-gray-500">Commande #{booking.id}</div>
              <div className="font-bold text-lg text-gray-900">
                {status === 'on_way' && '🚗 En route vers le client'}
                {status === 'arrived' && '📍 Arrivé chez le client'}
                {status === 'in_progress' && '🔨 Service en cours'}
              </div>
            </div>
            <div className="w-10"></div>
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Distance et ETA card (seulement si on_way) */}
        {status === 'on_way' && providerLocation && (
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl shadow-lg p-6 text-white">
            <div className="flex justify-around items-center">
              <div className="text-center">
                <div className="text-4xl font-bold mb-1">{distance}</div>
                <div className="text-indigo-100 text-sm">kilomètres</div>
              </div>
              <div className="w-px h-16 bg-white/30"></div>
              <div className="text-center">
                <div className="text-4xl font-bold mb-1">{eta}</div>
                <div className="text-indigo-100 text-sm">minutes</div>
              </div>
            </div>
          </div>
        )}

        {/* Info client card */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-start gap-4 mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl flex-shrink-0">
              👤
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900 mb-1">{booking.client_name}</h2>
              <p className="text-gray-600 text-lg">{booking.service_name}</p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-indigo-600">{booking.total_price}</div>
              <div className="text-gray-500 text-sm">MAD</div>
            </div>
          </div>

          <div className="space-y-3 border-t border-gray-100 pt-4">
            <div className="flex items-start gap-3">
              <span className="text-2xl">📍</span>
              <div className="flex-1">
                <div className="font-medium text-gray-700 mb-1">Adresse</div>
                <div className="text-gray-600">{booking.address}</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-2xl">🕐</span>
              <div>
                <span className="font-medium text-gray-700">Date: </span>
                <span className="text-gray-600">{booking.service_date} à {booking.service_time}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Timer si in_progress */}
        {status === 'in_progress' && (
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl shadow-lg p-8 text-center text-white">
            <div className="text-sm uppercase tracking-wider mb-2 text-green-100">⏱️ Temps écoulé</div>
            <div className="text-6xl font-mono font-bold">{formatTimer(timer)}</div>
          </div>
        )}

        {/* Boutons d'action */}
        <div className="space-y-4">
          {status === 'on_way' && (
            <button
              onClick={() => handleStatusChange('arrived')}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white py-5 px-6 rounded-xl font-bold text-lg shadow-lg transition-all transform hover:scale-105 active:scale-95 flex items-center justify-center gap-3"
            >
              <span className="text-3xl">📍</span>
              <span>Je suis arrivé(e)</span>
            </button>
          )}

          {status === 'arrived' && (
            <button
              onClick={() => handleStatusChange('in_progress')}
              className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white py-5 px-6 rounded-xl font-bold text-lg shadow-lg transition-all transform hover:scale-105 active:scale-95 flex items-center justify-center gap-3"
            >
              <span className="text-3xl">🔨</span>
              <span>Démarrer le service</span>
            </button>
          )}

          {status === 'in_progress' && (
            <button
              onClick={() => handleStatusChange('completed')}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white py-5 px-6 rounded-xl font-bold text-lg shadow-lg transition-all transform hover:scale-105 active:scale-95 flex items-center justify-center gap-3"
            >
              <span className="text-3xl">✅</span>
              <span>Terminer la prestation</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
