'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from './page.module.scss';
import Button from '@/components/Button';
import apiClient from '@/lib/apiClient';
import { useAuth } from '@/contexts/AuthContext';

export default function AddressesPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    label: '',
    address_line: '',
    city: 'Marrakech',
    postal_code: '',
    is_default: false,
  });

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      fetchAddresses();
    }
  }, [user]);

  const fetchAddresses = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/user/addresses');
      if (response.success) {
        setAddresses(response.data || []);
      } else {
        setError('Erreur lors du chargement des adresses');
      }
    } catch (err) {
      setError(err.message || 'Erreur lors du chargement des adresses');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      let response;
      if (editingId) {
        response = await apiClient.put(`/user/addresses/${editingId}`, formData);
      } else {
        response = await apiClient.post('/user/addresses', formData);
      }

      if (response.success) {
        setSuccess(editingId ? 'Adresse modifiée avec succès !' : 'Adresse ajoutée avec succès !');
        setIsAdding(false);
        setEditingId(null);
        resetForm();
        await fetchAddresses();
      } else {
        setError(response.message || 'Erreur lors de la sauvegarde de l\'adresse');
      }
    } catch (err) {
      setError(err.message || 'Erreur lors de la sauvegarde de l\'adresse');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (address) => {
    setFormData({
      label: address.label || '',
      address_line: address.address_line || '',
      city: address.city || 'Marrakech',
      postal_code: address.postal_code || '',
      is_default: address.is_default || false,
    });
    setEditingId(address.id);
    setIsAdding(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette adresse ?')) {
      return;
    }

    try {
      const response = await apiClient.delete(`/user/addresses/${id}`);
      if (response.success) {
        setSuccess('Adresse supprimée avec succès !');
        await fetchAddresses();
      } else {
        setError(response.message || 'Erreur lors de la suppression');
      }
    } catch (err) {
      setError(err.message || 'Erreur lors de la suppression');
    }
  };

  const handleSetDefault = async (id) => {
    try {
      const response = await apiClient.patch(`/user/addresses/${id}/default`);
      if (response.success) {
        setSuccess('Adresse par défaut mise à jour !');
        await fetchAddresses();
      } else {
        setError(response.message || 'Erreur lors de la mise à jour');
      }
    } catch (err) {
      setError(err.message || 'Erreur lors de la mise à jour');
    }
  };

  const resetForm = () => {
    setFormData({
      label: '',
      address_line: '',
      city: 'Marrakech',
      postal_code: '',
      is_default: false,
    });
    setEditingId(null);
    setIsAdding(false);
  };

  const handleCancel = () => {
    resetForm();
    setError('');
    setSuccess('');
  };

  if (authLoading) {
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

  return (
    <div className={styles.addressesPage}>
      <div className="container">
        <div className={styles.header}>
          <h1 className={styles.title}>Mes Adresses</h1>
          <p className={styles.subtitle}>Gérez vos adresses de livraison</p>
        </div>

        {error && (
          <div className={styles.error}>
            {error}
          </div>
        )}

        {success && (
          <div className={styles.success}>
            {success}
          </div>
        )}

        {!isAdding && (
          <div className={styles.addButtonWrapper}>
            <Button
              variant="primary"
              onClick={() => setIsAdding(true)}
            >
              + Ajouter une adresse
            </Button>
          </div>
        )}

        {isAdding && (
          <div className={styles.formCard}>
            <h2 className={styles.formTitle}>
              {editingId ? 'Modifier l\'adresse' : 'Nouvelle adresse'}
            </h2>
            <form onSubmit={handleSubmit} className={styles.addressForm}>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label htmlFor="label" className={styles.label}>
                    Libellé <span className={styles.required}>*</span>
                  </label>
                  <input
                    type="text"
                    id="label"
                    name="label"
                    value={formData.label}
                    onChange={handleChange}
                    className={styles.input}
                    placeholder="Ex: Maison, Bureau, etc."
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="city" className={styles.label}>
                    Ville <span className={styles.required}>*</span>
                  </label>
                  <input
                    type="text"
                    id="city"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    className={styles.input}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="postal_code" className={styles.label}>
                    Code postal
                  </label>
                  <input
                    type="text"
                    id="postal_code"
                    name="postal_code"
                    value={formData.postal_code}
                    onChange={handleChange}
                    className={styles.input}
                    placeholder="Ex: 40000"
                  />
                </div>

                <div className={styles.formGroupFull}>
                  <label htmlFor="address_line" className={styles.label}>
                    Adresse complète <span className={styles.required}>*</span>
                  </label>
                  <textarea
                    id="address_line"
                    name="address_line"
                    value={formData.address_line}
                    onChange={handleChange}
                    className={styles.textarea}
                    placeholder="Numéro, rue, quartier..."
                    rows={3}
                    required
                  />
                </div>

                <div className={styles.formGroupFull}>
                  <label className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      name="is_default"
                      checked={formData.is_default}
                      onChange={handleChange}
                      className={styles.checkbox}
                    />
                    <span>Définir comme adresse par défaut</span>
                  </label>
                </div>
              </div>

              <div className={styles.formActions}>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  disabled={loading}
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={loading}
                >
                  {loading ? 'Enregistrement...' : 'Enregistrer'}
                </Button>
              </div>
            </form>
          </div>
        )}

        {loading && !isAdding ? (
          <div className={styles.loading}>
            <div className={styles.spinner}></div>
            <p>Chargement des adresses...</p>
          </div>
        ) : addresses.length === 0 && !isAdding ? (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>📍</div>
            <h3>Aucune adresse enregistrée</h3>
            <p>Ajoutez une adresse pour faciliter vos commandes.</p>
          </div>
        ) : (
          <div className={styles.addressesList}>
            {addresses.map((address) => (
              <div key={address.id} className={styles.addressCard}>
                {address.is_default && (
                  <div className={styles.defaultBadge}>Par défaut</div>
                )}
                <div className={styles.addressHeader}>
                  <h3 className={styles.addressLabel}>{address.label}</h3>
                  <div className={styles.addressActions}>
                    <button
                      className={styles.actionBtn}
                      onClick={() => handleEdit(address)}
                      title="Modifier"
                    >
                      ✏️
                    </button>
                    {!address.is_default && (
                      <button
                        className={styles.actionBtn}
                        onClick={() => handleSetDefault(address.id)}
                        title="Définir par défaut"
                      >
                        ⭐
                      </button>
                    )}
                    <button
                      className={styles.actionBtn}
                      onClick={() => handleDelete(address.id)}
                      title="Supprimer"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
                <div className={styles.addressContent}>
                  <p className={styles.addressText}>{address.address_line}</p>
                  <p className={styles.addressCity}>
                    {address.city}{address.postal_code ? `, ${address.postal_code}` : ''}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
