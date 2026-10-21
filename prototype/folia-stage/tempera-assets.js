globalThis.FoliaTemperaAssets = (() => {
  const DB_NAME = "folia-stage-assets";
  const STORE_NAME = "tempera-images";
  const openDb = () => new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 2);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) db.createObjectStore(STORE_NAME, { keyPath: "id" });
      if (!db.objectStoreNames.contains("assets")) {
        const store = db.createObjectStore("assets", { keyPath: "id" });
        store.createIndex("type", "type", { unique: false });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("无法打开图片资源库"));
  });
  const transaction = async (mode, run) => {
    const db = await openDb();
    try { return await new Promise((resolve, reject) => { const tx = db.transaction(STORE_NAME, mode); let result; try { result = run(tx.objectStore(STORE_NAME)); } catch (error) { reject(error); return; } tx.oncomplete = () => resolve(result); tx.onerror = () => reject(tx.error || new Error("图片资源操作失败")); }); } finally { db.close(); }
  };
  const makeId = () => `tempera-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  const addFiles = async (files, room = 16) => { const accepted = Array.from(files || []).filter((file) => file?.type?.startsWith("image/")).slice(0, Math.max(0, room)); const records = accepted.map((file) => ({ id: makeId(), name: file.name || "image", mimeType: file.type, blob: file })); if (records.length) await transaction("readwrite", (store) => records.forEach((record) => store.put(record))); return records.map(({ id, name }) => ({ id, name, align: "center", verticalAlign: "center", scale: 1, opacity: 1 })); };
  const getRecord = async (id) => { const db = await openDb(); try { return await new Promise((resolve, reject) => { const request = db.transaction(STORE_NAME, "readonly").objectStore(STORE_NAME).get(id); request.onsuccess = () => resolve(request.result || null); request.onerror = () => reject(request.error); }); } finally { db.close(); } };
  const getBlobs = async (placements) => new Map((await Promise.all(Array.from(placements || []).map(async (placement) => { const record = await getRecord(placement.id); return record?.blob ? [placement.id, record.blob] : null; }))).filter(Boolean));
  const remove = (id) => transaction("readwrite", (store) => store.delete(id));
  const clear = (ids) => transaction("readwrite", (store) => Array.from(ids || []).forEach((id) => store.delete(id)));
  const blobToDataUrl = (blob) => new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result || "")); reader.onerror = () => reject(reader.error); reader.readAsDataURL(blob); });
  const exportPool = async (placements) => { const images = []; for (const placement of placements || []) { const record = await getRecord(placement.id); if (record?.blob) images.push({ placement, name: record.name, mimeType: record.mimeType, dataUrl: await blobToDataUrl(record.blob) }); } return { kind: "spotify-folia-tempera-pool", version: 1, images }; };
  const importPool = async (payload, room = 16) => { if (payload?.kind !== "spotify-folia-tempera-pool" || !Array.isArray(payload.images)) throw new Error("不是有效的 Tempera 图片池备份"); const placements = []; const records = []; for (const entry of payload.images.slice(0, Math.max(0, room))) { const id = makeId(); const blob = await fetch(entry.dataUrl).then((response) => response.blob()); const name = entry.name || entry.placement?.name || "image"; records.push({ id, name, mimeType: entry.mimeType || blob.type, blob }); placements.push({ id, name, align: entry.placement?.align || "center", verticalAlign: entry.placement?.verticalAlign || "center", scale: Number(entry.placement?.scale) || 1, opacity: Number.isFinite(entry.placement?.opacity) ? entry.placement.opacity : 1 }); } if (records.length) await transaction("readwrite", (store) => records.forEach((record) => store.put(record))); return placements; };
  return { addFiles, getBlobs, remove, clear, exportPool, importPool };
})();
