
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Bell,
  Check,
  CheckCheck,
  Clock3,
  RefreshCw,
  Search,
  AlertCircle,
  CalendarDays,
  Info,
  CalendarClock,
  BriefcaseBusiness,
  X,
  BellRing,
} from "lucide-react";

import DashboardLayout from "../dashboard/DashboardLayout";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";

interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: "assignment" | "rotation" | "general";
  read: boolean;
  createdAt: string;
}

type NotificationFilter = "all" | "unread" | "read";

const NotificationsPage = () => {
  const { user } = useAuth();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<NotificationFilter>("all");
  const [search, setSearch] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [markingAll, setMarkingAll] = useState(false);
  const [success, setSuccess] = useState("");

  const loadNotifications = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get<Notification[]>("/notifications");

      const userNotifications = response.data
        .filter((notification) => notification.userId === user?.id)
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() -
            new Date(a.createdAt).getTime(),
        );

      setNotifications(userNotifications);
    } catch {
      setError(
        "Unable to load notifications. Please check whether JSON Server is running.",
      );
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const unreadCount = notifications.filter(
    (notification) => !notification.read,
  ).length;

  const readCount = notifications.filter(
    (notification) => notification.read,
  ).length;

  const filteredNotifications = useMemo(() => {
    return notifications.filter((notification) => {
      const filterMatch =
        filter === "all" ||
        (filter === "unread" && !notification.read) ||
        (filter === "read" && notification.read);

      const searchText = search.toLowerCase();

      const searchMatch =
        notification.title.toLowerCase().includes(searchText) ||
        notification.message.toLowerCase().includes(searchText) ||
        notification.type.toLowerCase().includes(searchText);

      return filterMatch && searchMatch;
    });
  }, [notifications, filter, search]);

  const markAsRead = async (notification: Notification) => {
    if (notification.read) return;

    try {
      setUpdatingId(notification.id);
      setError("");
      setSuccess("");

      await api.patch(`/notifications/${notification.id}`, {
        read: true,
      });

      setNotifications((previous) =>
        previous.map((item) =>
          item.id === notification.id ? { ...item, read: true } : item,
        ),
      );

      setSuccess("Notification marked as read.");
    } catch {
      setError("Unable to update notification. Please try again.");
    } finally {
      setUpdatingId(null);
    }
  };

  const markAllAsRead = async () => {
    const unreadNotifications = notifications.filter(
      (notification) => !notification.read,
    );

    if (unreadNotifications.length === 0) return;

    try {
      setMarkingAll(true);
      setError("");
      setSuccess("");

      await Promise.all(
        unreadNotifications.map((notification) =>
          api.patch(`/notifications/${notification.id}`, {
            read: true,
          }),
        ),
      );

      setNotifications((previous) =>
        previous.map((notification) => ({
          ...notification,
          read: true,
        })),
      );

      setSuccess("All notifications marked as read.");
    } catch {
      setError(
        "Some notifications could not be updated. Please refresh and try again.",
      );
      await loadNotifications();
    } finally {
      setMarkingAll(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);

    if (Number.isNaN(date.getTime())) return "Date unavailable";

    return date.toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const getRelativeDate = (dateString: string) => {
    const date = new Date(dateString);

    if (Number.isNaN(date.getTime())) return "";

    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);

    if (minutes < 0) return formatDate(dateString);
    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes} min ago`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hr ago`;

    const days = Math.floor(hours / 24);
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days} days ago`;

    return formatDate(dateString);
  };

  const getNotificationStyle = (type: Notification["type"]) => {
    switch (type) {
      case "assignment":
        return {
          icon: BriefcaseBusiness,
          iconClass:
            "bg-violet-100 text-violet-600 dark:bg-violet-500/15 dark:text-violet-400",
          label: "Assignment",
        };

      case "rotation":
        return {
          icon: CalendarClock,
          iconClass:
            "bg-blue-100 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400",
          label: "Rotation",
        };

      default:
        return {
          icon: Info,
          iconClass:
            "bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400",
          label: "General",
        };
    }
  };

  const clearMessages = () => {
    setError("");
    setSuccess("");
  };

  return (
    <DashboardLayout onSearch={setSearch}>
      <div className="min-h-full min-w-0 space-y-6 overflow-x-hidden p-1 sm:p-2">

        {/* Header */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-violet-100 p-3 text-violet-600 dark:bg-violet-500/15 dark:text-violet-400">
              <Bell size={23} />
            </div>

            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                Notifications
              </h1>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Stay updated with your assignments and shift rotations.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={loadNotifications}
              disabled={loading}
              className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <RefreshCw
                size={16}
                className={loading ? "animate-spin" : ""}
              />
              Refresh
            </button>

            <button
              onClick={markAllAsRead}
              disabled={unreadCount === 0 || markingAll}
              className="flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <CheckCheck size={16} />
              {markingAll ? "Updating..." : "Mark all as read"}
            </button>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400">
            <AlertCircle size={18} />
            <span>{error}</span>
            <button
              onClick={clearMessages}
              className="ml-auto"
              aria-label="Close error"
            >
              <X size={17} />
            </button>
          </div>
        )}

        {success && (
          <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400">
            <Check size={18} />
            <span>{success}</span>
            <button
              onClick={clearMessages}
              className="ml-auto"
              aria-label="Close success message"
            >
              <X size={17} />
            </button>
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Total Notifications
                </p>
                <h2 className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
                  {notifications.length}
                </h2>
              </div>
              <div className="rounded-xl bg-violet-100 p-3 text-violet-600 dark:bg-violet-500/15 dark:text-violet-400">
                <Bell size={22} />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Unread
                </p>
                <h2 className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
                  {unreadCount}
                </h2>
              </div>
              <div className="rounded-xl bg-amber-100 p-3 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400">
                <BellRing size={22} />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Read
                </p>
                <h2 className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
                  {readCount}
                </h2>
              </div>
              <div className="rounded-xl bg-emerald-100 p-3 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400">
                <CheckCheck size={22} />
              </div>
            </div>
          </div>
        </div>

        {/* Notification List */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">

          {/* Filters */}
          <div className="border-b border-slate-200 p-4 dark:border-slate-800">
            <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">

              <div>
                <h2 className="font-bold text-slate-900 dark:text-white">
                  Recent Notifications
                </h2>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  {filteredNotifications.length} notification(s) displayed
                </p>
              </div>

              <div className="relative w-full lg:max-w-xs">
                <Search
                  size={17}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search notifications..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-3 text-sm text-slate-800 outline-none focus:border-violet-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {(["all", "unread", "read"] as NotificationFilter[]).map(
                (item) => (
                  <button
                    key={item}
                    onClick={() => setFilter(item)}
                    className={`rounded-lg px-4 py-2 text-sm font-semibold capitalize transition ${
                      filter === item
                        ? "bg-violet-600 text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                    }`}
                  >
                    {item}
                    {item === "unread" && unreadCount > 0 && (
                      <span className="ml-2 rounded-full bg-white/20 px-2 py-0.5 text-xs">
                        {unreadCount}
                      </span>
                    )}
                  </button>
                ),
              )}
            </div>
          </div>

          {/* Notification Items */}
          {loading ? (
            <div className="flex min-h-72 items-center justify-center">
              <div className="h-9 w-9 animate-spin rounded-full border-4 border-violet-200 border-t-violet-600" />
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="flex min-h-72 flex-col items-center justify-center px-4 text-center">
              <div className="rounded-full bg-slate-100 p-4 dark:bg-slate-800">
                <Bell size={30} className="text-slate-400" />
              </div>

              <h3 className="mt-4 font-semibold text-slate-800 dark:text-white">
                {notifications.length === 0
                  ? "No notifications yet"
                  : "No matching notifications"}
              </h3>

              <p className="mt-2 max-w-sm text-sm text-slate-500 dark:text-slate-400">
                {notifications.length === 0
                  ? "You will see your shift assignments and important updates here."
                  : "Try another filter or search term."}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredNotifications.map((notification) => {
                const style = getNotificationStyle(notification.type);
                const Icon = style.icon;

                return (
                  <div
                    key={notification.id}
                    className={`flex flex-col gap-4 p-4 transition sm:flex-row sm:items-start sm:p-5 ${
                      !notification.read
                        ? "bg-violet-50/50 dark:bg-violet-500/[0.04]"
                        : "bg-white dark:bg-slate-900"
                    }`}
                  >
                    <div
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${style.iconClass}`}
                    >
                      <Icon size={21} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                          {notification.title}
                        </h3>

                        {!notification.read && (
                          <span className="h-2 w-2 rounded-full bg-violet-600" />
                        )}

                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                          {style.label}
                        </span>

                        {!notification.read && (
                          <span className="rounded-full bg-violet-100 px-2.5 py-1 text-[10px] font-semibold text-violet-700 dark:bg-violet-500/15 dark:text-violet-300">
                            Unread
                          </span>
                        )}
                      </div>

                      <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                        {notification.message}
                      </p>

                      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-400 dark:text-slate-500">
                        <Clock3 size={13} />
                        <span>{getRelativeDate(notification.createdAt)}</span>
                        <span>•</span>
                        <CalendarDays size={13} />
                        <span>{formatDate(notification.createdAt)}</span>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center sm:justify-end">
                      {!notification.read ? (
                        <button
                          onClick={() => markAsRead(notification)}
                          disabled={
                            updatingId === notification.id || markingAll
                          }
                          className="flex items-center gap-2 rounded-lg border border-violet-200 bg-white px-3 py-2 text-xs font-semibold text-violet-700 transition hover:bg-violet-50 disabled:opacity-50 dark:border-violet-500/30 dark:bg-slate-800 dark:text-violet-300 dark:hover:bg-violet-500/10"
                        >
                          <Check size={15} />
                          {updatingId === notification.id
                            ? "Updating..."
                            : "Mark as read"}
                        </button>
                      ) : (
                        <span className="flex items-center gap-2 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                          <CheckCheck size={15} />
                          Read
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default NotificationsPage;
