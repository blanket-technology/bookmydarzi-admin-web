import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { unregisterPush } from "../../../services/pushService";

export default function useLogout() {
  const [busy, setBusy] = useState(false);
  const queryClient = useQueryClient();

  const handleLogout = (e) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    unregisterPush();
    setTimeout(() => {
      sessionStorage.removeItem("access_token");
      sessionStorage.removeItem("refresh_token");
      sessionStorage.removeItem("user");
      queryClient.clear();
      window.location.replace("/");
    }, 600);
  };

  return { busy, handleLogout };
}
