-- Add an explicit marker for results produced by the built-in device-verification
-- simulator, so simulated trust badges can never be mistaken for real PTA/CPID checks.
ALTER TABLE "imei_verification" ADD COLUMN "isSimulated" BOOLEAN NOT NULL DEFAULT false;
