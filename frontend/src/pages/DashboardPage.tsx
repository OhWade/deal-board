import { useState } from "react";
import BoardColumn from "../components/dashboard/BoardColumn";
import styles from "../components/dashboard/Dashboard.module.css";
import MonthlyChart from "../components/dashboard/MonthlyChart";
import PeriodPicker from "../components/dashboard/PeriodPicker";
import RecentDeals from "../components/dashboard/RecentDeals";
import { useStats } from "../hooks/useStats";
import { useTransactions } from "../hooks/useTransactions";
import { lastMonths, periodRange, type Period } from "../utils/dates";

const CHART_MONTHS = 6;

export default function DashboardPage() {
  const [period, setPeriod] = useState<Period>("year");

  const board = useStats(periodRange(period));
  const chart = useStats({ from: `${lastMonths(CHART_MONTHS)[0]}-01` });
  const recent = useTransactions({ limit: 6 });

  return (
    <div className="page">
      <div className="page-head">
        <h1>Sales board</h1>
        <PeriodPicker value={period} onChange={setPeriod} />
      </div>

      {board.isError && (
        <p className="banner" role="alert">
          {board.error.message}
        </p>
      )}

      {board.data ? (
        <div className={styles.board}>
          <BoardColumn variant="sold" totals={board.data.sold} />
          <BoardColumn variant="purchased" totals={board.data.purchased} />
        </div>
      ) : (
        !board.isError && <p className={styles.loading}>Loading the board…</p>
      )}

      <div className={styles.lower}>
        {chart.data && <MonthlyChart monthly={chart.data.monthly} months={CHART_MONTHS} />}
        {recent.data && <RecentDeals deals={recent.data.data} />}
      </div>
    </div>
  );
}
