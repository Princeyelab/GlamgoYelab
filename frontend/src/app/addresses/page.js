'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from './page.module.scss';
import Button from '@/components/Button';
import apiClient from '@/lib/apiClient';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';

export default function AddressesPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { t } = useLanguage();
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
        setError(t('addressesPage.loadError'));
      }
    } catch (err) {
      setError(err.message || t('addressesPage.loadError'));
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
        setSuccess(editingId ? t('addressesPage.addressUpdated') : t('addressesPage.addressAdded'));
        setIsAdding(false);
        setEditingId(null);
        resetForm();
        await fetchAddresses();
      } else {
        setError(response.message || t('addressesPage.saveError'));
      }
    } catch (err) {
      setError(err.message || t('addressesPage.saveError'));
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
    if (!confirm(t('addressesPage.deleteConfirm'))) {
      return;
    }

    try {
      const response = await apiClient.delete(`/user/addresses/${id}`);
      if (response.success) {
        setSuccess(t('addressesPage.addressDeleted'));
        await fetchAddresses();
      } else {
        setError(response.message || t('addressesPage.deleteError'));
      }
    } catch (err) {
      setError(err.message || t('addressesPage.deleteError'));
    }
  };

  const handleSetDefault = async (id) => {
    try {
      const response = await apiClient.patch(`/user/addresses/${id}/default`);
      if (response.success) {
        setSuccess(t('addressesPage.defaultUpdated'));
        await fetchAddresses();
      } else {
        setError(response.message || t('addressesPage.updateError'));
      }
    } catch (err) {
      setError(err.message || t('addressesPage.updateError'));
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
        <p>{t('common.loading')}</p>
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
          <h1 className={styles.title}>{t('addressesPage.title')}</h1>
          <p className={styles.subtitle}>{t('addressesPage.subtitle')}</p>
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
              {t('addressesPage.addAddress')}
            </Button>
          </div>
        )}

        {isAdding && (
          <div className={styles.formCard}>
            <h2 className={styles.formTitle}>
              {editingId ? t('addressesPage.editAddress') : t('addressesPage.newAddress')}
            </h2>
            <form onSubmit={handleSubmit} className={styles.addressForm}>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label htmlFor="label" className={styles.label}>
                    {t('addressesPage.label')} <span className={styles.required}>*</span>
                  </label>
                  <input
                    type="text"
                    id="label"
                    name="label"
                    value={formData.label}
                    onChange={handleChange}
                    className={styles.input}
                    placeholder={t('addressesPage.labelPlaceholder')}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="city" className={styles.label}>
                    {t('addressesPage.city')} <span className={styles.required}>*</span>
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
                    placeholder={t('addressesPage.postalCodePlaceholder')}
                  />
                </div>

                <div className={styles.formGroupFull}>
                  <label htmlFor="address_line" className={styles.label}>
                    {t('addressesPage.fullAddress')} <span className={styles.required}>*</span>
                  </label>
                  <textarea
                    id="address_line"
                    name="address_line"
                    value={formData.address_line}
                    onChange={handleChange}
                    className={styles.textarea}
                    placeholder={t('addressesPage.addressPlaceholder')}
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
                    <span>{t('addressesPage.setAsDefault')}</span>
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
                  {t('common.cancel')}
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={loading}
                >
                  {loading ? t('addressesPage.saving') : t('addressesPage.save')}
                </Button>
              </div>
            </form>
          </div>
        )}

        {loading && !isAdding ? (
          <div className={styles.loading}>
            <div className={styles.spinner}></div>
            <p>{t('addressesPage.loadingAddresses')}</p>
          </div>
        ) : addresses.length === 0 && !isAdding ? (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>📍</div>
            <h3>{t('addressesPage.noAddresses')}</h3>
            <p>{t('addressesPage.noAddressesDesc')}</p>
          </div>
        ) : (
          <div className={styles.addressesList}>
            {addresses.map((address) => (
              <div key={address.id} className={styles.addressCard}>
                {address.is_default && (
                  <div className={styles.defaultBadge}>{t('addressesPage.default')}</div>
                )}
                <div className={styles.addressHeader}>
                  <h3 className={styles.addressLabel}>{address.label}</h3>
                  <div className={styles.addressActions}>
                    <button
                      className={styles.actionBtn}
                      onClick={() => handleEdit(address)}
                      title={t('addressesPage.edit')}
                    >
                      ✏️
                    </button>
                    {!address.is_default && (
                      <button
                        className={styles.actionBtn}
                        onClick={() => handleSetDefault(address.id)}
                        title={t('addressesPage.setDefault')}
                      >
                        ⭐
                      </button>
                    )}
                    <button
                      className={styles.actionBtn}
                      onClick={() => handleDelete(address.id)}
                      title={t('addressesPage.delete')}
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
