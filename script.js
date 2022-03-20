document.querySelectorAll("#current_info > input").forEach((elem) => {
	elem.addEventListener("keydown", (e) => {
		e.preventDefault();
		if (
			match(e, "ArrowRight", 39) ||
			match(e, "ArrowDown", 40) ||
			(match(e, "Tab", 9) && !e.shiftKey)
		) {
			elem.nextElementSibling?.focus();
		} else if (
			match(e, "ArrowLeft", 37) ||
			match(e, "ArrowUp", 38) ||
			(match(e, "Tab", 9) && e.shiftKey)
		) {
			elem.previousElementSibling?.focus();
		} else if (match(e, "Backspace", 8)) {
			elem.previousElementSibling?.focus();
			if (elem.value != "") elem.value = "";
			FindGuess();
		} else if (e.key.toLowerCase().match(/^[a-z0-9\-]$/)) {
			if (elem.value == "") elem.value = e.key.toLowerCase();
			else if (elem.nextElementSibling) elem.nextElementSibling.value = e.key.toLowerCase();
			elem.nextElementSibling?.focus();
			FindGuess();
		} else {
			console.log(e, e.keyCode);
		}
	});
});

function match(event, code, keycode) {
	return (
		event.code == code || event.key == code || event.keyCode == keycode || event.which == keycode
	);
}

let wordlist = [];
fetch("words/dictonary.txt")
	.then((res) => res.text())
	.then((text) => text.replaceAll("\r", "").split("\n"))
	.then((words) => (wordlist = wordlist.concat(words)));

const FindGuess = () => {
	let value = RegExp(
		`^${[...document.querySelectorAll("#current_info > input")]
			.map((inp) => (inp.value ? inp.value : "."))
			.join("")}$`
	);
	document.getElementById("matched_words").innerHTML = "";
	// Filter the list of words
	matchedWords = wordlist.filter((word) => value.test(word.toLowerCase()));
	// Add sample words
	matchedWords
		.slice(0, 100)
		.map((word) => {
			// Convert String to Span
			let span = document.createElement("span");
			span.textContent = word;
			return span;
		})
		.forEach((word) => document.getElementById("matched_words").appendChild(word));
	// Get how many times does a char appears in the list of words
	let charCount = {};
	matchedWords.forEach((word) => {
		[...new Set(word.split(""))].forEach((char) => {
			if (charCount[char.toLowerCase()]) charCount[char.toLowerCase()]++;
			else charCount[char.toLowerCase()] = 1;
		});
	});
	document.querySelectorAll("#char_stats > div").forEach((elem) => elem.remove());
	let totalChar = Object.values(charCount).reduce((accumulator, count) => accumulator + count, 0);
	let blacklistedChar = [...document.querySelectorAll("#current_info > input")]
		.map((inp) => inp.value)
		.filter((a) => a);
	console.log(blacklistedChar);
	Object.entries(charCount)
		.sort((a, b) => b[1] - a[1])
		.filter((a) => !blacklistedChar.includes(a[0]))
		.slice(0, 10)
		.forEach(([char, count]) => {
			let percent = Math.round((count / totalChar) * 100);
			let elem = document.importNode(
				document.querySelector("template[letter-stats]").content.querySelector("div"),
				true
			);

			elem.querySelector("[letter-name]").textContent = char.toUpperCase();
			elem.querySelector("[letter-percentage]").textContent = percent + "%";
			elem.querySelector("[progressbar-thumb]").style.width = percent + "%";
			document.getElementById("char_stats").appendChild(elem);
		});
};

document.getElementById("purge_dup").addEventListener("click", () => {
	wordlist = [...new Set(wordlist)];
	FindGuess();
});
