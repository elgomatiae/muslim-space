// TypeScript-only shim so `tsc` can typecheck Supabase server-side functions
// that reference the Deno global. The app itself doesn't run Deno.
declare const Deno: any;

