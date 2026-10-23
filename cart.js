export class Cart {
  constructor() {
    this.items = JSON.parse(localStorage.getItem('vrc_cart') || '[]');
    this.shipping = JSON.parse(localStorage.getItem('vrc_shipping') || '0');
  }

  _persist() {
    localStorage.setItem('vrc_cart', JSON.stringify(this.items));
    localStorage.setItem('vrc_shipping', JSON.stringify(this.shipping));
    window.dispatchEvent(new Event('cart:updated'));
  }

  add(product) {
    const optionsText = Object.entries(product.options || {})
      .map(([k, v]) => `${k}: ${v}`)
      .join(' · ');

    const existing = this.items.find(
      (i) => i.id === product.id && i.optionsText === optionsText && i.notes === product.notes
    );

    if (existing) existing.qty += 1;
    else
      this.items.push({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        optionsText,
        notes: product.notes || '',
        qty: 1,
      });

    this._persist();
  }

  increment(idx) {
    this.items[idx].qty += 1;
    this._persist();
  }

  decrement(idx) {
    this.items[idx].qty -= 1;
    if (this.items[idx].qty <= 0) this.items.splice(idx, 1);
    this._persist();
  }

  subtotal() {
    return this.items.reduce((s, i) => s + i.price * i.qty, 0);
  }

  setShipping(fee) {
    this.shipping = fee;
    this._persist();
  }

  clear() {
    this.items = [];
    this.shipping = 0;
    this._persist();
  }
}