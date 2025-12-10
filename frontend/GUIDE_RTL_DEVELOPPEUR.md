# Guide Rapide RTL/Arabe pour Développeurs - GlamGo

## Pour ajouter du nouveau contenu traduit

### 1. Dans les composants React

```javascript
// TOUJOURS importer useLanguage
import { useLanguage } from '@/contexts/LanguageContext';

function MonComposant() {
  const { t, language, isRTL } = useLanguage();

  return (
    <div>
      {/* ❌ MAUVAIS - texte hardcodé */}
      <h1>Bienvenue sur GlamGo</h1>

      {/* ✅ BON - utiliser t() */}
      <h1>{t('welcome.title')}</h1>

      {/* ✅ BON - avec interpolation */}
      <p>{t('welcome.greeting', { name: userName })}</p>
    </div>
  );
}
```

### 2. Ajouter une nouvelle clé de traduction

**Fichier:** `src/contexts/LanguageContext.js`

```javascript
// Section FR (ligne ~8)
const translations = {
  fr: {
    // ...
    'maNouvelleCle.titre': 'Mon Titre en Français',
    'maNouvelleCle.description': 'Description en français',
    // ...
  },

  // Section AR (ligne ~1311)
  ar: {
    // ...
    'maNouvelleCle.titre': 'عنواني بالعربية',
    'maNouvelleCle.description': 'الوصف بالعربية',
    // ...
  }
};
```

### 3. Gestion des erreurs

```javascript
// ❌ MAUVAIS
setError("Une erreur s'est produite");

// ✅ BON - utiliser les clés existantes
setError(t('message.genericError'));
setError(t('message.loadingError'));
setError(t('message.networkError'));
setError(t('message.creationError'));

// ✅ BON - avec message spécifique du backend
setError(response.message || t('message.genericError'));
```

### 4. Clés de traduction disponibles

**Messages génériques:**
- `message.success` - "Succès" / "نجاح"
- `message.error` - "Erreur" / "خطأ"
- `message.loading` - "Chargement..." / "جاري التحميل..."
- `message.genericError` - "Une erreur s'est produite" / "حدث خطأ"
- `message.loadingError` - "Erreur lors du chargement" / "خطأ في التحميل"
- `message.networkError` - "Erreur réseau" / "خطأ في الشبكة"

**Formulaires:**
- `form.email`, `form.password`, `form.firstName`, `form.lastName`
- `form.phone`, `form.address`, `form.city`
- `form.submit`, `form.cancel`, `form.save`

**Navigation:**
- `nav.home`, `nav.services`, `nav.login`, `nav.register`

---

## CSS RTL - Bonnes Pratiques

### 1. Utiliser les propriétés CSS logiques

```scss
// ❌ MAUVAIS - propriétés physiques
.card {
  margin-left: 1rem;
  padding-right: 2rem;
  text-align: left;
}

// ✅ BON - propriétés logiques
.card {
  margin-inline-start: 1rem;
  padding-inline-end: 2rem;
  text-align: start;
}
```

### 2. Classes RTL globales (déjà disponibles)

```jsx
{/* Forcer LTR pour numéros de téléphone/emails */}
<div className="ltr-content">
  <a href="tel:+212600000000">+212 6 00 00 00 00</a>
</div>

{/* Forcer RTL si nécessaire */}
<div className="rtl-content">
  النص العربي هنا
</div>
```

### 3. Icônes directionnelles

Les icônes avec flèches/chevrons sont **automatiquement inversées** en RTL via le fichier `rtl.scss`.

```scss
// Déjà géré dans rtl.scss - pas besoin de code supplémentaire
[dir="rtl"] .icon-arrow,
[dir="rtl"] .icon-chevron {
  transform: scaleX(-1);
}
```

### 4. Flexbox RTL

```scss
// Le fichier rtl.scss gère automatiquement
[dir="rtl"] .flex-row {
  flex-direction: row-reverse;
}
```

---

## Tester en mode RTL

### 1. Dans le navigateur

1. Ouvrir l'application
2. Cliquer sur le sélecteur de langue dans le Header
3. Choisir "العربية" (Arabe)
4. Vérifier que:
   - Texte aligné à droite
   - Navigation inversée
   - Icônes directionnelles inversées
   - Pas de débordement

### 2. Forcer RTL en dev (DevTools)

```javascript
// Console browser
document.documentElement.dir = 'rtl';
document.documentElement.lang = 'ar';
document.body.classList.add('rtl');
```

### 3. Tester le switch de langue

```javascript
// Le changement doit être instantané sans rechargement
localStorage.getItem('glamgo_language') // 'fr' ou 'ar'
```

---

## Checklist pour Nouvelle Page

Lors de la création d'une nouvelle page:

- [ ] Importer `useLanguage` hook
- [ ] Utiliser `t('key')` pour TOUT le texte
- [ ] Ajouter les clés FR et AR dans LanguageContext
- [ ] Tester en mode FR et AR
- [ ] Vérifier responsive (mobile/tablet/desktop)
- [ ] Vérifier que les icônes directionnelles s'inversent
- [ ] Vérifier que les formulaires sont alignés correctement
- [ ] Pas de texte hardcodé (ni en FR ni en AR)

---

## Glossaire de Traduction GlamGo

**Ne jamais traduire (noms de marque):**
- GlamGo
- Google Maps
- Stripe
- PayPal

**Termes métier standardisés:**
| Français | Arabe | Contexte |
|----------|-------|----------|
| Services à domicile | خدمات منزلية | Titre principal |
| Réservation | حجز | Action de réserver |
| Prestataire | مقدم الخدمة | Fournisseur de service |
| Client | زبون / عميل | Utilisateur |
| Nettoyage | تنظيف | Catégorie de service |
| Beauté | تجميل | Catégorie de service |
| Disponibilité | التوفر | Horaires disponibles |
| Tarif / Prix | السعر / التعريفة | Pricing |
| Avis | تقييم | Review |
| Commande | طلب | Order |

**Villes marocaines:**
| Français | Arabe |
|----------|-------|
| Marrakech | مراكش |
| Casablanca | الدار البيضاء |
| Rabat | الرباط |
| Fès | فاس |
| Tanger | طنجة |
| Agadir | أكادير |

---

## Dépannage Rapide

### Le texte ne change pas quand je switch de langue

**Causes possibles:**
1. Clé de traduction manquante → Ajouter dans les deux sections (fr + ar)
2. Pas de `useLanguage()` → Importer et utiliser le hook
3. Cache browser → Vider cache et recharger

### Le layout est cassé en mode RTL

**Solutions:**
1. Vérifier que `rtl.scss` est bien importé dans `globals.scss`
2. Utiliser propriétés logiques au lieu de left/right
3. Ajouter des règles spécifiques dans `rtl.scss`

### Les icônes ne s'inversent pas

**Solutions:**
1. Ajouter classes `icon-arrow` ou `icon-chevron`
2. Ou ajouter règle custom dans `rtl.scss`:
```scss
[dir="rtl"] .mon-icone {
  transform: scaleX(-1);
}
```

### Débordement de texte arabe

**Solutions:**
1. Utiliser `overflow-wrap: break-word`
2. Augmenter `line-height` pour texte arabe
3. Vérifier la largeur des conteneurs

---

## Ressources Utiles

- **Fichier CSS RTL:** `src/styles/rtl.scss`
- **Contexte de langue:** `src/contexts/LanguageContext.js`
- **Rapport complet:** `CONVERSION_RTL_ARABE_RAPPORT.md`
- **Police arabe:** Google Fonts - Noto Sans Arabic

---

## Contact Support i18n

Pour toute question sur l'internationalisation:
- Consulter `CONVERSION_RTL_ARABE_RAPPORT.md`
- Vérifier les exemples dans les pages existantes (login, register, home)
- Référence: [Material Design RTL](https://material.io/design/usability/bidirectionality.html)

---

**Dernière mise à jour:** 10 décembre 2025
