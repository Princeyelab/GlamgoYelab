'use client';
import Link from 'next/link';
import './charter.scss';

export default function ProviderCharterPage() {
  return (
    <div className="charter-page">
      <div className="charter-container">
        <Link href="/provider/register" className="back-link">← Retour</Link>

        <h1>Charte Prestataire GlamGo</h1>
        <p className="last-update">Derniere mise a jour : Novembre 2024</p>

        <section>
          <h2>1. Engagement de Qualite</h2>
          <p>
            En tant que prestataire GlamGo, vous vous engagez a fournir des services
            de qualite professionnelle dans le respect des normes d'hygiene et de securite.
          </p>
          <ul>
            <li>Respecter les rendez-vous et les horaires convenus</li>
            <li>Utiliser du materiel professionnel et en bon etat</li>
            <li>Maintenir un niveau d'hygiene irreprochable</li>
            <li>Porter une tenue professionnelle appropriee</li>
          </ul>
        </section>

        <section>
          <h2>2. Professionnalisme</h2>
          <p>
            Vous vous engagez a adopter une attitude professionnelle en toutes circonstances :
          </p>
          <ul>
            <li>Traiter les clients avec courtoisie et respect</li>
            <li>Communiquer de maniere claire et professionnelle</li>
            <li>Respecter la vie privee et la confidentialite des clients</li>
            <li>Gerer les situations difficiles avec calme et professionnalisme</li>
          </ul>
        </section>

        <section>
          <h2>3. Disponibilite et Ponctualite</h2>
          <p>
            Vous vous engagez a :
          </p>
          <ul>
            <li>Tenir a jour votre planning de disponibilite</li>
            <li>Arriver a l'heure aux rendez-vous</li>
            <li>Prevenir au plus tot en cas d'empechement (minimum 24h a l'avance)</li>
            <li>Accepter les commandes dans les delais raisonnables</li>
          </ul>
        </section>

        <section>
          <h2>4. Tarification et Paiements</h2>
          <p>
            Conditions financieres :
          </p>
          <ul>
            <li>Respecter les tarifs affiches sur la plateforme</li>
            <li>Accepter le systeme de commission GlamGo (20% sur chaque prestation)</li>
            <li>Ne pas demander de paiement direct aux clients en dehors de la plateforme</li>
            <li>Declarer tous les revenus perçus via GlamGo</li>
          </ul>
        </section>

        <section>
          <h2>5. Systeme d'Evaluation</h2>
          <p>
            Vous acceptez le systeme d'evaluation de GlamGo :
          </p>
          <ul>
            <li>Les clients peuvent noter et commenter vos prestations</li>
            <li>Les avis sont publics et visibles par tous les utilisateurs</li>
            <li>Une note moyenne inferieure a 3/5 peut entrainer une suspension temporaire</li>
            <li>Les avis manifestement faux ou malveillants seront supprimes apres verification</li>
          </ul>
        </section>

        <section>
          <h2>6. Conditions d'Annulation</h2>
          <p>
            Regles d'annulation pour les prestataires :
          </p>
          <ul>
            <li>Annulation gratuite jusqu'a 24h avant le rendez-vous</li>
            <li>Annulation entre 24h et 2h : penalite de 50% du montant</li>
            <li>Annulation moins de 2h avant ou absence : penalite de 100%</li>
            <li>Plus de 3 annulations en un mois peut entrainer une suspension</li>
          </ul>
        </section>

        <section>
          <h2>7. Documents et Verification</h2>
          <p>
            Vous vous engagez a fournir des documents valides :
          </p>
          <ul>
            <li>Carte d'identite nationale (CIN) en cours de validite</li>
            <li>Justificatif de domicile de moins de 3 mois</li>
            <li>Diplomes ou certifications professionnelles (si applicable)</li>
            <li>RIB / IBAN pour les paiements</li>
          </ul>
        </section>

        <section>
          <h2>8. Hygiene et Securite</h2>
          <p>
            Normes d'hygiene obligatoires :
          </p>
          <ul>
            <li>Se laver les mains avant et apres chaque prestation</li>
            <li>Utiliser du materiel desinfecte et sterilise</li>
            <li>Porter un masque si necessaire (periode epidemique)</li>
            <li>Respecter les protocoles sanitaires en vigueur au Maroc</li>
          </ul>
        </section>

        <section>
          <h2>9. Assurance et Responsabilite</h2>
          <p>
            En tant que prestataire independant :
          </p>
          <ul>
            <li>Vous etes responsable de vos actes professionnels</li>
            <li>Il est fortement recommande d'avoir une assurance responsabilite civile professionnelle</li>
            <li>GlamGo ne peut etre tenu responsable des dommages causes lors des prestations</li>
            <li>Vous devez declarer tout incident grave dans les 24h</li>
          </ul>
        </section>

        <section>
          <h2>10. Interdictions</h2>
          <p>
            Il est strictement interdit de :
          </p>
          <ul>
            <li>Demander les coordonnees des clients pour travailler hors plateforme</li>
            <li>Proposer des services non declares sur votre profil</li>
            <li>Sous-traiter vos prestations a d'autres personnes</li>
            <li>Tenir des propos discriminatoires ou inappropries</li>
            <li>Solliciter des pourboires de maniere insistante</li>
          </ul>
        </section>

        <section>
          <h2>11. Suspension et Exclusion</h2>
          <p>
            GlamGo se reserve le droit de suspendre ou exclure un prestataire en cas de :
          </p>
          <ul>
            <li>Non-respect repete de la charte</li>
            <li>Comportement inapproprie ou malveillant</li>
            <li>Fraude ou tentative de fraude</li>
            <li>Avis clients recurrents tres negatifs</li>
            <li>Violation des lois marocaines</li>
          </ul>
        </section>

        <section>
          <h2>12. Protection des Donnees</h2>
          <p>
            Vous vous engagez a :
          </p>
          <ul>
            <li>Respecter la confidentialite des informations clients</li>
            <li>Ne pas utiliser les donnees clients a des fins personnelles</li>
            <li>Ne pas partager ou vendre les coordonnees des clients</li>
            <li>Respecter la loi marocaine 09-08 sur la protection des donnees</li>
          </ul>
        </section>

        <section>
          <h2>13. Formation Continue</h2>
          <p>
            Pour maintenir un haut niveau de qualite :
          </p>
          <ul>
            <li>Participer aux formations proposees par GlamGo (si disponibles)</li>
            <li>Se tenir informe des nouvelles techniques et tendances</li>
            <li>Ameliorer continuellement la qualite de vos prestations</li>
          </ul>
        </section>

        <section>
          <h2>14. Communication avec les Clients</h2>
          <p>
            Regles de communication :
          </p>
          <ul>
            <li>Utiliser uniquement le chat GlamGo pour communiquer</li>
            <li>Repondre aux messages dans un delai de 24h maximum</li>
            <li>Rester courtois et professionnel dans tous les echanges</li>
            <li>Ne pas partager d'informations personnelles (telephone, email, etc.)</li>
          </ul>
        </section>

        <section>
          <h2>15. Modifications de la Charte</h2>
          <p>
            GlamGo se reserve le droit de modifier cette charte a tout moment.
            Les prestataires seront notifies des changements importants par email
            et devront accepter les nouvelles conditions pour continuer a utiliser la plateforme.
          </p>
        </section>

        <section>
          <h2>16. Contact et Reclamations</h2>
          <p>
            Pour toute question ou reclamation concernant cette charte :
            <br />
            Email : providers@glamgo.ma
            <br />
            Telephone : +212 5XX-XXXXXX
          </p>
          <p>
            En acceptant cette charte, vous confirmez avoir lu, compris et accepte
            tous les termes et conditions ci-dessus.
          </p>
        </section>
      </div>
    </div>
  );
}
