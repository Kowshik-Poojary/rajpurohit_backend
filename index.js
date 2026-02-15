require("dotenv").config();
const mongoose = require("mongoose");
const express = require("express");
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

mongoose
  .connect(process.env.MONGO_URI)
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
      date1: new Date(),
    });

    const saved = await pod.save();
    res.status(200).json(saved);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Insert failed" });
  }
});

// Display previous data
app.get("/get-all-pods", async (req, res) => {
  try {
    const pods = await Pod.find().sort({ date1: -1 });
    res.json(pods);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch pods" });
  }
});

app.get("/get-address", async (req, res) => {
  try {
    const address = await Address.findOne();
    res.json(address);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch address" });
  }
});

// UPDATE Address
app.put("/update-address", async (req, res) => {
  try {
    const { address } = req.body;

    await Address.findOneAndUpdate({}, { address }, { upsert: true });

    res.json({ message: "Address updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update address" });
  }
});

// Get all locations
app.get("/get-locations", async (req, res) => {
  try {
    const locations = await Location.find();
    res.json(locations);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch locations" });
  }
});

// Add location
app.post("/add-location", async (req, res) => {
  try {
    await Location.create(req.body);
    res.json({ message: "City added" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to add location" });
  }
});

// Delete location
app.delete("/delete-location/:city", async (req, res) => {
  try {
    await Location.deleteOne({ city_name: req.params.city });
    res.json({ message: "City deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete location" });
  }
});

// GET all senders
app.get("/get-senders", async (req, res) => {
  try {
    const senders = await Sender.find();
    res.json(senders);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch senders" });
  }
});

// POST add sender
app.post("/add-sender", async (req, res) => {
  try {
    await Sender.create(req.body);
    res.json({ message: "Sender added" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to add sender" });
  }
});

// DELETE sender
app.delete("/delete-sender/:name", async (req, res) => {
  try {
    await Sender.deleteOne({ name: req.params.name });
    res.json({ message: "Sender deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete sender" });
  }
});

// ✅ UPDATE VOLWEIGHT, AMOUNT, AND PAYMENT STATUS
app.put("/update-volweight/:id", async (req, res) => {
  try {
    const { vol_weight, amount, status1 } = req.body;
    const podNumber = Number(req.params.id);

    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("🔄 UPDATE REQUEST RECEIVED");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`📍 Pod ID: ${podNumber}`);
    console.log(`📦 vol_weight: ${vol_weight}`);
    console.log(`💰 amount: ${amount}`);
    console.log(`📝 status1: ${status1}`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    // Build update object - only include fields that are provided
    const updateData = {};
    if (vol_weight !== undefined) updateData.vol_weight = vol_weight;
    if (amount !== undefined) updateData.amount = amount;
    if (status1 !== undefined) updateData.status1 = status1;

    console.log("📤 Update data to apply:", updateData);

    const updated = await Pod.findOneAndUpdate(
      { podNumber: podNumber },
      updateData,
      { new: true }
    );

    if (!updated) {
      console.warn(`❌ Pod #${podNumber} not found`);
      return res.status(404).json({ message: "POD not found" });
    }

    console.log(`✅ Pod #${podNumber} updated successfully`);
    console.log(`✅ Updated data:`, updated);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    res.json({ message: "Updated successfully", data: updated });

  } catch (err) {
    console.error("❌ Error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Get suggestions from Pod data
app.get("/get-suggestions", async (req, res) => {
  try {
    const result = await Pod.aggregate([
      {
        $project: {
          names: ["$from1", "$to1"],
        },
      },
      { $unwind: "$names" },
      { $group: { _id: "$names" } },
      { $project: { name: "$_id", _id: 0 } },
    ]);

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch suggestions" });
  }
});

// Orders per day (last 6 days)
app.get("/orders-per-day", async (req, res) => {
  try {
    const result = await Pod.aggregate([
      {
        $match: {
          date1: { $gte: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000) },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$date1" } },
          total_orders: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch orders-per-day" });
  }
});

// Paid/Unpaid statistics (last 6 days)
app.get("/paid-unpaid-stats", async (req, res) => {
  try {
    const result = await Pod.aggregate([
      {
        $match: {
          date1: { $gte: new Date(Date.now() - 6 * 86400000) },
        },
      },
      {
        $group: {
          _id: {
            day: { $dateToString: { format: "%Y-%m-%d", date: "$date1" } },
            status: "$status1",
          },
          count: { $sum: 1 },
        },
      },
    ]);

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch paid-unpaid-stats" });
  }
});

// Health check
app.get("/check-db", (req, res) => {
  res.json({ connected: true, db: "MongoDB" });
});

// 404 Handler - log all unknown routes
app.use((req, res) => {
  console.warn(`❌ Route not found: ${req.method} ${req.url}`);
  res.status(404).json({ error: `${req.method} ${req.url} not found` });
});

// Start server
const PORT = 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`✅ Server running on http://0.0.0.0:${PORT}`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("Available endpoints:");
  console.log("  POST   /submitpod");
  console.log("  GET    /get-all-pods");
  console.log("  PUT    /update-volweight/:id  ⭐ (For status, volume weight, amount)");
  console.log("  GET    /get-suggestions");
  console.log("  GET    /orders-per-day");
  console.log("  GET    /paid-unpaid-stats");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
});