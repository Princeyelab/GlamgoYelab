'use client';
import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import './ServiceSelector.scss';

/**
 * ServiceSelector - Selectionner des services avec des cartes cliquables
 *
 * Props:
 * - services: array des services disponibles
 * - selectedServices: array des IDs selectionnes
 * - onSelectionChange: callback avec les IDs selectionnes
 * - multiSelect: boolean (defaut: true)
 */
export default function ServiceSelector({
  services = [],
  selectedServices = [],
  onSelectionChange,
  multiSelect = true
}) {
  const { language, t, translateDynamicBatch } = useLanguage();
  const [selected, setSelected] = useState(selectedServices);
  const [translatedServices, setTranslatedServices] = useState([]);

  useEffect(() => {
    setSelected(selectedServices);
  }, [selectedServices]);

  // Traduire les noms et descriptions des services en arabe
  useEffect(() => {
    const translateServices = async () => {
      if (language !== 'ar' || services.length === 0) {
        setTranslatedServices(services);
        return;
      }

      try {
        // Collecter tous les textes à traduire
        const textsToTranslate = [];
        services.forEach(service => {
          textsToTranslate.push(service.name || '');
          textsToTranslate.push(service.description || '');
        });

        // Traduire en batch
        const translations = await translateDynamicBatch(textsToTranslate);

        // Reconstruire les services avec les traductions
        const translated = services.map((service, index) => ({
          ...service,
          translatedName: translations[index * 2] || service.name,
          translatedDescription: translations[index * 2 + 1] || service.description
        }));

        setTranslatedServices(translated);
      } catch (error) {
        console.error('Erreur traduction services:', error);
        setTranslatedServices(services);
      }
    };

    translateServices();
  }, [language, services, translateDynamicBatch]);

  const handleToggle = (serviceId) => {
    let newSelection;

    if (multiSelect) {
      // Multi-selection
      if (selected.includes(serviceId)) {
        newSelection = selected.filter(id => id !== serviceId);
      } else {
        newSelection = [...selected, serviceId];
      }
    } else {
      // Selection unique
      newSelection = selected.includes(serviceId) ? [] : [serviceId];
    }

    setSelected(newSelection);
    if (onSelectionChange) {
      onSelectionChange(newSelection);
    }
  };

  // Utiliser les services traduits ou originaux
  const displayServices = translatedServices.length > 0 ? translatedServices : services;

  if (services.length === 0) {
    return (
      <div className="service-selector-empty">
        {t('serviceSelector.noServices') || (language === 'ar' ? 'لا توجد خدمات متاحة' : 'Aucun service disponible')}
      </div>
    );
  }

  const getServiceName = (service) => {
    if (language === 'ar' && service.translatedName) {
      return service.translatedName;
    }
    return service.name;
  };

  const getServiceDescription = (service) => {
    if (language === 'ar' && service.translatedDescription) {
      return service.translatedDescription;
    }
    return service.description;
  };

  const getSelectionText = () => {
    if (language === 'ar') {
      if (selected.length === 1) {
        return 'خدمة واحدة مختارة';
      }
      return `${selected.length} خدمات مختارة`;
    }
    return `${selected.length} service${selected.length > 1 ? 's' : ''} sélectionné${selected.length > 1 ? 's' : ''}`;
  };

  return (
    <div className="service-selector" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <div className="services-grid">
        {displayServices.map(service => (
          <div
            key={service.id}
            className={`service-card ${selected.includes(service.id) ? 'selected' : ''}`}
            onClick={() => handleToggle(service.id)}
          >
            <div className="service-icon">
              {service.icon || '✨'}
            </div>
            <div className="service-name">{getServiceName(service)}</div>
            {service.description && (
              <div className="service-description">{getServiceDescription(service)}</div>
            )}
            {selected.includes(service.id) && (
              <div className="check-icon"></div>
            )}
          </div>
        ))}
      </div>

      {selected.length > 0 && (
        <div className="selection-summary">
          {getSelectionText()}
        </div>
      )}
    </div>
  );
}
