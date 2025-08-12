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
    // Input validation
    if (
      drivers == null ||
      !startTime ||
      maxHoursPerDay == null ||
      typeof drivers !== "number" ||
      typeof maxHoursPerDay !== "number" ||
      drivers <= 0 ||
      maxHoursPerDay <= 0 ||
      drivers > 100 // Arbitrary upper limit for sanity
    ) {
      return res.status(400).json({
        error: {
          code: "INVALID_PARAMS",
          message: "Invalid or missing simulation parameters",
          details: { drivers, startTime, maxHoursPerDay }
        }
      });
    }

    // Fetch all orders, routes, and drivers
    const allOrders = await prisma.order.findMany();
    const allRoutes = await prisma.route.findMany();
    const allDrivers = await prisma.driver.findMany();

    // Reallocate orders to available drivers (round-robin)
    let assignedDrivers = allDrivers.slice(0, drivers);
    if (assignedDrivers.length < drivers) {
      return res.status(400).json({
        error: {
          code: "DRIVER_COUNT_EXCEEDS_AVAILABLE",
          message: "Requested driver count exceeds available drivers",
          details: { availableDrivers: allDrivers.length }
        }
      });
    }

    // Simulate driver fatigue and allocation
    let driverWorkHours = assignedDrivers.map(() => 0);
    let driverFatigue = assignedDrivers.map(() => false);

    let onTimeDeliveries = 0;
    let totalDeliveries = allOrders.length;
    let totalProfit = 0;

    let orderResults = [];

    for (let i = 0; i < allOrders.length; i++) {
      const order = allOrders[i];
      const route = allRoutes.find(r => r.routeId === order.routeId);
      if (!route) continue;

      // Assign driver (round-robin)
      let driverIdx = i % assignedDrivers.length;
      let driver = assignedDrivers[driverIdx];

      // Simulate fatigue: if driver worked >8h yesterday, speed -30% today
      let fatigue = driverFatigue[driverIdx];
      let baseDeliveryTime = route.baseTime;
      let deliveryTime = baseDeliveryTime + (route.traffic === "High" ? 15 : 5);

      if (driverWorkHours[driverIdx] > 8) {
        fatigue = true;
        deliveryTime = Math.ceil(deliveryTime * 1.3);
      }

      // Update work hours for driver
      driverWorkHours[driverIdx] += deliveryTime / 60; // convert minutes to hours

      // Late delivery penalty
      let isLate = deliveryTime > (baseDeliveryTime + 10);
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

      orderResults.push({
        orderId: order.orderId,
        assignedDriverId: driver.id,
        isLate,
        penalty,
        bonus,
        fuelCost,
        profit,
        fatigueApplied: fatigue
      });

      // Fatigue rule for next day
      driverFatigue[driverIdx] = driverWorkHours[driverIdx] > 8;
      // Reset work hours if maxHoursPerDay exceeded
      if (driverWorkHours[driverIdx] > maxHoursPerDay) driverWorkHours[driverIdx] = 0;
    }

    let efficiencyScore = totalDeliveries > 0 ? (onTimeDeliveries / totalDeliveries) * 100 : 0;

    res.json({
      totalProfit,
      efficiencyScore,
      onTimeDeliveries,
      totalDeliveries,
      orderResults,
      error: null
    });
  } catch (e) {
    res.status(400).json({
      error: {
        code: "SIMULATION_ERROR",
        message: e.message
      }
    });
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