export class TransactionRepository {
    static Instance = null

    constructor(conn) {
        this.conn = conn
    }

    getByID(id, cb) {
        return this.conn.fetch("SELECT * FROM transactions WHERE id = ?", [id], cb)
    }

    acceptIt(id, userID, callback) {
        this.conn.execute(`
        UPDATE transactions SET accepted = true WHERE id = ? 
        `, [id]).execute(`
        UPDATE users SET userBalance = userBalance - (SELECT price FROM tranactions WHERE id = ? AND accepted = true LIMIT 1)/1.43 WHERE id = ?
        `, [id, userID], callback)
    }

    create(name, url, user_id, price, cb) {
        return this.conn.execute(`
            INSERT INTO transactions(name, url, user_id, price) VALUES (?, ?, ?, ?) RETURNING *; 
        `, [name, url, user_id, price], cb)
    }

    getUserByTransaction(id, cb) {
        return this.conn.fetch(`
            SELECT u.* FROM users AS u WHERE id IN (SELECT user_id FROM transactions AS tx WHERE tx.id = ?) 
        `, [id], cb)
    }

    async createTable() {
        this.conn.execute(`
        CREATE TABLE IF NOT EXISTS transactions( 
            id INTEGER PRIMARY KEY AUTOINCREMENT, 
            name VARCHAR(52) NOT NULL, 
            user_id INTEGER REFERENCES users ON DELETE CASCADE, 
            url TEXT NOT NULL, 
            accepted BOOLEAN DEFAULT false, 
            status INTEGER, 
            price INTEGER); 
        `)
    }

    static getInstance() {
        return TransactionRepository.Instance
    }

    static setInstance(ins) {
        TransactionRepository.Instance = ins
    }
}

export class UsersRepository {
    static Instance = null

    constructor(conn) {
        this.conn = conn
    }

    getByID(id, callback) {
        return this.conn.fetch(
            `SELECT * FROM users WHERE id = ? LIMIT 1;`, [id], callback
        )
    }

    getByTgID(tg_id, callback) {
        return this.conn.fetch(
            'SELECT * FROM users WHERE tg_id = ? LIMIT 1', [tg_id], callback,
        )
    }

    create(tg_username, tg_id, callback) {
        return this.conn.execute(
            `INSERT INTO users(tg_username, tg_id) VALUES (?, ?) RETURNING *`,
            [tg_username, tg_id],
            callback
        )
    }

    blockUser(tg_id, callback) {
        return this.conn.execute(
            `UPDATE users SET is_blocked = 1 WHERE tg_id = ?`
            [tg_id], callback
        )
    }

    blockUser(userId, callback) {
        return this.conn.run(
            `UPDATE users SET is_blocked = true WHERE tg_id = ?`,
            [userId],
            callback
        )
    }

    changeUserBalance(tg_id, amount, callback) {
        return this.conn.run(
            `UPDATE users SET userBalance = userBalance + ? WHERE userId = ?`,
            [amount, tg_id],
            callback,
        );
    }

    createTable() {
        this.conn.execute(
            `CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                telegramUsername TEXT,
                userBalance INTEGER DEFAULT 0,
                userId INTEGER,
                timeReg TEXT,
                chatState TEXT DEFAULT userState,
                allAmountBalance INTEGER, 
                is_blocked BOOLEAN DEFAULT false
              );`
        )
    }

    static getInstance() {
        return UsersRepository.Instance
    }

    static setInstance(ins) {
        UsersRepository.Instance = ins
    }
}

export class UserTokensRepositories {
    static Instance = null

    constructor(conn) {
        this.conn = conn
    }

    createTable() {
        this.conn.execute(
            `CREATE TABLE IF NOT EXISTS user_tokens (  
                id INTEGER PRIMARY KEY AUTOINCREMENT, 
                token TEXT,  
                is_active BOOLEAN DEFAULT true  
            );`
        )
    }

    static getInstance() {
        return UsersRepository.Instance
    }

    static setInstance(ins) {
        UsersRepository.Instance = ins
    }
}

export function createTables(conn) {
    let trans = new TransactionRepository(conn)
    let user = new UsersRepository(conn)
    let tokens = new UserTokensRepositories(conn)

    TransactionRepository.setInstance(trans)
    UsersRepository.setInstance(user)
    UserTokensRepositories.setInstance(tokens)

    user.createTable()
    trans.createTable()
    tokens.createTable()
}
