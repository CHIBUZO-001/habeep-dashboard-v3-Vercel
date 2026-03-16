import {
  Activity,
  AlertTriangle,
  Clock3,
  Cpu,
  Database,
  Gauge,
  HardDrive,
  Network,
  RefreshCw,
  Server,
  Users,
  type LucideIcon,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { cn } from "../../lib/cn";
import { getApiErrorMessage } from "../../lib/http-client";
import {
  getPerformanceHistory,
  getSystemMetrics,
  type PerformanceHistoryPoint,
  type SystemMetricsAlert,
  type SystemMetricsService,
  type SystemMetricsSnapshot,
} from "../../services";
import { useToast } from "../ui/toast-provider";

const surfaceCardClass =
  "rounded-2xl border border-slate-200/85 bg-white/90 p-4 shadow-sm shadow-slate-900/5 ring-1 ring-white/70 transition-colors sm:p-5 dark:border-slate-800/80 dark:bg-slate-900/90 dark:ring-slate-800/80";

const responsiveChartInitialDimension = {
  width: 520,
  height: 300,
} as const;

const numberFormatter = new Intl.NumberFormat("en-NG");
const compactNumberFormatter = new Intl.NumberFormat("en-NG", {
  notation: "compact",
  maximumFractionDigits: 1,
});
const percentageFormatter = new Intl.NumberFormat("en-NG", {
  maximumFractionDigits: 1,
});
const decimalFormatter = new Intl.NumberFormat("en-NG", {
  maximumFractionDigits: 1,
});

const resourceBarColors = ["#2563eb", "#16a34a", "#f59e0b"];

type PerformanceMetricCard = {
  key: string;
  label: string;
  value: string;
  note: string;
  icon: LucideIcon;
  iconClassName: string;
};

type DetailMetric = {
  label: string;
  value: string;
};

function formatFullTimestamp(value: string) {
  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    return value;
  }

  return parsedDate.toLocaleString("en-NG", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatTimeLabel(value: string) {
  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    return value;
  }

  return parsedDate.toLocaleTimeString("en-NG", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatPercentage(value: number) {
  return `${percentageFormatter.format(value)}%`;
}

function formatMilliseconds(value: number) {
  return `${decimalFormatter.format(value)} ms`;
}

function formatCompactValue(value: number) {
  return compactNumberFormatter.format(value);
}

function formatGigabytes(value: number) {
  return `${decimalFormatter.format(value)} GB`;
}

function formatGigahertz(value: number) {
  return `${decimalFormatter.format(value)} GHz`;
}

function formatTemperature(value: number) {
  return `${decimalFormatter.format(value)}°C`;
}

function formatBandwidth(value: number) {
  return `${decimalFormatter.format(value)} Mbps`;
}

function formatMegabytesPerSecond(value: number) {
  return `${decimalFormatter.format(value)} MB/s`;
}

function formatWholeNumber(value: number) {
  return numberFormatter.format(Math.round(value));
}

function calculateUsagePercentage(used: number, total: number) {
  if (!Number.isFinite(used) || !Number.isFinite(total) || total <= 0) {
    return 0;
  }

  return Math.min(100, Math.max(0, (used / total) * 100));
}

function formatStatusLabel(value: string) {
  if (!value) {
    return "Unknown";
  }

  return value
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function getStatusBadgeClass(status: string) {
  switch (status.toLowerCase()) {
    case "healthy":
      return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-200";
    case "warning":
    case "degraded":
      return "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200";
    case "critical":
    case "offline":
      return "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-200";
    default:
      return "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200";
  }
}

function getAlertBadgeClass(type: string) {
  switch (type.toLowerCase()) {
    case "critical":
    case "error":
      return "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-200";
    case "warning":
      return "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200";
    case "info":
      return "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900/60 dark:bg-sky-950/30 dark:text-sky-200";
    default:
      return "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200";
  }
}

function formatDependencies(dependencies: string[]) {
  return dependencies.length > 0 ? dependencies.join(", ") : "None";
}

export function DashboardPerformance() {
  const [metrics, setMetrics] = useState<SystemMetricsSnapshot | null>(null);
  const [metaTimestamp, setMetaTimestamp] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [performanceHistory, setPerformanceHistory] = useState<
    PerformanceHistoryPoint[]
  >([]);
  const [historyMetaTimestamp, setHistoryMetaTimestamp] = useState("");
  const [isHistoryLoading, setIsHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const { toast } = useToast();

  const loadSystemMetrics = useCallback(
    async (showErrorToast = false) => {
      setIsLoading(true);

      try {
        const response = await getSystemMetrics();
        setMetrics(response.data);
        setMetaTimestamp(response.meta.timestamp);
        setError(null);
      } catch (loadError) {
        const message = getApiErrorMessage(
          loadError,
          "Failed to load system metrics.",
        );
        setError(message);

        if (showErrorToast) {
          toast({
            variant: "error",
            title: "System metrics unavailable",
            description: message,
          });
        }
      } finally {
        setIsLoading(false);
      }
    },
    [toast],
  );

  const loadPerformanceHistory = useCallback(
    async (showErrorToast = false) => {
      setIsHistoryLoading(true);

      try {
        const response = await getPerformanceHistory();
        setPerformanceHistory(response.data);
        setHistoryMetaTimestamp(response.meta.timestamp);
        setHistoryError(null);
      } catch (loadError) {
        const message = getApiErrorMessage(
          loadError,
          "Failed to load performance history.",
        );
        setHistoryError(message);

        if (showErrorToast) {
          toast({
            variant: "error",
            title: "Performance history unavailable",
            description: message,
          });
        }
      } finally {
        setIsHistoryLoading(false);
      }
    },
    [toast],
  );

  useEffect(() => {
    void loadSystemMetrics();
  }, [loadSystemMetrics]);

  useEffect(() => {
    void loadPerformanceHistory();
  }, [loadPerformanceHistory]);

  const isRefreshing = isLoading || isHistoryLoading;
  const snapshotTimestamp = metrics?.timestamp || metaTimestamp;
  const services = useMemo(() => metrics?.services ?? [], [metrics]);
  const activeAlerts = useMemo(
    () => (metrics?.alerts ?? []).filter((alert) => !alert.resolved),
    [metrics],
  );

  const memoryUsagePercentage = calculateUsagePercentage(
    metrics?.memory.used ?? 0,
    metrics?.memory.total ?? 0,
  );
  const diskUsagePercentage = calculateUsagePercentage(
    metrics?.disk.used ?? 0,
    metrics?.disk.total ?? 0,
  );
  const databaseConnectionUsage = calculateUsagePercentage(
    metrics?.database.connections ?? 0,
    metrics?.database.maxConnections ?? 0,
  );
  const averageHealthScore = useMemo(() => {
    if (services.length === 0) {
      return 0;
    }

    const total = services.reduce(
      (sum, service) => sum + service.healthScore,
      0,
    );
    return total / services.length;
  }, [services]);

  const performanceHistoryChartData = useMemo(() => {
    return performanceHistory
      .map((point, index) => {
        const timestampMs = new Date(point.timestamp).getTime();

        return {
          ...point,
          label: formatTimeLabel(point.timestamp) || `#${index + 1}`,
          detailLabel: formatFullTimestamp(point.timestamp),
          timestampMs: Number.isNaN(timestampMs) ? index : timestampMs,
        };
      })
      .sort((first, second) => first.timestampMs - second.timestampMs);
  }, [performanceHistory]);

  const latestHistoryPoint =
    performanceHistoryChartData.length > 0
      ? performanceHistoryChartData[performanceHistoryChartData.length - 1]
      : null;

  const latestHistoryDetails = useMemo<DetailMetric[]>(() => {
    if (!latestHistoryPoint) {
      return [];
    }

    return [
      {
        label: "CPU",
        value: formatPercentage(latestHistoryPoint.cpu),
      },
      {
        label: "Memory",
        value: formatPercentage(latestHistoryPoint.memory),
      },
      {
        label: "Disk",
        value: formatPercentage(latestHistoryPoint.disk),
      },
      {
        label: "Network",
        value: formatCompactValue(latestHistoryPoint.network),
      },
      {
        label: "Response Time",
        value: formatMilliseconds(latestHistoryPoint.responseTime),
      },
      {
        label: "Error Rate",
        value: formatPercentage(latestHistoryPoint.errorRate),
      },
      {
        label: "Throughput",
        value: formatCompactValue(latestHistoryPoint.throughput),
      },
      {
        label: "Active Users",
        value: formatWholeNumber(latestHistoryPoint.activeUsers),
      },
    ];
  }, [latestHistoryPoint]);

  const summaryCards = useMemo<PerformanceMetricCard[]>(() => {
    const snapshot = metrics;

    return [
      {
        key: "cpu",
        label: "CPU Load",
        value: formatPercentage(snapshot?.cpu.usage ?? 0),
        note: `${formatWholeNumber(snapshot?.cpu.cores ?? 0)} cores · ${formatWholeNumber(snapshot?.cpu.processes ?? 0)} processes · ${formatTemperature(snapshot?.cpu.temperature ?? 0)} · ${formatGigahertz(snapshot?.cpu.frequency ?? 0)}`,
        icon: Cpu,
        iconClassName:
          "bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-300",
      },
      {
        key: "memory",
        label: "Memory Usage",
        value: formatPercentage(memoryUsagePercentage),
        note: `${formatGigabytes(snapshot?.memory.used ?? 0)} used · ${formatGigabytes(snapshot?.memory.available ?? 0)} free · Cached ${formatGigabytes(snapshot?.memory.cached ?? 0)} · Buffers ${formatGigabytes(snapshot?.memory.buffers ?? 0)} · Swap ${formatGigabytes(snapshot?.memory.swapUsed ?? 0)} / ${formatGigabytes(snapshot?.memory.swapTotal ?? 0)}`,
        icon: Activity,
        iconClassName:
          "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300",
      },
      {
        key: "disk",
        label: "Disk Usage",
        value: formatPercentage(diskUsagePercentage),
        note: `${formatGigabytes(snapshot?.disk.used ?? 0)} used · ${formatGigabytes(snapshot?.disk.available ?? 0)} free · Read ${formatMegabytesPerSecond(snapshot?.disk.readSpeed ?? 0)} · Write ${formatMegabytesPerSecond(snapshot?.disk.writeSpeed ?? 0)} · ${formatCompactValue(snapshot?.disk.iops ?? 0)} IOPS`,
        icon: HardDrive,
        iconClassName:
          "bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-300",
      },
      {
        key: "response-time",
        label: "App Response",
        value: formatMilliseconds(snapshot?.application.responseTime ?? 0),
        note: `DB query ${formatMilliseconds(snapshot?.database.queryTime ?? 0)} · Queue ${formatWholeNumber(snapshot?.application.queueSize ?? 0)}`,
        icon: Clock3,
        iconClassName:
          "bg-violet-50 text-violet-600 dark:bg-violet-950/40 dark:text-violet-300",
      },
    ];
  }, [diskUsagePercentage, memoryUsagePercentage, metrics]);

  const secondaryCards = useMemo<PerformanceMetricCard[]>(() => {
    const snapshot = metrics;

    return [
      {
        key: "network",
        label: "Network Latency",
        value: formatMilliseconds(snapshot?.network.latency ?? 0),
        note: `Packet loss ${formatPercentage(snapshot?.network.packetLoss ?? 0)} · ${formatBandwidth(snapshot?.network.bandwidth ?? 0)} bandwidth · ${formatWholeNumber(snapshot?.network.connections ?? 0)} connections`,
        icon: Network,
        iconClassName:
          "bg-cyan-50 text-cyan-600 dark:bg-cyan-950/40 dark:text-cyan-300",
      },
      {
        key: "throughput",
        label: "Throughput",
        value: formatCompactValue(snapshot?.application.throughput ?? 0),
        note: `Inbound ${formatCompactValue(snapshot?.network.inbound ?? 0)} · Outbound ${formatCompactValue(snapshot?.network.outbound ?? 0)}`,
        icon: Gauge,
        iconClassName:
          "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-300",
      },
      {
        key: "active-users",
        label: "Active Users",
        value: formatWholeNumber(snapshot?.application.activeUsers ?? 0),
        note: `Uptime ${formatPercentage(snapshot?.application.uptime ?? 0)} · Error rate ${formatPercentage(snapshot?.application.errorRate ?? 0)}`,
        icon: Users,
        iconClassName:
          "bg-sky-50 text-sky-600 dark:bg-sky-950/40 dark:text-sky-300",
      },
      {
        key: "db-connections",
        label: "DB Connections",
        value: formatWholeNumber(snapshot?.database.connections ?? 0),
        note: `${formatPercentage(databaseConnectionUsage)} of max · ${formatWholeNumber(snapshot?.database.slowQueries ?? 0)} slow queries`,
        icon: Database,
        iconClassName:
          "bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-300",
      },
    ];
  }, [databaseConnectionUsage, metrics]);

  const resourceChartData = useMemo(
    () => [
      {
        label: "CPU",
        usage: metrics?.cpu.usage ?? 0,
        detail: `${formatWholeNumber(metrics?.cpu.cores ?? 0)} cores`,
      },
      {
        label: "Memory",
        usage: memoryUsagePercentage,
        detail: `${formatGigabytes(metrics?.memory.used ?? 0)} / ${formatGigabytes(metrics?.memory.total ?? 0)}`,
      },
      {
        label: "Disk",
        usage: diskUsagePercentage,
        detail: `${formatGigabytes(metrics?.disk.used ?? 0)} / ${formatGigabytes(metrics?.disk.total ?? 0)}`,
      },
    ],
    [diskUsagePercentage, memoryUsagePercentage, metrics],
  );

  const serviceHealthChartData = useMemo(
    () =>
      services.map((service) => ({
        label: service.name.replace(/\s+Service$/i, ""),
        detailLabel: service.name,
        healthScore: service.healthScore,
        responseTime: service.responseTime,
      })),
    [services],
  );

  const databaseDetails = useMemo<DetailMetric[]>(
    () => [
      {
        label: "Connections",
        value: `${formatWholeNumber(metrics?.database.connections ?? 0)} / ${formatWholeNumber(metrics?.database.maxConnections ?? 0)}`,
      },
      {
        label: "Query Time",
        value: formatMilliseconds(metrics?.database.queryTime ?? 0),
      },
      {
        label: "Replication Lag",
        value: formatMilliseconds(metrics?.database.replicationLag ?? 0),
      },
      {
        label: "Cache Hit",
        value: formatPercentage(metrics?.database.cacheHitRatio ?? 0),
      },
      {
        label: "Lock Waits",
        value: formatWholeNumber(metrics?.database.lockWaits ?? 0),
      },
      {
        label: "Deadlocks",
        value: formatWholeNumber(metrics?.database.deadlocks ?? 0),
      },
    ],
    [metrics],
  );

  const applicationDetails = useMemo<DetailMetric[]>(
    () => [
      {
        label: "Response Time",
        value: formatMilliseconds(metrics?.application.responseTime ?? 0),
      },
      {
        label: "Error Rate",
        value: formatPercentage(metrics?.application.errorRate ?? 0),
      },
      {
        label: "Queue Size",
        value: formatWholeNumber(metrics?.application.queueSize ?? 0),
      },
      {
        label: "Cache Hit",
        value: formatPercentage(metrics?.application.cacheHitRatio ?? 0),
      },
      {
        label: "Throughput",
        value: formatCompactValue(metrics?.application.throughput ?? 0),
      },
      {
        label: "Memory Leaks",
        value: formatWholeNumber(metrics?.application.memoryLeaks ?? 0),
      },
    ],
    [metrics],
  );

  return (
    <div className="space-y-6">
      <section
        className={cn(
          surfaceCardClass,
          "dashboard-enter dashboard-enter-delay-1",
        )}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-200">
              <Activity className="h-3.5 w-3.5" />
              System Metrics
            </div>
            <h3 className="mt-3 text-xl font-semibold text-slate-900 dark:text-slate-100">
              Infrastructure snapshot from the last 24 hours
            </h3>
            <p className="mt-2 max-w-3xl text-sm text-slate-500 dark:text-slate-400">
              CPU, memory, disk, network, service health, and alerts from the
              latest monitoring snapshot.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              void loadSystemMetrics(true);
              void loadPerformanceHistory(true);
            }}
            className="inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium transition-colors hover:bg-slate-100 sm:w-auto dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800"
          >
            <RefreshCw
              className={cn("h-4 w-4", isRefreshing && "animate-spin")}
            />
            Refresh
          </button>
        </div>

        <div className="mt-4 flex flex-wrap gap-2 text-xs">
          <span className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-slate-600 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-300">
            Window: Last 24 hours
          </span>
          <span className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-slate-600 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-300">
            Services: {formatWholeNumber(services.length)}
          </span>
          <span className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-slate-600 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-300">
            Active alerts: {formatWholeNumber(activeAlerts.length)}
          </span>
          <span className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-slate-600 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-300">
            History points: {formatWholeNumber(performanceHistory.length)}
          </span>
          <span className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-slate-600 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-300">
            Avg health: {formatPercentage(averageHealthScore)}
          </span>
          {metaTimestamp ? (
            <span className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-slate-600 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-300">
              Synced: {formatFullTimestamp(metaTimestamp)}
            </span>
          ) : null}
        </div>

        {snapshotTimestamp ? (
          <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
            Latest snapshot: {formatFullTimestamp(snapshotTimestamp)}
          </p>
        ) : null}

        {error ? (
          <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50/80 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-200">
            {error}
          </div>
        ) : null}
      </section>

      <section className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {summaryCards.map((card) => {
          const Icon = card.icon;

          return (
            <article
              key={card.key}
              className={cn(
                surfaceCardClass,
                "dashboard-enter dashboard-enter-delay-2",
              )}
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                    {card.label}
                  </p>
                  <p className="mt-2 text-xl font-semibold text-slate-900 sm:text-2xl dark:text-slate-100">
                    {card.value}
                  </p>
                </div>
                <span
                  className={cn(
                    "inline-flex h-11 w-11 items-center justify-center rounded-2xl",
                    card.iconClassName,
                  )}
                >
                  <Icon className="h-5 w-5" />
                </span>
              </div>
              <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                {card.note}
              </p>
            </article>
          );
        })}
      </section>

      <section className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {secondaryCards.map((card) => {
          const Icon = card.icon;

          return (
            <article
              key={card.key}
              className={cn(
                surfaceCardClass,
                "dashboard-enter dashboard-enter-delay-3",
              )}
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                    {card.label}
                  </p>
                  <p className="mt-2 text-lg font-semibold text-slate-900 sm:text-xl dark:text-slate-100">
                    {card.value}
                  </p>
                </div>
                <span
                  className={cn(
                    "inline-flex h-10 w-10 items-center justify-center rounded-2xl",
                    card.iconClassName,
                  )}
                >
                  <Icon className="h-5 w-5" />
                </span>
              </div>
              <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                {card.note}
              </p>
            </article>
          );
        })}
      </section>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(20rem,0.9fr)]">
        <section
          className={cn(
            surfaceCardClass,
            "dashboard-enter dashboard-enter-delay-3",
          )}
        >
          <div className="flex items-center gap-2">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-300">
              <Cpu className="h-5 w-5" />
            </span>
            <div>
              <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Resource Utilization
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Current CPU, memory, and disk pressure from the latest system
                snapshot
              </p>
            </div>
          </div>

          <div className="mt-4 h-[240px] w-full min-w-0 sm:h-[300px]">
            <ResponsiveContainer
              width="100%"
              height="100%"
              initialDimension={responsiveChartInitialDimension}
            >
              <BarChart
                data={resourceChartData}
                margin={{ top: 12, right: 12, left: -12, bottom: 6 }}
              >
                <CartesianGrid
                  vertical={false}
                  stroke="rgba(148,163,184,0.22)"
                  strokeDasharray="3 3"
                />
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 12, fill: "#64748b" }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  domain={[0, 100]}
                  tickFormatter={(value: number) => `${Math.round(value)}%`}
                  tick={{ fontSize: 12, fill: "#64748b" }}
                />
                <Tooltip
                  cursor={{ fill: "rgba(148,163,184,0.08)" }}
                  contentStyle={{
                    borderRadius: "1rem",
                    border: "1px solid rgb(226 232 240)",
                    boxShadow: "0 10px 30px rgba(15, 23, 42, 0.12)",
                  }}
                  labelFormatter={(value, payload) =>
                    String(payload?.[0]?.payload?.detail ?? value)
                  }
                  formatter={(
                    value: number | string | undefined,
                    name: string | undefined,
                  ) => [
                    formatPercentage(Number(value ?? 0)),
                    name || "Usage",
                  ]}
                />
                <Bar
                  dataKey="usage"
                  name="Usage"
                  radius={[14, 14, 0, 0]}
                  maxBarSize={72}
                >
                  {resourceChartData.map((entry, index) => (
                    <Cell
                      key={entry.label}
                      fill={resourceBarColors[index] ?? resourceBarColors[0]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section
          className={cn(
            surfaceCardClass,
            "dashboard-enter dashboard-enter-delay-4",
          )}
        >
          <div className="flex items-center gap-2">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-violet-50 text-violet-600 dark:bg-violet-950/30 dark:text-violet-300">
              <Server className="h-5 w-5" />
            </span>
            <div>
              <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Service Health
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Health score and latency for each monitored service
              </p>
            </div>
          </div>

          <div className="mt-4 h-[240px] w-full min-w-0 sm:h-[300px]">
            <ResponsiveContainer
              width="100%"
              height="100%"
              initialDimension={responsiveChartInitialDimension}
            >
              <LineChart
                data={serviceHealthChartData}
                margin={{ top: 12, right: 16, left: -12, bottom: 28 }}
              >
                <CartesianGrid
                  vertical={false}
                  stroke="rgba(148,163,184,0.22)"
                  strokeDasharray="3 3"
                />
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 12, fill: "#64748b" }}
                />
                <YAxis
                  yAxisId="score"
                  tickLine={false}
                  axisLine={false}
                  domain={[0, 100]}
                  tickFormatter={(value: number) => `${Math.round(value)}%`}
                  tick={{ fontSize: 12, fill: "#64748b" }}
                />
                <YAxis
                  yAxisId="latency"
                  orientation="right"
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value: number) => `${Math.round(value)} ms`}
                  tick={{ fontSize: 12, fill: "#64748b" }}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: "1rem",
                    border: "1px solid rgb(226 232 240)",
                    boxShadow: "0 10px 30px rgba(15, 23, 42, 0.12)",
                  }}
                  labelFormatter={(value, payload) =>
                    String(payload?.[0]?.payload?.detailLabel ?? value)
                  }
                  formatter={(
                    value: number | string | undefined,
                    name: string | undefined,
                  ) => {
                    const numericValue = Number(value ?? 0);

                    if (name === "Response Time") {
                      return [formatMilliseconds(numericValue), name];
                    }

                    return [formatPercentage(numericValue), name || "Metric"];
                  }}
                />
                <Legend
                  verticalAlign="bottom"
                  height={40}
                  wrapperStyle={{ paddingTop: 18 }}
                />
                <Line
                  yAxisId="score"
                  type="monotone"
                  dataKey="healthScore"
                  name="Health Score"
                  stroke="#2563eb"
                  strokeWidth={2.8}
                  dot={{ r: 4, strokeWidth: 0 }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  yAxisId="latency"
                  type="monotone"
                  dataKey="responseTime"
                  name="Response Time"
                  stroke="#7c3aed"
                  strokeWidth={2.6}
                  dot={{ r: 4, strokeWidth: 0 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      <section
        className={cn(
          surfaceCardClass,
          "dashboard-enter dashboard-enter-delay-4",
        )}
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-2">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/30 dark:text-indigo-300">
              <Gauge className="h-5 w-5" />
            </span>
            <div>
              <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Performance History
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                CPU, memory, disk, and response time trend for the last 24 hours
              </p>
            </div>
          </div>

          {historyMetaTimestamp ? (
            <span className="text-xs text-slate-500 dark:text-slate-400">
              History synced: {formatFullTimestamp(historyMetaTimestamp)}
            </span>
          ) : null}
        </div>

        {historyError ? (
          <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50/80 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-200">
            {historyError}
          </div>
        ) : null}

        {performanceHistoryChartData.length > 0 ? (
          <>
            {latestHistoryPoint ? (
              <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                Latest history point:{" "}
                {formatFullTimestamp(latestHistoryPoint.timestamp)}
              </p>
            ) : null}

            <div className="mt-4 h-[240px] w-full min-w-0 sm:h-[300px]">
              <ResponsiveContainer
                width="100%"
                height="100%"
                initialDimension={responsiveChartInitialDimension}
              >
                <LineChart
                  data={performanceHistoryChartData}
                  margin={{ top: 12, right: 16, left: -12, bottom: 28 }}
                >
                  <CartesianGrid
                    vertical={false}
                    stroke="rgba(148,163,184,0.22)"
                    strokeDasharray="3 3"
                  />
                  <XAxis
                    dataKey="label"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 12, fill: "#64748b" }}
                  />
                  <YAxis
                    yAxisId="util"
                    tickLine={false}
                    axisLine={false}
                    domain={[0, 100]}
                    tickFormatter={(value: number) => `${Math.round(value)}%`}
                    tick={{ fontSize: 12, fill: "#64748b" }}
                  />
                  <YAxis
                    yAxisId="response"
                    orientation="right"
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value: number) => `${Math.round(value)} ms`}
                    tick={{ fontSize: 12, fill: "#64748b" }}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "1rem",
                      border: "1px solid rgb(226 232 240)",
                      boxShadow: "0 10px 30px rgba(15, 23, 42, 0.12)",
                    }}
                    labelFormatter={(value, payload) =>
                      String(payload?.[0]?.payload?.detailLabel ?? value)
                    }
                    formatter={(
                      value: number | string | undefined,
                      name: string | undefined,
                    ) => {
                      const numericValue = Number(value ?? 0);

                      if (name === "Response Time") {
                        return [formatMilliseconds(numericValue), name];
                      }

                      return [formatPercentage(numericValue), name || "Metric"];
                    }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    height={40}
                    wrapperStyle={{ paddingTop: 18 }}
                  />
                  <Line
                    yAxisId="util"
                    type="monotone"
                    dataKey="cpu"
                    name="CPU"
                    stroke="#2563eb"
                    strokeWidth={2.6}
                    dot={{ r: 4, strokeWidth: 0 }}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    yAxisId="util"
                    type="monotone"
                    dataKey="memory"
                    name="Memory"
                    stroke="#16a34a"
                    strokeWidth={2.6}
                    dot={{ r: 4, strokeWidth: 0 }}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    yAxisId="util"
                    type="monotone"
                    dataKey="disk"
                    name="Disk"
                    stroke="#f59e0b"
                    strokeWidth={2.6}
                    dot={{ r: 4, strokeWidth: 0 }}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    yAxisId="response"
                    type="monotone"
                    dataKey="responseTime"
                    name="Response Time"
                    stroke="#7c3aed"
                    strokeWidth={2.6}
                    dot={{ r: 4, strokeWidth: 0 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {latestHistoryDetails.length > 0 ? (
              <div className="mt-4 rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-950/40">
                <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                  {latestHistoryDetails.map((item) => (
                    <div key={item.label}>
                      <p className="text-xs uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
                        {item.label}
                      </p>
                      <p className="mt-1 text-sm font-medium text-slate-900 dark:text-slate-100">
                        {item.value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </>
        ) : (
          <div className="mt-4 rounded-2xl border border-dashed border-slate-200 px-3 py-6 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
            No performance history points were returned for the current window.
          </div>
        )}
      </section>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(20rem,0.8fr)]">
        <section
          className={cn(
            surfaceCardClass,
            "dashboard-enter dashboard-enter-delay-4",
          )}
        >
          <div className="flex items-center gap-2">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
              <Server className="h-5 w-5" />
            </span>
            <div>
              <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Service Status
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Latest service checks returned by the system metrics endpoint
              </p>
            </div>
          </div>

          <div className="mt-4 space-y-3 md:hidden">
            {services.length > 0 ? (
              services.map((service: SystemMetricsService) => (
                <article
                  key={service.id}
                  className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-200"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-medium text-slate-900 dark:text-slate-100">
                        {service.name}
                      </div>
                      <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        v{service.version || "n/a"} · Uptime{" "}
                        {formatPercentage(service.uptime)}
                      </div>
                    </div>
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium",
                        getStatusBadgeClass(service.status),
                      )}
                    >
                      {formatStatusLabel(service.status)}
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
                        Health
                      </p>
                      <p className="mt-1 font-medium text-slate-900 dark:text-slate-100">
                        {formatPercentage(service.healthScore)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
                        Response
                      </p>
                      <p className="mt-1 font-medium text-slate-900 dark:text-slate-100">
                        {formatMilliseconds(service.responseTime)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
                        Error Rate
                      </p>
                      <p className="mt-1 font-medium text-slate-900 dark:text-slate-100">
                        {formatPercentage(service.errorRate)}
                      </p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
                        Dependencies
                      </p>
                      <p className="mt-1 break-words text-xs text-slate-500 dark:text-slate-400">
                        {formatDependencies(service.dependencies)}
                      </p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
                        Last Check
                      </p>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        {formatFullTimestamp(service.lastCheck)}
                      </p>
                    </div>
                  </div>
                </article>
              ))
            ) : (
              <div className="rounded-2xl bg-slate-50/80 px-3 py-6 text-center text-sm text-slate-500 dark:bg-slate-950/40 dark:text-slate-400">
                No services were returned for the current snapshot.
              </div>
            )}
          </div>

          <div className="mt-4 hidden overflow-x-auto md:block">
            <table className="min-w-full table-auto border-separate border-spacing-y-2">
              <thead>
                <tr className="text-left text-xs uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                  <th className="px-3 py-2 font-medium">Service</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                  <th className="px-3 py-2 font-medium">Health</th>
                  <th className="px-3 py-2 font-medium">Response</th>
                  <th className="px-3 py-2 font-medium">Error Rate</th>
                  <th className="px-3 py-2 font-medium">Dependencies</th>
                  <th className="px-3 py-2 font-medium">Last Check</th>
                </tr>
              </thead>
              <tbody>
                {services.length > 0 ? (
                  services.map((service: SystemMetricsService) => (
                    <tr
                      key={service.id}
                      className="rounded-2xl bg-slate-50/80 text-sm text-slate-700 dark:bg-slate-950/40 dark:text-slate-200"
                    >
                      <td className="rounded-l-2xl px-3 py-3">
                        <div className="font-medium text-slate-900 dark:text-slate-100">
                          {service.name}
                        </div>
                        <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                          v{service.version || "n/a"} · Uptime{" "}
                          {formatPercentage(service.uptime)}
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <span
                          className={cn(
                            "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium",
                            getStatusBadgeClass(service.status),
                          )}
                        >
                          {formatStatusLabel(service.status)}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        {formatPercentage(service.healthScore)}
                      </td>
                      <td className="px-3 py-3">
                        {formatMilliseconds(service.responseTime)}
                      </td>
                      <td className="px-3 py-3">
                        {formatPercentage(service.errorRate)}
                      </td>
                      <td className="px-3 py-3 text-xs text-slate-500 dark:text-slate-400">
                        {formatDependencies(service.dependencies)}
                      </td>
                      <td className="rounded-r-2xl px-3 py-3 text-xs text-slate-500 dark:text-slate-400">
                        {formatFullTimestamp(service.lastCheck)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={7}
                      className="rounded-2xl bg-slate-50/80 px-3 py-6 text-center text-sm text-slate-500 dark:bg-slate-950/40 dark:text-slate-400"
                    >
                      No services were returned for the current snapshot.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section
          className={cn(
            surfaceCardClass,
            "dashboard-enter dashboard-enter-delay-5",
          )}
        >
          <div className="flex items-center gap-2">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-300">
              <AlertTriangle className="h-5 w-5" />
            </span>
            <div>
              <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Operational Signals
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Database, application, and alert details from the same snapshot
              </p>
            </div>
          </div>

          <div className="mt-4 space-y-4">
            <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-950/40">
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4 text-slate-600 dark:text-slate-300" />
                <h5 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Database
                </h5>
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {databaseDetails.map((item) => (
                  <div key={item.label}>
                    <p className="text-xs uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
                      {item.label}
                    </p>
                    <p className="mt-1 text-sm font-medium text-slate-900 dark:text-slate-100">
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-950/40">
              <div className="flex items-center gap-2">
                <Gauge className="h-4 w-4 text-slate-600 dark:text-slate-300" />
                <h5 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Application
                </h5>
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {applicationDetails.map((item) => (
                  <div key={item.label}>
                    <p className="text-xs uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
                      {item.label}
                    </p>
                    <p className="mt-1 text-sm font-medium text-slate-900 dark:text-slate-100">
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-950/40">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-slate-600 dark:text-slate-300" />
                <h5 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Active Alerts
                </h5>
              </div>

              <div className="mt-3 space-y-3">
                {activeAlerts.length > 0 ? (
                  activeAlerts.map((alert: SystemMetricsAlert) => (
                    <article
                      key={alert.id}
                      className="rounded-2xl border border-slate-200/80 bg-white/80 p-3 dark:border-slate-800 dark:bg-slate-900/70"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={cn(
                                "inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-medium",
                                getAlertBadgeClass(alert.type),
                              )}
                            >
                              {formatStatusLabel(alert.type)}
                            </span>
                            <span className="text-xs text-slate-500 dark:text-slate-400">
                              Severity {formatWholeNumber(alert.severity)}
                            </span>
                          </div>
                          <h6 className="mt-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
                            {alert.title}
                          </h6>
                        </div>
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          {formatFullTimestamp(alert.timestamp)}
                        </span>
                      </div>

                      <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                        {alert.message}
                      </p>

                      <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500 dark:text-slate-400">
                        <span className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 dark:border-slate-700 dark:bg-slate-800">
                          Source: {alert.source || "unknown"}
                        </span>
                        {alert.acknowledged ? (
                          <span className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 dark:border-slate-700 dark:bg-slate-800">
                            Acknowledged
                          </span>
                        ) : null}
                        {alert.tags.map((tag) => (
                          <span
                            key={tag}
                            className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 dark:border-slate-700 dark:bg-slate-800"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </article>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-slate-200 px-3 py-4 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
                    No active alerts were returned in the latest snapshot.
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
