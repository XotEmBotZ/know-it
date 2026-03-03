IDeas:

two types of user, Patient and Doctor.
All medical records of the patient are stored in the supabase database,
records are in this format

- date
- doctor name (or ID)
- syntoms
- solutions given
- medicle tests suggested

Also another table where tests for each patient is stored with this schema

- date
- test name
- results

Features: (Patient Side)

- Basic home remidies for smaller problems and suggest to go to doctor (AI chatbot using Gemini)
- Take detailed symtoms and problem data for doctors to see (before even visiting the doctor) (AI chatbot using Gemini)
- View latest prescription details and chat with AI to be sure when to take medicine, what lifestyle changes to be done, what tests or what test results mean ,etc ((AI chatbot using Gemini))

Doctor Side

- see all past medical history of the patient (need concent from the patient)
- Use AI to search through all medicle history of the patient (AI chatbot using Gemini)
- Write prescriptions to the patient and everything in the centralized database
