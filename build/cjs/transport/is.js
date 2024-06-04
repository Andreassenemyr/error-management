Object.defineProperty(exports, '__esModule', { value: true });

function isParameterizedString(wat) {
    return (
      typeof wat === 'object' &&
      wat !== null &&
      '__ribban_template_string__' in wat &&
      '__ribban_template_values__' in wat
    );
}

exports.isParameterizedString = isParameterizedString;
//# sourceMappingURL=is.js.map
