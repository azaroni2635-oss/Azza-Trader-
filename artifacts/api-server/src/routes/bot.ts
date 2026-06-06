import { Router } from "express";
import { runScan } from "../bot/scanner";

const router = Router();

router.post("/bot/scan", async (req, res) => {
  try {
    const result = await runScan();
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message ?? "Scan failed" });
  }
});

router.get("/bot/status", (_req, res) => {
  res.json({
    status: "running",
    model: "gemma3:4b",
    pair: "XAUUSD",
    sl: "$4",
    rr: "min 1:2",
    scanInterval: "15 minutes",
  });
});

export default router;
