// Brazilian state capitals with pre-curated keywords and city-specific RSS feeds
// City-specific feeds dramatically reduce false positives vs filtering national feeds

export const BRAZIL_CAPITALS = [
  {
    id: 'sao-paulo', name: 'São Paulo', state: 'SP', short: 'SP',
    keywords: ['São Paulo', 'paulistano', 'paulistana', 'FIESP', 'PMSP', 'Grande SP',
      'metrô SP', 'CPTM', 'Sampa', 'capital paulista', 'Prefeitura SP',
      'Câmara de SP', 'Câmara Municipal de São Paulo', 'Governo SP',
      'zona norte', 'zona sul', 'zona leste', 'zona oeste', 'centro de SP',
      'ABC paulista', 'RMSP', 'Paulistão'],
    // G1 has a São Paulo specific feed
    feedOverrides: { g1: 'https://g1.globo.com/sao-paulo/rss/g1/sao-paulo.xml' },
  },
  {
    id: 'rio-de-janeiro', name: 'Rio de Janeiro', state: 'RJ', short: 'RJ',
    keywords: ['Rio de Janeiro', 'carioca', 'Prefeitura Rio', 'Grande Rio',
      'metrô Rio', 'SuperVia', 'capital fluminense', 'Câmara Rio',
      'Governo RJ', 'Zona Sul', 'Zona Norte', 'Zona Oeste', 'Baixada Fluminense'],
    feedOverrides: { g1: 'https://g1.globo.com/rj/rio-de-janeiro/rss/g1/rj/rio-de-janeiro.xml' },
  },
  {
    id: 'belo-horizonte', name: 'Belo Horizonte', state: 'MG', short: 'BH',
    keywords: ['Belo Horizonte', 'BH', 'belo-horizontino', 'Prefeitura BH',
      'capital mineira', 'Grande BH', 'RMBH', 'metrô BH', 'BHBUS', 'Câmara BH'],
    feedOverrides: { g1: 'https://g1.globo.com/mg/minas-gerais/rss/g1/mg.xml' },
  },
  {
    id: 'porto-alegre', name: 'Porto Alegre', state: 'RS', short: 'POA',
    keywords: ['Porto Alegre', 'POA', 'porto-alegrense', 'Prefeitura Porto Alegre',
      'capital gaúcha', 'Grande Porto Alegre', 'RMPA', 'Trensurb', 'Câmara POA'],
    feedOverrides: { g1: 'https://g1.globo.com/rs/rss/g1/rs.xml' },
  },
  {
    id: 'salvador', name: 'Salvador', state: 'BA', short: 'SSA',
    keywords: ['Salvador', 'soteropolitano', 'Prefeitura Salvador', 'capital baiana',
      'RMS', 'Câmara Salvador', 'Governo BA', 'metrô Salvador'],
    feedOverrides: { g1: 'https://g1.globo.com/ba/bahia/rss/g1/ba.xml' },
  },
  {
    id: 'fortaleza', name: 'Fortaleza', state: 'CE', short: 'FOR',
    keywords: ['Fortaleza', 'fortalezense', 'Prefeitura Fortaleza', 'capital cearense',
      'RMF', 'Câmara Fortaleza', 'Governo CE', 'metrô Fortaleza'],
    feedOverrides: { g1: 'https://g1.globo.com/ce/ceara/rss/g1/ce.xml' },
  },
  {
    id: 'brasilia', name: 'Brasília', state: 'DF', short: 'BSB',
    keywords: ['Brasília', 'brasiliense', 'GDF', 'Governo DF', 'Distrito Federal',
      'Plano Piloto', 'candango', 'CLDF', 'metrô DF', 'Ceilândia', 'Taguatinga'],
    feedOverrides: { g1: 'https://g1.globo.com/df/distrito-federal/rss/g1/df.xml' },
  },
  {
    id: 'manaus', name: 'Manaus', state: 'AM', short: 'MAO',
    keywords: ['Manaus', 'manauara', 'Prefeitura Manaus', 'capital amazonense',
      'Zona Franca', 'PIM', 'Governo AM', 'Câmara Manaus'],
    feedOverrides: { g1: 'https://g1.globo.com/am/amazonas/rss/g1/am.xml' },
  },
  {
    id: 'curitiba', name: 'Curitiba', state: 'PR', short: 'CWB',
    keywords: ['Curitiba', 'curitibano', 'Prefeitura Curitiba', 'capital paranaense',
      'RMC', 'URBS', 'Câmara Curitiba', 'Governo PR'],
    feedOverrides: { g1: 'https://g1.globo.com/pr/parana/rss/g1/pr.xml' },
  },
  {
    id: 'recife', name: 'Recife', state: 'PE', short: 'REC',
    keywords: ['Recife', 'recifense', 'Prefeitura Recife', 'capital pernambucana',
      'RMR', 'metrô Recife', 'Câmara Recife', 'Governo PE'],
    feedOverrides: { g1: 'https://g1.globo.com/pe/pernambuco/rss/g1/pe.xml' },
  },
  {
    id: 'goiania', name: 'Goiânia', state: 'GO', short: 'GYN',
    keywords: ['Goiânia', 'goianiense', 'Prefeitura Goiânia', 'capital goiana',
      'RMGO', 'Câmara Goiânia', 'Governo GO', 'Eixo Anhanguera'],
    feedOverrides: { g1: 'https://g1.globo.com/go/goias/rss/g1/go.xml' },
  },
  {
    id: 'belem', name: 'Belém', state: 'PA', short: 'BEL',
    keywords: ['Belém', 'belenense', 'Prefeitura Belém', 'capital paraense',
      'RMB', 'Câmara Belém', 'Governo PA'],
    feedOverrides: { g1: 'https://g1.globo.com/pa/para/rss/g1/pa.xml' },
  },
  {
    id: 'vitoria', name: 'Vitória', state: 'ES', short: 'VIX',
    keywords: ['Vitória', 'capixaba', 'Prefeitura Vitória', 'capital capixaba',
      'Grande Vitória', 'RMGV', 'Câmara Vitória', 'Governo ES'],
    feedOverrides: { g1: 'https://g1.globo.com/es/espirito-santo/rss/g1/es.xml' },
  },
  {
    id: 'natal', name: 'Natal', state: 'RN', short: 'NAT',
    keywords: ['Natal', 'natalense', 'Prefeitura Natal', 'capital potiguar',
      'Câmara Natal', 'Governo RN', 'Grande Natal'],
    feedOverrides: { g1: 'https://g1.globo.com/rn/rio-grande-do-norte/rss/g1/rn.xml' },
  },
  {
    id: 'florianopolis', name: 'Florianópolis', state: 'SC', short: 'FLN',
    keywords: ['Florianópolis', 'florianopolitano', 'Prefeitura Florianópolis',
      'capital catarinense', 'Ilha de SC', 'Câmara Florianópolis', 'Governo SC'],
    feedOverrides: { g1: 'https://g1.globo.com/sc/santa-catarina/rss/g1/sc.xml' },
  },
  {
    id: 'maceio', name: 'Maceió', state: 'AL', short: 'MCZ',
    keywords: ['Maceió', 'maceioense', 'Prefeitura Maceió', 'capital alagoana',
      'Câmara Maceió', 'Governo AL'],
    feedOverrides: { g1: 'https://g1.globo.com/al/alagoas/rss/g1/al.xml' },
  },
  {
    id: 'campo-grande', name: 'Campo Grande', state: 'MS', short: 'CGR',
    keywords: ['Campo Grande', 'campo-grandense', 'Prefeitura Campo Grande',
      'capital sul-mato-grossense', 'Câmara Campo Grande', 'Governo MS'],
    feedOverrides: { g1: 'https://g1.globo.com/ms/mato-grosso-do-sul/rss/g1/ms.xml' },
  },
  {
    id: 'cuiaba', name: 'Cuiabá', state: 'MT', short: 'CGB',
    keywords: ['Cuiabá', 'cuiabano', 'Prefeitura Cuiabá', 'capital mato-grossense',
      'Grande Cuiabá', 'Câmara Cuiabá', 'Governo MT'],
    feedOverrides: { g1: 'https://g1.globo.com/mt/mato-grosso/rss/g1/mt.xml' },
  },
  {
    id: 'joao-pessoa', name: 'João Pessoa', state: 'PB', short: 'JPA',
    keywords: ['João Pessoa', 'pessoense', 'Prefeitura João Pessoa', 'capital paraibana',
      'Câmara João Pessoa', 'Governo PB'],
    feedOverrides: { g1: 'https://g1.globo.com/pb/paraiba/rss/g1/pb.xml' },
  },
  {
    id: 'teresina', name: 'Teresina', state: 'PI', short: 'THE',
    keywords: ['Teresina', 'teresinense', 'Prefeitura Teresina', 'capital piauiense',
      'Câmara Teresina', 'Governo PI'],
    feedOverrides: { g1: 'https://g1.globo.com/pi/piaui/rss/g1/pi.xml' },
  },
  {
    id: 'aracaju', name: 'Aracaju', state: 'SE', short: 'AJU',
    keywords: ['Aracaju', 'aracajuano', 'Prefeitura Aracaju', 'capital sergipana',
      'Câmara Aracaju', 'Governo SE'],
    feedOverrides: { g1: 'https://g1.globo.com/se/sergipe/rss/g1/se.xml' },
  },
  {
    id: 'porto-velho', name: 'Porto Velho', state: 'RO', short: 'PVH',
    keywords: ['Porto Velho', 'porto-velhense', 'Prefeitura Porto Velho',
      'capital rondoniense', 'Câmara Porto Velho', 'Governo RO'],
    feedOverrides: { g1: 'https://g1.globo.com/ro/rondonia/rss/g1/ro.xml' },
  },
  {
    id: 'macapa', name: 'Macapá', state: 'AP', short: 'MCP',
    keywords: ['Macapá', 'macapaense', 'Prefeitura Macapá', 'capital amapaense',
      'Câmara Macapá', 'Governo AP'],
    feedOverrides: { g1: 'https://g1.globo.com/ap/amapa/rss/g1/ap.xml' },
  },
  {
    id: 'boa-vista', name: 'Boa Vista', state: 'RR', short: 'BVB',
    keywords: ['Boa Vista', 'boa-vistense', 'Prefeitura Boa Vista', 'capital roraimense',
      'Câmara Boa Vista', 'Governo RR'],
    feedOverrides: { g1: 'https://g1.globo.com/rr/roraima/rss/g1/rr.xml' },
  },
  {
    id: 'palmas', name: 'Palmas', state: 'TO', short: 'PMW',
    keywords: ['Palmas', 'palmense', 'Prefeitura Palmas', 'capital tocantinense',
      'Câmara Palmas', 'Governo TO'],
    feedOverrides: { g1: 'https://g1.globo.com/to/tocantins/rss/g1/to.xml' },
  },
  {
    id: 'rio-branco', name: 'Rio Branco', state: 'AC', short: 'RBR',
    keywords: ['Rio Branco', 'rio-branquense', 'Prefeitura Rio Branco', 'capital acreana',
      'Câmara Rio Branco', 'Governo AC'],
    feedOverrides: { g1: 'https://g1.globo.com/ac/acre/rss/g1/ac.xml' },
  },
  {
    id: 'sao-luis', name: 'São Luís', state: 'MA', short: 'SLZ',
    keywords: ['São Luís', 'são-luisense', 'Prefeitura São Luís', 'capital maranhense',
      'Câmara São Luís', 'Governo MA', 'Ilha de São Luís'],
    feedOverrides: { g1: 'https://g1.globo.com/ma/maranhao/rss/g1/ma.xml' },
  },
]

export function getCityById(id) {
  return BRAZIL_CAPITALS.find(c => c.id === id) || null
}
