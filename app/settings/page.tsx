import { redirect } from "next/navigation";
import { type Settings, SettingsForm } from "@/components/settings-form";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";

const DEFAULTS: Settings = {
	alert30Days: true,
	alert14Days: true,
	alert7Days: false,
	monthlySummary: true,
	systemUpdates: false,
	pushEnabled: true,
	emailEnabled: true,
	whatsappEnabled: false,
};

export default async function SettingsPage() {
	const session = await getSession();
	if (!session?.user?.id) redirect("/auth/login");

	const row = await db.notificationSettings.findUnique({
		where: { userId: session.user.id },
	});

	const initialSettings: Settings = {
		alert30Days: row?.alert30Days ?? DEFAULTS.alert30Days,
		alert14Days: row?.alert14Days ?? DEFAULTS.alert14Days,
		alert7Days: row?.alert7Days ?? DEFAULTS.alert7Days,
		monthlySummary: row?.monthlySummary ?? DEFAULTS.monthlySummary,
		systemUpdates: row?.systemUpdates ?? DEFAULTS.systemUpdates,
		pushEnabled: row?.pushEnabled ?? DEFAULTS.pushEnabled,
		emailEnabled: row?.emailEnabled ?? DEFAULTS.emailEnabled,
		whatsappEnabled: row?.whatsappEnabled ?? DEFAULTS.whatsappEnabled,
	};

	return <SettingsForm initialSettings={initialSettings} />;
}
