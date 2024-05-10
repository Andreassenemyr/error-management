import { helloNpm } from "../src"

test('gets the function output', () => {
    const result = helloNpm();
    expect(result).toBe("hello NPM");
})