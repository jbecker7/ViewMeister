const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid');
const { Pool } = require('pg');
const path = require('path');
const postcss = require('postcss');
const fs = require('fs');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'postgres',
  password: 'password',
  port: 5432,
  ssl: false
});

app.use(bodyParser.json({ limit: '50mb' }));

// Enable CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*'); // Allow requests from any origin
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

// Serve static files
app.use(express.static(__dirname));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/:uuid', async (req, res) => {
  const uuid = req.params.uuid;

  try {
    const result = await pool.query(
      `
      SELECT images
      FROM image_reels
      WHERE uuid = $1
      `,
      [uuid]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Reel not found' });
      return;
    }

    const images = result.rows[0].images;
    res.status(200).json({ images });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to retrieve images' });
  }
});

app.post('/save-reel', async (req, res) => {
  const cssFilePath = path.join(__dirname, 'style.css'); // Replace with the actual path to your CSS file

  // Read the CSS file
  const cssContent = fs.readFileSync(cssFilePath, 'utf-8');

  // Parse the CSS and extract the background image URLs
  const imageUrls = [];
  postcss.parse(cssContent).walkDecls('background-image', (decl) => {
    const url = decl.value.match(/url\(["']?([^"']+)["']?\)/)[1];
    imageUrls.push(url);
  });

  const uuid = uuidv4();

  try {
    await pool.query(
      `
      INSERT INTO image_reels (uuid, images)
      VALUES ($1, $2)
      `,
      [uuid, imageUrls]
    );

    res.status(200).json({ uuid, images: imageUrls });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to save images' });
  }
});

app.listen(8080, function () {
  console.log('Example app listening on port 8080!');
});
