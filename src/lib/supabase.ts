import { createClient } from '@supabase/supabase-js';


// Initialize database client
const supabaseUrl = 'https://bywxokrcfwqnwruczsra.databasepad.com';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IjQxNmRiNGY1LWFiNDUtNGU2OC04Y2JkLWVhYWQ1MmQ5YzQ3ZiJ9.eyJwcm9qZWN0SWQiOiJieXd4b2tyY2Z3cW53cnVjenNyYSIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNzc5OTI0MDQzLCJleHAiOjIwOTUyODQwNDMsImlzcyI6ImZhbW91cy5kYXRhYmFzZXBhZCIsImF1ZCI6ImZhbW91cy5jbGllbnRzIn0.KkTvt5mQc4AvfizACejbeUJ_CWEJOK3OTcg_KYMsCKc';
const supabase = createClient(supabaseUrl, supabaseKey);


export { supabase };