"use client";

import React, { useState, useEffect } from "react";

interface ClientDateProps {
  date: string | Date;
}

export default function ClientDate({ date }: ClientDateProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <span className="invisible">Date loading</span>;
  }

  return <span>{new Date(date).toLocaleDateString()}</span>;
}
