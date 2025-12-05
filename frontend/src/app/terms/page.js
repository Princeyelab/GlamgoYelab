'use client';
import Link from 'next/link';
import './terms.scss';

export default function TermsPage() {
  return (
    <div className="terms-page">
      <div className="terms-container">
        <Link href="/" className="back-link">← Retour</Link>

        <h1>Conditions Generales d'Utilisation</h1>
        <p className="last-update">Derniere mise a jour : Novembre 2024</p>

        <section>
          <h2>1. Objet</h2>
          <p>
            Les presentes Conditions Generales d'Utilisation (CGU) regissent l'utilisation
            de la plateforme GlamGo, service de mise en relation entre clients et prestataires
            de services a domicile au Maroc.
          </p>
        </section>

        <section>
          <h2>2. Inscription et Compte</h2>
          <p>
            Pour utiliser nos services, vous devez creer un compte en fournissant des
            informations exactes et a jour. Vous etes responsable de la confidentialite
            de vos identifiants de connexion.
          </p>
          <ul>
            <li>Vous devez avoir au moins 18 ans pour vous inscrire</li>
            <li>Un seul compte par personne est autorise</li>
            <li>Les informations fournies doivent etre veridiques</li>
          </ul>
        </section>

        <section>
          <h2>3. Services Proposes</h2>
          <p>
            GlamGo propose une plateforme de mise en relation pour des services de beaute
            et bien-etre a domicile, incluant notamment :
          </p>
          <ul>
            <li>Coiffure</li>
            <li>Soins esthetiques</li>
            <li>Manucure et pedicure</li>
            <li>Massage et bien-etre</li>
            <li>Maquillage</li>
          </ul>
        </section>

        <section>
          <h2>4. Tarification et Paiement</h2>
          <p>
            Les prix des services sont affiches sur la plateforme. Le paiement peut etre
            effectue par carte bancaire ou en especes selon les options disponibles.
          </p>
        </section>

        <section>
          <h2>5. Annulation et Remboursement</h2>
          <p>
            Les conditions d'annulation varient selon le type de reservation :
          </p>
          <ul>
            <li>Annulation gratuite jusqu'a 24h avant le rendez-vous</li>
            <li>Frais d'annulation de 50% entre 24h et 2h avant</li>
            <li>Aucun remboursement pour annulation moins de 2h avant</li>
          </ul>
        </section>

        <section>
          <h2>6. Responsabilites</h2>
          <p>
            GlamGo agit en tant qu'intermediaire et n'est pas responsable de la qualite
            des prestations effectuees par les prestataires independants.
          </p>
        </section>

        <section>
          <h2>7. Protection des Donnees</h2>
          <p>
            Vos donnees personnelles sont traitees conformement a notre Politique de
            Confidentialite et aux lois marocaines en vigueur sur la protection des donnees.
          </p>
        </section>

        <section>
          <h2>8. Contact</h2>
          <p>
            Pour toute question concernant ces CGU, vous pouvez nous contacter a :
            <br />
            Email : contact@glamgo.ma
          </p>
        </section>
      </div>
    </div>
  );
}
