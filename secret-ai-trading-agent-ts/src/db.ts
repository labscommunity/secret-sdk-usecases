import sqlite3 from 'sqlite3';

const verboseSqlite3 = sqlite3.verbose();

let db: sqlite3.Database;
let isInitializing = false;
let setupPromise: Promise<void> | null = null;

function query<T>(dbInstance: sqlite3.Database, sql: string, params: any[] = []): Promise<T> {
    return new Promise((resolve, reject) => {
        dbInstance.all(sql, params, (err, rows) => {
            if (err) {
                console.error('Database query error:', err);
                reject(err);
            } else {
                resolve(rows as T);
            }
        });
    });
}

function get<T>(dbInstance: sqlite3.Database, sql: string, params: any[] = []): Promise<T | undefined> {
    return new Promise((resolve, reject) => {
        dbInstance.get(sql, params, (err, row) => {
            if (err) {
                console.error('Database get error:', err);
                reject(err);
            } else {
                resolve(row as T | undefined);
            }
        });
    });
}


function run(dbInstance: sqlite3.Database, sql: string, params: any[] = []): Promise<{ lastID: number; changes: number }> {
    return new Promise((resolve, reject) => {
        dbInstance.run(sql, params, function (err) {
            if (err) {
                console.error('Database run error:', err);
                reject(err);
            } else {
                resolve({ lastID: (this as any).lastID, changes: (this as any).changes });
            }
        });
    });
}

function exec(dbInstance: sqlite3.Database, sql: string): Promise<void> {
    return new Promise((resolve, reject) => {
        dbInstance.exec(sql, (err) => {
            if (err) {
                console.error('Database exec error:', err);
                reject(err);
            } else {
                resolve();
            }
        });
    });
}


export function openDb(): Promise<sqlite3.Database> {
    return new Promise((resolve, reject) => {
        if (db) {
            if (setupPromise) {
                setupPromise.then(() => resolve(db)).catch(reject);
            } else {
                resolve(db);
            }
            return;
        }

        if (isInitializing) {
            const checkInterval = setInterval(() => {
                if (db) {
                    clearInterval(checkInterval);
                    if (setupPromise) {
                        setupPromise.then(() => resolve(db)).catch(reject);
                    } else {
                        resolve(db);
                    }
                } else if (!isInitializing) {
                    clearInterval(checkInterval);
                    reject(new Error("Initialization state error"));
                }
            }, 50); // Check every 50ms
            return;
        }

        isInitializing = true;
        console.log('Opening database connection...');
        const newDb = new verboseSqlite3.Database('./memory.db', (err) => {
            if (err) {
                console.error('Failed to open database:', err);
                isInitializing = false;
                reject(err);
            } else {
                console.log('Database connection opened.');
                db = newDb;
                setupPromise = setupDatabase(db)
                    .then(() => {
                        isInitializing = false;
                        resolve(db);
                    })
                    .catch(setupErr => {
                        console.error("Database setup failed:", setupErr);
                        isInitializing = false;
                        reject(setupErr);
                    });
            }
        });
    });
}

export async function setupDatabase(dbInstance: sqlite3.Database): Promise<void> {
    console.log('Setting up database tables...');
    await exec(dbInstance, `
        CREATE TABLE IF NOT EXISTS conversations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT NOT NULL,
            message TEXT NOT NULL,
            response TEXT NOT NULL,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        );
    `);

    await exec(dbInstance, `
        CREATE TABLE IF NOT EXISTS trading_state (
            user_id TEXT PRIMARY KEY,
            convinced INTEGER DEFAULT 0 -- 0 means not convinced, 1 means convinced
        );
    `);
    console.log('Database tables ensured.');
}

export async function storeMemory(user_id: string, message: string, response: string): Promise<void> {
    const dbInstance = await openDb();
    await run(
        dbInstance,
        'INSERT INTO conversations (user_id, message, response) VALUES (?, ?, ?)',
        [user_id, message, response]
    );
}

interface ConversationRow {
    message: string;
    response: string;
}

export async function getMemory(user_id: string): Promise<ConversationRow[]> {
    const dbInstance = await openDb();
    const history = await query<ConversationRow[]>(
        dbInstance,
        'SELECT message, response FROM conversations WHERE user_id = ? ORDER BY timestamp ASC',
        [user_id]
    );
    return history ?? [];
}

interface TradingStateRow {
    convinced: number;
}

export async function checkConvinced(user_id: string): Promise<number> {
    const dbInstance = await openDb();
    const result = await get<TradingStateRow>(
        dbInstance,
        'SELECT convinced FROM trading_state WHERE user_id = ?',
        [user_id]
    );
    return result?.convinced ?? 0;
}

export async function updateConvinced(user_id: string): Promise<void> {
    const dbInstance = await openDb();
    await run(
        dbInstance,
        `INSERT INTO trading_state (user_id, convinced)
         VALUES (?, 1)
         ON CONFLICT(user_id) DO UPDATE SET convinced=1`,
        [user_id]
    );
    console.log(`User ${user_id} marked as convinced.`);
}

process.on('exit', () => {
    if (db) {
        console.log('Closing database connection...');
        db.close((err) => {
            if (err) {
                console.error('Error closing database:', err.message);
            } else {
                console.log('Database connection closed.');
            }
        });
    }
});