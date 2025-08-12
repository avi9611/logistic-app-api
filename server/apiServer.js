const express = require('express');
const { PrismaClient } = require('@prisma/client');
const bodyParser = require('body-parser');

const prisma = new PrismaClient();
const app = express();
app.use(bodyParser.json());

// --- CRUD Endpoints ---

// Drivers
app.get('/drivers', async (req, res) => {
  const drivers = await prisma.driver.findMany();
  res.json(drivers);
});
app.post('/drivers', async (req, res) => {
  try {
    const { name, shiftHours, workHours7d } = req.body;
    if (!name || shiftHours == null || !Array.isArray(workHours7d)) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    const driver = await prisma.driver.create({ data: { name, shiftHours, workHours7d } });
    res.json(driver);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});
app.put('/drivers/:id', async (req, res) => {
  try {
    const { name, shiftHours, workHours7d } = req.body;
    const driver = await prisma.driver.update({
      where: { id: req.params.id },
      data: { name, shiftHours, workHours7d }
    });
    res.json(driver);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});
app.delete('/drivers/:id', async (req, res) => {
  try {
    await prisma.driver.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// Routes
app.get('/routes', async (req, res) => {
  const routes = await prisma.route.findMany();
  res.json(routes);
});
app.post('/routes', async (req, res) => {
  try {
    const { routeId, name, distance, traffic, baseTime } = req.body;
    if (!routeId || !name || distance == null || !traffic || baseTime == null) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    const route = await prisma.route.create({ data: { routeId, name, distance, traffic, baseTime } });
    res.json(route);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});
app.put('/routes/:id', async (req, res) => {
  try {
    const { routeId, name, distance, traffic, baseTime } = req.body;
    const route = await prisma.route.update({
      where: { id: req.params.id },
      data: { routeId, name, distance, traffic, baseTime }
    });
    res.json(route);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});
app.delete('/routes/:id', async (req, res) => {
  try {
    await prisma.route.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// Orders
app.get('/orders', async (req, res) => {
  const orders = await prisma.order.findMany();
  res.json(orders);
});
app.post('/orders', async (req, res) => {
  try {
    const { orderId, valueRs, routeId, deliveryTimestamp, assignedDriverId, status } = req.body;
    if (!orderId || valueRs == null || !routeId || !deliveryTimestamp || !status) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    const order = await prisma.order.create({
      data: { orderId, valueRs, routeId, deliveryTimestamp: new Date(deliveryTimestamp), assignedDriverId, status }
    });
    res.json(order);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});
app.put('/orders/:id', async (req, res) => {
  try {
    const { orderId, valueRs, routeId, deliveryTimestamp, assignedDriverId, status } = req.body;
    const order = await prisma.order.update({
      where: { id: req.params.id },
      data: { orderId, valueRs, routeId, deliveryTimestamp: new Date(deliveryTimestamp), assignedDriverId, status }
    });
    res.json(order);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});
app.delete('/orders/:id', async (req, res) => {
  try {
    await prisma.order.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// --- Simulation Endpoint ---
app.post('/simulate', async (req, res) => {
  try {
    const { drivers, startTime, maxHoursPerDay } = req.body;
    if (
      drivers == null ||
      !startTime ||
      maxHoursPerDay == null ||
      drivers <= 0 ||
      maxHoursPerDay <= 0
    ) {
      return res.status(400).json({ error: 'Invalid or missing simulation parameters' });
    }

    // Fetch all orders, routes, and drivers
    const allOrders = await prisma.order.findMany();
    const allRoutes = await prisma.route.findMany();
    const allDrivers = await prisma.driver.findMany();

    // --- Simulation Logic (simplified for brevity) ---
    // Apply company rules and calculate KPIs
    let onTimeDeliveries = 0;
    let totalDeliveries = allOrders.length;
    let totalProfit = 0;
    let efficiencyScore = 0;

    for (const order of allOrders) {
      const route = allRoutes.find(r => r.routeId === order.routeId);
      if (!route) continue;

      // Calculate delivery time and penalties
      const baseDeliveryTime = route.baseTime;
      const actualDeliveryTime = baseDeliveryTime + (route.traffic === "High" ? 15 : 5);
      const isLate = new Date(order.deliveryTimestamp).getMinutes() > baseDeliveryTime + 10;
      let penalty = isLate ? 50 : 0;

      // Fuel cost
      let fuelCost = route.distance * 5;
      if (route.traffic === "High") fuelCost += route.distance * 2;

      // High-value bonus
      let bonus = 0;
      if (order.valueRs > 1000 && !isLate) bonus = order.valueRs * 0.1;

      // Profit calculation
      let profit = order.valueRs + bonus - penalty - fuelCost;
      totalProfit += profit;

      if (!isLate) onTimeDeliveries++;
    }

    efficiencyScore = totalDeliveries > 0 ? (onTimeDeliveries / totalDeliveries) * 100 : 0;

    res.json({
      totalProfit,
      efficiencyScore,
      onTimeDeliveries,
      totalDeliveries,
      error: null
    });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// --- Error Handling ---
app.use((err, req, res, next) => {
  res.status(500).json({ error: err.message });
});

// --- Start Server ---
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`API server running on port ${PORT}`);
});