import { ParameterizedString } from "../utils/parameterize";

export function isParameterizedString(wat: unknown): wat is ParameterizedString {
    return (
      typeof wat === 'object' &&
      wat !== null &&
      '__ribban_template_string__' in wat &&
      '__ribban_template_values__' in wat
    );
}
  