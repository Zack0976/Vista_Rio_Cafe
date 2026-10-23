// 1. DADOS DO CARDÁPIO (Integrados)
const DEFAULT_DATA = {
  units: {
    "ponta-negra": { name: "Ponta Negra", whatsapp: "5592984540428", coordinates: { lat: -3.1019, lng: -60.0933 } },
    "mirante": { name: "Mirante", whatsapp: "5592981049661", coordinates: { lat: -3.1350, lng: -60.0230 } }
  },
  categories: [
    { id: "tapiocas", name: "Tapiocas" },
    { id: "sanduiches", name: "Sanduíches" },
    { id: "especiais", name: "Especiais & Omeletes" },
    { id: "bebidas", name: "Bebidas & Cafés" },
    { id: "porcoes", name: "Porções & Farofas" }
  ],
  products: [
    {
      id: "tapioca-cabocla",
      category: "tapiocas",
      name: "Tapioca Cabocla",
      description: "Com tucumã e queijo coalho.",
      price: 36.90,
      image: "assets/img/tapioca_cabocla.jpeg",
      units: ["ponta-negra", "mirante"],
      options: {}
    },
    {
      id: "tapioca-queijo",
      category: "tapiocas",
      name: "Tapioca com Queijo Coalho",
      description: "Clássica, com queijo coalho derretido.",
      price: 23.90,
      image: "assets/img/tapioca_queijo.jpeg",
      units: ["ponta-negra", "mirante"],
      options: {}
    },
    {
      id: "omelete-file",
      category: "especiais",
      name: "Omelete de Filé",
      description: "Feito com dois ovos e recheio generoso de filé mignon.",
      price: 44.90,
      image: "assets/img/omelete_file.jpeg",
      units: ["ponta-negra", "mirante"],
      options: { "ponto_da_carne": ["Ao ponto", "Bem passado"] }
    },
    {
      id: "farofa-carne-seca",
      category: "porcoes",
      name: "Farofa de Carne Seca",
      description: "Porção generosa de carne seca desfiada e temperada.",
      price: 35.90,
      image: "assets/img/farofa_carne_seca.webp",
      units: ["ponta-negra", "mirante"],
      options: {}
    },
    {
      id: "porcao-mel",
      category: "porcoes",
      name: "Porção de Mel",
      description: "Mel puro para acompanhar suas tapiocas.",
      price: 6.90,
      image: "assets/img/porcao_mel.jpeg",
      units: ["ponta-negra", "mirante"],
      options: {}
    },
    {
      id: "cafe-expresso",
      category: "bebidas",
      name: "Café Expresso",
      description: "Clássico e encorpado. Longo R$17,90 / Curto R$14,90",
      price: 14.90,
      image: "assets/img/cafe_expresso.jpeg",
      units: ["ponta-negra", "mirante"],
      options: { "tamanho": ["Curto", "Longo (+R$3)"] }
    }
  ]
};

let DATA = null;
let currentUnit = localStorage.getItem('vrc_unit') || 'ponta-negra';
let currentCategory = 'all';
let currentSearch = '';

const fmt = (v) => `R$ ${Number(v).toFixed(2).replace('.', ',')}`;

// 2. CLASSE DO CARRINHO
class Cart {
  constructor() {
    this.items = JSON.parse(localStorage.getItem('vrc_cart') || '[]');
    this.shipping = JSON.parse(localStorage.getItem('vrc_shipping') || '0');
  }
  _save() {
    localStorage.setItem('vrc_cart', JSON.stringify(this.items));
    localStorage.setItem('vrc_shipping', JSON.stringify(this.shipping));
    window.dispatchEvent(new Event('cart:updated'));
  }
  add(product) {
    const optionsText = Object.entries(product.options || {}).map(([k, v]) => `${k}: ${v}`).join(' · ');
    const existing = this.items.find(i => i.id === product.id && i.optionsText === optionsText && i.notes === (product.notes || ''));
    if (existing) existing.qty += 1;
    else this.items.push({ id: product.id, name: product.name, price: product.price, image: product.image, optionsText, notes: product.notes || '', qty: 1 });
    this._save();
  }
  increment(idx) { this.items[idx].qty += 1; this._save(); }
  decrement(idx) { this.items[idx].qty -= 1; if (this.items[idx].qty <= 0) this.items.splice(idx, 1); this._save(); }
  subtotal() { return this.items.reduce((s, i) => s + (i.price * i.qty), 0); }
  setShipping(val) { this.shipping = val; this._save(); }
  clear() { this.items = []; this.shipping = 0; this._save(); }
}
const cart = new Cart();

// 3. NAVEGAÇÃO
window.switchTab = function(tabId) {
  document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
  const target = document.getElementById(`tab-${tabId}`);
  if (target) target.classList.remove('hidden');
  document.querySelectorAll('.tab-btn').forEach(btn => {
    const isActive = btn.dataset.tab === tabId;
    btn.classList.toggle('active', isActive);
    btn.classList.toggle('text-marrom/60', !isActive);
  });
  window.location.hash = tabId;
  window.scrollTo({ top: 0, behavior: 'smooth' });
  toggleMobileMenu(false);
};

window.toggleMobileMenu = function(open) {
  const menu = document.getElementById('mobile-menu');
  const overlay = document.getElementById('mobile-menu-overlay');
  if (!menu || !overlay) return;
  if (open) { menu.classList.remove('translate-x-full'); overlay.classList.remove('hidden'); }
  else { menu.classList.add('translate-x-full'); overlay.classList.add('hidden'); }
};

// 4. INICIALIZAÇÃO
async function init() {
  document.querySelectorAll('.tab-btn').forEach(btn => btn.addEventListener('click', () => switchTab(btn.dataset.tab)));
  document.getElementById('mobile-menu-btn')?.addEventListener('click', () => toggleMobileMenu(true));
  document.getElementById('close-mobile-menu')?.addEventListener('click', () => toggleMobileMenu(false));
  document.getElementById('mobile-menu-overlay')?.addEventListener('click', () => toggleMobileMenu(false));
  document.querySelectorAll('.unit-btn').forEach(btn => btn.addEventListener('click', () => selectUnit(btn.dataset.unit)));

  document.getElementById('search-input')?.addEventListener('input', (e) => {
    currentSearch = e.target.value.toLowerCase();
    if (DATA && currentUnit) renderMenu(DATA, currentUnit, currentCategory, currentSearch);
  });

  setupCartEvents();
  setupCheckoutEvents();

  const adminData = localStorage.getItem('vrc_admin_data');
  if (adminData) {
    try { DATA = JSON.parse(adminData); } catch(e) { DATA = DEFAULT_DATA; }
  } else {
    DATA = DEFAULT_DATA;
  }

  renderCategories();
  renderFeatured();
  updateCartCount();
  selectUnit(currentUnit);
  switchTab(window.location.hash.replace('#', '') || 'inicio');
}

// 5. RENDERIZAÇÃO
function renderCategories() {
  const container = document.getElementById('categories');
  if (!container || !DATA) return;
  const all = [{ id: 'all', name: 'Todos' }, ...(DATA.categories || [])];
  container.innerHTML = all.map((c, i) =>
    `<button data-cat="${c.id}" class="cat-btn px-5 py-2.5 rounded-full border border-areia text-sm hover:shadow-md transition-all ${i === 0 ? 'bg-marrom text-white border-marrom' : 'bg-white text-marrom'}">${c.name}</button>`
  ).join('');

  container.querySelectorAll('.cat-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      currentCategory = btn.dataset.cat;
      container.querySelectorAll('.cat-btn').forEach(b => {
        b.classList.remove('bg-marrom', 'text-white', 'border-marrom');
        b.classList.add('bg-white', 'text-marrom');
      });
      btn.classList.remove('bg-white', 'text-marrom');
      btn.classList.add('bg-marrom', 'text-white', 'border-marrom');
      renderMenu(DATA, currentUnit, currentCategory, currentSearch);
    });
  });
}

function selectUnit(unitId) {
  currentUnit = unitId;
  localStorage.setItem('vrc_unit', unitId);
  document.querySelectorAll('.unit-btn').forEach(b => b.classList.toggle('active', b.dataset.unit === unitId));
  if (DATA) renderMenu(DATA, currentUnit, currentCategory, currentSearch);
}
window.selectUnitAndGo = function(unitId) { selectUnit(unitId); switchTab('cardapio'); };

function renderMenu(DATA, unitId, category = 'all', searchTerm = '') {
  const grid = document.getElementById('products-grid');
  if (!grid) return;
  const term = searchTerm.toLowerCase().trim();
  
  const filtered = DATA.products.filter((p) => 
    p.units.includes(unitId) && 
    (category === 'all' || p.category === category) && 
    (p.name.toLowerCase().includes(term) || p.description.toLowerCase().includes(term))
  );

  if (!filtered.length) {
    grid.innerHTML = `<div class="col-span-full text-center py-12 text-marrom/50"><p>Nenhum item encontrado.</p></div>`;
    return;
  }

  grid.innerHTML = filtered.map(p => `
    <article class="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group border border-areia/30 relative">
      <div class="aspect-[4/3] overflow-hidden bg-bege relative flex items-center justify-center cursor-pointer" onclick="openProductModal('${p.id}')">
        <img src="${p.image}" alt="${p.name}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" class="w-full h-full object-cover group-hover:scale-110 transition-transform z-10 relative" />
        <div style="display:none;" class="absolute inset-0 flex-col items-center justify-center bg-bege z-0"><span class="font-serif text-lg font-bold text-marrom/50 px-4 text-center">${p.name}</span></div>
      </div>
      <div class="p-5">
        <h3 class="font-serif text-lg mb-1 text-marrom cursor-pointer" onclick="openProductModal('${p.id}')">${p.name}</h3>
        <p class="text-sm text-marrom/70 mb-4 line-clamp-2">${p.description}</p>
        <div class="flex justify-between items-center">
          <span class="text-terracota font-bold text-lg">${fmt(p.price)}</span>
          <button onclick="event.stopPropagation(); addToCartDirect('${p.id}', this)" class="bg-marrom text-white text-sm px-4 py-2 rounded-full hover:bg-terracota transition-all flex items-center gap-1.5">+ Adicionar</button>
        </div>
      </div>
    </article>
  `).join('');
}

window.addToCartDirect = function(productId, btnElement) {
  const product = DATA.products.find(p => p.id === productId);
  if (!product) return;
  cart.add({ ...product, options: {}, notes: '' });
  const original = btnElement.innerHTML;
  btnElement.innerHTML = '✓ Adicionado';
  btnElement.classList.add('bg-green-600');
  setTimeout(() => { btnElement.innerHTML = original; btnElement.classList.remove('bg-green-600'); }, 1000);
};

function renderFeatured() {
  const grid = document.getElementById('featured-grid');
  if (!grid || !DATA) return;
  grid.innerHTML = DATA.products.slice(0, 3).map(p => `
    <article class="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all cursor-pointer border border-areia/30" onclick="switchTab('cardapio'); setTimeout(() => openProductModal('${p.id}'), 300)">
      <div class="aspect-[4/3] bg-bege relative flex items-center justify-center">
        <img src="${p.image}" class="w-full h-full object-cover z-10 relative" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" />
        <div style="display:none;" class="absolute inset-0 flex-col items-center justify-center bg-bege z-0"><span class="font-serif font-bold text-marrom/50 px-2 text-center">${p.name}</span></div>
      </div>
      <div class="p-6 text-center"><h3 class="font-serif text-lg mb-2 text-marrom">${p.name}</h3><span class="text-terracota font-semibold bg-terracota/10 px-4 py-1.5 rounded-full text-sm">${fmt(p.price)}</span></div>
    </article>
  `).join('');
}

// 6. MODAL
window.openProductModal = function (productId) {
  if (!DATA) return;
  const product = DATA.products.find(p => p.id === productId);
  if (!product) return;

  const modal = document.getElementById('product-modal');
  const content = document.getElementById('modal-content');

  const optionsHTML = Object.entries(product.options || {}).map(([key, values]) => `
    <div class="mb-4">
      <label class="text-sm font-semibold capitalize text-marrom">${key.replace('_', ' ')}</label>
      <select id="modal-opt-${key}" class="w-full border border-areia rounded-xl px-4 py-2.5 mt-1.5 focus:outline-none bg-creme/30 text-sm">
        <option value="">—</option>
        ${values.map(v => `<option value="${v}">${v}</option>`).join('')}
      </select>
    </div>
  `).join('');

  content.innerHTML = `
    <div class="relative rounded-2xl overflow-hidden mb-5 bg-bege flex items-center justify-center aspect-video">
      <img src="${product.image}" class="w-full h-full object-cover z-10 relative" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
      <div style="display:none;" class="absolute inset-0 flex-col items-center justify-center text-marrom/40 z-0"><span class="font-serif text-xl font-bold px-4 text-center">${product.name}</span></div>
      <button onclick="document.getElementById('product-modal').classList.add('hidden')" class="absolute top-3 right-3 bg-white/80 p-2 rounded-full z-20">✕</button>
    </div>
    <h3 class="font-serif text-2xl mb-1 text-marrom">${product.name}</h3>
    <p class="text-sm text-marrom/70 mb-4">${product.description}</p>
    <p class="text-2xl font-bold text-terracota mb-6">${fmt(product.price)}</p>
    ${optionsHTML}
    <textarea id="modal-notes" placeholder="Alguma observação?" class="w-full border border-areia rounded-xl px-4 py-3 text-sm mb-6 focus:outline-none bg-creme/30"></textarea>
    <button id="btn-add-modal" class="w-full bg-terracota text-white py-3.5 rounded-xl font-semibold hover:bg-terracota-dark transition">Adicionar ao Carrinho</button>
  `;

  modal.classList.remove('hidden');
  modal.classList.add('flex'); 

  document.getElementById('btn-add-modal').onclick = () => {
    const options = {};
    content.querySelectorAll('select[id^="modal-opt-"]').forEach(s => {
      if (s.value) options[s.id.replace('modal-opt-', '')] = s.value;
    });
    const notes = document.getElementById('modal-notes').value;
    cart.add({ ...product, options, notes });
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  };
};

// 7. CARRINHO E FRETE
function setupCartEvents() {
  const drawer = document.getElementById('cart-drawer');
  const overlay = document.getElementById('cart-overlay');

  document.getElementById('cart-btn').onclick = () => { drawer.classList.remove('translate-x-full'); overlay.classList.remove('hidden'); renderCart(); };
  const closeCart = () => { drawer.classList.add('translate-x-full'); overlay.classList.add('hidden'); };
  document.getElementById('close-cart').onclick = closeCart;
  overlay.onclick = closeCart;

  window.addEventListener('cart:updated', () => { renderCart(); updateCartCount(); });

  document.getElementById('calc-shipping').onclick = () => {
    const input = document.getElementById('cep-input').value.trim();
    const info = document.getElementById('shipping-info');
    if (!input) return (info.textContent = 'Digite um CEP ou bairro.');
    
    info.textContent = 'Calculando...';
    info.classList.remove('text-red-500');
    
    try {
      const key = input.toLowerCase().trim();
      const bairros = {
        'ponta negra': 5.0, 'taruma': 7.0, 'tarumã': 7.0, 'compensa': 8.0, 'santo agostinho': 9.0, 'dom pedro': 8.0,
        'centro': 5.0, 'adrianopolis': 6.0, 'adrianópolis': 6.0, 'praca 14': 6.0, 'praça 14': 6.0, 'sao geraldo': 7.0,
        'são geraldo': 7.0, 'cachoeirinha': 8.0, 'presidente vargas': 7.0, 'flores': 10.0, 'chapada': 11.0, 
        'aleixo': 10.0, 'parque 10': 12.0, 'japiim': 12.0, 'coroado': 13.0, 'zumbi': 14.0, 'redencao': 10.0
      };
      
      let fee = bairros[key];
      if (fee === undefined) {
        if (input.replace(/\D/g, '').length === 8) fee = 9.90;
        else throw new Error('Digite um bairro de Manaus ou CEP válido.');
      }
      
      cart.setShipping(fee);
      info.textContent = `Taxa: ${fmt(fee)}`;
    } catch (e) {
      info.textContent = e.message;
      info.classList.add('text-red-500');
    }
  };
}

function updateCartCount() {
  const count = cart.items.reduce((s, i) => s + i.qty, 0);
  const el = document.getElementById('cart-count');
  if (el) el.textContent = count;
}

function renderCart() {
  const box = document.getElementById('cart-items');
  if (!box) return;

  if (!cart.items.length) {
    box.innerHTML = `<p class="text-center text-marrom/50 py-8">Seu carrinho está vazio ☕</p>`;
  } else {
    box.innerHTML = cart.items.map((item, idx) => `
      <div class="flex gap-3 border-b border-areia pb-3">
        <div class="w-16 h-16 rounded-lg bg-bege overflow-hidden shrink-0"><img src="${item.image}" class="w-full h-full object-cover"></div>
        <div class="flex-1">
          <p class="font-medium text-sm text-marrom">${item.name}</p>
          ${item.optionsText ? `<p class="text-xs text-marrom/60">${item.optionsText}</p>` : ''}
          <div class="flex justify-between items-center mt-2">
            <div class="flex items-center gap-2">
              <button data-dec="${idx}" class="w-7 h-7 rounded-full bg-bege text-marrom font-bold">−</button>
              <span class="text-sm">${item.qty}</span>
              <button data-inc="${idx}" class="w-7 h-7 rounded-full bg-bege text-marrom font-bold">+</button>
            </div>
            <span class="font-semibold text-sm text-marrom">${fmt(item.price * item.qty)}</span>
          </div>
        </div>
      </div>
    `).join('');

    box.querySelectorAll('[data-inc]').forEach(b => b.addEventListener('click', () => cart.increment(+b.dataset.inc)));
    box.querySelectorAll('[data-dec]').forEach(b => b.addEventListener('click', () => cart.decrement(+b.dataset.dec)));
  }

  document.getElementById('subtotal').textContent = fmt(cart.subtotal());
  document.getElementById('shipping-fee').textContent = cart.shipping ? fmt(cart.shipping) : '—';
  document.getElementById('total').textContent = fmt(cart.subtotal() + (cart.shipping || 0));
}

// 8. CHECKOUT
function setupCheckoutEvents() {
  const checkoutModal = document.getElementById('checkout-modal');

  document.getElementById('checkout-btn').onclick = () => {
    if (!cart.items.length) return alert('Adicione itens ao carrinho.');
    checkoutModal.classList.remove('hidden');
    checkoutModal.classList.add('flex');
  };

  document.getElementById('close-checkout').onclick = () => {
    checkoutModal.classList.add('hidden');
    checkoutModal.classList.remove('flex');
  };

  document.querySelectorAll('input[name="delivery"]').forEach(r => {
    r.addEventListener('change', () => {
      const isDelivery = document.querySelector('input[name="delivery"]:checked').value === 'delivery';
      document.getElementById('address-fields').style.display = isDelivery ? 'block' : 'none';
    });
  });

  document.getElementById('checkout-form').onsubmit = (e) => {
    e.preventDefault();
    const form = new FormData(e.target);
    const unit = DATA.units[currentUnit];
    const deliveryType = form.get('delivery');
    
    let msg = `*NOVO PEDIDO - Vista Rio Café*\n*Unidade:* ${unit.name}\n\n*Itens:*\n`;
    cart.items.forEach(it => {
      msg += `• ${it.qty}x ${it.name} - ${fmt(it.price * it.qty)}\n`;
      if (it.optionsText) msg += `   ↳ ${it.optionsText}\n`;
      if (it.notes) msg += `   ↳ obs: ${it.notes}\n`;
    });
    
    const taxa = deliveryType === 'delivery' ? (cart.shipping || 0) : 0;
    msg += `\nSubtotal: ${fmt(cart.subtotal())}\nTaxa: ${fmt(taxa)}\n*Total: ${fmt(cart.subtotal() + taxa)}*\n`;
    msg += `\n*Cliente:* ${form.get('name')}\n*Telefone:* ${form.get('phone')}\n*Tipo:* ${deliveryType === 'delivery' ? 'Delivery' : 'Retirada'}\n`;
    if (deliveryType === 'delivery') msg += `*Endereço:* ${form.get('street')}, ${form.get('number')} - ${form.get('district')}\n`;
    msg += `*Pagamento:* ${form.get('payment')}`;

    window.open(`https://wa.me/${unit.whatsapp}?text=${encodeURIComponent(msg)}`, '_blank');
    
    cart.clear();
    checkoutModal.classList.add('hidden');
    checkoutModal.classList.remove('flex');
    document.getElementById('cart-drawer').classList.add('translate-x-full');
    document.getElementById('cart-overlay').classList.add('hidden');
    e.target.reset();
  };
}

window.addEventListener('DOMContentLoaded', init);