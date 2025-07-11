import { defineCommand } from 'citty'
import { consola } from 'consola'
import pkg from '../../package.json' with { type: 'json' }

export default defineCommand({
  meta: {
    name: 'version',
    description: 'Print moci version information',
  },
  args: {
    short: {
      type: 'boolean',
      description: 'Print only version number',
      default: false,
      alias: 's',
    },
    help: {
      type: 'boolean',
      description: 'Print help and information about the CLI',
      default: false,
    },
  },
  async run({ args }) {
    try {
      if (args.short) {
        consola.log(pkg.version)
        return
      }
      consola.log(`moci v${pkg.version}`)
    } catch (error) {
      consola.error('Failed to run command:', error)
      process.exit(1)
    }
  },
})
