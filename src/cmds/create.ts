import fs from 'node:fs'
import { mkdir, readFile, rm } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { defineCommand } from 'citty'
import { consola } from 'consola'
import { downloadTemplate } from 'giget'
import type { DegitTypes } from '../types'

const IS_DEV = process.env.NODE_ENV === 'DEV'
const BASE_PATH = IS_DEV ? join(process.cwd(), 'generated') : undefined

export default defineCommand({
  meta: {
    name: 'create',
    description: 'Create a new Monorepo application',
  },
  args: {
    name: {
      type: 'positional',
      description: `Project name (lowercase, kebab-case)`,
      valueHint: 'my-project',
      required: false,
    },
    force: {
      type: 'boolean',
      description: 'Force overwrite existing application directory',
      default: false,
      alias: 'f',
    },
    install: {
      type: 'boolean',
      description: 'Install dependencies after creating the application',
      default: false,
      alias: 'i',
    },
    noConfirm: {
      type: 'boolean',
      description: 'Run the command without confirmation',
      default: false,
      alias: 'y',
    },
    dryRun: {
      type: 'boolean',
      description: 'Dry run the command without creating anything',
    },
    verbose: {
      type: 'boolean',
      description: 'Output more detailed debugging information',
      default: false,
      alias: 'V',
    },
    help: {
      type: 'boolean',
      description: 'Print information about the command',
      default: false,
    },
  },
  async setup() {
    try {
      if (IS_DEV) {
        // Create BASE_PATH if not exists in development environment
        await mkdir(resolve(String(BASE_PATH)), { recursive: true, mode: 0o755 }).catch((err) => {
          throw new Error(`Failed to create target directory: ${err.message}`)
        })
      }
    } catch (error: unknown) {
      consola.error(error instanceof Error ? error.message : 'Unknown error occurred')
      process.exit(1)
    }
  },
  async cleanup({ args }) {
    // Exit early if dry run
    if (args.dryRun) return

    const outputDir = IS_DEV ? join(String(BASE_PATH), args.name) : join(args.name)
    const degitJsonPath = join(outputDir, 'degit.json')
    const packageJsonPath = join(outputDir, 'package.json')

    try {
      // Check if degit.json exists and process it
      if (fs.existsSync(degitJsonPath)) {
        // Read and parse degit.json
        const degitJsonContent = await readFile(degitJsonPath, 'utf-8')
        const degitActions: DegitTypes[] = JSON.parse(degitJsonContent)

        if (args.verbose) {
          consola.info(`Found degit.json with ${degitActions.length} action(s)`)
        }

        // Process each action
        for (const action of degitActions) {
          if (action.action === 'remove') {
            consola.info(`Processing remove action for ${action.files.length} file(s)/folder(s)`)

            for (const file of action.files) {
              const filePath = join(outputDir, file)

              try {
                if (fs.existsSync(filePath)) {
                  await rm(filePath, { recursive: true, force: true })
                  if (args.verbose) {
                    consola.success(`Removed: ${file}`)
                  }
                } else if (args.verbose) {
                  consola.warn(`File/folder not found: ${file}, skipped`)
                }
              } catch (error) {
                consola.error(
                  `Failed to remove ${file}: ${error instanceof Error ? error.message : 'Unknown error'}`
                )
              }
            }
          }
        }

        // Remove degit.json itself after processing
        await rm(degitJsonPath, { force: true })
        if (args.verbose) {
          consola.success('Removed degit.json after processing')
        }

        consola.success('Cleanup actions completed successfully')
      } else if (args.verbose) {
        consola.info('No degit.json found, skipping cleanup actions')
      }

      if (fs.existsSync(packageJsonPath)) {
        consola.info(`Updating application name in package.json`)

        try {
          const pkgRaw = await readFile(packageJsonPath, 'utf-8')
          const pkg = JSON.parse(pkgRaw)
          pkg.name = args.name
          fs.writeFileSync(packageJsonPath, JSON.stringify(pkg, null, 2))

          if (args.verbose) {
            consola.success(`Updated package.json name to: ${args.name}`)
          }
        } catch (error) {
          throw new Error(
            `Failed to update package.json: ${error instanceof Error ? error.message : 'Unknown error'}`
          )
        }
      } else if (args.verbose) {
        consola.warn('No package.json found, skipping name update')
      }
    } catch (error) {
      consola.error(
        `Failed to process cleanup: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
      throw error
    }
  },
  async run(context) {
    const { args } = context
    let { name, force, noConfirm, dryRun, install, verbose } = args

    // Prompt for project name if not provided
    if (!name) {
      name = await consola.prompt(
        'What would you like to name your project? (use kebab-case, e.g. my-project)',
        {
          type: 'text',
          validate: (input: string) => {
            const kebabCaseRegex = /^[a-z0-9]+(-[a-z0-9]+)*$/
            if (!kebabCaseRegex.test(input)) {
              return 'Project name must be kebab-case (lowercase, numbers, and hyphens only, e.g. "my-project")'
            }
            return true
          },
        }
      )
      args.name = name // update args for downstream usage
    }

    // Validate the project name format, must be kebab-case
    const kebabCaseRegex = /^[a-z0-9]+(-[a-z0-9]+)*$/
    if (!kebabCaseRegex.test(name)) {
      consola.error(
        `Project name "${name}" is invalid. Please use kebab-case (lowercase, numbers, and hyphens only, e.g. "my-project").`
      )
      process.exit(1)
    }

    try {
      // Early exit for dry run
      if (dryRun) {
        consola.info('Dry run mode - no changes will be made')
        consola.info(`Would create new monorepo project: ${name}`)
        if (install) {
          consola.info('Would install dependencies after project creation')
        }
        return
      }

      const outputDir = join(String(BASE_PATH), name)
      const directoryExists = fs.existsSync(outputDir)

      // Handle existing directory
      if (directoryExists && !force) {
        consola.error(`Directory '${outputDir}' already exists!`)
        consola.info('Use --force flag to overwrite existing directory')
        process.exit(1)
      }

      // Single confirmation for project creation (handles both force and regular creation)
      if (!noConfirm) {
        let confirmationMessage: string
        let warningShown = false

        if (directoryExists && force) {
          consola.warn(`⚠️  Directory '${outputDir}' already exists and will be overwritten!`)
          confirmationMessage = `Create new monorepo project "${name}" and overwrite existing directory?`
          warningShown = true
        } else if (force && !warningShown) {
          consola.warn('⚠️  Force mode is enabled')
          confirmationMessage = `Create new monorepo project "${name}"?`
        } else {
          confirmationMessage = `Create new monorepo project "${name}"?`
        }

        const confirmed = await consola.prompt(confirmationMessage, {
          type: 'confirm',
        })

        if (!confirmed) {
          consola.info('Monorepo project creation cancelled')
          process.exit(0)
        }
      }

      // Handle force cleanup after confirmation
      if (force && directoryExists) {
        consola.info(`Cleaning up existing directory '${outputDir}'`)
        await rm(outputDir, { recursive: true, force: true })

        if (verbose) {
          consola.success(`Successfully removed existing directory '${outputDir}'`)
        }
      }

      // Download the template first
      const templateUrl = `github:zero-one-group/monorepo`
      const { source, dir } = await downloadTemplate(templateUrl, {
        dir: name,
        cwd: BASE_PATH,
        forceClean: force,
        silent: noConfirm,
        install: false,
        force,
      })

      if (verbose) {
        consola.success(`Project '${name}' has been created at ${dir}`)
      } else {
        consola.success(`Project '${name}' has been created from ${source}`)
      }

      // Cleanup after template download and before install dependencies
      await (this.cleanup?.(context) ?? Promise.resolve())

      // Replace "myorg" placeholder with the actual project name in all files
      const replaceInFiles = async (dir: string, search: string, replace: string) => {
        const entries = fs.readdirSync(dir, { withFileTypes: true })
        for (const entry of entries) {
          const fullPath = join(dir, entry.name)
          if (entry.isDirectory()) {
            await replaceInFiles(fullPath, search, replace)
          } else if (entry.isFile()) {
            // Only process text files (skip binaries)
            const buffer = fs.readFileSync(fullPath)
            // Simple check: skip if file contains null bytes (likely binary)
            if (buffer.includes(0)) continue
            const content = buffer.toString('utf8')
            if (content.includes(search)) {
              const replaced = content.split(search).join(replace)
              fs.writeFileSync(fullPath, replaced, 'utf8')
              if (args.verbose) {
                consola.success(`Replaced "${search}" with "${replace}" in ${fullPath}`)
              }
            }
          }
        }
      }

      await replaceInFiles(dir, 'myorg', args.name)

      // Run pnpm install if --install is set or user confirms
      let shouldInstall = install
      if (!install && !noConfirm) {
        shouldInstall = await consola.prompt(
          'Do you want to install dependencies after creating the project?',
          {
            type: 'confirm',
            initial: false,
          }
        )
      }

      if (shouldInstall) {
        consola.info('Installing dependencies...')
        const { execa } = await import('execa')
        await execa('pnpm', ['install'], { cwd: dir, stdio: 'inherit' })
        consola.success('Dependencies have been installed')
      } else {
        consola.log('\nNext steps:')
        consola.log(`  cd ${name}`)
        consola.log('  pnpm install\n')
      }
    } catch (error) {
      if (!noConfirm) {
        consola.error(error instanceof Error ? error.message : 'Unknown error occurred')
      }
      process.exit(1)
    }
  },
})
