"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function PushPermissionPrompt() {
	const [show, setShow] = useState(false);

	useEffect(() => {
		if (!("Notification" in window) || !("serviceWorker" in navigator)) return;
		if (Notification.permission === "default") setShow(true);
	}, []);

	async function requestPermission() {
		const permission = await Notification.requestPermission();
		if (permission !== "granted") {
			setShow(false);
			return;
		}

		try {
			const reg = await navigator.serviceWorker.ready;
			const sub = await reg.pushManager.subscribe({
				userVisibleOnly: true,
				applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
			});
			await fetch("/api/push/subscribe", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(sub),
			});
		} catch {
			// Push subscription failed (invalid VAPID key, OS-level block, etc.) — non-fatal
		} finally {
			setShow(false);
		}
	}

	if (!show) return null;

	return (
		<Card className="border-primary/30 bg-primary/5">
			<CardContent className="py-4 flex items-center justify-between gap-3">
				<p className="text-sm">Get notified before warranties expire</p>
				<div className="flex gap-2 shrink-0">
					<Button size="sm" variant="ghost" onClick={() => setShow(false)}>
						Later
					</Button>
					<Button size="sm" onClick={requestPermission}>
						Enable
					</Button>
				</div>
			</CardContent>
		</Card>
	);
}
