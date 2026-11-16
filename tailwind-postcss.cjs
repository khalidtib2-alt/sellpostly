const path = require("node:path");
const { compile } = require("@tailwindcss/node");
const { Scanner } = require("@tailwindcss/oxide");
const postcss = require("postcss");

module.exports = () => ({
  postcssPlugin: "mylinkscan-tailwind",
  async Once(root, { result }) {
    if (!root.nodes.some((node) => node.type === "atrule" &&
      node.name === "import" && /^["']tailwindcss["']$/.test(node.params))) return;

    const from = root.source.input.file;
    const base = path.dirname(from);
    const compiler = await compile(root.toString(), {
      base,
      onDependency(file) {
        result.messages.push({ type: "dependency", file, parent: from });
      },
    });
    const directory = path.resolve(__dirname, "src");
    const glob = "**/*.{ts,tsx}";
    const scanner = new Scanner({ sources: [{ base: directory, pattern: glob, negated: false }] });
    result.messages.push({ type: "dir-dependency", dir: directory, glob, parent: from });
    const css = postcss.parse(compiler.build(scanner.scan()), { from });
    root.removeAll();
    root.append(css.nodes);
  },
});
module.exports.postcss = true;
