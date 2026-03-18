import { useEffect } from 'react';
import io from 'socket.io-client';
import toast from 'react-hot-toast';

// Create a singleton socket instance to prevent multiple connections
const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000', {
  withCredentials: true,
  autoConnect: false // Connect manually when needed
});

export const useManagerSocket = (managerId, department, onActivityUpdate, onStatsUpdate) => {
  useEffect(() => {
    if (!managerId) return;

    socket.connect();
    socket.emit("join_manager_room", { managerId, department });

    if (onActivityUpdate) {
      socket.on("activity_update", onActivityUpdate);
    }

    if (onStatsUpdate) {
      socket.on("team_stats_updated", onStatsUpdate);
    }

    const criticalAlertHandler = ({ employee }) => {
      if (employee && employee.name) {
        toast.error(`⚠️ ${employee.name} dropped to critical gap score!`);
      }
    };
    
    socket.on("critical_alert", criticalAlertHandler);

    return () => {
      socket.emit("leave_manager_room");
      if (onActivityUpdate) socket.off("activity_update", onActivityUpdate);
      if (onStatsUpdate) socket.off("team_stats_updated", onStatsUpdate);
      socket.off("critical_alert", criticalAlertHandler);
      socket.disconnect();
    };
  }, [managerId, department, onActivityUpdate, onStatsUpdate]);

  return socket;
};
