export type ParameterizedString = string & {
    __ribban_template_string__?: string;
    __ribban_template_values__?: string[];
};