import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from '@/store/authStore'
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import DashboardLayout from "@/components/Layout/DashboardLayout";

import DailyReports from "@/pages/Reports/DailyReports";
import WeeklyReports from "@/pages/Reports/WeeklyReports";
import MonthlyReports from "@/pages/Reports/MonthlyReports";
import ArchivedReports from "@/pages/Reports/ArchivedReports";

import TaskManagement from "@/pages/Management/TaskManagement";
import ProjectManagement from "@/pages/Management/ProjectManagement";
import PeopleManagement from "@/pages/Management/PeopleManagement";
import ArchivedManagement from "@/pages/Management/ArchivedManagement";

import TodayReport from "@/pages/DailyReport/TodayReport";
import YesterdayReport from "@/pages/DailyReport/YesterdayReport";
import TempTask from "@/pages/DailyReport/TempTask";

import ViewComment from "@/pages/Notifications/ViewComment";
import ViewReview from "@/pages/Notifications/ViewReview";

import UserSettings from "@/pages/Settings/UserSettings";
import PermissionSettings from "@/pages/Settings/PermissionSettings";
import DataSettings from "@/pages/Settings/DataSettings";
import LogSettings from "@/pages/Settings/LogSettings";

import AchievementManagement from "@/pages/Achievement/AchievementManagement";
import MyAchievement from "@/pages/Achievement/MyAchievement";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isLoggedIn } = useAuthStore()
  if (!isLoggedIn) {
    return <Navigate to="/" />
  }
  return <>{children}</>
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }>
          <Route index element={<Dashboard />} />
          
          <Route path="reports/daily" element={<DailyReports />} />
          <Route path="reports/weekly" element={<WeeklyReports />} />
          <Route path="reports/monthly" element={<MonthlyReports />} />
          <Route path="reports/archived" element={<ArchivedReports />} />
          
          <Route path="management/tasks" element={<TaskManagement />} />
          <Route path="management/projects" element={<ProjectManagement />} />
          <Route path="management/people" element={<PeopleManagement />} />
          <Route path="management/archived" element={<ArchivedManagement />} />
          
          <Route path="daily-report/today" element={<TodayReport />} />
          <Route path="daily-report/yesterday" element={<YesterdayReport />} />
          <Route path="daily-report/temp-task" element={<TempTask />} />
          
          <Route path="notifications/comments" element={<ViewComment />} />
          <Route path="notifications/reviews" element={<ViewReview />} />
          
          <Route path="settings/users" element={<UserSettings />} />
          <Route path="settings/permissions" element={<PermissionSettings />} />
          <Route path="settings/data" element={<DataSettings />} />
          <Route path="settings/logs" element={<LogSettings />} />
          
          <Route path="achievements" element={<AchievementManagement />} />
          <Route path="achievements/my" element={<MyAchievement />} />
        </Route>
        
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}