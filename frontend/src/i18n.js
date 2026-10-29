import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

i18n.use(initReactI18next).init({
  resources: {
    fr: {
      translation: {
        navAbout: 'À propos',
        navArea: 'Notre zone',
        language: 'Langue',
        label: 'La mobilité, en toute simplicité',
        headline: 'Votre motard-taxi, à portée de main.',
        intro: 'RAFIKI vous aide à trouver un motard-taxi de confiance pour vos déplacements à Nyankunde.',
        cta: 'Trouver un motard',
        availability: 'Bientôt disponible à Nyankunde',
        aboutTitle: 'Nyankunde avance. RAFIKI vous accompagne.',
        aboutBody: 'Une façon plus simple de rejoindre vos destinations, pensée pour les trajets du quotidien et la réalité de notre communauté.',
        location: 'Nyankunde, RDC',
        footer: 'La route nous rapproche.',
      },
    },
    sw: {
      translation: {
        navAbout: 'Kuhusu RAFIKI',
        navArea: 'Eneo letu',
        language: 'Lugha',
        label: 'Usafiri, kwa urahisi',
        headline: 'Dereva wako wa bodaboda, karibu nawe.',
        intro: 'RAFIKI inakusaidia kupata dereva wa bodaboda unayemwamini kwa safari zako Nyankunde.',
        cta: 'Tafuta dereva',
        availability: 'Inapatikana hivi karibuni Nyankunde',
        aboutTitle: 'Nyankunde inasonga. RAFIKI iko pamoja nawe.',
        aboutBody: 'Njia rahisi ya kufika unakoenda, iliyoundwa kwa safari za kila siku na maisha ya jamii yetu.',
        location: 'Nyankunde, DRC',
        footer: 'Barabara inatuunganisha.',
      },
    },
  },
  lng: 'fr',
  fallbackLng: 'fr',
  interpolation: { escapeValue: false },
});

export default i18n;
