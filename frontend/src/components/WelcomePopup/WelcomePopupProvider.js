'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import styles from './WelcomePopup.module.scss';

export default function WelcomePopupProvider() {
  const { language, toggleLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const isRTL = language === 'ar';

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

  const content = {
    fr: {
      title: 'Bienvenue sur GlamGo Marrakech !',
      message: 'En tant que Prestataire, vous êtes bien plus qu\'un professionnel : vous êtes un ambassadeur de l\'excellence à domicile. Votre savoir-faire et votre passion transforment chaque prestation en une expérience unique. Vos efforts sont reconnus et récompensés par une visibilité accrue, des commissions réduites et des distinctions honorifiques. Vous êtes au centre de notre mission : mettre en lumière votre talent et vous aider à grandir.',
      okButton: 'C\'est parti !',
      dashboardButton: 'Voir mon tableau de bord',
      switchLang: 'عربية'
    },
    ar: {
      title: 'مرحباً بك في غلام غو مراكش!',
      message: 'بصفتك مقدم خدمة، أنت أكثر من مجرد محترف: أنت سفير للتميز في الخدمات المنزلية. مهارتك وشغفك يحولان كل خدمة إلى تجربة فريدة. جهودك معترف بها ومكافأة من خلال رؤية متزايدة وعمولات مخفضة وتمييزات شرفية. أنت في قلب مهمتنا: تسليط الضوء على موهبتك ومساعدتك على النمو.',
      okButton: 'هيا بنا!',
      dashboardButton: 'عرض لوحة التحكم',
      switchLang: 'Français'
    }
  };

  const t = content[language] || content.fr;

  return (
    <div className={styles.overlay} onClick={() => setIsOpen(false)}>
      <div className={styles.popup} onClick={(e) => e.stopPropagation()} dir={isRTL ? 'rtl' : 'ltr'}>
        {/* Bouton de changement de langue */}
        <button
          className={styles.langBtn}
          onClick={toggleLanguage}
          aria-label={isRTL ? 'Changer en français' : 'التبديل إلى العربية'}
        >
          {t.switchLang}
        </button>

        <button className={styles.closeBtn} onClick={() => setIsOpen(false)} aria-label={isRTL ? 'إغلاق' : 'Fermer'}>
          &times;
        </button>
        <div className={styles.content}>
          <div className={styles.emoji}>🎉</div>
          <h2 className={styles.title}>{t.title}</h2>
          <p className={styles.message}>{t.message}</p>
          <div className={styles.buttons}>
            <button className={styles.okBtn} onClick={() => setIsOpen(false)}>
              {t.okButton}
            </button>
            <button
              className={styles.exploreBtn}
              onClick={() => {
                setIsOpen(false);
                window.location.href = '/provider/dashboard';
              }}
            >
              {t.dashboardButton}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
