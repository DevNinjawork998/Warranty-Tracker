-- Dev user for local development (used when BYPASS_AUTH=true)
INSERT INTO "User" (id, email, name, "createdAt")
VALUES ('dev-user', 'dev@local', 'Dev User', NOW())
ON CONFLICT DO NOTHING;

INSERT INTO "NotificationSettings" ("userId", "alertDaysBefore", "emailEnabled", "pushEnabled")
VALUES ('dev-user', 30, true, true)
ON CONFLICT DO NOTHING;
