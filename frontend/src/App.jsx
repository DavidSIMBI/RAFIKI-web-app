import { useTranslation } from 'react-i18next';
import { ArrowUpRight, Bike, MapPin } from 'lucide-react';

export default function App() {
  const { t, i18n } = useTranslation();

  function changeLanguage(event) {
    i18n.changeLanguage(event.target.value);
    document.documentElement.lang = event.target.value;
  }

  return (
    <main>
      <header className="site-header container-fluid">
        <a className="brand" href="#home" aria-label="RAFIKI, accueil">
          <span className="brand-mark"><Bike size={22} strokeWidth={2.2} /></span>
          <span>RAFIKI</span>
        </a>
        <nav className="header-nav" aria-label="Navigation principale">
          <a href="#about">{t('navAbout')}</a>
          <a href="#area">{t('navArea')}</a>
        </nav>
        <label className="language-control">
          <span className="visually-hidden">{t('language')}</span>
          <select value={i18n.language.startsWith('sw') ? 'sw' : 'fr'} onChange={changeLanguage} aria-label={t('language')}>
            <option value="fr">FR</option>
            <option value="sw">SW</option>
          </select>
        </label>
      </header>

      <section className="hero container-fluid" id="home">
        <div className="hero-copy">
          <p className="eyebrow"><span className="eyebrow-line" />{t('label')}</p>
          <h1>{t('headline')}</h1>
          <p className="hero-intro">{t('intro')}</p>
          <a className="primary-button" href="#about">{t('cta')}<ArrowUpRight size={19} /></a>
          <p className="availability"><span className="status-dot" />{t('availability')}</p>
        </div>
        <div className="route-art" aria-hidden="true">
          <div className="route-art-label"><MapPin size={15} /> NYANKUNDE</div>
          <svg className="route-lines" viewBox="0 0 590 490" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M-10 111C74 90 115 169 176 156C237 143 254 75 334 94C414 113 426 194 511 175C552 166 570 142 610 137" />
            <path d="M-18 355C67 326 99 274 174 292C250 310 279 399 358 386C437 373 468 290 608 315" />
            <path d="M282 -15C258 53 224 100 239 165C254 230 326 257 314 322C302 387 248 419 250 509" />
            <path d="M443 -12C407 63 423 101 468 133C513 165 534 221 503 264C472 307 408 323 423 382C438 441 507 464 533 511" />
            <path className="route-highlight" d="M93 394C137 371 149 335 183 314C223 289 266 300 294 271C327 237 307 202 331 175C354 149 394 144 415 117" />
          </svg>
          <span className="map-pin pin-start"><span /></span>
          <span className="map-pin pin-end"><span /></span>
          <div className="route-caption"><span className="caption-dot" />{t('location')}</div>
          <div className="route-stamp">R<br />K</div>
        </div>
      </section>

      <section className="about-section container-fluid" id="about">
        <div className="about-marker"><span className="marker-icon"><Bike size={20} /></span><span>RAFIKI<br />{t('location')}</span></div>
        <div className="about-copy"><h2>{t('aboutTitle')}</h2><p>{t('aboutBody')}</p></div>
        <div id="area" className="area-note"><MapPin size={18} /><span>{t('location')}</span></div>
      </section>
      <footer className="site-footer container-fluid"><span>RAFIKI © 2026</span><span>{t('footer')}</span></footer>
    </main>
  );
}
