import { initEdgeStore } from '@edgestore/server';
import { createEdgeStoreNextHandler } from '@edgestore/server/adapters/next/app';

const es = initEdgeStore.create();

/**
 * This is the main router for the EdgeStore buckets.
 */
const edgeStoreRouter = es.router({
  images: es
    .fileBucket({
      maxSize: 1024 * 1024 * 10, // 10MB max file size
    })
    .beforeDelete(({ ctx, fileInfo }) => {
      // Allow deletion from frontend
      // In a production app, you might want to add authentication checks here
      console.log('Deleting file:', fileInfo.url);
      return true; // Allow deletion
    }),
});

const handler = createEdgeStoreNextHandler({
  router: edgeStoreRouter,
});

export { handler as GET, handler as POST };

/**
 * This type is used to create the type-safe client for the frontend.
 */
export type EdgeStoreRouter = typeof edgeStoreRouter;