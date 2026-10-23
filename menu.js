const fmt = (v) => `R$ ${v.toFixed(2).replace('.', ',')}`;

export function renderMenu(DATA, unitId, category = 'all', searchTerm = '') {
  const grid = document.getElementById('products-grid');
  const term = searchTerm.toLowerCase().trim();

  const filtered = DATA.products.filter((p) => {
    const matchUnit = p.units.includes(unitId);
    const matchCat = category === 'all' || p.category === category;
    const matchSearch = p.name.toLowerCase().includes(term) || p.description.toLowerCase().includes(term);
    return matchUnit && matchCat && matchSearch;
  });

  if (!filtered.length) {
    grid.innerHTML = `<div class="col-span-full flex flex-col items-center justify-center py-12 text-marrom/50 animate-fade-up">
      <svg class="w-12 h-12 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
      <p>Nenhum item encontrado.</p>
    </div>`;
    return;
  }

  grid.innerHTML = filtered
    .map(
      (p) => `
    <article class="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group cursor-pointer border border-areia/30"
             onclick="openProductModal('${p.id}')">
      <div class="aspect-[4/3] overflow-hidden bg-bege relative flex items-center justify-center">
        <img src="${p.image}" alt="${p.name}"
             onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"
             class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out z-10 relative" />
        
        <div style="display:none;" class="absolute inset-0 flex-col items-center justify-center bg-gradient-to-br from-bege to-areia/50 text-marrom/40 z-0">
          <svg class="w-10 h-10 mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
          <span class="font-serif text-lg font-bold opacity-70 px-4 text-center leading-tight">${p.name}</span>
        </div>
        
        <div class="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-colors z-20"></div>
      </div>
      <div class="p-5">
        <h3 class="font-serif text-lg mb-1 text-marrom group-hover:text-terracota transition-colors">${p.name}</h3>
        <p class="text-sm text-marrom/70 mb-4 line-clamp-2 leading-relaxed">${p.description}</p>
        <div class="flex justify-between items-center mt-auto">
          <span class="text-terracota font-bold text-lg">${fmt(p.price)}</span>
          <button class="bg-marrom text-white text-sm px-4 py-2 rounded-full hover:bg-terracota hover:shadow-md transition-all duration-300 flex items-center gap-1.5 active:scale-95">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
            Adicionar
          </button>
        </div>
      </div>
    </article>`
    )
    .join('');
}