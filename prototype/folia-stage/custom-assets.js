const FoliaStageAssets = (() => {
  const DB_NAME = "folia-stage-assets";
  // Keep all Folia asset stores in one schema so the Tempera pool can share
  // the database without a version-1 object-store race.
  const DB_VERSION = 2;
  const STORE = "assets";
  const TYPES = ["cappellaEmoji", "cappellaAvatar", "monetPortrait", "monetBackground"];
  const cache = new Map(TYPES.map((type) => [type, []]));
  let loaded = false;

  function openDb() {
    return new Promise((resolve, reject) => {
      if (typeof indexedDB === "undefined") {
        reject(new Error("IndexedDB unavailable"));
        return;
      }
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE)) {
          const store = db.createObjectStore(STORE, { keyPath: "id" });
          store.createIndex("type", "type", { unique: false });
        }
        if (!db.objectStoreNames.contains("tempera-images")) {
          db.createObjectStore("tempera-images", { keyPath: "id" });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || new Error("Failed to open asset database"));
    });
  }

  function transaction(db, mode, action) {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, mode);
      const store = tx.objectStore(STORE);
      let result;
      try { result = action(store); } catch (error) { reject(error); return; }
      tx.oncomplete = () => resolve(result);
      tx.onerror = () => reject(tx.error || new Error("Asset database transaction failed"));
      tx.onabort = () => reject(tx.error || new Error("Asset database transaction aborted"));
    });
  }

  function readFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = () => reject(reader.error || new Error("Failed to read image"));
      reader.readAsDataURL(file);
    });
  }

  function normalizeRecord(record, type) {
    return {
      id: String(record.id || `${type}-${Date.now()}-${Math.random().toString(36).slice(2)}`),
      type,
      name: String(record.name || "custom-image"),
      mime: String(record.mime || "image/png"),
      url: String(record.url || record.dataUrl || ""),
      createdAt: Number(record.createdAt) || Date.now(),
    };
  }

  function setCache(records) {
    for (const type of TYPES) cache.set(type, []);
    for (const record of records) {
      if (cache.has(record.type) && record.url) cache.get(record.type).push(normalizeRecord(record, record.type));
    }
    loaded = true;
  }

  async function load() {
    if (loaded) return getAll();
    try {
      const db = await openDb();
      const records = await new Promise((resolve, reject) => {
        const request = db.transaction(STORE, "readonly").objectStore(STORE).getAll();
        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => reject(request.error || new Error("Failed to read assets"));
      });
      setCache(records);
    } catch (error) {
      console.warn("[FoliaStage] Asset database unavailable", error);
      loaded = true;
    }
    return getAll();
  }

  function get(type) {
    return (cache.get(type) || []).slice();
  }

  function getAll() {
    return Object.fromEntries(TYPES.map((type) => [type, get(type)]));
  }

  async function addFiles(type, files, limit = 32) {
    if (!TYPES.includes(type)) throw new Error(`Unknown asset type: ${type}`);
    const input = Array.from(files || []).filter((file) => file?.type?.startsWith("image/"));
    const room = Math.max(0, limit - get(type).length);
    const db = await openDb();
    const added = [];
    for (const file of input.slice(0, room)) {
      const record = normalizeRecord({
        name: file.name,
        mime: file.type,
        url: await readFile(file),
      }, type);
      await transaction(db, "readwrite", (store) => store.put(record));
      added.push(record);
    }
    cache.set(type, get(type).concat(added));
    loaded = true;
    return added;
  }

  async function put(type, record) {
    if (!TYPES.includes(type)) throw new Error(`Unknown asset type: ${type}`);
    const normalized = normalizeRecord(record, type);
    const db = await openDb();
    await transaction(db, "readwrite", (store) => store.put(normalized));
    cache.set(type, get(type).filter((item) => item.id !== normalized.id).concat(normalized));
    loaded = true;
    return normalized;
  }

  async function remove(type, id) {
    const db = await openDb();
    await transaction(db, "readwrite", (store) => store.delete(id));
    cache.set(type, get(type).filter((item) => item.id !== id));
  }

  async function clear(type) {
    const ids = get(type).map((item) => item.id);
    const db = await openDb();
    await transaction(db, "readwrite", (store) => ids.forEach((id) => store.delete(id)));
    cache.set(type, []);
  }

  async function exportPool() {
    await load();
    return { version: 1, format: "folia-stage-assets", assets: getAll() };
  }

  async function importPool(payload, replace = false) {
    const incoming = payload?.assets || {};
    await load();
    if (replace) {
      for (const type of TYPES) await clear(type);
    }
    const added = {};
    for (const type of TYPES) {
      added[type] = [];
      for (const record of Array.isArray(incoming[type]) ? incoming[type] : []) {
        if (!record?.url) continue;
        added[type].push(await put(type, record));
      }
    }
    return added;
  }

  return { types: TYPES, load, get, getAll, addFiles, put, remove, clear, exportPool, importPool };
})();

globalThis.FoliaStageAssets = FoliaStageAssets;
FoliaStageAssets.load();
