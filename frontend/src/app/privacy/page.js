'use client';
import Link from 'next/link';
import './privacy.scss';

export default function PrivacyPage() {
  return (
    <div className="privacy-page">
      <div className="privacy-container">
        <Link href="/" className="back-link">← Retour</Link>

        <h1>Politique de Confidentialite</h1>
        <p className="last-update">Derniere mise a jour : Novembre 2024</p>

        <section>
          <h2>1. Collecte des Donnees</h2>
          <p>
            Nous collectons les donnees personnelles que vous nous fournissez lors de :
          </p>
          <ul>
            <li>La creation de votre compte (nom, email, telephone)</li>
            <li>La reservation de services (adresse, preferences)</li>
            <li>L'utilisation de la plateforme (historique, avis)</li>
          </ul>
        </section>

        <section>
          <h2>2. Utilisation des Donnees</h2>
          <p>
            Vos donnees sont utilisees pour :
          </p>
          <ul>
            <li>Fournir et ameliorer nos services</li>
            <li>Traiter vos reservations et paiements</li>
            <li>Vous contacter concernant vos rendez-vous</li>
            <li>Personnaliser votre experience</li>
            <li>Assurer la securite de la plateforme</li>
          </ul>
        </section>

        <section>
          <h2>3. Partage des Donnees</h2>
          <p>
            Nous partageons vos donnees uniquement avec :
          </p>
          <ul>
            <li>Les prestataires pour executer les services reserves</li>
            <li>Nos partenaires de paiement securise</li>
            <li>Les autorites en cas d'obligation legale</li>
          </ul>
          <p>
            Nous ne vendons jamais vos donnees personnelles a des tiers.
          </p>
        </section>

        <section>
          <h2>4. Securite</h2>
          <p>
            Nous mettons en oeuvre des mesures de securite techniques et organisationnelles
            pour proteger vos donnees contre tout acces non autorise, modification ou
            destruction.
          </p>
        </section>

        <section>
          <h2>5. Vos Droits</h2>
          <p>
            Conformement a la loi marocaine 09-08 relative a la protection des personnes
            physiques a l'egard du traitement des donnees a caractere personnel, vous disposez des droits suivants :
          </p>
          <ul>
            <li>Droit d'acces a vos donnees</li>
            <li>Droit de rectification</li>
            <li>Droit de suppression</li>
            <li>Droit d'opposition au traitement</li>
          </ul>
        </section>

        <section>
          <h2>6. Cookies</h2>
          <p>
            Nous utilisons des cookies pour ameliorer votre experience sur la plateforme.
            Vous pouvez gerer vos preferences de cookies dans les parametres de votre navigateur.
          </p>
        </section>

        <section>
          <h2>7. Conservation des Donnees</h2>
          <p>
            Vos donnees sont conservees pendant la duree de votre compte et jusqu'a
            3 ans apres sa suppression pour des raisons legales et comptables.
          </p>
        </section>

        <section>
          <h2>8. Contact</h2>
          <p>
            Pour toute question concernant vos donnees personnelles :
            <br />
            Email : privacy@glamgo.ma
          </p>
        </section>
      </div>
    </div>
  );
}
