import { mkdir, copyFile, access } from 'fs/promises';
import { constants } from 'fs';
import path from 'path';
import inquirer from 'inquirer';

export const envFileBackup = async (): Promise<void> => {
    try {
        const { shouldBackup } = await inquirer.prompt([
            {
                type: 'confirm',
                name: 'shouldBackup',
                message:
                    'Would you like to back up the current .env file before setup modifies it?',
                default: true,
            },
        ]);

        if (shouldBackup) {
            // .backup directory
            const backupDir = path.join(process.cwd(), '.backup');
            await mkdir(backupDir, { recursive: true });
            console.info(`Backup directory ensured at: ${backupDir}`);

            // epoch timestamp
            const epochTimestamp = Math.floor(Date.now() / 1000);
            const backupFileName = `.env.${epochTimestamp}`;
            const backupFilePath = path.join(backupDir, backupFileName);

            // .env to backup location
            const envPath = path.join(process.cwd(), '.env');
            try {
                await access(envPath, constants.F_OK);
                await copyFile(envPath, backupFilePath);
                console.info(`Backup created: ${backupFileName}`);
                console.info(`Backup location: ${backupFilePath}`);
            } catch (error) {
                const err = error as NodeJS.ErrnoException;
                if (err.code === 'ENOENT') {
                    console.warn('No .env file found; skipping backup.');
                } else {
                    throw error;
                }
            }
        }
    } catch (error) {
        console.error('An error occurred while backing up the .env file:', error);
        throw new Error(`Failed to create .env backup: ${(error as Error).message}`);
    }
};