import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("labflow.db");

// Initialize Database Schema
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT,
    full_name TEXT,
    email TEXT,
    role TEXT,
    status TEXT DEFAULT 'active',
    last_login DATETIME
  );

  CREATE TABLE IF NOT EXISTS customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    tax_id TEXT,
    address TEXT,
    city TEXT,
    phone TEXT,
    email TEXT,
    contact_person TEXT,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS techniques (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    method TEXT,
    category TEXT,
    formula TEXT,
    variables TEXT, -- JSON string
    notes TEXT,
    status TEXT DEFAULT 'active',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS samples (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT UNIQUE,
    customer_id INTEGER,
    type TEXT,
    description TEXT,
    entry_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    estimated_delivery DATETIME,
    status TEXT DEFAULT 'pending',
    responsible_service TEXT,
    observations TEXT,
    renspa TEXT,
    dte TEXT,
    animal_species TEXT,
    sample_weight REAL,
    FOREIGN KEY(customer_id) REFERENCES customers(id)
  );

  CREATE TABLE IF NOT EXISTS sample_analysis (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sample_id INTEGER,
    technique_id INTEGER,
    status TEXT DEFAULT 'pending',
    result_value REAL,
    variables_data TEXT, -- JSON string of input values
    analyst_id INTEGER,
    completed_at DATETIME,
    observations TEXT,
    FOREIGN KEY(sample_id) REFERENCES samples(id),
    FOREIGN KEY(technique_id) REFERENCES techniques(id),
    FOREIGN KEY(analyst_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS equipment (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    internal_code TEXT UNIQUE,
    serial_number TEXT,
    purchase_date DATE,
    calibration_frequency INTEGER, -- in days
    last_maintenance DATE,
    next_maintenance DATE,
    status TEXT DEFAULT 'operational',
    notes TEXT
  );

  CREATE TABLE IF NOT EXISTS inventory (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    batch TEXT,
    stock REAL,
    unit TEXT,
    expiry_date DATE,
    location TEXT,
    provider TEXT,
    min_stock REAL
  );

  CREATE TABLE IF NOT EXISTS documents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    type TEXT,
    version TEXT,
    file_path TEXT,
    author TEXT,
    status TEXT DEFAULT 'active',
    expiry_date DATE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    action TEXT,
    module TEXT,
    details TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS triquinosis_jornadas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date DATE DEFAULT CURRENT_DATE,
    analyst_id INTEGER,
    technique_id INTEGER,
    type TEXT, -- 'normal' or 'sospechosa'
    status TEXT DEFAULT 'open', -- 'open', 'completed'
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(analyst_id) REFERENCES users(id),
    FOREIGN KEY(technique_id) REFERENCES techniques(id)
  );

  CREATE TABLE IF NOT EXISTS triquinosis_tropas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    jornada_id INTEGER,
    customer_id INTEGER,
    tropa_number TEXT,
    total_animals INTEGER,
    species TEXT,
    category TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(jornada_id) REFERENCES triquinosis_jornadas(id),
    FOREIGN KEY(customer_id) REFERENCES customers(id)
  );

  CREATE TABLE IF NOT EXISTS triquinosis_pools (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    jornada_id INTEGER,
    pool_number TEXT,
    sample_count INTEGER,
    weight REAL,
    result TEXT DEFAULT 'pending', -- 'pending', 'ND', 'P'
    larvae_count INTEGER DEFAULT 0,
    range_start INTEGER,
    range_end INTEGER,
    composition TEXT,
    composition_tropas TEXT,
    composition_counts TEXT,
    observations TEXT,
    FOREIGN KEY(jornada_id) REFERENCES triquinosis_jornadas(id)
  );

  CREATE TABLE IF NOT EXISTS triquinosis_temperatures (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    jornada_id INTEGER,
    time TEXT,
    water_temp REAL,
    chamber_temp REAL,
    observations TEXT,
    FOREIGN KEY(jornada_id) REFERENCES triquinosis_jornadas(id)
  );

  CREATE TABLE IF NOT EXISTS triquinosis_ncf (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT UNIQUE, -- NCF-YYYY-NNN
    date DATE DEFAULT CURRENT_DATE,
    description TEXT,
    category TEXT,
    action_taken TEXT,
    responsible_id INTEGER,
    status TEXT DEFAULT 'open',
    FOREIGN KEY(responsible_id) REFERENCES users(id)
  );
`);

// Ensure schema updates for existing databases
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all() as any[];

if (tables.some(t => t.name === 'triquinosis_jornadas')) {
  const columns = db.prepare("PRAGMA table_info(triquinosis_jornadas)").all() as any[];
  if (!columns.some(c => c.name === 'technique_id')) {
    db.prepare("ALTER TABLE triquinosis_jornadas ADD COLUMN technique_id INTEGER").run();
  }
  if (!columns.some(c => c.name === 'tropa_number')) {
    db.prepare("ALTER TABLE triquinosis_jornadas ADD COLUMN tropa_number TEXT").run();
  }
  if (!columns.some(c => c.name === 'total_animals')) {
    db.prepare("ALTER TABLE triquinosis_jornadas ADD COLUMN total_animals INTEGER").run();
  }
  if (!columns.some(c => c.name === 'customer_id')) {
    db.prepare("ALTER TABLE triquinosis_jornadas ADD COLUMN customer_id INTEGER").run();
  }
}

if (tables.some(t => t.name === 'triquinosis_pools')) {
  const columns = db.prepare("PRAGMA table_info(triquinosis_pools)").all() as any[];
  if (!columns.some(c => c.name === 'range_start')) {
    db.prepare("ALTER TABLE triquinosis_pools ADD COLUMN range_start INTEGER").run();
  }
  if (!columns.some(c => c.name === 'range_end')) {
    db.prepare("ALTER TABLE triquinosis_pools ADD COLUMN range_end INTEGER").run();
  }
  if (!columns.some(c => c.name === 'composition')) {
    db.prepare("ALTER TABLE triquinosis_pools ADD COLUMN composition TEXT").run();
  }
  if (!columns.some(c => c.name === 'composition_tropas')) {
    db.prepare("ALTER TABLE triquinosis_pools ADD COLUMN composition_tropas TEXT").run();
  }
  if (!columns.some(c => c.name === 'composition_counts')) {
    db.prepare("ALTER TABLE triquinosis_pools ADD COLUMN composition_counts TEXT").run();
  }
}

if (tables.some(t => t.name === 'triquinosis_tropas')) {
  const columns = db.prepare("PRAGMA table_info(triquinosis_tropas)").all() as any[];
  if (!columns.some(c => c.name === 'species')) {
    db.prepare("ALTER TABLE triquinosis_tropas ADD COLUMN species TEXT").run();
  }
  if (!columns.some(c => c.name === 'category')) {
    db.prepare("ALTER TABLE triquinosis_tropas ADD COLUMN category TEXT").run();
  }
}


// Seed default user if none exists
const userCount = db.prepare("SELECT count(*) as count FROM users").get() as { count: number };
if (userCount.count === 0) {
  db.prepare("INSERT INTO users (username, password, full_name, role) VALUES (?, ?, ?, ?)").run(
    "admin",
    "admin123",
    "Administrador del Sistema",
    "admin"
  );
  db.prepare("INSERT INTO users (username, password, full_name, role) VALUES (?, ?, ?, ?)").run(
    "superuser",
    "super123",
    "Super Usuario (Soporte)",
    "superuser"
  );

  // Seed Customers
  db.prepare("INSERT INTO customers (name, tax_id, email, phone, address, city, contact_person) VALUES (?, ?, ?, ?, ?, ?, ?)").run(
    "Alimentos del Sur S.A.", "30-12345678-9", "calidad@alimentosur.com", "011-4555-1234", "Av. Siempre Viva 123", "Buenos Aires", "Ing. Roberto Gómez"
  );
  db.prepare("INSERT INTO customers (name, tax_id, email, phone, address, city, contact_person) VALUES (?, ?, ?, ?, ?, ?, ?)").run(
    "Aguas Puras S.R.L.", "30-87654321-0", "lab@aguaspuras.com", "011-4888-5678", "Calle Falsa 456", "Córdoba", "Dra. Ana López"
  );

  // Seed Techniques
  db.prepare("INSERT INTO techniques (name, method, category, formula, variables) VALUES (?, ?, ?, ?, ?)").run(
    "% Proteínas", "Kjeldahl", "Fisicoquímica", "(V * F * 0.014 * 6.25 * 100) / P", 
    JSON.stringify([{name: 'V', unit: 'ml', type: 'variable'}, {name: 'F', unit: 'factor', type: 'constant'}, {name: 'P', unit: 'g', type: 'variable'}])
  );
  db.prepare("INSERT INTO techniques (name, method, category, formula, variables) VALUES (?, ?, ?, ?, ?)").run(
    "Humedad %", "Estufa 105°C", "Fisicoquímica", "((P1 - P2) / (P1 - P0)) * 100", 
    JSON.stringify([{name: 'P0', unit: 'g', type: 'variable'}, {name: 'P1', unit: 'g', type: 'variable'}, {name: 'P2', unit: 'g', type: 'variable'}])
  );

  db.prepare("INSERT INTO techniques (name, method, category, formula, variables) VALUES (?, ?, ?, ?, ?)").run(
    "Triquinosis (Digestión)", "Agitación Magnética", "Microbiología", "L", 
    JSON.stringify([{name: 'L', unit: 'larvas', type: 'variable'}])
  );

  db.prepare("INSERT INTO techniques (name, method, category, formula, variables) VALUES (?, ?, ?, ?, ?)").run(
    "pH en Agua", "Potenciométrico", "Fisicoquímica", "pH", 
    JSON.stringify([{name: 'pH', unit: 'unidades', type: 'variable'}])
  );

  db.prepare("INSERT INTO techniques (name, method, category, formula, variables) VALUES (?, ?, ?, ?, ?)").run(
    "Conductividad", "Conductimétrico", "Fisicoquímica", "C * K", 
    JSON.stringify([{name: 'C', unit: 'uS/cm', type: 'variable'}, {name: 'K', unit: 'constante', type: 'constant'}])
  );

  db.prepare("INSERT INTO techniques (name, method, category, formula, variables) VALUES (?, ?, ?, ?, ?)").run(
    "Aerobios Mesófilos", "Recuento en Placa", "Microbiología", "N * D", 
    JSON.stringify([{name: 'N', unit: 'UFC', type: 'variable'}, {name: 'D', unit: 'dilución', type: 'constant'}])
  );

  db.prepare("INSERT INTO techniques (name, method, category, formula, variables) VALUES (?, ?, ?, ?, ?)").run(
    "Coliformes Totales", "NMP (Número más Probable)", "Microbiología", "NMP", 
    JSON.stringify([{name: 'NMP', unit: 'NMP/g', type: 'variable'}])
  );

  db.prepare("INSERT INTO techniques (name, method, category, formula, variables) VALUES (?, ?, ?, ?, ?)").run(
    "Escherichia coli", "ISO 16649-2", "Microbiología", "UFC", 
    JSON.stringify([{name: 'UFC', unit: 'UFC/g', type: 'variable'}])
  );

  db.prepare("INSERT INTO techniques (name, method, category, formula, variables) VALUES (?, ?, ?, ?, ?)").run(
    "Salmonella spp.", "ISO 6579-1", "Microbiología", "Presencia", 
    JSON.stringify([{name: 'Presencia', unit: 'P/A', type: 'variable'}])
  );

  db.prepare("INSERT INTO techniques (name, method, category, formula, variables) VALUES (?, ?, ?, ?, ?)").run(
    "Grasas Totales", "Gerber / Soxhlet", "Fisicoquímica", "(G2 - G1) / P * 100", 
    JSON.stringify([{name: 'G1', unit: 'g', type: 'variable'}, {name: 'G2', unit: 'g', type: 'variable'}, {name: 'P', unit: 'g', type: 'variable'}])
  );

  db.prepare("INSERT INTO techniques (name, method, category, formula, variables) VALUES (?, ?, ?, ?, ?)").run(
    "Cenizas", "Calcinación 550°C", "Fisicoquímica", "(C2 - C0) / (C1 - C0) * 100", 
    JSON.stringify([{name: 'C0', unit: 'g', type: 'variable'}, {name: 'C1', unit: 'g', type: 'variable'}, {name: 'C2', unit: 'g', type: 'variable'}])
  );

  db.prepare("INSERT INTO techniques (name, method, category, formula, variables) VALUES (?, ?, ?, ?, ?)").run(
    "Nitritos", "Espectrofotométrico", "Fisicoquímica", "Abs * F", 
    JSON.stringify([{name: 'Abs', unit: 'Abs', type: 'variable'}, {name: 'F', unit: 'factor', type: 'constant'}])
  );

  db.prepare("INSERT INTO techniques (name, method, category, formula, variables) VALUES (?, ?, ?, ?, ?)").run(
    "Almidón", "Cualitativo (Lugol)", "Fisicoquímica", "R", 
    JSON.stringify([{name: 'R', unit: 'P/A', type: 'variable'}])
  );

  db.prepare("INSERT INTO techniques (name, method, category, formula, variables) VALUES (?, ?, ?, ?, ?)").run(
    "Listeria monocytogenes", "ISO 11290-1", "Microbiología", "Presencia", 
    JSON.stringify([{name: 'Presencia', unit: 'P/A', type: 'variable'}])
  );

  db.prepare("INSERT INTO techniques (name, method, category, formula, variables) VALUES (?, ?, ?, ?, ?)").run(
    "Staphylococcus aureus", "ISO 6888-1", "Microbiología", "UFC", 
    JSON.stringify([{name: 'UFC', unit: 'UFC/g', type: 'variable'}])
  );

  // Seed Equipment
  db.prepare("INSERT INTO equipment (name, internal_code, serial_number, calibration_frequency, last_maintenance, next_maintenance) VALUES (?, ?, ?, ?, ?, ?)").run(
    "Balanza Analítica", "BAL-01", "SN-987654", 365, "2024-01-15", "2025-01-15"
  );
  db.prepare("INSERT INTO equipment (name, internal_code, serial_number, calibration_frequency, last_maintenance, next_maintenance) VALUES (?, ?, ?, ?, ?, ?)").run(
    "Estufa de Cultivo", "EST-02", "SN-112233", 180, "2024-05-20", "2024-11-20"
  );

  // Seed Inventory
  db.prepare("INSERT INTO inventory (name, batch, stock, unit, expiry_date, location, min_stock) VALUES (?, ?, ?, ?, ?, ?, ?)").run(
    "Ácido Sulfúrico 98%", "L-2024-01", 5000, "ml", "2026-12-31", "Armario A1", 1000
  );
  db.prepare("INSERT INTO inventory (name, batch, stock, unit, expiry_date, location, min_stock) VALUES (?, ?, ?, ?, ?, ?, ?)").run(
    "Agar Nutritivo", "L-2023-11", 200, "g", "2024-06-30", "Heladera 1", 500
  );

  // Seed Documents
  db.prepare("INSERT INTO documents (title, type, version, author, expiry_date) VALUES (?, ?, ?, ?, ?)").run(
    "POE-01: Recepción de Muestras", "Procedimiento", "1.0", "Calidad", "2025-12-31"
  );
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  
  // Auth (Simplified for demo)
  app.post("/api/auth/login", (req, res) => {
    const { username, password } = req.body;
    const user = db.prepare("SELECT * FROM users WHERE username = ? AND password = ?").get(username, password);
    if (user) {
      res.json(user);
    } else {
      res.status(401).json({ error: "Invalid credentials" });
    }
  });

  // Generic CRUD Helper Factory
  const createCrudRoutes = (tableName: string, routeName: string) => {
    app.get(`/api/${routeName}`, (req, res) => {
      const keys = Object.keys(req.query);
      let query = `SELECT * FROM ${tableName}`;
      let params: any[] = [];
      if (keys.length > 0) {
        const where = keys.map(k => `${k} = ?`).join(" AND ");
        query += ` WHERE ${where}`;
        params = Object.values(req.query);
      }
      const items = db.prepare(query).all(...params);
      res.json(items);
    });

    app.get(`/api/${routeName}/:id`, (req, res) => {
      const item = db.prepare(`SELECT * FROM ${tableName} WHERE id = ?`).get(Number(req.params.id));
      res.json(item);
    });

    app.post(`/api/${routeName}`, (req, res) => {
      const keys = Object.keys(req.body);
      const values = Object.values(req.body);
      const placeholders = keys.map(() => "?").join(",");
      const stmt = db.prepare(`INSERT INTO ${tableName} (${keys.join(",")}) VALUES (${placeholders})`);
      const info = stmt.run(...values);
      res.json({ id: info.lastInsertRowid });
    });

    app.put(`/api/${routeName}/:id`, (req, res) => {
      const id = req.params.id;
      console.log(`[SERVER] PUT request for ${tableName} with ID: ${id}`);
      console.log(`[SERVER] Body:`, JSON.stringify(req.body));
      try {
        // Remove id and created_at from update data to avoid errors
        const { id: bodyId, created_at, ...updateData } = req.body;
        const keys = Object.keys(updateData);
        const values = Object.values(updateData);
        
        if (keys.length === 0) {
          console.log(`[SERVER] No data to update for ${tableName} ID: ${id}`);
          return res.json({ success: true, message: "No data to update" });
        }
        
        const setClause = keys.map(k => `${k} = ?`).join(",");
        const sql = `UPDATE ${tableName} SET ${setClause} WHERE id = ?`;
        console.log(`[SERVER] Executing SQL: ${sql} with values: ${JSON.stringify([...values, id])}`);
        const stmt = db.prepare(sql);
        const info = stmt.run(...values, Number(id));
        
        console.log(`[SERVER] Update result: ${info.changes} rows affected`);
        if (info.changes === 0) {
          console.warn(`[SERVER] Record not found for ${tableName} ID: ${id}`);
          return res.status(404).json({ error: "Record not found" });
        }
        res.json({ success: true, changes: info.changes });
      } catch (error: any) {
        console.error(`[SERVER] Error updating ${tableName}:`, error);
        res.status(500).json({ error: error.message || "Internal server error" });
      }
    });

    app.delete(`/api/${routeName}/:id`, (req, res) => {
      const id = req.params.id;
      console.log(`[SERVER] DELETE request for ${tableName} with ID: ${id}`);
      try {
        const sql = `DELETE FROM ${tableName} WHERE id = ?`;
        console.log(`[SERVER] Executing SQL: ${sql} with ID: ${id}`);
        const info = db.prepare(sql).run(Number(id));
        console.log(`[SERVER] Delete result: ${info.changes} rows affected`);
        if (info.changes === 0) {
          console.warn(`[SERVER] Record not found for ${tableName} ID: ${id}`);
          return res.status(404).json({ error: "Record not found" });
        }
        res.json({ success: true, changes: info.changes });
      } catch (error: any) {
        console.error(`[SERVER] Error deleting from ${tableName}:`, error);
        res.status(500).json({ error: error.message || "Internal server error" });
      }
    });
  };

  createCrudRoutes("customers", "customers");
  createCrudRoutes("techniques", "techniques");
  createCrudRoutes("samples", "samples");
  createCrudRoutes("equipment", "equipment");
  createCrudRoutes("inventory", "inventory");
  createCrudRoutes("documents", "documents");
  createCrudRoutes("users", "users");
  createCrudRoutes("triquinosis_jornadas", "triquinosis-jornadas");
  createCrudRoutes("triquinosis_tropas", "triquinosis-tropas");
  createCrudRoutes("triquinosis_pools", "triquinosis-pools");
  createCrudRoutes("triquinosis_temperatures", "triquinosis-temperatures");
  createCrudRoutes("triquinosis_ncf", "triquinosis-ncf");

  app.get("/api/audit_logs", (req, res) => {
    const logs = db.prepare(`
      SELECT al.*, u.username 
      FROM audit_logs al 
      LEFT JOIN users u ON al.user_id = u.id 
      ORDER BY al.timestamp DESC 
      LIMIT 100
    `).all();
    res.json(logs);
  });

  // Specialized Routes
  app.get("/api/samples-detailed", (req, res) => {
    const samples = db.prepare(`
      SELECT s.*, c.name as customer_name 
      FROM samples s 
      JOIN customers c ON s.customer_id = c.id
      ORDER BY s.entry_date DESC
    `).all();
    res.json(samples);
  });

  app.get("/api/sample-analysis/:sampleId", (req, res) => {
    const analysis = db.prepare(`
      SELECT sa.*, t.name as technique_name, t.formula, t.variables
      FROM sample_analysis sa
      JOIN techniques t ON sa.technique_id = t.id
      WHERE sa.sample_id = ?
    `).all(req.params.sampleId);
    res.json(analysis);
  });

  app.post("/api/sample-analysis", (req, res) => {
    const { sample_id, technique_ids } = req.body;
    const stmt = db.prepare("INSERT INTO sample_analysis (sample_id, technique_id) VALUES (?, ?)");
    const insertMany = db.transaction((ids) => {
      for (const tid of ids) stmt.run(sample_id, tid);
    });
    insertMany(technique_ids);
    res.json({ success: true });
  });

  app.put("/api/analysis-result/:id", (req, res) => {
    const { result_value, variables_data, status, analyst_id } = req.body;
    db.prepare(`
      UPDATE sample_analysis 
      SET result_value = ?, variables_data = ?, status = ?, analyst_id = ?, completed_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(result_value, JSON.stringify(variables_data), status, analyst_id, req.params.id);
    res.json({ success: true });
  });

  // Stats
  app.get("/api/stats/summary", (req, res) => {
    const totalSamples = db.prepare("SELECT count(*) as count FROM samples").get() as any;
    const pendingSamples = db.prepare("SELECT count(*) as count FROM samples WHERE status != 'validated'").get() as any;
    const samplesByType = db.prepare("SELECT type, count(*) as count FROM samples GROUP BY type").all();
    const samplesByMonth = db.prepare(`
      SELECT strftime('%Y-%m', entry_date) as month, count(*) as count 
      FROM samples 
      GROUP BY month 
      ORDER BY month DESC 
      LIMIT 6
    `).all();
    
    res.json({
      totalSamples: totalSamples.count,
      pendingSamples: pendingSamples.count,
      samplesByType,
      samplesByMonth
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
