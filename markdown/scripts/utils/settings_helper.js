// Helper functions for saving and loading user settings with localstorage.
;(function() {
	const prefix = "markant";
	
	// Default values for various user settings.
	const defaultValues = {
		"editorFontFamily": "monospace",
		"editorFontSize": 13,
		"editorIndentSize": 4,
		"editorUseTabs": true,
		"editorTheme": "light",
		"editorShowLineNumbers": false,
		"editorUseBigHeaders": false,
		"editorBigHeaders": false,
		"viewerFontFamily": "sans-serif",
		"viewerFontSize": 16,
		"viewerHljsTheme": "default",
		"viewerMathRenderer": "katex",
		"viewerTheme": "light",
		"hljsTabSize": 4,
		"documentContent": "",
		"documentTitle": "Untitled Document"
	};

	// Used for converting settings values to actual font-familys.
	const fontFamilyMap = {
		"monospace": "monospace",
		"sans-serif": "sans-serif",
		"serif": "serif",
	};

	// Get the setting with the specified key. If the setting is null, use the default value.
	function getSetting(key) {
		let setting;
		try {
			setting = JSON.parse(localStorage.getItem(prefix+key));
		} catch (exception) {
			// Ignored
		}
		if (!setting || setting == "") {
			setting = getDefaultValue(key);
			setSetting(key, setting);
		}
		return setting;
	}

	// Set the setting with the specified key to the specified value.
	function setSetting(key, value) {
		if (!value) {
			value = getDefaultValue(key);
		}
		try {
			localStorage.setItem(prefix+key, JSON.stringify(value));
		} catch (exception) {
			console.error(`Error saving setting.\nKey: ${key}\nValue: ${value}\n`);
		}
	}

	// Get the default value of the setting with the specified key.
	function getDefaultValue(key) {
		if (key in defaultValues) {
			return defaultValues[key];
		}
	}

	// Reset all the settings to their default values.
	function reset() {
		for (let key in defaultValues) {
			setSetting(key, getDefaultValue(key));
		}
	}

	module.exports = {
		getSetting,
		setSetting,
		fontFamilyMap,
		getDefaultValue,
		reset
	};
}());
