import { createClient } from '@supabase/supabase-js';


// Initialize database client
const supabaseUrl = 'https://naalefzoolhhxkuwypxq.databasepad.com';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IjIwMWE2YmM1LTljNDItNDZkYS05ZTc0LWRiNWJhZjVlNjY3OSJ9.eyJwcm9qZWN0SWQiOiJuYWFsZWZ6b29saGh4a3V3eXB4cSIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNzgwMjk4MTQwLCJleHAiOjIwOTU2NTgxNDAsImlzcyI6ImZhbW91cy5kYXRhYmFzZXBhZCIsImF1ZCI6ImZhbW91cy5jbGllbnRzIn0.Tgsa59U9q9txprQ6YINanJK9IXYSbvquwTro2FAaZOM';
const supabase = createClient(supabaseUrl, supabaseKey);


export { supabase };