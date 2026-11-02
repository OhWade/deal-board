import { Route, Routes } from "react-router";
import AppShell from "./components/layout/AppShell";
import DashboardPage from "./pages/DashboardPage";
import EditTransactionPage from "./pages/EditTransactionPage";
import NewTransactionPage from "./pages/NewTransactionPage";
import NotFoundPage from "./pages/NotFoundPage";
import TransactionsPage from "./pages/TransactionsPage";

export default function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<DashboardPage />} />
        <Route path="deals" element={<TransactionsPage />} />
        <Route path="deals/new" element={<NewTransactionPage />} />
        <Route path="deals/:id" element={<EditTransactionPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
