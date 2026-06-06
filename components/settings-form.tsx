"use client";

import {
	CalendarClock,
	LogOut,
	Mail,
	MessageSquare,
	RefreshCw,
	Smartphone,
	Wifi,
} from "lucide-react";
import { signOut } from "next-auth/react";
import { useState } from "react";
import { BottomNav } from "@/components/bottom-nav";
import { NotificationBell } from "@/components/notification-bell";
import { Switch } from "@/components/ui/switch";

export interface Settings {
	alert30Days: boolean;
	alert14Days: boolean;
	alert7Days: boolean;
	monthlySummary: boolean;
	systemUpdates: boolean;
	pushEnabled: boolean;
	emailEnabled: boolean;
	whatsappEnabled: boolean;
}

function SectionHeader({
	icon: Icon,
	title,
}: {
	icon: React.ElementType;
	title: string;
}) {
	return (
		<div className="flex items-center gap-3 px-5 py-4 border-b">
			<div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
				<Icon className="w-4 h-4 text-primary" />
			</div>
			<h2 className="font-bold text-lg">{title}</h2>
		</div>
	);
}

function ToggleRow({
	title,
	description,
	checked,
	onChange,
}: {
	title: string;
	description: string;
	checked: boolean;
	onChange: (v: boolean) => void;
}) {
	return (
		<div className="flex items-center justify-between px-5 py-4 gap-4">
			<div className="min-w-0">
				<p className="font-semibold text-sm">{title}</p>
				<p className="text-xs text-muted-foreground mt-0.5 leading-snug">
					{description}
				</p>
			</div>
			<Switch
				checked={checked}
				onCheckedChange={onChange}
				className="shrink-0"
			/>
		</div>
	);
}

function DeliveryCard({
	icon: Icon,
	title,
	description,
	checked,
	onChange,
}: {
	icon: React.ElementType;
	title: string;
	description: string;
	checked: boolean;
	onChange: (v: boolean) => void;
}) {
	return (
		<button
			type="button"
			onClick={() => onChange(!checked)}
			className={`w-full text-left rounded-xl border p-4 flex items-start gap-3 transition-colors ${
				checked
					? "bg-primary/5 border-primary/30"
					: "bg-background border-border"
			}`}
		>
			<div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center shrink-0 mt-0.5">
				<Icon className="w-4 h-4 text-foreground" />
			</div>
			<div className="flex-1 min-w-0">
				<p className="font-semibold text-sm">{title}</p>
				<p className="text-xs text-muted-foreground mt-0.5">{description}</p>
			</div>
			<div
				className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 mt-0.5 ${
					checked ? "bg-primary border-primary" : "border-muted-foreground/40"
				}`}
			>
				{checked && (
					<svg
						aria-hidden="true"
						className="w-3 h-3 text-white"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
						strokeWidth={3}
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							d="M5 13l4 4L19 7"
						/>
					</svg>
				)}
			</div>
		</button>
	);
}

export function SettingsForm({
	initialSettings,
}: {
	initialSettings: Settings;
}) {
	const [settings, setSettings] = useState<Settings>(initialSettings);
	const [saving, setSaving] = useState(false);
	const [saved, setSaved] = useState(false);

	function update<K extends keyof Settings>(key: K, value: Settings[K]) {
		setSettings((prev) => ({ ...prev, [key]: value }));
	}

	async function handleSave() {
		setSaving(true);
		await fetch("/api/settings", {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(settings),
		});
		setSaving(false);
		setSaved(true);
		setTimeout(() => setSaved(false), 2000);
	}

	return (
		<div className="min-h-screen bg-background pb-28">
			<header className="sticky top-0 z-10 bg-card border-b px-4 py-3 flex items-center gap-3">
				<div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
					<Wifi className="w-4 h-4" />
				</div>
				<h1 className="font-semibold text-lg flex-1">WarrantyGuard</h1>
				<NotificationBell />
			</header>

			<main className="max-w-lg mx-auto px-4 py-6 space-y-6">
				<div className="space-y-1">
					<h2 className="text-2xl font-bold">Notification Settings</h2>
					<p className="text-sm text-muted-foreground">
						Manage how and when WarrantyGuard communicates with you regarding
						your covered items.
					</p>
				</div>

				<div className="bg-card rounded-2xl border overflow-hidden">
					<SectionHeader icon={CalendarClock} title="Expiry Alerts" />
					<p className="px-5 pt-4 pb-2 text-sm text-muted-foreground">
						Choose when you want to be reminded about warranties approaching
						their expiration date.
					</p>
					<div className="divide-y">
						<ToggleRow
							title="30 Days Before"
							description="Early warning to evaluate item condition."
							checked={settings.alert30Days}
							onChange={(v) => update("alert30Days", v)}
						/>
						<ToggleRow
							title="14 Days Before"
							description="Standard reminder to initiate claims if needed."
							checked={settings.alert14Days}
							onChange={(v) => update("alert14Days", v)}
						/>
						<ToggleRow
							title="7 Days Before"
							description="Final warning before warranty expires."
							checked={settings.alert7Days}
							onChange={(v) => update("alert7Days", v)}
						/>
					</div>
				</div>

				<div className="bg-card rounded-2xl border overflow-hidden">
					<SectionHeader icon={RefreshCw} title="General Updates" />
					<div className="divide-y">
						<ToggleRow
							title="Monthly Warranty Summary"
							description="A digest of your active coverage and upcoming renewals."
							checked={settings.monthlySummary}
							onChange={(v) => update("monthlySummary", v)}
						/>
						<ToggleRow
							title="System & Processing Updates"
							description="Important alerts regarding document processing or platform maintenance."
							checked={settings.systemUpdates}
							onChange={(v) => update("systemUpdates", v)}
						/>
					</div>
				</div>

				<div className="bg-card rounded-2xl border overflow-hidden">
					<SectionHeader icon={Wifi} title="Preferred Delivery Method" />
					<div className="px-5 pt-4 pb-3">
						<p className="text-sm text-muted-foreground">
							Select how you want to receive these notifications. You must keep
							at least one method active.
						</p>
					</div>
					<div className="px-5 pb-5 space-y-3">
						<DeliveryCard
							icon={Smartphone}
							title="Push Notifications"
							description="Directly to your mobile device"
							checked={settings.pushEnabled}
							onChange={(v) => update("pushEnabled", v)}
						/>
						<DeliveryCard
							icon={Mail}
							title="Email Digest"
							description="Sent to your registered email"
							checked={settings.emailEnabled}
							onChange={(v) => update("emailEnabled", v)}
						/>
						<DeliveryCard
							icon={MessageSquare}
							title="WhatsApp"
							description="Requires linked phone number"
							checked={settings.whatsappEnabled}
							onChange={(v) => update("whatsappEnabled", v)}
						/>
					</div>
				</div>

				<button
					type="button"
					onClick={handleSave}
					disabled={saving}
					className="w-full bg-primary text-primary-foreground rounded-2xl py-4 font-semibold text-sm disabled:opacity-50 transition-opacity"
				>
					{saved
						? "Preferences Saved!"
						: saving
							? "Saving…"
							: "Save Preferences"}
				</button>

				<button
					type="button"
					onClick={() => signOut({ callbackUrl: "/auth/login" })}
					className="w-full flex items-center justify-center gap-2 border border-border rounded-2xl py-4 text-sm font-medium text-muted-foreground hover:bg-muted transition-colors"
				>
					<LogOut className="w-4 h-4" />
					Sign Out
				</button>
			</main>

			<BottomNav />
		</div>
	);
}
