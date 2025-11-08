import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fjzcftyxgiegarwoovau.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZqemNmdHl4Z2llZ2Fyd29vdmF1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI0ODM5ODgsImV4cCI6MjA3ODA1OTk4OH0.WEte9VA9Zi4bvpiXGR7FP4Btjyql8c3cjHP2FMMEe8M';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
