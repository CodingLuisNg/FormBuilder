import express from "express";
import { v4 as uuidv4 } from "uuid";
import {validateResponse} from "./validation";
import {dbQuery, ensureTablesExist} from "./db";

const app = express();
app.use(express.json());

const parseFormData = (data: any) => (typeof data === "string" ? JSON.parse(data) : data);

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
