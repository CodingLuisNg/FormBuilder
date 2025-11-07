import express from "express";
import { v4 as uuidv4 } from "uuid";
import mysql, { RowDataPacket } from "mysql2/promise";
import dotenv from "dotenv";
dotenv.config();

const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE
};

// Ensure tables exist in MySQL
async function ensureTablesExist() {
    const conn = await mysql.createConnection(dbConfig);
    await conn.query(`CREATE TABLE IF NOT EXISTS forms (
        id VARCHAR(36) PRIMARY KEY,
        data JSON NOT NULL
    )`);
    await conn.query(`CREATE TABLE IF NOT EXISTS responses (
        id INT AUTO_INCREMENT PRIMARY KEY,
        form_id VARCHAR(36),
        data JSON NOT NULL
    )`);
    await conn.end();
}

const app = express();
app.use(express.json());

const validateResponse = (form: any, data: any) => {
    const errors: string[] = [];
    form.fields.forEach((field: any) => {
        const value = data[field.id];
        if (!field.label?.trim()) errors.push(`Field label missing for ${field.id}`);
        if (field.type === "text") {
            if (field.validation?.required && !value?.trim()) errors.push(`${field.label} is required.`);
            if (field.validation?.minLength && value?.length < field.validation.minLength) errors.push(`${field.label} must be at least ${field.validation.minLength} characters.`);
            if (field.validation?.maxLength && value?.length > field.validation.maxLength) errors.push(`${field.label} must be at most ${field.validation.maxLength} characters.`);
        }
        if (field.type === "dropdown") {
            if (field.validation?.required && !value) errors.push(`${field.label} is required.`);
            if (value && field.options && !field.options.includes(value)) errors.push(`${field.label} value is not valid.`);
        }
        if (field.type === "table" && Array.isArray(value)) {
            value.forEach((row: any) => {
                field.columns.forEach((col: any) => {
                    const cell = row[col.id];
                    if (col.type === "text" && col.validation?.required && !cell?.trim()) errors.push(`${col.label} in ${field.label} is required.`);
                    if (col.type === "dropdown" && col.validation?.required && !cell) errors.push(`${col.label} in ${field.label} is required.`);
                    if (cell && col.options && !col.options.includes(cell)) errors.push(`${col.label} in ${field.label} value is not valid.`);
                });
            });
        }
    });
    return errors;
};

const parseFormData = (data: any) => (typeof data === "string" ? JSON.parse(data) : data);

const dbQuery = async (query: string, params: any[] = []) => {
    const conn = await mysql.createConnection(dbConfig);
    const [rows] = await conn.query<RowDataPacket[]>(query, params);
    await conn.end();
    return rows;
};

//Forms endpoints

app.get("/api/forms", async (_req, res) => {
    try {
        const rows = await dbQuery("SELECT data FROM forms");
        res.json(rows.map(row => parseFormData(row.data)));
    } catch {
        res.status(500).json({ error: "Database error" });
    }
});

app.post("/api/forms", async (req, res) => {
    const id = uuidv4();
    const form = { ...req.body, id };
    try {
        await dbQuery("INSERT INTO forms (id, data) VALUES (?, ?)", [id, JSON.stringify(form)]);
        res.status(201).json(form);
    } catch {
        res.status(500).json({ error: "Database error" });
    }
});

app.get("/api/forms/:id", async (req, res) => {
    try {
        const rows = await dbQuery("SELECT data FROM forms WHERE id = ?", [req.params.id]);
        if (!rows.length) return res.status(404).json({ error: "Form not found" });
        res.json(parseFormData(rows[0].data));
    } catch {
        res.status(500).json({ error: "Database error" });
    }
});

app.put("/api/forms/:id", async (req, res) => {
    const id = req.params.id;
    const form = { ...req.body, id };
    try {
        await dbQuery("UPDATE forms SET data = ? WHERE id = ?", [JSON.stringify(form), id]);
        res.status(200).json(form);
    } catch {
        res.status(500).json({ error: "Database error" });
    }
});

app.delete("/api/forms/:id", async (req, res) => {
    try {
        await dbQuery("DELETE FROM forms WHERE id = ?", [req.params.id]);
        res.status(204).end();
    } catch {
        res.status(500).json({ error: "Database error" });
    }
});

//Responses endpoints

app.post("/api/forms/:id/responses", async (req, res) => {
    try {
        const rows = await dbQuery("SELECT data FROM forms WHERE id = ?", [req.params.id]);
        if (!rows.length) return res.status(404).json({ error: "Form not found" });
        const form = parseFormData(rows[0].data);
        const errors = validateResponse(form, req.body);
        if (errors.length) return res.status(400).json({ errors });
        await dbQuery("INSERT INTO responses (form_id, data) VALUES (?, ?)", [req.params.id, JSON.stringify(req.body)]);
        res.status(201).json({ success: true });
    } catch {
        res.status(500).json({ error: "Database error" });
    }
});

app.get("/api/forms/:id/responses", async (req, res) => {
    try {
        const rows = await dbQuery("SELECT data FROM responses WHERE form_id = ?", [req.params.id]);
        res.json(rows.map(row => parseFormData(row.data)));
    } catch {
        res.status(500).json({ error: "Database error" });
    }
});

app.delete("/api/forms/:id/responses", async (req, res) => {
    try {
        await dbQuery("DELETE FROM responses WHERE form_id = ?", [req.params.id]);
        res.status(204).end();
    } catch {
        res.status(500).json({ error: "Database error" });
    }
});

const PORT = 8080;

ensureTablesExist().then(() => {
    app.listen(PORT, "0.0.0.0", () => console.log(`Server running on http://localhost:${PORT}`));
}).catch((err) => {
    console.error("Failed to ensure tables exist:", err);
    process.exit(1);
});
