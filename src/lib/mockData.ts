export type Agency = {
  id: string;
  name: string;
};

export type Client = {
  id: string;
  name: string;
  agencyId: string;
};

export type Campaign = {
  id: string;
  name: string;
  objective: string;
  language: string;
  clientId: string;
  agencyId: string;
  status: 'active' | 'draft' | 'planned' | 'completed';
  createdAt: string;
};

export type PostStatus = 'generated' | 'draft' | 'approved' | 'published' | 'edited';

export type Post = {
  id: string;
  title: string;
  content: string;
  platform: 'facebook' | 'instagram' | 'twitter' | 'linkedin';
  scheduledDate: string;
  week: 1 | 2 | 3 | 4;
  status: PostStatus;
  hashtags?: string;
  link?: string;
};

export type MonthlyPlan = {
  id: string;
  campaignId: string;
  month: string;
  posts: Post[];
  approved: boolean;
};

// Mock data – DO NOT use mockAgencies or mockClients for tenant/agency/client UI.
// Use AppContext (agency, clients, selectedClientId) and API data only for multi-tenant behavior.
export const mockAgencies: Agency[] = [
  { id: 'ag1', name: 'Agencia Demo XYZ' },
  { id: 'ag2', name: 'Creative Marketing Co' },
];

export const mockClients: Client[] = [
  { id: 'cl1', name: 'Restaurante La Terraza', agencyId: 'ag1' },
  { id: 'cl2', name: 'Clínica Nova', agencyId: 'ag1' },
  { id: 'cl3', name: 'Hotel Río', agencyId: 'ag1' },
  { id: 'cl4', name: 'Food Delivery App', agencyId: 'ag2' },
];

// UI-only placeholder until dashboard has real campaigns API. Filter by real agency/client yields empty for real tenants.
export const mockCampaigns: Campaign[] = [
  {
    id: 'camp1',
    name: 'Promoción Verano 2026',
    objective: 'Aumentar reservaciones',
    language: 'ES',
    clientId: 'cl1',
    agencyId: 'ag1',
    status: 'draft',
    createdAt: '2026-01-15',
  },
  {
    id: 'camp2',
    name: 'Menú Ejecutivo',
    objective: 'Branding',
    language: 'ES',
    clientId: 'cl1',
    agencyId: 'ag1',
    status: 'planned',
    createdAt: '2026-02-01',
  },
  {
    id: 'camp3',
    name: 'Spring Collection 2024',
    objective: 'Product awareness',
    language: 'EN',
    clientId: 'cl2',
    agencyId: 'ag1',
    status: 'active',
    createdAt: '2024-02-01',
  },
  {
    id: 'camp4',
    name: "Valentine's Day Promo",
    objective: 'Sales boost',
    language: 'EN',
    clientId: 'cl2',
    agencyId: 'ag1',
    status: 'completed',
    createdAt: '2024-01-10',
  },
];

export const mockMonthlyPlans: MonthlyPlan[] = [
  {
    id: 'plan1',
    campaignId: 'camp1',
    month: '2026-06',
    approved: false,
    posts: [
      {
        id: 'post1',
        title: 'Hook de temporada',
        content: '☀️ El verano ya llegó a La Terraza. Reserva tu mesa al aire libre y disfruta de nuestra nueva carta de temporada. ¡Te esperamos!',
        platform: 'instagram',
        scheduledDate: '2026-06-02',
        week: 1,
        status: 'generated',
      },
      {
        id: 'post2',
        title: 'Oferta limitada',
        content: '🍽️ Solo esta semana: 2x1 en cenas para empresas. Ideal para reuniones de equipo en un entorno único. Reserva ahora.',
        platform: 'linkedin',
        scheduledDate: '2026-06-04',
        week: 1,
        status: 'generated',
      },
      {
        id: 'post3',
        title: 'Testimonio cliente',
        content: '"La mejor experiencia gastronómica de la ciudad" — María G. ⭐⭐⭐⭐⭐ Descubre por qué nuestros clientes nos recomiendan.',
        platform: 'instagram',
        scheduledDate: '2026-06-09',
        week: 2,
        status: 'generated',
      },
      {
        id: 'post4',
        title: 'Menú del día',
        content: '🥗 Nuevo menú ejecutivo de verano: ensalada mediterránea, pescado a la plancha y postre de temporada. Reserva tu mesa.',
        platform: 'instagram',
        scheduledDate: '2026-06-11',
        week: 2,
        status: 'draft',
      },
      {
        id: 'post5',
        title: 'Evento especial',
        content: '🎶 Este viernes: Noche de jazz en La Terraza. Música en vivo, tapas premium y cócteles de autor. Plazas limitadas.',
        platform: 'instagram',
        scheduledDate: '2026-06-16',
        week: 3,
        status: 'generated',
      },
      {
        id: 'post6',
        title: 'Caso de éxito corporativo',
        content: 'Organizamos el evento de fin de trimestre para 50 personas de TechCorp. Descubre nuestros paquetes corporativos.',
        platform: 'linkedin',
        scheduledDate: '2026-06-18',
        week: 3,
        status: 'draft',
      },
      {
        id: 'post7',
        title: 'Receta del chef',
        content: '👨‍🍳 El Chef Ramírez comparte su secreto: la salsa chimichurri perfecta para acompañar nuestro corte estrella.',
        platform: 'instagram',
        scheduledDate: '2026-06-23',
        week: 4,
        status: 'generated',
      },
      {
        id: 'post8',
        title: 'Cierre de mes',
        content: '📊 Junio en números: +200 reservas, 4.8 ⭐ promedio, 15 eventos corporativos. Gracias por confiar en La Terraza.',
        platform: 'linkedin',
        scheduledDate: '2026-06-25',
        week: 4,
        status: 'generated',
      },
    ],
  },
];
