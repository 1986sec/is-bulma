import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Jobs from "./pages/Jobs";
import Profile from "./pages/Profile";
import AdminLayout from "./admin/components/AdminLayout";
import Dashboard from "./admin/pages/Dashboard";
import Users from "./admin/pages/Users";
import AdminJobs from "./admin/pages/Jobs";
import Reports from "./admin/pages/Reports";
import Settings from "./admin/pages/Settings";
import "./i18n"; // i18n altyapısı

const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem("token");
  return token ? children : <Navigate to="/login" />;
};

const AdminRoute = ({ children }) => {
  const token = localStorage.getItem("token");
  const isAdmin = localStorage.getItem("isAdmin") === "true";
  return token && isAdmin ? children : <Navigate to="/" />;
};

const App = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/"
        element={
          <Layout>
            <Home />
          </Layout>
        }
      />
      <Route
        path="/jobs"
        element={
          <Layout>
            <Jobs />
          </Layout>
        }
      />
      <Route
        path="/profile"
        element={
          <PrivateRoute>
            <Layout>
              <Profile />
            </Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <AdminRoute>
            <AdminLayout>
              <Dashboard />
            </AdminLayout>
          </AdminRoute>
        }
      />
      <Route
        path="/admin/users"
        element={
          <AdminRoute>
            <AdminLayout>
              <Users />
            </AdminLayout>
          </AdminRoute>
        }
      />
      <Route
        path="/admin/jobs"
        element={
          <AdminRoute>
            <AdminLayout>
              <AdminJobs />
            </AdminLayout>
          </AdminRoute>
        }
      />
      <Route
        path="/admin/reports"
        element={
          <AdminRoute>
            <AdminLayout>
              <Reports />
            </AdminLayout>
          </AdminRoute>
        }
      />
      <Route
        path="/admin/settings"
        element={
          <AdminRoute>
            <AdminLayout>
              <Settings />
            </AdminLayout>
          </AdminRoute>
        }
      />
    </Routes>
  );
};

export default App; 