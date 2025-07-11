import { defineCommand, showUsage } from 'citty'
import pkg from '../package.json' with { type: 'json' }

export default defineCommand({
  meta: {
    name: 'moci',
    version: pkg.version,
    description: "ZOG's Monorepo Command-line Interface",
  },
  args: {
    help: {
      type: 'boolean',
      description: 'Print information about the CLI',
      default: false,
    },
  },
  subCommands: {
    create: () => import('./cmds/create').then((r) => r.default),
    version: () => import('./cmds/version').then((r) => r.default),
  },
  async run({ args, cmd }) {
    // Show help page if --help flag is used or no subcommand provided
    if (args.help || args._.length === 0) {
      showUsage(cmd)
      return
    }
  },
})
