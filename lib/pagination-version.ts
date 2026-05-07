// Bump PAGINATION_VERSION and PAGINATION_TIMESTAMP on every production-impacting pagination change.
// PAGINATION_VERSION : increment minor (v3.0→v3.1) for fixes/tuning, major (v3.x→v4.0) for rewrites.
// PAGINATION_TIMESTAMP : ISO 8601 UTC — set to the time of the change.
// Format shown in UI: "v3.0 • 07 May 2026 at 04:21:11"  (matches DbStatus en-GB toLocaleString)

export const PAGINATION_VERSION   = "v3.0";
export const PAGINATION_TIMESTAMP = "2026-05-07T04:21:11.000Z";
