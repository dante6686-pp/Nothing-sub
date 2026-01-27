// supabase-config.js
// Wklej swoje dane z Supabase -> Project Settings -> API
const SUPABASE_URL = "https://itcnyesbfxldwmxmubns.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0Y255ZXNiZnhsZHdteG11Ym5zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0NzE5OTEsImV4cCI6MjA4NTA0Nzk5MX0.gfbsMne3mj_TI60MPY5uUDoIwX8kTbdiqfAslaXgjj4";

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
