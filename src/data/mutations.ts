import { fal } from "@/lib/fal";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { db } from "@/data/db";
import { queryKeys } from "./queries";
import type { VideoProject } from "./schema";
import type { MediaItem } from "./schema";
import type { MediaType } from "./store";

export const useProjectUpdater = (projectId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (project: Partial<VideoProject>) =>
      db.projects.update(projectId, project),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.project(projectId) });
    },
  });
};

export const useProjectCreator = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (project: Omit<VideoProject, "id">) =>
      db.projects.create(project),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects });
    },
  });
};

type JobCreatorParams = {
  projectId: string;
  endpointId: string;
  mediaType: "video" | "image" | "voiceover" | "music" | "text" | "img2img";
  input: Record<string, any>;
};

export const useJobCreator = ({
  projectId,
  endpointId,
  mediaType,
  input,
}: JobCreatorParams) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (mediaType === "text") {
        return null;
      }

      const { data } = await fal.subscribe(endpointId, {
        input,
        mode: "polling",
        pollInterval: 3000,
      });

      const mediaItem: Omit<MediaItem, "id"> = {
        projectId,
        kind: "generated",
        endpointId,
        requestId: data.request_id,
        mediaType,
        status: "completed",
        createdAt: Date.now(),
        input,
        output: data,
      };

      const mediaId = await db.media.create(mediaItem);
      return mediaId;
    },
    onSuccess: async (mediaId) => {
      if (mediaId) {
        await queryClient.invalidateQueries({
          queryKey: queryKeys.projectMediaItems(projectId),
        });
      }
    },
  });
};
