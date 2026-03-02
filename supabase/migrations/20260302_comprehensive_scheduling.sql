-- Migration: Transient Queue-based Appointment System
-- Date: 2026-03-02

-- Create the single, highly-indexed table for daily appointments
CREATE TABLE IF NOT EXISTS public.appointment_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  patient_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  appointment_date DATE NOT NULL,
  queue_number INTEGER NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'skipped')),
  created_at TIMESTAMPTZ DEFAULT now(),

  -- Prevent double booking for the same day
  UNIQUE(doctor_id, patient_id, appointment_date),

  -- Lock: Only allow bookings for future dates (1 day prior)
  CONSTRAINT check_future_date CHECK (appointment_date > CURRENT_DATE)
);

-- Index for the Doctor's Next-Patient query
CREATE INDEX IF NOT EXISTS idx_queue_ordering
ON public.appointment_queue(doctor_id, appointment_date, status, queue_number);

-- RLS Policies
ALTER TABLE public.appointment_queue ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Patients can view their own appointments" ON public.appointment_queue;
CREATE POLICY "Patients can view their own appointments" 
  ON public.appointment_queue FOR SELECT 
  USING (auth.uid() = patient_id);

DROP POLICY IF EXISTS "Doctors can view their own queue" ON public.appointment_queue;
CREATE POLICY "Doctors can view their own queue" 
  ON public.appointment_queue FOR SELECT 
  USING (auth.uid() = doctor_id);

DROP POLICY IF EXISTS "Patients can book appointments" ON public.appointment_queue;
CREATE POLICY "Patients can book appointments" 
  ON public.appointment_queue FOR INSERT 
  WITH CHECK (auth.uid() = patient_id);

DROP POLICY IF EXISTS "Doctors can manage their queue" ON public.appointment_queue;
CREATE POLICY "Doctors can manage their queue" 
  ON public.appointment_queue FOR ALL 
  USING (auth.uid() = doctor_id);

-- RPC for Queue Assignment
CREATE OR REPLACE FUNCTION public.get_next_queue_number(p_doctor_id uuid, p_date date)
RETURNS integer AS $$
DECLARE
  next_val integer;
BEGIN
  SELECT COALESCE(MAX(queue_number), 0) + 1
  INTO next_val
  FROM public.appointment_queue
  WHERE doctor_id = p_doctor_id AND appointment_date = p_date;
  RETURN next_val;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
