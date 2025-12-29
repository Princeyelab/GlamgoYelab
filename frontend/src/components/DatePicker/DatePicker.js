'use client';

import { useState, useRef, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import styles from './DatePicker.module.scss';

// Noms des mois en français et arabe
const MONTHS = {
  fr: ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'],
  ar: ['يناير', 'فبراير', 'مارس', 'أبريل', 'ماي', 'يونيو', 'يوليوز', 'غشت', 'شتنبر', 'أكتوبر', 'نونبر', 'دجنبر']
};

// Jours de la semaine en français et arabe
const WEEKDAYS = {
  fr: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'],
  ar: ['إث', 'ثل', 'أر', 'خم', 'جم', 'سب', 'أح']
};

/**
 * Composant DatePicker personnalisé avec support RTL et arabe
 */
export default function DatePicker({
  value,
  onChange,
  minDate,
  maxDate,
  placeholder,
  required = false,
  id,
  name,
  className
}) {
  const { language, isRTL, t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const containerRef = useRef(null);

  // Fermer le calendrier si clic en dehors
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Initialiser le mois courant avec la valeur sélectionnée ou aujourd'hui
  useEffect(() => {
    if (value) {
      setCurrentMonth(new Date(value));
    }
  }, [value]);

  // Obtenir les jours du mois
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();

    // Jour de la semaine du premier jour (0 = Dimanche, on veut Lundi = 0)
    let startDay = firstDay.getDay() - 1;
    if (startDay < 0) startDay = 6;

    const days = [];

    // Jours vides avant le premier jour du mois
    for (let i = 0; i < startDay; i++) {
      days.push(null);
    }

    // Jours du mois
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }

    return days;
  };

  // Vérifier si une date est valide (entre min et max)
  const isDateValid = (date) => {
    if (!date) return false;
    const dateStr = formatDateISO(date);
    if (minDate && dateStr < minDate) return false;
    if (maxDate && dateStr > maxDate) return false;
    return true;
  };

  // Vérifier si une date est aujourd'hui
  const isToday = (date) => {
    if (!date) return false;
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  };

  // Vérifier si une date est sélectionnée
  const isSelected = (date) => {
    if (!date || !value) return false;
    return formatDateISO(date) === value;
  };

  // Formater une date en ISO (YYYY-MM-DD)
  const formatDateISO = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Formater la date affichée
  const formatDisplayDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const day = date.getDate();
    const month = MONTHS[language]?.[date.getMonth()] || MONTHS.fr[date.getMonth()];
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
  };

  // Naviguer au mois précédent
  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  // Naviguer au mois suivant
  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  // Sélectionner une date
  const selectDate = (date) => {
    if (!date || !isDateValid(date)) return;
    onChange(formatDateISO(date));
    setIsOpen(false);
  };

  const days = getDaysInMonth(currentMonth);
  const monthName = MONTHS[language]?.[currentMonth.getMonth()] || MONTHS.fr[currentMonth.getMonth()];
  const weekdays = WEEKDAYS[language] || WEEKDAYS.fr;

  return (
    <div
      className={`${styles.datePicker} ${isRTL ? styles.rtl : ''} ${className || ''}`}
      ref={containerRef}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Input affichant la date */}
      <div
        className={`${styles.input} ${isOpen ? styles.focused : ''}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className={styles.icon}>📅</span>
        <span className={value ? styles.value : styles.placeholder}>
          {value ? formatDisplayDate(value) : (placeholder || t('datePicker.selectDate'))}
        </span>
        <span className={`${styles.arrow} ${isOpen ? styles.open : ''}`}>▼</span>
      </div>

      {/* Input caché pour le formulaire */}
      <input
        type="hidden"
        id={id}
        name={name}
        value={value || ''}
        required={required}
      />

      {/* Calendrier déroulant */}
      {isOpen && (
        <div className={styles.calendar}>
          {/* Navigation mois */}
          <div className={styles.header}>
            <button type="button" onClick={prevMonth} className={styles.navBtn}>
              {isRTL ? '›' : '‹'}
            </button>
            <span className={styles.monthYear}>
              {monthName} {currentMonth.getFullYear()}
            </span>
            <button type="button" onClick={nextMonth} className={styles.navBtn}>
              {isRTL ? '‹' : '›'}
            </button>
          </div>

          {/* Jours de la semaine */}
          <div className={styles.weekdays}>
            {weekdays.map((day, i) => (
              <div key={i} className={styles.weekday}>{day}</div>
            ))}
          </div>

          {/* Grille des jours */}
          <div className={styles.days}>
            {days.map((date, i) => (
              <div
                key={i}
                className={`
                  ${styles.day}
                  ${!date ? styles.empty : ''}
                  ${date && !isDateValid(date) ? styles.disabled : ''}
                  ${date && isToday(date) ? styles.today : ''}
                  ${date && isSelected(date) ? styles.selected : ''}
                `}
                onClick={() => date && selectDate(date)}
              >
                {date ? date.getDate() : ''}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
