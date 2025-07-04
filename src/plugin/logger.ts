/**
 * Simple file-based logger for plugin debugging
 */

import fs from 'fs/promises';
import path from 'path';

class PluginLogger {
  private logFile: string;

  constructor() {
    // Create log file in the plugin directory
    this.logFile = path.join(process.cwd(), 'src', 'plugin', 'plugin-lifecycle.log');
  }

  private async writeLog(level: string, message: string, data?: any): Promise<void> {
    try {
      const timestamp = new Date().toISOString();
      const logEntry = `[${timestamp}] ${level}: ${message}${data ? ' | Data: ' + JSON.stringify(data, null, 2) : ''}\n`;
      
      // Append to log file
      await fs.appendFile(this.logFile, logEntry, 'utf8');
    } catch (error) {
      // Fallback to console if file writing fails
      console.error('Plugin logger failed:', error);
      console.log(`[${level}] ${message}`, data);
    }
  }

  async info(message: string, data?: any): Promise<void> {
    await this.writeLog('INFO', message, data);
  }

  async error(message: string, data?: any): Promise<void> {
    await this.writeLog('ERROR', message, data);
  }

  async warn(message: string, data?: any): Promise<void> {
    await this.writeLog('WARN', message, data);
  }

  async debug(message: string, data?: any): Promise<void> {
    await this.writeLog('DEBUG', message, data);
  }

  async lifecycle(phase: string, pluginId: string, details?: any): Promise<void> {
    await this.writeLog('LIFECYCLE', `${phase} - ${pluginId}`, details);
  }

  async clearLog(): Promise<void> {
    try {
      await fs.writeFile(this.logFile, '', 'utf8');
    } catch (error) {
      console.error('Failed to clear plugin log:', error);
    }
  }
}

// Export singleton instance
export const pluginLogger = new PluginLogger(); 