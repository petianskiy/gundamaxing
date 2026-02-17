import { createRouteHandler } from "uploadthing/next";
import { uploadRouter } from "@/lib/upload/config";

export const { GET, POST } = createRouteHandler({
  router: uploadRouter,
});
