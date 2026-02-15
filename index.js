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
const ManualPod = require("./models/ManualPod");
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

// ✅ INSERT AUTO-INCREMENT POD DATA (Original)
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

// ✅ INSERT MANUAL POD DATA (NEW ENDPOINT)
app.post("/submitpod-manual", async (req, res) => {
  try {
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("🟡 MANUAL POD SUBMISSION RECEIVED");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("📊 Request Body:", req.body);

    // Validate required fields
    if (!req.body.podNumber) {
      return res.status(400).json({ error: "POD number is required" });
    }

    if (!req.body.date1) {
      return res.status(400).json({ error: "Date is required" });
    }

    // Check for duplicate POD number in ManualPod collection
    const existingManualPod = await ManualPod.findOne({ podNumber: req.body.podNumber });
    if (existingManualPod) {
      console.warn(`❌ POD #${req.body.podNumber} already exists in ManualPod collection`);
      return res.status(409).json({ error: "POD number already exists" });
    }

    // Check for duplicate POD number in Pod collection (auto-increment)
    const existingAutoPod = await Pod.findOne({ podNumber: req.body.podNumber });
    if (existingAutoPod) {
      console.warn(`❌ POD #${req.body.podNumber} already exists in Pod collection (auto-increment)`);
      return res.status(409).json({ error: "POD number conflicts with existing auto-increment POD" });
    }

    // Create and save manual POD
    const manualPod = new ManualPod({
      podNumber: req.body.podNumber,
      from1: req.body.from1,
      to1: req.body.to1,
      doc: req.body.doc,
      origin: req.body.origin,
      destination: req.body.destination,
      weight: req.body.weight,
      vol_weight: req.body.vol_weight,
      pieces: req.body.pieces,
      amount: req.body.amount,
      status1: req.body.status1,
      sender: req.body.sender,
      date1: new Date(req.body.date1),
    });

    const saved = await manualPod.save();
    
    console.log(`✅ Manual POD #${saved.podNumber} created successfully`);
    console.log(`📅 Date: ${saved.date1}`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    res.status(200).json(saved);
  } catch (err) {
    console.error("❌ Error:", err.message);
    
    // Handle duplicate key error
    if (err.code === 11000) {
      return res.status(409).json({ error: "POD number already exists" });
    }

    res.status(500).json({ error: "Insert failed", details: err.message });
  }
});

// Display previous data (Auto-increment PODs)
app.get("/get-all-pods", async (req, res) => {
  try {
    const pods = await Pod.find().sort({ date1: -1 });
    res.json(pods);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch pods" });
  }
});

// ✅ GET ALL MANUAL PODS
app.get("/get-all-manual-pods", async (req, res) => {
  try {
    const manualPods = await ManualPod.find().sort({ date1: -1 });
    res.json(manualPods);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch manual pods" });
  }
});

// ✅ GET MANUAL PODS (Alias endpoint for frontend)
app.get("/get-manual-pods", async (req, res) => {
  try {
    const manualPods = await ManualPod.find().sort({ date1: -1 });
    res.json(manualPods);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch manual pods" });
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

// ✅ UPDATE VOLWEIGHT, AMOUNT, AND PAYMENT STATUS (Auto-increment PODs)
app.put("/update-volweight/:id", async (req, res) => {
  try {
    const { vol_weight, amount, status1 } = req.body;
    const podNumber = Number(req.params.id);

    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("🔄 UPDATE REQUEST RECEIVED (Auto POD)");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`📍 Pod ID: ${podNumber}`);
    console.log(`📦 vol_weight: ${vol_weight}`);
    console.log(`💰 amount: ${amount}`);
    console.log(`📝 status1: ${status1}`);

    const updateData = {};
    if (vol_weight !== undefined) updateData.vol_weight = vol_weight;
    if (amount !== undefined) updateData.amount = amount;
    if (status1 !== undefined) updateData.status1 = status1;

    const updated = await Pod.findOneAndUpdate(
      { podNumber: podNumber },
      updateData,
      { new: true }
    );

    if (!updated) {
      console.warn(`❌ Pod #${podNumber} not found in auto-increment collection`);
      return res.status(404).json({ message: "POD not found" });
    }

    console.log(`✅ Pod #${podNumber} updated successfully`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    res.json({ message: "Updated successfully", data: updated });
  } catch (err) {
    console.error("❌ Error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// ✅ UPDATE VOLWEIGHT, AMOUNT, AND PAYMENT STATUS (Manual PODs)
app.put("/update-volweight-manual/:id", async (req, res) => {
  try {
    const { vol_weight, amount, status1 } = req.body;
    const podNumber = Number(req.params.id);

    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("🔄 UPDATE REQUEST RECEIVED (Manual POD)");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`📍 Pod ID: ${podNumber}`);
    console.log(`📦 vol_weight: ${vol_weight}`);
    console.log(`💰 amount: ${amount}`);
    console.log(`📝 status1: ${status1}`);

    const updateData = {};
    if (vol_weight !== undefined) updateData.vol_weight = vol_weight;
    if (amount !== undefined) updateData.amount = amount;
    if (status1 !== undefined) updateData.status1 = status1;

    const updated = await ManualPod.findOneAndUpdate(
      { podNumber: podNumber },
      updateData,
      { new: true }
    );

    if (!updated) {
      console.warn(`❌ Manual Pod #${podNumber} not found`);
      return res.status(404).json({ message: "Manual POD not found" });
    }

    console.log(`✅ Manual Pod #${podNumber} updated successfully`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    res.json({ message: "Updated successfully", data: updated });
  } catch (err) {
    console.error("❌ Error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// ✅ UPDATE PAYMENT STATUS ONLY (Manual PODs) - New endpoint
app.put("/update-payment-status-manual/:id", async (req, res) => {
  try {
    const { status1 } = req.body;
    const podNumber = Number(req.params.id);

    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("💳 UPDATE PAYMENT STATUS (Manual POD)");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`📍 Pod ID: ${podNumber}`);
    console.log(`📝 New Status: ${status1}`);

    const updated = await ManualPod.findOneAndUpdate(
      { podNumber: podNumber },
      { status1: status1 },
      { new: true }
    );

    if (!updated) {
      console.warn(`❌ Manual Pod #${podNumber} not found`);
      return res.status(404).json({ message: "Manual POD not found" });
    }

    console.log(`✅ Manual Pod #${podNumber} payment status updated to: ${status1}`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    res.json({ message: "Payment status updated successfully", data: updated });
  } catch (err) {
    console.error("❌ Error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Get suggestions from Pod data (both auto and manual)
app.get("/get-suggestions", async (req, res) => {
  try {
    // Get from auto-increment PODs
    const autoPodResult = await Pod.aggregate([
      {
        $project: {
          names: ["$from1", "$to1"],
        },
      },
      { $unwind: "$names" },
      { $group: { _id: "$names" } },
      { $project: { name: "$_id", _id: 0 } },
    ]);

    // Get from manual PODs
    const manualPodResult = await ManualPod.aggregate([
      {
        $project: {
          names: ["$from1", "$to1"],
        },
      },
      { $unwind: "$names" },
      { $group: { _id: "$names" } },
      { $project: { name: "$_id", _id: 0 } },
    ]);

    // Combine and deduplicate
    const combined = [...autoPodResult, ...manualPodResult];
    const unique = Array.from(new Set(combined.map(x => x.name))).map(name => ({ name }));

    res.json(unique);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch suggestions" });
  }
});

// Orders per day (last 6 days) - Both collections
app.get("/orders-per-day", async (req, res) => {
  try {
    const autoPods = await Pod.aggregate([
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

    const manualPods = await ManualPod.aggregate([
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

    // Merge results
    const merged = {};
    autoPods.forEach(pod => {
      merged[pod._id] = (merged[pod._id] || 0) + pod.total_orders;
    });
    manualPods.forEach(pod => {
      merged[pod._id] = (merged[pod._id] || 0) + pod.total_orders;
    });

    const result = Object.entries(merged).map(([date, count]) => ({
      _id: date,
      total_orders: count,
    })).sort((a, b) => a._id.localeCompare(b._id));

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch orders-per-day" });
  }
});

// Paid/Unpaid statistics (last 6 days) - Both collections
app.get("/paid-unpaid-stats", async (req, res) => {
  try {
    const autoPods = await Pod.aggregate([
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

    const manualPods = await ManualPod.aggregate([
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

    // Merge results
    const merged = {};
    autoPods.forEach(pod => {
      const key = `${pod._id.day}|${pod._id.status}`;
      merged[key] = (merged[key] || 0) + pod.count;
    });
    manualPods.forEach(pod => {
      const key = `${pod._id.day}|${pod._id.status}`;
      merged[key] = (merged[key] || 0) + pod.count;
    });

    const result = Object.entries(merged).map(([key, count]) => {
      const [day, status] = key.split('|');
      return {
        _id: { day, status },
        count,
      };
    });

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

// 404 Handler
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
  console.log("  POST   /submitpod                     (Auto-increment POD)");
  console.log("  POST   /submitpod-manual              ⭐ (Manual POD number & date)");
  console.log("  GET    /get-all-pods                  (Auto-increment PODs)");
  console.log("  GET    /get-all-manual-pods           ⭐ (Manual PODs)");
  console.log("  GET    /get-manual-pods               ⭐ (Manual PODs - Alias)");
  console.log("  PUT    /update-volweight/:id          (Auto-increment POD)");
  console.log("  PUT    /update-volweight-manual/:id   ⭐ (Manual POD)");
  console.log("  PUT    /update-payment-status-manual/:id ⭐ (Manual POD - Status only)");
  console.log("  GET    /get-suggestions               (From both collections)");
  console.log("  GET    /orders-per-day                (From both collections)");
  console.log("  GET    /paid-unpaid-stats             (From both collections)");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
});