"use client";
import { useEffect } from "react";
import { markPatchNotesRead } from "./actions";

export default function MarkRead() {
  useEffect(() => {
    markPatchNotesRead();
  }, []);
  return null;
}
