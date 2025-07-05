require('dotenv').config();

const express = require("express");
const db = require("./db"); // Now using the pool
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(bodyParser.json());


// ✅ Test route to verify server
app.get("/test", (req, res) => {
  res.send("API is working ✅");
});


// Register new user
app.post("/register", (req, res) => {
  const { username, password } = req.body;
  db.query(
    "INSERT INTO users (username, password) VALUES (?, ?)",
    [username, password],
    (err, results) => {
      if (err) {
        return res.status(500).send("Error registering user");
      }
      res.send("User registered successfully");
    }
  );
});

// Login user
app.post("/login", (req, res) => {
  const { username, password } = req.body;
  db.query(
    "SELECT * FROM users WHERE username = ? AND password = ?",
    [username, password],
    (err, results) => {
      if (err) {
        return res.status(500).send("Server error");
      }
      if (results.length > 0) {
        res.send("Login successful");
      } else {
        console.log()
        res.status(401).send("Invalid username or password");
      }
    }
  );
});

// Insert POD Data
app.post("/submitpod", (req, res) => {
  const {
    from1,
    to1,
    origin,
    destination,
    doc,
    weight,
    vol_weight,
    pieces,
    amount,
    status1,
    sender,
  } = req.body;

console.log("Received POD data:", req.body);

  const query = `
    INSERT INTO pod_data
    (from1, to1, origin, destination, doc, weight, vol_weight, pieces, amount, status1, sender)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;


  db.query(
    query,
    [from1, to1, origin, destination, doc, weight, vol_weight, pieces, amount, status1, sender],
    (err, result) => {
      if (err) {
        console.error("Error inserting POD data:", err);
       return res.status(500).json({ error: "Insert failed" });
      }
     const fetchQuery = `SELECT * FROM pod_data WHERE id = LAST_INSERT_ID()`;

      db.query(fetchQuery, (fetchErr, rows) => {
        if (fetchErr) {
          console.error("Error fetching inserted POD:", fetchErr);
          return res.status(500).json({ error: "Fetch failed" });
        }

        res.status(200).json(rows[0]);
      });
    }
    
  );
});

//display previous data 
app.get('/get-all-pods', (req, res) => {
  db.query('SELECT *, DATE_FORMAT(date1, "%d-%m-%Y") AS formattedDate FROM pod_data', (err, results)=> {
    if (err) {
      return res.status(500).send({ error: err });
    }
    res.json(results);
  });
});


app.get('/get-address', (req, res) => {
  db.query('SELECT address FROM address WHERE id = 1', (err, result) => {
    if (err) return res.status(500).send(err);
    res.json(result[0]);
  });
});

// UPDATE Address
app.put('/update-address', (req, res) => {
  console.log('BODY RECEIVED:', req.body);
  const { address } = req.body;
  if (!address) return res.status(400).send("Address missing");

  db.query('UPDATE address SET address = ? WHERE id = 1', [address], (err, result) => {
    if (err) {
      console.error('DB ERROR:', err);
      return res.status(500).send(err);
    }
    res.json({ message: 'Address updated successfully' });
  });
});

// Get all locations
app.get('/get-locations', (req, res) => {
  db.query('SELECT city_name FROM locations', (err, result) => {
    if (err) return res.status(500).send(err);
    res.json(result);
  });
});

// Add location
app.post('/add-location', (req, res) => {
  const { city_name } = req.body;
  db.query('INSERT INTO locations (city_name) VALUES (?)', [city_name], (err) => {
    if (err) return res.status(500).send(err);
    res.json({ message: 'City added' });
  });
});

// Delete location
app.delete('/delete-location/:city', (req, res) => {
  const { city } = req.params;
  db.query('DELETE FROM locations WHERE city_name = ?', [city], (err) => {
    if (err) return res.status(500).send(err);
    res.json({ message: 'City deleted' });
  });
});

// GET all senders
app.get('/get-senders', (req, res) => {
  db.query('SELECT name FROM senders', (err, result) => {
    if (err) return res.status(500).send(err);
    res.json(result);
  });
});

// POST add sender
app.post('/add-sender', (req, res) => {
  const { name } = req.body;
  db.query('INSERT INTO senders (name) VALUES (?)', [name], (err) => {
    if (err) return res.status(500).send(err);
    res.json({ message: 'Sender added' });
  });
});

// DELETE sender
app.delete('/delete-sender/:name', (req, res) => {
  const { name } = req.params;
  db.query('DELETE FROM senders WHERE name = ?', [name], (err) => {
    if (err) return res.status(500).send(err);
    res.json({ message: 'Sender deleted' });
  });
});

app.put('/update-payment-status/:id', (req, res) => {
  const { id } = req.params;
  const { status1 } = req.body;

  db.query(
    'UPDATE pod_data SET status1 = ? WHERE id = ?',
    [status1, id],
    (err, result) => {
      if (err) return res.status(500).send(err);
      res.json({ message: 'Payment status updated successfully' });
    }
  );
});

app.get('/get-suggestions', (req, res) => {
  db.query(
    `SELECT DISTINCT from1 AS name FROM pod_data
     UNION
     SELECT DISTINCT to1 AS name FROM pod_data`,
    (err, result) => {
      if (err) {
        console.error('Error fetching suggestions:', err);
        return res.status(500).send(err);
      }
      res.json(result); // result = [{ name: 'A' }, { name: 'B' }]
    }
  );
});

app.get('/orders-per-day', (req, res) => {
  const query = `
    SELECT DATE(date1) AS day, COUNT(*) AS total_orders
    FROM pod_data
    WHERE date1 >= CURDATE() - INTERVAL 6 DAY
    GROUP BY day
    ORDER BY day ASC
  `;

  db.query(query, (err, result) => {
    if (err) {
      console.error('Error fetching order data:', err);
      return res.status(500).send(err);
    }
    res.json(result); // [{ day: "2025-07-01", total_orders: 4 }, ...]
  });
});

app.get('/paid-unpaid-stats', (req, res) => {
  const query = `
    SELECT 
      DATE(date1) AS day,
      SUM(CASE WHEN status1 = 'Paid' THEN 1 ELSE 0 END) AS paid,
      SUM(CASE WHEN status1 = 'Unpaid' THEN 1 ELSE 0 END) AS unpaid
    FROM pod_data
    WHERE date1 >= CURDATE() - INTERVAL 6 DAY
    GROUP BY day
    ORDER BY day ASC;
  `;

  db.query(query, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

app.put('/update-volweight/:id', async (req, res) => {
  const { vol_weight, amount } = req.body;
  const id = req.params.id;

  try {
    await db.query(
      'UPDATE pod_data SET vol_weight = ?, amount = ? WHERE id = ?',
      [vol_weight, amount, id]
    );
    res.json({ message: 'Vol weight and amount updated successfully' });
  } catch (err) {
    console.error('❌ Failed to update:', err);
    res.status(500).json({ error: 'Failed to update record' });
  }
});

app.get('/check-db', (req, res) => {
  db.query('SELECT 1 + 1 AS result', (err, result) => {
    if (err) {
      console.error("❌ DB Connection FAILED:", err);
      return res.status(500).json({ connected: false, error: err.message });
    }
    res.status(200).json({ connected: true, result: result[0] });
  });
});



// Start server
app.listen(3000,'0.0.0.0', () => {
  console.log("Server running on http://0.0.0.0:3000");
});
