// A LocalStorage-based mock of the Supabase client for local demo mode.
// This lets the entire app, including Superadmin & Moderation, run seamlessly without a real Supabase project.

const DEFAULT_RESERVED = [
  { username: 'admin', reason: 'Platform administrative route', created_at: new Date().toISOString() },
  { username: 'administrator', reason: 'Platform administrative route', created_at: new Date().toISOString() },
  { username: 'superadmin', reason: 'Platform administrative route', created_at: new Date().toISOString() },
  { username: 'support', reason: 'Official support channel', created_at: new Date().toISOString() },
  { username: 'help', reason: 'Official help and documentation', created_at: new Date().toISOString() },
  { username: 'security', reason: 'Trust & Safety team', created_at: new Date().toISOString() },
  { username: 'official', reason: 'Official platform handle', created_at: new Date().toISOString() },
  { username: 'linkinbio', reason: 'Brand handle', created_at: new Date().toISOString() },
  { username: 'linkinbio_support', reason: 'Brand support handle', created_at: new Date().toISOString() },
  { username: 'api', reason: 'System API reserved namespace', created_at: new Date().toISOString() },
  { username: 'auth', reason: 'System authentication route', created_at: new Date().toISOString() },
  { username: 'billing', reason: 'Billing namespace', created_at: new Date().toISOString() },
  { username: 'root', reason: 'System root namespace', created_at: new Date().toISOString() },
  { username: 'verify', reason: 'Verification service namespace', created_at: new Date().toISOString() },
  { username: 'verified', reason: 'Verification service namespace', created_at: new Date().toISOString() },
];

const DEFAULT_FLAGS = [
  { name: 'user_registration', enabled: true, description: 'Allow new accounts to sign up', config: {} },
  { name: 'public_pages', enabled: true, description: 'Serve live visitor traffic to user profiles', config: {} },
  { name: 'advanced_analytics', enabled: true, description: 'Track unique visitors and referrer channels', config: {} },
  { name: 'custom_domains', enabled: false, description: 'Custom domain mapping and routing (V2 feature)', config: {} },
  { name: 'experimental_themes', enabled: true, description: 'Enable dynamic and experimental ReactBits FX', config: {} },
  { name: 'sensitive_content_filter', enabled: true, description: 'Enforce sensitive content warnings', config: {} },
];

const DEFAULT_SETTINGS = [
  { key: 'max_blocks_per_user', value: 50 },
  { key: 'default_theme', value: 'growth' },
  { key: 'default_font', value: 'inter' },
  { key: 'maintenance_mode', value: false },
];

function getInitialDB() {
  return {
    profiles: [],
    blocks: [],
    platform_admins: [],
    reports: [],
    reserved_usernames: DEFAULT_RESERVED,
    admin_audit_logs: [],
    feature_flags: DEFAULT_FLAGS,
    platform_settings: DEFAULT_SETTINGS,
    analytics_events: [],
    custom_domains: [],
    session: null,
  };
}

export function createLocalSupabaseClient() {
  const getDB = () => {
    if (typeof window === 'undefined') {
      if (!global.__LOCAL_DB__) {
        global.__LOCAL_DB__ = getInitialDB();
      }
      return global.__LOCAL_DB__;
    }
    const raw = localStorage.getItem('local_supabase_db');
    if (!raw) {
      const initial = getInitialDB();
      localStorage.setItem('local_supabase_db', JSON.stringify(initial));
      return initial;
    }
    try {
      const db = JSON.parse(raw);
      // Backfill missing collections
      if (!db.reports) db.reports = getInitialDB().reports;
      if (!db.platform_admins) db.platform_admins = getInitialDB().platform_admins;
      if (!db.reserved_usernames) db.reserved_usernames = DEFAULT_RESERVED;
      if (!db.admin_audit_logs) db.admin_audit_logs = getInitialDB().admin_audit_logs;
      if (!db.feature_flags) db.feature_flags = DEFAULT_FLAGS;
      if (!db.platform_settings) db.platform_settings = DEFAULT_SETTINGS;
      return db;
    } catch {
      const initial = getInitialDB();
      localStorage.setItem('local_supabase_db', JSON.stringify(initial));
      return initial;
    }
  };

  const saveDB = (db) => {
    if (typeof window === 'undefined') {
      global.__LOCAL_DB__ = db;
    } else {
      localStorage.setItem('local_supabase_db', JSON.stringify(db));
    }
  };

  let authListeners = [];

  const notifyAuthChange = (event, session = null) => {
    authListeners.forEach((fn) => fn(event, session));
  };

  const client = {
    auth: {
      async getSession() {
        const db = getDB();
        return { data: { session: db.session }, error: null };
      },
      async signUp({ email, password, options }) {
        const db = getDB();
        const id = 'local-' + Date.now();
        const user = { id, email };
        const initialProfile = {
          id,
          username: options?.data?.username || 'user' + Date.now(),
          display_name: options?.data?.full_name || '',
          bio: '',
          onboarded: false,
          theme: 'growth',
          is_verified: false,
          account_status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        db.profiles.push(initialProfile);
        db.session = { user };
        saveDB(db);
        notifyAuthChange('SIGNED_IN', db.session);
        return { data: { user, session: db.session }, error: null };
      },
      async signInWithPassword({ email }) {
        const db = getDB();
        const user = { id: 'local-test-id', email };
        let found = db.profiles.find((p) => p.id === 'local-test-id');
        if (!found) {
          found = {
            id: 'local-test-id',
            username: 'localuser',
            display_name: 'Local Tester',
            bio: 'This is a local storage demo account.',
            onboarded: true,
            theme: 'growth',
            is_verified: false,
            account_status: 'active',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          db.profiles.push(found);
        }
        db.session = { user };
        saveDB(db);
        notifyAuthChange('SIGNED_IN', db.session);
        return { data: { user, session: db.session }, error: null };
      },
      async signInWithOAuth({ provider }) {
        return client.auth.signInWithPassword({ email: `oauth-${provider}@example.com` });
      },
      async resetPasswordForEmail(email) {
        return { data: {}, error: null };
      },
      async updateUser({ password, data }) {
        const db = getDB();
        if (db.session?.user) {
          db.session.user = { ...db.session.user, ...data };
          saveDB(db);
          notifyAuthChange('USER_UPDATED', db.session);
        }
        return { data: { user: db.session?.user }, error: null };
      },
      async signOut() {
        const db = getDB();
        db.session = null;
        saveDB(db);
        notifyAuthChange('SIGNED_OUT', null);
        return { error: null };
      },
      onAuthStateChange(callback) {
        authListeners.push(callback);
        return {
          data: {
            subscription: {
              unsubscribe: () => {
                authListeners = authListeners.filter((fn) => fn !== callback);
              },
            },
          },
        };
      },
    },

    from(table) {
      let filters = [];
      let mutationType = null;
      let mutationData = null;
      let wantSelect = false;
      let orderField = null;
      let orderAscending = true;
      let limitCount = null;

      const chain = {
        select: (cols = '*') => {
          wantSelect = true;
          return chain;
        },
        insert: (data) => {
          mutationType = 'insert';
          mutationData = data;
          return chain;
        },
        update: (data) => {
          mutationType = 'update';
          mutationData = data;
          return chain;
        },
        upsert: (data) => {
          mutationType = 'upsert';
          mutationData = data;
          return chain;
        },
        delete: () => {
          mutationType = 'delete';
          return chain;
        },
        eq: (col, val) => {
          filters.push({ type: 'eq', col, val });
          return chain;
        },
        neq: (col, val) => {
          filters.push({ type: 'neq', col, val });
          return chain;
        },
        gte: (col, val) => {
          filters.push({ type: 'gte', col, val });
          return chain;
        },
        lte: (col, val) => {
          filters.push({ type: 'lte', col, val });
          return chain;
        },
        in: (col, arr) => {
          filters.push({ type: 'in', col, val: arr });
          return chain;
        },
        order: (col, { ascending = true } = {}) => {
          orderField = col;
          orderAscending = ascending;
          return chain;
        },
        limit: (n) => {
          limitCount = n;
          return chain;
        },

        single: async () => {
          const res = await chain.execute();
          return { data: res.data ? res.data[0] || null : null, error: res.error };
        },
        maybeSingle: async () => {
          const res = await chain.execute();
          return { data: res.data ? res.data[0] || null : null, error: res.error };
        },

        execute: async () => {
          const db = getDB();
          if (!db[table]) db[table] = [];

          function matchesFilters(item) {
            return filters.every((f) => {
              if (f.type === 'eq') return item[f.col] === f.val;
              if (f.type === 'neq') return item[f.col] !== f.val;
              if (f.type === 'gte') return item[f.col] >= f.val;
              if (f.type === 'lte') return item[f.col] <= f.val;
              if (f.type === 'in') return Array.isArray(f.val) && f.val.includes(item[f.col]);
              return true;
            });
          }

          // --- Mutations ---
          if (mutationType === 'insert') {
            const arr = Array.isArray(mutationData) ? mutationData : [mutationData];
            const inserted = arr.map((item) => ({
              ...item,
              id: item.id || (table === 'reserved_usernames' ? item.username : 'id-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6)),
              created_at: item.created_at || new Date().toISOString(),
            }));
            db[table].push(...inserted);
            saveDB(db);
            return { data: wantSelect ? inserted : null, error: null };
          }

          if (mutationType === 'update') {
            let updated = [];
            db[table] = db[table].map((item) => {
              if (matchesFilters(item)) {
                const merged = { ...item, ...mutationData, updated_at: new Date().toISOString() };
                updated.push(merged);
                return merged;
              }
              return item;
            });
            saveDB(db);
            return { data: wantSelect ? updated : null, error: null };
          }

          if (mutationType === 'upsert') {
            const arr = Array.isArray(mutationData) ? mutationData : [mutationData];
            const upserted = [];
            arr.forEach((newItem) => {
              const keyMatch = (x) =>
                (newItem.id && x.id === newItem.id) ||
                (newItem.username && x.username === newItem.username) ||
                (newItem.name && x.name === newItem.name) ||
                (newItem.key && x.key === newItem.key) ||
                (newItem.profile_id && x.profile_id === newItem.profile_id);
              const idx = db[table].findIndex(keyMatch);
              if (idx >= 0) {
                db[table][idx] = { ...db[table][idx], ...newItem, updated_at: new Date().toISOString() };
                upserted.push(db[table][idx]);
              } else {
                const created = {
                  id: newItem.id || newItem.username || newItem.name || newItem.key || 'id-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
                  created_at: new Date().toISOString(),
                  ...newItem,
                };
                db[table].push(created);
                upserted.push(created);
              }
            });
            saveDB(db);
            return { data: wantSelect ? upserted : null, error: null };
          }

          if (mutationType === 'delete') {
            db[table] = db[table].filter((item) => !matchesFilters(item));
            saveDB(db);
            return { data: null, error: null };
          }

          // --- SELECT ---
          let res = db[table].filter(matchesFilters);
          if (orderField) {
            res = res.sort((a, b) => {
              if (a[orderField] === b[orderField]) return 0;
              const diff = a[orderField] > b[orderField] ? 1 : -1;
              return orderAscending ? diff : -diff;
            });
          }
          if (typeof limitCount === 'number') {
            res = res.slice(0, limitCount);
          }
          return { data: res, error: null };
        },

        then: (resolve, reject) => {
          return chain.execute().then(resolve, reject);
        },
      };
      return chain;
    },

    rpc: async (fnName, args = {}) => {
      const db = loadDB();
      if (fnName === 'resolve_custom_domain') {
        const domain = (args.p_domain || '').toLowerCase().trim();
        const domains = db.custom_domains || [];
        const profiles = db.profiles || [];
        const match = domains.find((d) => (d.domain || '').toLowerCase() === domain && d.verified);
        if (!match) return { data: [], error: null };
        const profile = profiles.find((p) => p.id === match.profile_id);
        if (!profile || profile.account_status === 'suspended' || profile.account_status === 'banned') {
          return { data: [], error: null };
        }
        return { data: [{ username: match.username || profile.username }], error: null };
      }
      return { data: null, error: new Error(`Unknown RPC function ${fnName}`) };
    },
  };

  return client;
}
