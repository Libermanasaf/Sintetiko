-- פונקציה למחיקת כל המשתמשים הרשומים חוץ מהמנהל ואיפוס הקישור שלהם בסגל
CREATE OR REPLACE FUNCTION public.cleanup_test_users()
RETURNS void AS $$
BEGIN
  -- 1. איפוס שדות הקישור בטבלת השחקנים לכל מי שאינו המנהל
  UPDATE public.players 
  SET user_id = NULL, 
      email = NULL, 
      is_approved = FALSE 
  WHERE email != 'libermanasaf@gmail.com' OR email IS NULL;

  -- 2. מחיקת המשתמשים מטבלת ה-Auth של Supabase חוץ מהמנהל
  DELETE FROM auth.users 
  WHERE email != 'libermanasaf@gmail.com';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
