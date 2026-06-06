self.addEventListener("push", (event) => {
	if (!event.data) return;
	let data;
	try {
		data = event.data.json();
	} catch {
		data = { title: "Warranty Tracker", body: event.data.text() };
	}

	event.waitUntil(
		self.registration.showNotification(data.title ?? "Warranty Tracker", {
			body: data.body,
			icon: "/icons/icon-192.png",
			badge: "/icons/icon-192.png",
			data: { url: data.url ?? "/dashboard" },
		}),
	);
});

self.addEventListener("notificationclick", (event) => {
	event.notification.close();
	event.waitUntil(
		clients
			.matchAll({ type: "window", includeUncontrolled: true })
			.then((clientList) => {
				const url = event.notification.data?.url ?? "/dashboard";
				for (const client of clientList) {
					if (client.url.includes(url) && "focus" in client)
						return client.focus();
				}
				if (clients.openWindow) return clients.openWindow(url);
			}),
	);
});
