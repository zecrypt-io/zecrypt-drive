import type { HTMLAttributes } from "react";

export {};

declare global {
  interface FileSystemEntry {
    readonly isFile: boolean;
    readonly isDirectory: boolean;
    readonly name: string;
    readonly fullPath: string;
    filesystem?: FileSystem;
    getParent(
      successCallback?: (entry: FileSystemEntry) => void,
      errorCallback?: (error: DOMException) => void,
    ): void;
  }

  interface FileSystemFileEntry extends FileSystemEntry {
    file(
      successCallback: (file: File) => void,
      errorCallback?: (error: DOMException) => void,
    ): void;
  }

  interface FileSystemDirectoryReader {
    readEntries(
      successCallback: (entries: FileSystemEntry[]) => void,
      errorCallback?: (error: DOMException) => void,
    ): void;
  }

  interface FileSystemDirectoryEntry extends FileSystemEntry {
    createReader(): FileSystemDirectoryReader;
  }

  interface DataTransferItem {
    webkitGetAsEntry(): FileSystemEntry | null;
  }
}

declare module "react" {
  interface InputHTMLAttributes<T> extends HTMLAttributes<T> {
    webkitdirectory?: string;
    directory?: string;
  }
}


