"use client";

import { cn } from "@/lib/utils";
import { Loader2, Upload } from "lucide-react";
import { useDropzone } from "react-dropzone";

type ImgBoxProps = {
  onImageSelect: (file: File) => void;
  isUploading: boolean;
};

export const ImgBox = ({ onImageSelect, isUploading }: ImgBoxProps) => {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      "image/*": [],
    },
    onDrop: (acceptedFiles) => {
      if (acceptedFiles?.length > 0) {
        onImageSelect(acceptedFiles[0]);
      }
    },
  });

  return (
    <div
      {...getRootProps()}
      className={cn(
        "border-2 border-dashed rounded-md p-6 transition-colors cursor-pointer flex flex-col items-center justify-center gap-2",
        isDragActive
          ? "border-primary bg-primary/5"
          : "border-border hover:border-muted-foreground",
      )}
    >
      <input {...getInputProps()} />
      {isUploading ? (
        <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
      ) : (
        <Upload className="h-10 w-10 text-muted-foreground" />
      )}
      <div className="text-center space-y-1">
        <p className="text-sm font-medium">
          {isDragActive ? "Drop the image here" : "Drag & drop an image here"}
        </p>
        <p className="text-xs text-muted-foreground">
          or click to select from your files
        </p>
      </div>
    </div>
  );
};
