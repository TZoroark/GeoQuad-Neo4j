require('dotenv').config();
const express = require('express');
const cors = require('cors');
const neo4j = require('neo4j-driver');

const app = express();
app.use(cors());
app.use(express.json());

// Khởi tạo Driver kết nối Neo4j
const driver = neo4j.driver(
    process.env.NEO4J_URI,
    neo4j.auth.basic(process.env.NEO4J_USER, process.env.NEO4J_PASSWORD)
);

app.get('/api/shapes', async (req, res) => {
    const session = driver.session();
    try {
        const result = await session.run('MATCH (s:Shape) RETURN s');
        const shapes = result.records.map(record => record.get('s').properties);
        res.json(shapes);
    } catch (error) {
        console.error('Lỗi truy vấn Neo4j:', error);
        res.status(500).json({ error: 'Lỗi truy vấn dữ liệu' });
    } finally {
        await session.close();
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server Backend đang chạy tại http://localhost:${PORT}`);
});