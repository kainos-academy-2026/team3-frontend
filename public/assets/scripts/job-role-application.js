(() => {
	const form = document.getElementById("application-form");
	const fileInput = document.getElementById("cv");
	const submitButton = document.getElementById("submit-application");
	const errorElement = document.getElementById("upload-error");
	const objectKeyInput = document.getElementById("objectKey");
	const originalFileNameInput = document.getElementById("originalFileName");
	const contentTypeInput = document.getElementById("contentType");
	const fileSizeBytesInput = document.getElementById("fileSizeBytes");

	if (
		!(form instanceof HTMLFormElement) ||
		!(fileInput instanceof HTMLInputElement) ||
		!(submitButton instanceof HTMLButtonElement) ||
		!(errorElement instanceof HTMLElement) ||
		!(objectKeyInput instanceof HTMLInputElement) ||
		!(originalFileNameInput instanceof HTMLInputElement) ||
		!(contentTypeInput instanceof HTMLInputElement) ||
		!(fileSizeBytesInput instanceof HTMLInputElement)
	) {
		return;
	}

	const showError = (message) => {
		errorElement.textContent = message;
		errorElement.classList.remove("form-error--hidden");
	};

	const clearError = () => {
		errorElement.textContent = "";
		errorElement.classList.add("form-error--hidden");
	};

	const uploadCvUrl = `${form.action.replace(/\/$/, "")}/upload-cv`;

	form.addEventListener("submit", async (event) => {
		event.preventDefault();
		clearError();

		const file =
			fileInput.files?.[0] ??
			new File([], "", { type: "application/octet-stream" });

		submitButton.disabled = true;
		submitButton.textContent = "Uploading CV...";

		try {
			const contentType = file.type || "application/octet-stream";
			const uploadUrlResponse = await fetch(uploadCvUrl, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					fileName: file.name,
					contentType,
					fileSizeBytes: file.size,
				}),
			});

			if (!uploadUrlResponse.ok) {
				const errorPayload = await uploadUrlResponse.json().catch(() => null);
				throw new Error(
					errorPayload?.error
						? errorPayload.error
						: "Failed to prepare CV upload.",
				);
			}

			const uploadDetails = await uploadUrlResponse.json();
			const uploadHeaders = Object.assign(
				{ "Content-Type": contentType },
				uploadDetails.requiredHeaders || {},
			);

			const s3UploadResponse = await fetch(uploadDetails.uploadUrl, {
				method: "PUT",
				headers: uploadHeaders,
				body: file,
			});

			if (!s3UploadResponse.ok) {
				throw new Error("Failed to upload CV to storage.");
			}

			objectKeyInput.value = uploadDetails.objectKey;
			originalFileNameInput.value = file.name;
			contentTypeInput.value = contentType;
			fileSizeBytesInput.value = String(file.size);

			form.submit();
		} catch (error) {
			const errorMessage =
				error instanceof Error
					? error.message
					: "We could not submit your application right now. Please try again.";
			showError(errorMessage);
			submitButton.disabled = false;
			submitButton.textContent = "Submit application";
		}
	});
})();
