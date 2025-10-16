// src/components/NotificationToast.tsx
import React from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";

interface Notification {
  id: number;
  message: string;
  type: "success" | "error" | "info";
}

interface NotificationToastProps {
  notifications: Notification[];
  removeNotification: (id: number) => void;
}

export default function Notifications({ notifications, removeNotification }: NotificationToastProps) {
  return (
    <>
      {notifications.map((notif) => (
        <motion.div
          key={notif.id}
          initial={{ opacity: 0, y: 50, scale: 0.3 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
          className={`fixed bottom-4 right-4 p-4 rounded-xl shadow-2xl text-white ${notif.type === "success" ? "bg-green-500" : notif.type === "error" ? "bg-red-500" : "bg-blue-500"} z-50`}
        >
          <div className="flex items-center gap-2">
            {notif.message}
            <button onClick={() => removeNotification(notif.id)} className="ml-auto"><X className="w-5 h-5" /></button>
          </div>
        </motion.div>
      ))}
    </>
  );
}