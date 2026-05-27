import { createClient } from '@supabase/supabase-js';


// Initialize database client
const supabaseUrl = 'https://tjisfterqzeawoemzhyd.databasepad.com';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6Ijg0Njc2MGE1LWQ1NmMtNDUyNi05M2RlLTNkOTNmMjM3NjRjNyJ9.eyJwcm9qZWN0SWQiOiJ0amlzZnRlcnF6ZWF3b2Vtemh5ZCIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNzc5ODY5Mjc5LCJleHAiOjIwOTUyMjkyNzksImlzcyI6ImZhbW91cy5kYXRhYmFzZXBhZCIsImF1ZCI6ImZhbW91cy5jbGllbnRzIn0.hOT5mTH7Gaub9ok8b2hvSIZvB5wjW3A4q63KFkgfFIg';
const supabase = createClient(supabaseUrl, supabaseKey);


export { supabase };