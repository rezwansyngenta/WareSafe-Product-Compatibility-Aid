/* ============================================================
   WareSafe — configuration
   Everything an operator might change after deployment lives here.
   ============================================================ */

/**
 * The bundled dataset. The app ships with this file, so it works
 * offline from the first launch with no server involved.
 */
export const BUNDLED_SNAPSHOT = "./data/snapshot.json";

/** localStorage keys. Namespaced so a second app can share the origin. */
/**
 * Bump this whenever `app/data/snapshot.json` changes. The cache key
 * includes it, so an installed copy picks up the new dataset instead
 * of serving the old one from localStorage.
 */
export const DATA_VERSION = 3;

export const KEYS = {
  snapshot: `waresafe:snapshot:v${DATA_VERSION}`,
  prefs: "waresafe:prefs:v2",
  recent: "waresafe:recent:v2",
};

/** Expected snapshot schema version. A mismatch is treated as "no data". */
export const SNAPSHOT_VERSION = 2;
