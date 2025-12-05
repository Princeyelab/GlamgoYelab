'use client';

import { useState, useEffect } from 'react';
import styles from './WelcomePopup.module.scss';

export default function WelcomePopup() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const shouldShow = localStorage.getItem('showWelcomePopup');
    if (shouldShow === 'true') {
      const timer = setTimeout(() => {
        localStorage.removeItem('showWelcomePopup');
        setIsOpen(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={() => setIsOpen(false)}>
      <div className={styles.popup} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeBtn} onClick={() => setIsOpen(false)}>
          &times;
        </button>
        <div className={styles.content}>
          <h2 className={styles.title}>Bienvenue sur GlamGo Marrakech !</h2>
          <p className={styles.message}>
            En tant que Client, vous êtes au cœur de notre communauté. Votre confiance soutient les talents locaux et vos choix permettent de valoriser leur métier. Vous profitez d'une expérience personnalisée, sécurisée et transparente. Vos avis sincères récompensent les meilleurs professionnels et contribuent à bâtir une plateforme fondée sur la qualité et le respect.
          </p>
          <button className={styles.okBtn} onClick={() => setIsOpen(false)}>
            C'est parti !
          </button>
        </div>
      </div>
    </div>
  );
}
