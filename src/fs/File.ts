/**
* An abstraction for a file system file. This class provides methods to read and write data to a file, as well as manage backups.
* When backupCount === 1, every time the file is saved, the current version of the file is renamed to '{baseName}-backup-1.{ext}'.
*/

import fs from "fs";
import { promisify } from "util";
import {invariant} from "../Error";

const fsWriteFile = promisify(fs.writeFile);
const fsReadFile = promisify(fs.readFile);
const fsRename = promisify(fs.rename);

interface FileOptions {
  /**
  * The path plus the base name of the file to be used for saving and loading data.
  */
  baseName: string;
  /**
  * The maximum number of backup files to keep. When the limit is reached, the oldest backup will be deleted.
  * Currently only 0 or 1 are supported, where 0 means no backups and 1 means one backup file will be kept.
  */
  maxBackups: number;
  /**
  * The file extension to use for the backup files. Defaults to 'json'.
  */
  ext?: string; 
}

export class File {
  constructor(readonly options: FileOptions) {
    invariant(options.maxBackups >= 0 && options.maxBackups <= 1, `maxBackups must be 0 or 1`);
    options.ext = options.ext || "json";
  }

  get filePath() {
    const {options} = this;
    return `${options.baseName}.${options.ext}`;
  }

  getBackupFilePath(backupNumber: number) {
    const {options} = this;
    return `${options.baseName}-backup-${backupNumber}.${options.ext}`;
  }

  async save(data: string) {
    const {options, filePath} = this;
    if(options.maxBackups === 1 && fs.existsSync(filePath)) {
      await fsRename(filePath, this.getBackupFilePath(1));
    }

    await fsWriteFile(filePath, data, "utf8");
  }

  load() {
    return fsReadFile(this.filePath, "utf8");
  }

}
