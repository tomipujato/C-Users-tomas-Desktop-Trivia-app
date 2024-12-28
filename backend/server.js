// backend/server.js

const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Conexión a la base de datos
const db = new sqlite3.Database('./database.db', (err) => {
    if (err) {
        console.error('Error al conectar con la base de datos:', err.message);
        process.exit(1); // Finaliza el proceso si hay error
    } else {
        console.log('Conexión exitosa a la base de datos SQLite.');
    }
});

// Crear tabla si no existe
db.run(`
    CREATE TABLE IF NOT EXISTS ranking (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        score INTEGER NOT NULL
    )
`, (err) => {
    if (err) {
        console.error('Error al crear la tabla:', err.message);
    }
});

// Endpoint para obtener los mejores puntajes
app.get('/api/ranking', (req, res) => {
    db.all('SELECT name, score FROM ranking ORDER BY score DESC LIMIT 10', [], (err, rows) => {
        if (err) {
            console.error('Error al obtener los puntajes:', err.message);
            res.status(500).json({ error: 'Error al obtener los puntajes.' });
            return;
        }
        res.json(rows);
    });
});

// Endpoint para agregar un puntaje
app.post('/api/ranking', (req, res) => {
    const { name, score } = req.body;
    if (!name || score === undefined) {
        res.status(400).json({ error: 'Nombre y puntaje son requeridos.' });
        return;
    }
    db.run('INSERT INTO ranking (name, score) VALUES (?, ?)', [name, score], function (err) {
        if (err) {
            console.error('Error al guardar el puntaje:', err.message);
            res.status(500).json({ error: 'Error al guardar el puntaje.' });
            return;
        }
        res.json({ id: this.lastID, name, score });
    });
});

// Cerrar conexión de la base de datos al finalizar
process.on('SIGINT', () => {
    db.close((err) => {
        if (err) {
            console.error('Error al cerrar la base de datos:', err.message);
        }
        console.log('Conexión a la base de datos cerrada.');
        process.exit(0);
    });
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
