export function extractUserIdFromJwt(token: string): number | null {
	try {
		const payload = JSON.parse(
			Buffer.from(token.split(".")[1], "base64url").toString("utf8"),
		) as Record<string, unknown>;

		const rawUserId = payload.id ?? payload.userId ?? payload.sub;
		const userId =
			typeof rawUserId === "number" ? rawUserId : Number(rawUserId);

		if (!Number.isInteger(userId) || userId <= 0) {
			return null;
		}

		return userId;
	} catch {
		return null;
	}
}
