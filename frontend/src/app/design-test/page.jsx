'use client';

import React, { useState } from 'react';
import {
  Button,
  Card,
  CardImage,
  CardContent,
  CardTitle,
  CardDescription,
  CardFooter,
  Input,
  Textarea,
  Select,
  Badge,
  BadgeGroup,
  StatusBadge,
  NotificationBadge,
  BottomNav,
  BottomNavSpacer,
} from '@/components/ui';
import { Star, MapPin, Heart, Search, Send } from 'lucide-react';
import styles from './page.module.scss';

/**
 * Design Test Page
 * Page de test visuel pour tous les composants UI
 * Accessible à /design-test
 */

export default function DesignTestPage() {
  const [inputValue, setInputValue] = useState('');
  const [textareaValue, setTextareaValue] = useState('');
  const [selectValue, setSelectValue] = useState('');
  const [hasError, setHasError] = useState(false);

  // Mock data for cards
  const mockServices = [
    {
      id: 1,
      name: 'Massage Relaxant',
      description: 'Massage complet du corps pour une relaxation totale et un bien-être absolu.',
      price: 250,
      image: '/images/services/massage-relaxant.jpg',
      rating: 4.8,
      category: 'Bien-être',
    },
    {
      id: 2,
      name: 'Coiffure Mariage',
      description: 'Coiffure professionnelle pour votre grand jour avec essai préalable inclus.',
      price: 450,
      image: '/images/services/coiffure-mariage.jpg',
      rating: 4.9,
      category: 'Beauté',
    },
    {
      id: 3,
      name: 'Chef à Domicile',
      description: 'Chef professionnel qui prépare un repas gastronomique chez vous.',
      price: 800,
      image: '/images/services/chef-domicile.jpg',
      rating: 4.7,
      category: 'Restauration',
    },
  ];

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Design System GlamGo</h1>
        <p>Test visuel de tous les composants UI</p>
      </header>

      {/* BUTTONS SECTION */}
      <section className={styles.section}>
        <h2>Buttons</h2>

        <div className={styles.subsection}>
          <h3>Variants</h3>
          <div className={styles.row}>
            <Button variant="primary">Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="danger">Danger</Button>
          </div>
        </div>

        <div className={styles.subsection}>
          <h3>Sizes</h3>
          <div className={styles.row}>
            <Button size="sm">Small</Button>
            <Button size="md">Medium</Button>
            <Button size="lg">Large</Button>
          </div>
        </div>

        <div className={styles.subsection}>
          <h3>With Icons</h3>
          <div className={styles.row}>
            <Button icon={<Heart />}>Favori</Button>
            <Button variant="secondary" icon={<MapPin />}>
              Localiser
            </Button>
            <Button variant="outline" icon={<Search />}>
              Rechercher
            </Button>
          </div>
        </div>

        <div className={styles.subsection}>
          <h3>States</h3>
          <div className={styles.row}>
            <Button loading>Loading...</Button>
            <Button disabled>Disabled</Button>
            <Button fullWidth>Full Width</Button>
          </div>
        </div>
      </section>

      {/* CARDS SECTION */}
      <section className={styles.section}>
        <h2>Cards</h2>

        <div className={styles.grid}>
          {mockServices.map((service) => (
            <Card key={service.id} hoverable>
              <CardImage
                src={service.image}
                alt={service.name}
                badge={<Badge variant="accent">{service.category}</Badge>}
              />
              <CardContent>
                <CardTitle>{service.name}</CardTitle>
                <CardDescription>{service.description}</CardDescription>
                <div className={styles.cardMeta}>
                  <div className={styles.rating}>
                    <Star size={16} fill="currentColor" />
                    <span>{service.rating}</span>
                  </div>
                  <span className={styles.price}>{service.price} MAD</span>
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" size="sm" fullWidth>
                  Voir détails
                </Button>
                <Button variant="primary" size="sm" icon={<Heart />} />
              </CardFooter>
            </Card>
          ))}
        </div>
      </section>

      {/* INPUTS SECTION */}
      <section className={styles.section}>
        <h2>Inputs</h2>

        <div className={styles.form}>
          <Input
            label="Nom complet"
            placeholder="Entrez votre nom"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            required
          />

          <Input
            label="Email"
            type="email"
            placeholder="exemple@email.com"
            helperText="Nous ne partagerons jamais votre email"
            leftIcon={<Send size={20} />}
          />

          <Input
            label="Recherche"
            type="search"
            placeholder="Rechercher un service..."
            leftIcon={<Search size={20} />}
            rightIcon={<span>🔍</span>}
          />

          <Input
            label="Avec erreur"
            error="Ce champ est requis"
            value=""
          />

          <Textarea
            label="Description"
            placeholder="Décrivez votre besoin en détail..."
            value={textareaValue}
            onChange={(e) => setTextareaValue(e.target.value)}
            helperText="Minimum 50 caractères"
            rows={5}
          />

          <Select
            label="Catégorie de service"
            value={selectValue}
            onChange={(e) => setSelectValue(e.target.value)}
            placeholder="Sélectionnez une catégorie"
            required
          >
            <option value="beaute">Beauté</option>
            <option value="bien-etre">Bien-être</option>
            <option value="maison">Maison</option>
            <option value="evenements">Événements</option>
          </Select>

          <div className={styles.row}>
            <Button
              variant="primary"
              icon={<Send />}
              onClick={() => setHasError(!hasError)}
            >
              Soumettre
            </Button>
            <Button variant="outline">Annuler</Button>
          </div>
        </div>
      </section>

      {/* BADGES SECTION */}
      <section className={styles.section}>
        <h2>Badges</h2>

        <div className={styles.subsection}>
          <h3>Variants</h3>
          <BadgeGroup>
            <Badge variant="default">Default</Badge>
            <Badge variant="primary">Primary</Badge>
            <Badge variant="secondary">Secondary</Badge>
            <Badge variant="accent">Accent</Badge>
            <Badge variant="success">Success</Badge>
            <Badge variant="warning">Warning</Badge>
            <Badge variant="error">Error</Badge>
          </BadgeGroup>
        </div>

        <div className={styles.subsection}>
          <h3>Sizes</h3>
          <BadgeGroup>
            <Badge size="sm">Small</Badge>
            <Badge size="md">Medium</Badge>
            <Badge size="lg">Large</Badge>
          </BadgeGroup>
        </div>

        <div className={styles.subsection}>
          <h3>With Dot</h3>
          <BadgeGroup>
            <Badge variant="success" dot>
              Disponible
            </Badge>
            <Badge variant="warning" dot>
              En attente
            </Badge>
            <Badge variant="error" dot>
              Indisponible
            </Badge>
          </BadgeGroup>
        </div>

        <div className={styles.subsection}>
          <h3>With Icon</h3>
          <BadgeGroup>
            <Badge variant="primary" icon={<Star size={14} />}>
              Top Prestataire
            </Badge>
            <Badge variant="secondary" icon={<MapPin size={14} />}>
              Casablanca
            </Badge>
          </BadgeGroup>
        </div>

        <div className={styles.subsection}>
          <h3>Status Badges</h3>
          <BadgeGroup>
            <StatusBadge status="pending" />
            <StatusBadge status="confirmed" />
            <StatusBadge status="in_progress" />
            <StatusBadge status="completed" />
            <StatusBadge status="cancelled" />
          </BadgeGroup>
        </div>

        <div className={styles.subsection}>
          <h3>Notification Badges</h3>
          <div className={styles.row}>
            <div style={{ position: 'relative', display: 'inline-block' }}>
              <Button variant="outline" icon={<Heart />}>Messages</Button>
              <NotificationBadge count={3} style={{ position: 'absolute', top: -8, right: -8 }} />
            </div>
            <div style={{ position: 'relative', display: 'inline-block' }}>
              <Button variant="outline" icon={<Star />}>Notifications</Button>
              <NotificationBadge count={99} style={{ position: 'absolute', top: -8, right: -8 }} />
            </div>
            <div style={{ position: 'relative', display: 'inline-block' }}>
              <Button variant="outline" icon={<MapPin />}>Nouveau</Button>
              <NotificationBadge count={150} max={99} style={{ position: 'absolute', top: -8, right: -8 }} />
            </div>
          </div>
        </div>
      </section>

      {/* BOTTOM NAV SECTION */}
      <section className={styles.section}>
        <h2>Bottom Navigation</h2>
        <p className={styles.note}>
          La navigation est visible uniquement sur mobile (masquée sur desktop).
          Réduisez la fenêtre pour la voir ou consultez la barre en bas de page.
        </p>
        <div className={styles.mobilePreview}>
          <div className={styles.phoneFrame}>
            <div className={styles.phoneContent}>
              <p>Contenu de l'application</p>
              <p>Scroll vers le bas pour voir la navigation</p>
            </div>
            <BottomNav
              notifications={{
                orders: 2,
                messages: 5,
              }}
              language="fr"
            />
          </div>
        </div>
      </section>

      {/* Spacer pour le bottom nav réel */}
      <BottomNavSpacer />

      {/* Bottom Nav réel (visible sur mobile) */}
      <BottomNav
        notifications={{
          orders: 3,
          messages: 12,
        }}
        language="fr"
      />
    </div>
  );
}
