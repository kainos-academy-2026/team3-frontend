const onConfirmSubmit = (event) => {
	const target = event.target;
	if (!(target instanceof HTMLFormElement)) {
		return;
	}

	const message = target.dataset.confirmMessage;
	if (!message) {
		return;
	}

	if (!window.confirm(message)) {
		event.preventDefault();
	}
};

document.addEventListener("submit", onConfirmSubmit);
