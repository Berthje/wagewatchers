// app/api/[...op]/route.ts
import { createRouteHandler } from '@openpanel/nextjs/server';

export const { GET, POST } = createRouteHandler();