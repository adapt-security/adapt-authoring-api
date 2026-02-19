import App from './App.js'
import minimist from 'minimist'
import { spawn } from 'child_process'
/**
 * Miscellaneous utility functions for use throughout the application
 * @memberof core
 */
class Utils {
  /**
   * The name of the file used for defining Adapt authoring tool metadata
   * @return {String}
   */
  static get metadataFileName () {
    return 'adapt-authoring.json'
  }

  /**
   * The name of the Node.js package file
   * @return {String}
   */
  static get packageFileName () {
    return 'package.json'
  }

  /**
   * Returns the passed arguments, parsed by minimist for easy access
   * @return {Object} The parsed arguments
   * @see {@link https://github.com/substack/minimist#readme}
   */
  static getArgs () {
    const args = minimist(process.argv)
    args.params = args._.slice(2)
    return args
  }

  /**
   * Determines if param is a Javascript object (note: returns false for arrays, functions and null)
   * @return {Boolean}
   */
  static isObject (o) {
    return typeof o === 'object' && o !== null && !Array.isArray(o)
  }

  /**
   * Reusable Promise-based spawn wrapper, which handles output/error handling
   * @param {Object} options
   * @param {String} options.cmd Command to run
   * @param {String} options.cwd Current working directory
   * @param {Array<String>} options.args
   * @returns Promise
   */
  static async spawn (options) {
    return new Promise((resolve, reject) => {
      if (!options.cwd) options.cwd = ''
      App.instance.log('verbose', 'SPAWN', options)
      const task = spawn(options.cmd, options.args ?? [], { cwd: options.cwd })
      let stdout = ''
      let stderr = ''
      let error
      task.stdout.on('data', data => {
        stdout += data
      })
      task.stderr.on('data', data => {
        stderr += data
      })
      task.on('error', e => {
        error = e
      })
      task.on('close', exitCode => {
        exitCode !== 0 ? reject(App.instance.errors.SPAWN.setData({ error: error ?? stderr ?? stdout })) : resolve(stdout)
      })
    })
  }
}

export default Utils
