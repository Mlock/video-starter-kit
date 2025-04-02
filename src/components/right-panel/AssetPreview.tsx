"use client";

import { type GenerateData } from "@/data/store";
import { type InputAsset } from "@/lib/fal";
import { getAssetKey, getAssetType } from "@/lib/utils";

type AssetPreviewProps = {
  data: GenerateData;
  asset: InputAsset;
};

export const AssetPreview = ({ data, asset }: AssetPreviewProps) => {
  const assetType = getAssetType(asset);
  const assetKey = getAssetKey(asset);

  if (!data[assetKey]) return null;

  return (
    <>
      {assetType === "audio" && (
        <audio
          src={
            data[assetKey] && typeof data[assetKey] !== "string"
              ? URL.createObjectURL(data[assetKey])
              : data[assetKey] || ""
          }
          controls={true}
        />
      )}
      {assetType === "video" && (
        <video
          src={
            data[assetKey] && typeof data[assetKey] !== "string"
              ? URL.createObjectURL(data[assetKey])
              : data[assetKey] || ""
          }
          controls={false}
          style={{ pointerEvents: "none" }}
        />
      )}
      {assetType === "image" && (
        <img
          id="image-preview"
          src={
            data[assetKey] && typeof data[assetKey] !== "string"
              ? URL.createObjectURL(data[assetKey])
              : data[assetKey] || ""
          }
          alt="Media Preview"
        />
      )}
      {assetType === "text" && (
        <div className="p-4 text-center">
          <p className="text-lg font-medium">{data[assetKey]}</p>
        </div>
      )}
    </>
  );
};
