-- AlterTable
ALTER TABLE "NotificationSettings" ADD COLUMN     "alert14Days" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "alert30Days" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "alert7Days" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "monthlySummary" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "systemUpdates" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "whatsappEnabled" BOOLEAN NOT NULL DEFAULT false;
