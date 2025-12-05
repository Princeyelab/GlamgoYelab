'use client';

import { useState, useEffect } from 'react';
import styles from './WelcomePopup.module.scss';

export default function WelcomePopupProvider() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const shouldShow = localStorage.getItem('showWelcomePopupProvider');
    if (shouldShow === 'true') {
      const timer = setTimeout(() => {
        localStorage.removeItem('showWelcomePopupProvider');
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
            En tant que Prestataire, vous êtes bien plus qu'un professionnel : vous êtes un ambassadeur de l'excellence à domicile. Votre savoir-faire et votre passion transforment chaque prestation en une expérience unique. Vos efforts sont reconnus et récompensés par une visibilité accrue, des commissions réduites et des distinctions honorifiques. Vous êtes au centre de notre mission : mettre en lumière votre talent et vous aider à grandir.
          </p>
          <button className={styles.okBtn} onClick={() => setIsOpen(false)}>
            C'est parti !
          </button>
        </div>
      </div>
    </div>
  );
}
