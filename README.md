# ZOG's Monorepo Command-line Interface

Zero One Group's (ZOG) Unified Monorepo Command-Line Interface (CLI) serves
as your all-in-one toolkit for streamlined, scalable development. Designed
from the ground up with monorepo best practices in mind, this CLI puts complete
control of your codebase at your fingertips.

Whether you're managing dozens of interdependent packages, automating project
scaffolding, or orchestrating complex migration scripts, ZOG's interface makes
every task intuitive and repeatable.

## 🏁 Quickstart

##### Using `npx`

```sh
npx moci@latest
```

##### Using `pnpm dlx`

```sh
pnpm dlx moci@latest
```

## 🧑🏻‍💻 Development

This project uses TypeScript for type checking, [Biome][biome] for code formatting
and linting which is configured in [`biome.json`](./biome.json). It's recommended
to get TypeScript set up for your editor and install an editor plugin (like the
[VSCode Biome plugin][vscode-biome]) to get auto-formatting on saving and get a
really great in-editor experience with type checking and auto-complete.

## 👷‍♂️ Contributions

Contributions are welcome! Please open a pull requests for your changes and tickets
in case you would like to discuss something or have a question.

## 💬 Feedback

Please provide feedback! 🤗 Ideally by [filing an issue here](https://github.com/zero-one-group/moci/issues) – or via a pull request.

## 📝 License

This project is open-sourced software licensed under the [MIT license][license-mit].

Copyrights in this project are retained by their contributors.
See the [license file](./LICENSE) for more information.

---

[![Contribution](https://badgen.net/badge/icon/Contributions%20Welcome?icon=bitcoin-lightning&label&color=black&labelColor=black)][contribution]

<!-- link reference definition -->
[biome]: https://biomejs.dev
[contribution]: https://github.com/zero-one-group/moci/pulse
[license-mit]: https://choosealicense.com/licenses/mit/
[vscode-biome]: https://marketplace.visualstudio.com/items?itemName=biomejs.biome
