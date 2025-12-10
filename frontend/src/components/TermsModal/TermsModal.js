'use client';

import { useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import styles from './TermsModal.module.scss';

export default function TermsModal({ isOpen, onClose, userType = 'client' }) {
  const { language, t } = useLanguage();
  const isRTL = language === 'ar';

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

  const currentDate = new Date().toLocaleDateString(language === 'ar' ? 'ar-MA' : 'fr-FR');

  const clientTermsFr = `
CONDITIONS GÉNÉRALES D'UTILISATION - GLAMGO MARRAKECH
Plateforme de Services à Domicile - Espace Client

Dernière mise à jour : ${currentDate}

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

  const clientTermsAr = `
شروط الاستخدام العامة - غلام غو مراكش
منصة الخدمات المنزلية - فضاء العميل

آخر تحديث: ${currentDate}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 التسجيل والوصول
• إنشاء حساب إلزامي بمعلومات دقيقة: الاسم الأول، الاسم العائلي، البريد الإلكتروني، الهاتف، واتساب.
• تاريخ الميلاد إلزامي - يجب أن يكون عمرك 18 سنة على الأقل.
• العنوان الكامل مع المدينة إلزامي لتحديد موقع الخدمات.
• يجب تحديث المعلومات باستمرار.

👤 الهوية والاستخدام الشخصي
• العميل المسجل هو المستفيد المباشر من الخدمة.
• يمنع الحجز لشخص آخر دون الإشارة إلى ذلك بوضوح.
• تعليق فوري في حالة الاستخدام الاحتيالي.

✅ الالتزامات
• احترام المواعيد، آراء صادقة، سلوك محترم.

📅 سياسة الإلغاء والاسترداد
• إلغاء مجاني حتى 4 ساعات قبل الموعد.
• أقل من 4 ساعات ← رسوم محتملة.
• الغياب بدون إلغاء ← الخدمة مستحقة بالكامل.
• إلغاء من مقدم الخدمة ← استرداد كامل.
• حالة القوة القاهرة ← شروط مكيفة.
• الاسترداد خلال 7 إلى 14 يوم عمل.

🛡️ الحماية والأمان
• الحق في رفض الخدمة في حالة الخطر أو السلوك غير اللائق.
• إبلاغ سريع عبر التطبيق.
• تعليق فوري لمقدمي الخدمات في حالة السلوك العنيف أو غير المحترم.
• سرية معززة للبيانات الشخصية.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📜 أحكام مشتركة (مقدمي الخدمات والعملاء)

• الأصالة إلزامية: كل حساب يجب استخدامه فقط من قبل الشخص المسجل.

• المسؤولية: غلام غو مراكش وسيط وليس مسؤولاً عن جودة الخدمات أو النزاعات أو الأضرار.

• البيانات الشخصية: يتم جمعها ومعالجتها وفقاً للقانون المغربي 09-08، ولا تُباع أبداً لأطراف ثالثة.

• تعديل الشروط: يمكن لـ غلام غو تعديل الشروط في أي وقت، الإشعار عبر التطبيق أو البريد الإلكتروني.

• عدم التسامح: تعليق فوري في حالة السلوك العنيف أو التمييزي أو المهدد.

• نظام الإبلاغ: أداة مدمجة للإبلاغ عن الخطر أو الإساءة.

• التواصل: عبر واتساب أو الهاتف، يمكن لـ غلام غو الاتصال للخدمة أو الدعم.

• الإنهاء: حذف الحساب ممكن في أي وقت؛ تعليق في حالة المخالفة.

• القانون المطبق: القانون المغربي، محاكم مراكش المختصة.

• منطقة التغطية: الالتزام بخدمة المناطق المحددة، رسوم التنقل قابلة للتفاوض.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🌟 ملاحظة ختامية

في غلام غو مراكش، العملاء ومقدمو الخدمات يتقدمون معاً نحو هدف مشترك: بناء مجتمع قائم على الثقة والجودة والاحترام. كل خدمة هي لقاء، كل رأي هو مساهمة، وكل جهد هو حجر يُضاف إلى صرح التميز.

✨ « معارك الحياة لا يربحها الأقوياء ولا الأسرع، بل أولئك الذين لا يستسلمون أبداً. » – الملك الحسن الثاني

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

بتحديد المربع، تؤكد أنك قرأت وفهمت ووافقت على جميع شروط الاستخدام العامة.
  `.trim();

  const providerTermsFr = `
CONDITIONS GÉNÉRALES DE PRESTATION - GLAMGO MARRAKECH
Espace Prestataire

Dernière mise à jour : ${currentDate}

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

  const providerTermsAr = `
شروط تقديم الخدمات العامة - غلام غو مراكش
فضاء مقدم الخدمة

آخر تحديث: ${currentDate}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 التسجيل والوصول
• معلومات شخصية دقيقة إلزامية: الاسم الأول، الاسم العائلي، البريد الإلكتروني، الهاتف، واتساب.
• تاريخ الميلاد إلزامي - يجب أن يكون عمرك 18 سنة على الأقل.
• رقم بطاقة التعريف الوطنية إلزامي للتحقق من الهوية.
• تعليق محتمل في حالة عدم الاحترام أو المعلومات الاحتيالية.

🎯 الملف المهني
• وصف مفصل لخدماتك إلزامي (50 حرفاً على الأقل).
• سنوات الخبرة إلزامية.
• التزام أخلاقي بالعمل بجدية وصدق واحترام.
• اختيار تخصص واحد على الأقل من: تصفيف الشعر، التجميل، التدليك، المكياج، العناية بالأظافر، إزالة الشعر، الحناء، تجهيز العروس، الحلاقة، العناية بالوجه، التدريب الرياضي، التنظيف، الطباخ المنزلي، الإصلاحات، البستنة.

📄 الوثائق المطلوبة
• إثبات الخبرة إلزامي: شهادة عمل، عقود، ملف أعمال، إلخ.
• شهادة أو دبلوم إلزامي للتخصصات: تصفيف الشعر، التجميل، التدليك، المكياج، العناية بالوجه، التدريب الرياضي.
• شهادة تأمين مهني موصى بها بشدة لحمايتك وحماية عملائك.
• الوثائق المقبولة: PDF، JPG، PNG (5 ميجابايت كحد أقصى لكل ملف).

💰 التسعير
• يتم التفاوض على الأسعار مباشرة مع كل عميل حسب الخدمة المطلوبة.
• شفافية تامة مطلوبة في الأسعار والتكاليف الإضافية المحتملة.
• أنت حر في تحديد أسعارك الخاصة.

📍 منطقة الخدمة
• العنوان المهني الرئيسي إلزامي مع إحداثيات GPS.
• المدينة الرئيسية للخدمة إلزامية.
• مناطق التغطية: اختيار مدينة واحدة على الأقل تقبل التدخل فيها.
• رسوم التنقل قابلة للتفاوض مع العميل حسب المسافة.

👤 الهوية والتنفيذ الشخصي
• مقدم الخدمة المسجل هو الوحيد المصرح له بتنفيذ الخدمة.
• يمنع التفويض لصديق أو قريب أو طرف ثالث غير مسجل.
• تعليق فوري في حالة الاستبدال غير المعلن.

✅ الالتزامات
• الالتزام بالمواعيد، الجودة، الاحترام، السرية، الامتثال القانوني.
• احترام المواعيد المتفق عليها مع العميل.
• يمنع الاحتيال أو التلاعب بالتقييمات.
• سلوك مهني ومحترم في جميع الظروف.

🏆 الفوائد والمزايا
• رؤية متزايدة على منصة غلام غو.
• تخفيض العمولة لمقدمي الخدمات المتميزين.
• شارات التقدير والتقييمات المرئية.
• أولوية الوصول إلى الطلبات والترويج التسويقي.

📅 سياسة الإلغاء
• الإلغاء من مقدم الخدمة ← استرداد كامل للعميل.
• الإلغاءات المتكررة ← تأثير سلبي على ملفك وإمكانية التعليق.
• حالة القوة القاهرة ← شروط مكيفة حسب الحالة.

🛡️ الحماية والأمان
• الحق في رفض الخدمة إذا كانت الظروف خطيرة أو السلوك غير لائق.
• تعويض التنقل في حالة الرفض المبرر بعد التنقل.
• موقع آمن مرئي للعميل (الحي/المدينة).
• نظام إبلاغ سريع عبر التطبيق في حالة المشاكل.
• تعليق فوري للعملاء في حالة السلوك العنيف أو غير المحترم أو التمييزي.
• حماية بياناتك الشخصية وفقاً للقانون المغربي 09-08.

🔒 التأمين والمسؤولية
• أنت مسؤول عن الأضرار الناجمة أثناء خدماتك.
• التأمين المهني موصى به بشدة.
• غلام غو مراكش تخلي مسؤوليتها عن الأضرار الناجمة عن مقدم الخدمة.
• غلام غو تعمل كوسيط وليست مسؤولة عن جودة الخدمات المقدمة.

📝 الملكية الفكرية واستخدام العلامة التجارية
• ترخيص الاستخدام ممنوح لـ غلام غو للترويج لملفك.
• استخدام علامة غلام غو مقتصر على المنصة ونشاطك المهني.
• يمنع استخدام شعار غلام غو لأغراض شخصية أو تجارية خارجية.

📱 التواصل
• التواصل مع العملاء عبر واتساب أو الهاتف.
• يمكن لـ غلام غو الاتصال بك للدعم أو المساعدة أو تحسين الخدمة.
• إشعارات مهمة عبر البريد الإلكتروني والتطبيق.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📜 أحكام مشتركة (مقدمي الخدمات والعملاء)

• الأصالة إلزامية: كل حساب يجب استخدامه فقط من قبل الشخص المسجل.

• المسؤولية: غلام غو مراكش وسيط وليس مسؤولاً عن جودة الخدمات أو النزاعات أو الأضرار.

• البيانات الشخصية: يتم جمعها ومعالجتها وفقاً للقانون المغربي 09-08، ولا تُباع أبداً لأطراف ثالثة.

• تعديل الشروط: يمكن لـ غلام غو تعديل الشروط في أي وقت، الإشعار عبر التطبيق أو البريد الإلكتروني.

• عدم التسامح: تعليق فوري في حالة السلوك العنيف أو التمييزي أو المهدد.

• نظام الإبلاغ: أداة مدمجة للإبلاغ عن الخطر أو الإساءة.

• الإنهاء: حذف الحساب ممكن في أي وقت؛ تعليق في حالة المخالفة.

• القانون المطبق: القانون المغربي، محاكم مراكش المختصة.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🌟 ملاحظة ختامية

في غلام غو مراكش، العملاء ومقدمو الخدمات يتقدمون معاً نحو هدف مشترك: بناء مجتمع قائم على الثقة والجودة والاحترام. كل خدمة هي لقاء، كل رأي هو مساهمة، وكل جهد هو حجر يُضاف إلى صرح التميز.

✨ « معارك الحياة لا يربحها الأقوياء ولا الأسرع، بل أولئك الذين لا يستسلمون أبداً. » – الملك الحسن الثاني

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

بتحديد المربع، تؤكد أنك قرأت وفهمت ووافقت على جميع شروط تقديم الخدمات العامة.
  `.trim();

  // Sélectionner le bon contenu selon la langue et le type d'utilisateur
  const getTermsContent = () => {
    if (userType === 'client') {
      return language === 'ar' ? clientTermsAr : clientTermsFr;
    } else {
      return language === 'ar' ? providerTermsAr : providerTermsFr;
    }
  };

  const getTitle = () => {
    if (userType === 'client') {
      return language === 'ar'
        ? 'شروط الاستخدام العامة'
        : 'Conditions Générales d\'Utilisation';
    } else {
      return language === 'ar'
        ? 'شروط تقديم الخدمات العامة'
        : 'Conditions Générales de Prestation';
    }
  };

  const getButtonText = () => {
    return language === 'ar' ? 'قرأت وفهمت' : 'J\'ai lu et compris';
  };

  const getCloseLabel = () => {
    return language === 'ar' ? 'إغلاق' : 'Fermer';
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div
        className={styles.modalContent}
        onClick={(e) => e.stopPropagation()}
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>
            {getTitle()}
          </h2>
          <button
            className={styles.closeButton}
            onClick={onClose}
            aria-label={getCloseLabel()}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <div className={styles.modalBody}>
          <pre className={styles.termsText} style={{ textAlign: isRTL ? 'right' : 'left' }}>
            {getTermsContent()}
          </pre>
        </div>
        <div className={styles.modalFooter}>
          <button className={styles.acceptButton} onClick={onClose}>
            {getButtonText()}
          </button>
        </div>
      </div>
    </div>
  );
}
