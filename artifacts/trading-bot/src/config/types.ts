/**
 * Global type definitions for trading bot
 */

export enum TradeDirection {
  BUY = 'BUY',
  SELL = 'SELL',
}

export enum TradeStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  CLOSED_WIN = 'closed_win',
  CLOSED_LOSS = 'closed_loss',
  CLOSED_BREAKEVEN = 'closed_breakeven',
  CANCELLED = 'cancelled',
}

export enum SessionType {
  LONDON = 'london',
  NEW_YORK = 'newyork',
  ASIAN = 'asian',
  SYDNEY = 'sydney',
}

export interface Config {
  telegram: {
    botToken: string;
    adminId: number;
  };
  ollama: {
    apiUrl: string;
    model: string;
    timeoutMs: number;
    healthCheckIntervalMs: number;
  };
  trading: {
    pair: string;
    fixedStopLossPips: number;
    minRiskRewardRatio: number;
    minConfidenceScore: number;
    profitTargetRatio: number;
  };
  session: {
    london: {
      open: string;
      close: string;
    };
    newYork: {
      open: string;
      close: string;
    };
    enabled: SessionType[];
  };
  news: {
    apiKey: string;
    apiUrl: string;
    highImpactKeywords: string[];
    skipCheckMinutes: number;
  };
  priceData: {
    source: 'mock' | 'api' | 'websocket';
    updateIntervalMs: number;
    historyCandles: number;
  };
  database: {
    path: string;
    backupIntervalHours: number;
  };
  logging: {
    level: 'debug' | 'info' | 'warn' | 'error';
    dir: string;
    maxSizeMb: number;
    maxFiles: number;
  };
  system: {
    nodeEnv: 'development' | 'production';
    enableTradeExecution: boolean;
    dryRunMode: boolean;
    maxMemoryMb: number;
  };
  features: {
    enableLiquiditySweepDetection: boolean;
    enableEqualHighLowDetection: boolean;
    enableSessionFilter: boolean;
    enableNewsFilter: boolean;
    enableConfidenceScoring: boolean;
    enableTradeJournal: boolean;
    enableHealthCheck: boolean;
  };
}

export interface PriceData {
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  timestamp: Date;
  interval: '1m' | '5m' | '15m' | '1h' | '4h' | '1d';
}

export interface TradeSetup {
  id?: string;
  pair: string;
  direction: TradeDirection;
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  riskAmount: number;
  rewardAmount: number;
  riskRewardRatio: number;
  confidenceScore: number;
  reason: string;
  sessionType?: SessionType;
  analysisDetails: {
    smcSetup: boolean;
    liquiditySweep: boolean;
    equalHighLow: boolean;
    newsImpact: boolean;
  };
  timestamp: Date;
  status: TradeStatus;
}

export interface TradeExecution {
  tradeId: string;
  executionTime: Date;
  executedPrice: number;
  actualRiskAmount: number;
  actualRewardAmount: number;
  profitLoss?: number;
  profitLossPercent?: number;
  closeTime?: Date;
  closePrice?: number;
  notes?: string;
}

export interface ConfidenceFactors {
  smcSetupScore: number; // 0-30
  liquiditySweepScore: number; // 0-20
  equalHighLowScore: number; // 0-15
  sessionScore: number; // 0-15
  newsScore: number; // 0-20
  total: number; // 0-100
  reasoning: string[];
}

export interface OllamaResponse {
  model: string;
  created_at: string;
  response: string;
  done: boolean;
  total_duration?: number;
  load_duration?: number;
  prompt_eval_count?: number;
  prompt_eval_duration?: number;
  eval_count?: number;
  eval_duration?: number;
}

export interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: Date;
  checks: {
    ollama: {
      status: boolean;
      responseTime: number;
      error?: string;
    };
    database: {
      status: boolean;
      error?: string;
    };
    telegram: {
      status: boolean;
      error?: string;
    };
    memory: {
      status: boolean;
      usedMb: number;
      limitMb: number;
      error?: string;
    };
  };
  details: string;
}

export interface WinrateStatistics {
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  breakevenTrades: number;
  winrate: number;
  avgWinAmount: number;
  avgLossAmount: number;
  profitFactor: number;
  maxConsecutiveWins: number;
  maxConsecutiveLosses: number;
  largestWin: number;
  largestLoss: number;
  totalProfit: number;
  roi: number;
  avgTradeRR: number;
}

export interface NewsEvent {
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  forecast: number;
  previous: number;
  actual: number;
  timestamp: Date;
  country: string;
  indicator: string;
}

export interface LiquidityLevel {
  price: number;
  strength: number; // 0-1
  direction: 'buy' | 'sell';
  timeframe: string;
}

export interface EqualHighLow {
  type: 'high' | 'low';
  level: number;
  firstTime: Date;
  secondTime: Date;
  distance: number;
  significance: 'minor' | 'moderate' | 'major';
}
