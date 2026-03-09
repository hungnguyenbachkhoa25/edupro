import { useEffect } from "react";
import { useLocation } from "wouter";

export default function AIIndexRedirect() {
  const [, navigate] = useLocation();

  useEffect(() => {
    navigate("/ai/writing");
  }, [navigate]);

  return null;
}
