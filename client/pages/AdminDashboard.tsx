import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { auth, db } from "@/firebase";
import {
  collection,
  onSnapshot,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
} from "firebase/firestore";
import Navigation from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

/**
 * AdminDashboard lists all user reports and allows an admin to mark
 * reports as resolved. It also provides navigation to view the reported
 * user's profile. Only users with a `role` of "admin" in the `users`
 * collection can access this page. Non‑admin users are redirected to
 * the home page.
 */
export default function AdminDashboard() {
  const navigate = useNavigate();
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  // Store high-level stats for admin insights
  const [stats, setStats] = useState({ users: 0, profiles: 0, unresolvedReports: 0 });

  // Maintain a list of all users for management purposes. Each entry contains the
  // user document data along with the UID so admins can identify and take
  // action on specific accounts (e.g. suspension). A simple list view is
  // rendered below with optional actions for the admin.
  const [usersList, setUsersList] = useState<any[]>([]);

  // Check current user's role on mount
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      setIsAdmin(false);
      return;
    }
    (async () => {
      try {
        const userSnap = await getDoc(doc(db, "users", user.uid));
        const role = userSnap.exists() ? userSnap.data().role : null;
        setIsAdmin(role === "admin");
      } catch (err) {
        console.error("Failed to load user role:", err);
        setIsAdmin(false);
      }
    })();
  }, []);

  // Listen for reports once admin status is known
  useEffect(() => {
    if (isAdmin !== true) return;
    const unsub = onSnapshot(collection(db, "reports"), async (snapshot) => {
      const reportDocs = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      // Fetch reporter and reported user names
      const enrichedReports: any[] = [];
      for (const report of reportDocs) {
        const { reporterId, reportedId } = report;
        let reporterName = reporterId;
        let reportedName = reportedId;
        try {
          const reporterSnap = await getDoc(doc(db, "users", reporterId));
          if (reporterSnap.exists()) {
            const d = reporterSnap.data();
            reporterName = `${d.firstName ?? ""} ${d.lastName ?? ""}`.trim();
          }
          const reportedSnap = await getDoc(doc(db, "users", reportedId));
          if (reportedSnap.exists()) {
            const d2 = reportedSnap.data();
            reportedName = `${d2.firstName ?? ""} ${d2.lastName ?? ""}`.trim();
          }
        } catch (err) {
          console.error("Failed to enrich report:", err);
        }
        enrichedReports.push({ ...report, reporterName, reportedName });
      }
      setReports(enrichedReports);
      setLoading(false);
    });
    return () => unsub();
  }, [isAdmin]);

  // Fetch counts for users, profiles and unresolved reports when admin logs in
  useEffect(() => {
    if (isAdmin !== true) return;
    const fetchStats = async () => {
      try {
        const usersSnap = await getDocs(collection(db, "users"));
        const profilesSnap = await getDocs(collection(db, "profiles"));
        const unresolvedSnap = await getDocs(query(collection(db, "reports"), where("status", "!=", "resolved")));
        setStats({
          users: usersSnap.size,
          profiles: profilesSnap.size,
          unresolvedReports: unresolvedSnap.size,
        });

        // Populate the user list for management. We intentionally avoid
        // performing complex joins here (like counting reports per user) to keep
        // client-side logic simple. Counts of reports are computed below when
        // rendering the list. If your dataset grows large, consider moving
        // aggregation logic to a Cloud Function.
        const users: any[] = [];
        usersSnap.forEach((docSnap) => {
          users.push({ id: docSnap.id, ...docSnap.data() });
        });
        setUsersList(users);
      } catch (err) {
        console.error("Failed to load stats:", err);
      }
    };
    fetchStats();
  }, [isAdmin]);

  // Mark a report as resolved. This updates the `status` field on the
  // report document. You could also delete the report or take further
  // action here.
  const resolveReport = async (reportId: string) => {
    try {
      await updateDoc(doc(db, "reports", reportId), { status: "resolved" });
    } catch (err) {
      console.error("Failed to resolve report:", err);
    }
  };

  /**
   * Toggle a user's suspended status. If the user is currently disabled
   * (disabled === true), re-enable them; otherwise disable them. This
   * functionality demonstrates additional admin capabilities beyond
   * managing reports. Suspended users could be prevented from logging in
   * via Firestore rules or client-side checks (not implemented here).
   */
  const toggleSuspendUser = async (userId: string, currentDisabled: boolean) => {
    try {
      await updateDoc(doc(db, "users", userId), { disabled: !currentDisabled });
      // Update local state so UI reflects the change immediately
      setUsersList((prev) => prev.map((u) => (u.id === userId ? { ...u, disabled: !currentDisabled } : u)));
    } catch (err) {
      console.error("Failed to update user status:", err);
    }
  };

  // If user is not admin, show unauthorized message
  if (isAdmin === false) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold">Unauthorized</h2>
          <p className="text-gray-600">You do not have permission to view this page.</p>
          <Button onClick={() => navigate("/")}>
            Go Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50">
      <Navigation currentPage="admin" />
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        {/* Admin overview statistics */}
        <Card>
          <CardHeader>
            <CardTitle>Dashboard Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 border rounded-md text-center">
                <p className="text-3xl font-bold">{stats.users}</p>
                <p className="text-gray-600">Registered Users</p>
              </div>
              <div className="p-4 border rounded-md text-center">
                <p className="text-3xl font-bold">{stats.profiles}</p>
                <p className="text-gray-600">Completed Profiles</p>
              </div>
              <div className="p-4 border rounded-md text-center">
                <p className="text-3xl font-bold">{stats.unresolvedReports}</p>
                <p className="text-gray-600">Pending Reports</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>User Reports</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-gray-600">Loading reports...</p>
            ) : reports.length === 0 ? (
              <p className="text-gray-600">No reports found.</p>
            ) : (
              <div className="space-y-4">
                {reports.map((report) => (
                  <div
                    key={report.id}
                    className="border rounded-md p-4 flex flex-col md:flex-row md:items-center md:justify-between"
                  >
                    <div className="space-y-1 text-sm">
                      <p>
                        <span className="font-medium">Reporter:</span> {report.reporterName}
                      </p>
                      <p>
                        <span className="font-medium">Reported:</span>{" "}
                        <Link
                          to={`/profile/${report.reportedId}`}
                          className="text-blue-600 hover:underline"
                        >
                          {report.reportedName}
                        </Link>
                      </p>
                      <p>
                        <span className="font-medium">Reason:</span> {report.reason}
                      </p>
                      <p>
                        <span className="font-medium">Status:</span>{" "}
                        <Badge variant={report.status === "resolved" ? "secondary" : "destructive"}>
                          {report.status ?? "pending"}
                        </Badge>
                      </p>
                    </div>
                    {report.status !== "resolved" && (
                      <Button
                        size="sm"
                        className="mt-3 md:mt-0"
                        onClick={() => resolveReport(report.id)}
                      >
                        Mark Resolved
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        {/* User management table: list all users and allow suspension */}
        <Card>
          <CardHeader>
            <CardTitle>All Users</CardTitle>
          </CardHeader>
          <CardContent>
            {usersList.length === 0 ? (
              <p className="text-gray-600">No users found.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-3 py-2 text-left font-medium text-gray-700">Name</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-700">Email</th>
                      {/* Only admins can see sensitive identifiers like student ID. This column will not be visible to regular users because this dashboard is admin-only. */}
                      <th className="px-3 py-2 text-left font-medium text-gray-700">Student ID</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-700">Role</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-700">Reports</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-700">Status</th>
                      <th className="px-3 py-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {usersList.map((user) => {
                      // Count how many times this user has been reported
                      const reportCount = reports.filter((r) => r.reportedId === user.id).length;
                      return (
                        <tr key={user.id} className="border-t">
                          <td className="px-3 py-2 whitespace-nowrap">
                            {(user.firstName ?? user.name ?? "") + " " + (user.lastName ?? "")} 
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap">{user.email}</td>
                          <td className="px-3 py-2 whitespace-nowrap">{user.studentId ?? "—"}</td>
                          <td className="px-3 py-2 whitespace-nowrap">{user.role ?? "student"}</td>
                          <td className="px-3 py-2 whitespace-nowrap">{reportCount}</td>
                          <td className="px-3 py-2 whitespace-nowrap">
                            {user.disabled ? (
                              <Badge variant="destructive">Suspended</Badge>
                            ) : (
                              <Badge variant="secondary">Active</Badge>
                            )}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-right">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => toggleSuspendUser(user.id, user.disabled ?? false)}
                            >
                              {user.disabled ? "Enable" : "Suspend"}
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}