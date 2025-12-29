import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  SafeAreaView,
} from 'react-native';
import { colors, spacing, typography, borderRadius } from '../../lib/constants/theme';

interface TermsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userType?: 'client' | 'provider';
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function TermsModal({ isOpen, onClose, userType = 'client' }: TermsModalProps) {
  const currentDate = new Date().toLocaleDateString('fr-FR');

  const clientTerms = `
CONDITIONS GENERALES D'UTILISATION - GLAMGO MARRAKECH
Plateforme de Services a Domicile - Espace Client

Derniere mise a jour : ${currentDate}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

INSCRIPTION ET ACCES
• Creation de compte obligatoire avec informations exactes : prenom, nom, email, telephone.
• Date de naissance obligatoire - Vous devez etre majeur (18 ans minimum).
• Adresse complete avec ville obligatoire pour la localisation des services.
• Les informations doivent etre tenues a jour.

IDENTITE ET UTILISATION PERSONNELLE
• Le Client inscrit est le beneficiaire direct du service.
• Interdiction de reserver pour autrui sans l'indiquer clairement.
• Suspension immediate en cas d'utilisation frauduleuse.

OBLIGATIONS
• Respect des horaires, avis honnetes, comportement respectueux.

POLITIQUE D'ANNULATION ET REMBOURSEMENT
• Annulation sans frais jusqu'a 2h avant.
• Moins de 2h → frais possibles.
• Absence sans annulation → prestation due integralement.
• Annulation par le Prestataire → remboursement integral.
• Cas de force majeure → conditions adaptees.
• Remboursement sous 7 a 14 jours ouvrables.

PROTECTION ET SECURITE
• Droit de refuser une prestation en cas de danger ou comportement inapproprie.
• Signalement rapide via l'application.
• Suspension immediate des Prestataires en cas de comportements violents ou irrespectueux.
• Confidentialite renforcee des donnees personnelles.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

DISPOSITIONS COMMUNES (Prestataires & Clients)

• Authenticite obligatoire : chaque compte doit etre utilise uniquement par la personne inscrite.

• Responsabilite : GlamGo Marrakech est un intermediaire et n'est pas responsable de la qualite des services, des litiges ou des dommages.

• Donnees personnelles : collectees et traitees selon la loi marocaine 09-08, jamais vendues a des tiers.

• Modification des CGU : GlamGo peut modifier les conditions a tout moment, notification via l'application ou email.

• Tolerance zero : suspension immediate en cas de comportement violent, discriminatoire ou menacant.

• Systeme de signalement : outil integre pour danger ou abus.

• Communication : via WhatsApp ou telephone, GlamGo peut contacter pour service ou support.

• Resiliation : suppression du compte possible a tout moment ; suspension en cas de violation.

• Loi applicable : droit marocain, tribunaux competents de Marrakech.

• Zone de couverture : engagement a servir les zones selectionnees, frais de deplacement negociables.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

NOTE FINALE

Chez GlamGo Marrakech, Clients et Prestataires avancent ensemble vers un objectif commun : creer une communaute fondee sur la confiance, la qualite et le respect. Chaque prestation est une rencontre, chaque avis est une contribution, et chaque effort est une pierre ajoutee a l'edifice de l'excellence.

"Les batailles de la vie ne sont pas gagnees par les plus forts, ni par les plus rapides, mais par ceux qui n'abandonnent jamais." – Roi Hassan II

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

EN COCHANT LA CASE, VOUS CONFIRMEZ AVOIR LU, COMPRIS ET ACCEPTE L'INTEGRALITE DES PRESENTES CONDITIONS GENERALES D'UTILISATION.
  `.trim();

  const providerTerms = `
CONDITIONS GENERALES DE PRESTATION - GLAMGO MARRAKECH
Espace Prestataire

Derniere mise a jour : ${currentDate}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

INSCRIPTION ET ACCES
• Informations personnelles exactes obligatoires : prenom, nom, email, telephone, WhatsApp.
• Date de naissance obligatoire - Vous devez etre majeur (18 ans minimum).
• Numero de CIN (Carte d'Identite Nationale) obligatoire pour la verification d'identite.
• Suspension possible en cas de non-respect ou d'informations frauduleuses.

PROFIL PROFESSIONNEL
• Description detaillee de vos services obligatoire (minimum 50 caracteres).
• Annees d'experience a renseigner obligatoirement.
• Engagement moral a exercer avec serieux, honnetete et respect.
• Selection d'au moins une specialite parmi : coiffure, esthetique, massage, maquillage, manucure/pedicure, epilation, henne, preparation mariee, barbier, soins du visage, coaching sportif, menage, chef a domicile, reparations, jardinage.

DOCUMENTS JUSTIFICATIFS
• Preuve d'experience OBLIGATOIRE : attestation de travail, contrats, portfolio de realisations, etc.
• Diplome ou certificat OBLIGATOIRE pour les specialites : coiffure, esthetique, massage, maquillage, soins du visage, coaching sportif.
• Attestation d'assurance professionnelle FORTEMENT RECOMMANDEE pour votre protection et celle de vos clients.
• Documents acceptes : PDF, JPG, PNG (maximum 5MB par fichier).

TARIFICATION
• Les tarifs sont negocies directement avec chaque client selon le service demande.
• Transparence totale exigee sur les prix et supplements eventuels.
• Vous etes libre de fixer vos propres tarifs.

ZONE DE SERVICE
• Adresse professionnelle principale obligatoire avec coordonnees GPS.
• Ville principale de service obligatoire.
• Zones de couverture : selection d'au moins une ville ou vous acceptez d'intervenir.
• Frais de deplacement negociables avec le client selon la distance.

IDENTITE ET EXECUTION PERSONNELLE
• Le Prestataire inscrit est le seul autorise a realiser la prestation.
• Interdiction de deleguer a un ami, cousin ou tiers non inscrit.
• Suspension immediate en cas de substitution non declaree.

OBLIGATIONS
• Ponctualite, qualite, respect, confidentialite, conformite legale.
• Respect des horaires convenus avec le client.
• Interdiction de fraude ou manipulation des avis.
• Comportement professionnel et respectueux en toutes circonstances.

BENEFICES ET AVANTAGES
• Visibilite accrue sur la plateforme GlamGo.
• Reduction de commission pour les prestataires performants.
• Badges de reconnaissance et notations visibles.
• Acces prioritaire aux demandes et mise en avant marketing.

POLITIQUE D'ANNULATION
• Annulation par le Prestataire → remboursement integral au Client.
• Annulations repetees → impact negatif sur votre profil et suspension possible.
• Cas de force majeure → conditions adaptees au cas par cas.

PROTECTION ET SECURITE
• Droit de refuser une prestation si conditions dangereuses ou comportement inapproprie.
• Indemnite de deplacement en cas de refus justifie apres deplacement.
• Localisation securisee visible par le Client (quartier/ville).
• Systeme de signalement rapide via l'application en cas de probleme.
• Suspension immediate des Clients en cas de comportements violents, irrespectueux ou discriminatoires.
• Protection de vos donnees personnelles conformement a la loi marocaine 09-08.

ASSURANCE ET RESPONSABILITE
• Vous etes responsable des dommages causes pendant vos prestations.
• Assurance professionnelle fortement recommandee.
• GlamGo Marrakech decline toute responsabilite pour les dommages causes par le Prestataire.
• GlamGo agit comme intermediaire et n'est pas responsable de la qualite des services fournis.

PROPRIETE INTELLECTUELLE ET USAGE DE LA MARQUE
• Licence d'utilisation accordee a GlamGo pour promotion de votre profil.
• Usage de la marque GlamGo limite a la plateforme et a votre activite professionnelle.
• Interdiction d'utiliser le logo GlamGo a des fins personnelles ou commerciales externes.

COMMUNICATION
• Communication avec les clients via WhatsApp ou telephone.
• GlamGo peut vous contacter pour support, assistance ou amelioration du service.
• Notifications importantes via email et application.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

DISPOSITIONS COMMUNES (Prestataires & Clients)

• Authenticite obligatoire : chaque compte doit etre utilise uniquement par la personne inscrite.

• Responsabilite : GlamGo Marrakech est un intermediaire et n'est pas responsable de la qualite des services, des litiges ou des dommages.

• Donnees personnelles : collectees et traitees selon la loi marocaine 09-08, jamais vendues a des tiers.

• Modification des CGU : GlamGo peut modifier les conditions a tout moment, notification via l'application ou email.

• Tolerance zero : suspension immediate en cas de comportement violent, discriminatoire ou menacant.

• Systeme de signalement : outil integre pour danger ou abus.

• Resiliation : suppression du compte possible a tout moment ; suspension en cas de violation.

• Loi applicable : droit marocain, tribunaux competents de Marrakech.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

NOTE FINALE

Chez GlamGo Marrakech, Clients et Prestataires avancent ensemble vers un objectif commun : creer une communaute fondee sur la confiance, la qualite et le respect. Chaque prestation est une rencontre, chaque avis est une contribution, et chaque effort est une pierre ajoutee a l'edifice de l'excellence.

"Les batailles de la vie ne sont pas gagnees par les plus forts, ni par les plus rapides, mais par ceux qui n'abandonnent jamais." – Roi Hassan II

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

EN COCHANT LA CASE, VOUS CONFIRMEZ AVOIR LU, COMPRIS ET ACCEPTE L'INTEGRALITE DES PRESENTES CONDITIONS GENERALES DE PRESTATION.
  `.trim();

  const termsContent = userType === 'client' ? clientTerms : providerTerms;
  const title = userType === 'client'
    ? "Conditions Generales d'Utilisation"
    : "Conditions Generales de Prestation";

  return (
    <Modal
      visible={isOpen}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.modalContent}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>{title}</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={onClose}
                accessibilityLabel="Fermer"
              >
                <Text style={styles.closeIcon}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Body */}
            <ScrollView
              style={styles.body}
              showsVerticalScrollIndicator={true}
            >
              <Text style={styles.termsText}>{termsContent}</Text>
            </ScrollView>

            {/* Footer */}
            <View style={styles.footer}>
              <TouchableOpacity
                style={styles.acceptButton}
                onPress={onClose}
              >
                <Text style={styles.acceptButtonText}>J'ai lu et compris</Text>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  safeArea: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: SCREEN_HEIGHT * 0.9,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 2,
    borderBottomColor: colors.gray[200],
  },
  title: {
    fontSize: typography.fontSize.lg,
    fontWeight: '700',
    color: colors.primary,
    flex: 1,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeIcon: {
    fontSize: 18,
    color: colors.gray[600],
    fontWeight: '600',
  },
  body: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    maxHeight: SCREEN_HEIGHT * 0.6,
  },
  termsText: {
    fontSize: typography.fontSize.sm,
    lineHeight: 24,
    color: colors.gray[700],
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: 2,
    borderTopColor: colors.gray[200],
  },
  acceptButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  acceptButtonText: {
    color: colors.white,
    fontSize: typography.fontSize.base,
    fontWeight: '600',
  },
});
