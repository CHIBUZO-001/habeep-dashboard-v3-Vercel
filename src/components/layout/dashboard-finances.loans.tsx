import {
  AlertTriangle,
  ArrowRight,
  CreditCard,
  LoaderCircle,
  RefreshCw,
  Search,
  TrendingDown,
  TrendingUp,
  UserCircle2,
  Wallet,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { cn } from "../../lib/cn";
import { getApiErrorMessage } from "../../lib/http-client";
import {
  getFinancialLoans,
  getFinancialLoansOverview,
  getFinancialLoansPortfolio,
  getFinancialLoansDistribution,
  updateFinancialLoanStatus,
  type FinancialLoan,
  type FinancialLoansPagination,
  type FinancialLoansOverview,
  type FinancialLoansPortfolioPoint,
  type FinancialLoansDistribution,
  type FinancialLoanStatusUpdateResult,
} from "../../services";
import { useToast } from "../ui/toast-provider";
import {
  buildPaginationItems,
  compactNumberFormatter,
  createCurrencyFormatter,
  formatReadableLabel,
  percentFormatter,
  responsiveChartInitialDimension,
  surfaceCardClass,
} from "./dashboard-finances.utils";

const distributionPalette = [
  "#2563eb",
  "#16a34a",
  "#f97316",
  "#dc2626",
  "#7c3aed",
  "#0ea5e9",
  "#eab308",
] as const;

type LoanStatusActionOption = {
  nextStatus: string;
  title: string;
  description: string;
};

function normalizeLoanStatus(inputStatus: string) {
  return inputStatus.trim().toUpperCase();
}

function buildLoanStatusOptions(values: string[]) {
  const statuses = new Set<string>();

  for (const value of values) {
    const normalizedStatus = normalizeLoanStatus(value);
    if (normalizedStatus) {
      statuses.add(normalizedStatus);
    }
  }

  return Array.from(statuses).sort((leftStatus, rightStatus) =>
    formatReadableLabel(leftStatus).localeCompare(
      formatReadableLabel(rightStatus),
    ),
  );
}

function getLoanStatusBadgeClasses(status: string) {
  const normalizedStatus = normalizeLoanStatus(status);

  if (
    normalizedStatus === "PAID" ||
    normalizedStatus === "COMPLETED" ||
    normalizedStatus === "SETTLED"
  ) {
    return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-200";
  }

  if (
    normalizedStatus === "ACTIVE" ||
    normalizedStatus === "APPROVED" ||
    normalizedStatus === "DISBURSED" ||
    normalizedStatus === "OUTSTANDING"
  ) {
    return "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/50 dark:bg-blue-950/40 dark:text-blue-200";
  }

  if (
    normalizedStatus === "OVERDUE" ||
    normalizedStatus === "DEFAULTED" ||
    normalizedStatus === "FAILED"
  ) {
    return "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-200";
  }

  if (
    normalizedStatus === "PENDING" ||
    normalizedStatus === "IN_REVIEW" ||
    normalizedStatus === "REQUESTED" ||
    normalizedStatus === "SETUP"
  ) {
    return "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-200";
  }

  return "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-200";
}

function getLoanBorrowerDisplayName(loan: FinancialLoan) {
  return (
    loan.borrower?.name?.trim() ||
    loan.borrower?.username?.trim() ||
    "Unknown borrower"
  );
}

function getLoanLandlordDisplayName(loan: FinancialLoan) {
  return (
    loan.landlord?.name?.trim() ||
    loan.landlord?.username?.trim() ||
    "—"
  );
}

function getLoanStatusActionOptions(status: string): LoanStatusActionOption[] {
  const normalizedStatus = normalizeLoanStatus(status);

  if (
    normalizedStatus === "SETUP" ||
    normalizedStatus === "REVIEW" ||
    normalizedStatus === "IN_REVIEW" ||
    normalizedStatus === "REQUESTED"
  ) {
    return [
      {
        nextStatus: "APPROVED",
        title: "Approve loan",
        description: "Setup/Review -> Approved",
      },
      {
        nextStatus: "DENIED",
        title: "Deny loan",
        description: "Setup/Review -> Denied",
      },
    ];
  }

  if (normalizedStatus === "APPROVED") {
    return [
      {
        nextStatus: "DISBURSED",
        title: "Mark as disbursed",
        description: "Approved -> Disbursed",
      },
    ];
  }

  if (normalizedStatus === "DISBURSED") {
    return [
      {
        nextStatus: "SETTLED",
        title: "Mark as settled",
        description: "Disbursed -> Settled",
      },
    ];
  }

  return [];
}

function formatLoanTimestamp(inputDate: string | null) {
  const createdAt = inputDate?.trim() ?? "";
  if (!createdAt) {
    return "N/A";
  }

  const parsedDate = new Date(createdAt);
  if (Number.isNaN(parsedDate.getTime())) {
    return createdAt;
  }

  return parsedDate.toLocaleString("en-NG", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function DashboardFinancesLoans() {
  const [loansOverview, setLoansOverview] =
    useState<FinancialLoansOverview | null>(null);
  const [isOverviewLoading, setIsOverviewLoading] = useState(true);
  const [overviewErrorMessage, setOverviewErrorMessage] = useState<
    string | null
  >(null);

  const [loansPortfolio, setLoansPortfolio] = useState<
    FinancialLoansPortfolioPoint[]
  >([]);
  const [isPortfolioLoading, setIsPortfolioLoading] = useState(true);
  const [portfolioErrorMessage, setPortfolioErrorMessage] = useState<
    string | null
  >(null);

  const [loansDistribution, setLoansDistribution] =
    useState<FinancialLoansDistribution | null>(null);
  const [isDistributionLoading, setIsDistributionLoading] = useState(true);
  const [distributionErrorMessage, setDistributionErrorMessage] = useState<
    string | null
  >(null);

  const [loans, setLoans] = useState<FinancialLoan[]>([]);
  const [pagination, setPagination] = useState<FinancialLoansPagination | null>(
    null,
  );
  const [page, setPage] = useState(1);
  const [isLoansLoading, setIsLoansLoading] = useState(true);
  const [loansErrorMessage, setLoansErrorMessage] = useState<string | null>(
    null,
  );
  const loansRequestId = useRef(0);
  const loanStatusOverridesRef = useRef<Record<string, string>>({});

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [statusActionLoanId, setStatusActionLoanId] = useState<string | null>(
    null,
  );
  const [statusActionState, setStatusActionState] = useState<{
    loanId: string;
    nextStatus: string;
  } | null>(null);

  const { toast } = useToast();

  useEffect(() => {
    if (!statusActionLoanId) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setStatusActionLoanId(null);
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => {
      window.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = previousOverflow;
    };
  }, [statusActionLoanId]);

  const loadLoansOverview = useCallback(
    async (showErrorToast = false) => {
      setIsOverviewLoading(true);

      try {
        const nextOverview = await getFinancialLoansOverview();
        setLoansOverview(nextOverview);
        setOverviewErrorMessage(null);
      } catch (error) {
        const message = getApiErrorMessage(
          error,
          "Failed to load loan overview.",
        );
        setOverviewErrorMessage(message);
        if (showErrorToast) {
          toast({
            variant: "error",
            title: "Loan overview unavailable",
            description: message,
          });
        }
      } finally {
        setIsOverviewLoading(false);
      }
    },
    [toast],
  );

  useEffect(() => {
    void loadLoansOverview();
  }, [loadLoansOverview]);

  const loadLoansPortfolio = useCallback(
    async (showErrorToast = false) => {
      setIsPortfolioLoading(true);

      try {
        const nextPortfolio = await getFinancialLoansPortfolio();
        setLoansPortfolio(nextPortfolio);
        setPortfolioErrorMessage(null);
      } catch (error) {
        const message = getApiErrorMessage(
          error,
          "Failed to load loans portfolio.",
        );
        setPortfolioErrorMessage(message);
        if (showErrorToast) {
          toast({
            variant: "error",
            title: "Loans portfolio unavailable",
            description: message,
          });
        }
      } finally {
        setIsPortfolioLoading(false);
      }
    },
    [toast],
  );

  useEffect(() => {
    void loadLoansPortfolio();
  }, [loadLoansPortfolio]);

  const loadLoansDistribution = useCallback(
    async (showErrorToast = false) => {
      setIsDistributionLoading(true);

      try {
        const nextDistribution = await getFinancialLoansDistribution();
        setLoansDistribution(nextDistribution);
        setDistributionErrorMessage(null);
      } catch (error) {
        const message = getApiErrorMessage(
          error,
          "Failed to load loan distribution.",
        );
        setDistributionErrorMessage(message);
        if (showErrorToast) {
          toast({
            variant: "error",
            title: "Loan distribution unavailable",
            description: message,
          });
        }
      } finally {
        setIsDistributionLoading(false);
      }
    },
    [toast],
  );

  useEffect(() => {
    void loadLoansDistribution();
  }, [loadLoansDistribution]);

  const loadLoans = useCallback(
    async (showErrorToast = false, nextPage = page) => {
      setIsLoansLoading(true);
      const requestId = loansRequestId.current + 1;
      loansRequestId.current = requestId;

      try {
        const response = await getFinancialLoans(nextPage, 20);

        if (requestId !== loansRequestId.current) {
          return;
        }

        setLoans(
          response.loans.map((loan) => {
            const overriddenStatus = loanStatusOverridesRef.current[loan.id];
            return overriddenStatus
              ? { ...loan, status: overriddenStatus }
              : loan;
          }),
        );
        setPagination(response.pagination);
        setLoansErrorMessage(null);
      } catch (error) {
        if (requestId !== loansRequestId.current) {
          return;
        }

        const message = getApiErrorMessage(error, "Failed to load loans.");
        setLoansErrorMessage(message);
        if (showErrorToast) {
          toast({
            variant: "error",
            title: "Loans unavailable",
            description: message,
          });
        }
      } finally {
        if (requestId === loansRequestId.current) {
          setIsLoansLoading(false);
        }
      }
    },
    [page, toast],
  );

  useEffect(() => {
    void loadLoans(false, page);
  }, [loadLoans, page]);

  const currencyFormatter = useMemo(() => createCurrencyFormatter("NGN"), []);
  const portfolioChartData = useMemo(
    () => loansPortfolio.filter((point) => point.month),
    [loansPortfolio],
  );
  const distributionChartData = useMemo(() => {
    const items = loansDistribution?.items ?? [];
    return items
      .filter((item) => item.type)
      .slice()
      .sort((leftItem, rightItem) => rightItem.count - leftItem.count)
      .map((item) => ({
        ...item,
        label: formatReadableLabel(item.type),
      }));
  }, [loansDistribution]);

  const availableLoanStatuses = useMemo(() => {
    const nextStatuses = buildLoanStatusOptions(
      loans.map((loan) => loan.status),
    );

    if (statusFilter !== "all") {
      const normalizedSelectedStatus = normalizeLoanStatus(statusFilter);
      if (
        normalizedSelectedStatus &&
        !nextStatuses.includes(normalizedSelectedStatus)
      ) {
        nextStatuses.push(normalizedSelectedStatus);
        nextStatuses.sort((leftStatus, rightStatus) =>
          formatReadableLabel(leftStatus).localeCompare(
            formatReadableLabel(rightStatus),
          ),
        );
      }
    }

    return nextStatuses;
  }, [loans, statusFilter]);

  const filteredLoans = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    const matchesStatus = (loan: FinancialLoan) => {
      if (statusFilter === "all") {
        return true;
      }

      return (
        normalizeLoanStatus(loan.status) === normalizeLoanStatus(statusFilter)
      );
    };

    const matchesQuery = (loan: FinancialLoan) => {
      if (!normalizedQuery) {
        return true;
      }

      const searchable = [
        loan.borrower?.name ?? "",
        loan.borrower?.username ?? "",
        loan.borrower?.email ?? "",
        loan.landlord?.name ?? "",
        loan.landlord?.username ?? "",
        loan.reference ?? "",
        loan.userId ?? "",
        loan.landlordId ?? "",
        loan.status,
        loan.type,
        loan.product ?? "",
        loan.riskLevel ?? "",
      ]
        .join(" ")
        .toLowerCase();

      return searchable.includes(normalizedQuery);
    };

    const getSortTime = (loan: FinancialLoan) => {
      const createdAtMs = new Date(loan.createdAt).getTime();
      if (!Number.isNaN(createdAtMs)) {
        return createdAtMs;
      }

      const dueAtMs = new Date(loan.dueAt ?? "").getTime();
      if (!Number.isNaN(dueAtMs)) {
        return dueAtMs;
      }

      return 0;
    };

    return loans
      .filter((loan) => matchesStatus(loan) && matchesQuery(loan))
      .slice()
      .sort(
        (leftLoan, rightLoan) => getSortTime(rightLoan) - getSortTime(leftLoan),
      );
  }, [loans, searchQuery, statusFilter]);

  const currentPage = pagination?.page ?? page;
  const totalPages = pagination?.totalPages ?? 1;
  const totalLoans = pagination?.total ?? loans.length;
  const filtersActive = Boolean(searchQuery.trim() || statusFilter !== "all");
  const paginationItems = useMemo(
    () => buildPaginationItems(currentPage, totalPages, 7),
    [currentPage, totalPages],
  );

  const isRefreshing =
    isOverviewLoading ||
    isPortfolioLoading ||
    isDistributionLoading ||
    isLoansLoading;

  const activeLoanForStatusAction = useMemo(() => {
    if (!statusActionLoanId) {
      return null;
    }

    return loans.find((loan) => loan.id === statusActionLoanId) ?? null;
  }, [loans, statusActionLoanId]);

  const availableStatusActions = useMemo(
    () =>
      activeLoanForStatusAction
        ? getLoanStatusActionOptions(activeLoanForStatusAction.status)
        : [],
    [activeLoanForStatusAction],
  );

  const handleLoanStatusAction = useCallback(
    async (loan: FinancialLoan, nextStatus: string) => {
      const normalizedNextStatus = normalizeLoanStatus(nextStatus);
      if (!normalizedNextStatus) {
        return;
      }

      setStatusActionState({ loanId: loan.id, nextStatus: normalizedNextStatus });

      try {
        const result = await updateFinancialLoanStatus(loan.id, {
          status: normalizedNextStatus,
        });
        const resolvedStatus = normalizeLoanStatus(
          (result as FinancialLoanStatusUpdateResult).status ||
            normalizedNextStatus,
        );

        loanStatusOverridesRef.current[loan.id] = resolvedStatus;
        setLoans((previousLoans) =>
          previousLoans.map((currentLoan) =>
            currentLoan.id === loan.id
              ? { ...currentLoan, status: resolvedStatus }
              : currentLoan,
          ),
        );
        setStatusActionLoanId(null);

        toast({
          variant: "success",
          title: "Loan status updated",
          description: `${getLoanBorrowerDisplayName(loan)} is now ${formatReadableLabel(resolvedStatus)}.`,
        });

        void loadLoansOverview(false);
        void loadLoans(false, currentPage);
      } catch (error) {
        const message = getApiErrorMessage(
          error,
          "Failed to update loan status.",
        );
        toast({
          variant: "error",
          title: "Loan action failed",
          description: message,
        });
      } finally {
        setStatusActionState((currentState) =>
          currentState?.loanId === loan.id ? null : currentState,
        );
      }
    },
    [currentPage, loadLoans, loadLoansOverview, toast],
  );

  const activeLoanDisplayName = activeLoanForStatusAction
    ? getLoanBorrowerDisplayName(activeLoanForStatusAction)
    : "Unknown borrower";
  const activeLoanLandlordName = activeLoanForStatusAction
    ? getLoanLandlordDisplayName(activeLoanForStatusAction)
    : "—";
  const activeLoanRateLabel =
    activeLoanForStatusAction &&
    typeof activeLoanForStatusAction.interestRate === "number"
      ? `Rate: ${activeLoanForStatusAction.interestRate.toFixed(2)}%`
      : "Rate: —";
  const activeLoanPaymentLabel = activeLoanForStatusAction
    ? [
        typeof activeLoanForStatusAction.amountToPay === "number"
          ? `To pay: ${currencyFormatter.format(activeLoanForStatusAction.amountToPay)}`
          : "",
        typeof activeLoanForStatusAction.outstanding === "number"
          ? `Outstanding: ${currencyFormatter.format(activeLoanForStatusAction.outstanding)}`
          : "",
        typeof activeLoanForStatusAction.monthlyPayment === "number"
          ? `Monthly: ${currencyFormatter.format(activeLoanForStatusAction.monthlyPayment)}`
          : "",
      ]
        .filter(Boolean)
        .join(" · ") || "To pay: — · Outstanding: — · Monthly: —"
    : "To pay: — · Outstanding: — · Monthly: —";
  const activeLoanProfileLabel = activeLoanForStatusAction
    ? [
        activeLoanForStatusAction.riskLevel?.trim()
          ? `Risk: ${formatReadableLabel(activeLoanForStatusAction.riskLevel)}`
          : "",
        typeof activeLoanForStatusAction.repaymentProgress === "number"
          ? `Progress: ${percentFormatter.format(activeLoanForStatusAction.repaymentProgress / 100)}`
          : "",
      ]
        .filter(Boolean)
        .join(" · ") || "Risk: — · Progress: —"
    : "Risk: — · Progress: —";
  const isStatusActionLoading = Boolean(
    activeLoanForStatusAction &&
      statusActionState?.loanId === activeLoanForStatusAction.id,
  );

  return (
    <div className="space-y-6">
      {statusActionLoanId &&
      activeLoanForStatusAction &&
      typeof document !== "undefined"
        ? createPortal(
            <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 sm:p-6">
              <div
                className="fixed inset-0 bg-slate-950/55 backdrop-blur-[2px]"
                onClick={() => setStatusActionLoanId(null)}
                aria-hidden="true"
              />

              <div
                className="relative z-10 w-full max-w-lg rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900"
                role="dialog"
                aria-modal="true"
                aria-label="Loan status actions"
              >
                <header className="flex items-start justify-between gap-3 border-b border-slate-200 px-5 py-4 dark:border-slate-800">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                      Loan Action
                    </p>
                    <h3 className="mt-1 break-words text-lg font-semibold text-slate-900 dark:text-slate-100">
                      {activeLoanDisplayName}
                    </h3>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                      Current status:{" "}
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold",
                          getLoanStatusBadgeClasses(activeLoanForStatusAction.status),
                        )}
                      >
                        {formatReadableLabel(activeLoanForStatusAction.status)}
                      </span>
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setStatusActionLoanId(null)}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
                    aria-label="Close loan status actions"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </header>

                <div className="space-y-4 px-5 py-4">
                  <div className="grid gap-3 rounded-2xl bg-slate-50/80 p-4 text-sm dark:bg-slate-950/40 sm:grid-cols-2">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        Borrower
                      </p>
                      <p className="mt-1 break-words font-medium text-slate-900 dark:text-slate-100">
                        {activeLoanDisplayName}
                      </p>
                      <p className="mt-1 break-all text-xs text-slate-500 dark:text-slate-400">
                        {activeLoanForStatusAction.borrower?.email?.trim() || "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        Landlord
                      </p>
                      <p className="mt-1 break-words font-medium text-slate-900 dark:text-slate-100">
                        {activeLoanLandlordName}
                      </p>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        Loan: {formatReadableLabel(activeLoanForStatusAction.type) || "Loan"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        Principal
                      </p>
                      <p className="mt-1 font-medium text-slate-900 dark:text-slate-100">
                        {currencyFormatter.format(activeLoanForStatusAction.principal)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        Reference
                      </p>
                      <p className="mt-1 break-words font-medium text-slate-900 dark:text-slate-100">
                        {activeLoanForStatusAction.reference?.trim() || "—"}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-4 text-sm dark:border-slate-800/80 dark:bg-slate-950/30">
                    <p className="font-medium text-slate-900 dark:text-slate-100">
                      {activeLoanRateLabel}
                    </p>
                    <p className="mt-2 text-slate-600 dark:text-slate-300">
                      {activeLoanPaymentLabel}
                    </p>
                    <p className="mt-2 text-slate-600 dark:text-slate-300">
                      {activeLoanProfileLabel}
                    </p>
                  </div>

                  {availableStatusActions.length ? (
                    <div className="space-y-3">
                      {availableStatusActions.map((action) => {
                        const isUpdatingThisAction =
                          isStatusActionLoading &&
                          statusActionState?.nextStatus === action.nextStatus;
                        const isDangerAction = action.nextStatus === "DENIED";
                        const isSuccessAction = action.nextStatus === "SETTLED";

                        return (
                          <button
                            key={action.nextStatus}
                            type="button"
                            onClick={() =>
                              void handleLoanStatusAction(
                                activeLoanForStatusAction,
                                action.nextStatus,
                              )
                            }
                            disabled={isStatusActionLoading}
                            className={cn(
                              "flex w-full items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-left transition disabled:cursor-not-allowed disabled:opacity-60",
                              isDangerAction
                                ? "border-rose-200 bg-rose-50 hover:bg-rose-100 dark:border-rose-900/50 dark:bg-rose-950/20 dark:hover:bg-rose-950/30"
                                : isSuccessAction
                                  ? "border-emerald-200 bg-emerald-50 hover:bg-emerald-100 dark:border-emerald-900/50 dark:bg-emerald-950/20 dark:hover:bg-emerald-950/30"
                                  : "border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:hover:bg-slate-900",
                            )}
                          >
                            <div className="min-w-0">
                              <p className="font-semibold text-slate-900 dark:text-slate-100">
                                {action.title}
                              </p>
                              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                {action.description}
                              </p>
                            </div>

                            <div className="flex shrink-0 items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
                              {isUpdatingThisAction ? (
                                <LoaderCircle className="h-4 w-4 animate-spin" />
                              ) : (
                                <>
                                  <span>
                                    {formatReadableLabel(activeLoanForStatusAction.status)}
                                  </span>
                                  <ArrowRight className="h-4 w-4" />
                                  <span>{formatReadableLabel(action.nextStatus)}</span>
                                </>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-dashed border-slate-300 p-4 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
                      No loan actions are available for this status.
                    </div>
                  )}
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}

      <section className="dashboard-enter flex flex-col gap-4 rounded-2xl border border-slate-200/90 bg-white/80 p-5 shadow-sm shadow-slate-900/5 ring-1 ring-white/70 dark:border-slate-800/80 dark:bg-slate-900/70 dark:ring-slate-800/80">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              Loans
            </h3>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              All-time overview across the platform.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              void loadLoansOverview(true);
              void loadLoansPortfolio(true);
              void loadLoansDistribution(true);
              void loadLoans(true, currentPage);
            }}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white p-0 text-sm font-medium text-slate-700 shadow-sm shadow-slate-900/5 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900 sm:w-auto sm:px-3"
          >
            <RefreshCw
              className={cn("h-4 w-4", isRefreshing && "animate-spin")}
            />
            <span className="sr-only sm:not-sr-only">Refresh</span>
          </button>
        </div>
      </section>

      {overviewErrorMessage ? (
        <section
          className={cn(
            surfaceCardClass,
            "dashboard-enter dashboard-enter-delay-1",
          )}
        >
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Loan overview unavailable
          </p>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            {overviewErrorMessage}
          </p>
          <button
            type="button"
            onClick={() => void loadLoansOverview(true)}
            className="mt-4 inline-flex items-center justify-center rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            Try again
          </button>
        </section>
      ) : null}

      <section className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {[
          {
            label: "Total loans",
            value: loansOverview
              ? compactNumberFormatter.format(loansOverview.totalLoans)
              : "—",
            hint: "All loans created on the platform.",
            icon: Wallet,
          },
          {
            label: "Total loan value",
            value: loansOverview
              ? currencyFormatter.format(loansOverview.totalLoanValue)
              : "—",
            hint: "Total principal value across all loans.",
            icon: CreditCard,
          },
          {
            label: "Active loans",
            value: loansOverview
              ? compactNumberFormatter.format(loansOverview.activeLoans)
              : "—",
            hint: "Loans currently running on schedule.",
            icon: TrendingUp,
          },
          {
            label: "Active outstanding",
            value: loansOverview
              ? currencyFormatter.format(loansOverview.activeOutstanding)
              : "—",
            hint: "Outstanding principal on active loans.",
            icon: Wallet,
          },
          {
            label: "Overdue loans",
            value: loansOverview
              ? compactNumberFormatter.format(loansOverview.overdueLoans)
              : "—",
            hint: "Loans past their due date.",
            icon: AlertTriangle,
          },
          {
            label: "Overdue outstanding",
            value: loansOverview
              ? currencyFormatter.format(loansOverview.overdueOutstanding)
              : "—",
            hint: "Outstanding principal on overdue loans.",
            icon: AlertTriangle,
          },
          {
            label: "Default rate",
            value: loansOverview
              ? percentFormatter.format(loansOverview.defaultRate / 100)
              : "—",
            hint: "Share of loans flagged as defaulted.",
            icon: TrendingDown,
          },
          {
            label: "Avg interest rate",
            value: loansOverview
              ? percentFormatter.format(loansOverview.avgInterestRate / 100)
              : "—",
            hint: "Average interest rate across loans.",
            icon: TrendingDown,
          },
        ].map((stat, index) => {
          const Icon = stat.icon;

          return (
            <article
              key={stat.label}
              className={cn(
                surfaceCardClass,
                "dashboard-enter min-w-0",
                index === 0
                  ? "dashboard-enter-delay-1"
                  : index === 1
                    ? "dashboard-enter-delay-2"
                    : index === 2
                      ? "dashboard-enter-delay-3"
                      : "dashboard-enter-delay-4",
              )}
            >
              <div className="flex items-start justify-between gap-2 sm:gap-3">
                <p className="min-w-0 text-xs text-slate-500 dark:text-slate-400">
                  {stat.label}
                </p>
                <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-200 sm:h-10 sm:w-10">
                  <Icon className="h-5 w-5" />
                </span>
              </div>
              <p className="mt-2 break-words text-xl font-semibold leading-tight text-slate-900 dark:text-slate-100 sm:text-2xl">
                {stat.value}
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {stat.hint}
              </p>
            </article>
          );
        })}
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.45fr_1fr]">
        <article
          className={cn(
            surfaceCardClass,
            "dashboard-enter dashboard-enter-delay-2 min-w-0",
          )}
        >
          <header className="mb-4">
            <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Loans portfolio
            </h4>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Monthly disbursements, collections, and overdue amounts · Points:{" "}
              {compactNumberFormatter.format(portfolioChartData.length)}
            </p>
          </header>

          {portfolioErrorMessage ? (
            <div className="rounded-xl border border-dashed border-slate-300 p-4 text-sm text-slate-600 dark:border-slate-700 dark:text-slate-300">
              <p className="font-semibold text-slate-900 dark:text-slate-100">
                Loans portfolio unavailable
              </p>
              <p className="mt-2">{portfolioErrorMessage}</p>
              <button
                type="button"
                onClick={() => void loadLoansPortfolio(true)}
                className="mt-4 inline-flex items-center justify-center rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                Try again
              </button>
            </div>
          ) : (
            <div className="h-[320px] w-full min-w-0">
              {portfolioChartData.length ? (
                <ResponsiveContainer
                  width="100%"
                  height="100%"
                  initialDimension={responsiveChartInitialDimension}
                >
                  <BarChart
                    data={portfolioChartData}
                    margin={{ top: 10, right: 14, left: -8, bottom: 6 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="rgba(148,163,184,0.25)"
                    />
                    <XAxis
                      dataKey="month"
                      tick={{ fontSize: 12, fill: "#64748b" }}
                    />
                    <YAxis
                      tickFormatter={(value) =>
                        compactNumberFormatter.format(Number(value ?? 0))
                      }
                      tick={{ fontSize: 12, fill: "#64748b" }}
                      allowDecimals={false}
                    />
                    <Tooltip
                      cursor={{ fill: "rgba(148,163,184,0.12)" }}
                      contentStyle={{
                        borderRadius: "0.75rem",
                        border: "1px solid #cbd5e1",
                        background: "#ffffff",
                      }}
                      formatter={(value, name) => [
                        currencyFormatter.format(Number(value ?? 0)),
                        String(name),
                      ]}
                    />
                    <Legend wrapperStyle={{ fontSize: "12px" }} />
                    <Bar
                      dataKey="disbursements"
                      name="Disbursements"
                      fill="#2563eb"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      dataKey="collections"
                      name="Collections"
                      fill="#16a34a"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      dataKey="overdue"
                      name="Overdue"
                      fill="#dc2626"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-slate-300 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
                  {isPortfolioLoading
                    ? "Loading loans portfolio…"
                    : "No loans portfolio data available yet."}
                </div>
              )}
            </div>
          )}
        </article>

        <article
          className={cn(
            surfaceCardClass,
            "dashboard-enter dashboard-enter-delay-3 min-w-0",
          )}
        >
          <header className="mb-4">
            <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Loan distribution
            </h4>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Loan type distribution · Total:{" "}
              {loansDistribution
                ? compactNumberFormatter.format(loansDistribution.total)
                : "—"}
            </p>
          </header>

          {distributionErrorMessage ? (
            <div className="rounded-xl border border-dashed border-slate-300 p-4 text-sm text-slate-600 dark:border-slate-700 dark:text-slate-300">
              <p className="font-semibold text-slate-900 dark:text-slate-100">
                Loan distribution unavailable
              </p>
              <p className="mt-2">{distributionErrorMessage}</p>
              <button
                type="button"
                onClick={() => void loadLoansDistribution(true)}
                className="mt-4 inline-flex items-center justify-center rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                Try again
              </button>
            </div>
          ) : (
            <div className="h-[320px] w-full min-w-0">
              {distributionChartData.length ? (
                <ResponsiveContainer
                  width="100%"
                  height="100%"
                  initialDimension={responsiveChartInitialDimension}
                >
                  <PieChart
                    margin={{ top: 10, right: 10, left: 10, bottom: 10 }}
                  >
                    <Tooltip
                      contentStyle={{
                        borderRadius: "0.75rem",
                        border: "1px solid #cbd5e1",
                        background: "#ffffff",
                      }}
                      formatter={(value, name, props) => {
                        const percentage =
                          typeof props?.payload?.percentage === "number"
                            ? props.payload.percentage
                            : Number.NaN;
                        const percentageLabel = Number.isFinite(percentage)
                          ? percentFormatter.format(percentage / 100)
                          : "N/A";
                        return [
                          `${compactNumberFormatter.format(Number(value ?? 0))} (${percentageLabel})`,
                          String(name),
                        ];
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: "12px" }} />
                    <Pie
                      data={distributionChartData}
                      dataKey="count"
                      nameKey="label"
                      innerRadius={70}
                      outerRadius={110}
                      paddingAngle={2}
                      stroke="rgba(148,163,184,0.35)"
                    >
                      {distributionChartData.map((entry, index) => (
                        <Cell
                          key={`${entry.type}-${index}`}
                          fill={
                            distributionPalette[
                              index % distributionPalette.length
                            ]
                          }
                        />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-slate-300 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
                  {isDistributionLoading
                    ? "Loading loan distribution…"
                    : "No loan distribution data available yet."}
                </div>
              )}
            </div>
          )}

          {distributionChartData.length ? (
            <div className="mt-4 space-y-2">
              {distributionChartData.map((item, index) => (
                <div
                  key={item.type}
                  className="flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{
                        backgroundColor:
                          distributionPalette[
                            index % distributionPalette.length
                          ],
                      }}
                      aria-hidden="true"
                    />
                    <span className="break-words text-slate-700 dark:text-slate-200">
                      {item.label}
                    </span>
                  </div>
                  <span className="shrink-0 font-semibold text-slate-900 dark:text-slate-100">
                    {compactNumberFormatter.format(item.count)} ·{" "}
                    {percentFormatter.format(item.percentage / 100)}
                  </span>
                </div>
              ))}
            </div>
          ) : null}
        </article>
      </section>

      <section
        className={cn(
          surfaceCardClass,
          "dashboard-enter dashboard-enter-delay-4",
        )}
      >
        <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Loan activity
            </h3>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Total: {compactNumberFormatter.format(totalLoans)} · Page{" "}
              {currentPage} of {totalPages}
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
            <label className="relative w-full sm:w-auto">
              <span className="sr-only">Search</span>
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search borrower, landlord, status..."
                className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm text-slate-900 shadow-sm shadow-slate-900/5 outline-none transition focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 sm:w-64"
              />
            </label>

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 shadow-sm shadow-slate-900/5 outline-none transition focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 sm:w-auto"
              aria-label="Filter status"
            >
              <option value="all">All statuses</option>
              {availableLoanStatuses.map((status) => (
                <option key={status} value={status}>
                  {formatReadableLabel(status)}
                </option>
              ))}
            </select>
          </div>
        </header>

        <div className="mt-4 space-y-3 lg:hidden">
          {loansErrorMessage && loans.length === 0 ? (
            <div className="rounded-2xl border border-slate-200/80 bg-white/70 p-6 text-sm text-slate-600 shadow-sm shadow-slate-900/5 dark:border-slate-800/80 dark:bg-slate-950/30 dark:text-slate-300">
              <p className="font-semibold text-slate-900 dark:text-slate-100">
                Loans unavailable
              </p>
              <p className="mt-2">{loansErrorMessage}</p>
              <button
                type="button"
                onClick={() => void loadLoans(true, currentPage)}
                className="mt-4 inline-flex items-center justify-center rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                Try again
              </button>
            </div>
          ) : isLoansLoading && loans.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
              Loading loans…
            </div>
          ) : filteredLoans.length ? (
            filteredLoans.map((loan) => {
              const displayName =
                loan.borrower?.name?.trim() ||
                loan.borrower?.username?.trim() ||
                "Unknown borrower";
              const email = loan.borrower?.email?.trim() || "";
              const avatarUrl = loan.borrower?.avatar?.trim() || "";
              const badgeClasses = getLoanStatusBadgeClasses(loan.status);
              const isStatusActionable =
                getLoanStatusActionOptions(loan.status).length > 0;
              const landlordRawName = loan.landlord?.name?.trim() || "";
              const landlordUsername = loan.landlord?.username?.trim() || "";
              const landlordName = landlordRawName || landlordUsername;
              const landlordAvatarUrl = loan.landlord?.avatar?.trim() || "";
              const landlordSecondary =
                landlordRawName && landlordUsername
                  ? `@${landlordUsername}`
                  : "";

              const typeLabel = formatReadableLabel(loan.type) || "Loan";
              const metaSegments = [
                loan.product?.trim() ? formatReadableLabel(loan.product) : "",
                loan.reference?.trim() ? loan.reference.trim() : "",
              ].filter(Boolean);

              return (
                <article
                  key={loan.id}
                  className="rounded-2xl border border-slate-200/80 bg-white/70 p-5 shadow-sm shadow-slate-900/5 dark:border-slate-800/80 dark:bg-slate-950/30"
                >
                  <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                            {avatarUrl ? (
                              <img
                                src={avatarUrl}
                                alt={displayName}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <UserCircle2 className="h-5 w-5" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                              Borrower
                            </p>
                            <p className="mt-1 break-words text-sm font-semibold text-slate-900 dark:text-slate-100">
                              {displayName}
                            </p>
                            {email ? (
                              <p className="mt-0.5 break-all text-xs text-slate-500 dark:text-slate-400">
                                {email}
                              </p>
                            ) : (
                              <p className="mt-0.5 break-words text-xs text-slate-500 dark:text-slate-400">
                                —
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex min-w-0 items-center gap-3">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                            {landlordAvatarUrl ? (
                              <img
                                src={landlordAvatarUrl}
                                alt={landlordName || "Landlord"}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <UserCircle2 className="h-5 w-5" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                              Landlord
                            </p>
                            <p className="mt-1 break-words text-sm font-semibold text-slate-900 dark:text-slate-100">
                              {landlordName || "—"}
                            </p>
                            {landlordSecondary ? (
                              <p className="mt-0.5 break-words text-xs text-slate-500 dark:text-slate-400">
                                {landlordSecondary}
                              </p>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        isStatusActionable
                          ? setStatusActionLoanId(loan.id)
                          : undefined
                      }
                      disabled={!isStatusActionable}
                      className={cn(
                        "inline-flex items-center justify-center rounded-lg border px-2.5 py-1 text-xs font-semibold",
                        badgeClasses,
                        "self-start",
                        isStatusActionable
                          ? "cursor-pointer transition hover:brightness-95"
                          : "cursor-default",
                      )}
                      aria-label={`Open status actions for ${displayName}`}
                    >
                      {formatReadableLabel(loan.status)}
                    </button>
                  </header>

                  <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                    <div className="rounded-xl bg-slate-100/70 px-4 py-3 dark:bg-slate-900/40">
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Loan
                      </p>
                      <p className="mt-1 font-semibold text-slate-900 dark:text-slate-100">
                        {typeLabel}
                      </p>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 break-words">
                        {metaSegments.join(" · ") || "—"}
                      </p>
                      {loan.riskLevel?.trim() ? (
                        <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                          Risk: {formatReadableLabel(loan.riskLevel)}
                        </p>
                      ) : null}
                      {typeof loan.repaymentProgress === "number" ? (
                        <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                          Progress:{" "}
                          {percentFormatter.format(
                            loan.repaymentProgress / 100,
                          )}
                        </p>
                      ) : null}
                    </div>

                    <div className="rounded-xl bg-slate-100/70 px-4 py-3 dark:bg-slate-900/40">
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Amount
                      </p>
                      <p className="mt-1 font-semibold text-slate-900 dark:text-slate-100">
                        {currencyFormatter.format(loan.principal)}
                      </p>
                      {typeof loan.amountToPay === "number" ? (
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                          To pay: {currencyFormatter.format(loan.amountToPay)}
                        </p>
                      ) : null}
                      {typeof loan.outstanding === "number" ? (
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                          Outstanding:{" "}
                          {currencyFormatter.format(loan.outstanding)}
                        </p>
                      ) : null}
                      {typeof loan.monthlyPayment === "number" ? (
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                          Monthly:{" "}
                          {currencyFormatter.format(loan.monthlyPayment)}
                        </p>
                      ) : null}
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        Due: {formatLoanTimestamp(loan.dueAt)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <span>Created: {formatLoanTimestamp(loan.createdAt)}</span>
                    {loan.disbursedAt?.trim() ? (
                      <span>
                        Disbursed: {formatLoanTimestamp(loan.disbursedAt)}
                      </span>
                    ) : null}
                    {typeof loan.interestRate === "number" ? (
                      <span className="inline-flex items-center gap-1 font-medium text-slate-700 dark:text-slate-200">
                        <TrendingDown className="h-3.5 w-3.5" />
                        Rate: {loan.interestRate.toFixed(2)}%
                      </span>
                    ) : null}
                  </div>
                </article>
              );
            })
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
              {filtersActive
                ? "No loans match these filters."
                : "No loans found."}
            </div>
          )}
        </div>

        <div className="mt-4 hidden overflow-hidden rounded-2xl border border-slate-200/90 dark:border-slate-800/80 lg:block">
          <div className="grid grid-cols-12 bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:bg-slate-900/60 dark:text-slate-400">
            <div className="col-span-3">Borrower</div>
            <div className="col-span-4">Loan</div>
            <div className="col-span-2 text-right">Principal</div>
            <div className="col-span-1 ">Status</div>
            <div className="col-span-2 text-right">Due</div>
          </div>
          <div className="divide-y divide-slate-200/80 bg-white dark:divide-slate-800/80 dark:bg-slate-950/30">
            {loansErrorMessage && loans.length === 0 ? (
              <div className="flex min-h-40 flex-col items-center justify-center gap-3 px-4 py-10 text-sm text-slate-600 dark:text-slate-300">
                <p className="text-center font-semibold text-slate-900 dark:text-slate-100">
                  Loans unavailable
                </p>
                <p className="max-w-xl text-center">{loansErrorMessage}</p>
                <button
                  type="button"
                  onClick={() => void loadLoans(true, currentPage)}
                  className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
                >
                  Try again
                </button>
              </div>
            ) : isLoansLoading && loans.length === 0 ? (
              <div className="flex min-h-40 items-center justify-center px-4 py-10 text-sm text-slate-500 dark:text-slate-400">
                Loading loans…
              </div>
            ) : filteredLoans.length ? (
              filteredLoans.map((loan) => {
                const displayName =
                  loan.borrower?.name?.trim() ||
                  loan.borrower?.username?.trim() ||
                  "Unknown borrower";
                const email = loan.borrower?.email?.trim() || "";
                const avatarUrl = loan.borrower?.avatar?.trim() || "";
                const typeLabel = formatReadableLabel(loan.type) || "Loan";
                const isStatusActionable =
                  getLoanStatusActionOptions(loan.status).length > 0;
                const landlordName =
                  loan.landlord?.name?.trim() ||
                  loan.landlord?.username?.trim() ||
                  "";
                const landlordAvatarUrl = loan.landlord?.avatar?.trim() || "";
                const metaSegments = [
                  loan.product?.trim() ? formatReadableLabel(loan.product) : "",
                  loan.reference?.trim() ? loan.reference.trim() : "",
                ].filter(Boolean);
                const metaLabel = metaSegments.join(" · ");
                const paymentSegments = [
                  typeof loan.amountToPay === "number"
                    ? `To pay: ${currencyFormatter.format(loan.amountToPay)}`
                    : "",
                  typeof loan.outstanding === "number"
                    ? `Outstanding: ${currencyFormatter.format(loan.outstanding)}`
                    : "",
                  typeof loan.monthlyPayment === "number"
                    ? `Monthly: ${currencyFormatter.format(loan.monthlyPayment)}`
                    : "",
                ].filter(Boolean);
                const paymentsLabel = paymentSegments.join(" · ");
                const loanRiskSegments = [
                  loan.riskLevel?.trim()
                    ? `Risk: ${formatReadableLabel(loan.riskLevel)}`
                    : "",
                  typeof loan.repaymentProgress === "number"
                    ? `Progress: ${percentFormatter.format(loan.repaymentProgress / 100)}`
                    : "",
                ].filter(Boolean);
                const loanRiskLabel = loanRiskSegments.join(" · ");

                return (
                  <div
                    key={loan.id}
                    className="grid grid-cols-12 items-start gap-3 px-4 py-3 text-sm"
                  >
                    <div className="col-span-3 flex min-w-0 items-center gap-3">
                      <div className="relative h-10 w-10 shrink-0">
                        <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-2xl bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                          {avatarUrl ? (
                            <img
                              src={avatarUrl}
                              alt={displayName}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <UserCircle2 className="h-5 w-5" />
                          )}
                        </div>
                        <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center overflow-hidden rounded-xl border border-white bg-slate-100 text-slate-500 shadow-sm shadow-slate-900/10 dark:border-slate-950 dark:bg-slate-800 dark:text-slate-300">
                          {landlordAvatarUrl ? (
                            <img
                              src={landlordAvatarUrl}
                              alt={landlordName || "Landlord"}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <UserCircle2 className="h-3.5 w-3.5" />
                          )}
                        </div>
                      </div>
                      <div className="min-w-0">
                        <p className="break-words font-semibold text-slate-900 dark:text-slate-100">
                          {displayName}
                        </p>
                        {email ? (
                          <p className="mt-0.5 break-all text-xs text-slate-500 dark:text-slate-400">
                            {email}
                          </p>
                        ) : landlordName ? (
                          <p className="mt-0.5 break-words text-xs text-slate-500 dark:text-slate-400">
                            Landlord: {landlordName}
                          </p>
                        ) : (
                          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                            —
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="col-span-4 min-w-0">
                      <p className="font-semibold text-slate-900 dark:text-slate-100 break-words">
                        {typeLabel}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 break-words">
                        {metaLabel || "—"}
                      </p>
                      {typeof loan.interestRate === "number" ? (
                        <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                          Rate: {loan.interestRate.toFixed(2)}%
                        </p>
                      ) : null}
                      {paymentsLabel ? (
                        <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                          {paymentsLabel}
                        </p>
                      ) : null}
                      {loanRiskLabel ? (
                        <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                          {loanRiskLabel}
                        </p>
                      ) : null}
                    </div>

                    <div className="col-span-2 text-right font-semibold text-slate-900 dark:text-slate-100">
                      {currencyFormatter.format(loan.principal)}
                    </div>

                    <div className="col-span-1">
                      <button
                        type="button"
                        onClick={() =>
                          isStatusActionable
                            ? setStatusActionLoanId(loan.id)
                            : undefined
                        }
                        disabled={!isStatusActionable}
                        className={cn(
                          "inline-flex items-center justify-center rounded-lg border px-2.5 py-1 text-xs font-semibold",
                          getLoanStatusBadgeClasses(loan.status),
                          isStatusActionable
                            ? "cursor-pointer transition hover:brightness-95"
                            : "cursor-default",
                        )}
                        aria-label={`Open status actions for ${displayName}`}
                      >
                        {formatReadableLabel(loan.status)}
                      </button>
                    </div>

                    <div className="col-span-2 text-right text-xs text-slate-500 dark:text-slate-400">
                      {formatLoanTimestamp(loan.dueAt)}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="flex min-h-40 items-center justify-center px-4 py-10 text-sm text-slate-500 dark:text-slate-400">
                {filtersActive
                  ? "No loans match these filters."
                  : "No loans found."}
              </div>
            )}
          </div>
        </div>

        {filtersActive && (
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span>
              Filters active:{" "}
              {statusFilter !== "all" ? `status=${statusFilter}` : "status=all"}
              {searchQuery.trim() ? `, search="${searchQuery.trim()}"` : ""}
            </span>
            <button
              type="button"
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 shadow-sm shadow-slate-900/5 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900"
              onClick={() => {
                setSearchQuery("");
                setStatusFilter("all");
              }}
            >
              Clear filters
            </button>
          </div>
        )}

        {pagination ? (
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Page {currentPage} of {totalPages} · Total{" "}
              {compactNumberFormatter.format(totalLoans)}
              {filtersActive
                ? ` · Showing ${compactNumberFormatter.format(filteredLoans.length)} on this page`
                : ""}
            </p>

            <div className="flex flex-wrap items-center justify-start gap-1 sm:justify-end">
              <button
                type="button"
                disabled={isLoansLoading || currentPage <= 1}
                onClick={() =>
                  setPage((previousPage) => Math.max(1, previousPage - 1))
                }
                className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-sm shadow-slate-900/5 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900"
              >
                Prev
              </button>

              {paginationItems.map((item) => {
                if (item === "start-ellipsis" || item === "end-ellipsis") {
                  return (
                    <span
                      key={`${item}-${currentPage}`}
                      className="px-2 text-xs text-slate-400"
                    >
                      …
                    </span>
                  );
                }

                const isActive = item === currentPage;
                return (
                  <button
                    key={item}
                    type="button"
                    disabled={isLoansLoading}
                    onClick={() => setPage(item)}
                    className={cn(
                      "h-9 min-w-9 rounded-lg border px-3 text-xs font-semibold shadow-sm shadow-slate-900/5 transition disabled:cursor-not-allowed disabled:opacity-60",
                      isActive
                        ? "border-blue-600 bg-blue-600 text-white"
                        : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900",
                    )}
                    aria-current={isActive ? "page" : undefined}
                  >
                    {item}
                  </button>
                );
              })}

              <button
                type="button"
                disabled={isLoansLoading || currentPage >= totalPages}
                onClick={() =>
                  setPage((previousPage) =>
                    Math.min(totalPages, previousPage + 1),
                  )
                }
                className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-sm shadow-slate-900/5 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900"
              >
                Next
              </button>
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
}
