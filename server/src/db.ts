import mysql, { RowDataPacket } from "mysql2/promise";
import dotenv from "dotenv";
dotenv.config();

const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
};

export const dbQuery = async (query: string, params: any[] = []) => {
    const conn = await mysql.createConnection(dbConfig);
    const [rows] = await conn.query<RowDataPacket[]>(query, params);
    await conn.end();
    return rows;
};

export const ensureTablesExist = async () => {
    const conn = await mysql.createConnection(dbConfig);
    await conn.query(`
        CREATE TABLE IF NOT EXISTS forms (
            id VARCHAR(36) PRIMARY KEY,
            data JSON NOT NULL
        )`);
    await conn.query(`
        CREATE TABLE IF NOT EXISTS responses (
            id INT AUTO_INCREMENT PRIMARY KEY,
            form_id VARCHAR(36),
            data JSON NOT NULL
        )`);
    await conn.end();
};
