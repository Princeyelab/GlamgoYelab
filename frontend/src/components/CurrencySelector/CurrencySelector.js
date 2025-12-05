'use client';

import { useState, useRef, useEffect } from 'react';
import styles from './CurrencySelector.module.scss';
import { useCurrency } from '@/contexts/CurrencyContext';

export default function CurrencySelector() {
  const { currency, setCurrency, currencies, currencyInfo, showOriginalPrice, toggleShowOriginal } = useCurrency();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (code) => {
    setCurrency(code);
    setIsOpen(false);
  };

  return (
    <div className={styles.currencySelector} ref={dropdownRef}>
      <button
        className={styles.selectorButton}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Changer de devise"
      >
        <span className={styles.currencyCode}>{currency}</span>
        <span className={styles.currencySymbol}>{currencyInfo.symbol}</span>
        <span className={styles.arrow}>▼</span>
      </button>

      {isOpen && (
        <div className={styles.dropdown}>
          <div className={styles.dropdownHeader}>
            <span>Choisir la devise</span>
          </div>

          <div className={styles.currencyList}>
            {currencies.map((curr) => (
              <button
                key={curr.code}
                className={`${styles.currencyOption} ${curr.code === currency ? styles.active : ''}`}
                onClick={() => handleSelect(curr.code)}
              >
                <span className={styles.optionCode}>{curr.code}</span>
                <span className={styles.optionName}>{curr.name}</span>
                <span className={styles.optionSymbol}>{curr.symbol}</span>
              </button>
            ))}
          </div>

          <div className={styles.dropdownFooter}>
            <label className={styles.showOriginal}>
              <input
                type="checkbox"
                checked={showOriginalPrice}
                onChange={toggleShowOriginal}
              />
              <span>Afficher prix en MAD</span>
            </label>
          </div>
        </div>
      )}
    </div>
  );
}
