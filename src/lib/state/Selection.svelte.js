import { SvelteSet } from 'svelte/reactivity';

class Selection {
  set = new SvelteSet();

  constructor() {
    try {
      const saved = JSON.parse(localStorage.getItem('ld_sel') || '[]');
      for (const ch of saved) this.set.add(ch);
    } catch { /* ignore */ }
  }

  toggle(ch) {
    if (this.set.has(ch)) {
      this.set.delete(ch);
    } else {
      this.set.add(ch);
    }
    this.save();
  }

  has(ch)       { return this.set.has(ch); }
  get size()    { return this.set.size; }
  get letters() { return [...this.set]; }

  setAll(str) {
    this.set.clear();
    for (const ch of str.split('')) this.set.add(ch);
    this.save();
  }

  clear() {
    this.set.clear();
    this.save();
  }

  save() {
    localStorage.setItem('ld_sel', JSON.stringify([...this.set]));
  }
}

export const selection = new Selection();
