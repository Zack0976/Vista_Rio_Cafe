const BASE_FEE = 5.0;
const PER_KM = 1.8;
const FREE_KM = 3;

// Tabela completa de Manaus para garantir que funcione mesmo se a API do CEP falhar
const neighborhoodTable = {
  // Ponta Negra e redondezas
  'ponta negra': 5.0,
  'taruma': 7.0,
  'tarumã': 7.0,
  'compensa': 8.0,
  'santo agostinho': 9.0,
  'dom pedro': 8.0,
  'nova cidade': 9.0,
  'redencao': 10.0,
  'redensão': 10.0,
  'planalto': 9.0,
  
  // Centro e redondezas (Mirante)
  'centro': 5.0,
  'adrianopolis': 6.0,
  'adrianópolis': 6.0,
  'praca 14': 6.0,
  'praça 14': 6.0,
  'sao geraldo': 7.0,
  'são geraldo': 7.0,
  'cachoeirinha': 8.0,
  'presidente vargas': 7.0,
  'aparecida': 8.0,
  
  // Zonas mais distantes
  'flores': 10.0,
  'chapada': 11.0,
  'aleixo': 10.0,
  'parque 10': 12.0,
  'parque dez': 12.0,
  'japiim': 12.0,
  'coroado': 13.0,
  'zumbi': 14.0,
  'educandos': 10.0,
  'raiz': 11.0,
  'petropolis': 11.0,
  'petrópolis': 11.0
};

export async function calculateShipping(input, originCoords) {
  // Limpa o texto que o usuário digitou
  const key = input.toLowerCase().trim();

  // 1. Verifica primeiro se ele digitou um bairro (mais rápido e confiável)
  if (neighborhoodTable[key]) {
    return neighborhoodTable[key];
  }

  // 2. Se não for bairro, tenta CEP
  const cep = input.replace(/\D/g, '');
  if (cep.length !== 8) {
    throw new Error('Digite um bairro válido ou CEP com 8 dígitos.');
  }

  try {
    const res = await fetch(`https://brasilapi.com.br/api/cep/v2/${cep}`);
    if (!res.ok) throw new Error('CEP não encontrado');
    const data = await res.json();

    // Se a API não retornar coordenadas exatas, usamos uma estimativa baseada no CEP de Manaus
    if (!data.coordinates) {
      throw new Error('Sem geolocalização');
    }

    const km = haversine(
      originCoords.lat,
      originCoords.lng,
      parseFloat(data.coordinates.latitude),
      parseFloat(data.coordinates.longitude)
    );

    if (km <= FREE_KM) return 0;
    return +(BASE_FEE + (km - FREE_KM) * PER_KM).toFixed(2);
  } catch (error) {
    // Se a API falhar, avisa o usuário amigavelmente
    throw new Error('Não foi possível localizar o CEP. Por favor, digite o nome do bairro (ex: "Ponta Negra").');
  }
}

function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}