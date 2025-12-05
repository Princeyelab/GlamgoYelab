'use client';
import { useState, useEffect } from 'react';
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
  const [selected, setSelected] = useState(selectedServices);

  useEffect(() => {
    setSelected(selectedServices);
  }, [selectedServices]);

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

  if (services.length === 0) {
    return (
      <div className="service-selector-empty">
        Aucun service disponible
      </div>
    );
  }

  return (
    <div className="service-selector">
      <div className="services-grid">
        {services.map(service => (
          <div
            key={service.id}
            className={`service-card ${selected.includes(service.id) ? 'selected' : ''}`}
            onClick={() => handleToggle(service.id)}
          >
            <div className="service-icon">
              {service.icon || '✨'}
            </div>
            <div className="service-name">{service.name}</div>
            {service.description && (
              <div className="service-description">{service.description}</div>
            )}
            {selected.includes(service.id) && (
              <div className="check-icon"></div>
            )}
          </div>
        ))}
      </div>

      {selected.length > 0 && (
        <div className="selection-summary">
          {selected.length} service{selected.length > 1 ? 's' : ''} selectionne{selected.length > 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
}
