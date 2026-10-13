import { Server } from '../models/Server.js';
import { Order } from '../models/Order.js';
import { COCO_FEE } from '../services/pricingService.js';
import { serverView } from '../lib/serverView.js';
import { str } from '../lib/http.js';

export async function getUserServers(req, res) {
  const servers = await Server.find({ userId: req.user._id }).sort({ createdAt: -1 });
  return res.json({ success: true, count: servers.length, servers: servers.map(serverView) });
}

export async function getServerById(req, res) {
  const server = await Server.findOne({ userId: req.user._id, serial: str(req.params.id, 40) });
  if (!server) {
    return res.status(404).json({ error: 'not_found', message: 'Server not found' });
  }
  return res.json({ success: true, server: serverView(server) });
}

export async function requestDisconnect(req, res) {
  const server = await Server.findOne({ userId: req.user._id, serial: str(req.params.id, 40) });
  if (!server) {
    return res.status(404).json({ error: 'not_found', message: 'Server not found' });
  }
  if (!server.disconnectRequestedAt) {
    server.disconnectRequestedAt = new Date();
    server.alerts.push({
      level: 'warning',
      title: 'Disconnect requested',
      detail: 'You asked to disconnect this server. Our team will move workloads off it and confirm next steps by email.',
      time: new Date(),
    });
    await server.save();
    console.info(`[Servers] Disconnect requested for ${server.serial} by ${req.user.email}`);
  }
  return res.json({ success: true, server: serverView(server) });
}

const round1 = (n) => Math.round(n * 10) / 10;

export async function getPortfolioSummary(req, res) {
  const userId = req.user._id;
  const [servers, orders] = await Promise.all([Server.find({ userId }), Order.find({ userId })]);

  const online = servers.filter((s) => s.status === 'Online');
  const availableCompute = online.reduce((a, s) => a + (s.vcpu || s.cores * 2 || 0), 0);
  const computeSold = online.reduce((a, s) => a + (s.allocatedVcpu || 0), 0);
  const thisMonthRevenue = servers.reduce((a, s) => a + (s.revenue || 0), 0);
  // Rack space is prepaid for 24 months, so CoCo's fee is the only deduction.
  const cocoFee = Math.round(thisMonthRevenue * COCO_FEE * 100) / 100;

  // Sum each server's monthly revenue history into one series, keeping month order.
  const byMonth = new Map();
  for (const s of servers) {
    for (const h of s.history || []) byMonth.set(h.m, (byMonth.get(h.m) || 0) + (h.v || 0));
  }
  const monthlyRevenue = [...byMonth].map(([m, v]) => ({ m, v })).slice(-6);
  const lastMonthRevenue = monthlyRevenue.length > 1 ? monthlyRevenue[monthlyRevenue.length - 2].v : 0;

  return res.json({
    success: true,
    portfolio: {
      totalServers: servers.length,
      activeServers: online.length,
      pendingServers: servers.length - online.length,
      locations: [...new Set(servers.map((s) => s.location).filter(Boolean))],
      availableCompute,
      computeSold,
      utilization: availableCompute ? round1((computeSold / availableCompute) * 100) : 0,
      activeCustomers: servers.reduce((a, s) => a + (s.customers || 0), 0),
      thisMonthRevenue,
      lastMonthRevenue,
      monthlyRevenue,
      revenueToDate: servers.reduce((a, s) => a + (s.revenueToDate || 0), 0),
      cocoFee,
      pendingPayout: Math.round((thisMonthRevenue - cocoFee) * 100) / 100,
      cocoFeeRate: COCO_FEE,
      totalInvested: orders.filter((o) => o.paymentStatus === 'paid').reduce((a, o) => a + (o.quote?.total || 0), 0),
      orders: {
        total: orders.length,
        paid: orders.filter((o) => o.paymentStatus === 'paid').length,
        awaiting: orders.filter((o) => ['awaiting', 'processing', 'review'].includes(o.paymentStatus)).length,
      },
    },
  });
}
