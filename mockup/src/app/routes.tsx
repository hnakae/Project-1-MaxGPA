import { createBrowserRouter } from "react-router";
import { DashboardPage } from "./pages/dashboard-page";
import { AdminPage } from "./pages/admin-page";
import { Layout } from "./components/layout";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Layout,
    children: [
      { index: true, Component: DashboardPage },
      { path: "admin", Component: AdminPage },
    ],
  },
]);
