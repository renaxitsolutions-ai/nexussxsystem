// Nexuss X Systems UI
const NXS = {
  API_BASE: window.location.origin,
  CONTACT_ENDPOINT: 'https://formspree.io/f/mkozkvkz',
  requireAuth: true,
  // ── ElevenLabs API key (get free key at elevenlabs.io) ──
  ELEVENLABS_KEY: 'sk_77dc6f67e6a2af96e167fb1e9bfeb571e23fa3ebc1dbb5e3'
};

const I18N = {
  es: {
    nav_home: 'Home',
    nav_services: 'Servicios',
    nav_solutions: 'Soluciones',
    nav_about: 'Sobre nosotros',
    nav_faq: 'FAQ',
    nav_contact: 'Contacto',
    nav_admin: 'Admin',
    nav_logout: 'Salir',

    index_tag: 'Acceso profesional',
    index_title: 'Accede a tu panel privado.',
    index_sub: 'Servicios de desarrollo a medida: apps web, landing pages, paneles de gestión, páginas de ventas y chatbots con IA.',
    index_status: 'Servidor: Verificando...',
    index_login: 'Iniciar sesión',
    index_register: 'Crear cuenta',
    index_trust_title: 'Confianza y resultados',
    index_trust_sub: 'Estrategia, diseño y desarrollo listos para crecimiento, ventas y automatización.',

    home_tag: 'Empresa de tecnología',
    home_title: 'Nexuss X Systems — soluciones digitales de alto impacto.',
    home_sub: 'Desarrollamos aplicaciones, landing pages, paneles de gestión, páginas de ventas y chatbots con IA para empresas que buscan crecer.',
    home_cta_primary: 'Ver servicios',
    home_cta_secondary: 'Solicitar propuesta',
    home_about_title: 'Nosotros',
    home_about_sub: 'Nexuss X Systems es una marca enfocada en innovación, confianza y modernidad. Creamos productos digitales con calidad y una experiencia sencilla.',
    home_mission: 'Misión',
    home_vision: 'Visión',
    home_values: 'Valores',
    home_slogan_label: 'Lema',
    home_slogan: 'Nuestro trabajo supera los límites, va más allá de este planeta.',
    home_services_title: 'Servicios principales',
    home_services_sub: 'Soluciones a medida para negocios digitales y empresas tradicionales.',
    home_industries_title: 'Industrias que atendemos',
    home_industries_sub: 'Experiencia adaptable a múltiples sectores y modelos de negocio.',
    home_process_title: 'Diagrama / Proceso',
    home_results_title: 'Resultados medibles',
    home_testimonials_title: 'Testimonios',
    home_ready_title: '¿Listo para tu proyecto?',
    home_ready_sub: 'Cuéntanos tu idea y te enviamos una propuesta clara.',
    home_ready_cta1: 'Contactar',
    home_ready_cta2: 'Ver servicios',

    services_tag: 'Servicios',
    services_title: 'Desarrollo integral para vender y escalar.',
    services_sub: 'Desde landing pages hasta sistemas complejos, con diseño premium y rendimiento óptimo.',
    services_special_title: 'Servicios especializados',
    services_special_sub: 'Soluciones enfocadas en conversión, automatización y resultados.',
    services_cta_title: '¿Listo para comenzar?',
    services_cta_sub: 'Cuéntanos tu idea y creamos una propuesta clara.',
    services_cta_primary: 'Contactar',
    services_cta_secondary: 'Ver soluciones',

    solutions_tag: 'Soluciones',
    solutions_title: 'Productos digitales listos para vender.',
    solutions_sub: 'Landing pages, páginas de ventas, paneles y chatbots adaptados a tu negocio.',
    solutions_catalog_title: 'Catálogo general',
    solutions_catalog_sub: 'Productos y servicios organizados por tipo.',
    solutions_featured_title: 'Soluciones destacadas',
    solutions_featured_sub: 'Estructuras listas para convertir visitantes en clientes.',
    solutions_prices_title: 'Precios',
    solutions_prices_sub: 'Información clara y transparente.',
    solutions_offers_title: 'Ofertas',
    solutions_offers_sub: 'Promociones y descuentos especiales.',
    cart_title: 'Carrito de compras',
    cart_total: 'Total (DOP)',
    cart_empty: 'Sin productos aún.',
    buy_title: 'Formulario de compra',
    buy_btn: 'Comprar',
    add_to_cart: 'Agregar al carrito',
    comments_title: 'Comentarios',
    comments_sub: 'Opiniones y reseñas de clientes.',
    comments_send: 'Enviar comentario',

    about_tag: 'Sobre nosotros',
    about_title: 'Innovación, confianza y modernidad.',
    about_sub: 'Nexuss X Systems ofrece productos y servicios de alta calidad con una experiencia sencilla y accesible.',
    about_objective: 'Objetivo',
    about_mission: 'Misión',
    about_vision: 'Visión',
    about_highlight: 'En qué destacamos',
    about_values: 'Valores',
    about_slogan: 'Lema',

    faq_tag: 'Soporte',
    faq_title: 'Preguntas frecuentes',
    faq_sub: 'Respuestas claras sobre nuestros servicios y procesos.',

    contact_tag: 'Contacto premium',
    contact_title: 'Hablemos de tu proyecto',
    contact_sub: 'Cuéntanos tu idea y te proponemos una solución clara y escalable.',
    contact_form_title: 'Formulario',
    contact_info_title: 'Información',
    contact_info_sub: 'Servicios remotos para todo LATAM.',
    contact_send: 'Enviar mensaje',

    admin_tag: 'Administración',
    admin_title: 'Panel de mensajes',
    admin_sub: 'Control y seguimiento de solicitudes entrantes.',
    admin_filters: 'Filtros',
    admin_export: 'Exportar CSV',
    admin_apply: 'Aplicar filtros',
    admin_prev: 'Anterior',
    admin_next: 'Siguiente',

    ph_name: 'Nombre',
    ph_lastname: 'Apellido',
    ph_email: 'Correo electrónico',
    ph_company: 'Empresa (opcional)',
    ph_message: 'Mensaje',
    ph_service: 'Servicio de interés',
    ph_budget: 'Presupuesto estimado',
    ph_filter_email: 'correo@dominio.com',
    ph_filter_query: 'nombre o mensaje',
    ph_phone: 'Número de contacto',
    ph_card: 'Tarjeta de crédito',

    opt_service_0: 'Servicio de interés',
    opt_service_1: 'Landing page',
    opt_service_2: 'Página de ventas',
    opt_service_3: 'Panel de gestión',
    opt_service_4: 'Aplicación web',
    opt_service_5: 'Chatbot con IA',
    opt_service_6: 'Automatización / Integraciones',

    opt_budget_0: 'Presupuesto estimado',
    opt_budget_1: 'DOP 2,000 – 5,000',
    opt_budget_2: 'DOP 5,000 – 10,000',
    opt_budget_3: 'DOP 10,000 – 20,000',
    opt_budget_4: 'DOP 20,000+'
  },
  en: {
    nav_home: 'Home',
    nav_services: 'Services',
    nav_solutions: 'Solutions',
    nav_about: 'About us',
    nav_faq: 'FAQ',
    nav_contact: 'Contact',
    nav_admin: 'Admin',
    nav_logout: 'Sign out',

    index_tag: 'Professional access',
    index_title: 'Access your private dashboard.',
    index_sub: 'Custom development services: web apps, landing pages, management panels, sales pages and AI chatbots.',
    index_status: 'Server: Checking...',
    index_login: 'Sign in',
    index_register: 'Create account',
    index_trust_title: 'Trust & results',
    index_trust_sub: 'Strategy, design and development built for growth, sales and automation.',

    home_tag: 'Technology company',
    home_title: 'Nexuss X Systems — high‑impact digital solutions.',
    home_sub: 'We build applications, landing pages, management dashboards, sales pages and AI chatbots for growing businesses.',
    home_cta_primary: 'View services',
    home_cta_secondary: 'Request proposal',
    home_about_title: 'About us',
    home_about_sub: 'Nexuss X Systems focuses on innovation, trust and modernity. We build digital products with quality and a simple experience.',
    home_mission: 'Mission',
    home_vision: 'Vision',
    home_values: 'Values',
    home_slogan_label: 'Slogan',
    home_slogan: 'Our work surpasses limits and goes beyond this planet.',
    home_services_title: 'Core services',
    home_services_sub: 'Tailored solutions for digital businesses and enterprises.',
    home_industries_title: 'Industries served',
    home_industries_sub: 'Adaptable experience across sectors and business models.',
    home_process_title: 'Diagram / Process',
    home_results_title: 'Measurable results',
    home_testimonials_title: 'Testimonials',
    home_ready_title: 'Ready for your project?',
    home_ready_sub: 'Share your idea and we will send a clear proposal.',
    home_ready_cta1: 'Contact',
    home_ready_cta2: 'View services',

    services_tag: 'Services',
    services_title: 'End-to-end development to sell and scale.',
    services_sub: 'From landing pages to complex systems with premium design and performance.',
    services_special_title: 'Specialized services',
    services_special_sub: 'Solutions focused on conversion, automation and results.',
    services_cta_title: 'Ready to start?',
    services_cta_sub: 'Tell us your idea and we will craft a clear proposal.',
    services_cta_primary: 'Contact',
    services_cta_secondary: 'View solutions',

    solutions_tag: 'Solutions',
    solutions_title: 'Digital products ready to sell.',
    solutions_sub: 'Landing pages, sales pages, dashboards and chatbots tailored to your business.',
    solutions_catalog_title: 'General catalog',
    solutions_catalog_sub: 'Products and services organized by type.',
    solutions_featured_title: 'Featured solutions',
    solutions_featured_sub: 'Structures designed to convert visitors into clients.',
    solutions_prices_title: 'Pricing',
    solutions_prices_sub: 'Clear and transparent information.',
    solutions_offers_title: 'Offers',
    solutions_offers_sub: 'Promotions and special discounts.',
    cart_title: 'Shopping cart',
    cart_total: 'Total (DOP)',
    cart_empty: 'No items yet.',
    buy_title: 'Checkout form',
    buy_btn: 'Buy now',
    add_to_cart: 'Add to cart',
    comments_title: 'Reviews',
    comments_sub: 'Client opinions and feedback.',
    comments_send: 'Send review',

    about_tag: 'About us',
    about_title: 'Innovation, trust and modernity.',
    about_sub: 'Nexuss X Systems delivers high-quality products and services with a simple, accessible experience.',
    about_objective: 'Objective',
    about_mission: 'Mission',
    about_vision: 'Vision',
    about_highlight: 'What we do best',
    about_values: 'Values',
    about_slogan: 'Slogan',

    faq_tag: 'Support',
    faq_title: 'Frequently asked questions',
    faq_sub: 'Clear answers about our services and process.',

    contact_tag: 'Premium contact',
    contact_title: 'Let’s talk about your project',
    contact_sub: 'Share your idea and we will propose a clear, scalable solution.',
    contact_form_title: 'Form',
    contact_info_title: 'Information',
    contact_info_sub: 'Remote services across LATAM.',
    contact_send: 'Send message',

    admin_tag: 'Administration',
    admin_title: 'Messages panel',
    admin_sub: 'Control and follow-up of incoming requests.',
    admin_filters: 'Filters',
    admin_export: 'Export CSV',
    admin_apply: 'Apply filters',
    admin_prev: 'Previous',
    admin_next: 'Next',

    ph_name: 'First name',
    ph_lastname: 'Last name',
    ph_email: 'Email address',
    ph_company: 'Company (optional)',
    ph_message: 'Message',
    ph_service: 'Service of interest',
    ph_budget: 'Estimated budget',
    ph_filter_email: 'email@domain.com',
    ph_filter_query: 'name or message',
    ph_phone: 'Contact number',
    ph_card: 'Credit card',

    opt_service_0: 'Service of interest',
    opt_service_1: 'Landing page',
    opt_service_2: 'Sales page',
    opt_service_3: 'Management dashboard',
    opt_service_4: 'Web application',
    opt_service_5: 'AI chatbot',
    opt_service_6: 'Automation / Integrations',

    opt_budget_0: 'Estimated budget',
    opt_budget_1: 'DOP 2,000 – 5,000',
    opt_budget_2: 'DOP 5,000 – 10,000',
    opt_budget_3: 'DOP 10,000 – 20,000',
    opt_budget_4: 'DOP 20,000+'
  },
  pt: {
    nav_home: 'Início', nav_services: 'Serviços', nav_solutions: 'Soluções',
    nav_about: 'Sobre nós', nav_faq: 'FAQ', nav_contact: 'Contato',
    nav_admin: 'Admin', nav_logout: 'Sair',
    index_tag: 'Acesso profissional', index_title: 'Acesse seu painel privado.',
    index_sub: 'Desenvolvimento sob medida: apps, landing pages, painéis de gestão e chatbots com IA.',
    index_status: 'Servidor: Verificando...', index_login: 'Entrar', index_register: 'Criar conta',
    index_trust_title: 'Confiança e resultados',
    index_trust_sub: 'Estratégia, design e desenvolvimento para crescimento e automação.',
    contact_tag: 'Contato premium', contact_title: 'Fale sobre seu projeto',
    contact_send: 'Enviar mensagem', add_to_cart: 'Adicionar ao carrinho',
    buy_btn: 'Comprar agora', comments_send: 'Enviar avaliação',
    ph_name: 'Nome', ph_lastname: 'Sobrenome', ph_email: 'E-mail',
    ph_company: 'Empresa (opcional)', ph_message: 'Mensagem',
    ph_phone: 'Número de contato', ph_card: 'Cartão de crédito'
  },
  fr: {
    nav_home: 'Accueil', nav_services: 'Services', nav_solutions: 'Solutions',
    nav_about: 'À propos', nav_faq: 'FAQ', nav_contact: 'Contact',
    nav_admin: 'Admin', nav_logout: 'Déconnexion',
    index_tag: 'Accès professionnel', index_title: 'Accédez à votre tableau de bord.',
    index_sub: 'Développement sur mesure : apps, landing pages, panneaux de gestion et chatbots IA.',
    index_status: 'Serveur : Vérification...', index_login: 'Se connecter', index_register: 'Créer un compte',
    index_trust_title: 'Confiance et résultats',
    index_trust_sub: 'Stratégie, design et développement pour croissance, ventes et automatisation.',
    home_tag: 'Entreprise technologique', home_title: 'Nexuss X Systems — solutions numériques à fort impact.',
    home_cta_primary: 'Voir les services', home_cta_secondary: 'Demander un devis',
    home_slogan: 'Notre travail dépasse les limites et va au-delà de cette planète.',
    home_services_title: 'Services principaux', home_industries_title: 'Industries servies',
    home_ready_title: 'Prêt pour votre projet ?', home_ready_cta1: 'Contacter', home_ready_cta2: 'Voir les services',
    services_tag: 'Services', services_title: 'Développement intégral pour vendre et évoluer.',
    solutions_tag: 'Solutions', solutions_title: 'Produits numériques prêts à vendre.',
    cart_title: 'Panier d\'achat', cart_total: 'Total (DOP)', cart_empty: 'Aucun produit.',
    buy_title: 'Formulaire de paiement', buy_btn: 'Acheter maintenant',
    add_to_cart: 'Ajouter au panier', comments_send: 'Envoyer un avis',
    contact_tag: 'Contact premium', contact_title: 'Parlons de votre projet',
    contact_send: 'Envoyer le message', faq_tag: 'Support', faq_title: 'Questions fréquentes',
    admin_tag: 'Administration', admin_title: 'Panneau de messages',
    admin_filters: 'Filtres', admin_export: 'Exporter CSV', admin_apply: 'Appliquer',
    admin_prev: 'Précédent', admin_next: 'Suivant',
    ph_name: 'Prénom', ph_lastname: 'Nom de famille', ph_email: 'Adresse e-mail',
    ph_company: 'Entreprise (optionnel)', ph_message: 'Message',
    ph_phone: 'Numéro de contact', ph_card: 'Carte de crédit',
    opt_service_0: 'Service souhaité', opt_service_1: 'Page d\'atterrissage',
    opt_service_2: 'Page de vente', opt_service_3: 'Tableau de bord',
    opt_service_4: 'Application web', opt_service_5: 'Chatbot IA',
    opt_service_6: 'Automatisation / Intégrations',
    opt_budget_0: 'Budget estimé', opt_budget_1: 'DOP 2,000 – 5,000',
    opt_budget_2: 'DOP 5,000 – 10,000', opt_budget_3: 'DOP 10,000 – 20,000', opt_budget_4: 'DOP 20,000+'
  },
  it: {
    nav_home: 'Home', nav_services: 'Servizi', nav_solutions: 'Soluzioni',
    nav_about: 'Chi siamo', nav_faq: 'FAQ', nav_contact: 'Contatto',
    nav_admin: 'Admin', nav_logout: 'Esci',
    index_tag: 'Accesso professionale', index_title: 'Accedi al tuo pannello privato.',
    index_sub: 'Sviluppo su misura: app, landing page, pannelli di gestione e chatbot con IA.',
    index_status: 'Server: Verifica...', index_login: 'Accedi', index_register: 'Crea account',
    index_trust_title: 'Fiducia e risultati',
    index_trust_sub: 'Strategia, design e sviluppo per crescita, vendite e automazione.',
    home_tag: 'Azienda tecnologica', home_title: 'Nexuss X Systems — soluzioni digitali ad alto impatto.',
    home_cta_primary: 'Vedi servizi', home_cta_secondary: 'Richiedi proposta',
    home_slogan: 'Il nostro lavoro supera i limiti e va oltre questo pianeta.',
    home_services_title: 'Servizi principali', home_industries_title: 'Settori serviti',
    home_ready_title: 'Pronto per il tuo progetto?', home_ready_cta1: 'Contattaci', home_ready_cta2: 'Vedi servizi',
    services_tag: 'Servizi', services_title: 'Sviluppo integrale per vendere e crescere.',
    solutions_tag: 'Soluzioni', solutions_title: 'Prodotti digitali pronti per vendere.',
    cart_title: 'Carrello acquisti', cart_total: 'Totale (DOP)', cart_empty: 'Nessun prodotto.',
    buy_title: 'Modulo di acquisto', buy_btn: 'Acquista ora',
    add_to_cart: 'Aggiungi al carrello', comments_send: 'Invia recensione',
    contact_tag: 'Contatto premium', contact_title: 'Parliamo del tuo progetto',
    contact_send: 'Invia messaggio', faq_tag: 'Supporto', faq_title: 'Domande frequenti',
    admin_tag: 'Amministrazione', admin_title: 'Pannello messaggi',
    admin_filters: 'Filtri', admin_export: 'Esporta CSV', admin_apply: 'Applica',
    admin_prev: 'Precedente', admin_next: 'Successivo',
    ph_name: 'Nome', ph_lastname: 'Cognome', ph_email: 'Indirizzo e-mail',
    ph_company: 'Azienda (opzionale)', ph_message: 'Messaggio',
    ph_phone: 'Numero di contatto', ph_card: 'Carta di credito',
    opt_service_0: 'Servizio di interesse', opt_service_1: 'Landing page',
    opt_service_2: 'Pagina di vendita', opt_service_3: 'Pannello di gestione',
    opt_service_4: 'Applicazione web', opt_service_5: 'Chatbot IA',
    opt_service_6: 'Automazione / Integrazioni',
    opt_budget_0: 'Budget stimato', opt_budget_1: 'DOP 2,000 – 5,000',
    opt_budget_2: 'DOP 5,000 – 10,000', opt_budget_3: 'DOP 10,000 – 20,000', opt_budget_4: 'DOP 20,000+'
  }
};

function getLang(){
  return localStorage.getItem('nxs_lang') || 'es';
}

function applyI18n(lang){
  const dict = I18N[lang] || I18N.es;
  document.documentElement.lang = lang;
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if(dict[key]){ el.textContent = dict[key]; }
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    if(dict[key]){ el.setAttribute('placeholder', dict[key]); }
  });
  const toggle = document.getElementById('langToggle');
  if(toggle){
    // toggle label is managed by bindLangToggle dropdown
  }
}

function setLang(lang){
  localStorage.setItem('nxs_lang', lang);
  applyI18n(lang);
}

function bindLangToggle(){
  const toggle = document.getElementById('langToggle');
  if(!toggle){ return; }

  const LANGS = [
    { code:'es', flag:'🇪🇸', name:'Español' },
    { code:'en', flag:'🇺🇸', name:'English' },
    { code:'pt', flag:'🇧🇷', name:'Português' },
    { code:'fr', flag:'🇫🇷', name:'Français' },
    { code:'it', flag:'🇮🇹', name:'Italiano' }
  ];

  const wrapper = document.createElement('div');
  wrapper.className = 'lang-menu';
  toggle.parentNode.insertBefore(wrapper, toggle);
  wrapper.appendChild(toggle);

  const panel = document.createElement('div');
  panel.className = 'lang-panel';
  panel.id = 'langPanel';

  LANGS.forEach(({ code, flag, name }) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'lang-opt' + (getLang() === code ? ' active' : '');
    btn.setAttribute('data-lang', code);
    btn.innerHTML = `${flag} <span class="lang-name">${name}</span>`;
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      setLang(code);
      panel.querySelectorAll('.lang-opt').forEach(b => b.classList.toggle('active', b.getAttribute('data-lang') === code));
      updateToggleLabel();
      panel.classList.remove('open');
    });
    panel.appendChild(btn);
  });
  wrapper.appendChild(panel);

  function updateToggleLabel(){
    const curr = getLang();
    const entry = LANGS.find(l => l.code === curr) || LANGS[0];
    toggle.innerHTML = `🌐 ${entry.flag} <span>${curr.toUpperCase()}</span> ▾`;
  }

  toggle.addEventListener('click', (e) => {
    e.stopPropagation();
    panel.classList.toggle('open');
    updateToggleLabel();
  });

  document.addEventListener('click', () => panel.classList.remove('open'));
  updateToggleLabel();
}

function showToast(msg){
  const toast = document.getElementById('toast');
  if(!toast){ return; }
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2400);
}

function setSession(email, token){
  localStorage.setItem('nxs_session', JSON.stringify({
    email,
    token,
    ts: Date.now()
  }));
}

function hasSession(){
  return !!localStorage.getItem('nxs_auth');
}

function getToken(){
  const data = JSON.parse(localStorage.getItem('nxs_auth') || 'null');
  return data && data.token ? data.token : null;
}

function requireAuthGate(){
  const requires = document.body.getAttribute('data-requires-auth') === 'true';
  if(requires && !hasSession()){
    window.location.href = 'login.html';
  }
}

// ── Validaciones de formulario ──
function validateEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

function validatePassword(password) {
  return password && password.length >= 8;
}

function validatePasswordStrength(password) {
  let strength = 0;
  if (password.length >= 8) strength++;
  if (password.match(/[a-z]/) && password.match(/[A-Z]/)) strength++;
  if (password.match(/[0-9]/)) strength++;
  if (password.match(/[!@#$%^&*]/)) strength++;
  return strength;
}

function getPasswordStrengthText(strength) {
  if (strength <= 1) return 'Débil';
  if (strength === 2) return 'Media';
  if (strength === 3) return 'Fuerte';
  return 'Muy fuerte';
}

function sanitizeInput(input) {
  return String(input || '').trim().replace(/[<>]/g, '');
}

function getCurrentUser() {
  const auth = localStorage.getItem('nxs_auth');
  return auth ? JSON.parse(auth).user : null;
}

function getAuthToken() {
  const auth = localStorage.getItem('nxs_auth');
  return auth ? JSON.parse(auth).token : null;
}

function isTokenExpired() {
  const auth = localStorage.getItem('nxs_auth');
  if (!auth) return true;
  const data = JSON.parse(auth);
  const now = Date.now();
  // Verificar si tiene más de 7 días
  const maxAge = 7 * 24 * 60 * 60 * 1000;
  return (now - data.timestamp) > maxAge;
}

function bindNav(){
  const toggle = document.getElementById('navToggle');
  const links = document.getElementById('navLinks');

  if(toggle && links){
    toggle.innerHTML = '☰ Menú';
    toggle.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = links.classList.toggle('open');
      toggle.innerHTML = isOpen ? '✕ Cerrar' : '☰ Menú';
    });
    // Close mobile nav when a link is clicked
    links.addEventListener('click', (e) => {
      if(window.innerWidth <= 820 && e.target.tagName === 'A'){
        links.classList.remove('open');
        toggle.innerHTML = '☰ Menú';
      }
    });
  }

  const logout = document.getElementById('logoutBtn');
  if(logout){
    logout.addEventListener('click', (e) => {
      e.preventDefault();
      localStorage.removeItem('nxs_auth');
      localStorage.removeItem('nxs_remember');
      window.location.href = 'login.html';
    });
  }

  const current = window.location.pathname.split('/').pop();
  if(current){
    document.querySelectorAll('.nav-links a[href]').forEach(a => {
      if(a.getAttribute('href') === current){ a.classList.add('active'); }
    });
  }

  // Bind nav dropdowns
  document.querySelectorAll('.nav-dropdown').forEach(dd => {
    const btn = dd.querySelector('.nav-dropdown-btn');
    if(!btn){ return; }
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isMobile = window.innerWidth <= 820;
      if(!isMobile){
        document.querySelectorAll('.nav-dropdown').forEach(o => { if(o !== dd) o.classList.remove('open'); });
      }
      dd.classList.toggle('open');
    });
    if(current && dd.querySelector(`a[href="${current}"]`)){
      btn.style.color = 'var(--accent)';
      btn.style.borderColor = 'rgba(0,212,255,0.35)';
      btn.style.background = 'var(--card-hover)';
    }
  });

  // Close dropdowns on outside click (desktop only)
  document.addEventListener('click', (e) => {
    if(!e.target.closest('.nav-dropdown')){
      document.querySelectorAll('.nav-dropdown').forEach(dd => dd.classList.remove('open'));
    }
    if(!e.target.closest('#navLinks') && !e.target.closest('#navToggle') && links){
      links.classList.remove('open');
      if(toggle) toggle.innerHTML = '☰ Menú';
    }
  });
}

function updateAdminLinks(){
  document.querySelectorAll('a[href="admin.html"]').forEach(a => a.style.display = '');
}

function bindReveal(){
  const elements = document.querySelectorAll('.reveal');
  if(elements.length === 0){ return; }
  if(!('IntersectionObserver' in window)){
    elements.forEach(el => el.classList.add('show'));
    return;
  }
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if(entry.isIntersecting){
        entry.target.classList.add('show');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });
  elements.forEach(el => observer.observe(el));
}

function bindAccordions(){
  document.querySelectorAll('.acc-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.parentElement;
      item.classList.toggle('open');
    });
  });
}

function bindLogin(){
  const loginTab = document.getElementById('tabLogin');
  const regTab   = document.getElementById('tabRegister');
  const loginForm = document.getElementById('loginForm');
  const regForm   = document.getElementById('registerForm');
  // Solo activar si hay AMBOS formularios Y los tabs de control
  if(!loginForm || !regForm || !loginTab || !regTab){ return; }

  function setTab(tab){
    if(tab === 'login'){
      loginForm.style.display = 'grid';
      regForm.style.display   = 'none';
      loginTab.classList.add('primary');
      regTab.classList.remove('primary');
    }else{
      loginForm.style.display = 'none';
      regForm.style.display   = 'grid';
      regTab.classList.add('primary');
      loginTab.classList.remove('primary');
    }
  }

  setTab('login');
  loginTab.addEventListener('click', () => setTab('login'));
  regTab.addEventListener('click',   () => setTab('register'));

  // Login form
  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const name = loginForm.querySelector('#loginFirst');
    const last = loginForm.querySelector('#loginLast');
    const email = loginForm.querySelector('#loginEmail');
    
    let isValid = true;
    
    if(!name || name.value.trim().length < 2) {
      if(name) name.classList.add('err');
      isValid = false;
    } else if(name) {
      name.classList.remove('err');
    }
    
    if(!last || last.value.trim().length < 2) {
      if(last) last.classList.add('err');
      isValid = false;
    } else if(last) {
      last.classList.remove('err');
    }
    
    const emailRegex = /^\S+@\S+\.\S+$/;
    if(!email || !emailRegex.test(email.value.trim())) {
      if(email) email.classList.add('err');
      isValid = false;
    } else if(email) {
      email.classList.remove('err');
    }
    
    if(!isValid) {
      showToast('Por favor completa todos los campos correctamente.');
      return;
    }

    const users = JSON.parse(localStorage.getItem('nxs_users') || '[]');
    const existing = users.find(u => u.email === email.value.trim());
    if(!existing){
      showToast('No se encontró la cuenta. Regístrate primero.');
      email.classList.add('err');
      return;
    }

    const submitBtn = loginForm.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Iniciando...';

    fetch(NXS.CONTACT_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({
        name: `${name.value.trim()} ${last.value.trim()}`.trim(),
        email: email.value.trim(),
        message: 'Inicio de sesión desde el portal.'
      })
    }).catch(() => {});

    setSession(email.value.trim(), 'local-session');
    setTimeout(() => window.location.href = 'home.html', 1000);
  });

  // Register form
  regForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const name = regForm.querySelector('#regName');
    const last = regForm.querySelector('#regLast');
    const email = regForm.querySelector('#regEmail');
    
    let isValid = true;
    
    if(!name || name.value.trim().length < 2) {
      if(name) name.classList.add('err');
      isValid = false;
    } else if(name) {
      name.classList.remove('err');
    }
    
    if(!last || last.value.trim().length < 2) {
      if(last) last.classList.add('err');
      isValid = false;
    } else if(last) {
      last.classList.remove('err');
    }
    
    const emailRegex = /^\S+@\S+\.\S+$/;
    if(!email || !emailRegex.test(email.value.trim())) {
      if(email) email.classList.add('err');
      isValid = false;
    } else if(email) {
      email.classList.remove('err');
    }
    
    if(!isValid) {
      showToast('Por favor completa todos los campos correctamente.');
      return;
    }

    const users = JSON.parse(localStorage.getItem('nxs_users') || '[]');
    const exists = users.some(u => u.email === email.value.trim());
    if(exists){
      showToast('Ese correo ya está registrado.');
      email.classList.add('err');
      return;
    }
    
    users.push({
      name: `${name.value.trim()} ${last.value.trim()}`.trim(),
      email: email.value.trim()
    });
    localStorage.setItem('nxs_users', JSON.stringify(users));

    const submitBtn = regForm.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Creando cuenta...';

    fetch(NXS.CONTACT_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({
        name: `${name.value.trim()} ${last.value.trim()}`.trim(),
        email: email.value.trim(),
        message: 'Nuevo registro desde el portal.'
      })
    }).catch(() => {});

    setSession(email.value.trim(), 'local-session');
    setTimeout(() => window.location.href = 'home.html', 1000);
  });
}

function bindProducts(){
  const addBtns = document.querySelectorAll('[data-add-to-cart]');
  const itemsEl = document.getElementById('cartItems');
  const totalEl = document.getElementById('cartTotal');
  if(addBtns.length === 0 || !itemsEl || !totalEl){ return; }
  const cart = JSON.parse(localStorage.getItem('nxs_cart') || '[]');

  function render(){
    itemsEl.innerHTML = '';
    if(cart.length === 0){
      itemsEl.innerHTML = `<li>${I18N[getLang()].cart_empty}</li>`;
      totalEl.textContent = `${I18N[getLang()].cart_total}: DOP 0`;
      return;
    }
    let total = 0;
    cart.forEach((item, idx) => {
      const subtotal = item.price * item.qty;
      total += subtotal;
      const li = document.createElement('li');
      li.innerHTML = `
        <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
          <b>${item.name}</b>
          <span>DOP/u ${item.price}</span>
          <button class="btn ghost" data-dec="${idx}">-</button>
          <span>Cant: ${item.qty}</span>
          <button class="btn ghost" data-inc="${idx}">+</button>
          <span>Subtotal: DOP ${subtotal}</span>
          <button class="btn ghost" data-remove="${idx}">Eliminar</button>
        </div>
      `;
      itemsEl.appendChild(li);
    });
    totalEl.textContent = `${I18N[getLang()].cart_total}: DOP ${total}`;

    itemsEl.querySelectorAll('[data-remove]').forEach(btn => {
      btn.addEventListener('click', () => {
        cart.splice(Number(btn.getAttribute('data-remove')), 1);
        localStorage.setItem('nxs_cart', JSON.stringify(cart));
        document.dispatchEvent(new CustomEvent('cartUpdated'));
        render();
      });
    });
    itemsEl.querySelectorAll('[data-inc]').forEach(btn => {
      btn.addEventListener('click', () => {
        const i = Number(btn.getAttribute('data-inc'));
        cart[i].qty += 1;
        localStorage.setItem('nxs_cart', JSON.stringify(cart));
        document.dispatchEvent(new CustomEvent('cartUpdated'));
        render();
      });
    });
    itemsEl.querySelectorAll('[data-dec]').forEach(btn => {
      btn.addEventListener('click', () => {
        const i = Number(btn.getAttribute('data-dec'));
        cart[i].qty = Math.max(1, cart[i].qty - 1);
        localStorage.setItem('nxs_cart', JSON.stringify(cart));
        document.dispatchEvent(new CustomEvent('cartUpdated'));
        render();
      });
    });
  }

  addBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const card = btn.closest('[data-product]');
      const name = card.getAttribute('data-product');
      const price = Number(card.getAttribute('data-price')) || 0;
      const existing = cart.find(c => c.name === name);
      if(existing){ existing.qty += 1; }
      else{ cart.push({ name, price, qty: 1 }); }
      localStorage.setItem('nxs_cart', JSON.stringify(cart));
      document.dispatchEvent(new CustomEvent('cartUpdated'));
      showToast(`✓ ${name} agregado al carrito`);
      render();
    });
  });

  render();
}

function bindPurchase(){
  const form = document.getElementById('purchaseForm');
  if(!form){ return; }
  
  function validateField(input){
    const field = input.closest('.field');
    if(!field) return false;
    
    const value = input.value.trim();
    let isValid = false;
    const id = input.id;
    
    if(id === 'buyEmail'){
      isValid = /^\S+@\S+\.\S+$/.test(value);
    } else if(id === 'buyName' || id === 'buyLast'){
      isValid = value.length >= 2;
    } else if(id === 'buyPhone'){
      isValid = value.length >= 8;
    } else if(id === 'buyCard'){
      isValid = value.length >= 13;
    }
    
    if(isValid){
      input.classList.remove('err');
    } else {
      input.classList.add('err');
    }
    return isValid;
  }

  // Add real-time validation
  form.querySelectorAll('input').forEach(input => {
    input.addEventListener('blur', () => validateField(input));
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const cart = JSON.parse(localStorage.getItem('nxs_cart') || '[]');
    if(cart.length === 0){ 
      showToast('Carrito vacío');
      return; 
    }

    // Validate all required fields
    const buyName = document.getElementById('buyName');
    const buyLast = document.getElementById('buyLast');
    const buyEmail = document.getElementById('buyEmail');
    const buyPhone = document.getElementById('buyPhone');
    const buyCard = document.getElementById('buyCard');

    const okName = validateField(buyName);
    const okLast = validateField(buyLast);
    const okEmail = validateField(buyEmail);
    const okPhone = validateField(buyPhone);
    const okCard = validateField(buyCard);

    if(!(okName && okLast && okEmail && okPhone && okCard)){
      showToast('Por favor completa todos los campos correctamente.');
      return;
    }

    const total = cart.reduce((sum, i) => sum + i.price * i.qty, 0);
    const customer = {
      name: buyName.value.trim(),
      last: buyLast.value.trim(),
      email: buyEmail.value.trim(),
      phone: buyPhone.value.trim(),
      card: buyCard.value.trim()
    };
    
    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Procesando compra...';

    const safeCard = customer.card ? `**** ${customer.card.slice(-4)}` : '';
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    fetch(NXS.CONTACT_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({
        name: `${customer.name} ${customer.last}`.trim(),
        email: customer.email,
        message: [
          `Nueva compra`,
          `Cliente: ${customer.name} ${customer.last}`.trim(),
          `Correo: ${customer.email}`,
          `Tel: ${customer.phone}`,
          `Tarjeta: ${safeCard}`,
          `Total: DOP ${total}`,
          `Items: ${cart.map(i => `${i.name} x${i.qty} (DOP ${i.price})`).join(' | ')}`
        ].join('\n')
      }),
      signal: controller.signal
    })
    .then(res => {
      clearTimeout(timeoutId);
      if(!res.ok){ throw new Error('Order'); }
    })
    .then(() => {
      showToast('Compra enviada exitosamente');
      localStorage.removeItem('nxs_cart');
      form.reset();
      form.querySelectorAll('input').forEach(f => f.classList.remove('err'));
      const itemsEl = document.getElementById('cartItems');
      if(itemsEl){ itemsEl.innerHTML = ''; }
      const totalEl = document.getElementById('cartTotal');
      if(totalEl){ totalEl.textContent = `${I18N[getLang()].cart_total}: DOP 0`; }
    })
    .catch(err => {
      clearTimeout(timeoutId);
      if(err.name === 'AbortError'){
        showToast('Tiempo agotado. Intenta de nuevo.');
      } else {
        showToast('No se pudo procesar la compra. Intenta de nuevo.');
      }
    })
    .finally(() => {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Comprar';
    });
  });
}

function bindContact(){
  const form = document.getElementById('contactForm');
  if(!form){ return; }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const name = form.querySelector('#name');
    const email = form.querySelector('#email');
    const message = form.querySelector('#message');
    const service = form.querySelector('#service');
    const budget = form.querySelector('#budget');
    const company = form.querySelector('#company');
    
    // Validar campos requeridos
    let isValid = true;
    
    if(!name || name.value.trim().length < 2) {
      if(name) name.classList.add('err');
      document.getElementById('errName').style.display = 'block';
      isValid = false;
    } else {
      if(name) name.classList.remove('err');
      document.getElementById('errName').style.display = 'none';
    }
    
    const emailRegex = /^\S+@\S+\.\S+$/;
    if(!email || !emailRegex.test(email.value.trim())) {
      if(email) email.classList.add('err');
      document.getElementById('errEmail').style.display = 'block';
      isValid = false;
    } else {
      if(email) email.classList.remove('err');
      document.getElementById('errEmail').style.display = 'none';
    }
    
    if(!message || message.value.trim().length < 8) {
      if(message) message.classList.add('err');
      document.getElementById('errMsg').style.display = 'block';
      isValid = false;
    } else {
      if(message) message.classList.remove('err');
      document.getElementById('errMsg').style.display = 'none';
    }
    
    if(!isValid) {
      showToast('Por favor completa todos los campos requeridos correctamente.');
      return;
    }

    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Enviando...';

    const serviceText = service && service.selectedIndex > 0 ? service.options[service.selectedIndex].text : '';
    const budgetText = budget && budget.selectedIndex > 0 ? budget.options[budget.selectedIndex].text : '';
    const companyText = company ? company.value.trim() : '';
    
    const extra = [
      serviceText ? `Servicio: ${serviceText}` : '',
      budgetText ? `Presupuesto: ${budgetText}` : '',
      companyText ? `Empresa: ${companyText}` : ''
    ].filter(Boolean).join(' | ');
    
    const fullMessage = extra ? `${message.value.trim()}\n\n${extra}` : message.value.trim();

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    fetch(NXS.CONTACT_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({
        name: name.value.trim(),
        email: email.value.trim(),
        message: fullMessage
      }),
      signal: controller.signal
    })
    .then(res => {
      clearTimeout(timeoutId);
      if(!res.ok){ throw new Error('Error'); }
      showToast('Mensaje enviado. Gracias.');
      form.reset();
      form.querySelectorAll('input, textarea').forEach(f => f.classList.remove('err'));
    })
    .catch(err => {
      clearTimeout(timeoutId);
      if(err.name === 'AbortError'){
        showToast('Tiempo agotado. Intenta de nuevo.');
      } else {
        showToast('No se pudo enviar. Intenta de nuevo.');
      }
    })
    .finally(() => {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Enviar mensaje';
    });
  });
}

function bindComments(){
  const form = document.getElementById('commentForm');
  const list = document.getElementById('commentList');
  if(!form || !list){ return; }
  const stored = JSON.parse(localStorage.getItem('nxs_comments') || '[]');

  function validateField(input){
    const field = input.closest('.field');
    if(!field) return false;
    
    const value = input.value.trim();
    let isValid = false;
    const id = input.id;
    
    if(id === 'commentName'){
      isValid = value.length >= 2;
    } else if(id === 'commentText'){
      isValid = value.length >= 4;
    }
    
    if(isValid){
      input.classList.remove('err');
    } else {
      input.classList.add('err');
    }
    return isValid;
  }

  // Add real-time validation
  form.querySelectorAll('#commentName, #commentText').forEach(input => {
    input.addEventListener('blur', () => validateField(input));
  });

  function render(){
    list.innerHTML = '';
    stored.slice(-6).reverse().forEach(c => {
      const div = document.createElement('div');
      div.className = 'comment';
      div.innerHTML = `<b>${c.name}</b><div class="muted">${c.text}</div>`;
      list.appendChild(div);
    });
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('commentName');
    const text = document.getElementById('commentText');
    
    const okName = validateField(name);
    const okText = validateField(text);
    
    if(!(okName && okText)){
      showToast('Por favor completa todos los campos.');
      return;
    }
    
    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Enviando...';
    
    stored.push({ name: name.value.trim(), text: text.value.trim() });
    localStorage.setItem('nxs_comments', JSON.stringify(stored));
    form.reset();
    form.querySelectorAll('input, textarea').forEach(f => f.classList.remove('err'));
    render();
    showToast('Comentario enviado');

    fetch(NXS.CONTACT_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({
        name: name.value.trim(),
        email: 'comentario@nexuss.local',
        message: `Nuevo comentario:\n${text.value.trim()}`
      })
    }).catch(() => {}).finally(() => {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Enviar comentario';
    });
  });

  render();
}

function bindApiStatus(){
  const el = document.getElementById('apiStatus');
  if(!el || !NXS.API_BASE){ return; }
  fetch(NXS.API_BASE + '/api/health')
    .then(res => {
      if(!res.ok){ throw new Error('offline'); }
      const lang = getLang();
      el.innerHTML = lang === 'en' ? '<b>Server:</b> Online' : '<b>Servidor:</b> En línea';
    })
    .catch(() => {
      const lang = getLang();
      el.innerHTML = lang === 'en' ? '<b>Server:</b> Offline' : '<b>Servidor:</b> Sin conexión';
    });
}

function bindStarfield(){
  const canvas = document.createElement('canvas');
  canvas.className = 'starfield';
  document.body.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  let w = 0, h = 0, particles = [], bgStars = [], rot = 0;

  // ── Background stars (scattered, small, stationary) ──
  function buildBgStars(){
    bgStars = Array.from({ length: 220 }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: (0.3 + Math.random() * 0.9) * devicePixelRatio,
      a: 0.1 + Math.random() * 0.5,
      tw: Math.random() * Math.PI * 2,
      ts: 0.005 + Math.random() * 0.015
    }));
  }

  // ── Spiral galaxy particles ──
  function buildGalaxy(){
    particles = [];
    const ARMS     = 3;
    const PER_ARM  = 900;
    const TWIST    = 3.8;   // how much each arm spirals
    const maxR     = Math.min(w, h) * 0.42;

    for(let arm = 0; arm < ARMS; arm++){
      const armBase = (arm / ARMS) * Math.PI * 2;
      for(let i = 0; i < PER_ARM; i++){
        const t      = i / PER_ARM;
        const r      = t * maxR;
        const theta  = armBase + t * TWIST * Math.PI;
        const spread = r * 0.13 * (Math.random() - 0.5) * 2;
        const perp   = theta + Math.PI / 2;
        const x      = r * Math.cos(theta) + spread * Math.cos(perp);
        const y      = r * Math.sin(theta) + spread * Math.sin(perp);

        // Color: warm white core → cyan → blue → deep purple outer
        let col, sz, alpha;
        if(t < 0.12){
          col = [255, 245, 210]; sz = (1.6 + Math.random() * 1.4); alpha = 0.7 + Math.random() * 0.3;
        } else if(t < 0.35){
          col = [140, 190, 255]; sz = (1.1 + Math.random() * 1.0); alpha = 0.5 + Math.random() * 0.35;
        } else if(t < 0.65){
          col = [80, 100, 230];  sz = (0.7 + Math.random() * 0.8); alpha = 0.35 + Math.random() * 0.3;
        } else {
          col = [65, 45, 185];   sz = (0.4 + Math.random() * 0.6); alpha = 0.2 + Math.random() * 0.25;
        }

        particles.push({
          x, y, col,
          sz: sz * devicePixelRatio,
          alpha,
          tw: Math.random() * Math.PI * 2,
          ts: 0.008 + Math.random() * 0.016
        });
      }
    }

    // Outer halo — loose stars around the disk
    for(let i = 0; i < 350; i++){
      const r     = maxR * (0.4 + Math.random() * 0.9);
      const theta = Math.random() * Math.PI * 2;
      particles.push({
        x: r * Math.cos(theta),
        y: r * Math.sin(theta),
        col: [110, 150, 255],
        sz: (0.3 + Math.random() * 0.7) * devicePixelRatio,
        alpha: 0.08 + Math.random() * 0.3,
        tw: Math.random() * Math.PI * 2,
        ts: 0.004 + Math.random() * 0.012
      });
    }
  }

  function resize(){
    w = canvas.width  = window.innerWidth  * devicePixelRatio;
    h = canvas.height = window.innerHeight * devicePixelRatio;
    canvas.style.width  = window.innerWidth  + 'px';
    canvas.style.height = window.innerHeight + 'px';
    buildBgStars();
    buildGalaxy();
  }

  function draw(){
    ctx.clearRect(0, 0, w, h);

    // ── Background stars ──
    for(const s of bgStars){
      s.tw += s.ts;
      const a = Math.max(0, s.a + Math.sin(s.tw) * 0.1);
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(200,215,255,${a})`;
      ctx.fill();
    }

    // Galaxy center on screen
    const cx = w * 0.5;
    const cy = h * 0.50;
    const TILT = 0.33; // Y-axis compression for 3D tilt

    rot += 0.00025; // very slow rotation
    const cosR = Math.cos(rot), sinR = Math.sin(rot);

    // ── Outer glow layers ──
    for(let g = 4; g >= 1; g--){
      const gr = 110 * g * devicePixelRatio;
      const gl = ctx.createRadialGradient(cx, cy, 0, cx, cy, gr);
      gl.addColorStop(0,   `rgba(120,80,255,${0.055/g})`);
      gl.addColorStop(0.4, `rgba(60,80,200,${0.035/g})`);
      gl.addColorStop(1,   'rgba(0,0,0,0)');
      ctx.fillStyle = gl;
      ctx.beginPath();
      ctx.ellipse(cx, cy, gr, gr * TILT, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // ── Galaxy particles ──
    for(const p of particles){
      p.tw += p.ts;
      const alpha = Math.max(0, Math.min(1, p.alpha + Math.sin(p.tw) * 0.12));

      // Rotate around galaxy center
      const rx = p.x * cosR - p.y * sinR;
      const ry = p.x * sinR + p.y * cosR;

      // 3-D tilt: compress Y
      const sx = cx + rx;
      const sy = cy + ry * TILT;

      const [r, g, b] = p.col;
      ctx.beginPath();
      ctx.arc(sx, sy, p.sz, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`;
      ctx.fill();
    }

    // ── Bright core ──
    const core = ctx.createRadialGradient(cx, cy, 0, cx, cy, 28 * devicePixelRatio);
    core.addColorStop(0,   'rgba(255,250,220,1)');
    core.addColorStop(0.15,'rgba(220,200,255,0.85)');
    core.addColorStop(0.4, 'rgba(120,80,255,0.4)');
    core.addColorStop(1,   'rgba(0,0,0,0)');
    ctx.fillStyle = core;
    ctx.beginPath();
    ctx.arc(cx, cy, 28 * devicePixelRatio, 0, Math.PI * 2);
    ctx.fill();

    // ── Core spike rays (like the reference image) ──
    ctx.save();
    ctx.globalAlpha = 0.25;
    ctx.strokeStyle = 'rgba(220,200,255,0.6)';
    ctx.lineWidth = 1.2 * devicePixelRatio;
    for(let i = 0; i < 4; i++){
      const a = (i / 4) * Math.PI + rot * 2;
      const len = 60 * devicePixelRatio;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * 4, cy + Math.sin(a) * 4 * TILT);
      ctx.lineTo(cx + Math.cos(a) * len, cy + Math.sin(a) * len * TILT);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx - Math.cos(a) * 4, cy - Math.sin(a) * 4 * TILT);
      ctx.lineTo(cx - Math.cos(a) * len, cy - Math.sin(a) * len * TILT);
      ctx.stroke();
    }
    ctx.restore();

    requestAnimationFrame(draw);
  }

  resize();
  window.addEventListener('resize', resize);
  draw();
}

document.documentElement.classList.add('js');

/* ══════════════════════════════════════════
   CINEMATIC INTRO — only fires on index.html
   ══════════════════════════════════════════ */
function bindCinematicIntro() {
  const path = window.location.pathname;
  const isIndex = path === '/' || path.endsWith('/index.html') || path.endsWith('\\index.html') || path === '';
  if (!isIndex) return;

  const W = window.innerWidth, H = window.innerHeight;

  // ── Build floating data particles ──
  const particleData = ['01','10','NX','AI','//','{}','<>','[]','0x','SYS','NET','API','IA','4.2'];
  const particleHtml = Array.from({length:18}, (_,i) => {
    const x = Math.random()*90+2, bot = Math.random()*40+5;
    const spd = (Math.random()*3+3).toFixed(1), delay = (Math.random()*4).toFixed(1);
    const dx = (Math.random()*40-20).toFixed(0);
    const txt = particleData[i % particleData.length];
    return `<div class="intro-particle" style="left:${x}%;bottom:${bot}%;--spd:${spd}s;--delay:${delay}s;--dx:${dx}px">${txt}</div>`;
  }).join('');

  // ── Waveform bars ──
  const waveHtml = Array.from({length:22}, (_,i) => {
    const h = (Math.random()*22+4).toFixed(0), d = ((i*0.07)+Math.random()*0.3).toFixed(2);
    return `<span style="--h:${h}px;--d:${d}s"></span>`;
  }).join('');

  // ── Radar blips ──
  const blips = [
    {t:'28%',l:'58%',delay:'0s'},{t:'62%',l:'34%',delay:'.7s'},{t:'44%',l:'74%',delay:'1.3s'}
  ].map(b=>`<div class="radar-blip" style="top:${b.t};left:${b.l};animation-delay:${b.delay}"></div>`).join('');

  const intro = document.createElement('div');
  intro.id = 'nxs-intro';
  intro.innerHTML = `
    <div class="intro-crt"></div>
    <div class="intro-hexgrid"></div>
    <div class="intro-grid"></div>
    <div class="intro-orb"></div>
    <div class="intro-scanbeam"></div>
    <div class="intro-corner tl"></div>
    <div class="intro-corner tr"></div>
    <div class="intro-corner bl"></div>
    <div class="intro-corner br"></div>

    <!-- HUD panels -->
    <div class="intro-hud intro-hud-tl">
      <div>SYS: NEXUSS-OS v4.2</div>
      <div>NET: <span class="hl">ENCRYPTED</span></div>
      <div>AI: <span class="hl">JARVIS ACTIVE</span></div>
      <div id="hudTime">TIME: --:--:--</div>
    </div>
    <div class="intro-hud intro-hud-tr">
      <div>AUTH: <span class="hl">REQUIRED</span></div>
      <div>LAT: 18.7357° N</div>
      <div>LON: 70.1627° W</div>
      <div>STATUS: <span class="hl">SCANNING</span></div>
    </div>
    <div class="intro-hud intro-hud-br">
      <div>NEXUSS X SYSTEMS</div>
      <div>LATAM · GLOBAL</div>
      <div>© 2026</div>
    </div>

    <!-- Radar -->
    <div class="intro-radar">
      <div class="radar-ring"></div>
      <div class="radar-ring r2"></div>
      <div class="radar-ring r3"></div>
      <div class="radar-sweep"></div>
      ${blips}
    </div>

    <!-- Floating data particles -->
    ${particleHtml}

    <!-- Waveform -->
    <div class="intro-waveform">${waveHtml}</div>

    <div class="intro-content">
      <div class="intro-badge">Portal de acceso · Nexuss X Systems</div>
      <div class="intro-logo-wrap">
        <div class="intro-ring-3"></div>
        <div class="intro-ring-2"></div>
        <div class="intro-ring"></div>
        <div class="intro-core">NX</div>
      </div>
      <div class="intro-wordmark" id="introWordmark">NEXUSS <em>X</em> SYSTEMS</div>
      <div class="intro-tagline">Soluciones digitales de alto impacto</div>
      <div class="intro-divider"></div>
      <div class="intro-status" id="introStatus">■ Inicializando sistema...</div>
      <div class="intro-bar-wrap"><div class="intro-bar-fill" id="introBarFill"></div></div>
      <div style="display:flex;gap:10px;justify-content:center;margin-top:4px">
        <button class="intro-skip" id="introSkip">OMITIR ›</button>
        <button class="intro-skip" id="introVoiceBtn" style="background:rgba(0,255,136,0.08);border-color:rgba(0,255,136,0.35);color:#00ff88">🔊 OÍR A JARVIS</button>
      </div>
    </div>
  `;
  document.body.prepend(intro);
  document.body.style.overflow = 'hidden';

  // ── Voice button triggers Jarvis ──
  const voiceBtn = intro.querySelector('#introVoiceBtn');
  if (voiceBtn) {
    voiceBtn.addEventListener('click', () => {
      speakJarvis();
      voiceBtn.style.opacity = '0.4';
      voiceBtn.disabled = true;
    });
  }

  // ── HUD clock ──
  const hudTime = intro.querySelector('#hudTime');
  const clockTimer = setInterval(() => {
    const n = new Date();
    const pad = x => String(x).padStart(2,'0');
    if (hudTime) hudTime.textContent = `TIME: ${pad(n.getHours())}:${pad(n.getMinutes())}:${pad(n.getSeconds())}`;
  }, 1000);

  // ── Binary rain canvas ──
  const rainCanvas = document.createElement('canvas');
  rainCanvas.className = 'intro-rain';
  rainCanvas.width = W; rainCanvas.height = H;
  intro.insertBefore(rainCanvas, intro.querySelector('.intro-content'));
  const rc = rainCanvas.getContext('2d');
  const COLS = Math.floor(W / 16);
  const drops = Array.from({length: COLS}, () => Math.random() * -60);
  const CHARS = '01アクセスNEXUSS10システム∑∆∂∫JARVIS';
  let rainOn = true;
  (function rain() {
    if (!rainOn) return;
    rc.fillStyle = 'rgba(2,5,16,0.07)';
    rc.fillRect(0, 0, W, H);
    rc.font = '12px monospace';
    drops.forEach((y, i) => {
      const bright = Math.random() > 0.5;
      rc.fillStyle = bright ? `rgba(0,255,136,0.9)` : `rgba(0,212,255,${Math.random() > 0.6 ? 0.7 : 0.2})`;
      rc.fillText(CHARS[Math.floor(Math.random() * CHARS.length)], i * 16, y * 16);
      drops[i] += 0.6;
      if (drops[i] * 16 > H) drops[i] = Math.random() * -60;
    });
    requestAnimationFrame(rain);
  })();

  // ── Typewriter status messages ──
  const statuses = [
    { text: '■ Inicializando sistema...', color: 'rgba(0,212,255,0.7)' },
    { text: '■ Cargando módulos de IA...', color: 'rgba(0,212,255,0.7)' },
    { text: '■ Verificando credenciales...', color: 'rgba(0,212,255,0.7)' },
    { text: '■ Calibrando núcleo JARVIS...', color: 'rgba(0,212,255,0.7)' },
    { text: '✔ ACCESO CONCEDIDO — BIENVENIDO', color: '#00ff88' }
  ];
  let sIdx = 0;
  const statusEl = intro.querySelector('#introStatus');
  const barFill = intro.querySelector('#introBarFill');

  function typeStatus(msg, color, cb) {
    if (!statusEl) return cb && cb();
    statusEl.textContent = '';
    statusEl.style.color = color;
    if (color === '#00ff88') statusEl.style.textShadow = '0 0 14px rgba(0,255,136,0.9)';
    let ci = 0;
    const t = setInterval(() => {
      statusEl.textContent += msg[ci++];
      playKeyClick();
      if (ci >= msg.length) { clearInterval(t); if(cb) setTimeout(cb, 200); }
    }, 28);
  }

  function advanceStatus() {
    if (sIdx >= statuses.length) return;
    const { text, color } = statuses[sIdx];
    const progress = ((sIdx+1) / statuses.length * 100).toFixed(0);
    if (barFill) barFill.style.width = progress + '%';
    typeStatus(text, color, () => {
      sIdx++;
      if (sIdx < statuses.length) setTimeout(advanceStatus, 600);
    });
  }
  setTimeout(advanceStatus, 400);

  // ── Jarvis voice at 1.8s ──
  setTimeout(speakJarvis, 1800);

  // ── Intro sweep sound ──
  NXSMusic.startIntro();

  // ── Alert flash at 2s ──
  setTimeout(() => {
    intro.style.transition = 'filter .08s';
    intro.style.filter = 'brightness(1.3)';
    setTimeout(() => { intro.style.filter = ''; }, 80);
  }, 2000);

  function exitIntro() {
    rainOn = false;
    clearInterval(clockTimer);
    NXSMusic.endIntro();
    intro.classList.add('exiting');
    document.body.style.overflow = '';

    function doNavigate() {
      // Detener voz sintética si estaba activa como fallback
      try { window.speechSynthesis && window.speechSynthesis.cancel(); } catch(_){}
      intro.remove();
      if (window.__nxsRedirectHome) {
        window.location.href = 'home.html';
        return;
      }
      if (sessionStorage.getItem('nxs_music') !== 'off') {
        setTimeout(() => NXSMusic.startSite(), 600);
      }
    }

    setTimeout(() => {
      // Si el audio todavía está reproduciendo, esperar a que termine (máx 5s extra)
      const voiceActive = () => {
        if (window._introAudio && !window._introAudio.ended && !window._introAudio.paused) return true;
        if (window.speechSynthesis && window.speechSynthesis.speaking) return true;
        return false;
      };

      if (voiceActive()) {
        let waited = 0;
        const poll = setInterval(() => {
          waited += 100;
          if (!voiceActive() || waited >= 5000) {
            clearInterval(poll);
            doNavigate();
          }
        }, 100);
      } else {
        doNavigate();
      }
    }, 860);
  }

  const skipBtn = intro.querySelector('#introSkip');
  if (skipBtn) skipBtn.addEventListener('click', exitIntro);
  setTimeout(exitIntro, 12000);
}

/* ══════════════════════════════════════════
   ANIMATED COUNTER for stats sections
   ══════════════════════════════════════════ */
function bindCounters() {
  const counters = document.querySelectorAll('[data-counter]');
  if (counters.length === 0) return;
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const target = parseInt(el.getAttribute('data-counter'), 10);
      const suffix = el.getAttribute('data-suffix') || '';
      const prefix = el.getAttribute('data-prefix') || '';
      const duration = 1800;
      const startTime = performance.now();
      function tick(now) {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const ease = 1 - Math.pow(1 - progress, 3);
        el.textContent = prefix + Math.floor(ease * target) + suffix;
        if (progress < 1) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
      observer.unobserve(el);
    });
  }, { threshold: 0.5 });
  counters.forEach(el => observer.observe(el));
}

/* ══════════════════════════════════════════
   TYPING CLICK SOUND — Web Audio, no external files
   Short white-noise burst + highpass = mechanical key click
   ══════════════════════════════════════════ */
let _typingAC = null;
function _getTypingAC() {
  if (_typingAC && _typingAC.state !== 'closed') return _typingAC;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  _typingAC = new AC();
  return _typingAC;
}
function playKeyClick(vol = 0.13) {
  const ac = _getTypingAC();
  if (!ac) return;
  if (ac.state === 'suspended') ac.resume();
  const len = Math.floor(ac.sampleRate * 0.022);
  const buf = ac.createBuffer(1, len, ac.sampleRate);
  const d   = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 5);
  const src = ac.createBufferSource();
  src.buffer = buf;
  const hp = ac.createBiquadFilter();
  hp.type = 'highpass'; hp.frequency.value = 1400;
  const g = ac.createGain(); g.gain.value = vol;
  src.connect(hp); hp.connect(g); g.connect(ac.destination);
  src.start();
}

/* ══════════════════════════════════════════
   JARVIS VOICE
   Pipeline: ElevenLabs API → Web Audio (robot FX)
   Fallback: Web Speech API
   ══════════════════════════════════════════ */

const JARVIS_TEXT = 'Hola, soy Jarvis, tu asistente de inteligencia artificial personal. Bienvenido a Nexuss eks Systems.';

// ElevenLabs voice IDs (multilingual v2 — speak Spanish natively)
// Cristina Campos: voz descargada desde ElevenLabs Voice Library
// Para obtener el voice_id: elevenlabs.io > Voices > Cristina Campos > ... > Copy voice ID
const EL_VOICE_ID  = 'nTkjq09AuYgsNR8E4sDe'; // Cristina Campos — Natural Conversations
const EL_MODEL     = 'eleven_multilingual_v2';

/* Apply robotic audio FX to an HTMLAudioElement via Web Audio API */
function applyRobotFX(audioEl) {
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    const ac  = new AC();
    const src = ac.createMediaElementSource(audioEl);

    // 1. Subtle overdrive (metallic texture)
    const wave = ac.createWaveShaper();
    const curve = new Float32Array(256);
    for (let i = 0; i < 256; i++) {
      const x = (i * 2) / 256 - 1;
      curve[i] = (Math.PI + 120) * x / (Math.PI + 120 * Math.abs(x));
    }
    wave.curve = curve;

    // 2. Bandpass filter (AI radio effect — wider band for clarity)
    const bp = ac.createBiquadFilter();
    bp.type = 'bandpass'; bp.frequency.value = 2000; bp.Q.value = 0.5;

    // 3. Reverb (medium room — more presence)
    const conv = ac.createConvolver();
    const len  = ac.sampleRate * 0.6;
    const buf  = ac.createBuffer(2, len, ac.sampleRate);
    for (let c = 0; c < 2; c++) {
      const d = buf.getChannelData(c);
      for (let i = 0; i < len; i++) d[i] = (Math.random()*2-1) * Math.pow(1-i/len,2.0) * 0.22;
    }
    conv.buffer = buf;
    const convGain = ac.createGain(); convGain.gain.value = 0.45;

    // 4. Subtle delay echo (sci-fi AI feel)
    const delay = ac.createDelay(0.12);
    delay.delayTime.value = 0.07;
    const delayGain = ac.createGain(); delayGain.gain.value = 0.18;

    // 5. Master gain
    const master = ac.createGain(); master.gain.value = 1.15;

    // Chain: src → wave → bp → master → destination
    //              ├────────────────→ conv → convGain → master
    //              └────────────────→ delay → delayGain → master
    src.connect(wave); wave.connect(bp); bp.connect(master);
    src.connect(conv); conv.connect(convGain); convGain.connect(master);
    bp.connect(delay); delay.connect(delayGain); delayGain.connect(master);
    master.connect(ac.destination);

    if (ac.state === 'suspended') ac.resume();
  } catch(e) { /* silently skip FX if unsupported */ }
}

/* ElevenLabs TTS — returns promise that resolves when done speaking */
async function speakElevenLabs(text) {
  const key = NXS.ELEVENLABS_KEY;
  if (!key) throw new Error('no-key');

  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${EL_VOICE_ID}/stream`, {
    method: 'POST',
    headers: {
      'Accept': 'audio/mpeg',
      'Content-Type': 'application/json',
      'xi-api-key': key
    },
    body: JSON.stringify({
      text,
      model_id: EL_MODEL,
      voice_settings: { stability: 0.50, similarity_boost: 0.85, style: 0.38, use_speaker_boost: true }
    })
  });

  if (!res.ok) throw new Error('el-api-error');

  const blob = await res.blob();
  const url  = URL.createObjectURL(blob);
  const audio = new Audio(url);
  audio.volume = 0.95;
  applyRobotFX(audio);

  return new Promise((resolve, reject) => {
    audio.onended = () => { URL.revokeObjectURL(url); resolve(); };
    audio.onerror = reject;
    audio.play().catch(reject);
  });
}

/* Web Speech API fallback
   Prioriza voces neurales de Microsoft Edge (Windows 11)
   que suenan casi como IA real sin ninguna API externa */
function speakWebSpeech() {
  if (!window.speechSynthesis) return;

  const fullText = 'Hola, soy Jarvis, tu asistente de inteligencia artificial personal. Bienvenido a Nexuss eks Systems.';

  function pickVoice(voices) {
    // Prioridad 1: Voces neurales Microsoft Edge (Windows 11) — suenan increíble
    return voices.find(v => v.name === 'Microsoft Raúl Online (Natural) - Spanish (Mexico)')
      || voices.find(v => v.name === 'Microsoft Alvaro Online (Natural) - Spanish (Spain)')
      || voices.find(v => v.name === 'Microsoft Jorge - Spanish (Spain)')
      || voices.find(v => v.name === 'Microsoft Pablo - Spanish (Spain)')
      || voices.find(v => v.name === 'Microsoft Rodrigo Online (Natural) - Spanish (Mexico)')
      || voices.find(v => /natural/i.test(v.name) && v.lang.startsWith('es'))
      || voices.find(v => v.name === 'Google español de Estados Unidos')
      || voices.find(v => v.name === 'Google español')
      || voices.find(v => /raúl|álvaro|jorge|pablo|rodrigo|diego|carlos|miguel/i.test(v.name) && v.lang.startsWith('es'))
      || voices.find(v => v.lang === 'es-MX' && !/mujer|female|sabina|mónica|dalia|paulina/i.test(v.name))
      || voices.find(v => v.lang === 'es-US' && !/mujer|female|sabina|mónica|dalia|paulina/i.test(v.name))
      || voices.find(v => v.lang.startsWith('es') && !/mujer|female|sabina|mónica|dalia|paulina/i.test(v.name))
      || voices.find(v => v.lang.startsWith('es'))
      || null;
  }

  function doSpeak(voices) {
    const voice = pickVoice(voices);
    const u = new SpeechSynthesisUtterance(fullText);
    u.lang   = voice ? voice.lang : 'es-MX';
    u.rate   = 0.92;
    u.pitch  = 0.72;
    u.volume = 1.0;
    if (voice) u.voice = voice;
    u.onerror = (e) => { if (e.error !== 'canceled') console.warn('Jarvis TTS error:', e.error); };
    speechSynthesis.cancel();
    try { if (speechSynthesis.paused) speechSynthesis.resume(); } catch(e){}
    speechSynthesis.speak(u);
  }

  const voices = speechSynthesis.getVoices();
  if (voices.length > 0) {
    doSpeak(voices);
  } else {
    speechSynthesis.addEventListener('voiceschanged', () => doSpeak(speechSynthesis.getVoices()), { once: true });
    setTimeout(() => { if (!speechSynthesis.speaking) doSpeak(speechSynthesis.getVoices()); }, 1500);
  }
}

/* Reproduce el archivo de voz local */
function speakLocalVoice() {
  return new Promise((resolve, reject) => {
    const audio = new Audio('./audio/jarvina-voz.mp3');
    audio.volume = 0.95;
    window._introAudio = audio; // expuesto para que exitIntro espere a que termine
    audio.onended = () => { window._introAudio = null; resolve(); };
    audio.onerror = () => { window._introAudio = null; reject(new Error('audio-load-failed')); };
    const p = audio.play();
    if (p && typeof p.catch === 'function') p.catch(err => { window._introAudio = null; reject(err); });
  });
}

/* Main entry point — prioridad: voz de Jarvina (jarvina-voz.mp3) → Web Speech */
function speakJarvis() {
  let started = false;

  async function run() {
    if (started) return;
    started = true;
    // Cancela cualquier voz activa antes de reproducir
    try { window.speechSynthesis && window.speechSynthesis.cancel(); } catch(_){}
    try {
      // Primero: la voz real (jarvina-voz.mp3)
      await speakLocalVoice();
    } catch(e) {
      // Fallback: Web Speech API
      speakWebSpeech();
    }
  }

  // Try immediately (works without gesture on Edge/Firefox)
  run();

  // Also fire on first user interaction (Chrome autoplay policy fix — Chrome blocks autoplay)
  ['pointerdown','touchstart','keydown'].forEach(evt =>
    document.addEventListener(evt, run, { once: true, passive: true })
  );
}

/* ══════════════════════════════════════════
   AMBIENT MUSIC ENGINE — Web Audio API
   ══════════════════════════════════════════ */
const NXSMusic = (() => {
  let ctx = null, master = null, sitePlaying = false;
  const nodes = [], timers = [];

  function boot() {
    if (ctx) return true;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0;
    master.connect(ctx.destination);
    return true;
  }

  function mkReverb(secs) {
    const conv = ctx.createConvolver();
    const len = ctx.sampleRate * secs;
    const buf = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c++) {
      const d = buf.getChannelData(c);
      for (let i = 0; i < len; i++) d[i] = (Math.random()*2-1) * Math.pow(1-i/len, 2);
    }
    conv.buffer = buf;
    return conv;
  }

  function osc(freq, type, gainVal, dest) {
    const o = ctx.createOscillator(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    o.type = type; o.frequency.value = freq;
    f.type = 'lowpass'; f.frequency.value = 300; f.Q.value = 1.5;
    g.gain.value = gainVal;
    o.connect(f); f.connect(g); g.connect(dest); o.start(); nodes.push(o);
  }

  function pad(freq, vol, dest) {
    const o = ctx.createOscillator(), lfo = ctx.createOscillator(), lg = ctx.createGain(), g = ctx.createGain();
    o.type = 'sine'; o.frequency.value = freq;
    lfo.frequency.value = 0.15; lg.gain.value = 0.8;
    g.gain.value = vol;
    lfo.connect(lg); lg.connect(o.frequency);
    o.connect(g); g.connect(dest); o.start(); lfo.start(); nodes.push(o, lfo);
  }

  function arp(notes, ms, vol, dest) {
    let idx = 0;
    const tick = () => {
      if (!sitePlaying) return;
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'triangle'; o.frequency.value = notes[idx++ % notes.length];
      g.gain.setValueAtTime(vol, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.7);
      o.connect(g); g.connect(dest); g.connect(master);
      o.start(); o.stop(ctx.currentTime + 0.8);
      timers.push(setTimeout(tick, ms));
    };
    timers.push(setTimeout(tick, 1800));
  }

  return {
    startIntro() {
      if (!boot()) return;
      if (ctx.state === 'suspended') ctx.resume();
      const o = ctx.createOscillator(), f = ctx.createBiquadFilter(), g = ctx.createGain();
      o.type = 'sawtooth';
      o.frequency.setValueAtTime(35, ctx.currentTime);
      o.frequency.linearRampToValueAtTime(180, ctx.currentTime + 3.5);
      f.type = 'lowpass'; f.frequency.value = 500;
      g.gain.setValueAtTime(0.14, ctx.currentTime);
      g.gain.linearRampToValueAtTime(0, ctx.currentTime + 5);
      o.connect(f); f.connect(g); g.connect(master);
      master.gain.setValueAtTime(0, ctx.currentTime);
      master.gain.linearRampToValueAtTime(0.55, ctx.currentTime + 1.2);
      o.start(); o.stop(ctx.currentTime + 5.5); nodes.push(o);
    },
    endIntro() {
      if (!ctx) return;
      master.gain.setValueAtTime(master.gain.value, ctx.currentTime);
      master.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.9);
    },
    startSite() {
      if (sitePlaying) return;
      if (!boot()) return;
      if (ctx.state === 'suspended') ctx.resume();
      sitePlaying = true;
      const rev = mkReverb(4), rg = ctx.createGain();
      rg.gain.value = 0.28; rev.connect(rg); rg.connect(master);
      osc(55, 'sawtooth', 0.042, rev);
      osc(110, 'sine', 0.028, rev);
      osc(82.4, 'sawtooth', 0.022, rev);
      pad(261.63, 0.024, rev); pad(329.63, 0.02, rev); pad(392, 0.016, rev);
      arp([440,523.25,659.25,783.99,880,659.25,523.25,392], 500, 0.065, rev);
      master.gain.setValueAtTime(0, ctx.currentTime);
      master.gain.linearRampToValueAtTime(0.4, ctx.currentTime + 3);
      sessionStorage.setItem('nxs_music', 'on');
    },
    stopSite() {
      if (!sitePlaying || !ctx) return;
      sitePlaying = false;
      master.gain.linearRampToValueAtTime(0, ctx.currentTime + 1.8);
      timers.forEach(clearTimeout); timers.length = 0;
      setTimeout(() => { nodes.forEach(n => { try{n.stop();}catch(e){} }); nodes.length = 0; }, 2500);
      sessionStorage.setItem('nxs_music', 'off');
    },
    toggle() { sitePlaying ? this.stopSite() : this.startSite(); return sitePlaying; },
    isPlaying() { return sitePlaying; }
  };
})();

/* ══════════════════════════════════════════
   MUSIC CONTROL FLOATING BUTTON
   ══════════════════════════════════════════ */
function bindMusicControl() {
  const btn = document.createElement('button');
  btn.id = 'nxs-music-btn';
  btn.title = 'Música ambiental';
  btn.innerHTML = '<span id="musicIcon">🔊</span>';
  document.body.appendChild(btn);

  btn.addEventListener('click', () => {
    if (NXSMusic.isPlaying()) {
      NXSMusic.stopSite();
      document.getElementById('musicIcon').textContent = '🔇';
      btn.classList.add('muted');
    } else {
      NXSMusic.startSite();
      document.getElementById('musicIcon').textContent = '🔊';
      btn.classList.remove('muted');
    }
  });

  // Auto-start on non-index pages if preference is on
  const path = window.location.pathname;
  const isIndex = path === '/' || path.endsWith('/index.html') || path.endsWith('\\index.html') || path === '';
  if (!isIndex && sessionStorage.getItem('nxs_music') !== 'off') {
    setTimeout(() => { NXSMusic.startSite(); }, 800);
  }
}

/* ══════════════════════════════════════════
   EXPANDABLE SERVICE LIST ITEMS
   ══════════════════════════════════════════ */
function bindExpandableList() {
  document.querySelectorAll('.service-list li').forEach(li => {
    const header = li.querySelector('.li-header');
    const infoEl = li.querySelector('.li-info');
    if (!header || !infoEl) return;
    li.addEventListener('click', () => {
      const isOpen = li.classList.contains('li-open');
      li.closest('.service-list').querySelectorAll('li.li-open').forEach(o => o.classList.remove('li-open'));
      if (!isOpen) li.classList.add('li-open');
    });
  });
}

/* ══════════════════════════════════════════
   CART BADGE (nav indicator)
   ══════════════════════════════════════════ */
function bindCartBadge() {
  function update() {
    document.querySelectorAll('.cart-nav-badge').forEach(badge => {
      const cart = JSON.parse(localStorage.getItem('nxs_cart') || '[]');
      const count = cart.reduce((s, i) => s + i.qty, 0);
      badge.textContent = count;
      badge.style.display = count > 0 ? 'inline-flex' : 'none';
    });
  }
  update();
  document.addEventListener('cartUpdated', update);
}

/* ══════════════════════════════════════════
   DARK / LIGHT MODE
   ══════════════════════════════════════════ */
function bindThemeToggle() {
  const saved = localStorage.getItem('nxs_theme') || 'dark';
  document.documentElement.setAttribute('data-theme', saved);
  document.body.setAttribute('data-theme', saved);

  const btn = document.createElement('button');
  btn.id = 'themeToggle';
  btn.title = 'Cambiar tema';
  btn.textContent = saved === 'dark' ? '☀️' : '🌙';
  document.body.appendChild(btn);

  btn.addEventListener('click', () => {
    const current = document.body.getAttribute('data-theme') || 'dark';
    const next = current === 'dark' ? 'light' : 'dark';
    document.body.setAttribute('data-theme', next);
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('nxs_theme', next);
    btn.textContent = next === 'dark' ? '☀️' : '🌙';
  });
}

/* ══════════════════════════════════════════
   PAGE TRANSITIONS (fade-in suave al cargar)
   ══════════════════════════════════════════ */
function bindPageTransitions() {
  document.documentElement.style.cssText += ';opacity:0;transition:opacity 0.2s ease';
  window.addEventListener('load', () => {
    document.documentElement.style.opacity = '1';
  });
}

/* ══════════════════════════════════════════
   LEAD CAPTURE POPUP
   ══════════════════════════════════════════ */
function bindLeadPopup() {
  if (localStorage.getItem('nxs_lead_shown')) return;
  const page = location.pathname;
  if (page.includes('index') || page === '/' || page === '') return;

  const popup = document.createElement('div');
  popup.id = 'lead-popup';
  popup.innerHTML = `
    <button class="popup-close" id="leadClose">✕</button>
    <span class="popup-badge">✦ Oferta gratuita</span>
    <h3>¿Tu negocio necesita presencia digital?</h3>
    <p>Déjanos tu correo y recibe una <strong>auditoría gratuita</strong> de tu presencia online + propuesta personalizada.</p>
    <form id="leadForm">
      <input type="email" id="leadEmail" placeholder="tucorreo@empresa.com" required />
      <button type="submit" class="btn primary" style="width:100%;justify-content:center">Quiero mi auditoría gratis →</button>
    </form>
  `;
  document.body.appendChild(popup);

  const show = () => {
    popup.classList.add('show');
    localStorage.setItem('nxs_lead_shown', '1');
  };

  setTimeout(show, 30000);

  const exitHandler = e => {
    if (e.clientY <= 0) { show(); document.removeEventListener('mouseleave', exitHandler); }
  };
  document.addEventListener('mouseleave', exitHandler);

  document.getElementById('leadClose').addEventListener('click', () => popup.classList.remove('show'));

  document.getElementById('leadForm').addEventListener('submit', async e => {
    e.preventDefault();
    const email = document.getElementById('leadEmail').value;
    try {
      await fetch(NXS.CONTACT_ENDPOINT, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Lead capturado', email, message: 'Solicita auditoría gratuita desde popup' })
      });
    } catch(_) {}
    popup.innerHTML = `<div style="text-align:center;padding:10px"><div style="font-size:2rem">🎉</div><h3 style="margin:8px 0">¡Listo!</h3><p style="color:var(--muted);font-size:.88rem">Te contactaremos pronto con tu auditoría personalizada.</p></div>`;
    setTimeout(() => popup.classList.remove('show'), 3500);
  });
}

/* ══════════════════════════════════════════
   SHARED API HELPERS (usadas por nuevas páginas)
   ══════════════════════════════════════════ */
NXS.getToken = () => getToken() || '';
NXS.authHeaders = () => ({ 'Content-Type': 'application/json', 'Authorization': `Bearer ${NXS.getToken()}` });

NXS.apiGet = async (path) => {
  const r = await fetch(NXS.API_BASE + path, { headers: NXS.authHeaders() });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
};
NXS.apiPost = async (path, body) => {
  const r = await fetch(NXS.API_BASE + path, { method: 'POST', headers: NXS.authHeaders(), body: JSON.stringify(body) });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
};
NXS.apiPatch = async (path, body) => {
  const r = await fetch(NXS.API_BASE + path, { method: 'PATCH', headers: NXS.authHeaders(), body: JSON.stringify(body) });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
};
NXS.apiDelete = async (path) => {
  const r = await fetch(NXS.API_BASE + path, { method: 'DELETE', headers: NXS.authHeaders() });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
};

/* ══════════════════════════════════════════
   JARVIS AGENT — IA conversacional + TTS con énfasis
   ══════════════════════════════════════════ */

/* Parsea la respuesta del AI: extrae [link:href:label] y texto limpio */
function parseJarvisReply(raw) {
  const m = raw.match(/\[link:([^:\]]+):([^\]]+)\]/);
  const link = m ? { href: m[1].trim(), label: m[2].trim() } : null;
  // Preservar saltos de línea; solo colapsar espacios múltiples en la misma línea
  const text = raw.replace(/\[link:[^\]]+\]/g, '')
    .split('\n').map(l => l.replace(/[ \t]{2,}/g, ' ').trim()).join('\n')
    .replace(/\n{3,}/g, '\n\n').trim();
  return { text, link };
}

/* Llama al backend IA; si falla usa respuesta de emergencia local */
async function jarvisAskAI(message, history) {
  try {
    const res = await fetch(`${NXS.API_BASE}/api/jarvis`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, history: history.slice(-8) })
    });
    const data = await res.json();
    // El servidor siempre devuelve reply (con IA o con respuestas locales)
    if (data.reply) return parseJarvisReply(data.reply);
    throw new Error('no-reply');
  } catch(e) {
    return {
      text: 'No pude conectarme al servidor. Contáctanos directamente para ayudarte.',
      link: { href: 'contacto.html', label: 'Ir a contacto →' }
    };
  }
}

/* TTS con énfasis real:
   - Divide el texto en "..." → pausa de 340ms entre fragmentos
   - Palabras EN MAYÚSCULAS → rate ligeramente más lento en ese fragmento
   - ElevenLabs: usa el texto con comas donde había "..." */
function jarvisAgentSpeak(text) {
  const clean = text.replace(/\[link:[^\]]+\]/g, '').replace(/\n+/g, '. ').trim();
  const phonetic = clean
    .replace(/Nexuss X Systems/gi, 'Nexuss eks Systems')
    .replace(/\bX\b/g, 'eks');

  if (!phonetic) return;

  let started = false; // guard: evita doble disparo

  async function tryElevenLabs() {
    const elText = phonetic.replace(/\.\.\./g, ', ');
    await speakElevenLabs(elText);
  }

  function doWebSpeech(voices) {
    if (!window.speechSynthesis) return;
    const voice = voices.find(v => v.name === 'Microsoft Raúl Online (Natural) - Spanish (Mexico)')
      || voices.find(v => v.name === 'Microsoft Rodrigo Online (Natural) - Spanish (Mexico)')
      || voices.find(v => /natural/i.test(v.name) && v.lang.startsWith('es'))
      || voices.find(v => v.lang.startsWith('es')) || null;

    // Tomar solo la primera oración para no hablar demasiado largo
    const sentence = phonetic.split(/[.!?]/)[0].trim() || phonetic.substring(0, 120);

    if (!document.getElementById('nxs-intro')) {
      try { speechSynthesis.cancel(); } catch(_) {}
    }

    const u = new SpeechSynthesisUtterance(sentence);
    u.lang   = voice ? voice.lang : 'es-MX';
    u.rate   = 0.92;
    u.pitch  = 0.72;
    u.volume = 1.0;
    if (voice) u.voice = voice;
    u.onerror = (e) => { if (e.error !== 'canceled') console.warn('Jarvis TTS:', e.error); };
    try { speechSynthesis.speak(u); } catch(_) {}
  }

  function tryWebSpeech() {
    if (!window.speechSynthesis) return;
    const vs = speechSynthesis.getVoices();
    if (vs.length > 0) {
      doWebSpeech(vs);
    } else {
      // Voces aún cargando — esperar el evento
      speechSynthesis.addEventListener('voiceschanged',
        () => doWebSpeech(speechSynthesis.getVoices()), { once: true });
      // Safety timeout: si voiceschanged nunca llega, intentar igual
      setTimeout(() => doWebSpeech(speechSynthesis.getVoices()), 1000);
    }
  }

  async function trySpeak() {
    if (started) return;
    started = true;
    try {
      await tryElevenLabs();
    } catch(e) {
      tryWebSpeech();
    }
  }

  ['pointerdown','touchstart','keydown'].forEach(evt =>
    document.addEventListener(evt, trySpeak, { once: true, passive: true })
  );
  trySpeak();
}

function initJarvisAgent() {
  const btn = document.createElement('button');
  btn.id = 'jarvis-agent-btn';
  btn.title = 'Hablar con Jarvina';
  btn.innerHTML = '🤖<span class="jarvis-badge"></span>';
  document.body.appendChild(btn);

  const FAQ_QUESTIONS = [
    '¿Qué servicios ofrecen?',
    '¿Cuánto cuesta un sitio web?',
    '¿Cuánto tarda un proyecto?',
    '¿Cómo puedo contratar?',
  ];

  const panel = document.createElement('div');
  panel.id = 'jarvis-panel';
  panel.innerHTML = `
    <div class="jarvis-panel-header">
      <div class="jarvis-avatar">🤖</div>
      <div class="jarvis-panel-title">
        <strong>JARVINA</strong>
        <span>Nexuss eks Systems &middot; en línea</span>
      </div>
      <button class="jarvis-panel-close" title="Cerrar">✕</button>
    </div>
    <div class="jarvis-messages" id="jarvis-messages"></div>
    <div class="jarvis-faq-chips" id="jarvis-faq">
      ${FAQ_QUESTIONS.map(q => `<button class="jarvis-faq-chip">${q}</button>`).join('')}
    </div>
    <div class="jarvis-input-row">
      <input type="text" id="jarvis-input" placeholder="Escribe tu pregunta..." autocomplete="off" />
      <button id="jarvis-send">Enviar</button>
    </div>
  `;
  document.body.appendChild(panel);

  const msgs     = panel.querySelector('#jarvis-messages');
  const faqBar   = panel.querySelector('#jarvis-faq');
  const input    = panel.querySelector('#jarvis-input');
  const sendBtn  = panel.querySelector('#jarvis-send');
  const closeBtn = panel.querySelector('.jarvis-panel-close');
  const history  = [];
  let isSending  = false;

  function addMsg(text, from, link) {
    const d = document.createElement('div');
    d.className = `jarvis-msg ${from}`;
    // Renderizar saltos de línea y bullets como HTML
    d.innerHTML = text
      .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
      .replace(/\n/g,'<br>');
    if (link) {
      const br = document.createElement('br');
      const a  = document.createElement('a');
      a.href = link.href; a.textContent = link.label;
      a.style.cssText = 'color:#00ff88;font-size:.8rem;margin-top:4px;display:inline-block';
      d.appendChild(br);
      d.appendChild(a);
    }
    msgs.appendChild(d);
    msgs.scrollTop = msgs.scrollHeight;
  }

  function showTyping() {
    const t = document.createElement('div');
    t.className = 'jarvis-typing';
    t.innerHTML = '<span></span><span></span><span></span>';
    msgs.appendChild(t);
    msgs.scrollTop = msgs.scrollHeight;
    return t;
  }

  async function handleSend(overrideText) {
    const val = (overrideText || input.value).trim();
    if (!val || isSending) return;
    isSending = true;
    sendBtn.disabled = true;
    input.value = '';
    // Ocultar chips FAQ al primer envío
    if (faqBar) faqBar.style.display = 'none';

    addMsg(val, 'user');
    history.push({ from: 'user', text: val });

    const typing = showTyping();
    try {
      const { text, link } = await jarvisAskAI(val, history);
      typing.remove();
      addMsg(text, 'jarvis', link);
      history.push({ from: 'jarvis', text });
      jarvisAgentSpeak(text);
    } catch(e) {
      typing.remove();
    } finally {
      isSending = false;
      sendBtn.disabled = false;
      input.focus();
    }
  }

  sendBtn.addEventListener('click', () => handleSend());
  input.addEventListener('keydown', e => { if (e.key === 'Enter') handleSend(); });
  faqBar && faqBar.addEventListener('click', e => {
    const chip = e.target.closest('.jarvis-faq-chip');
    if (chip) handleSend(chip.textContent);
  });
  closeBtn.addEventListener('click', () => panel.classList.remove('open'));
  document.addEventListener('click', e => {
    if (!panel.contains(e.target) && e.target !== btn) panel.classList.remove('open');
  });

  btn.addEventListener('click', () => {
    const isOpen = panel.classList.toggle('open');
    if (isOpen && msgs.children.length === 0) {
      const welcome = 'Hola, soy Jarvina. Tu asistente de Nexuss eks Systems. ¿En qué puedo ayudarte hoy?';
      setTimeout(() => {
        addMsg(welcome, 'jarvis');
        history.push({ from: 'jarvis', text: welcome });
        // No hablar si el intro todavía está activo — evita cortarlo
        if (!document.getElementById('nxs-intro')) jarvisAgentSpeak(welcome);
      }, 180);
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  const lang = getLang();
  applyI18n(lang);
  bindLangToggle();
  bindCinematicIntro();
  requireAuthGate();
  bindNav();
  updateAdminLinks();
  bindLogin();
  bindReveal();
  bindProducts();
  bindPurchase();
  bindContact();
  bindAccordions();
  bindComments();
  bindApiStatus();
  bindStarfield();
  bindCounters();
  bindMusicControl();
  initJarvisAgent();
  bindExpandableList();
  bindCartBadge();
  bindThemeToggle();
  bindPageTransitions();
  bindLeadPopup();
  bindRipple();
  bindScrollProgress();
  bindInteractiveCards();
  bindMoreDropdown();
  html.classList.add('js');
});

/* ══════════════════════════════════════════
   DROPDOWN "MÁS" — global, sin scripts inline
   ══════════════════════════════════════════ */
function bindMoreDropdown() {
  const btn = document.getElementById('moreBtn');
  const drop = document.getElementById('moreDropdown');
  if (!btn || !drop) return;
  btn.addEventListener('click', e => { e.stopPropagation(); drop.classList.toggle('open'); });
  document.addEventListener('click', () => drop.classList.remove('open'));
  // Marcar activo el link del panel que corresponde a la página actual
  const curr = location.pathname.split('/').pop();
  drop.querySelectorAll('a[href]').forEach(a => {
    if (a.getAttribute('href') === curr) {
      a.style.color = 'var(--accent)';
      btn.style.color = 'var(--accent)';
      btn.style.borderColor = 'rgba(0,212,255,0.4)';
    }
  });
}

/* ══════════════════════════════════════════
   RIPPLE EN BOTONES
   ══════════════════════════════════════════ */
function bindRipple() {
  document.addEventListener('click', e => {
    const btn = e.target.closest('.btn');
    if (!btn) return;
    const ripple = document.createElement('span');
    const rect = btn.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    ripple.style.cssText = `
      position:absolute;border-radius:50%;pointer-events:none;
      width:${size}px;height:${size}px;
      left:${e.clientX - rect.left - size / 2}px;
      top:${e.clientY - rect.top - size / 2}px;
      background:rgba(255,255,255,0.25);
      transform:scale(0);animation:nxsRipple 0.5s ease-out forwards;
    `;
    btn.style.position = btn.style.position || 'relative';
    btn.style.overflow = 'hidden';
    btn.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);
  });
}

/* ══════════════════════════════════════════
   BARRA DE PROGRESO DE SCROLL
   ══════════════════════════════════════════ */
function bindScrollProgress() {
  const bar = document.createElement('div');
  bar.id = 'scroll-progress';
  bar.style.cssText = 'position:fixed;top:0;left:0;height:3px;z-index:9999;background:linear-gradient(90deg,#00d4ff,#7926ff);width:0%;transition:width 0.1s linear;pointer-events:none';
  document.body.appendChild(bar);
  window.addEventListener('scroll', () => {
    const pct = (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100;
    bar.style.width = Math.min(pct, 100) + '%';
  }, { passive: true });
}

/* ══════════════════════════════════════════
   TARJETAS INTERACTIVAS (efecto tilt)
   ══════════════════════════════════════════ */
function bindInteractiveCards() {
  document.querySelectorAll('.why-card, .service-card-v2, .process-card, .portfolio-card').forEach(card => {
    card.addEventListener('mousemove', e => {
      const rect = card.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width - 0.5) * 12;
      const y = ((e.clientY - rect.top) / rect.height - 0.5) * -12;
      card.style.transform = `perspective(600px) rotateX(${y}deg) rotateY(${x}deg) translateY(-4px)`;
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  });
}






