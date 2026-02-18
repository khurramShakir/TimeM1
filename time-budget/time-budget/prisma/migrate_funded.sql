-- Data migration: Set funded = budgeted for existing records
UPDATE Envelope SET funded = budgeted;
