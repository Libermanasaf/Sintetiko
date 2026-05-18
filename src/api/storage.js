const generateId = () => crypto.randomUUID();

const sortItems = (items, sortField) => {
  if (!sortField) return items;
  const desc = sortField.startsWith('-');
  const field = desc ? sortField.slice(1) : sortField;
  return [...items].sort((a, b) => {
    const av = a[field] ?? '';
    const bv = b[field] ?? '';
    if (typeof av === 'number' && typeof bv === 'number') {
      return desc ? bv - av : av - bv;
    }
    return desc
      ? String(bv).localeCompare(String(av), 'he')
      : String(av).localeCompare(String(bv), 'he');
  });
};

export function createStorage(entityName) {
  const key = `sintetiko_${entityName}`;

  const getAll = () => JSON.parse(localStorage.getItem(key) || '[]');
  const setAll = (items) => localStorage.setItem(key, JSON.stringify(items));

  return {
    async list(sortField, limit) {
      const items = sortItems(getAll(), sortField);
      return limit ? items.slice(0, limit) : items;
    },

    async create(data) {
      const items = getAll();
      const item = {
        ...data,
        id: generateId(),
        created_date: new Date().toISOString(),
        updated_date: new Date().toISOString(),
      };
      items.push(item);
      setAll(items);
      return item;
    },

    async update(id, data) {
      const items = getAll();
      const index = items.findIndex((i) => i.id === id);
      if (index === -1) throw new Error(`${entityName} not found: ${id}`);
      items[index] = { ...items[index], ...data, updated_date: new Date().toISOString() };
      setAll(items);
      return items[index];
    },

    async delete(id) {
      setAll(getAll().filter((i) => i.id !== id));
    },
  };
}
