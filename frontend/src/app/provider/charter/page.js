'use client';
import Link from 'next/link';
import './charter.scss';
import { useLanguage } from '@/contexts/LanguageContext';

export default function ProviderCharterPage() {
  const { t, isRTL } = useLanguage();

  return (
    <div className="charter-page" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="charter-container">
        <Link href="/provider/register" className="back-link">← {t('providerCharter.back')}</Link>

        <h1>{t('providerCharter.title')}</h1>
        <p className="last-update">{t('providerCharter.lastUpdate')}</p>

        <section>
          <h2>{t('providerCharter.section1.title')}</h2>
          <p>{t('providerCharter.section1.intro')}</p>
          <ul>
            <li>{t('providerCharter.section1.item1')}</li>
            <li>{t('providerCharter.section1.item2')}</li>
            <li>{t('providerCharter.section1.item3')}</li>
            <li>{t('providerCharter.section1.item4')}</li>
          </ul>
        </section>

        <section>
          <h2>{t('providerCharter.section2.title')}</h2>
          <p>{t('providerCharter.section2.intro')}</p>
          <ul>
            <li>{t('providerCharter.section2.item1')}</li>
            <li>{t('providerCharter.section2.item2')}</li>
            <li>{t('providerCharter.section2.item3')}</li>
            <li>{t('providerCharter.section2.item4')}</li>
          </ul>
        </section>

        <section>
          <h2>{t('providerCharter.section3.title')}</h2>
          <p>{t('providerCharter.section3.intro')}</p>
          <ul>
            <li>{t('providerCharter.section3.item1')}</li>
            <li>{t('providerCharter.section3.item2')}</li>
            <li>{t('providerCharter.section3.item3')}</li>
            <li>{t('providerCharter.section3.item4')}</li>
          </ul>
        </section>

        <section>
          <h2>{t('providerCharter.section4.title')}</h2>
          <p>{t('providerCharter.section4.intro')}</p>
          <ul>
            <li>{t('providerCharter.section4.item1')}</li>
            <li>{t('providerCharter.section4.item2')}</li>
            <li>{t('providerCharter.section4.item3')}</li>
            <li>{t('providerCharter.section4.item4')}</li>
          </ul>
        </section>

        <section>
          <h2>{t('providerCharter.section5.title')}</h2>
          <p>{t('providerCharter.section5.intro')}</p>
          <ul>
            <li>{t('providerCharter.section5.item1')}</li>
            <li>{t('providerCharter.section5.item2')}</li>
            <li>{t('providerCharter.section5.item3')}</li>
            <li>{t('providerCharter.section5.item4')}</li>
          </ul>
        </section>

        <section>
          <h2>{t('providerCharter.section6.title')}</h2>
          <p>{t('providerCharter.section6.intro')}</p>
          <ul>
            <li>{t('providerCharter.section6.item1')}</li>
            <li>{t('providerCharter.section6.item2')}</li>
            <li>{t('providerCharter.section6.item3')}</li>
            <li>{t('providerCharter.section6.item4')}</li>
          </ul>
        </section>

        <section>
          <h2>{t('providerCharter.section7.title')}</h2>
          <p>{t('providerCharter.section7.intro')}</p>
          <ul>
            <li>{t('providerCharter.section7.item1')}</li>
            <li>{t('providerCharter.section7.item2')}</li>
            <li>{t('providerCharter.section7.item3')}</li>
            <li>{t('providerCharter.section7.item4')}</li>
          </ul>
        </section>

        <section>
          <h2>{t('providerCharter.section8.title')}</h2>
          <p>{t('providerCharter.section8.intro')}</p>
          <ul>
            <li>{t('providerCharter.section8.item1')}</li>
            <li>{t('providerCharter.section8.item2')}</li>
            <li>{t('providerCharter.section8.item3')}</li>
            <li>{t('providerCharter.section8.item4')}</li>
          </ul>
        </section>

        <section>
          <h2>{t('providerCharter.section9.title')}</h2>
          <p>{t('providerCharter.section9.intro')}</p>
          <ul>
            <li>{t('providerCharter.section9.item1')}</li>
            <li>{t('providerCharter.section9.item2')}</li>
            <li>{t('providerCharter.section9.item3')}</li>
            <li>{t('providerCharter.section9.item4')}</li>
          </ul>
        </section>

        <section>
          <h2>{t('providerCharter.section10.title')}</h2>
          <p>{t('providerCharter.section10.intro')}</p>
          <ul>
            <li>{t('providerCharter.section10.item1')}</li>
            <li>{t('providerCharter.section10.item2')}</li>
            <li>{t('providerCharter.section10.item3')}</li>
            <li>{t('providerCharter.section10.item4')}</li>
            <li>{t('providerCharter.section10.item5')}</li>
          </ul>
        </section>

        <section>
          <h2>{t('providerCharter.section11.title')}</h2>
          <p>{t('providerCharter.section11.intro')}</p>
          <ul>
            <li>{t('providerCharter.section11.item1')}</li>
            <li>{t('providerCharter.section11.item2')}</li>
            <li>{t('providerCharter.section11.item3')}</li>
            <li>{t('providerCharter.section11.item4')}</li>
            <li>{t('providerCharter.section11.item5')}</li>
          </ul>
        </section>

        <section>
          <h2>{t('providerCharter.section12.title')}</h2>
          <p>{t('providerCharter.section12.intro')}</p>
          <ul>
            <li>{t('providerCharter.section12.item1')}</li>
            <li>{t('providerCharter.section12.item2')}</li>
            <li>{t('providerCharter.section12.item3')}</li>
            <li>{t('providerCharter.section12.item4')}</li>
          </ul>
        </section>

        <section>
          <h2>{t('providerCharter.section13.title')}</h2>
          <p>{t('providerCharter.section13.intro')}</p>
          <ul>
            <li>{t('providerCharter.section13.item1')}</li>
            <li>{t('providerCharter.section13.item2')}</li>
            <li>{t('providerCharter.section13.item3')}</li>
          </ul>
        </section>

        <section>
          <h2>{t('providerCharter.section14.title')}</h2>
          <p>{t('providerCharter.section14.intro')}</p>
          <ul>
            <li>{t('providerCharter.section14.item1')}</li>
            <li>{t('providerCharter.section14.item2')}</li>
            <li>{t('providerCharter.section14.item3')}</li>
            <li>{t('providerCharter.section14.item4')}</li>
          </ul>
        </section>

        <section>
          <h2>{t('providerCharter.section15.title')}</h2>
          <p>{t('providerCharter.section15.content')}</p>
        </section>

        <section>
          <h2>{t('providerCharter.section16.title')}</h2>
          <p>
            {t('providerCharter.section16.question')}
            <br />
            {t('providerCharter.section16.email')}
            <br />
            {t('providerCharter.section16.phone')}
          </p>
          <p>{t('providerCharter.section16.acceptance')}</p>
        </section>
      </div>
    </div>
  );
}
