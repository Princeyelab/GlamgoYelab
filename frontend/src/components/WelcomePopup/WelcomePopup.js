'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import styles from './WelcomePopup.module.scss';

export default function WelcomePopup() {
  const { language, toggleLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const isRTL = language === 'ar';

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

  const content = {
    fr: {
      title: 'Bienvenue sur GlamGo Marrakech !',
      message: 'En tant que Client, vous êtes au cœur de notre communauté. Votre confiance soutient les talents locaux et vos choix permettent de valoriser leur métier. Vous profitez d\'une expérience personnalisée, sécurisée et transparente. Vos avis sincères récompensent les meilleurs professionnels et contribuent à bâtir une plateforme fondée sur la qualité et le respect.',
      okButton: 'C\'est parti !',
      exploreButton: 'Découvrir les services',
      switchLang: 'عربية'
    },
    ar: {
      title: 'مرحباً بك في غلام غو مراكش!',
      message: 'بصفتك عميلاً، أنت في قلب مجتمعنا. ثقتك تدعم المواهب المحلية واختياراتك تساهم في تقدير مهنتهم. تستمتع بتجربة مخصصة وآمنة وشفافة. آراؤك الصادقة تكافئ أفضل المحترفين وتساهم في بناء منصة قائمة على الجودة والاحترام.',
      okButton: 'هيا بنا!',
      exploreButton: 'اكتشف الخدمات',
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
                window.location.href = '/services';
              }}
            >
              {t.exploreButton}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
