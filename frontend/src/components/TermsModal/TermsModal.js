'use client';

import { useEffect } from 'react';
import styles from './TermsModal.module.scss';

export default function TermsModal({ isOpen, onClose, userType = 'client' }) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const clientTerms = `
CONDITIONS GÉNÉRALES D'UTILISATION - GLAMGO MARRAKECH
Plateforme de Services à Domicile - Espace Client

Dernière mise à jour : ${new Date().toLocaleDateString('fr-FR')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 INSCRIPTION ET ACCÈS
• Création de compte obligatoire avec informations exactes : prénom, nom, email, téléphone, WhatsApp.
• Date de naissance obligatoire - Vous devez être majeur (18 ans minimum).
• Adresse complète avec ville obligatoire pour la localisation des services.
• Les informations doivent être tenues à jour.

👤 IDENTITÉ ET UTILISATION PERSONNELLE
• Le Client inscrit est le bénéficiaire direct du service.
• Interdiction de réserver pour autrui sans l'indiquer clairement.
• Suspension immédiate en cas d'utilisation frauduleuse.

✅ OBLIGATIONS
• Respect des horaires, avis honnêtes, comportement respectueux.

📅 POLITIQUE D'ANNULATION ET REMBOURSEMENT
• Annulation sans frais jusqu'à 4h avant.
• Moins de 4h → frais possibles.
• Absence sans annulation → prestation due intégralement.
• Annulation par le Prestataire → remboursement intégral.
• Cas de force majeure → conditions adaptées.
• Remboursement sous 7 à 14 jours ouvrables.

🛡️ PROTECTION ET SÉCURITÉ
• Droit de refuser une prestation en cas de danger ou comportement inapproprié.
• Signalement rapide via l'application.
• Suspension immédiate des Prestataires en cas de comportements violents ou irrespectueux.
• Confidentialité renforcée des données personnelles.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📜 DISPOSITIONS COMMUNES (Prestataires & Clients)

• Authenticité obligatoire : chaque compte doit être utilisé uniquement par la personne inscrite.

• Responsabilité : GlamGo Marrakech est un intermédiaire et n'est pas responsable de la qualité des services, des litiges ou des dommages.

• Données personnelles : collectées et traitées selon la loi marocaine 09-08, jamais vendues à des tiers.

• Modification des CGU : GlamGo peut modifier les conditions à tout moment, notification via l'application ou email.

• Tolérance zéro : suspension immédiate en cas de comportement violent, discriminatoire ou menaçant.

• Système de signalement : outil intégré pour danger ou abus.

• Communication : via WhatsApp ou téléphone, GlamGo peut contacter pour service ou support.

• Résiliation : suppression du compte possible à tout moment ; suspension en cas de violation.

• Loi applicable : droit marocain, tribunaux compétents de Marrakech.

• Zone de couverture : engagement à servir les zones sélectionnées, frais de déplacement négociables.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🌟 NOTE FINALE

Chez GlamGo Marrakech, Clients et Prestataires avancent ensemble vers un objectif commun : créer une communauté fondée sur la confiance, la qualité et le respect. Chaque prestation est une rencontre, chaque avis est une contribution, et chaque effort est une pierre ajoutée à l'édifice de l'excellence.

✨ « Les batailles de la vie ne sont pas gagnées par les plus forts, ni par les plus rapides, mais par ceux qui n'abandonnent jamais. » – Roi Hassan II

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

EN COCHANT LA CASE, VOUS CONFIRMEZ AVOIR LU, COMPRIS ET ACCEPTÉ L'INTÉGRALITÉ DES PRÉSENTES CONDITIONS GÉNÉRALES D'UTILISATION.
  `.trim();

  const providerTerms = `
CONDITIONS GÉNÉRALES DE PRESTATION - GLAMGO MARRAKECH
Espace Prestataire

Dernière mise à jour : ${new Date().toLocaleDateString('fr-FR')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 INSCRIPTION ET ACCÈS
• Informations personnelles exactes obligatoires : prénom, nom, email, téléphone, WhatsApp.
• Date de naissance obligatoire - Vous devez être majeur (18 ans minimum).
• Numéro de CIN (Carte d'Identité Nationale) obligatoire pour la vérification d'identité.
• Suspension possible en cas de non-respect ou d'informations frauduleuses.

🎯 PROFIL PROFESSIONNEL
• Description détaillée de vos services obligatoire (minimum 50 caractères).
• Années d'expérience à renseigner obligatoirement.
• Engagement moral à exercer avec sérieux, honnêteté et respect.
• Sélection d'au moins une spécialité parmi : coiffure, esthétique, massage, maquillage, manucure/pédicure, épilation, henné, préparation mariée, barbier, soins du visage, coaching sportif, ménage, chef à domicile, réparations, jardinage.

📄 DOCUMENTS JUSTIFICATIFS
• Preuve d'expérience OBLIGATOIRE : attestation de travail, contrats, portfolio de réalisations, etc.
• Diplôme ou certificat OBLIGATOIRE pour les spécialités : coiffure, esthétique, massage, maquillage, soins du visage, coaching sportif.
• Attestation d'assurance professionnelle FORTEMENT RECOMMANDÉE pour votre protection et celle de vos clients.
• Documents acceptés : PDF, JPG, PNG (maximum 5MB par fichier).

💰 TARIFICATION
• Les tarifs sont négociés directement avec chaque client selon le service demandé.
• Transparence totale exigée sur les prix et suppléments éventuels.
• Vous êtes libre de fixer vos propres tarifs.

📍 ZONE DE SERVICE
• Adresse professionnelle principale obligatoire avec coordonnées GPS.
• Ville principale de service obligatoire.
• Zones de couverture : sélection d'au moins une ville où vous acceptez d'intervenir.
• Frais de déplacement négociables avec le client selon la distance.

👤 IDENTITÉ ET EXÉCUTION PERSONNELLE
• Le Prestataire inscrit est le seul autorisé à réaliser la prestation.
• Interdiction de déléguer à un ami, cousin ou tiers non inscrit.
• Suspension immédiate en cas de substitution non déclarée.

✅ OBLIGATIONS
• Ponctualité, qualité, respect, confidentialité, conformité légale.
• Respect des horaires convenus avec le client.
• Interdiction de fraude ou manipulation des avis.
• Comportement professionnel et respectueux en toutes circonstances.

🏆 BÉNÉFICES ET AVANTAGES
• Visibilité accrue sur la plateforme GlamGo.
• Réduction de commission pour les prestataires performants.
• Badges de reconnaissance et notations visibles.
• Accès prioritaire aux demandes et mise en avant marketing.

📅 POLITIQUE D'ANNULATION
• Annulation par le Prestataire → remboursement intégral au Client.
• Annulations répétées → impact négatif sur votre profil et suspension possible.
• Cas de force majeure → conditions adaptées au cas par cas.

🛡️ PROTECTION ET SÉCURITÉ
• Droit de refuser une prestation si conditions dangereuses ou comportement inapproprié.
• Indemnité de déplacement en cas de refus justifié après déplacement.
• Localisation sécurisée visible par le Client (quartier/ville).
• Système de signalement rapide via l'application en cas de problème.
• Suspension immédiate des Clients en cas de comportements violents, irrespectueux ou discriminatoires.
• Protection de vos données personnelles conformément à la loi marocaine 09-08.

🔒 ASSURANCE ET RESPONSABILITÉ
• Vous êtes responsable des dommages causés pendant vos prestations.
• Assurance professionnelle fortement recommandée.
• GlamGo Marrakech décline toute responsabilité pour les dommages causés par le Prestataire.
• GlamGo agit comme intermédiaire et n'est pas responsable de la qualité des services fournis.

📝 PROPRIÉTÉ INTELLECTUELLE ET USAGE DE LA MARQUE
• Licence d'utilisation accordée à GlamGo pour promotion de votre profil.
• Usage de la marque GlamGo limité à la plateforme et à votre activité professionnelle.
• Interdiction d'utiliser le logo GlamGo à des fins personnelles ou commerciales externes.

📱 COMMUNICATION
• Communication avec les clients via WhatsApp ou téléphone.
• GlamGo peut vous contacter pour support, assistance ou amélioration du service.
• Notifications importantes via email et application.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📜 DISPOSITIONS COMMUNES (Prestataires & Clients)

• Authenticité obligatoire : chaque compte doit être utilisé uniquement par la personne inscrite.

• Responsabilité : GlamGo Marrakech est un intermédiaire et n'est pas responsable de la qualité des services, des litiges ou des dommages.

• Données personnelles : collectées et traitées selon la loi marocaine 09-08, jamais vendues à des tiers.

• Modification des CGU : GlamGo peut modifier les conditions à tout moment, notification via l'application ou email.

• Tolérance zéro : suspension immédiate en cas de comportement violent, discriminatoire ou menaçant.

• Système de signalement : outil intégré pour danger ou abus.

• Résiliation : suppression du compte possible à tout moment ; suspension en cas de violation.

• Loi applicable : droit marocain, tribunaux compétents de Marrakech.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🌟 NOTE FINALE

Chez GlamGo Marrakech, Clients et Prestataires avancent ensemble vers un objectif commun : créer une communauté fondée sur la confiance, la qualité et le respect. Chaque prestation est une rencontre, chaque avis est une contribution, et chaque effort est une pierre ajoutée à l'édifice de l'excellence.

✨ « Les batailles de la vie ne sont pas gagnées par les plus forts, ni par les plus rapides, mais par ceux qui n'abandonnent jamais. » – Roi Hassan II

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

EN COCHANT LA CASE, VOUS CONFIRMEZ AVOIR LU, COMPRIS ET ACCEPTÉ L'INTÉGRALITÉ DES PRÉSENTES CONDITIONS GÉNÉRALES DE PRESTATION.
  `.trim();

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>
            {userType === 'client'
              ? 'Conditions Générales d\'Utilisation'
              : 'Conditions Générales de Prestation'}
          </h2>
          <button
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Fermer"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <div className={styles.modalBody}>
          <pre className={styles.termsText}>
            {userType === 'client' ? clientTerms : providerTerms}
          </pre>
        </div>
        <div className={styles.modalFooter}>
          <button className={styles.acceptButton} onClick={onClose}>
            J'ai lu et compris
          </button>
        </div>
      </div>
    </div>
  );
}
