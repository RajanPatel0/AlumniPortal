declare module 'heic2any' {
  export default function heic2any(options: {
    blob: Blob;
    toType?: string;
    quality?: number;
    multiple?: boolean;
  }): Promise<Blob | Blob[]>;
}

declare module 'file-type' {
  export function fileTypeFromBuffer(
    buffer: Buffer | Uint8Array | ArrayBuffer
  ): Promise<{ ext: string; mime: string } | undefined>;
}
