import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; // 🔥 à ajouter dans .env.local

// Client pour le front (lecture publique)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Client pour le serveur (upload sécurisé)
export const supabaseServer = createClient(supabaseUrl, supabaseServiceKey);
