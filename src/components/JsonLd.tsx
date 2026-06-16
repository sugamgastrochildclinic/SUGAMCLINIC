// Server component that emits a Schema.org JSON-LD <script> into the initial
// HTML. No "use client" — it must render on the server so crawlers (search +
// AI) see the structured data without running JavaScript.
import React from "react";

export default function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      // JSON.stringify output is safe inside a <script type="application/ld+json">;
      // escape "<" defensively to prevent any "</script>" breakout from data.
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}
