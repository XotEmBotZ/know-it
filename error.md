# Troubleshooting & Errors

## Error: 42501 - Insufficient Privilege (Supabase/PostgreSQL)

### Symptoms
- **Context**: Occurs on the "Doctor Dashboard" when trying to "Save Record" or "Save Test Result".
- **Message**: `{ "code": "42501", "message": "new row violates row-level security policy for table "test_results"" }` (or `"medical_records"`)
- **Action**: The data is not saved to the database, and the UI may show a "Server Error" or "400 Bad Request".

### Root Cause
This error is triggered by **Supabase Row Level Security (RLS)**. Even if your application code is correct, the database blocks the `INSERT` because there is no policy that explicitly grants permission for a **Doctor** to add data to a **Patient's** record.

In our system, a doctor should ONLY be able to add records if the patient has granted them **"active"** consent.

### The Fix (Database Level)
Run the following SQL commands in your **Supabase Dashboard -> SQL Editor** to grant the necessary permissions:

```sql
-- 1. Allow Doctors to INSERT test results for patients who granted them consent
CREATE POLICY "Doctors can insert test results for their patients"
ON public.test_results
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM medical_consents
    WHERE medical_consents.doctor_id = auth.uid()
    AND medical_consents.patient_id = test_results.patient_id
    AND medical_consents.status = 'active'
  )
);

-- 2. Allow Doctors to VIEW the test results for those patients
CREATE POLICY "Doctors can view test results for their patients"
ON public.test_results
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM medical_consents
    WHERE medical_consents.doctor_id = auth.uid()
    AND medical_consents.patient_id = test_results.patient_id
    AND medical_consents.status = 'active'
  )
);

-- 3. Allow Doctors to INSERT medical records for their patients
CREATE POLICY "Doctors can insert medical records for their patients"
ON public.medical_records
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = doctor_id AND
  EXISTS (
    SELECT 1 FROM medical_consents
    WHERE medical_consents.doctor_id = auth.uid()
    AND medical_consents.patient_id = medical_records.patient_id
    AND medical_consents.status = 'active'
  )
);

-- 4. Allow Doctors to VIEW medical records for those patients
CREATE POLICY "Doctors can view medical records for their patients"
ON public.medical_records
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM medical_consents
    WHERE medical_consents.doctor_id = auth.uid()
    AND medical_consents.patient_id = medical_records.patient_id
    AND medical_consents.status = 'active'
  )
);
```

### Verification
Once the SQL is run:
1. Ensure the patient has an **"active"** consent status with the doctor.
2. The "Save Record" and "Save Test Result" buttons should work immediately.
