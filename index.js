require('dotenv').config();
const mongoose = require("mongoose");
const express = require("express"); // Now using the pool
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(bodyParser.json());



const User = require("./models/User");
const Pod = require("./models/Pod");
const Address = require("./models/Address");
const Location = require("./models/Location");
const Sender = require("./models/Sender");

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB connected");
  })
  .catch((err) => {
    console.error("❌ MongoDB connection failed:", err.message);
  });


// ✅ Test route to verify server
app.get("/test", (req, res) => {
  res.send("API is working ✅");
});


// Register new user


app.post("/register", async (req, res) => {
  try {
    const user = new User(req.body);
    await user.save();
    res.send("User registered successfully");
  } catch (err) {
    res.status(500).send("Error registering user");
  }
});


// Login user
app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  const user = await User.findOne({ username, password });
  if (user) res.send("Login successful");
  else res.status(401).send("Invalid credentials");
});


// Insert POD Data


app.post("/submitpod", async (req, res) => {
  try {
    const pod = new Pod({
      ...req.body,
      date1: new Date() // ✅ FORCE date
    });

    const saved = await pod.save();
    res.status(200).json(saved);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Insert failed" });
  }
});



//display previous data 
app.get("/get-all-pods", async (req, res) => {
  const pods = await Pod.find().sort({ date1: -1 });
  res.json(pods);
});



app.get("/get-address", async (req, res) => {
  const address = await Address.findOne();
  res.json(address);
});


// UPDATE Address
app.put("/update-address", async (req, res) => {
  const { address } = req.body;

  await Address.findOneAndUpdate(
    {},
    { address },
    { upsert: true }
  );

  res.json({ message: "Address updated successfully" });
});


// Get all locations
app.get("/get-locations", async (req, res) => {
  const locations = await Location.find();
  res.json(locations);
});

// Add location
app.post("/add-location", async (req, res) => {
  await Location.create(req.body);
  res.json({ message: "City added" });
});


// Delete location
app.delete("/delete-location/:city", async (req, res) => {
  await Location.deleteOne({ city_name: req.params.city });
  res.json({ message: "City deleted" });
});


// GET all senders
app.get("/get-senders", async (req, res) => {
  const senders = await Sender.find();
  res.json(senders);
});

// POST add sender
app.post("/add-sender", async (req, res) => {
  await Sender.create(req.body);
  res.json({ message: "Sender added" });
});



// DELETE sender
app.delete("/delete-sender/:name", async (req, res) => {
  await Sender.deleteOne({ name: req.params.name });
  res.json({ message: "Sender deleted" });
});


app.put("/update-payment-status/:id", async (req, res) => {
  await Pod.findByIdAndUpdate(req.params.id, {
    status1: req.body.status1
  });
  res.json({ message: "Updated successfully" });
});


app.get("/get-suggestions", async (req, res) => {
  const result = await Pod.aggregate([
    {
      $project: {
        names: ["$from1", "$to1"]
      }
    },
    { $unwind: "$names" },
    { $group: { _id: "$names" } },
    { $project: { name: "$_id", _id: 0 } }
  ]);

  res.json(result);
});


app.get("/orders-per-day", async (req, res) => {
  const result = await Pod.aggregate([
    {
      $match: {
        date1: { $gte: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000) }
      }
    },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$date1" } },
        total_orders: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  res.json(result);
});

app.get("/paid-unpaid-stats", async (req, res) => {
  const result = await Pod.aggregate([
    {
      $match: {
        date1: { $gte: new Date(Date.now() - 6 * 86400000) }
      }
    },
    {
      $group: {
        _id: {
          day: { $dateToString: { format: "%Y-%m-%d", date: "$date1" } },
          status: "$status1"
        },
        count: { $sum: 1 }
      }
    }
  ]);

  res.json(result);
});


app.put("/update-volweight/:id", async (req, res) => {
  const { vol_weight, amount } = req.body;

  await Pod.findByIdAndUpdate(req.params.id, {
    vol_weight,
    amount
  });

  res.json({ message: "Updated successfully" });
});


app.get("/check-db", (req, res) => {
  res.json({ connected: true, db: "MongoDB" });
});




// Start server
app.listen(3000,'0.0.0.0', () => {
  console.log("Server running on http://0.0.0.0:3000");
});
