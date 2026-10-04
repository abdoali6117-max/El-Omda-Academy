import { createClient } from '@supabase/supabase-js'

// رابط مشروعك في Supabase
const supabaseUrl = 'https://kbyrdhepdedyiluvsmzw.supabase.co'

// مفتاح Publishable API الخاص بك
const supabaseAnonKey = 'sb_publishable_SMS_u_qbtiX6HJWtDdSvoQ_3rIOxYE0'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
